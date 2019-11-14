---
title: "ubuntu18.04安装"
description: ""
date: 2019-11-14 20:53:10
tags: [ubuntu]
comments: false
share: true
---

**镜像制作**

工具：https://rufus.ie/ 

**分区：**

```
/ 50G 根分区(一般分配30G就可以)
/boot 500MB 引导分区
efi 500MB
swap 4G 交换分区
/home 个人数据分区
```

安装完成重启

**修改163源并更新**

```
$ cat /etc/apt/sources.list
deb http://mirrors.163.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ bionic-backports main restricted universe multiverse
$ sudo apt update
$ sudo apt upgrade
```

**安装网卡驱动 :(**

```
https://github.com/tomaspinho/rtl8821ce
```

**常用软件**

- chrome
- [Nutstore](https://www.jianguoyun.com/)  #坚果网盘 导入备份数据
- [google 拼音](https://ywnz.com/linuxjc/2891.html) 
- [phpstorm](https://www.jetbrains.com/phpstorm/)
- sublime
- vim
- git 别名设置
- [typora](http://typora.io/) #markdown工具
- docker.io
- postman
- gimp


![1.png](/img/ubuntu/1.png)


总结：装个系统还是比较容易的，数据备份很重要，坚果网盘真的好用。