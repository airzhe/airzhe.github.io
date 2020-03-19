---
title: "MicroK8s 笔记"
description: ""
date: 2019-11-01 19:38:10
tags: [k8s,microk8s]
comments: false
share: true
---

MicroK8s是一种小型，快速，安全的单节点Kubernetes，几乎可以安装在任何Linux机器上。使用它进行脱机开发，原型制作，测试或在VM上用作CI / CD的小型，便宜，可靠的k8。对于设备来说，它也是一个很棒的k8-为k8开发您的IoT应用并将其部署到您的盒子上的MicroK8。

**修改默认镜像**

- 修改`/var/snap/microk8s/current/args/kubelet`。 添加`--pod-infra-container-image=s7799653/pause:3.1`
- 修改`/var/snap/microk8s/current/args/containerd-template.toml`的`plugins -> plugins.cri -> sandbox_image`为`s7799653/pause:3.1`
- 重启服务 `microk8s.stop`,`microk8s.start`

```
export PATH=$PATH:/snap/bin #临时写入
echo "export PATH=$PATH:/snap/bin" >> ~/.bashrc #永久写入
snap alias microk8s.kubectl kubectl
snap alias microk8s.ctr ctr
sudo usermod -a -G microk8s ${USER}
```

**dashboard**

```
microk8s.enable dns dashboard

token=$(microk8s.kubectl -n kube-system get secret | grep default-token | cut -d " " -f1)
microk8s.kubectl -n kube-system describe secret $token
```

**配置~/.kube/config**

```
microk8s.config
microk8s.kubectl config view --raw > $HOME/.kube/config
修改 user,name 为kubernetes-dashboard
修改 username,passwod 为token
```


**helm3**

```
helm install nginx bitnami/nginx
```

**prometheus**

```
* DaemonSet, Deployment, StatefulSet, and ReplicaSet resources will no longer be served from extensions/v1beta1, apps/v1beta1, or apps/v1beta2 by default in v1.16. Migrate to the apps/v1 API, available since v1.9. Existing persisted data can be retrieved/updated via the apps/v1 API.

persistentVolume
```

**常用命令**

```
$ microk8s.enable dashboard dns metrics-server registry istio
$ microk8s.ctr -n k8s.io images pull docker.io/library/cassandra:latest
$ microk8s.ctr -namespace k8s.io images rm docker.io/yandex/clickhouse-server:20 --sync
$ microk8s.ctr --namespace k8s.io images ls | grep -v @sha256 | awk '{print $1,$4$5}'
```

**nginx-ingress 部署的两种方式**

```
externalIPs: 
  - 192.168.2.12 #这是我的一台node的ip，通过kube-proxy监听
或者
hostNetwork: true
```

参考：

https://github.com/ubuntu/microk8s

https://www.jianshu.com/p/02fd2540fab2

https://github.com/projectatomic/containerd/blob/master/docs/cli.md

