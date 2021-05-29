---
title: "Prometheus入门"
description: ""
date: 2019-02-01 19:46:10
tags: [prometheus,监控,consul]
comments: false
share: true
---

### 数据模型

**时序索引** 名称+标签

**时序样本**  float64 值

**格式**: 

```
<metric name>{<label name>=<label value>, ...}
```

Prometheus 时序数据分为 [Counter](https://prometheus.io/docs/concepts/metric_types/#counter), [Gauge](https://prometheus.io/docs/concepts/metric_types/#gauge), [Histogram](https://prometheus.io/docs/concepts/metric_types/#histogram), [Summary](https://prometheus.io/docs/concepts/metric_types/#summary) 四种类型。

```
metric_name [
  "{" label_name "=" `"` label_value `"` { "," label_name "=" `"` label_value `"` } [ "," ] "}"
] value [ timestamp ]
```



**Counter**

```
# 不同时间获取不同值，图形上按时间增量展示，如果后面时间戳不写，就使用当前时间，如果获取不到，就为空，图像表示为中间断了如图:   _- -
# HELP sample_http_requests_total The total number of HTTP requests.
# TYPE sample_http_requests_total counter
sample_http_requests_total{method="post",code="200"} 1027 1568018567000
sample_http_requests_total{method="post",code="400"}    3 1568018567000
idelta(sample_http_requests_total[1m]) 获取和一分钟前的差距
```



**Gauge**

Gauge不能解决并发问题





**向量**

一个向量就是一列数，这些数是有序排列的。用过次序中的索引，我们可以确定每个单独的数。通常会赋予向量粗体的小写名称。当我们需要明确表示向量中的元素时，我们会将元素排列成一个方括号包围的纵柱：

![img](https://upload-images.jianshu.io/upload_images/12621529-a47a2a3008428942.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/134/format/webp)

我们可以把向量看作空间中的点，每个元素是不同的坐标轴上的坐标。



时间戳根据时区不同，会转换成不同的日期时间.



**PromQL**

```
#CPU 个数
count(count(node_cpu_seconds_total{instance="172.16.101.209:9100",mode="system"}) by (cpu))
#内存使用率
(1 - (node_memory_MemAvailable_bytes{instance=~"$node"} / (node_memory_MemTotal_bytes{instance=~"$node"})))* 100
#cpu空闲率
avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) by (instance)
#offset25 一分钟前后值差异
delta(sample_http_requests_total{code="200"} [1m] offset 25m ) 

gauge
sum without(device, fstype, mountpoint)(node_filesystem_size_bytes)
max without(device, fstype, mountpoint)(node_filesystem_size_bytes)
avg without(instance, job)(process_open_fds)

counter
#要计算每秒接收的网络流量，可以使用：返回值将是最近5分钟的平均值
rate(node_network_receive_bytes_total[5m])
The output of rate is a gauge, so the same aggregations apply as for gauges.
sum without(device)(rate(node_network_receive_bytes_total[5m]))

//通过rate()函数获取HTTP请求量的增长率
rate(http_requests_total[5m])
//查询当前系统中，访问量前10的HTTP地址
topk(10, http_requests_total)

count without(instance)(process_open_fds > 10)
```



**CPU 参数**

```
type就是CPU的不同状态值
idle, nice, user (default), system (default for Windows), iowait, interrupt, softirq, steal
其中idle表示空闲，user表示用户使用
```



**prometheus rules**

```
groups:
- name: container-restart
  rules:
  - alert: Containers Restarts (Last 30 Minutes)
    expr: |
      delta(kube_pod_container_status_restarts_total{}[30m])>0  
    for: 5m
    labels:
      severity: warning
      team: DevOps
    annotations:
      summary: "Instance {{ $labels.instance }} down"
      description: "{{$labels.namespace}}/{{$labels.pod}} has many containers restarts in last 30 minutes"
```



**alertManager**

```
global:
  smtp_smarthost: 'smtp.qq.com:465'
  smtp_from: '532499602@qq.com'
  smtp_auth_username: 'weihaozhe@aa.net'
  smtp_auth_password: ''
  smtp_require_tls: false
route:
  group_by: ['alertname']
  group_wait: 1m
  group_interval: 10m
  repeat_interval: 10m
  receiver: default-receiver
receivers:
- name: 'default-receiver'
  email_configs:
  - to: 'air_zhe@163.com'

```

**configMap reload**

```
https://github.com/jimmidyson/configmap-reload/tree/v0.2.2
```


一台Prometheus服务器每秒可以摄取数百万个样本.


Prometheus旨在跟踪整个系统的运行状况，行为和性能，而不是单个事件。换句话说，Prometheus关心在最后一分钟有15个请求，花了4秒钟来处理，导致40次数据库调用，17次缓存命中和2次客户购买。单个调用的成本和代码路径将成为性能分析或日志记录的问题。



官方对非官方
不要因为客户端库是非官方的或第三方的集成而推迟。您可能希望与数百个应用程序和系统集成，因此Prometheus项目团队不可能有时间和专业知识来创建和维护它们。因此，生态系统中的绝大多数集成都是第三方。为了使事情合理地保持一致并按预期工作，可以使用有关如何编写集成的准则。
作为Prometheus的用户，您应该了解，拉力已根植于Prometheus的核心中，而试图使其进行推顶充其量是不明智的。作为基于指标的系统，Prometheus不适合存储事件日志或单个事件。



存储

建议使用SSD，但并非严格要求。



计数器总是在增加。这样可以创建美观的图形，但是计数器的值本身并没有太多用处。您真正想知道的是计数器增加的速度，这就是`rate`函数的作用。该`rate`函数计算计数器每秒增加的速度。将表达式调整为 **rate(prometheus_tsdb_head_samples_appended_total[1m])**，它将计算出Prometheus在1分钟内每秒平均摄取多少个样本



量具有三种主要方法 使用：`inc`，`dec`和`set`

量规是某些当前状态的快照。对于计数器来说，增长的速度是您所关心的，而对于量规，则是量规的实际值。因此，值可以同时上升和下降。



```
LAST.set(time.time())
PromQL表达式time() - hello_world_last_time_seconds 将告诉您自上次请求以来有多少秒。
```

请求进来inc ,结束des 计算请求数



**摘要**

摘要的作用是让您能够计算事件的平均大小，在这种情况下，是每个响应中返回的平均字节数。 如果您有三个大小分别为1、4和7的响应，则平均值将是它们的总和除以它们的计数，即12除以3。同样适用于摘要。

```
hello_world_latency_seconds_count是observe已进行的呼叫数，因此rate(hello_world_latency_seconds_count[1m])在表达式浏览器中将返回Hello World请求的每秒速率。

hello_world_latency_seconds_sum是传递给的值的总和 observe，因此rate(hello_world_latency_seconds_sum[1m])每秒响应请求所花费的时间也是如此。

如果将这两个表达式相除，您将获得最后一分钟的平均延迟。 平均延迟的完整表达式为：
rate（hello_world_latency_seconds_sum [1m]）/rate（hello_world_latency_seconds_count [1m]）
```



**直方图**

直方图度量标准允许您跟踪事件大小的分布，从而可以从中计算分位数。例如，您可以使用直方图来计算0.9分位数（也称为第90 个 百分位数）延迟。

直方图指标还包括`_sum`和`_count`指标，它们的工作原理与摘要指标完全相同。

摘要将提供平均延迟，但是如果要分位数呢？分位数告诉您，一定比例的事件的大小小于给定值。 例如，0.95分位数为300毫秒，这意味着95％的请求花费的时间少于300毫秒。

在推理实际的最终用户体验时，分位数很有用。如果用户的浏览器向您的应用程序发出20个并发请求，则确定用户可见延迟的时间是最慢的。在这种情况下，第95 个 百分点捕获了该延迟。



默认存储桶的延迟范围从1 ms到10 s。这旨在捕获Web应用程序的典型延迟范围。但是，您也可以覆盖它们，并在定义指标时提供自己的存储桶。





Summary和Histogram都提供了对于事件的计数_count以及值的汇总_sum。 因此使用_count,和_sum时间序列可以计算出相同的内容，例如http每秒的平均响应时间：rate(basename_sum[5m]) / rate(basename_count[5m])。

同时Summary和Histogram都可以计算和统计样本的分布情况，比如中位数，9分位数等等。其中 0.0<= 分位数Quantiles <= 1.0。

不同在于Histogram可以通过histogram_quantile函数在服务器端计算分位数。 而Sumamry的分位数则是直接在客户端进行定义。因此对于分位数的计算。 Summary在通过PromQL进行查询时有更好的性能表现，而Histogram则会消耗更多的资源。相对的对于客户端而言Histogram消耗的资源更少。





**标签**

对于HTTP状态代码，而不是`code~="4.."`捕获401s，404s，405s等，您可以将它们组合为标签值`4xx`并使用相等匹配器`code="4xx"`。



**聚合运算符**

```
sum without()(node_filesystem_size_bytes)
sum by(job, instance, device)(node_filesystem_size_bytes)
sum without(fstype, mountpoint, device)(node_filesystem_size_bytes)
count without(device)(node_disk_read_bytes_total)
avg without(cpu)(rate(node_cpu_seconds_total[5m]))
等于
  sum without(cpu)(rate(node_cpu_seconds_total[5m]))
/
  count without(cpu)(rate(node_cpu_seconds_total[5m]))
max without(device, fstype, mountpoint)(node_filesystem_size_bytes)

topk without(device, fstype, mountpoint)(2, node_filesystem_size_bytes)
分位数
quantile without(cpu)(0.9, rate(node_cpu_seconds_total{mode="system"}[5m]))
```


**k8s服务发现**
要想自动发现集群中的 Service，就需要我们在 Service 的annotation区域添加：prometheus.io/scrape=true的声明
要想自动发现集群中的 pod，也需要我们在 pod 的annotation区域添加：prometheus.io/scrape=true的声明

```
kind: Service
apiVersion: v1
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9121"
  name: redis
  namespace: kube-system
```

**实战**
```
# 两分钟的增长率×60,为什么×60呢？因为为是按秒求的平均值，还原一分钟的就要乘以60，另外prometheus默认1分钟刮一次数据
irate(user_behavior_request_counter[2m])*60

# 统计loki某个job的日志数（通过sum by把不同日期的数据求和，通过count_over_time统计区间向量内每个度量指标的样本数据个数）
sum(count_over_time({job="${job}"} |~"(?i)${search}" [$__interval])) by (job)

# 统计counter类型增长曲线(注意使用变量报警不支持)高版grafana可以使用$__rate_interval, 这个时间和 prometheus 的采集时间设置有关，比如1分钟采集一次，这个值要大于60s
rate(my_test_counter[$__rate_interval])*$__interval_ms/1000

# 统计counter类型一分钟内的增长数
increase(mysql2es_inserted_num[1m])
# 在grafana 中设置`Min interval`为1m，设置Display为Bar

# 按每半小时统计增长数，在grafana使用total计算总数，设置`Min interval`为30m
increase(SOA_SMS_SEND_ANY{attr="message_publish"}[30m]  offset 1d)
```

通过增长率表示样本的变化情况

increase(v range-vector)函数是PromQL中提供的众多内置函数之一。其中参数v是一个区间向量，increase函数获取区间向量中的第一个后最后一个样本并返回其增长量。因此，可以通过以下表达式Counter类型指标的增长率：

increase(node_cpu[2m]) / 120

**标签替换**
```
该函数会依次对 v 中的每一条时间序列进行处理，通过 regex 匹配 src_label 的值，并将匹配部分 relacement 写入到 dst_label 标签中。如下所示：

label_replace(up, "host", "$1", "instance",  "(.*):.*")
函数处理后，时间序列将包含一个 host 标签，host 标签的值为 Exporter 实例的 IP 地址：

up{host="localhost",instance="localhost:8080",job="cadvisor"}   1
up{host="localhost",instance="localhost:9090",job="prometheus"}   1
up{host="localhost",instance="localhost:9100",job="node"}   1$$

label_replace(BIW_SHT_QUEUE_DELIVERY_ORDER_OUT, "attr", "$1", "attr",  ".*_(.*)")
```


**consul 配置**
```yaml
- job_name: consul-prometheus
  honor_timestamps: true
  scrape_interval: 1m
  scrape_timeout: 10s
  metrics_path: /metrics
  scheme: http
  consul_sd_configs:
  - server: consul:8500
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
```

**consul 注册服务**
```sh
curl -X PUT -d '{"id":"minion-1","name":"minio","address":"172.2.4.1","port":9000,"meta":{"app":"minio","team":"soa","metrics":"/minio/prometheus/metrics"}}'  http://consul.t1.abc.net/v1/agent/service/register

// 按id删除服务
curl -X PUT http://10.0.**.251:8500/v1/agent/service/deregister/minion-1
```


参考：

https://mojotv.cn/go/prometheus-client-for-go

[Prometheus 通过 consul 实现自动服务发现](https://blog.csdn.net/aixiaoyang168/article/details/103022342)