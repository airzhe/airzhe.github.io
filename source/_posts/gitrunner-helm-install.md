---
title: "helm安装gitrunner"
date: 2019-10-16 17:52:10
tags: [gitrunner,helm]
share: true
---

**gitrunner**


```
#下载包
helm repo add gitlab https://charts.gitlab.io
helm pull gitlab/gitlab-runner --untar

#打标签
kubectl get nodes --show-labels 
kubectl label nodes node-a002 ci=true

安装gitlab-runner
helm upgrade gitlab-runner-01 --install --namespace gitlab \
--set checkInterval=2 \
--set runners.image=alpine:latest --set runners.imagePullPolicy=if-not-present --set runners.tags=k8s-01 \
--set gitlabUrl=http://gitlab.******.net/,runnerRegistrationToken=AxwjhfK7bb8eDCs5PN --set runners.privileged=true \
--set gitRunnerCacheDir=/volume \
--set nodeSelector.ci=true \
.
```

**mount 目录** 

在configmap.yaml 里 entrypoint 最后增加

```
{{ if .Values.gitRunnerCacheDir }}
    cat >>/home/gitlab-runner/.gitlab-runner/config.toml <<EOF
      [[runners.kubernetes.volumes.host_path]]
        name = "git-runner-cache"
        mount_path = {{ .Values.gitRunnerCacheDir | quote }}
        host_path  = {{ .Values.gitRunnerCacheDir | quote }}
    EOF
{{- end }}
```

提示没有权限创建job
```
ERROR: Job failed (system failure): pods is forbidden: User "system:serviceaccount:gitlab:default" cannot create resource "pods" in API group "" in the namespace "gitlab"
```

添加权限绑定
```
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: gitlab
  name: gitlab-admin-role
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: gitlab-admin-rolebinding
  namespace: gitlab
subjects:
- kind: ServiceAccount
  name: default
  namespace: gitlab
roleRef:
  kind: Role
  name: gitlab-admin-role
  apiGroup: rbac.authorization.k8s.io
```


**跳过fetch **

```
deploy_all:
  variables:
    GIT_STRATEGY: none
    GIT_CHECKOUT: "false"
  stage: deploy
```

 参考：

[GitlabCI 使用 S3 存储配置分布式缓存](https://mp.weixin.qq.com/s/dY1J-SJJmJK9p7FdbrPSDQ)

[Gitlab CI yaml官方配置文件翻译](https://segmentfault.com/a/1190000010442764)