---
title: " clickhouse 多分片集群搭建"
date: 2020-08-25 14:44:00
tags: [clickhouse]
share: true
---

ck分布式集群，采用`本地表`、`分布式表` 形式实现。本地表作为分片，分布式表作为数据集合。对于分布式表的插入会随机分配到配置的分片上，查询则会得到所有的数据集合。

本地表采用 Replicated 引擎，实现主备之间的数据同步，可以参考上篇文章 {% post_link clickhouse-ha clickhouse单分片三副本高可用搭建%}，分布表采用 Distributed 引擎。

由于只有3台机器 a001、a002、a003，采用每台机器上起两个服务、一主一备，备服务 `config.xml` 端口配置

```xml
<http_port>8124</http_port>
<tcp_port>9001</tcp_port>
<interserver_http_port>9010</interserver_http_port>
```

`metrika.xml`配置，下面是环形备份，实现一台机器挂了，分布式表查询不受影响

```xml
<yandex>
  <!-- 集群配置 -->
  <clickhouse_remote_servers>
    <!-- 3分片2备份 -->
    <cluster_3shards_2replicas>
      <!-- 数据分片1  -->
      <shard>
        <weight>1</weight>
        <!-- 是否只写入所有replica中的一台，与ZooKeeper配合进行复制 -->
        <internal_replication>true</internal_replication>
        <replica>
          <host>a001</host>
          <port>9000</port>
        </replica>
        <replica>
          <host>a002</host>
          <port>9001</port>
        </replica>
      </shard>
      <!-- 数据分片2  -->
      <shard>
        <weight>1</weight>
        <internal_replication>true</internal_replication>
        <replica>
          <host>a002</host>
          <port>9000</port>
        </replica>
        <replica>
          <host>a003</host>
          <port>9001</port>
        </replica>
      </shard>
      <!-- 数据分片3  -->
      <shard>
        <weight>1</weight>
        <internal_replication>true</internal_replication>
        <replica>
          <host>a003</host>
          <port>9000</port>
        </replica>
        <replica>
          <host>a001</host>
          <port>9001</port>
        </replica>
      </shard>
    </cluster_3shards_2replicas>
    <!-- 1分片3备份 -->
    <cluster_1shards_3replicas>
      <!-- 数据分片1  -->
      <shard>
        <internal_replication>true</internal_replication>
        <replica>
          <host>a001</host>
          <port>9000</port>
        </replica>
        <replica>
          <host>a002</host>
          <port>9000</port>
        </replica>
        <replica>
          <host>a003</host>
          <port>9000</port>
        </replica>
      </shard>
    </cluster_1shards_3replicas>
  </clickhouse_remote_servers>
  <zookeeper-servers>
    <node index="1">
      <host>10.2.4.34</host>
      <port>2181</port>
    </node>
    <node index="2">
      <host>10.2.4.35</host>
      <port>2181</port>
    </node>
    <node index="3">
      <host>10.2.4.36</host>
      <port>2181</port>
    </node>
  </zookeeper-servers>
  <macros> <!--a001作为第3分片备份a003-->
    <layer>01</layer>
    <shard>03</shard>
    <replica>cluster01-03-a001</replica>
  </macros>
</yandex>
```
<!-- more -->

**备服务启动脚本**

```sh
# cat d_clickhouse2.sh
docker run -d \
        --network=host \
        -v /root/clickhouse2/conf/config.xml:/etc/clickhouse-server/config.xml \
        -v /root/clickhouse2/conf/metrika.xml:/etc/clickhouse-server/metrika.xml \
        -v /root/clickhouse2/data:/var/lib/clickhouse \
        -v /root/clickhouse2/log:/var/log/clickhouse-server/ \
        --name clickhouse2 \
        yandex/clickhouse-server:19.14
```

**查看集群**
```
SELECT *
FROM system.clusters

┌─cluster───────────────────────────┬─shard_num─┬─shard_weight─┬─replica_num─┬─host_name─┬─host_address─┬─port─┬─is_local─┬─user────┬─default_database─┐
│ cluster_1shards_3replicas         │         1 │            1 │           1 │ a001      │ 10.2.4.34    │ 9000 │        1 │ default │                  │
│ cluster_1shards_3replicas         │         1 │            1 │           2 │ a002      │ 10.2.4.35    │ 9000 │        1 │ default │                  │
│ cluster_1shards_3replicas         │         1 │            1 │           3 │ a003      │ 10.2.4.36    │ 9000 │        1 │ default │                  │
│ cluster_3shards_2replicas         │         1 │            1 │           1 │ a001      │ 10.2.4.34    │ 9000 │        1 │ default │                  │
│ cluster_3shards_2replicas         │         1 │            1 │           2 │ a002      │ 10.2.4.35    │ 9001 │        1 │ default │                  │
│ cluster_3shards_2replicas         │         2 │            1 │           1 │ a002      │ 10.2.4.35    │ 9000 │        0 │ default │                  │
│ cluster_3shards_2replicas         │         2 │            1 │           2 │ a003      │ 10.2.4.36    │ 9001 │        0 │ default │                  │
│ cluster_3shards_2replicas         │         3 │            1 │           1 │ a003      │ 10.2.4.36    │ 9000 │        0 │ default │                  │
│ cluster_3shards_2replicas         │         3 │            1 │           2 │ a001      │ 10.2.4.34    │ 9001 │        0 │ default │                  │
└───────────────────────────────────┴───────────┴──────────────┴─────────────┴───────────┴──────────────┴──────┴──────────┴─────────┴──────────────────┘
```

**创建多分片本地表**

```sql
CREATE TABLE IF NOT EXISTS default.user_local ON CLUSTER 'cluster_3shards_2replicas' (
  ts_date DateTime DEFAULT now(),
  user_id Int64
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/default/user_local','{replica}')
PARTITION BY toYYYYMMDD(ts_date)
ORDER BY (ts_date)
SETTINGS index_granularity = 8192;

---删除本地表
DROP TABLE default.events_local ON CLUSTER 'cluster_3shards_2replicas';
```

**创建分布式表**

```sql
CREATE TABLE IF NOT EXISTS default.user_all ON CLUSTER cluster_3shards_2replicas
AS default.user_local
ENGINE = Distributed(cluster_3shards_2replicas,default,user_local,rand());

---插入数据
INSERT INTO user_all (user_id) values(888);

---更新
ALTER TABLE user_local ON CLUSTER cluster_3shards_2replicas UPDATE user_id = '2' WHERE user_id = '1'
```

**创建单分片表**
```sql
CREATE TABLE IF NOT EXISTS soa.user_behavior ON CLUSTER cluster_1shards_3replicas
(
    `date` Date DEFAULT today(),
    `datetime` DateTime DEFAULT now(),
    `user` String,
    `service` String,
    `operation` String,
    `content` String,
    `extra` String,
    `op_time` DateTime
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-01/user_behavior', '{replica}')
PARTITION BY date
ORDER BY (date, user, intHash64(datetime))
SAMPLE BY intHash64(datetime)
SETTINGS index_granularity = 8192
```

**删除表** （先删除 zookeeper 目录，再删除 clickhouse 硬盘文件）

```
/clickhouse/tables/ # zk
/var/lib/clickhouse/data/data/default/ 
/var/lib/clickhouse/data/metadata/default/*.sql
DROP TABLE user_local
DETACH TABLE user_local
```

**客户端连接备服务**

```
clickhouse-client -m --port 9001
```

**测试**

- 在 a001 本地表`user_local`插入数据，会自动通过到 a002 备服务本地表

- 在分布式表`user_all`插入数据，会分配到不同的分片上

- 停掉 a001 上的两个clickhouse 服务，查询user_all正常



### 实操

```sql
--- 创建数据库
CREATE DATABASE IF NOT EXISTS biw ON CLUSTER cluster_3shards_2replicas

--- 本地复制表
CREATE TABLE IF NOT EXISTS biw.stock_warehouse_receipt_local ON CLUSTER cluster_3shards_2replicas
(
    `op_receipt_id` Int64,
    `ware_trans_id` String,
    `ware_id` Nullable(Int64),
    `inventory_type` Nullable(String),
    `sku_id` Nullable(Int32),
    `sku_lot` Nullable(Int64),
    `op_type` Nullable(Int16),
    `origin_code` Nullable(String),
    `origin_receipt_type` Nullable(Int16),
    `ower_id` Nullable(Int16),
    `quantity` Nullable(Int32),
    `origin_num` Nullable(Int32),
    `left_num` Nullable(Int32),
    `src_system` Nullable(String),
    `product_date` Nullable(Int32),
    `shelf_life_days` Nullable(Int16),
    `expire_date` Nullable(Int32),
    `op_date` Nullable(Int32),
    `bill_id` Nullable(Int64),
    `bill_code` Nullable(String),
    `receipt_type` Nullable(Int32),
    `operator` Nullable(Int64),
    `operator_name` Nullable(String),
    `create_date` Int32,
    `frozen_flag` Nullable(Int8)
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/stock_warehouse_receipt', '{replica}')
PARTITION BY toYYYYMMDD(toDateTime(create_date))
ORDER BY create_date
SETTINGS index_granularity = 8192

--- 分布式表
CREATE TABLE IF NOT EXISTS biw.stock_warehouse_receipt_all ON CLUSTER cluster_3shards_2replicas AS biw.stock_warehouse_receipt_local
ENGINE = Distributed(cluster_3shards_2replicas, biw, stock_warehouse_receipt_local, rand())

--- 插入数据
INSERT INTO biw.stock_warehouse_receipt_all SELECT *
FROM url('http://10.0.10.16:8123/?database=default&query=select%20*%20from%20stock_warehouse_receipt&user=default&password=******', TabSeparated, '`op_receipt_id` Int64, `ware_trans_id` String, `ware_id` Nullable(Int64), `inventory_type` Nullable(String), `sku_id` Nullable(Int32), `sku_lot` Nullable(Int64), `op_type` Nullable(Int16), `origin_code` Nullable(String), `origin_receipt_type` Nullable(Int16), `ower_id` Nullable(Int16), `quantity` Nullable(Int32), `origin_num` Nullable(Int32), `left_num` Nullable(Int32), `src_system` Nullable(String), `product_date` Nullable(Int32), `shelf_life_days` Nullable(Int16), `expire_date` Nullable(Int32), `op_date` Nullable(Int32), `bill_id` Nullable(Int64), `bill_code` Nullable(String), `receipt_type` Nullable(Int32), `operator` Nullable(Int64), `operator_name` Nullable(String),`create_date` Int32, `frozen_flag` Nullable(Int8)')
```

其中一台机器`stock_warehouse_receipt_local`数据，和`stock_warehouse_receipt_all`表数据

```mysql
SELECT count() AS cnt
FROM biw.stock_warehouse_receipt_local
UNION ALL
SELECT count()
FROM biw.stock_warehouse_receipt_all

┌──────cnt─┐
│ 92452812 │
└──────────┘
┌───────cnt─┐
│ 277354174 │
└───────────┘

2 rows in set. Elapsed: 0.080 sec. Processed 369.81 million rows, 1.11 GB (4.65 billion rows/s., 13.95 GB/s.)
```

分组查询速度对比:

![单表](/img/clickhouse/4.png)

![分布式表](/img/clickhouse/5.png)


按条件查询对比:

![单表](/img/clickhouse/6.png)

![分布式表](/img/clickhouse/7.png)

可以看出分布式表查询速度明显优于单表查询。


参考：

[ClickHouse高可用集群的安装与部署](https://www.jianshu.com/p/78271ba9969b)

[ClickHouse复制表、分布式表机制与使用方法](https://www.jianshu.com/p/ab811cceb856)

[用Docker快速上手Clickhouse](http://sineyuan.github.io/post/clickhouse-docker-quick-start/)