---
title: Golang 设计模式
date: 2021-3-15 15:33:10
tags: [goalng,设计模式]
share: true
---

### 策略模式

定义了算法族，分别封装起来，让它们之间可以互相替换，此模式让算法的变化独立于使用算法的客户。

```go
// 消息发送渠道 opSender 和 mqSender 可替换
package main

import "fmt"

type AlertMessage struct {
	ToUser string
	Text   string
}

// Sender 发送渠道
type Sender interface {
	Send(msg *AlertMessage) error
}

// Alarm 报警结构体
type Alarm struct {
	Sender
}

// NewAlarm 新建报警器
func NewAlarm(sender Sender) *Alarm {
	return &Alarm{Sender: sender}
}

// OpSender 发送器
type OpSender struct {
	api string
}

// Send 发送请求给ops平台
func (o *OpSender) Send(message *AlertMessage) error {
	// 发消息到op
	fmt.Printf("发送%s到web接口:%s\n", message.Text, o.api)
	return nil
}

// MQSender 发送器
type MQSender struct {
    queue string
}

// Send 发送到MQ
func (m *MQSender) Send(message *AlertMessage) error {
	// 发消息到op
	fmt.Printf("发送%s到mq队列:%s\n",message.Text,m.queue)
	return nil
}

// apiHealthCheck api 健康检查
type apiHealthCheck struct {
	// 定义为接口类型
	alarmManager *Alarm
}

// SetAlarmManager 动态设置报警器
func (a *apiHealthCheck) SetAlarmManager(alarmManager *Alarm) {
	a.alarmManager = alarmManager
}

func main() {
	// 实例化发送器
	opSender := &OpSender{api: "http://alarm.ops.net"}
	// 报警器
	alarmManager := NewAlarm(opSender)
	apiHealthCheckIns := &apiHealthCheck{alarmManager: alarmManager}
	apiHealthCheckIns.alarmManager.Send(&AlertMessage{Text: "测试报警信息1"})

	// 实例化发送器
    mqSender := &MQSender{queue:"sms.send"}
	// 报警器
	alarmManager = NewAlarm(mqSender)
	apiHealthCheckIns.SetAlarmManager(alarmManager)
	apiHealthCheckIns.alarmManager.Send(&AlertMessage{Text: "测试报警信息2"})
}
```



### 观察者模式

定义了对象之间的一对多依赖，这样一来，当一个对象改变状态时，它的所有依赖者都会收到通知并自动更新。

```go
type observers map[uint64]*Observer

type Observation struct {
	Data interface{}
}
type FilterFn func(o *Observation) bool
var nextObserverID uint64
// Observer describes what to do with a given observation.
type Observer struct {
    // 通知次数
	numObserved uint64
    // 通知放弃次数(非阻塞通知，如果channel没有准备好，放弃)
	numDropped  uint64
	// channel receives observations.
	channel chan Observation
    // 阻塞还是非阻塞通知
	blocking bool
	// filter will be called to determine if an observation should be sent to
	// the channel.
    // 过滤函数
	filter FilterFn
	// id is the ID of this observer in the Raft map.
	id uint64
}
// RegisterObserver registers a new observer.
func (r *Raft) RegisterObserver(or *Observer) {
	r.observersLock.Lock()
	defer r.observersLock.Unlock()
	r.observers[or.id] = or
}

// DeregisterObserver deregisters an observer.
func (r *Raft) DeregisterObserver(or *Observer) {
	r.observersLock.Lock()
	defer r.observersLock.Unlock()
	delete(r.observers, or.id)
}
// observe sends an observation to every observer.
func (r *Raft) observe(o interface{}) {
	// In general observers should not block. But in any case this isn't
	// disastrous as we only hold a read lock, which merely prevents
	// registration / deregistration of observers.
	r.observersLock.RLock()
	defer r.observersLock.RUnlock()
	for _, or := range r.observers {
		// It's wasteful to do this in the loop, but for the common case
		// where there are no observers we won't create any objects.
		ob := Observation{Data: o}
		if or.filter != nil && !or.filter(&ob) {
			continue
		}
		if or.channel == nil {
			continue
		}
		// 阻塞通知
		if or.blocking {
			or.channel <- ob
			atomic.AddUint64(&or.numObserved, 1)
		} else {
			// 非阻塞通知
			select {
			case or.channel <- ob:
				atomic.AddUint64(&or.numObserved, 1)
			default:
				atomic.AddUint64(&or.numDropped, 1)
			}
		}
	}
}

```



### 装饰器模式

动态地将责任附加到对象上。若要扩展功能，装饰者提供了比继承更有弹性的替代方案。

```go
// 使用checkHeader函数装饰hello处理器函数
package main

import (
	"fmt"
	"net/http"
	"log"
)

func main() {
	//注册回调函数
	http.HandleFunc("/hello", checkHeader(hello))
	fmt.Println("run server...")
	http.ListenAndServe("127.0.0.1:8080", nil)
}

// 处理器函数
func hello(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello http server"))
}

// 装饰器函数
func checkHeader(f func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("check sign")
		if sign := r.Header.Get("Sign"); sign == "" {
			w.WriteHeader(401)
			w.Write([]byte("验签失败!"))
			return
		}
		f(w, r)
		//log.Println("")
	}
}
```



### 简单工厂

```go
// 根据配置创建不同的broker
func BrokerFactory(cnf *config.Config) (brokeriface.Broker, error) {
	if strings.HasPrefix(cnf.Broker, "amqp://") {
		return amqpbroker.New(cnf), nil
	}
    if strings.HasPrefix(cnf.Broker, "redis://") {
		return redisbroker.New(cnf), nil
	}
    return nil, fmt.Errorf("Factory failed with broker URL: %v", cnf.Broker)
}
```



### 工厂方法

定义了一个创建对象的接口，但由子类决定要实例化的类是哪一个。工厂方法让类把实例化推迟到子类。

```go
// redisBroker实例的创建由子类redisType的newBroker实现，之后执行父类consume方法
package main

import (
	"fmt"
	"errors"
)


// 接口，也可以定义为结构体类型，嵌入到redisBroker、mqBroker由他们重写部分方法
type broker interface {
	consumeStep1()
	consumeStep2()
	consumeStep3()
}

// 父类broker属性为接口类型
type commonBroker struct {
	broker
}

// 此方法需要子类来实现
func (c *commonBroker) createBroker() (broker,error) {
	 return nil,errors.New("Not implemented")
}

// 父类定义了消费方法（没有final声明怎么防止被子类覆盖）
func (c *commonBroker) consume() {
	c.broker.consumeStep1()
	c.broker.consumeStep2()
	c.broker.consumeStep3()
}

// redisBroker
type redisBroker struct{}

// 实现broker接口
func (r *redisBroker) consumeStep1() {
	fmt.Println("step 1")
}
func (r *redisBroker) consumeStep2() {
	fmt.Println("step 2")
}
func (r *redisBroker) consumeStep3() {
	fmt.Println("step 3")
}

// 子类
type redisType struct {
	// 嵌入父类
	commonBroker
}

// 实例化对应的broker对象
func (r *redisType) createBroker() (broker,error) {
	return &redisBroker{},nil
}

func main() {
	// 创建子类
	redisType := &redisType{}
	// 子类创建对象
	redisBroker,_ := redisType.createBroker()
	// 子类嵌入父类对象并设置父类属性
	redisType.commonBroker = commonBroker{redisBroker}
	// 调用父类方法
	redisType.consume()
}
```



### 单例模式

确保一个类只有一个实例，并提供一个全局访问点。

```go
// 从连接池里获取一个连接
func (b *Broker) open() redis.Conn {
	b.redisOnce.Do(func() {
		b.pool = b.NewPool(b.socketPath, b.host, b.password, b.db, b.GetConfig().Redis, b.GetConfig().TLSConfig)
		b.redsync = redsync.New(redsyncredis.NewPool(b.pool))
	})

	return b.pool.Get()
}
```



### 命令模式

将“请求”封装成对象，以便使用不同的请求、队列或者日志来参数化其他对象。命令模式也支持可撤销的操作。

```go
// 大汉三通语音、apppush消息分别封装成命令，包含接收着 大汉三通、极光,被smsHandle通过setCommand命令设置后，通过execute调用
package main

import (
	"fmt"
)

// Ivoker
type smsHandle struct {
	commander
}

func (s *smsHandle) setCommand(cmd commander) {
	s.commander = cmd
}

// Execute
func (s *smsHandle) execute(params interface{}) {
	s.commander.execute(params)
}

// Receiver
type receiver interface {
}

// dhstReceiver
type dhstReveiver struct {
	account map[string]string
	host    string
	port    string
	path    map[string]string
}

func (d *dhstReveiver) sendVoice(msg string, phone []string) error {
	fmt.Printf("给手机号%v发送语音短信:%s\n", phone, msg)
	return nil
}

// jpushReveiver
type jpushReveiver struct {
	account map[string]string
	host    string
	port    string
	path    map[string]string
}

func (d *jpushReveiver) appPush(msg string, phone []string) error {
	fmt.Printf("给手机号%v推送消息:%s\n", phone, msg)
	return nil
}

type commander interface {
	// 为什么不把setReceiver作为接口的方法？因为每个command的Receiver是不同的类型，不具备统一性
	execute(params interface{}) error
}

type withName struct {
	name string
}

// dhstSendVoiceCommand
type dhstSendVoiceCommand struct {
	withName
	receiver *dhstReveiver
}

// execute
func (c *dhstSendVoiceCommand) execute(params interface{}) error {
	data, _ := params.(*struct {
		phone []string
		msg   string
	})
	c.receiver.sendVoice(data.msg, data.phone)
	return nil
}

// appPushCommand
type appPushCommand struct {
	withName
	receiver *jpushReveiver
}

// execute
func (c *appPushCommand) execute(params interface{}) error {
	data, _ := params.(*struct {
		phone []string
		msg   string
	})
	c.receiver.appPush(data.msg, data.phone)
	return nil
}

func main() {
	// handle
	smsHandle := &smsHandle{}
    // 发语音短信
	dhstReceiver := &dhstReveiver{}
	dhstSendVoiceCmd := &dhstSendVoiceCommand{withName{"发送语音短信"}, dhstReceiver}
	smsHandle.setCommand(dhstSendVoiceCmd)
	smsHandle.execute(&struct {
		phone []string
		msg   string
	}{[]string{"17610668100"}, "验证码12345"})
	// app push
	jpushReveiver := &jpushReveiver{}
	appPushCmd := &appPushCommand{withName{"发送语音短信"}, jpushReveiver}
	smsHandle.setCommand(appPushCmd)
	smsHandle.execute(&struct {
		phone []string
		msg   string
	}{[]string{"17610668100"}, "app push 内容测试"})
}
```



### 适配器模式

将一个类的接口，转换成客户期望的另一个接口 ，适配器让原本接口不兼容的类可以合作无间。

```

```



### 外观模式

外观模式提供了一个统一的接口，用来访问子系统中的一群接口。外观定义了一个高层接口，让子系统更容易使用。

```

```



### 模板方法模式

在一个方法中定义一个算法的骨架，而将一些步骤延迟到子类中。模板方法使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。

```go
package main

import "fmt"

// 父类咖啡因饮料
type caffeineBeverage struct {
}

// 制作
func (c *caffeineBeverage) prepareRecipe(brew func(), addCondiments func()) {
	c.boilWater()
	brew()
	c.pourInCup()
	addCondiments()
}

// 步骤一
func (c *caffeineBeverage) boilWater() {
	fmt.Println("把水煮沸")
}

// 步骤三
func (c *caffeineBeverage) pourInCup() {
	fmt.Println("把饮料倒入杯子")
}

// 子类 茶
type tea struct {
	*caffeineBeverage
}

// 步骤二
func (t *tea) brew() {
	fmt.Println("用沸水泡茶叶")
}

// 步骤三
func (t *tea) addCondiments() {
	fmt.Println("加柠檬")
}

// 子类 茶
type coffee struct {
	*caffeineBeverage
}

// 步骤二
func (c *coffee) brew() {
	fmt.Println("用沸水冲泡咖啡")
}

// 步骤三
func (c *coffee) addCondiments() {
	fmt.Println("加糖和牛奶")
}

func main() {
	caffeineBeverageIns := &caffeineBeverage{}
	teaIns := &tea{caffeineBeverageIns}
	teaIns.prepareRecipe(teaIns.brew, teaIns.addCondiments)

	fmt.Println()

	coffeeIns := &coffee{caffeineBeverageIns}
	coffeeIns.prepareRecipe(coffeeIns.brew, coffeeIns.addCondiments)

}
```



### 状态模式

允许对象在内部状态改变时改变它的行为，对象看起来好像修改了它的类。

```go
// 改变订单的行为形成为orderState接口，各种状态实现orderState接口，通过setState改变订单的状态
package main

import (
	"fmt"
	"math/rand"
	"time"
)

// 订单状态接口
type orderState interface {
	pay() error
	refund() error
	close() error
}

// OrderStateNotPay 未支付订单状态
type OrderStateNotPay struct {
	*order
}

func (o *OrderStateNotPay) pay() error {
	fmt.Println("发起支付")
	fmt.Println("支付完成，转为支付成功状态")
	o.order.setState(o.order.stateSuccess)
	return nil
}
func (o *OrderStateNotPay) refund() error {
	return fmt.Errorf("%s", "未支付订单不能发起退款")

}
func (o *OrderStateNotPay) close() error {
	fmt.Println("关闭订单")
	fmt.Println("关闭订单成功，转为已关闭状态")
	o.order.setState(o.order.stateClosed)
	return nil

}

// OrderStateClosed 已关闭
type OrderStateClosed struct {
	*order
}

func (o *OrderStateClosed) pay() error {
	return fmt.Errorf("%s", "已关闭订单不能发起支付")

}
func (o *OrderStateClosed) refund() error {
	return fmt.Errorf("%s", "已关闭订单不能发起退款")

}
func (o *OrderStateClosed) close() error {
	fmt.Println("重复关闭订单")
	return nil

}

// OrderStateSuccess 支付成功
type OrderStateSuccess struct {
	*order
}

func (o *OrderStateSuccess) pay() error {
	return fmt.Errorf("%s", "订单已经是支付成功状态，不能再次发起支付")
}
func (o *OrderStateSuccess) refund() error {
	fmt.Println("发起退款")
	fmt.Println("退款成功，转为退款状态")
	o.order.setState(o.order.stateRefund)
	return nil

}
func (o *OrderStateSuccess) close() error {
	return fmt.Errorf("%s", "不能关闭已成功支付订单")
}

// OrderStateRefund 转入退款
type OrderStateRefund struct {
	*order
}

func (o *OrderStateRefund) pay() error {
	return fmt.Errorf("%s", "已转入退款订单不能发起支付")
}
func (o *OrderStateRefund) refund() error {
	return fmt.Errorf("%s", "已转入退款订单不能发起退款")

}
func (o *OrderStateRefund) close() error {
	return fmt.Errorf("%s", "已转入退款订单不能关闭")
}

//
type order struct {
	orderId      int64
	stateClosed  *OrderStateClosed
	stateSuccess *OrderStateSuccess
	stateRefund  *OrderStateRefund
	stateNotPay  *OrderStateNotPay
	currentState orderState
}

// NewOrder 新建订单
func NewOrder(orderId int64) *order {
	orderIns := &order{orderId: orderId}

	orderIns.stateClosed = &OrderStateClosed{order: orderIns}
	orderIns.stateSuccess = &OrderStateSuccess{order: orderIns}
	orderIns.stateRefund = &OrderStateRefund{order: orderIns}
	orderIns.stateNotPay = &OrderStateNotPay{order: orderIns}

	orderIns.setStateByOrderId(orderId)

	return orderIns
}

// 设置订单当前state对象
func (o *order) setState(state orderState) {
	o.currentState = state
}

// 根据订单状态设置当前state对象
func (o *order) setStateByOrderId(orderId int64) {
	stateInt := orderId % 7
	switch stateInt {
	case 2:
		o.currentState = o.stateClosed
		fmt.Println("当前订单为关闭状态")
	case 3:
		o.currentState = o.stateSuccess
		fmt.Println("当前订单为支付成功状态")
	case 6:
		o.currentState = o.stateRefund
		fmt.Println("当前订单为退款中状态")
	default:
		o.currentState = o.stateNotPay
		fmt.Println("当前订单为未支付状态")
	}
}

// 支付
func (o *order) pay() error {
	return o.currentState.pay()
}

// 退款
func (o *order) refund() error {
	return o.currentState.refund()
}

// 关闭订单
func (o *order) close() error {
	return o.currentState.close()
}

func main() {
	var err error

	rand.Seed(time.Now().Unix())
	orderId := int64(rand.Intn(13)) + 1
	order := NewOrder(orderId)

	// 支付
	if err = order.pay(); err != nil {
		fmt.Println(err)
		//return
	}
	// 支付
	if err = order.pay(); err != nil {
		fmt.Println(err)
		//return
	}
	// 退款
	if err = order.refund(); err != nil {
		fmt.Println(err)
		//return
	}
	// 关闭
	if err = order.close(); err != nil {
		fmt.Println(err)
		//return
	}
}
```



### 好莱坞原则

别调用我们，我们会调用你

```go
// 通过闭包发送短信

package main

import "fmt"

type sender interface {
	sendText(msg string) error
	sendVoice(msg string) error
}

type opalarm struct {
}

func (o *opalarm) sendText(msg string) error {
	fmt.Printf("发送文字报警:%s\n", msg)
	return nil

}
func (o *opalarm) sendVoice(msg string) error {
	fmt.Printf("发送语音报警:%s\n", msg)
	return nil

}

type senderObj struct {
	sender
}

// 闭包发文字短信
func sendTextMsg(msg string) func(sender sender) error {
	return func(sender sender) error {
		return sender.sendText(msg)
	}
}

// 闭包发语音短信
func sendVoiceMsg(msg string) func(sender sender) error {
	return func(sender sender) error {
		return sender.sendVoice(msg)
	}
}

// 发信息函数
func sendMsg(sender sender, f func(sender sender) error) {
	f(sender)
}

func main() {

	senderObj := &senderObj{sender: &opalarm{}}

	//senderObj.sendText("报警通知")
	//senderObj.sendVoice("报警通知")

	// 不要通知我，由我来通知你
	sendMsg(senderObj, sendTextMsg("报警通知"))
	sendMsg(senderObj, sendVoiceMsg("报警通知"))

}
```

