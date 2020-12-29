---
title: "ClickHouse 入门笔记"
date: 2019-12-16 14:22:10
tags: [clickhouse,OLAP]
share: true
---

ClickHouse是一个用于联机分析(OLAP)的列式数据库管理系统(DBMS)

**版本**

文章使用版本 `docker pull yandex/clickhouse-server:19.15.3.6`

**SQL支持**

支持的查询包括 GROUP BY，ORDER BY，IN，JOIN以及非相关子查询。 不支持窗口函数和相关子查询。

**支持近似计算**

用于近似计算的各类聚合函数，如：distinct values, medians(中位数), quantiles(分位数)

**吞吐量**

ClickHouse可以在单个服务器上每秒处理数百个查询（在最佳的情况下最多可以处理数千个），建议每秒最多查询100次。有一种流行的观点认为，想要有效的计算统计数据，必须要聚合数据，因为聚合将降低数据量。

**访问控制**

ClickHouse包含访问控制配置，它们位于`users.xml`文件中(与'config.xml'同目录)。 默认情况下，允许从任何地方使用默认的‘default’用户无密码的访问ClickHouse。

默认情况下它使用‘default’用户无密码的与localhost:9000服务建立连接。 客户端也可以用于连接远程服务，例如：`clickhouse-client --host=example.com`

**时区设置**

```
sed "144 i<timezone>Asia/Shanghai</timezone>" -i /etc/clickhouse-server/config.xml
```
<!-- more -->

**交互方式**

客户端可以选择使用交互式与非交互式两种


```
CREATE TABLE test (
         created_date Date DEFAULT today(),  
         created_at DateTime DEFAULT now(), 
        `id` UInt16,
        `name` String
) ENGINE = MergeTree(created_date, created_at, 8192);


cat <<_EOF | clickhouse-client --database=default --query="INSERT INTO test FORMAT CSV";
'2016-08-14','2016-08-14 00:00:00',3, 'some text',
'2016-08-14','2016-08-14 00:00:01',4, 'some text'
_EOF
```

可以指定 `\G` 来替代分号或者在分号后面，这表示 `Vertical` 的格式。在这种格式下，每一个值都会打印在不同的行中，这种方式对于宽表来说很方便。这个不常见的特性是为了兼容 MySQL 命令而加的。

**命令行参数**

https://clickhouse.yandex/docs/zh/interfaces/cli/#ming-ling-xing-can-shu

**输入输出格式**

支持 json、csv 等多种格式 https://clickhouse.yandex/docs/zh/interfaces/formats/

**mysql 引擎**

```
CREATE DATABASE mysql_db ENGINE = MySQL('172.16.200.10:3306', 'test', 'root', 'passwd')
```

**mergeTree 引擎**

使用新的ClickHouse自定义分区，不需要创建单独的日期列即可将MySQL中的表映射到ClickHouse中的相​​同表结构

```
CREATE TABLE wikistat
(
    id bigint,
    dt DateTime,
    project String,
    subproject String,
    path String,
    hits UInt64,
    size UInt64
)
ENGINE = MergeTree
PARTITION BY toYYYYMMDD(dt)
ORDER BY dt
```

**ReplacingMergeTree 引擎** (按主键进行合并)
```
CREATE TABLE mergetree
(
    `msg_id` UInt64,
    `msg_type` String,
    `sync_time` DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree 
PARTITION BY toYYYYMMDD(sync_time)
ORDER BY msg_id;
# 插入数据
insert into mergetree(msg_id,msg_type) values(1,'aa') ;
# 强制合并
optimize table mergetree final;
```

**SummingMergeTree** (按主键合并，SummingMergeTree(a) a求和)
```
CREATE TABLE smt_tab(date Date,id UInt8,name String,a UInt16) ENGINE=SummingMergeTree(a) PARTITION BY date ORDER BY (id,name) SAMPLE BY name
#插入数据
insert into smt_tab (date,id,name,a) values ('2019-12-12',1,'Jason',1)
insert into smt_tab (date,id,name,a) values ('2019-12-12',1,'Jason',2)
insert into smt_tab (date,id,name,a) values ('2019-12-12',1,'Jason',3)
#结果只有一条，a列求和
```

**JSON 函数**

```
#pay_data 是否有 appId 下标
select visitParamHas(pay_data,'appId') from `order` limit 1;
#获取appId值
select visitParamExtractRaw(pay_data,'appId') from `order` limit 1;
#获取值
SELECT visitParamExtractString(return_data, 'body') FROM order_behavior_log LIMIT 10;
```

https://clickhouse.yandex/docs/zh/query_language/functions/json_functions/

**数据备份**

```
clickhouse-client -d default --query="show create table ontime"
clickhouse-client -d default -f CSV --query="select * from ontime limit 1" >/var/lib/clickhouse/a.csv
```

**使用 mysql 和 clickhouse mysql 引擎，以及 clickhouse 直接查询对比:**
![1.png](/img/clickhouse/1.png)

存档到ClickHouse允许您保留旧数据并将其用于报告


**LowCardinality 类型** （对字符串做数字字典）

城市名称相对较短，航班号甚至更短。在较长的字符串上，LowCardinality的影响可能会更加明显。

值得一提的是，还有一种用字典编码字符串的可能性：[Enums](https://clickhouse.yandex/docs/en/data_types/enum/)。ClickHouse完美支持枚举。从存储的角度来看，它可能甚至更有效率，因为枚举值存储在表定义上而不是存储在单独的数据文件中。枚举适用于静态字典。但是，如果插入了原始枚举之外的值，ClickHouse将引发异常。枚举值集中的每个更改都需要ALTER TABLE，这可能会带来很多麻烦。LowCardinality在这方面要灵活得多。

**实时视图**

将实时视图表与真实数据集一起使用 live view , 相比普通 view 除了实时还多了缓存

**命令**

```
detach database payemnt #删除mysql引擎库
alter table cpu update usage_user = 888 where usage_user=18 #update
alter table cpu delete where usage_user = 888 #delete
alter table user_behavior add column `operation` String after service; #add column
alter table user_behavior drop column operator; #drop column
rename table system_msg to system_msg_old
```

**web 客户端tabix**

```
docker run -d -p 8080:80 spoonest/clickhouse-tabix-web-client
```


**查询示例**

```
#执行时间分位数查询
SELECT
    created_date,
    quantile(0.999)(toFloat64(execute_mic_time))
FROM order_behavior_log
WHERE (created_date > '2019-11-28 12:00:00') AND (created_date < '2019-11-28 12:01:00')
GROUP BY created_date
ORDER BY created_date ASC

#最近7天
SELECT
    toUnixTimestamp(toStartOfDay(created_date)) AS time,
    max(created_date),
    sum(total_fee) / 100
FROM order_behavior_log
WHERE (created_date <= now()) AND (created_date >= (toDate(now()) - 7)) AND (state = 3)
GROUP BY time
ORDER BY time ASC

#10月份销售额
select sum(total_fee)/100 from order_behavior_log where toDate(created_date) >= '2019-10-01' and toDate(created_date) <='2019-10-31' and state = 3
```

**系统查询**

```
#查看列大小
SELECT column, any(type), 
        sum(column_data_compressed_bytes) compressed, 
        sum(column_data_uncompressed_bytes) uncompressed, 
        sum(rows)
    FROM system.parts_columns 
    WHERE (table = 'ontime') AND active AND (column LIKE '%CityName')
    GROUP BY column
    ORDER BY column ASC
    
#查看表大小，也可以到data 目录下执行 `du -h --max-depth=1`
SELECT 
    table, 
    sum(rows), 
    formatReadableSize(sum(data_compressed_bytes)) AS compressed_size, 
    formatReadableSize(sum(data_uncompressed_bytes)) AS uncompr
FROM system.parts
WHERE active AND (table LIKE 'order_behavior_log')
GROUP BY table
```

**产生date_time列**

```
cat data.csv | awk -F "," '{str=substr($NF,0,11);print $0","str}'
#时间戳
PARTITION BY toYYYYMMDD(toDateTime(create_date))
```

**使用 mysql 函数将 mysql 数据导入clickhouse**

```
#方式一 (导入之前要先修改时区)
CREATE TABLE order_behavior_log
ENGINE = MergeTree
PARTITION BY toYYYYMMDD(created_date)
ORDER BY id AS
SELECT *
FROM mysql('172.16.200.40', 'soa_behavior', 'order_behavior_log', 'root', 'passwd')

Ok.

0 rows in set. Elapsed: 89.739 sec. Processed 7.38 million rows, 11.81 GB (82.25 thousand rows/s., 131.63 MB/s.)

┌─count()─┐
│ 7381387 │
└─────────┘

┌─table──────────────┬─sum(rows)─┬─compressed_size─┬─uncompr───┐
│ order_behavior_log │   7381387 │ 4.72 GiB        │ 10.63 GiB │
└────────────────────┴───────────┴─────────────────┴───────────┘

#方式二增量
INSERT INTO order_behavior_log SELECT *
FROM mysql('172.16.200.40', 'soa_behavior', 'order_behavior_log', 'root', 'passwd')
WHERE id >
(
    SELECT max(id)
    FROM order_behavior_log
);

#使用非交互模式
clickhouse-client --input_format_allow_errors_num=10 \
--query="INSERT INTO bill SELECT * FROM url('http://ck.t1.apple.net/?database=default&query=select%20*%20from%20bill', TabSeparated, 'created_date DateTime, wx_app_id String, mch_id String, order_id String, shop_order_id String, trade_type String, trade_status String, total_fee Float64, refund_id String, shop_refund_id String, refund_fee Float64, refund_status String, goods_name String, fees Float64, rates String, trade_no String, refund_no String')"
```

**使用 url 函数 clickhouseA 导入 clickhouseB**

```
#方式一 (导入之前要先修改时区)
CREATE TABLE order_behavior_log
ENGINE = MergeTree
PARTITION BY toYYYYMMDD(created_date)
ORDER BY id AS
SELECT *
FROM url('http://10.2.4.3:8123/?database=soa_behavior&query=select%20*%20from%20order_behavior_log', TabSeparated, '`id` Int64, `shop_order_id` Int64, `trade_no` Int64, `shop_id` Int32, `trace_id` String, `agg_platform` String, `deal_handler` String, `parameters` String, `total_fee` Int32, `state` Int8, `return_data` String, `execute_mic_time` String, `error_code` Int32, `error_msg` String, `created_at` Int32, `updated_at` Int32, `deleted_at` Nullable(Int32), `created_date` DateTime')
LIMIT 3

#方式二增量
INSERT INTO order_behavior_log SELECT *
FROM url('http://10.2.4.3:8123/?database=soa_behavior&query=select%20*%20from%20order_behavior_log', TabSeparated, '`id` Int64, `shop_order_id` Int64, `trade_no` Int64, `shop_id` Int32, `trace_id` String, `agg_platform` String, `deal_handler` String, `parameters` String, `total_fee` Int32, `state` Int8, `return_data` String, `execute_mic_time` String, `error_code` Int32, `error_msg` String, `created_at` Int32, `updated_at` Int32, `deleted_at` Nullable(Int32), `created_date` DateTime')
LIMIT 3
```

**clickhouse 查询远程数据**

```
# 从api接口查询
SELECT *
FROM url('http://10.2.4.35:8123/?database=soa_behavior&query=select%20*%20from%20order_behavior_log&user=default&password=MXtqOeQcX', TabSeparated, '`id` Int64, `shop_order_id` Int64, `trade_no` Int64, `shop_id` Int32, `trace_id` String, `agg_platform` String, `deal_handler` String, `parameters` String, `total_fee` Int32, `state` Int8, `return_data` String, `execute_mic_time` String, `error_code` Int32, `error_msg` String, `created_at` Int32, `updated_at` Int32, `deleted_at` Nullable(Int32), `created_date` DateTime')
LIMIT 3

# 从远端mysql查询
SELECT 
    data1, 
    COUNT(*)
FROM mysql('172.16.200.4:3306', 'soa_behavior', 'order_behavior_log', 'root', 'passwd') 
GROUP BY data1
```

**开启mysql客户端支持**

```
sed "145 i<mysql_port>9004</mysql_port>" -i /etc/clickhouse-server/config.xml

## 导入mysql数据
mysql --protocol tcp -u default -h 10.42.0.76 -P 9004   < /home/runner/work/clickhouse/clickhouse/tmp/sms_new_metrics.sql

#查询
SELECT (intDiv(toUInt32(created_at), 7200) * 7200) * 1000 as t, count(id) AS "id" FROM metrics WHERE  created_at BETWEEN  '2020-03-01 00:00:00'  AND  '2020-06-04 15:59:59'  GROUP BY t ORDER BY 1;
```

**跳过错误** (忽略csv标题行)

```
clickhouse-client --input_format_allow_errors_num=1 \
--input_format_allow_errors_ratio=0.1 \
--query="INSERT INTO bill SELECT *
FROM url('http://payment-hotfix-duizhangdan.t1.apple.net/order/downloadbill?bill_date=20200106&agg_platform=wx', CSV, 'created_date DateTime, wx_app_id String , mch_id String, order_id String , shop_order_id String, trade_type String, trade_status String, total_fee Float64 , refund_id String, shop_refund_id String ,refund_fee  Float64, refund_status String, goods_name String, fees Float64, rates String , trade_no String , refund_no String')"
```

**php 客户端**

```
#composer require smi2/phpclickhouse

<?php
include('./vendor/autoload.php');
$config = [
    'host' => '10.0.12.*',
    'port' => '8123',
    'username' => 'default',
    'password' => ''
];
$db = new ClickHouseDB\Client($config);
$db->database('soa_behavior');
$statement = $db->select('select * from order_behavior_log where id = 100');
print_r($statement->rows());

$statement = $db->write('alter table order_behavior_log update shop_id = 1 where id = 100');
print_r($statement->info());
```

**grafana查询**

```
SELECT
    1574058600000 as t,
    usage_user
FROM $table
WHERE $timeFilter
ORDER BY t

#查询最近7天数据
SELECT
    t,
    groupArray((d,s)) AS groupArr
FROM
(
  SELECT 
      (intDiv(toUInt32(created_date), 86400) * 86400) * 1000 AS t,
      toDate(created_date) AS d, 
      sum(total_fee) / 100 AS s
  FROM $table
  WHERE (created_date < toDateTime($to)) AND (created_date > (toDate($to) - 7)) AND (state = 3)
  GROUP BY t,d
  ORDER BY t ASC
)
GROUP BY t
ORDER BY t 

#七日数据
SELECT
    t + 86400000 * 7,
    st AS `七日`
FROM
(
  SELECT
     (intDiv(toUInt32(created_date), $interval) * $interval) * 1000 AS t,
     sum(total_fee)/100 as st
  FROM $table
  WHERE 
      (created_date > toDateTime($from - 86400*7)) AND (created_date < toDateTime($to - 86400*7))
      $conditionalTest(AND agg_platform IN ($agg_platform),$agg_platform) 
  Group by t
  ORDER BY t
)

#世界地图
CREATE TABLE `worldmap_latlng` (
   created_date Date DEFAULT today(),  
   created_at DateTime DEFAULT now(),    
  `lat` Float32,
  `lng` Float32,
  `name` String,
  `value` Int32
 ) ENGINE = MergeTree(created_date, created_at, 8192);
 
INSERT INTO `worldmap_latlng`(`lat`, `lng`, `name`, `value`) VALUES (31.24916171,121.487899486, '上海', 2)
```

**高可用**

{% post_link clickhouse-ha clickhouse高可用集群搭建%}


**定时同步mysql**
```
* * * * * sh /root/sh/sync_soa_behavior.sh
0 0 * * * sh /root/sh/sync_soa_behavior_del_today.sh

[root@node-a001 sh]# cat sync_soa_behavior_del_today.sh

docker exec clickhouse clickhouse-client --database=soa_behavior --query="alter table order_behavior_log delete where created_date >= yesterday()"


[root@node-a001 sh]# cat sync_soa_behavior.sh

docker exec clickhouse clickhouse-client --database=soa_behavior --query="alter table order_behavior_log delete where created_date >= toStartOfTenMinutes(now())"

sleep 5

docker exec clickhouse clickhouse-client --database=soa_behavior --query="INSERT INTO order_behavior_log SELECT * FROM mysql('mysql.host', 'soa_behavior', 'order_behavior_log', 'username','password') WHERE id >(SELECT max(id) FROM order_behavior_log)"

```

**抽样**
同时我们还可以通过 ClickHouse 的抽样功能来辅助降低引擎查询压力。这里需要注意的是，只有在创建表结构时开启抽样查询功能，才能执行抽样查询 SQL 
那么如何开启抽样查询功能呢，其实很简单，比如我们想以 datetime 维度进程抽样展示，只要在您的建表语句中包含 SAMPLE BY intHash64(datetime) ，同时，在您的主键中，也就是 ORDER BY 里面，必须包含抽样的字段。完成的建表语句如下:
```
CREATE TABLE soa.user_behavior
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
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/user_behavior', '{replica}')
PARTITION BY date
ORDER BY (date, user, intHash64(datetime))
SAMPLE BY intHash64(datetime)
SETTINGS index_granularity = 8192
```

**grafana 7.0警报支持**
```
rm -rfv /var/lib/grafana/plugins/vertamedia-clickhouse/
git clone https://github.com/Vertamedia/clickhouse-grafana /var/lib/grafana/plugins/vertamedia-clickhouse/
echo "[plugins]\nallow_loading_unsigned_plugins = vertamedia-clickhouse-datasource" >> /etc/grafana/grafana.ini
systemctl restart grafana

# helm形式安装
在 grafana 包 value.yaml 文件大概390行，添加：    
allow_loading_unsigned_plugins: "vertamedia-clickhouse-datasource"
```

**物化视图**
```
CREATE MATERIALIZED VIEW mv_sms_year_month_cnt
ENGINE = SummingMergeTree
PARTITION BY year_month
ORDER BY (year_month,channel) POPULATE AS
SELECT
    toYYYYMM(created_at) AS year_month,
    channel,
    count() AS cnt
FROM sms_report
GROUP BY
    toYYYYMM(created_at),
    channel
```

**备份**
```
clickhouse-client --host="localhost" --port="9000" --user="default" --password="*******" --max_threads="1"  --query="select * from biw.system_msg FORMAT CSV"  > /tmp/system_20200819.csv
```

**参考：**

https://clickhouse.yandex/docs/zh/
https://www.altinity.com/blog/clickhouse-for-time-series
https://clickhouse.yandex/docs/zh/getting_started/example_datasets/ontime/
https://www.altinity.com/blog/2018/2/12/aggregate-mysql-data-at-high-speed-with-clickhouse
https://developer.aliyun.com/article/739805
[创建grafana面板](https://altinity.com/blog/2019/12/28/creating-beautiful-grafana-dashboards-on-clickhouse-a-tutorial)

多分片多副本高可用
https://clickhouse.yandex/docs/zh/operations/table_engines/distributed/
http://sineyuan.github.io/post/clickhouse-docker-quick-start/
https://www.cnblogs.com/freeweb/p/9352947.html
https://www.jianshu.com/p/ab811cceb856