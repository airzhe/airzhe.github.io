---
title: "loki使用cassandra作存储"
date: 2019-12-23 19:24:10
tags: [loki,cassandra]
share: true
---


**cassandra 配置开启帐号密码认证**

打开 `cassandra.yaml` 文件并且搜索 `authenticator` 关键词，将 `authenticator:AllowAllAuthenticator`，改成 `authenticator:PasswordAuthenticator`。测试默认帐号密码认证：

```
cqlsh –u cassandra –p cassandra
```

**修改loki配置**

```
  schema_config:
    configs:
    - from: 2018-04-15
      store: cassandra
      object_store: filesystem
      schema: v9
      index:
        prefix: cassandra_table
        period: 168h
  storage_config:
    cassandra:
      username: cassandra
      password: cassandra
      addresses: cassandra.kube-public #不需要配置端口，日志显示链接9042端口
      auth: true
      keyspace: lokiindex
    filesystem:
      directory: /data/loki/chunks #注意此处的数据也要保持，重启loki加载历史数据时会用到
```

**启动服务，cqlsh 查询**

```
describe tables;
use lokiindex;
describe table cassandra_table2589;
```



参考资料：

https://www.ibm.com/developerworks/cn/opensource/os-cn-apache-cassandra3x5/index.html

https://github.com/grafana/loki/blob/904bf2fcc9a0357c961893b72c2e28f3aa2146a9/docs/configuration/examples.md