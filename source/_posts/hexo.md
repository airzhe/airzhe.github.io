---
title: "使用hexo管理博客"
date: 2019-10-23 16:09:10
tags: [hexo]
share: true
---

下载 hexo 镜像
```sh
docker pull neofelhz/hexo-docker
```

启动镜像并映射本地目录

```
docker run -itd \
    -v /home/runner/work/www/blog:/www/blog \
    -w="/www/blog" \
    -p 4000:4000 \
    --name hexo-test \
    neofelhz/hexo-docker \
    /bin/sh
```

进入容器

```
docker exec -it hexo-test /bin/sh
```

执行 `hexo init`，初始化时间较长，应该和网络有关

```
/www/blog # hexo init 
INFO  Cloning hexo-starter to /www/blog
Cloning into '/www/blog'...
remote: Enumerating objects: 8, done.
remote: Counting objects: 100% (8/8), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 139 (delta 2), reused 2 (delta 0), pack-reused 131
Receiving objects: 100% (139/139), 25.72 KiB | 21.00 KiB/s, done.
Resolving deltas: 100% (64/64), done.
Submodule 'themes/landscape' (https://github.com/hexojs/hexo-theme-landscape.git) registered for path 'themes/landscape'
Cloning into '/www/blog/themes/landscape'...
......
[3/4] Linking dependencies...
[4/4] Building fresh packages...
success Saved lockfile.
warning Your current version of Yarn is out of date. The latest version is "1.19.1" while you're on "1.3.2".
info To upgrade, run the following command:
$ curl -o- -L https://yarnpkg.com/install.sh | bash
Done in 112.25s.
INFO  Start blogging with Hexo!
```
<!-- more -->

初始化完成生成目录如下：

```
/www/blog/source/_posts # ls -la
total 132
drwxr-xr-x   6 runner runner  4096 10月 23 14:33 .
drwxr-xr-x  13 runner runner  4096 10月 23 14:15 ..
-rw-r--r--   1 runner runner  2121 10月 23 14:18 _config.yml
-rw-r--r--   1 runner runner 12288 10月 23 14:33 ._config.yml.swp
-rw-r--r--   1 runner runner    65 10月 23 14:18 .gitignore
drwxr-xr-x 273 runner runner 12288 10月 23 14:27 node_modules
-rw-r--r--   1 runner runner   577 10月 23 14:18 package.json
drwxr-xr-x   2 runner runner  4096 10月 23 14:18 scaffolds
drwxr-xr-x   3 runner runner  4096 10月 23 14:18 source
drwxr-xr-x   3 runner runner  4096 10月 23 14:24 themes
-rw-r--r--   1 runner runner 76595 10月 23 14:27 yarn.lock

```

修改` _config.yml` ，title 改为自己的网站标题，拷贝一个新的 md 文件到 `source/_posts`目录

```
/www/blog/source/_posts # ls
hello-world.md  microk8.md
```

执行`hexo s`启动服务:

```
/www/blog/source # hexo s
INFO  Start processing
INFO  Hexo is running at http://localhost:4000 . Press Ctrl+C to stop.
```

访问 `http://localhost:4000`，我们的 markdown 文章就以 html 格式展示出来了

![1.png](/img/hexo/1.png)



**上传到 github.io **

1.修改_config.yaml，采用 git 方式部署到自己的 github.io

```
deploy:
  type: git
  repo: https://github.com/airzhe/airzhe.github.io 
```

2.安装 `hexo-deploy-git` 模块，执行:  `npm install hexo-deployer-git --save`，之后执行 `hexo` 如果报错 `ERROR Local hexo not found *** `, 删除 `node_modules` 目录后，执行 `npm install`

3.执行 `hexo clean && hexo deploy` 按提示配置 git-confg 信息后重试，输入 git 帐号和密码，部署成功！



**小技巧**:

1.文章注释信息定义：

```
---
title: "MicroK8s"
date: 2019-10-23 20:23:10
tags: [microk8s,k8s]
share: true
---
```

2.插入图片:  在 source 目录下新建 img 目录，markdown 中以`/img` 为根路径引入对应图片

3.站内链接: {&#37; post_link loki  使用Loki查询日志 &#37;}
4.更多: `<!-- more -->`



**文档**
[hexo中文](https://hexo.io/zh-cn/docs/index.html)
[hexo特殊符号转义](https://wxnacy.com/2018/01/12/hexo-specific-symbol/)



**排错**

1. 今天遇到部署时总提示hexo 源码分支指向master分支错误
```
Branch hexo set up to track remote branch master from https://github.com/airzhe/airzhe.github.io.
```
或者以下报错，删除 `.deploy_git` 目录，重试解决
```
Error: Spawn failed

at ChildProcess.task.on.code (/www/blog/node_modules/hexo-deployer-git/node_modules/hexo-util/lib/spawn.js:51:21)
```
参考： https://www.cnblogs.com/hushuangpu/p/10316560.html

2. 切换网络hexo容器提示 github.com 无法访问，容器重启后正常