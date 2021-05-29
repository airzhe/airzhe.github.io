---
title: " 测试服务迁移k8s集群记录 (一)"
date: 2019-11-08 18:40:10
tags: [k8s,kubernetes,kube-adm,haproxy]
share: true
---

前言: 组内给了3台新机器，要把之前的服务全迁到新机器。共6个服务，2个在之前的 k8s 集群，其他4个在物理机。

已经迁移完成，记录下实施过程，大致分3步: 新 k8s 集群搭建、监控日志系统部署、业务服务迁移。

### k8s 集群搭建

因为是新机器，准备尝试下 k8s  master 高可用方案，运维给的3台机器信息如下，两个mastet 建立ssh 信任，服务规划参考老集群。

| 主机名        | IP        | 角色     | 服务        |
| ------------- | --------- | -------- | ----------- |
| soa-test-a001 | 172.2.5.4 | master01 | 监控、日志  |
| soa-test-a002 | 172.2.5.5 | master02 | CI、Ingress |
| soa-test-a003 | 172.2.5.6 | node01   | 业务服务    |

只有两台master， 我们使用的是堆叠式 etcd 拓扑结构，如图：

![kubeadm-ha-topology-stacked-etcd](/img/k8s/5.svg)机器已经安装 docker ，直接开始使用 kubeadm 安装 k8s 
<!-- more -->

**安装 kubeadm**

```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]

name=Kubernetes

baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/

enabled=1

gpgcheck=1

repo_gpgcheck=1

gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg

EOF

setenforce 0
yum install -y kubelet kubeadm kubectl
systemctl enable kubelet && systemctl start kubelet
```

**生成初始化 kubeadm 配置文件**

```
kubeadm config print init-defaults > kubeadm-config.yaml
```

使用 master01: 6444 做 api负载，修改如下：

```
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 172.2.5.4 #master01机器ip
  bindPort: 6443 #apiServer运行的端口
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: soa-test-a001
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controlPlaneEndpoint: 172.2.5.4:6444 #控制面板api端口，用来做api负载均衡
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers #改为阿里云仓库
kind: ClusterConfiguration
kubernetesVersion: v1.16.0
networking:
  dnsDomain: cluster.local
  podSubnet: 10.244.0.0/16 #pod网络配置
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

开始安装，由于使用阿里镜像地址，安装较快，默认是 最新版 1.16.2

```
kubeadm init --config=kubeadm-config.yaml --upload-certs | tee kubeadm-init.log
```

**calico 网络：**

```
kubectl apply -f https://docs.projectcalico.org/master/manifests/calico.yaml
```

**master02加入集群**

```
kubeadm join 172.2.5.4:6444 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:ee24d007b3eb73******bc7385528dcc549105b1e54642d82b7f23f718 \
    --control-plane --certificate-key febdcefffebcfe60c6******5680f1110a4073ebd1e5c578c5c02a897
```

测试 master02 是否提供服务，可以修改master02 上的 ~/.kube/config 文件，修改server 为本机 ip + 6443端口，执行kubectl get nodes 成功，说明master02 同样提供 apiServer 功能。

**haproxy 做负载**

```
frontend kube-api-balance
    bind *:6444
    maxconn 30000                    #定义此端口上的maxconn
    default_backend default_servers  #请求定向至后端服务群default_servers

backend default_servers    #定义后端服务群default_servers
    balance roundrobin
    server def.srv1 172.2.5.4:6443
    server def.srv2 172.2.5.5:6443
```

运行haproxy

```
docker run -d \
    --network=host \
    --restart=always \
    -v /root/sh/haproxy.cfg:/etc/haproxy/haproxy.cfg \
    --name haproxy \
    haproxy -f /etc/haproxy/haproxy.cfg
```

顺便贴下使用 nginx 转发配置

```
stream {
        server {
                listen     6444;
                proxy_pass stream_backend;
        }
        upstream stream_backend {
                server 172.2.5.4:6443;
                server 172.2.5.5:6443;
        }

}
```
遗憾的是这里并没有使用 keepalived 对ip做高可用 :( 


### Dashboard 安装

主要参考[安装dashboard](https://www.cnblogs.com/bluersw/p/11747161.html )，之前使用的1.10版，新版提示更友好，资源编辑更方便。贴一下 `kube-config` 的生成，我们用这个文件来登录 dashboard

```
kubectl config view --raw=true > kube-config
```

使用一个有权限的 serviceAccount 来配置，contexts 部分修改 user 为 serviceAccount name，users 部分，修改 name ，增加 token 认证。注意 token:  后面是一个空格，非换行

```
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: lGSUNBVE******UtLS0tLQo=
    server: https://172.2.5.4:6444
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: dashboard-admin  #改为serviceAccount
  name: kubernetes-admin@kubernetes
current-context: kubernetes-admin@kubernetes
kind: Config
preferences: {}
users:
- name: dashboard-admin  #改为serviceAccount
  user:  #使用token 认证
    token: eyJhbGciOiJSUzI******LdK0kpfSw
```

截图：

![6.png](/img/k8s/6.png)

**遇到的问题：**

遇到最大的问题是 在 master02 上执行 命令，延时5秒才返回，在上面起的pod，访问外网总提示超时，后来用kube-adm reset 了下，再次加入集群，莫名好了 -__-



本篇就写到这，后面会更新监控、日志的安装，已经使用 gitlab runner + helm3 来部署服务.



**参考：**
https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/
https://blog.csdn.net/networken/article/details/89599004
https://www.kubernetes.org.cn/5551.html
安装dashboard:
https://www.cnblogs.com/bluersw/p/11747161.html 
scp 信任:
https://www.cnblogs.com/mchina/archive/2013/03/15/2956017.html 
kubeadm join 使用的 token 过期之后，如何加入集群:
https://blog.csdn.net/wo18237095579/article/details/89884369 

