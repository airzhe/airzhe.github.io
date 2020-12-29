---
layout: post
title: "jenkins k8s pipeline"
description: ""
date: 2019-10-30
tags: [jenkins,pipeline]
comments: false
share: true
---
**docker 启动脚本**

```sh
docker run -d \
    -p 8090:8080 -p 50000:50000  \
    -u root \
    -v /root/jenkins:/var/jenkins_home \
    -v /usr/lib64/libltdl.so.7:/usr/lib/x86_64-linux-gnu/libltdl.so.7 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(which docker):/usr/bin/docker \
    --name jenkins jenkinszh/jenkins-zh:latest
```

**pipeline**

```sh
pipeline {
    agent any 
    environment {
    	APP_NAME = "api-monitor-new"
        GIT_BRANCH = "test123"
        GIT_COMMIT_ID = "test123456"
    	CHART_NAME = "apple/api-monitor-new"
        CHART_VERSION = 3.0
        NEW_HARBOR_HOST = "harbor.apple.net"
        BUILD_IMAGES_NAME = "${NEW_HARBOR_HOST}/php/${APP_NAME}:${GIT_BRANCH}"
        KUBE_CONFIG = credentials("156485be-dbb8-4f8c-b3a2-15f3535049ad")
        NAMESPACE = "default"   
    }

    stages {
        stage('Build') { 
            agent {
                docker { image 'harbor.apple.net/php/golang:latest' }
            }
            steps { 
                sh 'echo Build stage ...' 
                git credentialsId: '1', url: 'http://gitlaball.apple.net/apple/middle/soa/api-monitor-new.git'
                sh 'rm -rf ./output'
                sh 'export CGO_ENABLED=0 ;chmod +x ./build.sh ; ./build.sh'
                sh 'cd ./output && mkdir ./app && tar -zxvf *.gz -C ./app'
            }
        }
        stage('Build Image') { 
            agent {
                docker { image 'harbor.apple.net/php/docker:stable' }
            }
            steps { 
                withCredentials([usernamePassword(credentialsId: 'a00b4d01-c2e7-49af-9b1f-fcc382116911', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PWD')]) {
                    sh 'docker login -u "${HARBOR_USER}" -p "${HARBOR_PWD}" "${NEW_HARBOR_HOST}"'
                }
                sh 'cd ./output/app'
                sh 'echo Dockerfile01 > .dockerignore'
                sh 'echo FROM harbor.apple.net/php/alpine > Dockerfile01 && echo COPY . /app >> Dockerfile01'
                sh 'docker build -t "$BUILD_IMAGES_NAME"  -f Dockerfile01 .'
                sh 'docker push "$BUILD_IMAGES_NAME"'
                sh 'docker images'
            }
        }
        stage('Deploy') {
             agent {
                docker { image 'harbor.apple.net/php/helm:3.0-rc2' }
            }
            steps { 
                sh 'mkdir -p ~/.kube && cat ${KUBE_CONFIG} > ~/.kube/config'
                sh 'helm repo add apple https://harbor.apple.net/chartrepo/php'
                sh 'helm repo update'
                withCredentials([usernamePassword(credentialsId: 'a00b4d01-c2e7-49af-9b1f-fcc382116911', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PWD')]) {
                    sh 'helm upgrade ${APP_NAME} --install \
                    --set image.tag=${APP_TAG} \
                    --set gitBranch=${GIT_BRANCH} \
                    --set commitId=${GIT_COMMIT_ID} \
                    --username ${HARBOR_USER} --password ${HARBOR_PWD} \
                    --set nodeSelector.role="node" \
                    --force --wait --atomic --debug \
                    --namespace=${NAMESPACE} \
                    ${CHART_NAME} --version ${CHART_VERSION} '
                    sh 'echo "soa.cicd.${APP_NAME}.status $? `date +%s`" | nc 10.2.4.35 32003'
                }
                sh 'helm list'
            }
        }
    }
  }
```



参考：

[Gitlab+Jenkins Pipeline+Docker+k8s+Helm自动化部署实践](http://blog.jboost.cn/k8s3-cd.html)

[Jenkins CI/CD 集成 Git Secrets](https://www.kubernetes.org.cn/6158.html)

[Jenkins 凭证管理 - 看这一篇就够了~](https://www.cnblogs.com/FLY_DREAM/p/13888423.html)

[Jenkins pipeline 隐藏密码](https://blog.csdn.net/catoop/article/details/100153791)