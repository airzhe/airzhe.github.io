---
title: "helm安装gitrunner"
date: 2019-10-16 17:52:10
tags: [gitrunner,helm]
share: true
---

**gitrunner**


```
helm repo add gitlab https://charts.gitlab.io

helm upgrade git-runner-test --install --namespace gitlab \
--set checkInterval=2 \
--set runners.image=alpine:latest --set runners.imagePullPolicy=if-not-present \
--set gitlabUrl=https://gitlab.youhaodongxi.com,runnerRegistrationToken=sDz-pAK6qVpYxixxX1dG --set runners.privileged=true \
gitlab/gitlab-runner
```

mount 目录 : 在configmap.yaml 里 entrypoint 最后增加

```
    cat >>/home/gitlab-runner/.gitlab-runner/config.toml <<EOF
      [[runners.kubernetes.volumes.host_path]]
        name = "docker"
        mount_path = "/volume"
        host_path = "/volume"

    EOF
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
指定命名空间和帐号安装tiller，建议开启tls认证
```
helm init --tiller-namespace php-sht --service-account=admin
```

#跳过fetch 

```
deploy_all:
  variables:
    GIT_STRATEGY: none
    GIT_CHECKOUT: "false"
  stage: deploy
```