---
title: "Docker web shell 实现二"
date: 2020-02-03 11:36:10
tags: [docker,webshell]
share: true
---

**通过 docke exec start 实现 webshell**

调用 [exec](https://docs.docker.com/engine/api/v1.30/#tag/Exec) 接口 传入参数

```
{"AttachStdin":true,"AttachStdout":true,"AttachStderr":true,"Tty":true,"Cmd":["/bin/sh"]}
```

用返回的 id 请求 start 接口， 附加 post 参数

```
'{"Detach":false,"Tty":true}'
```

我们使用 go 代码来完成上面的操作

```
package main

import (
	"fmt"
	_ "io"
	"log"
	"net"
	"os"
	"regexp"
	"time"
)

//发送信息
func sender(conn net.Conn) {
	buffer := make([]byte, 1024)

	exec_req := fmt.Sprintf(`POST /containers/%s/exec HTTP/1.1
Host: 0.0.0.0:2375
Content-Type: application/json
Cache-Control: no-cache
Content-Length: 91

{"AttachStdin":true,"AttachStdout":true,"AttachStderr":true,"Tty":true,"Cmd":["/bin/sh"]}

`, "alpine")
	conn.Write([]byte(exec_req))

	n, err := conn.Read(buffer)
	if err != nil {
		//
	}
	rep := string(buffer[:n])

	Log(rep)
	reg1 := regexp.MustCompile(`.*?{"Id":"(.*?)"`)
	res := reg1.FindAllStringSubmatch(rep, -1)
	s_id := res[0][1]

	start_req := fmt.Sprintf(`POST /exec/%s/start HTTP/1.1
Host: 0.0.0.0:2375
Content-Type: application/json
Cache-Control: no-cache
Content-Length: 27

{"Detach":false,"Tty":true}

`, s_id)

	conn.Write([]byte(start_req))
	time.Sleep(time.Second)
	conn.Write([]byte("ls -l\n"))
	Log("send over")

	for {
		//接收服务端反馈
		n, err := conn.Read(buffer)
		if err != nil {
			Log(conn.RemoteAddr().String(), "waiting server back msg error: ", err)
			return
		}
		Log(conn.RemoteAddr().String(), "receive server back msg: ", string(buffer[:n]), n)
	}

}

//日志
func Log(v ...interface{}) {
	log.Println(v...)
}

func main() {
	server := "0.0.0.0:2375"
	tcpAddr, err := net.ResolveTCPAddr("tcp4", server)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Fatal error: %s", err.Error())
		os.Exit(1)
	}
	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Fatal error: %s", err.Error())
		os.Exit(1)
	}

	fmt.Println("connection success")
	sender(conn)
}

```
<!-- more -->

执行效果:

![](/img/docker/ws2.png)

上面实现了通过 tcp 连接访问 docker shell 的效果，我们想要的是通过web 浏览器来访问，这里通过一个开源的项目 [websocket_agent](https://github.com/zxb19890727/websocket_agent)，可以把 tcp 协议转为 websocket 协议，这样通过浏览器，访问 websocket 服务就可以与 docker shell 交互.

贴一下需要在文件 `websocket_transfer_tcp.go` 添加的代码：

```
232 buffer := make([]byte, 1024)
233 var s_id string
234 exec_req := fmt.Sprintf(`POST /containers/%s/exec HTTP/1.1
235 Host: 0.0.0.0:2375
236 Content-Type: application/json
237 Cache-Control: no-cache
238 Content-Length: 90
239 
240 {"AttachStdin":true,"AttachStdout":true,"AttachStderr":true,"Tty":true,"Cmd":["/bin/sh"]}
241 
242 `,self.Container)
243 conn.Write([]byte(exec_req))
244 
245 n, err := conn.Read(buffer)
246 if(err != nil){
247 log.Print("exec interface error!")
248 }
249 rep := string(buffer[:n])
250 
251 log.Print(rep)
252 reg1 := regexp.MustCompile(`.*?{"Id":"(.*?)"`)
253 res := reg1.FindAllStringSubmatch(rep, -1)
254 if(len(res) !=0 && res[0] != nil){
255 s_id = res[0][1]
256 }
257 
258 start_req := fmt.Sprintf(`POST /exec/%s/start HTTP/1.1
259 Host: 127.0.0.1:2375
260 Content-Type: application/json
261 Cache-Control: no-cache
262 Content-Length: 27
263 
264 {"Detach":false,"Tty":true}
265 
266 `,s_id)
267 
268 conn.Write([]byte(start_req))
269 time.Sleep(100*time.Millisecond)
270 n, err = conn.Read(buffer)
271 
272 self.TcpConn = conn


285     reg1 := regexp.MustCompile(`/\?c=(.*?) `)
286 
287     for {

296         str = string(line)
297         //获取容器名
298         if(self.Container == ""){
299             res := reg1.FindAllStringSubmatch(str, -1)
300             if(len(res) !=0  && res[0] != nil){
301                 self.Container = res[0][1]
302             }
303         }
304 
```

然后执行` ./websocket_transfer_tcp 8088 0.0.0.0:2375` ，通过 8088 端口代理 2375  端口

前端代码: 通过参数来访问相应的容器

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
        var container = GetQueryString("c")
        if (container == "" || container == null) {
            alert("参数错误!没有容器名称");
            throw ("error");
        }
        var url = "ws://127.0.0.1:8088?c=" + container;
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
            xterm.writeln("              _           _          _ _ ")
            xterm.writeln("             | |         | |        | | |")
            xterm.writeln("__      _____| |__    ___| |__   ___| | |")
            xterm.writeln("\\ \\ /\\ / / _ \\ '_ \\  / __| '_ \\ / _ \\ | |")
            xterm.writeln(" \\ V  V /  __/ |_) | \\__ \\ | | |  __/ | |")
            xterm.writeln("  \\_/\\_/ \\___|_.__/  |___/_| |_|\\___|_|_|")
            //ws.send("\n");
        };
        ws.onerror = function () {
            console.log('ws error');
        };
        ws.onclose = function () {
            xterm.writeln(' ')
            xterm.writeln('=======================')
            xterm.writeln(' ')
            xterm.writeln(' socket已断开连接，请重连')
            xterm.writeln(' ')
            xterm.writeln('=======================')
            console.log('ws closed');
        };
        ws.onmessage = function (evt) {
            console.log(evt.data);
            //var decoder = new TextDecoder('utf-8');
            //var data = decoder.decode(evt.data);
            xterm.write(evt.data);
        };

        function GetQueryString(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);//search,查询？后面的参数，并匹配正则
            if (r != null) return unescape(r[2]); return null;
        }
    </script>
</body>

</html>
```

效果图：

![](/img/docker/ws3.png)

可以看到这种方式是新建的 /bin/sh 进程下工作的，同时访问就是多个 bash 进程，操作不影响，1号进程可以是我们自己的常驻服务，更能满足我们的使用场景。



参考：
https://blog.51cto.com/709151/2406150?source=dra			
https://docs.docker.com/engine/api/v1.30/#operation/ContainerAttach
https://github.com/zxb19890727/
http://patorjk.com/software/taag/