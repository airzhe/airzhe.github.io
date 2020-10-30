---
title: "K3S"
description: ""
date: 2020-10-14 11:45:10
tags: [containerd,k3s]
comments: false
share: true
---


**在线安装**

```bash
curl -sfL https://docs.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
```

**离线安装**

```
#下载离线镜像
wget https://github.com/rancher/k3s/releases/download/v1.18.9%2Bk3s1/k3s-airgap-images-amd64.tar
docker load < k3s-airgap-images-amd64.tar

#下载k3s 可执行文件
wget https://github.com/rancher/k3s/releases/download/v1.18.9%2Bk3s1/k3s

#下载 install.sh
https://github.com/rancher/k3s/blob/master/install.sh

sudo mkdir -p /var/lib/rancher/k3s/agent/images/
#下载的离线镜像包复制，格式如下
#sudo cp ./k3s-airgap-images-$ARCH.tar /var/lib/rancher/k3s/agent/images/
sudo cp ./k3s-airgap-images-amd64.tar /var/lib/rancher/k3s/agent/images/

#授权
chmod 755 k3s
#下载的K3S的bin包，格式如下
sudo cp ./k3s /usr/local/bin && sudo chmod 755 /usr/local/bin/k3s

#授权
chmod +x ./install.sh
#跳过镜像下载，使用docker作为运行时
INSTALL_K3S_SKIP_DOWNLOAD=true  INSTALL_K3S_EXEC="--docker" ./install.sh

# 可能会遇到 k3s.server 换行引起的启动失败问题，修复后systemctl reload && systemctl start k3s
```

**设置`kubeconfig`文件**

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
chown runner:runner -R /etc/rancher/k3s/k3s.yaml
kubectl get pods --all-namespaces
helm ls --all-namespaces
```

**网络**

支持创建 [LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) 类型的 Service

**重启**

systemd 下手动重启：

```sh
sudo systemctl restart k3s
```

openrc 下手动重启：

```sh
sudo service k3s restart
```



 k3s默认使用containerd, 两者命令对比表：

| id   | containerd 命令                       | docker 命令                           | 备注                      |
| ---- | ------------------------------------- | ------------------------------------- | ------------------------- |
| 1    | ctr image ls                          | docker images                         | 获取image信息             |
| 2    | ctr image pull nginx                  | docker pull nginx                     | pull 一个nginx的image     |
| 3    | ctr image tag nginx nginx-test        | docker tag nginx nginx-test           | tag 一个nginx的image      |
| 4    | ctr image push nginx-test             | docker push nginx-test                | push nginx-test的image    |
| 5    | ctr image pull nginx                  | docker pull nginx                     | pull 一个nginx的image     |
| 6    | ctr image import nginx.tar            | docker load<nginx.tar.gz              | 导入本地镜像ctr不支持压缩 |
| 7    | ctr run -d --env 111 nginx-test nginx | docker run -d --name=nginx nginx-test | 运行的一个容器            |
| 8    | ctr task ls                           | docker ps                             | 查看运行的容器            |



参考:

https://docs.rancher.cn/k3s/

[k3s containerd和docker 命令对比](https://www.cnblogs.com/already/p/12691327.html)

[离线安装K3S](https://www.cnblogs.com/cooper-73/p/12923714.html)

[离线安装K3S Server](https://www.cnblogs.com/weschen/p/12666486.html)

