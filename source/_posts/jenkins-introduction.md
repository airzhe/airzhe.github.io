---
layout: post
title: "jenkins pipeline 入门"
description: ""
date: 2019-02-12
tags: [jenkins,pipeline]
comments: false
share: true
---
### Jenkins 特点：

开源免费；
跨平台，支持所有的平台；
master/slave 支持分布式的 build；
web 形式的可视化的管理页面；



### 安装
```
docker pull jenkins/jenkins:2.138.2
docker run -p 9090:8080 -p 50000:50000 -v /User/user/jenkins:/var/jenkins_home jenkins

docker run --rm --name jenkins -p 9090:8080 -p 50000:50000 --user root -v /var/run/docker.sock:/var/run/docker.sock -v $(which docker):/usr/bin/docker -v /Users/user/jenkins:/var/jenkins_home jenkins/jenkins:2.138.2
  
```

### 插件

```
Go

CloudBees Docker Build and Publish:

```

### 全局工具配置

```
Go 安装
安装目录：/var/jenkins_home/go
```

### 证书

```
配置访问git证书 SSH Username with private key
harbor jenkins  密码
```


### 项目配置
```
构建环境
Set up Go programming language tools
构建：
Docker Build and Publish
Docker Host URI 配置 unix:///var/run/docker.sock 或者 tcp://127.0.0.1:2375
```


### Pipeline

Pipeline的几个基本概念：

- Stage: 阶段，一个Pipeline可以划分为若干个Stage，每个Stage代表一组操作。注意，Stage是一个逻辑分组的概念，可以跨多个Node。
- Node: 节点，一个Node就是一个Jenkins节点，或者是Master，或者是Agent，是执行Step的具体运行期环境。
- Step: 步骤，Step是最基本的操作单元，小到创建一个目录，大到构建一个Docker镜像，由各类Jenkins Plugin提供。

```
pipeline {
    agent { label 'master' }
    tools {
       maven 'maven_1'
    }
     stages {
        stage('Build') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/master']], 
                doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], 
                userRemoteConfigs: [[url: 'https://github.com/airzhe/demo-junit']]])
                sh 'mvn -version'
                sh 'mvn package -DskipTests'
            }             
        }
        stage('Build docker image') {
            steps {
                //sh 'docker login --username airzhe  --password ×××'
                sh 'docker build -t airzhe/test:${imageversion} .'
                sh 'docker push airzhe/test:${imageversion}'
            }             
        }
    }
    post { 
            failure { 
                echo 'fail !'
            }
            success{
                echo 'success !'
            }
    }
}
```

### 参考

go 插件安装：  
https://blog.csdn.net/aixiaoyang168/article/details/82965854

