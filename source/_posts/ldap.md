---
title: "ldap 常用命令"
description: ""
date: 2020-10-14 14:17:00
tags: [ldap]
comments: false
share: true
---

#### ldapsearch

```
ldapsearch -x -D 'cn=Admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:9981 -b "cn=dong.tian,cn=apple,cn=People,dc=apple,dc=com" 
```

//搜索 cn=haozhe.wei,cn=apple,cn=People,dc=apple,dc=com 过滤 mail cn sn givenname字段

```
ldapsearch -x -D 'cn=Admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:9981 -b "cn=haozhe.wei,cn=apple,cn=People,dc=apple,dc=com"  "(objectClass=*)" mail cn sn givenname
```

 // 在cn=apple,cn=People,dc=apple,dc=com下搜索 carLicense=IVFISMVKUFXNV6ZF 的记录

```
ldapsearch -x  -D 'cn=Admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:9981 -b "dc=apple,dc=com"  "(carLicense=IVFISMVKUFXNV6ZF)"
```

 // 导出所有数据

```
ldapsearch -x -D 'cn=Admin,dc=apple,dc=com' -w '******'  -H ldap://0.0.0.0:9981 -b 'dc=apple,dc=com' -LLL > /tmp/ldapdb.ldif
```

-l 5 搜索时间限制为五秒，-z 5 大小限制为五

#### ldapmodify

```
ldapmodify  -x  -D 'cn=Admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:9981 -f /tmp/ldapm
```

文件内容： 

```
dn:cn=haozhe.wei,cn=apple,cn=People,dc=apple,dc=com 
changetype: modify
replace: mobile
mobile: 15101646884
```

#### ldapdelete

```
ldapdelete -x -D 'cn=Admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:9981 -v "cn=haozhe.wei,cn=apple,cn=People,dc=apple,dc=com" -v
```

#### ldapdadd

```
ldapadd -x -D "cn=admin,dc=apple,dc=com" -w ****** -H ldap://0.0.0.0:9981  -f /tmp/add.ldif 
```
<!-- more -->

**PHP 安装 ldap 扩展**

```
yum install openldap
yum install openldap-devel
cp -frp /usr/lib64/libldap* /usr/lib/ 

wget http://cn2.php.net/distributions/php-5.6.35.tar.gz
tar -zxvf php-5.6.35.tar.gz 
cd php-5.6.35/ext/ldap
/home/work/sky/thirdparty/php/bin/phpize
./configure --with-php-config=/home/work/sky/thirdparty/php/bin/php-config
make && make install
vim /home/work/sky/thirdparty/php/lib/php.ini
kill -SIGUSR2 `ps -ef | grep php-fpm | grep master | awk '{print $2}'`
```

**修改密码**

```
cat <<EOF |ldapmodify -x -D 'cn=admin,dc=apple,dc=com' -w '******' -H ldap://0.0.0.0:389
dn: cn=weihaozhe,cn=People,cn=apple,dc=apple,dc=com
changetype: modify
replace: userPassword
userPassword: PBKDF2-SHA256}10000$r0zVLb.7fzLJzBHg1GbC1Q$PVAePYz4pjC8uc31UlzYNZObrWdDYt1blKiR90EvrQ85CgK9FZ4/rPjhETHUx5YXs.E
EOF
```

**权限配置**

```
access to dn.one="cn=People,dc=apple,dc=com"
by dn="cn=search,cn=People,dc=apple,dc=com" read
by self write
by self read
by anonymous auth
by * none

access to *
by dn="cn=root,dc=apple,dc=com" write
by anonymous auth
by * read
```

**字段映射**

```
protected static $map = [
        'id'       => 'dn',
        'username' => 'cn',
        'realname' => 'sn',
        'password' => 'userpassword',
        'ext'      => 'telephonenumber',
        'phone'    => 'mobile',
        'email'    => 'mail',
        'secretkey'=> 'carlicense',
        'status'   => 'businesscategory',
        'photoUri' => 'givenname',
        'department'     => 'departmentnumber',
        'employeenumber' => 'employeenumber',
        'workseat'  => 'workseat',
        'birthday'  => 'birthday',
        'job'       => 'job',
        'constellation'  => 'constellation',
        'bloodtype' => 'bloodtype',
        'description' => 'description',
        'haveauth'   => 'haveauth',
        'msgnotify'  => 'msgnotify',
        'authkey'    => 'authkey',
        'jobType'      =>  'employeetype',
        'secondAuthType' => 'postalcode'
    ];


ldapsearch -x -D 'uid=auth,ou=users,dc=apple,dc=com' -w '***' -H ldap://10.0.1.*:389 -b "uid=weihaozhe,ou=users,dc=apple,dc=com"
# extended LDIF
#
# LDAPv3
# base <uid=weihaozhe,ou=users,dc=apple,dc=com> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# weihaozhe, users, apple.com
dn: uid=weihaozhe,ou=users,dc=apple,dc=com
objectClass: posixAccount
objectClass: shadowAccount
objectClass: inetOrgPerson
cn:: 6a2P5rWp5ZOy
gecos: Linux
gidNumber: 500
givenName:: 5rWp5ZOy
homeDirectory: /home/weihaozhe/
loginShell: /bin/bash
mail: weihaozhe@apple.net
mobile: 176**10668100
sn:: 6a2P
uidNumber: 1761**68100
uid: weihaozhe
```

**备份**

```
* */1 * * * sh /home/work/ldap/backup/bin/run.sh
cat run.sh
#!/bin/bash
BACKUP_PATH=/home/work/ldap/backup
docker exec -it openldap /home/work/ldap/sbin/slapcat > ${BACKUP_PATH}/data/openldap-backup.ldif 2>/dev/null
sh ${BACKUP_PATH}/bin/backuplog.sh -P ${BACKUP_PATH}/data -F openldap-backup.ldif -B ./bak

https://gist.githubusercontent.com/kunpengku/f18651f582d84c1756a7/raw/03b001a8ad0c3ba544f07e3d1512d7db60d1dd84/backuplog.sh
```

**工具**

Ldap Admin Tool

apache directory studio



参考：

[openldap+php-ldap操作](https://www.cnblogs.com/dwj97/p/7513509.html)

[基于LDAP进行验证-方法和问题](http://blog.csdn.net/peterwanghao/article/details/7481444) 

[Openldap命令详解](https://www.cnblogs.com/xzkzzz/p/9269714.html)