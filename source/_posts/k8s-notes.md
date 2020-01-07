---
title: "k8s 笔记"
description: ""
date: 2019-02-01 19:38:10
tags: [k8s,kubernetes]
comments: false
share: true
---

**k8s 容器出现大量 Evicted**

```
$kubectl describe node/runner-e480

Normal   NodeHasNoDiskPressure    6m19s (x8 over 6m19s)  kubelet, runner-e480     Node runner-e480 status is now: NodeHasNoDiskPressure

df -h 系统盘使用85%

修改了docker 镜像存储路径
https://blog.csdn.net/glongljl/article/details/80158297

参考:
https://blog.csdn.net/qq_21816375/article/details/82905660
```

### k8s 命令

```
#命令行自动补全
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc

kubectl get sa --all-namespaces=true
kubectl get roles --all-namespaces=true
kubectl get RoleBinding  --all-namespaces=true
kubectl get secrets --all-namespaces=true
kubectl describe  ClusterRole/cluster-admin


#端口转发 本地2000端口映射到容器3000端口 &……& 目前只能用localhost访问
export POD_NAME=$(kubectl get pods --namespace default -l "app=grafana,release=willing-lamb" -o jsonpath="{.items[0].metadata.name}")
kubectl port-forward willing-lamb-grafana-75d49cb58c-7dn6d 2000:3000


kubectl get secrets -o json | kubectl update -f -

kubectl exec POD_NAME -c CONTAINER_NAME reboot
kubectl exec -it [POD_NAME] -c [CONTAINER_NAME] -- /bin/sh -c "kill 1"

kubectl explain namespace

kubectl get ns default --show-labels
kubectl completion -h

kubectl delete pod deviosow-1828 --namespace=kube-system --grace-period=0 --force

docker images | grep '<none>'| awk '{print $3}' | xargs docker rmi
kubectl -n kube-system get endpoints -o wide

#dns 验证
kubectl run curl --image=radial/busyboxplus:curl -it
nslookup docker-dind-svc.gitlab-managed-apps


#使用命令快速创建 deployment 和 service
kubectl run nginx --image=nginx --replicas=2
kubectl expose deployment nginx --port 80 --external-ip 172.17.8.201

node 上使用 k8s 的core-dns 服务
dig @10.152.183.10 grafana.istio-system.svc.cluster.local

```


**RBAC**

```
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: example-sa
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: example-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: example-rolebinding
  namespace: default
subjects:
- kind: ServiceAccount
  name: example-sa
  namespace: default
roleRef:
  kind: Role
  name: example-role
  apiGroup: rbac.authorization.k8s.io
  
---
#管理员，角色配置可以参考 kubectl describe  ClusterRole/cluster-admin
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: example-role
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
  
serviceAccountName
serviceAccount #pod请求别的命名空间时的帐号

Error: release community-feature-haozhe-wei failed: namespaces "php-sht" is forbidden: User "system:serviceaccount:gitlab-managed-apps:default" cannot get resource "namespaces" in API group "" in the namespace "php-sht"

更新密钥要小心，因为帐号token会被其他服务关联，比如 tiller account
```

**跨namespace授权 **

```
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: gitlab
  name: gitlab-view-role
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: gitlab-view-php-sht-rolebinding
  namespace: gitlab
subjects:
- kind: ServiceAccount
  name: admin
  namespace: php-sht
roleRef:
  kind: Role
  name: gitlab-view-role
  apiGroup: rbac.authorization.k8s.io
```

**角色**

```
admin
maintainer
developer
guest/reporter
```

### Pod

```
每个 pod 都以mount形式挂载这个 默认的Servcice Account，
如：mountPath": "/var/run/secrets/kubernetes.io/serviceaccount"

单独的pod，恢复过程永远发生在当前节点，不会跑到别的节点上去。如果你想让Pod出现在其他的可用节点上，就必须使用 deployment 这样的控制器来管理 pod，哪怕你只需要一个 pod 副本。

可以通过restartPolicy，改变pod的恢复策略

selector 意味着后面这些追加的定义，只会作用于 selector 所定义的，带有"role:frontend"标签的Pod对象

command: ["sh","-c","mkdir /var/www/html ; ln -s /var/www/community/public /var/www/html/public ; nginx -g 'daemon off;'"]

#多行配置
env:
    - name: COMMAND_SCRIPT
      value: |-
        set -xeo pipefail
        helm init --upgrade
        for i in $(seq 1 30); do helm version && break; sleep 1s; echo "Retrying ($i)..."; done
        helm repo add runner https://charts.gitlab.io
        helm repo update
        helm upgrade runner runner/gitlab-runner --install --reset-values --tls --tls-ca-cert /data/helm/runner/config/ca.pem --tls-cert /data/helm/runner/config/cert.pem --tls-key /data/helm/runner/config/key.pem --version 0.4.1 --set rbac.create\=true,rbac.enabled\=true --namespace gitlab-managed-apps -f /data/helm/runner/config/values.yaml


apiVersion: v1
kind: Pod
metadata:
  name: nginx-privileged
spec:
  containers:
    - name: nginx-privileged
      image: nginx:1.14.2
      securityContext:
        privileged: true
        runAsUser: 1000 #指定容器运行账户
      
      

pod 的操作只有创建删除

"hostAliases": [
          {
            "ip": "172.16.101.197",
            "hostnames": [
              "prometheus.local.com"
            ]
          }
]

pod 的标签很很重要，loki用来建立索引，prometheus可以用来指定报警分组.
```

**TLS**

```
curl https://192.168.207.237:2376/info --cert ./cert.pm --key ./key.pem  --cacert ./ca.pem
kubectl create secret tls tls-secret --cert=path/to/tls.cert --key=path/to/tls.key
```

**Namspace**

```
pv 不属于 namespace 
pvc 属于
```

**Label** and Annotations 注释 可以用来检索

```
#标签一定要有 key 可以没有 value
kubectl label/annotate <resource> foo=bar
kubectl label/annotate <resource> foo-
```

### 健康检查

```
livenessProbe:
  - initialDelaySeconds:5 #容器启动5s后开始执行
    periodSeconds:5 #每5s执行一次

readlinessProbe: #健康检查结果决定这个pod是不是能被通过Service的方式访问到，而并不影响Pod的生命周期
```

### ConfigMap Secret Downard Api

```

这三种Project Volume 定义的信息，还可以通过环境变量的方式出现在容器里。但环境变量不具备自动更新的能力。所以一般情况下，都建议你好似用 Volume 文件的方式获取这些信息。

projected volume可以映射很多volume源到相同的目录下

#从配置文件生成 configmap
<?php
$c=file_get_contents("conf.php");
echo json_encode($c,JSON_UNESCAPED_UNICODE)."\n";
```

### k8s  node 节点加入集群

```
kubeadm join 172.16.101.197:6443 --token vq0fs8.rzcw1lf6k3lz7986     --discovery-token-ca-cert-hash sha256:68c8228227ae029b091c8d6cdecde4c11ec5dbbbd43fa725060ffdd512fef3cd

节点需要关闭 swap 启动docker服务


还需要下载
k8s.gcr.io/pause:3.1 镜像
k8s.gcr.io/kube-proxy 镜像

在 master节点观察子节点pod创建情况

移除节点:
kubectl delete node node-1
```

### PV

```
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-local-pv0
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - php-cd-node
```

**redis**

```
   kubectl run --namespace kube-public redis-client --rm --tty -i --restart='Never' \
    --env REDIS_PASSWORD=$REDIS_PASSWORD \
   --image docker.io/bitnami/redis:5.0.5-debian-9-r36 -- bash
```

### 映射外部服务

```
apiVersion: v1
kind: Service
metadata:
  name: ldap-chang-password
  namespace: kube-system
spec:
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP

---

apiVersion: v1
kind: Endpoints
metadata:
  name: ldap-chang-password
  namespace: kube-system
subsets:
  - addresses:
    - ip: 10.111.8.166
    ports:
    - port: 8080
      protocol: TCP

---

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: uic
  namespace: kube-system
spec:
  rules:
  - host: uic.t1.youhaodongxi.com
    http:
      paths:
      - backend:
          serviceName: ldap-chang-password
          servicePort: 80
        path: /
```



**API权限**

```
https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/

APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $(kubectl get serviceaccount default -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode )
curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
{
  "kind": "APIVersions",
  "versions": [
    "v1"
  ],
  "serverAddressByClientCIDRs": [
    {
      "clientCIDR": "0.0.0.0/0",
      "serverAddress": "10.0.1.149:443"
    }
  ]
}

```



**how-to-create-a-kubectl-config-file-for-serviceaccount**

```
https://stackoverflow.com/questions/47770676/how-to-create-a-kubectl-config-file-for-serviceaccount
```



**create-kubectl-by-user**

```
https://docs.bitnami.com/kubernetes/how-to/configure-rbac-in-your-kubernetes-cluster/
```



**同一个service开2个端口**

一般我们只有一个端口的时候，在service的yaml文件：

```
ports:
  - nodePort: 8482
    port: 8080
    protocol: TCP
    targetPort: 8080
```

而如果你想开两个端口，直接复制粘贴可不行，k8s会提示你必须要加上name。所以,如果要开多端口，要为每个port都指定一个name，如：

```
ports:
  - name: http
    nodePort: 8482
    port: 8080
    protocol: TCP
    targetPort: 8080
```
