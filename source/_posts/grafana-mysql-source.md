---
title: "grafana使用mysql源做统计"
date: 2019-11-14 20:41:01
tags: [grafana,helm]
share: true
---

配置对应的 mysql 数据源，新建面板，查询语句：

```
SELECT
  created_at AS "time",
  "下单金额" AS metric,
  total_fee/100
FROM `order`
WHERE
  $__unixEpochFilter(created_at)
ORDER BY created_at
```

Format as选择Time series, Unit 选择 Currency

![11.png](/img/grafana/11.png)
<!-- more -->

**效果图:**

![12.png](/img/grafana/12.png)

**备注:**

helm版 grafana chart 安装饼装图插件

```
plugins:
  - grafana-piechart-panel
```

开启 plugin alpha 模式

```
grafana.ini:
  paths:
    data: /var/lib/grafana/data
    logs: /var/log/grafana
    plugins: /var/lib/grafana/plugins
    provisioning: /etc/grafana/provisioning
  analytics:
    check_for_updates: true
  log:
    mode: console
  grafana_net:
    url: https://grafana.net
  server:
    root_url: http://grafana.local.com
  plugins:
    enable_alpha: true
```
**参考查询:**
```
#最近七天每日订单金额
SELECT
   unix_timestamp(from_unixtime(created_at,'%Y-%m-%d 00:00:00')) as time,
   from_unixtime(created_at,'%Y-%m-%d') AS metric,
   sum(total_fee)/100
FROM `order_log`
WHERE
  created_at <= ($__unixEpochTo()) AND created_at >= ($__unixEpochTo() DIV 86400 * 86400 - 6*60*60*24 - 8*60*60) AND state = 3  AND agg_platform in (${agg_platform})
GROUP BY time
ORDER BY time

#昨日下单数在当前时间轴展示
SELECT
    time + 86400 as time, 
    "昨日下单数" AS metric,
    cnt
FROM
(
  SELECT
     $__unixEpochGroup(created_at,$__interval) as time,
     count(*) cnt
  FROM `order_log`
  WHERE
    created_at >  ($__unixEpochFrom() - 86400)  AND created_at <  ($__unixEpochTo() - 86400)  AND agg_platform in (${agg_platform})
  GROUP BY time
  ORDER BY time
) obl
```
参考链接：
https://www.mssqltips.com/sqlservertip/6008/sql-server-time-series-data-visualization-with-grafana/
https://blog.csdn.net/malingyu/article/details/84389113
https://community.grafana.com/t/how-to-add-time-series-queries-with-grafana-and-mysql/3170/55
[去除 Data outside time range](https://www.cnblogs.com/michellexiaoqi/p/7274890.html)