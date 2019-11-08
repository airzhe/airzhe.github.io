---
layout: post
title: "nginx 学习"
description: ""
date: 2019-02-27
tags: [nginx,openresty]
comments: false
share: true
---

POST_READ 阶段：

x-forwarded-for x-real-ip 

realip 模块启用 

return 302 /a.html

302 浏览器缓存

error_page 404=/404.php

rewrite regex replacement

如果 replacement 是以http开头，直接返回302

last 持续 break 停止当前脚本指令执行,后面的指令不会执行，直接读取文件返回  redirect 302 permant 301

http permanent 同时出现返回301

rewrite log 指令 开启rewrite 日志


**if 使用场景**

1. 检查变量为空或者值是否为0，直接使用
2. 将变量和字符串做匹配，使用=或者!=
3. 将变量与正则表达式做匹配 ~ 或~*
4. 检查文件是否存在 -f
5. 检查目录是否存在 -d
6. 检查文件、目录、软连是否存在 -e 
7. 检查是否为可执行文件 -x

- 忽略大小写
- ^~ 禁止正则表达式匹配
---
- limit_conn 限制并发连接数以ip为单位
- limit_req 把突发的 流量限制为每秒多少请求 用户请求会变慢，不会被拒绝 nodelay 盆里的请求是否立即返回 burst=3没分钟请求3次，在limit_conn 之前
- mirror 流量拷贝
- sub 替换
- sub_filter 
- additon 模块在响应前或后添加 自请求的内容
- referer 模块 对于大多数网站来说都是有效的
- valid_referers  if($invalid_referer){return 403}
- secure_link
- rewrite 不会修改 url地址，如dns cname记录 ，proxy_pass 会修改请求的url
- mirror_request body off
- map 模块
---

- nginx  Upstream Consistent Hash
- proxy_cache_use_state
- strace -p
- ngx_http_cache_purge_module 清除nginx缓存


