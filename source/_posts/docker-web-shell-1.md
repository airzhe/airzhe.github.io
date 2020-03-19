---
title: "Docker web shell 实现一"
date: 2020-01-20 14:17:10
tags: [docker,webshell]
share: true
---

**通过 docker 原生 接口 [Attach to a container via a websocket](https://docs.docker.com/engine/api/v1.30/#operation/ContainerAttach) 实现**

首先开启 Remote API 访问 2375 端口
```
# sudo vim /lib/systemd/system/docker.service
[Service]
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2375

# sudo systemctl daemon-reload
# sudo service docker restart

# curl 0.0.0.0:2375
{"message":"page not found"}
```

启动容器

```
docker run -itd --name alpine alpine /bin/sh 
```


前端网页代码

```
<html>

<head>
    <meta charset="utf-8">
    <title>Docker Web Shell</title>
    <link rel="stylesheet" href="https://cdn.bootcss.com/xterm/3.14.5/xterm.css" />
    <script src="https://cdn.bootcss.com/xterm/3.14.5/xterm.js"></script>
</head>

<body>
    <div id="container-terminal"></div>
    <style type="text/css">
        body {
            width: 100%;
            height: 100%;
        }

        #container-terminal {
            width: 100%;
            height: 100%;
        }

        .terminal {
            height: 100%;
            width: 100%;
            font-size: 18px;
        }
    </style>
    <script type="text/javascript">
        var term;
        var url = "ws://0.0.0.0:2375/containers/alpine/attach/ws?stream=1&stdout=1";
        xterm = new Terminal({
            rows: 38,
            cursorBlink: true
        });
        ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        xterm.on('data', function (data) {
            ws.send(data);
        });
        xterm.open(document.getElementById("container-terminal"), true);
        ws.onopen = function () {
            console.log('ws connected');
            ws.send("\n");
        };
        ws.onerror = function () {
            console.log('ws error');
        };
        ws.onclose = function () {
            xterm.writeln('socket已断开连接，请重连')
            console.log('ws closed');
        };
        ws.onmessage = function (evt) {
            console.log(evt.data);
            var decoder = new TextDecoder('utf-8');
            var data = decoder.decode(evt.data);
            xterm.write(data);
        };
    </script>
</body>

</html>
```

效果图:

![](/img/docker/ws1.png)

上面的方式是通过 attach 方式连接到容器内，优点是原生接口、简单，缺点是1号进程必须是 shell 命令，无权限验证功能，后面介绍另外一种方式，满足多用户同时操作，可以添加权限验证。