---
title: "grafana 模板变量配置"
date: 2019-10-22 20:23:10
tags: [loki,promtal,grafana]
share: true
---

重新安装了日志采集器，生成了所有日志文件的 metrics 统计信息，在 grafana 中显示如图，比较混乱

![1.png](/img/grafana/1.png)

prometheus 中按标签查询结果，显示了该标签有多个查询结果

![2.png](/img/grafana/2.png)
<!-- more -->

现在按 filename 字段查询当天的日志文件统计信息，在 grafana 面板中创建日期变量，来源选择 prometheus，按正则选出日期变量，最下方显示了产生变量的预览信息：

![3.png](/img/grafana/3.png)

重新编辑面板，按日期变量来过滤数据

![4.png](/img/grafana/4.png)

保存，面版按当前日期显示正常：

![5.png](/img/grafana/5.png)


日志监控的配置参考上篇文章: {% post_link loki  使用Loki查询日志%}

{% post_link grafana-mysql-source grafana 使用 mysql源%}时，如果使用 All 变量，查询 sql 过滤要改成 in 方式，如: `select count(*) from t where type in (${source_type})`;