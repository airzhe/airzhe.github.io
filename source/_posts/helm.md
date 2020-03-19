---
title: "helm 命令介绍及使用"
date: 2019-10-16 17:35:10
tags: [k8s,helm]
share: true
---

**命令**

```
helm repo list
helm search 
helm list #列出已经按照项目
helm del --purge istio-init #删除
helm fetch stable/grafana #下载到本地
helm push mysql-0.3.5.tgz myrepo
helm repo add  myrepo https://xx.xx.xx.xx/chartrepo/charts #添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami  #添加仓库

helm list --deleted
helm rollback nginx-ingress 1

helm create hello_test
helm package ./hello_test/ #打包
helm install ./hello_test-0.1.0.tgz --debug --dry-run #调试
helm get manifest #这条命令可以通过 release 名来打印其相关yaml信息
helm status wintering-rodent

helm plugin install https://github.com/chartmuseum/helm-push #安装push插件
helm repo add mylibrary http://harbor.local.com:8082/chartrepo/library
helm push --username=runner --password=745632Bn hello_test mylibrary

helm fetch stable/redis
helm push redis-8.1.2.tgz -urunner -p745632Bn  mylibrary  -v 0.2.0


docker run -ti --rm --entrypoint /bin/sh alpine/helm:2.9.0
export HELM_HOST=10.102.49.77:44134 #修改 tiller 地址 10.111.8.171:44134
helm list
helm init --client-only

helm upgrade -f panda.yaml happpy-panda stable/mariadb #更新
helm temlate helm/istio -name istio -namespace istio-system -f my-values.yaml > my-isti.yaml #根据模板生成部署清单，不用依赖 tiller 服务端。
helm template istio -name istio -f book-values.yaml -namespace istio-system | kubectl apply -f

helm delete --purge #版本存储在 kube-system 命名空间内的ConfigMaps中
helm status 

helm inspect values . #查看charts的配置选项
helm inspect values yhdx/community --version 0.2.0
helm get values zeroed-gnat -a #查看 release 的配置值

helm --set a=b,c=d 
helm --set name={a,b,c} 
helm --set server[0].port = 80

--timeout
--wait

helm init --service-account 
helm install . --debug --dry-run --set favoriteDrink=tea #set 替换
helm install stable/drupal --set image=my-registry/drupal:0.1.0 --set livenessProbe.exec.command=[cat,docroot/CHANGELOG.txt] --set livenessProbe.httpGet=null
helm upgrade sanguine-panther --set image1.tag=0.3 --set imagePullPolicy=Always . 
helm upgrade nginx-ingress -f ingress-nginx.yaml  stable/nginx-ingress

#启动本地 chartmuseum 仓库
docker run --rm -itd \
  -p 8089:8080 \
  -e DEBUG=1 \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  -v /home/runner/work/k8s/chartmuseum/charts:/charts \
 --name my_chartmuseum  chartmuseum/chartmuseum:latest
helm repo add myChartMuseum http://172.16.101.197:8089

helm upgrade install --force

sed -i "s/api-monitor/hyperf-skelecton/g" `grep payment -rl ./hyperf-skelecton`
```
<!-- more -->

**helm Values Files 值来源**

```
前面讲了内置对像 Values，它的值有四个来源：

values.yaml 文件
如果这是个子 chart，其父 chart 的 Values.yaml 文件
在 helm install 或 helm upgrade 时，通过 -f 指定的文件
通过 --set 指定的参数（ 例：helm install --set foo=bar ./mychart）
```



**helm template**

```
Release：该对象描述了发布本身。它里面有几个对象：
Release.Name：发布名称
Release.Time：发布的时间
Release.Namespace：要释放到的命名空间（如果清单未覆盖）
Release.Service：发布服务的名称（始终Tiller）。
Release.Revision：此版本的修订号。它从1开始，每个都递增helm upgrade。
Release.IsUpgrade：true如果当前操作是升级或回滚，则设置为。
Release.IsInstall：true如果当前操作是安装，则设置为。

Chart：Chart.yaml文件的内容。这里的任何数据Chart.yaml都可以访问。例如{{.Chart.Name}}-{{.Chart.Version}}将打印出来mychart-0.1.0。
"图表指南”中列出了可用字段 #https://github.com/helm/helm/blob/master/docs/charts.md#the-chartyaml-file

.Files.Get config.ini

Template：包含有关正在执行的当前模板的信息
Name：当前模板的命名空间文件路径（例如mychart/templates/mytemplate.yaml）
BasePath：当前图表的templates目录的命名空间路径（例如mychart/templates）。

内置值始终以大写字母开头,本地名称以小写开头

drink: {{ quote .Values.favorite.drink }} #值加引号
food: {{ .Values.favorite.food | upper | quote }} #管道
drink: {{ .Values.favorite.drink | default "tea" | quote }} #默认值

if/ else用于创建条件块
with 指定范围
range，它提供了“for each”式循环

{{- if eq .Values.favorite.drink "coffee"}}
mug: true
{{- end}}

#with
{{- with .Values.favorite }}
drink: {{ .drink | default "tea" | quote }}
food: {{ .food | upper | quote }}
{{- end }}

|-YAML中的标记采用多行字符串。这可以是一种有用的技术，用于在清单中嵌入大块数据，ConfgMaps 使用
toppings: |-
    {{- range .Values.pizzaToppings }}
    - {{ . | title | quote }}
    {{- end }
toppings: |-
    {{- range $index, $topping := .Values.pizzaToppings }}
      {{ $index }}: {{ $topping }}
    {{- end }}

有一个变量始终是全局$变量 - 该变量将始终指向根上下文


#模板
{{/* Generate basic labels */}}
{{- define "mychart.labels" }}
  labels:
    generator: helm
    date: {{ now | htmlDate }}
{{- end }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
  {{- template "mychart.labels" }}
  
当define呈现命名模板（使用）创建时，它将接收template调用传入的范围。在我们的示例中，我们包含了这样的模板：{{- template "mychart.labels" }} 没有传入范围，因此在模板中我们无法访问任何内容.应该改为：{{- template "mychart.labels" . }}

最好在Helm模板中使用include over template，以便可以更好地处理YAML文档的输出格式。
labels:
    {{- include "mychart.app" . | nindent 4 }}
    
    
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  {{- $files := .Files }}
  {{- range list "config1.toml" "config2.toml" "config3.toml" }}
  {{ . }}: |-
    {{ $files.Get . }}
  {{- end }}

#生成 nginx.conf 配置
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secret
type: Opaque
data:
  token: |-
    {{ .Files.Get "config1.toml" | b64enc }}
    
{{ .Release.Name }} 随机生产的单词
{{ include "community.fullname" . }} 和项目有关的名称
```



**tiller**

```
tiller 可以安两个一个集群内，一个集群外
```



**docker 客户端**

```
docker run -it -v ~/.kube:/root/.kube dtzar/helm-kubectl
```

**依赖管理**

-  直接把依赖的 package 放在 charts / 目录中
- 使用 requirements.yaml 并用 helm dep up foochart 来自动下载以来的packages



Grafana 安装

```
https://grafana.com/grafana/dashboards/7249

helm upgrade --install loki loki/loki-stack --namespace monitoring

helm install  stable/grafana -n grafana --namespace=monitoring
helm upgrade grafana  stable/grafana  --set adminPassword=745632Bn123
helm upgrade grafana  stable/grafana  --set ingress.enabled=true --set ingress.hosts[0]=grafana.t1.youhaodongxi.com
```

