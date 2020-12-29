---
title: "core-dns使用"
date: 2019-10-16 17:58:10
tags: [coredns,etcd]
share: true
---

**core-dns-conf 配置**
```
. {
    forward . 8.8.8.8
    log
    hosts {
        10.111.8.170 www.sms.service
        ttl 60
        reload 1m
        fallthrough
    }
}
```

**docker 方式启动**
```shell
sudo systemctl stop systemd-resolved
docker run -d \
    --net="host" \
    -v /etc/hosts:/etc/hosts \
    -v /etc/resolv.conf:/etc/resolv.conf \
    -v /home/runner/work/coredns/core-dns/etc/core-dns-conf:/etc/core-dns-conf \
    --name core-dns \
    coredns/coredns -conf /etc/core-dns-conf
```

**使用etcd做服务发现**

```
https://www.cnblogs.com/leffss/p/10148507.html
etcdctl put /coredns/net/apple/t1/a '{"host":"10.111.8.185","ttl":30}'

$ ETCDCTL_API=3 
./etcdctl put /skydns/com/example/services/users \
'{"host": "192.0.2.10","port ": 20020,"priority": 10,"weight": 20}'
OK
$ ETCDCTL_API=3 
./etcdctl get /skydns/com/example/services/users
/skydns/com/example/services/users
{"host": "192.0.2.10","port": 20020,"priority": 10,"weight": 20}

. {
    etcd {   # 配置启用etcd插件,后面可以指定域名,例如 etcd test.com {
        stubzones # 启用存根区域功能。 stubzone仅在位于指定的第一个区域下方的etcd树中完成
        path /coredns # etcd里面的路径 默认为/skydns，以后所有的dns记录就是存储在该存根路径底下
        endpoint http://172.16.101.209:2379 # etcd访问地址，多个空格分开

        # upstream设置要使用的上游解析程序解决指向外部域名的在etcd（认为CNAME）中找到的外部域名。
        upstream 8.8.8.8:53 8.8.4.4:53

        fallthrough # 如果区域匹配但不能生成记录，则将请求传递给下一个插件
        # tls CERT KEY CACERT # 可选参数，etcd认证证书设置
    }
    prometheus  :9153 # 监控插件
    cache 160
    loadbalance   # 负载均衡，开启DNS记录轮询策略
    forward . 8.8.8.8:53 8.8.4.4:53 # 上面etcd未查询到的请求转发给设置的DNS服务器解析
    log # 打印日志
}
```

对于传统的DNS服务器（例如BIND），管理员通常将主区域数据作为文件进行管理。 最近，DNS服务器已开始支持从其他来源（例如数据库）加载主区域数据。

```
docker run --rm -u $(id -u):$(id -g) -v $PWD:/go golang:1.12 \
    /bin/bash -c \
    "git clone https://github.com/coredns/coredns.git && \
    cd coredns && \
    git checkout v1.5.0"
```

