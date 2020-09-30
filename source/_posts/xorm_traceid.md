---
title: "xorm结合logrus记录traceId"
date: 2020-04-09 19:17:10
tags: [xorm,golang,logrus]
share: true
---


通用 `traceId` 写日志，来查看一次请求的处理过程，是我们常用的排错方式。日志一般包括我们自定义的日志，和数据库日志。

比较了常用的 go orm 包，发现 xorm 可以自定义上下文 ，满足我们的需求。通过`engine.SetDefaultContext(ctx)`，我们可以把一次请求产生的 traceId 通过 context.WithValue 的方式传递，在sql 执行结束时打印出来。

xorm 包本身的日志是不输出上下文变量的，但是 `engine.SetLogger()` 方法支持自定义 log ，我们通过重写log来实现自定义日志打印。需要实现如下 ContextLogger 接口，主要重写了 AfterSQL 方法。

```go
// ContextLogger represents a logger interface with context
type ContextLogger interface {
	SQLLogger

	Debugf(format string, v ...interface{})
	Errorf(format string, v ...interface{})
	Infof(format string, v ...interface{})
	Warnf(format string, v ...interface{})

	Level() LogLevel
	SetLevel(l LogLevel)

	ShowSQL(show ...bool)
	IsShowSQL() bool
}
```

我们通过自定义结构体，使用 `logrus` 日志包来实现这个接口

```go
type LoggerAdapter struct {
	logger *logrus.Logger
}

func NewLoggerAdapter() *LoggerAdapter {
	return &LoggerAdapter{
		logger: logrus.New(),
	}
}

func (l *LoggerAdapter) BeforeSQL(ctx xlog.LogContext) {}

func (l *LoggerAdapter) AfterSQL(ctx xlog.LogContext) {
	#在这里打印了上下文环境里的traceId
	traceId := ctx.Ctx.Value("traceId") 
	if ctx.ExecuteTime > 0 {
		l.logger.Infof("[SQL] %v %v - %v %v", ctx.SQL, ctx.Args, ctx.ExecuteTime, traceId)
	} else {
		l.logger.Infof("[SQL] %v %v", ctx.SQL, ctx.Args, traceId)
	}
}

func (l *LoggerAdapter) Debugf(format string, v ...interface{}) {
	l.logger.Debugf(format, v...)
}

func (l *LoggerAdapter) Errorf(format string, v ...interface{}) {
	l.logger.Errorf(format, v...)
}

func (l *LoggerAdapter) Infof(format string, v ...interface{}) {
	l.logger.Infof(format, v...)
}

func (l *LoggerAdapter) Warnf(format string, v ...interface{}) {
	l.logger.Warnf(format, v...)
}

func (l *LoggerAdapter) Level() xlog.LogLevel {
	return xlog.LogLevel(l.logger.GetLevel())
}

func (l *LoggerAdapter) SetLevel(lv xlog.LogLevel) {
	l.logger.SetLevel(logrus.Level(lv))
}

func (l *LoggerAdapter) ShowSQL(show ...bool) {}

func (l *LoggerAdapter) IsShowSQL() bool {
	return true
}
```

测试一下

```go
	engine, _ = xorm.NewEngine("mysql", "dev_w:*****@(172.16.200.40:3306)/api_monitor?charset=utf8")
	dblog := NewLoggerAdapter()

	engine.SetLogger(dblog)

	type Group struct {
		Id         int       `xorm:"not null pk autoincr INT(11)"`
		Name       string    `xorm:"not null default '' comment('分组名称') VARCHAR(50)"`
		Maintainer string    `xorm:"not null default '' comment('维护者') VARCHAR(50)"`
		CreatedAt  time.Time `xorm:"not null TIMESTAMP"`
		UpdatedAt  time.Time `xorm:"not null TIMESTAMP"`
		DeletedAt  time.Time `xorm:"TIMESTAMP"`
	}

	groups := []Group{}

	go func() {
		ctx := context.WithValue(context.Background(), "traceId", "11111111111111")
		engine.SetDefaultContext(ctx)
		engine.Where("name = ? or name = ?", "cms", "biw").Find(&groups)
	}()

	go func() {
		time.Sleep(1 * time.Second)
		ctx := context.WithValue(context.Background(), "traceId", "2222222222222")
		engine.SetDefaultContext(ctx)

		engine.Where("name = ? or name = ?", "cms", "tt").Find(&groups)

	}()
	for {

	}
```

查看日志，可以看到末尾记录了我们本次执行的 traceId

```shell
INFO[0000] [SQL] SELECT `id`, `name`, `maintainer`, `created_at`, `updated_at`, `deleted_at` FROM `group` WHERE (name = ? or name = ?) [cms biw] - 187.773683ms 1111111
1111111 
INFO[0001] [SQL] SELECT `id`, `name`, `maintainer`, `created_at`, `updated_at`, `deleted_at` FROM `group` WHERE (name = ? or name = ?) [cms tt] - 92.988533ms 222222222
2222 
```



参考资料：

[logrus日志使用详解](https://www.cnblogs.com/shijingjing07/p/10316444.html)

[xorm中文文档](http://gobook.io/read/gitea.com/xorm/manual-zh-CN/)

[快速掌握 Golang context 包，简单示例](https://deepzz.com/post/golang-context-package-notes.html)
