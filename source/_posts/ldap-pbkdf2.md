---
layout: post
title: "把gogs里的用户迁移到openldap"
description: ""
date: 2019-11-25 20:19:00
tags: [ldap,openldap,gogs,pbkdf2]
comments: false
share: true
---

公司之前使用 gogs 作为 git 服务器，要改成 gitlab，现在解决帐号迁移问题

**搭建 openldap 服务器**

查看 [gogs 代码](https://github.com/gogs/gogs/blob/master/internal/db/user.go#L324)，使用的是 [pbkdf2](https://www.php.net/manual/zh/function.hash-pbkdf2.php) 加密方式，SALT_SIZE为10 ，迭代次数为10000 ，DK_SIZE为50 ，如下：

```在
// EncodePasswd encodes password to safe format.
func (u *User) EncodePasswd() {
	newPasswd := pbkdf2.Key([]byte(u.Passwd), []byte(u.Salt), 10000, 50, sha256.New)
	u.Passwd = fmt.Sprintf("%x", newPasswd)
}
```
openldap 默认是不支持 pbkdf2 加密的，好在有人贡献了这部分代码，现在已经作为 openldap 的一个模块在项目源码里了.

按照下面的 Dockerfile 生成镜像，需要注意的是 SALT_SIZE、DK_SIZE 作为环境变量参与编译，和 gogs 的保持一致


```
FROM ubuntu:18.04
WORKDIR /root
ENV SALT_SIZE=10 DK_SIZE=50
RUN apt-get -y update \
    && apt-get -y install git gcc libltdl-dev make groff groff-base libssl-dev \
    && git clone https://github.com/openldap/openldap.git \
    && cd openldap \
    && ./configure --enable-modules \
    && make \
    && make install \
    && cd ./contrib/slapd-modules/passwd/pbkdf2 \
    && sed -i "s/PBKDF2_SALT_SIZE 16/PBKDF2_SALT_SIZE ${SALT_SIZE}/g" pw-pbkdf2.c \
    && sed -i "s/PBKDF2_SHA256_DK_SIZE 32/PBKDF2_SHA256_DK_SIZE ${DK_SIZE}/g" pw-pbkdf2.c \
    && sed '19 a#define HAVE_OPENSSL' -i pw-pbkdf2.c \
    && make \
    && mv slapo-pw-pbkdf2.5 slapd-pw-pbkdf2.5 \                                
    && make install \
    && sed '19 a# moduleload\tpw-pbkdf2.la' -i /usr/local/etc/openldap/slapd.conf
CMD ["sh", "-c", "/usr/local/libexec/slapd -f /usr/local/etc/openldap/slapd.conf; tail -f /dev/null;"]
```
<!-- more -->

拷贝容器里的 /usr/local/etc/openldap/slapd.conf 到本机，开启 pw-pbkdf2 模块：

```
# Load dynamic backend modules:
modulepath	/usr/local/libexec/openldap
moduleload	pw-pbkdf2.la
```

启动镜像

```
docker run -d \
	--name openldap \
	-v /home/runner/work/openldap/conf/slapd.conf:/usr/local/etc/openldap/slapd.conf \
	airzhe/openldap:pbkdf2 \
	/bin/bash -c \
	"mkdir -p /usr/local/var/openldap-data \
	&& /usr/local/libexec/slapd -f /usr/local/etc/openldap/slapd.conf \
	&& tail -f /dev/null"
```

生成管理员密码

```
$ docker exec -it openldap /bin/bash
$ slappasswd -o module-load=pw-pbkdf2.la -h {PBKDF2-SHA256} -s secret123
{PBKDF2-SHA256}10000$77QF.RnoGk0ZNA$DKUREgxYak/Qd112JlW3eVNSOmLBih9L0mMmE.ioR/cha0KQTg7TQas/LpPuDDsq43Y
```

改写 slapd.conf 配置文件 rootpw 为新生成的密码，重启容器，执行 slaptest 测试配置文件是否正确。

执行如下 ldapsearch 命令，有返回，没有提示验证错误，说明我们的支持 pw-pbkdf2 加密的 ldap 已经搭起来了 :)

```
$ ldapsearch -x -D 'cn=root,dc=youhaodongxi,dc=com' -w 'YHDX123.com'
# extended LDIF
#
# LDAPv3
# base <> (default) with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# search result
search: 2
result: 32 No such object

# numResponses: 1
```

**gogs 密码转换**

接下来给 gogs 用户生成对应的 openldap 密码，go 版本的代码参考：

```
package main

import (
    "fmt"
    "encoding/base64"
    "strings"
    _"strconv"
    "encoding/hex"
)

func main() {
    salt    := []byte("58R38iUGs7") #
    pwd_hex := "8f230e33791bf48cdd5e93d21da7bc6abd8d5cb53ae0cf3eefced0d7095b82d95a5482883aa03fdebafa16a5c865686172c7"
    pwd_str,_:= hex.DecodeString(pwd_hex)
    fmt.Printf("{PBKDF2-SHA256}10000$%s$%s",ab64_encode(salt),ab64_encode(pwd_str))
    fmt.Println()
}

func ab64_encode(pwd_str []byte) string{
    encodeString := base64.StdEncoding.EncodeToString([]byte(pwd_str))
    encod:=strings.ReplaceAll(strings.TrimRight(encodeString,"="),"+",".")
    return encod
}
```

到此，已经解决大多数 gogs 迁移的技术问题了.



踩坑：

1. github 上搜索排第一的 docker-openldap 不能支持这个模块方式的认证，总报错 (也可能是别的原因)
2. 要修改 [pbkdf2](https://github.com/openldap/openldap/tree/master/contrib/slapd-modules/passwd/pbkdf)  这个模块源码里配置的参数，也就是我上面提到的 SALT_SIZE、DK_SIZE

体会：

1. 新版 openldap 安装已经不需要 BerkeleyDB 数据库了，安装难度降到0，之前需要各种查资料，设置环境变量 :(
2. ldap 用着真的很爽，可以关联一切系统



参考：

 https://github.com/openldap/openldap/tree/master/contrib/slapd-modules/passwd/pbkdf
 https://github.com/osixia/docker-openldap/issues/235
