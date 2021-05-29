---
title: "高可用 prometheus 监控实施"
description: ""
date: 2021-05-13 15:40:10
tags: [prometheus,高可用,victoriametrics]
comments: false
share: true
---


**机器配置**

| ip          | 服务                 | 说明                         |
| ----------- | -------------------- | ---------------------------- |
| 10.0.40.100 | grafana + prometheus | 监控 报警                    |
| 10.0.40.101 | grafana + prometheus | 监控 报警                    |
| 10.0.40.102 | victoriametrics      | slb 10.0.50.100 代理8428端口 |
| 10.0.40.103 | victoriametrics      | slb 10.0.50.100 代理8428端口 |
| 10.0.10.11 | loki                 | 日志                         |

**方案说明**

- prometheus 设置远程写，到多个 victoriametrics

- grafana 数据存入mysql，使用 slb 地址引入 victoriametrics 数据源做展示报警

- 以上prometheus 、grafana 、victoriametrics 均可配置水平扩展

**收益**

- 监控报警高可用
- 引入了victoriametrics存储，数据查看由之前的最近15天扩展到3个月或更久


<!-- more -->

**Docker  安装**

```sh
yum -y remove docker docker-common docker-selinux docker-engine
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install docker-ce
systemctl start docker 
systemctl enable docker
docker run hello-world
```

**CAdvisor** 

```sh
docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=8090:8080 \
  --detach=true \
  --name=cadvisor \
  google/cadvisor:v0.33.0
```

**Loki**

```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
docker plugin ls
# 插件使用
docker run --log-driver=loki \
    --log-opt loki-url="https://<user_id>:<password>@logs-us-west1.grafana.net/loki/api/v1/push" \
    --log-opt loki-retries=5 \
    --log-opt loki-batch-size=400 \
    grafana/grafana
```

**Grafana**

```sh
docker run -d \
    -p 3000:3000 \
    -v /root/grafana/etc:/etc/grafana \
    -v /root/grafana/plugins:/var/lib/grafana/plugins \
    --log-driver=loki \
    --log-opt loki-url="http://10.0.10.11:3100/loki/api/v1/push" \
    --log-opt loki-retries=5 \
    --log-opt loki-batch-size=400 \
    --name=grafana \
    --restart=always \
    grafana/grafana
```

配置ldap登录和邮件报警配置，对于vm的健康检查报警可以开启`If execution error or timeout SET STATE TO Alerting`

**Prometheus**

```sh
 docker run -d \
    -p 9090:9090 \
    -v /root/prometheus/etc/prometheus.yml:/opt/bitnami/prometheus/conf/prometheus.yml \
    --log-driver=loki \
    --log-opt loki-url="http://10.0.10.11:3100/loki/api/v1/push" \
    --log-opt loki-retries=5 \
    --log-opt loki-batch-size=400 \
    --restart=always \
    --name prometheus \
    bitnami/prometheus:latest
```

配置

```yaml
# 远程写入多个victoriametrics数据库
remote_write:
  - url: http://10.0.50.100:8428/api/v1/write
    queue_config:
      max_samples_per_send: 10000
  - url: http://10.0.50.100:8428/api/v1/write
    queue_config:
      max_samples_per_send: 10000
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'
    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.
    static_configs:
    - targets: ['localhost:9090']
  # consul服务发现
  - job_name: consul-prometheus
    honor_timestamps: true
    metrics_path: /metrics
    scheme: http
    consul_sd_configs:
    - server: 10.0.30.10:8500
      tag_separator: ','
      scheme: http
      allow_stale: true
      refresh_interval: 30s
    relabel_configs:
    - separator: ;
      regex: __meta_consul_service_metadata_(.+)
      replacement: $1
      action: labelmap
    - source_labels: [__meta_consul_service_metadata_metrics]
      separator: ;
      regex: ^(.+)$
      target_label: __metrics_path__
      replacement: $1
      action: replace
    - source_labels: [__meta_consul_tags]
      regex: ^,,$
      action: keep
    - source_labels: [__meta_consul_service]
      regex: ^consul$
      action: drop
```

**Victoriametrics** 

```sh
 docker run -d \
    -p 8428:8428 \
    -v /root/victoria-metrics/data:/victoria-metrics-data \
    --log-driver=loki \
    --log-opt loki-url="http://10.0.10.11:3100/loki/api/v1/push" \
    --log-opt loki-retries=5 \
    --log-opt loki-batch-size=400 \
    --restart=always \
    --name victoriametrics \
    victoriametrics/victoria-metrics \
    " -dedup.minScrapeInterval=15 -retentionPeriod=2"
```

**注册consul**

victoriametrics 注册consul

cadvisor 注册consul




 参考：

[CentOS7 安装 Docker](https://developer.aliyun.com/article/765545)

[cAdvisor+Prometheus+Grafana监控docker](https://www.cnblogs.com/Dev0ps/p/10546276.html)

[loki-docker-driver](https://grafana.com/docs/loki/latest/clients/docker-driver/)

[Grafana常用定制修改](https://blog.csdn.net/evandeng2009/article/details/102734139)

[cadvisor metrics container_memory_working_set_bytes vs container_memory_usage_bytes](https://blog.csdn.net/u010918487/article/details/106190764)