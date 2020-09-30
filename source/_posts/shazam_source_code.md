---
title: "小米mysql中间件shaza源码注释"
date: 2020-07-28 10:36:10
tags: [shazam,gaea]
share: true
---


**main.go**

```
//45 init config of shazam proxy
cfg, err := models.ParseProxyConfigFromFile(*configFile)

//57 init manager
mgr, err := server.LoadAndCreateManager(cfg)
```

```
manager.go
//46
mgr, err := CreateManager(cfg, namespaceConfigs)
//154 init namespace
m.namespaces[current] = CreateNamespaceManager(namespaceConfigs)
//422
namespace, err := NewNamespace(config)
```
```
namespace.go
//82 NewNamespace init namespace
func NewNamespace(namespaceConfig *models.Namespace) (*Namespace, error) {
	//151 init router
	namespace.router, err = router.NewRouter(namespaceConfig)
}
```

```
router.go
//29
func NewRouter(namespace *models.Namespace) (*Router, error) {
//63 
rule, err := parseRule(shard)
```

```
rule.go
//310 生成初始化数据subTableIndexs、tableToSlice等
// subTableIndexs 所有子表index，走全表查询时候用到; tableToSlice 根据index获取slice ，再根据 index获取database，或者tableindex获取database
subTableIndexs, tableToSlice, shard, err := parseRuleSliceInfos(cfg)
	//400 判断是mycatmod规则
	case MycatModRuleType:
		subTableIndexs, tableToSlice, err := parseMycatHashRuleSliceInfos(cfg.Locations, cfg.Slices, cfg.Databases)
		//479
		if len(locations) != len(slices) {
			return nil, nil, errors.ErrLocationsCount
		}	
```
<!-- more -->
**server.go**  

```
onConnc //106 处理连接
cc := newSession(s, c) //107 新建一个session,初始化部分字段
Handshark //121 认证 
```
```
session.go
//56
cc.c = NewClientConn(mysql.NewConn(tcpConn), s.manager) //66 每个客户端连接包装成结构体，包含salt加密字段
cc.proxy = s
cc.manager = s.manager
cc.executor = newSessionExecutor(s.manager)

//148 通过握手确定session db、namespace等信息
func (cc *Session) handleHandshakeResponse(info HandshakeResponseInfo) error {//148 
	//设置认证握手时传入的 db 值
	cc.executor.SetDatabase(info.Database)
    //set namespace
    namespace := cc.manager.GetNamespaceByUser(user, password)
    cc.namespace = namespace
    cc.executor.namespace = namespace
} 
```
```
s.tw.Add(s.sessionTimeout, cc, cc.Close) //137 加入时间轮循，超时关闭
cc.Run() //139 
```

**session.go**

```
type Session struct {
	sync.Mutex
	c     *ClientConn
	proxy *Server
	manager *Manager
	namespace string
	executor *SessionExecutor
	closed atomic.Value
}

data, err := cc.c.ReadEphemeralPacket() //226 读客户端发来的文本数据
cc.proxy.tw.Add(cc.proxy.sessionTimeout, cc, cc.Close)  //232 会话超时关闭
rs := cc.executor.ExecuteCommand(cmd, data) //237 执行客户发来的数据
```

**executor.go** (start)

```
// SessionExecutor is bound to a session, so requests are serializable
type SessionExecutor struct {
	manager *Manager

	namespace string
	user      string
	db        string

	status       uint16
	lastInsertID uint64

	collation        mysql.CollationID
	charset          string
	sessionVariables *mysql.SessionVariables

	txConns map[string]*backend.PooledConnection
	txLock  sync.Mutex

	stmtID uint32
	stmts  map[uint32]*Stmt //prepare相关,client端到proxy的stmt

	parser *parser.Parser
}

switch cmd { //256 判断sql是哪种操作类型（见参考#1）
se.handleQuery(sql) //266 如果是查询类型，执行 handleQuery
```

**executor_handle.go** (start)

```
reqCtx := util.NewRequestContext() //62 创建请求上下文
if !ns.IsSQLAllowed(reqCtx, sql)  //65 黑名单检查
```

```
namespace.go

fingerprint := mysql.GetFingerprint(sql) //235 格式化sql，去空格，大小写等
md5 := mysql.GetMd5(fingerprint) //237 返回格式化后的md5 然后比较，是否在黑名单
```

```
stmtType := parser.Preview(sql) //75 预处理 判断 query 是增删改查哪一种 查询返回 StmtSelect（int 0)
reqCtx.Set(util.StmtType, stmtType) //76 类型写入 reqCtx 上下文
r, err = se.doQuery(reqCtx, sql) //78 

if isSQLNotAllowedByUser(se, stmtType) //86 如果是只读用户, 且SQL是INSERT, UPDATE, DELETE, 则拒绝执行, 返回true
if canHandleWithoutPlan(stmtType) //90 判断是否简单sql, 如show,set,begin,use等可以不走执行计划

db := se.db //94 默认为认证时传入的db值，执行use db后，为选择的db

p, err := se.getPlan(se.GetNamespace(), db, sql) //96 获取执行计划

n, err := se.Parse(sql) //155 分析sql返回 ast.StmtNode 重要!

p, err := plan.BuildPlan(n, phyDBs, db, sql, rt, seq) //163 根据ast，物理db，当前db,sql，分片路由，seq 构建 plan
```

**plan.go**

```
//171 BuildPlan build plan for ast
func BuildPlan(stmt ast.StmtNode, phyDBs map[string]string, db, sql string, router *router.Router, seq *sequence.SequenceManager) (Plan, error) {
	//180 NewChecker db为use db中设置的db名. 如果没有执行use db, 则为空字符串
	checker := NewChecker(db, router)
	stmt.Accept(checker)
	if checker.IsDatabaseInvalid() { //检查db是否可用，比如没有选db执行执行sql
		return nil, fmt.Errorf("no database selected") // TODO: return standard MySQL error
	}
	if checker.IsShard() { //187 检查是否走分片，(根据db和table判断是否需要分表) 构建分片执行计划
		return buildShardPlan(stmt, db, sql, router, seq)
	}
	//190 构建不需要分片的执行计划，不需要分片的走 DefaultSlice Node
	return CreateUnshardPlan(stmt, phyDBs, db, checker.GetUnshardTableNames())
}

//126
func (s *Checker) hasShardTableInTableName(n *ast.TableName) bool {
	_, ok := s.router.GetShardRule(db, table)//132 router 根据db和table判断是否需要分表
}
```

```
router.go
rule, ok := r.rules[db][table] //109 返回分片规则
```

```
//193 返回查询类型的 查询计划
func buildShardPlan(stmt ast.StmtNode, db string, sql string, router *router.Router, seq *sequence.SequenceManager) (Plan, error) {
	switch s := stmt.(type) {
	case *ast.SelectStmt:
		plan := NewSelectPlan(db, sql, router) //196 新建查询计划
		if err := HandleSelectStmt(plan, s); err != nil { //197 处理查询计划
			return nil, err
		}
		return plan, nil
}
```

**plan_select.go**

```
//155 处理SelectStmt语法树, 改写其中一些节点, 并获取路由信息和结果聚合函数
func HandleSelectStmt(p *SelectPlan, stmt *ast.SelectStmt) error  

//160 如果这是一个分片表或关联表, 创建一个TableName的装饰器, 并替换原有节点,在此步骤返回所有subTableIndex
handleTableRefs
	//322
	func handleJoin(p *TableAliasStmtInfo, join *ast.Join) error {
	//332
	if err := rewriteTableSource(p, left); err != nil {
	//400
	return rewriteTableNameInTableSource(p, tableSource)
	//433 这是一个分片表或关联表, 创建一个TableName的装饰器, 并替换原有节点
	d, err := CreateTableNameDecorator(tableName, rule, p.GetRouteResult())
//190 
handleWhere
	//370
	has, result, decorator, err := handleComparisonExpr(p.TableAliasStmtInfo, stmt.Where)
	// 576 BinaryOperationExpr结构和json输出的一样
	case *ast.BinaryOperationExpr 
	//637 判断操作符号
	case opcode.EQ, opcode.NE, opcode.GT, opcode.GE, opcode.LT, opcode.LE:
	//700
	if lType == ColumnNameExpr  {
	//873
	func handleBinaryOperationExprCompareLeftColumnRightValue
	//875 根据列判断是否需要装饰ColumnName, 获取对应的rule规则 where payorder.id=refund.pid
	rule, need, isAlias, err := NeedCreateColumnNameExprDecoratorInCondition(p, column)
	//883 创建列装饰器
	decorator := CreateColumnNameExprDecorator(column, rule, isAlias, p.GetRouteResult())
	//896
	tableIndexes, err := findTableIndexes(rule, column.Name.Name.L, v)
	//793 根据规则计算出表index
	index, err := rule.FindTableIndex(v)
	
	//374 把result写入routerResult，覆盖 handleTableRefs 阶段的 subTableIndex
	if has {
		//设置 index 到 RouteResult 也可以在此存入其他值
		p.GetRouteResult().Inter(result)
		
		util.go
		//116 行判断index是否合法
		func interList(l1 []int, l2 []int) []int {
	}

//210 生成sql 返回
sqls, err := generateShardingSQLs(p.stmt, p.result, p.router)
	//504 
    if err := stmt.Restore(ctx); err != nil {
  
```

```
decorator_table_name.go

//78
func (t *TableNameDecorator) Restore(ctx *format.RestoreCtx) error {

//88 如果原sql里带了dbName，mycat需要改写
if t.origin.Schema.String() != "" {
	
//115 如果是 kingshard 类型，重写表名
ctx.WriteName(fmt.Sprintf("%s_%04d", t.origin.Name.String(), tableIndex))
```

```
	//513 根据 index 获取slice dbName
    sliceIndex := rule.GetSliceIndexFromTableIndex(index)
	sliceName := rule.GetSlice(sliceIndex)
	dbName, _ := rule.GetDatabaseNameByTableIndex(index)	
```

**executor_handler.go** (end)

```
//101 判断是否能在从库上执行
if canExecuteFromSlave(se, sql) {
	reqCtx.Set(util.FromSlave, 1)
}
//105 执行执行计划
r, err := p.ExecuteIn(reqCtx, se)
```


```
plan_select.go

//65 ExecuteIn implement Plan
func (s *SelectPlan) ExecuteIn(reqCtx *util.RequestContext, sess Executor) (*mysql.Result, error) {
	sqls := s.GetSQLs()
	rs, err := sess.ExecuteSQLs(reqCtx, sqls) //80 执行sql 
	r, err := MergeSelectResult(s, s.stmt, rs) //85 merge查询结果
}

exector.go

//695
func (se *SessionExecutor) ExecuteSQLs
//707
rs, err := se.executeInMultiSlices(reqCtx, pcs, sqls)
```

```
modifyResultStatus(r, se)
```

**executor.go** (end)

```
return CreateResultResponse(se.status, r) //270
```

**session.go** (end)

```
if err = cc.writeResponse(rs); err != nil  //240
```



**调试技巧**

```
golang解决cannot convert a (type interface {}) to type *: need type assertion

var a interface{} = int(10)
var b MyInt = a.(MyInt)

可以对对象分别使用 Printf("%#v") 和  json.Marshal 输出观察
```



使用tidb生成ast树，改写sql例子
```
package main

import (
	"fmt"
	"strings"

	"github.com/pingcap/parser"
	"github.com/pingcap/parser/ast"
	"github.com/pingcap/parser/format"
	_ "github.com/pingcap/parser/test_driver"
)

//TableNameDecorator test
type TableNameDecorator struct {
	origin *ast.TableName
}

// Restore implement ast.Node
func (t *TableNameDecorator) Restore(ctx *format.RestoreCtx) error {
	ctx.WriteName(t.origin.Name.String() + "_202006")
	return nil
}

// Accept implement ast.Node
// do nothing and return current decorator
func (t *TableNameDecorator) Accept(v ast.Visitor) (ast.Node, bool) {
	return t, true
}

// Text implement ast.Node
func (t *TableNameDecorator) Text() string {
	return t.origin.Text()
}

// SetText implement ast.Node
func (t *TableNameDecorator) SetText(text string) {
	t.origin.SetText(text)
}

func main() {
	//原始sql
	sql := "SELECT /*+ TIDB_SMJ(employees) */ emp_no, first_name, last_name " +
		"FROM employees USE INDEX (last_name) " +
		"where last_name='Aamodt' and gender='F' and birth_date > '1960-01-01'"

	p := parser.New()

	//解析sql成一颗ast树
	oneStmt, err := p.ParseOneStmt(sql, "", "")
	if err != nil {
		fmt.Printf("parse error:\n%v\n%s", err, sql)
		return
	}

	//如果是select查询转换成ast.SelectStmt类型
	var tmp interface{}
	tmp = oneStmt
	var stmt *ast.SelectStmt = tmp.(*ast.SelectStmt)

	tableRefs := stmt.From
	join := tableRefs.TableRefs

	//判断jon.Left节点是否ast.TableSource类型，如果是新建tableName装饰器，替换left.Source节点
	switch left := join.Left.(type) {
	case *ast.TableSource:
		tableName, _ := left.Source.(*ast.TableName)
		d := &TableNameDecorator{tableName}
		left.Source = d
	}

	//创建builder
	sb := &strings.Builder{}
	ctx := format.NewRestoreCtx(269, sb)

	//遍历 ast 树各节点的 Restore 方法组装成sql
	if err := stmt.Restore(ctx); err != nil {
		fmt.Println(err)
	}

	//原始sql
	fmt.Println(sql)
	//输出最后组装的sql
	fmt.Println(sb)

}
```

```
$ cat go.mod 
module tidb

go 1.13

require github.com/pingcap/parser v0.0.0-20200424075042-8222d8b724a4
```





参考：

1. https://dev.mysql.com/doc/internals/en/text-protocol.html
2. https://pingcap.com/docs-cn/stable/sql-statements/sql-statement-select/ 

