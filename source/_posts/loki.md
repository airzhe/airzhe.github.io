---
title: "使用Loki查询日志"
date: 2019-10-17 19:25:10
tags: [loki,promtal,grafana,日志]
share: true
---
![1.png](/img/loki/logo.png)

loki 是 grafana 公司出的日志查询工具，区别es，只对标签不对数据做索引，更轻量。

![1.png](/img/loki/1.png)

[查询语句](https://github.com/grafana/loki/blob/65ba42a6e7dc975d6f25b15fc6f9b8d72446b3e2/docs/logql.md)：

```
{job="ingress-nginx/nginx-ingress"} |="php-sht-payment-develop-http" |="refund/create"
{job="php-sht/payment-develop",stream="neo-log"} !="ShopNotifyJob" 
{job=~"php-sht/payment-develop.*"} |~"shop_refund" !~"15712" #正则
```

**promtail** 作为loki的数据采集客户端，在k8s部署采用服务发现的形式监控所有容器标准输入输出。业务日志监控可以采用sidecar方式放在服务pod里，把日志文件mount 到本地，推给loki.

promtail.yaml 普通配置
```
server:
  http_listen_port: 3101
scrape_configs:
  - job_name: payment-develop
    entry_parser: raw
    static_configs:
      - targets:
         - localhost
        labels:
          job: php-sht/payment-develop
          stream: neo-log
          __path__: /var/www/payment/runtime/logs/*.log
```
<!-- more -->
自定义metrics [pipeline 配置](https://github.com/grafana/loki/blob/b74db24a007511d437c459aa36c693dc7dae8409/docs/logentry/processing-log-lines.md#metrics)

```
server:
  http_listen_port: 3101
client:
  url: http://172.16.101.117:3100/api/prom/push
scrape_configs:
- job_name: payment-develop #不参与查询
  static_configs:
  - targets:
      - localhost
    labels:
      job: php-sht/payment-develop #生成查询标签
      stream: neo-log
      __path__: /var/www/payment/runtime/logs/*.log
  pipeline_stages:
  - match:
      selector: '{stream="neo-log"}'
      stages:
       - regex:
          expression: "^(?P<message>.*)$" 
       - regex:
          expression: "^.*(?P<warning_msg>(warning|WARNING)).*$" 
       - regex:
          expression: "^.*(?P<error_msg>(error|ERROR)).*$" 
       - metrics: #根据日志生成mertrics,注意此统计只能针对当前job
           log_lines_total:
             type: Counter
             description: "log total"
             source: message
             config:
               action: inc
           error_log_total:  #统计错误日志总数
             type: Counter
             description: "error message total"
             source: error_msg
             config:
               action: inc 
           warning_log_total:  #统计warning日志总数
             type: Counter
             description: "warning message total"
             source: warning_msg
             config:
               action: inc 
```
服务启动后会在 3101 端口产生自定义metrics数据，以promtail_custom开头，如:promtail_custom_log_lines_total

k8s中配置prometheus服务发现，在service 中配置：
```
annotations:
  prometheus.io/port: "3101"
  prometheus.io/scrape: "true"
```

在 grafana 新建监控指标:

![2.png](/img/loki/2.png)

监控日志总数，warning日志、error日志增长速率:

![3.png](/img/loki/3.png)