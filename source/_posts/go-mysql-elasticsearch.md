---
title: "go-mysql-elasticsearch 源码解读"
date: 2020-12-23 21:03:01
tags: [go-mysql-elasticsearch,中间件]
share: true
---



项目中使用到了 go-mysql-elasticsearch 来做mysql和es的数据同步，所以花些时间了解下源码。

中间件主要用到了 `github.com/siddontang/go-mysql/canal` 这个包来实现 binlog 的处理 

**canal示例**

```go
cfg := canal.NewDefaultConfig()
cfg.Addr = "172.16.30.127:3308"
cfg.User = "root"

cfg.Password = "admin"

//只同步test库canal_test表
cfg.IncludeTableRegex = make([]string, 1)
cfg.IncludeTableRegex[0] = "test\\.canal_test"

c, _ := canal.NewCanal(cfg)

type MyEventHandler struct {
	DummyEventHandler
}

func (h *MyEventHandler) OnRow(e *RowsEvent) error {
	log.Infof("%s %v\n", e.Action, e.Rows)
	return nil
}

func (h *MyEventHandler) String() string {
	return "MyEventHandler"
}

// Register a handler to handle RowsEvent
c.SetEventHandler(&MyEventHandler{})
c.RunFrom(mysql.Position{"mysql_bin.000001", 0})
```

**Rule**

根据配置文件的规则，go-mysql-elasticsearch 把mysql 数据组装成 es 格式数据写入es，规则支持:

1.  同步test库t表到 index:test type:t
2.  同步test库t_[0-9]{4}表到 index:test type:t
3. 同步test库tfield表到 index:test type:tfield 字段映射: id:"es_id",tags:"es_tags,list",keywords:",list"
4. 同步test库tfilter表到 index:test type:tfilter 只同步 id、 name 列
5. 同步test库tid_[0-9]{4}表到 index:test type:t id由原表的 id + tag 生成

<!-- more -->


**服务启动流程**

![流程图](/img/2020/flowchart.png)



这里主要介绍下配置文件、创建River 及 river.Run部分



**配置文件** 

```go
& river.Config {
    MyAddr: "127.0.0.1:3306", //mysql地址
    MyUser: "root",
    MyPassword: "",
    MyCharset: "utf8",
    ESHttps: false,
    ESAddr: "127.0.0.1:9200",
    ESUser: "",
    ESPassword: "",
    StatAddr: "127.0.0.1:12800", //prometheus metrics地址
    StatPath: "/metrics",
    ServerID: 0x3e9, //mysql server_id
    Flavor: "mysql",
    DataDir: "./var", //数据存储路径，用来存储binlog positon信息
    DumpExec: "mysqldump", 
    SkipMasterData: false, 
    Sources: [] river.SourceConfig { //数据源
        river.SourceConfig {
            Schema: "test",
            Tables: [] string {
                "t",
                "t_[0-9]{4}",
                "tfield",
                "tfilter"
            }
        }
    },
    Rules: [] * river.Rule { ( * river.Rule)(0xc00034e000), //rule规则
        ( * river.Rule)(0xc00034e140),
        ( * river.Rule)(0xc00034e280),
        ( * river.Rule)(0xc00034e3c0),
        ( * river.Rule)(0xc00034e500)
    },
    BulkSize: 128, //es 批量执行大小
    FlushBulkTime: river.TomlDuration { 
        Duration: 200000000 //多久刷一次切片里的数据到es
    },
    SkipNoPkTable: false //跳过没有主键的表
}
```

```go
& river.Rule {
    Schema: "test", //mysql Schema
    Table: "canal_test", //mysql 表名
    Index: "test", //对应的es index
    Type: "canal_test", //对应的 es type
    Parent: "", //设置es parent
    ID: [] string(nil), //id 由哪些字段组成
    FieldMapping: map[string] string {}, //字段映射
    TableInfo: ( * schema.Table)(nil),
    Filter: [] string(nil), //过滤那些字段
    Pipeline: "" //es Pipeline
}
```



**NewRiver**

```go
//初始化syncCh,通过这个channel来和esClient做数据交换，及保存binlog postion
r.syncCh = make(chan interface{}, 4096)

//初始化ctx cancel
r.ctx, r.cancel = context.WithCancel(context.Background())

//从配置的目录加载master数据，主要包含 bin_name 、bin_pos、filePath 、lastSaveTime
if r.master, err = loadMasterInfo(c.DataDir); err != nil {
	return nil, errors.Trace(err)
}

//创建canal
if err = r.newCanal(); err != nil {
	return nil, errors.Trace(err)
}

//预处理rule, 生成格式: r.rules["schema:table"] = rule{}
if err = r.prepareRule(); err != nil {
	return nil, errors.Trace(err)
}

//准备canal,设置事件处理handle
if err = r.prepareCanal(); err != nil {
	return nil, errors.Trace(err)
}

//设置esClient
r.es = elastic.NewClient(cfg)

//初始化 prometheus 指标
go InitStatus(r.c.StatAddr, r.c.StatPath)
```

newCanal

```go
cfg := canal.NewDefaultConfig()
cfg.Addr = r.c.MyAddr
cfg.User = r.c.MyUser
cfg.Password = r.c.MyPassword
cfg.Charset = r.c.MyCharset
//flavor is mysql or mariadb
cfg.Flavor = r.c.Flavor

//
cfg.ServerID = r.c.ServerID
cfg.Dump.ExecutionPath = r.c.DumpExec
cfg.Dump.DiscardErr = false
cfg.Dump.SkipMasterData = r.c.SkipMasterData

//设置来自Sources字段的正则过滤 db+table
for _, s := range r.c.Sources {
  for _, t := range s.Tables {
    cfg.IncludeTableRegex = append(cfg.IncludeTableRegex, s.Schema+"\\."+t)
  }
}
```

prepareRule

```go
//返回通配符对应的表 如 {"test:t_[0-9]{4}":["t_0000","t_1002"]} 
//创建默认rule如: r.rules["schema:table"] = newDefaultRule(schema, table)
wildtables, err := r.parseSource()

//根据配置文件里配置的rule覆盖默认rule里的字段
if regexp.QuoteMeta(rule.Table) != rule.Table {
  //判断rule规则的db+table是否配置了source属性
  tables, ok := wildtables[ruleKey(rule.Schema, rule.Table)]
  if !ok {
    return errors.Errorf("wildcard table for %s.%s is not defined in source", rule.Schema, rule.Table)
  }
  //index不能为空
  if len(rule.Index) == 0 {
    return errors.Errorf("wildcard table rule %s.%s must have a index, can not empty", rule.Schema, rule.Table)
  }
  //规则准备，比如index、type转小写，初始化FieldMapping
  rule.prepare()

  //遍历通过db正则查询的表，根据配置实例化单个rule规则, 没有设置 Filter，PipeLine
  for _, table := range tables {
    rr := r.rules[ruleKey(rule.Schema, table)]
    rr.Index = rule.Index
    rr.Type = rule.Type
    rr.Parent = rule.Parent
    rr.ID = rule.ID
    rr.FieldMapping = rule.FieldMapping
  }
} else {
  key := ruleKey(rule.Schema, rule.Table)
  if _, ok := r.rules[key]; !ok {
    return errors.Errorf("rule %s, %s not defined in source", rule.Schema, rule.Table)
  }
  rule.prepare()
  //使用当前rule替换newDefaultRule
  r.rules[key] = rule
}


rules := make(map[string]*Rule)
for key, rule := range r.rules {
  //获得rule.TableInfo
  if rule.TableInfo, err = r.canal.GetTable(rule.Schema, rule.Table); err != nil {
    return errors.Trace(err)
  }
  //检查表是否符合rule规则
}
//
r.rules = rules
```

prepareCanal

```go
//SetEventHandler
r.canal.SetEventHandler(&eventHandler{r})
```



**river.Run**

```go
//for循环处理同步业务
go r.syncLoop()

//获取master的binlog同步数据
pos := r.master.Position()

//通过RunFrom启动canal服务
if err := r.canal.RunFrom(pos); err != nil {
	log.Errorf("start canal err %v", err)
	canalSyncState.Set(0)
	return errors.Trace(err)
}
```



r.syncLoop

```go
bulkSize := r.c.BulkSize

for {
  needFlush := false
  needSavePos := false
  
  select {
  //断言判断 syncCh 通道数据类型
  case v := <-r.syncCh:
    switch v := v.(type) {
    case posSaver:
      now := time.Now()
      //有强制执行标记或者上次保存时间距当前时间3秒以上触发
      if v.force || now.Sub(lastSavedTime) > 3*time.Second {
        //更新上次保存时间,及是否需要刷新、保存标记
        lastSavedTime = now
        needFlush = true
        needSavePos = true
        pos = v.pos
      }
    case []*elastic.BulkRequest:
      //追加到reqs切片
      reqs = append(reqs, v...)
      //根据切片长度是否大于buldSize设置needFlush标记
      needFlush = len(reqs) >= bulkSize
    }
  case <-ticker.C:
    //定时设置needFlush标记为true，处理es请求
    needFlush = true
  case <-r.ctx.Done():
    //跳出循环，返回
    return
  }

  if needFlush {
    //doBulk调用esClient批量处理这些请求数据，到此数据处理完毕
    if err := r.doBulk(reqs); err != nil {
      log.Errorf("do ES bulk err %v, close sync", err)
      //出错执行r.cancel()
      r.cancel()
      return
    }
    //重置reqs切片为空
    reqs = reqs[0:0]
  }

  //保存pos点
  if needSavePos {
    if err := r.master.Save(pos); err != nil {
      log.Errorf("save sync position %s err %v, close sync", pos, err)
      r.cancel()
      return
    }
  }
}
```



eventHandler.OnRow

```go
//根据db+host获取对应的rule
rule, ok := h.r.rules[ruleKey(e.Table.Schema, e.Table.Name)]
if !ok {
  return nil
}

var reqs []*elastic.BulkRequest
var err error
switch e.Action {
case canal.InsertAction:
  //创建插入请求
  reqs, err = h.r.makeInsertRequest(rule, e.Rows)
case canal.DeleteAction:
  //创建删除请求
  reqs, err = h.r.makeDeleteRequest(rule, e.Rows)
case canal.UpdateAction:
  //创建更新请求
  reqs, err = h.r.makeUpdateRequest(rule, e.Rows)
default:
  err = errors.Errorf("invalid rows action %s", e.Action)
}

if err != nil {
  //如果有错误,执行context.CancelFunc
  h.r.cancel()
  return errors.Errorf("make %s ES request err %v, close sync", e.Action, err)
}

h.r.syncCh <- reqs
```



makeInsertRequest && makeDeleteRequest 

```go
req := &elastic.BulkRequest{Index: rule.Index, Type: rule.Type, ID: id, Parent: parentID, Pipeline: rule.Pipeline}
//如果是insert请求调用 makeInsertReqData 组装出data数据
for i, c := range rule.TableInfo.Columns {
    if !rule.CheckFilter(c.Name) {
      //跳过过滤的字段
      continue
    }
    mapped := false
    for k, v := range rule.FieldMapping {
      //字段名称映射
      mysql, elastic, fieldType := r.getFieldParts(k, v)
      if mysql == c.Name {
        mapped = true
        //字段value转换，如转数组、日期时间，或者执行makeReqColumnData(&c, values[i])获取value值
        req.Data[elastic] = r.getFieldValue(&c, fieldType, values[i])
        }
    }
    if mapped == false {
        //makeReqColumnData 直接根据列、和value接口获取转换后的值
        req.Data[c.Name] = r.makeReqColumnData(&c, values[i])
    }
}
```



makeUpdateRequest

```go
req := &elastic.BulkRequest{Index: rule.Index, Type: rule.Type, ID: beforeID, Parent: beforeParentID}
//如果更新了主键值，则是一次插入删除操作

//如果是update请求调用 makeUpdateReqData 组装出data数据、
beforeValues []interface{}, afterValues []interface{}) {
req.Data = make(map[string]interface{}, len(beforeValues))

// maybe dangerous if something wrong delete before?
req.Action = elastic.ActionUpdate

for i, c := range rule.TableInfo.Columns {
  mapped := false
  if !rule.CheckFilter(c.Name) {
    continue
  }
  //比较更新前后数据是否相同，如果相同跳过
  if reflect.DeepEqual(beforeValues[i], afterValues[i]) {
    //nothing changed
    continue
  }
  //生成请求数据
  for k, v := range rule.FieldMapping {
    mysql, elastic, fieldType := r.getFieldParts(k, v)
    if mysql == c.Name {
      mapped = true
      req.Data[elastic] = r.getFieldValue(&c, fieldType, afterValues[i])
    }
  }
  if mapped == false {
    req.Data[c.Name] = r.makeReqColumnData(&c, afterValues[i])
  }
}
```





**关闭服务**

```go
log.Infof("closing river")
r.cancel()
r.canal.Close()
r.master.Close()
//当等待组计数器不等于 0 时阻塞，直到变 0
//syncLoop()方法 defer 处执行 r.wg.Done()
r.wg.Wait()
```




完整版代码注释链接:

https://github.com/airzhe/go-mysql-elasticsearch


参考：

[MySQL binlog格式解析](https://www.jianshu.com/p/c16686b35807)
