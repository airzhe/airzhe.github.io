---
title: "grafana alerting 报警"
date: 2019-10-16 17:20:01
tags: [grafana,prometheus,报警]
share: true
---

使用工具：[prometheus](https://github.com/prometheus/prometheus)、[grafana](https://github.com/grafana/grafana)、[prometheus_client_php](https://github.com/endclothing/prometheus_client_php)

通过 prometheus-php-client 客户端暴露监控元信息，如下表示 order_notify 队列长度为90
```
# HELP payment_queue_length it sets
# TYPE payment_queue_length gauge
payment_queue_length{name="order_notify"} 90
```

被 prometheus 采集
![2](/img/grafana-alerting/2.png)
<!-- more -->

配置邮件报警规则(间隔5分钟发送一次)
![8](/img/grafana-alerting/8.png)

配置报警策略,关联邮件报警规则(每30m秒检查一次,报警触发后延迟1分钟后再通知,注意For参数和Conditions里的query时间单位要合理配置，一般设置相同。还要注意设置`no data`情况下的报警状态，防止当前时间点没有采集到数据报警)
![7](/img/grafana-alerting/7.png)

在grafana中展示（图中设置了值超过100的报警规则）
![3](/img/grafana-alerting/3.png)

手动修改队列长度为120,触发报警
![4](/img/grafana-alerting/4.png)

收到报警邮件
![5](/img/grafana-alerting/5.png)

解除报警
![6](/img/grafana-alerting/6.png)

邮件报警配置
```
[smtp]
enabled = true
host = smtp.exmail.qq.com:465
user = system@exmail.com
# If the password contains # or ; you have to wrap it with trippel quotes. Ex """#password;"""
password = ***********
;cert_file =
;key_file =
skip_verify = false
from_address = system@exmail.com
```

钉钉报警api
```
curl 'https://oapi.dingtalk.com/robot/send?access_token=762627b8d3fdfe3951dc***733e9e59ff59***7515c3' \
-H 'Content-Type: application/json' \
-d '{"msgtype": "text",
"text": {
	"content": "业务报警测试"
}
}
```

ldap  配置
```yaml
config: |-
    [[servers]]
    host = "10.0.0.1"
    port = 389
    use_ssl = false
    start_tls = false
    ssl_skip_verify = false
    bind_dn = "uid=auth,ou=users,dc=apple,dc=com"
    bind_password = "******"
    search_filter = "(uid=%s)"
    group_search_filter = "(&(objectClass=inetOrgPerson)(uid=%s))"
    search_base_dns = ["ou=users,dc=apple,dc=com"]
    [servers.attributes]
    name = "givenName"
    surname = "sn"
    username = "uid"
    email =  "mail"
```
