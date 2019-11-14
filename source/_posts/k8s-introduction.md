---
layout: post
title: "k8s 介绍"
description: ""
date: 2019-01-31
tags: [docker,k8s,kubernetes]
comments: false
share: true
---
## Kubernetes

Kubernetes是一个开源的_用于管理云平台中多个主机上的容器化的应用_Kubernetes的目标是让部署容器化的应用简单并且高效_powerful__Kubernetes提供了应用部署_规划_更新_维护的一种机制


## 架构
![image](/img/k8s/1.png)


集群中的机器划分为一个Master 节点和一群工作节点(Node)

Master 节点，由三个紧密协作的独立组件组合而成，它们分别是负责 API 服务的 **kube-apiserver**、负责调度的 **kube-scheduler**，以及负责容器编排的 **kube-controller-manager**。整个集群的持久化数据，则由 kube-apiserver 处理后保存在 **Ectd** 中。

node上运行着 kubelet、kube-proxy服务进程，负责pod的创建、启动、监控、重启、销毁、以及实现软件模式的负载均衡器。

在 Kubernetes 项目中，kubelet 主要负责同容器运行时（比如 Docker 项目）打交道，只要你的这个容器运行时能够运行标准的容器镜像，它就可以通过实现 **CRI** 接入到 Kubernetes 项目当中。(比如 rkt)

而kubelet 的另一个重要功能，则是调用网络插件和存储插件为容器配置网络和持久化存储。
<!-- more -->

#### kubernetes 核心概念
![image](/img/k8s/2.png)



## 概念


## Namespace

Namespace 通过将系统内部的对象“分配”到不同的Namespace中，形成逻辑上分组的不同项目、小组或用户组，便于不同的分组在共享使用整个集群的资源的同时还能被分别管理

**ResourceQuota**

Resource Quotas（资源配额，简称quota）是对namespace进行资源配额，限制资源使用的一种策略.

| 字符串                      | API对象                  |
| ------------------------ | ---------------------- |
| "pods"                   | Pod                    |
| "services                | Service                |
| "replicationcontrollers" | ReplicationController  |
| "resourcequotas"         | ResourceQuota          |
| "secrets"                | Secret                 |
| "configmaps"             | ConfigMap              |
| "persistentvolumeclaims" | PersistentVolumeClaim  |
| "services.nodeports"     | NodePort类型的Service     |
| "services.loadbalancers" | LoadBalancer类型的Service |


## label

label 和 labelSelctor 是 k8s 中的只要分组机制

Kubernetes目前支持两种类型的Label Selector：

- 基于等式的Selector（Equality-based）
- 基于集合的Selector（Set-based）


## Pod

Pod是k8s的最基本的操作单元，包含一个或多个紧密相关的容器，类似于豌豆荚的概念。

为什么k8s使用Pod在容器之上再封装一层呢？

#### Pod 中几个重要字段的含义和用法

1. NodeSelector： 是一个供用户将 Pod 与 Node 进行绑定的字段
2. NodeName：一旦 Pod 的这个字段被赋值，Kubernetes 项目就会被认为这个 Pod 已经经过了调度
3. HostAliases：定义了 Pod 的 hosts
4. ImagePullPolicy： 的值默认是 Always，即每次创建 Pod 都重新拉取一次镜像，而如果它的值被定义为 Never 或者 IfNotPresent，则意味着 Pod 永远不会主动拉取这个镜像，或者只在宿主机上不存在这个镜像时才拉取。
5. Lifecycle 字段。它定义的是 Container Lifecycle Hooks 是在容器状态发生变化时触发一系列“钩子。



#### Pod 具体的创建步骤包括：

![images](/img/k8s/3.jpg)

1. 客户端提交创建请求，可以通过API Server的Restful API，也可以使用kubectl命令行工具。支持的数据类型包括JSON和YAML。
2. API Server处理用户请求，存储Pod数据到etcd。
3. 调度器通过API Server查看未绑定的Pod。尝试为Pod分配主机。
4. 过滤主机 (调度预选)：调度器用一组规则过滤掉不符合要求的主机。比如Pod指定了所需要的资源量，那么可用资源比Pod需要的资源量少的主机会被过滤掉。
5. 主机打分(调度优选)：对第一步筛选出的符合要求的主机进行打分，在主机打分阶段，调度器会考虑一些整体优化策略，比如把容一个Replication Controller的副本分布到不同的主机上，使用最低负载的主机等。
6. 选择主机：选择打分最高的主机，进行binding操作，结果存储到etcd中。
7. kubelet根据调度结果执行Pod创建操作： 绑定成功后，scheduler会调用APIServer的API在etcd中创建一个boundpod对象，描述在一个工作节点上绑定运行的所有pod信息。运行在每个工作节点上的kubelet也会定期与etcd同步boundpod信息，一旦发现应该在该工作节点上运行的boundpod对象没有更新，则调用Docker API创建并启动pod内的容器。
   ​


Pod模板是pod规范，包含在其他对象中，例如 [Replication Controllers](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/)，[Jobs](https://kubernetes.io/docs/concepts/jobs/run-to-completion-finite-workloads/)和 [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)


pod 也支持host网络的设置，如spec->hostNetwork=true



**Pause Container**

每个pod 里运行着一个特殊的被称为
Pause 的容器(业务无关且不容易死亡)，其他容器则为业务容器，业务容器共享 Pause 容器的网络栈和Volume挂载卷，创建pod 会自动创建 pause容器。每个pod 都被分配一个唯一的ip地址。


可以通过api手动管理pod，也可以委托给控制器来管理pod。



**Init Container**

在 Pod 中，所有 Init Container 定义的容器，都会比 spec.containers 定义的用户容器先启动。

比如，在我们的这个应用 Pod 中，Tomcat 容器是我们要使用的主容器，而 WAR 包容器的存在，只是为了给它提供一个 WAR 包而已。所以，我们用 Init Container 的方式优先运行 WAR 包容器，扮演了一个 sidecar 的角色



## Service

一个service 对象拥有如下关键特征
拥有一个虚拟ip(Cluster ip 、Service ip 或 Vip)和端口号

通过 label selector 筛选关联 pod

创建好service 后集群中其他新创建的pod就可以通过service 的Cluster ip+端口号来连接和访问它了



spec 
type=NodePort 和nodePort=30001的两个属性，表明service开启了NodePort方式的外网访问模式

port
targetPort 默认与pord 相同



## API Server

kubernets Api Server 本身也是一个Service，它的名字就是  ”kubernets“.

组件之间的所有操作和通信均由API Server处理的REST API调用.

API Server 负责和 /etcd 交互（其他组件不会直接操作 etcd，只有 API Server 这么做），是整个 kubernetes 集群的数据中心，所有的交互都是以 API Server 为核心的。简单来说，API Server 提供了一下的功能：

- 整个集群管理的 API 接口：所有对集群进行的查询和管理都要通过 API 来进行
- 集群内部各个模块之间通信的枢纽：所有模块之前并不会之间互相调用，而是通过和 API Server 打交道来完成自己那部分的工作
- 集群安全控制：API Server 提供的验证和授权保证了整个集群的安全

**kubectl客户端**

命令行工具kubectl客户端，通过命令行参数转换为对API Server的REST API调用，并将调用结果输出。



**kubelet与API Server交互**

每个Node节点上的kubelet定期就会调用API Server的REST接口报告自身状态，API Server接收这些信息后，将节点状态信息更新到etcd中。kubelet也通过API Server的Watch接口监听Pod信息，从而对Node机器上的POD进行管理。

| 监听信息             | kubelet动作          | 备注   |
| ---------------- | ------------------ | ---- |
| 新的POD副本被调度绑定到本节点 | 执行POD对应的容器的创建和启动逻辑 | -    |
| POD对象被删除         | 删除本节点上相应的POD容器     | -    |
| 修改POD信息          | 修改本节点的POD容器        | -    |

**kube-controller-manager与API Server交互**

kube-controller-manager中的Node Controller模块通过API Server提供的Watch接口，实时监控Node的信息，并做相应处理。

**kube-scheduler与API Server交互**

Scheduler通过API Server的Watch接口监听到新建Pod副本的信息后，它会检索所有符合该Pod要求的Node列表，开始执行Pod调度逻辑。调度成功后将Pod绑定到目标节点上

**Watch API**

Watch API其实就是一种GET请求，只是在query参数里面加了watch。kube-apiserver那边接受到用户的client请求后，可以通过两种方式发送watch event，一种是通过websocket协议发送，另一种就是通过Transfer-Encoding=chunked的方式建立一个长连接，然后发送watch event



## Controller Manager

controller manager是集群内部控制中心，负责集群内的node，pod，服务端点，服务，资源配额，命名空间，服务账号等资源的管理、自动化部署健康监测，异常修复，确保个资源始终处于预期的工作状态。
controller manager 是一个控制器集合包含：rc，node controller，resourcequota controller，namespace conttoller，token 
controller，service controller，endpoint controller，serviceaccount controller。

控制器核心工作原理是，每个控制器通过api服务器来查看系统运行状态，并尝试从将系统状态从“现有状态”修正到“期望状态”



#### k8s RC(Replication Controller)

RC 的定义包含如下几个部分：
pod 期待的副本数
用于筛选目标pod的 Label Selector
当pod副本数小于预期时，用于创建新pod的pod模板

 Replica Set

官方解释为“下一代的RC”
唯一区别是Replica Sets支持基于集合的Label selector 而RC 只支持基于等式的

Replica Set 很少单独使用，主要被Deployment 这个更高级的资源对象所使用

Replica Set 和 Deployment 逐步替换了之前RC 的作用



#### Deployment Controller

扩容:

**使用场景**：

1. 重新调度
2. 弹性伸缩
3. 滚动更新

使用场景有以下几个：
创建Deployment对象来生产对应 Replica Set 并完成 Pod 副本的创建过程
检查Deployment 的状态来看部署是否完成(pod数量是否达到预期值)
更新Deployment 以创建新pod 比如镜像升级
回滚早先 Deployment 版本
暂停修改 
查看Deployment的状态，以此作为发布是否成功的指标


#### ResourceQuota Controller

目前 k8s 支持 三个层次的资源配额管理

1. 容器级别 ，可以对 cpu ，memory 进行限制

2. Pod 级别，对pod内所有容器进行资源限制

3. Namespace 级别，对Namespace(多租户)级别的资源限制，包括：
   - pod 数量
   - service 数量
   - resourceQuota 数量 等

**Endpoints Controller** 检测到pod的事件，则会更新对应Service 的Endpoints

#### Job Controller && CronJob Controller

Job Controller 控制的对象，直接就是 Pod。

#### DeamonSet controller



## Scheduler


scheduler 的作用是将待调度的 pod（新建的pod，rs为补足副本而创建的pod等）按照待定的调度算法和调度策略绑定（Binding)到集群中的某个合适的Node上，并将绑定信息写入 etcd。

整个过程涉及三个对象：**待调度pod列表**(podQueue)，**可用node列表**，以及**调度算法和调度策略**.

![image](/img/k8s/4.png)


1）通过调度算法为待调度Pod列表的每个Pod从Node列表中选择一个最适合的Node，并将信息写入etcd中

2）kubelet通过API Server监听到kubernetes Scheduler产生的Pod绑定信息，然后获取对应的Pod清单，下载Image，并启动容器。



#### 调度资源监听

`kube-apiserver` 提供了一套 `Watch` 机制给 `kubelet`、`kube-controller-manager`、 `kube-scheduler` 等组件用来监控各种资源(Pod、Node、Service等)的变化，类似于消息中间件里的发布-订阅模式（Push）， `kube-apiserver` 能够**主动通知**这些组件。



#### 调度节点分配：

调度分为几个部分：首先是过滤掉不满足条件的节点，这个过程称为预选（ predicate）；然后对通过的节点按照优先级排序，这个是优选（ priority）；最后从中选择优先级最高的节点。如果中间任何一步骤有错误，就直接返回错误。

predicate 有一系列的算法可以使用：

- `PodFitsResources`：节点上剩余的资源是否大于 pod 请求的资源
- `PodFitsHost`：如果 pod 指定了 NodeName，检查节点名称是否和 NodeName 匹配
- `PodFitsHostPorts`：节点上已经使用的 port 是否和 pod 申请的 port 冲突
- `PodSelectorMatches`：过滤掉和 pod 指定的 label 不匹配的节点
- `NoDiskConflict`：已经 mount 的 volume 和 pod 指定的 volume 不冲突，除非它们都是只读

如果在 predicate 过程中没有合适的节点，pod 会一直在 `pending` 状态，不断重试调度，直到有节点满足条件。经过这个步骤，如果有多个节点满足条件，就继续 priorities 过程：
按照优先级大小对节点排序。

优选（ priority)

优先级由一系列键值对组成，键是该优先级项的名称，值是它的权重（该项的重要性）。这些优先级选项包括：

- `LeastRequestedPriority`：通过计算 CPU 和 Memory 的使用率来决定权重，使用率越低权重越高。换句话说，这个优先级指标倾向于资源使用比例更低的节点
- `ImageLocalityPriority`：倾向于已经有要使用镜像的节点，镜像总大小值越大，权重越高

通过算法对所有的优先级项目和权重进行计算，得出最终的结果。为待调度的 Pod 分配一个 Node ，同时将分配结果通过 `kube-apiserver` 写入 `etcd`；



#### 调度策略

**NodeSelector**

`nodeSelector` 是最简单的控制方式。 `nodeSelector` 是 PodSpec 中的一个字段，它指定了键-值对的映射。如果想要 pod 能够运行在某个 node 上，那么这个 node 必须具有所有指定的键-值对的标签（node 也能拥有其它标签）。

列出 node 的时候指定 `--show-labels` 参数就能查看 node 都添加了哪些 label：


除了自己定义的 label 之外，kubernetes 还会自动给集群中的节点添加一些 label，比如：

- `kubernetes.io/hostname`：节点的 hostname 名称
- `beta.kubernetes.io/os`： 节点安装的操作系统
- `beta.kubernetes.io/arch`：节点的架构类型

除了设置Node Selector之外，还可以通过Node Name 直接指定Node，但还是**建议使用Node Selector**，label进行选择是一种弱绑定，直接指定Node Name是强绑定，Node失效时会导致Pod无法调度。



**亲和性**特性包含了两种类型的亲和性，”node 亲和性” 和 “pod 间的亲和性/反亲和性”，Pod 间以 pod 标签作为约束。



**亲和性调度（Affinity）**

Node Affinity

- 硬亲和性：requiredDuringSchedulingIgnoredDuringExecution
- 软亲和性：preferredDuringSchedulingIgnoredDuringExecution 
   - 如果一个 node 的标签在运行时发生改变，从而导致 pod 的亲和性规则不再被满足时，pod 也仍然会继续运行在 node 上。


Pod Affinity

- 硬亲和性：requiredDuringSchedulingIgnoredDuringExecution 
- preferredDuringSchedulingIgnoredDuringExecution

**反亲和性（Anti-affinity）**



**Taint 和 toleration** （比如label idc=idc1,比如GPU资源）

```
#添加一个 taint
kubectl taint nodes node1 key=value:NoSchedule
#这个 taint 的 key 为 key 且 value 为 value，并且这个 taint 的作用是 NoSchedule
```

PodSpec 指定一个 toleration

```
tolerations: 
- key: key
  operator: Exists
  value: value
  effect: NoSchedule
```

PreferNoSchedule （软亲和性）



## kubelet

在kubernetes集群中，每个Node节点都会启动kubelet进程，用来处理Master节点下发到本节点的任务，管理Pod和其中的容器。kubelet会在API Server上注册节点信息，定期向Master汇报节点资源使用情况，并通过cAdvisor监控容器和节点资源。可以把kubelet理解成【Server-Agent】架构中的agent，是Node上的pod管家。

**容器健康检查**

提供Probe 机制，以更精确的判断Pod和容器：
**Liveness Prode** ：用于容器的自定义健康检查，如果检查失败，将杀死容器，然后根据pod的重启策略了来决定是否重启容器。还可以指定initialDelaySeconds，用于确定状态检查的宽限期，以便容器执行必要的初始化。
**Readiness Probe** ：如果检查失败，会将该pod 从服务代理的分发后端去除，不再发送请求给pod。

目前有三种类型检查方式
Http 健康检查 ：返回200～399认为成功
Container Exec：容器内执行命令，状态0退出，则视为成功
Tcp：如果可以建立连接则认为成功，否则失败。



**资源上报**

继承 cAdvisor 定时上报节点信息

健康检查监视器由kubelet 代理



#### kube-proxy

Service 在很多情况下知识一个概念，而真正将Service 的作用落实的是背后的 kube-proxy服务进程。

在k8s 集群的每个Node上都会运行一个 kube-proxy 服务进程，可以看作Service 的透明代理兼负载均衡器，核心是讲到某个 service 的访问请求转移到后端的多个pod 实例上。

由于iptables 机制针对的是本都的kube-proxy端口，所以每个Node上都要运行 kube-proxy 组件，这样，在集群内部，我们可以再任意Node上发起对 Service 的访问请求。

kube-proxy  更新iptables 会在本机的 **Iptables** 的NAT表中添加4条规则链路。

1. 从容器中通过 serviceClusterIp 和端口访问Service 的请求
2. 从主机中通过ServiceClusterIp和端口访问Service的请求
3. 从容器中通过 Service 的NodePort 端口访问Service的请求
4. 从主机中通过Service 的NodePort 端口号访问Service的请求


运行在每个Node 上的kube-proxy进程其实就是一个智能的软件负载均衡器。

简单的网络代理和负载均衡器，负责Service的实现：实现从Pod到Service，以及NodePort向Service的访问。

采用 iptables 来实现LB
实现方式：
kube-proxy 监控服务/端点增删改，对每个服务配置ipitables规则，捕获Service 的ClusterIp 和端口的流量，并将流量重定向到服务的后端之一。默认后端的选择是随机的,可以设置基于客户端ip的会话关联。

默认通过iptables来配置对应的NAT转发，自身不再参与转发过程。



## yaml配置

Deployment yaml

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
        resources:
           requests:
             cpu: 0.05
             memory: 16Mi
```

Service yaml

```
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  type: NodePort
  selector:
      app: nginx
  ports:
      - protocol: TCP
        port: 8881
        targetPort: 80
```

#### 部分命令

```
kubectl get  all  --all-namespaces=true
kubectl describe ***
kubectl get pods -n kube-system
kubectl apply -f  *.yaml
kubectl get *** -o yaml
kubectl edit deployment.apps/nginx-deployment
kubectl exec ${POD_NAME} -c ${CONTAINER_NAME} -- ${CMD} ${ARG1} ${ARG2} ... ${ARGN}
```


