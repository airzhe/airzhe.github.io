---
title: "clickhouse单分片三副本高可用搭建"
date: 2020-06-30 12:06:00
tags: [clickhouse 高可用]
share: true
---

3台机器，分别起3个 clickhosue 和 zookeeper 搭建一分片三副本高可用集群。

用到镜像`yandex/clickhouse-server:19.15.3.6`，`zookeeper`

**zookeeper 配置**

zoo.cfg 增加server列表

```
[root@node-a002 zookeeper]# cat zoo.cfg
dataDir=/data
dataLogDir=/datalog
tickTime=2000
initLimit=5
syncLimit=2
autopurge.snapRetainCount=3
autopurge.purgeInterval=0
maxClientCnxns=60
standaloneEnabled=true
admin.enableServer=true
server.1=10.2.4.14:2888:3888;2181
server.2=10.2.4.15:2888:3888;2181
server.3=10.2.4.16:2888:3888;2181
```

同时 data 目录下 myid 内容对应配置里的id编号

```
[root@node-a002 zookeeper]# cat data/myid
1
```

启动 zookeeper 

```
[root@node-a002 ~]# cat sh/d_zookeeper.sh
docker run -d \
        --network host \
        -v /root/zookeeper/data:/data \
        -v /root/zookeeper/zoo.cfg:/conf/zoo.cfg \
        --name zookeeper \
        --restart="always" \
        zookeeper
```

**clickhouse 配置**

添加 `metrika.xml` 文件: 配置3个zookeeper，replica 处表示01集群、01分片、a001备份

```
[root@node-a002 clickhouse]# cat conf/metrika.xml
<yandex>
    <zookeeper-servers>
        <node index="1">
            <host>10.2.4.14</host>
            <port>2181</port>
        </node>
        <node index="2">
            <host>10.2.4.15</host>
            <port>2181</port>
        </node>
        <node index="3">
            <host>10.2.4.16</host>
            <port>2181</port>
        </node>
    </zookeeper-servers>

    <macros>
        <layer>01</layer>
        <shard>01</shard>
        <replica>cluster01-01-a002</replica>
    </macros>
</yandex>
```

`config.xml` 引入 `metrika.xml`

```
[root@node-a002 clickhouse]# cat conf/config.xml -n | grep 'metrika.xml'
461      <include_from>/etc/clickhouse-server/metrika.xml</include_from>
```

启动 clickhouse 

```
[root@node-a002 sh]# cat d_clickhouse.sh
docker run -d \
        --network=host \
        -v /root/clickhouse/conf/config.xml:/etc/clickhouse-server/config.xml \
        -v /root/clickhouse/conf/metrika.xml:/etc/clickhouse-server/metrika.xml \
        -v /root/clickhouse/conf/users.xml:/etc/clickhouse-server/users.xml \
        -v /root/clickhouse/data:/var/lib/clickhouse \
        -v /root/clickhouse/log:/var/log/clickhouse-server/ \
        --name clickhouse \
        yandex/clickhouse-server:19.14
```

**写数据**

三分片分别创建`ReplicatedMergeTree`引擎表

```
CREATE TABLE test
(
    `id` Int64,
    `created_date` DateTime
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/test', '{replica}')
PARTITION BY toYYYYMMDD(created_date)
ORDER BY id
SETTINGS index_granularity = 8192
```

插入数据：

```
insert into test values(1,'2020 06 28 14:00:00') ;
```

到其他两台备份上分别查看数据是否同步 ✓

停掉某一台 zookeeper 数据库是否能正常访问 ✓


**其他表引擎**

自动数据备份，是表的行为，ReplicatedXXX的表支持自动同步。

Replicated前缀只用于MergeTree系列（MergeTree是最常用的引擎），即clickhouse支持以下几种自动备份的引擎：
```
ReplicatedMergeTree
ReplicatedSummingMergeTree
ReplicatedReplacingMergeTree
ReplicatedAggregatingMergeTree
ReplicatedCollapsingMergeTree
ReplicatedGraphiteMergeTree
```

**参考：**

{% post_link clickhouse clickhouse入门操作%}

[zookeeper集群启动报错](https://blog.csdn.net/qq_33142257/article/details/79836645)

[Clickhouse集群应用、分片、复制](https://blog.csdn.net/linglingma9087/article/details/84666581)

[添加帐号密码](https://www.jianshu.com/p/e339336e7bb9)