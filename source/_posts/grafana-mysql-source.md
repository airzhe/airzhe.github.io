---
title: "grafana 使用 mysql 源统计"
date: 2019-11-14 20:41:01
tags: [grafana,helm]
share: true
---

配置对应的 mysql 数据源，新建 pannel，查询语句：

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

Format as 选择 Time series , Unit 选择 Currency, Decimals 选 2

![11.png](/img/grafana/11.png)

**最终效果**

![12.png](/img/grafana/12.png)

**备注：**

helm grafana chart 安装饼装图插件

```
plugins:
  - grafana-piechart-panel
```

开启alpha模式

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
    root_url: http://grafana.t1.nicetuan.net
  plugins:
    enable_alpha: true
```

参考链接：
https://www.mssqltips.com/sqlservertip/6008/sql-server-time-series-data-visualization-with-grafana/
https://blog.csdn.net/malingyu/article/details/84389113