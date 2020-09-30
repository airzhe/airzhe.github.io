---
title: "小米mysql中间件shaza源码注释"
date: 2020-07-28 10:36:10
tags: [shazam,gaea]
share: true
---


```
CREATE TABLE `tbl_ks_201409` (
  `id` int(11) DEFAULT NULL,
  `create_time` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

test_namespace_shard.json
```
{
    "name": "test_namespace_shard",
    "online": true,
    "read_only": false,
    "allowed_dbs": {
        "soa-test": true
    },
    "default_phy_dbs": {},
    "slow_sql_time": "1000",
    "black_sql": [],
    "allowed_ip": [],
    "slices": [
        {
            "name": "slice-0",
            "user_name": "dev_w",
            "password": "devw@123",
            "master": "172.16.200.40:3306",
            "slaves": [],
            "statistic_slaves": [],
            "capacity": 12,
            "max_capacity": 24,
            "idle_timeout": 60
        }
    ],
    "shard_rules": [
        {
            "db": "soa-test",
            "table": "tbl_ks",
            "type": "date_month",
            "key": "create_time",
            "slices": [
                "slice-0"
            ],
            "date_range": [
                "201408-201409"
            ]
        }
    ],
    "users": [
        {
            "user_name": "front_user_shard1",
            "password": "front_password_shard1",
            "namespace": "test_namespace_shard",
            "rw_flag": 2,
            "rw_split": 1,
            "other_property": 0
        },
        {
            "user_name": "front_user_shard2",
            "password": "front_password_shard2",
            "namespace": "test_namespace_shard",
            "rw_flag": 2,
            "rw_split": 0,
            "other_property": 0
        }
    ],
    "default_slice": "slice-0",
    "global_sequences": []
}
```

```
mysql> insert into tbl_ks (id,create_time) values (3,'2014-08-02 12:12:00');
Query OK, 1 row affected (0.06 sec)

mysql> insert into tbl_ks_month (id,create_time) values (3,'2014-09-01 12:12:00');                                                ERROR 1105 (HY000): unknown error: execute in InsertPlan error: ERROR 1146 (42S02): Table 'soa-test.tbl_ks_month_201409' doesn't exist

mysql> insert into tbl_ks (id,create_time) values (3,'2015-08-02 12:12:00');
ERROR 1105 (HY000): unknown error: get plan error, db: soa-test, sql: insert into tbl_ks (id,create_time) values (3,'2015-08-02 12:12:00'), err: create select plan error: handleInsertValues error: batch insert has cross slice values or no route found

mysql> select * from tbl_ks where id =3;
```



n, err := se.Parse(sql) 

#115行 构建ast树





**slice.go**

```
ParseMaster 153 行
```

**plan.go**

```
generateShardingSQLs 498行

stmt.Restore(ctx) 生成sql
```

**rule.go**

```
IsMycatShardingRule(ruleType string) bool {} 647行

func (r *BaseRule) GetDatabaseNameByTableIndex(index int) (string, error) {} 180行
```

**router.go**

```
rule, err := parseRule(shard) #解析router 29行
```

**plan_select.go**

```
tableIndexes, err := findTableIndexes(rule, column.Name.Name.L, v) 返回表tabIndex

sqls, err := generateShardingSQLs(p.stmt, p.result, p.router) #生成最终的查询
```

**parse/ast/dml.go**

```
func (n *SelectStmt) Restore(ctx *format.RestoreCtx) error {} 772行 生成sql语句

if err := n.From.Restore(ctx); err != nil {} 813行 生成表明
```



**dml.go**

```
func (n *TableSource) Restore(ctx *format.RestoreCtx) error {} 387行  
```
**proxy/plan/decorator_table_name.go**

```
ctx.WriteName(fmt.Sprintf("%s_%04d", t.origin.Name.String(), tableIndex)) //79行
```



%04d表示在输出一个小于4位的数值时，将在前面补0 使其总宽度 为4位



```
/proxy/router/rule.go

GetSliceIndexFromTableIndex
+       if r.ruleType == ShtPaymentOrderRuleType {
+               sliceIndex := r.GetSliceIndexFromTableIndex(index)
+               return r.mycatDatabases[sliceIndex], nil
+       }

+		if IsMycatShardingRule(cfg.Type) || cfg.Type == ShtPaymentOrderRuleType {
```






