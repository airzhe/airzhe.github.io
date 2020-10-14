---
title: "vue 入门笔记"
description: ""
date: 2020-08-21 16:32:10
tags: [vue,vuejs]
comments: false
share: true
---
**和 Angularjs 比较**

组件开发有更好的生态圈，如Element UI


### 指令

```
v-bind:class="[classA,classB]" 绑定属性 简写 :class="[classA,classB]"
# 对于所有的数据绑定，Vue.js 都提供了完全的 JavaScript 表达式支持。
{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}
# 绑定对象，也可以设置成变量
:class="{current:true,focus:false}"
# 绑定style
:style="{color:'red',fontSize:'18px'}"
<span v-html="rawHtml"></span>

# 返回对象的计算属性。这是一个常用且强大的模式：
<div v-bind:class="classObject"></div>

v-if
v-else-if
v-else
// 对一组元素进行if判断
<template v-if="">
	<div></div>
	<div></div>
</template>

<p v-for="{(num,index) in items}" :key="index">{{k + '-' +v}}</p>
<p v-for="{(value,key,index) in obj}" :key="index">{{k + '-' +v}}</p>
类似于 v-if，你也可以利用带有 v-for 的 <template> 来循环渲染一段包含多个元素的内容。

v-on:click="add" 简写 @:click="add"
this.$set(newLlist,0,{})  修改数组0索引值
<div v-once></div> 确保这些内容只计算一次
```
<!-- more -->
### 组件

**computed计算属性**

```
使用场景: 某个数据受多个数据影响，不推荐使用函数计算，因为 computed 可以缓存，函数会反复调用，性能低
get()
set() 触发函数
```

**侦听属性,对象改变触发** 

```js
使用场景: 一个数据变化会影响多个数据
watch: {
    language:{
        handler (newval) {	
    	},
    },
    immediate:true # watch 页面加载就立即执行
}
```

**组件传参** 

父传子

```
# 子
<template>
	<p>{{text}}</p>
</template>
<script>
	export default{
		name: "MyCoponent1"
		//props: ["text"]
        props:{
        	text:{
        		type: String,
        		required: true,
        		default: "默认字符串"
    		}
    	}
	}
</script>

# 父
<template>
	<my-compoent text="abcdef"></my-compoent>
</template>
<script>
    import MyCompoent from '../compoents/compoent1'
    export default{
        name:"demo12"
        compoents:{
        	MyCompoent
    	}
    }
</script>
```

子传父

```
# 子
<template>
	<div>
        <input type="text" v-model="val">
        <button @click="submit">提交</button>
    </div>
</template>
<script>
    export default{
        name:"Compoent2",
        props: ['msg'], //接收父组件参数
        model: {
            prpo: 'msg',
            event: 'on-callback'
        },
        data(){
            return{
                val: this.msg
            }
        },
        methods:{
            submit(){
                this.$emit('on-callback',this.val)//submit事件触发后，自动触发on-callback事件
            }
        }
    }
</script>

# 父
<template>
  <div class="demo">
    <h1>子组件与父组件通信</h1>
	<my-component
		@on-callback="getData"
	></my-component> 
	<div>{{content}}</div>
  </div>
</template>
<script>
import MyComponent from '../components/component2'
export default {
  name: "demo13",
  data() {
    return {
      content: ""
    }
  },
  components: {
  	MyComponent
  },
  methods: {
  	getData(val) {
  		this.content = val
  	}
  }
}
</script>

```

**组件插槽 solt**

占位符作用，可以用来接收父组建传递过来的html

```
# 父
<template>
	<sloat-demo title="这是标题">
        <template v-slot:default>
             <div>这是内容</div>
		</template>
        <template v-sloat:demo>
            <button>按钮</button>
			<button>按钮2</button>
		</template>
    </sloat-demo>
</template>
<script>
    import SlotDemo from '../compoents/...'
    export default{
        name: "demo15",
        compoents: {
            SlotDemo
        }
    }
</script>
# 子
<slot></slot>
<slot name="btns"></slot>
```

**动态组件**

```html
<button @click="currentCompoent = 'Dynamic1'">组件1</button>
<button @click="currentCompoent = 'Dynamic2'">组件2</button>
<!-- 保持组件状态 -->
<keep-alive>
    <compoent :is="currentCompoent"
</keep-alive>
    
<script>
    import DynamicDemo1 from '../compoents/..'
    import DynamicDemo2 from '../compoents/..'
</script>
```

**组件注册**

全局注册

```
Vue.component('my-component-name', { /* ... */ })
```

局部注册

```js
var ComponentA = { /* ... */ }

var ComponentB = {
  components: {
    'component-a': ComponentA
  },
  // ...
}
```
切换 `loginType` 将不会清除用户已经输入的内容。因为两个模板使用了相同的元素，所以 Vue 为你提供了一种方式来表达“这两个元素是完全独立的，不要复用它们”。只需添加一个具有唯一值的 `key` attribute 即可
```
<input placeholder="Enter your username" key="username-input">
```


**transition 动画**

`<transition name="slide"></transition>标签`，会在包括组件 `v-enter`、`v-enter-active`、`v-enter-to`、`v-leave`、`v-leave-to`阶段添加class，可以通过 transform来做动画效果, 如：

```css
.slide-enter-active,
.slide-leave-active {
	transtion: all 300ms
}
.slide-enter,
.slide-leave-to {
	opacity: 0;
	transform: translate(-50%,-100%)
}
```

### Vuex

简单的 store 模式

```js
var store = {
  debug: true,
  state: {
    message: 'Hello!'
  },
  setMessageAction (newValue) {
    if (this.debug) console.log('setMessageAction triggered with', newValue)
    this.state.message = newValue
  },
  clearMessageAction () {
    if (this.debug) console.log('clearMessageAction triggered')
    this.state.message = ''
  }
}
# 所有 store 中 state 的变更，都放置在 store 自身的 action 中去管理。这种集中式状态管理能够被更容易地理解哪种类型的变更将会发生
```

### 路由

const 异步加载 、import 同步加载

子路由，页面需要添加: `<router-view/>`

```js
{
	path:/demo17/:id?,
	name:'demo17',
	compoent: Demo17，
	// redirect: 'demo6', //重定向
	// 别名
	alias: '/demo17777777',
	children: [
		{
			path: ':detail',
			name: 'detail',
			compoent: Detail
		}
	]
}
// 通过js切换路由
this.$router.push("/demo5")
// 通过name切换路由
this.$router.push({
	//path: 'demo5/1234/abcd' //通过path切换路由不能传 params
	name: 'demo5'，
	params: {
		id: 1234,
		type: 'abcd'
	},
	query:{
		key:'abcedf'
	},
	hash:"#ppp"
})
// replae用法和push一样，replace不会产生历史记录
this.$router.replace("/demo5")

this.$router.go(-1)
// router-link的to属性也能跟push一样使用
<router-link :to="{}">link</router-link>
```

 路由匹配从上到下，匹配不到就到 404 这条

```
{
	path:'*',
	name:'Notfound',
	component: NotFound
}
```

**全局路由钩子函数**

```js
// 路由跳转前钩子函数
router.beforeEach((to, from, next)  =>  {
	console.log('beforeEach 即将进入' + to.path + '页面')
	// to 目标路由
	// from前一个路由
	// next 必须执行next方法，才能跳转路由
		// 执行next(),跳转到to对应路由
		// 执行next(false),不跳转，停留在当前页面
		// 执行next(xxx),跳转到xxx页面
	if(to.name ==== 'demo6'){
		next('demo5')
	}else{
		next()
	}
})
// 路由跳转后钩子函数
router.afterEach((to,from) => {
	console.log('afterEach 进入了' + to.path + '页面')
})
```

单独路由钩子

```js
{
	path: '/demo6',
	name: 'demo6',
	component: Demo6,
	beforeEnter(to,from,next){
		console.log('beforeEnter: 即将进入demo6')
		next()
	}
}
```

组件里单独写钩子函数

```vue
beforeRouterEnter(to,from,next) {
	// beforeRouterEnter 读取不到this
	console.log('beforeRouterEnter: 即将进入')
	next(vm =>{
		console.log(vm.text)
	})
}
// 路由更新，参数有变化时候触发
beforeRouterUpdate(to,from,next) {
	// beforeRouterUpdate 可以读取到this
	next()
}
```
**组件生命周期**

1. `beforeCreate`：在实例初始化之后，数据观测 (data observer) 和 event/watcher 事件配置之前被调用。
2. `created`：在实例创建完成后被立即调用。在这一步，实例已完成数据观测 (data observer)，属性和方法的运算，watch/event 事件回调。
3. `beforeMount`：在挂载开始之前被调用：相关的 `render` 函数首次被调用。
4. `mounted`：实例被挂载后调用，这时 `el` 被新创建的 `vm.$el` 替换了。
5. `beforeUpdate`：数据更新时调用，发生在虚拟 DOM 打补丁之前。
6. `updated`：虚拟 DOM 重新渲染和打补丁之后。
7. `beforeDestory`：实例销毁之前调用。在这一步，实例仍然完全可用。
8. `destoryed`：实例销毁后调用。对应 Vue 实例的所有指令都被解绑，所有的事件监听器被移除，所有的子实例也都被销毁。

**http 请求**
```
new Vue({
  el: '#app',
  data () {
    return {
      info: null
    }
  },
  mounted () {
    axios
      .get('https://api.coindesk.com/v1/bpi/currentprice.json')
      .then(response => (this.info = response))
  }
})
<div id="app">
  {{ info }}
</div>
```

### 其他

**箭头函数**

```js
var sum = (num1, num2) => num1 + num2;
// 等同于
var sum = function(num1, num2) {
  return num1 + num2;
};
```
**Vue-cli**

```js
docker pull kolaente/yarn
// yarn add [package]@[version]
yarn global add @vue/cli
vue create hello-world
cd hello-word && yarn serve

$vue --version
@vue/cli 4.5.3
```
**vue-cli 修改打包路径**

```
node_modules/@vue/cli-service/lib/options.js:83:  publicPath: './',
```

**Element**

``` sh
npm i element-ui -S
# 按需引入
npm install babel-plugin-component -D
babel.config.js 里添加
"plugins": [
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ]
  ]
```

## 组件开发

**button**

```
组件里的内容使用 solt 定义
通过 props 定义按钮type 如: primary、success、info、warning
:class="[`hm-button--${type}`,{'is_plain':plain}]" #ES6 引入了模板字符串
<i v-if="icon" :class="icon"></i> 
<span v-if="$slots.default"><slot></slot></span> #判断插槽是否传值
#父
<hm-button @click="fn"></hm-button>
#子
@click="handleClick"
methods:{
	handleClick(e){
		this.$emit('click',e)
	}
}
```

**dialog**

```
# 父组件传solt参数就覆盖，不传就显示span里的内容
<slot name="title">
	<span>{{title}}</span>
</slot>
<div :style="{width:width,top:top}"></div>

# 提示框内容使用默认插槽
<h-dialog>内容</h-dialog>

@click.self="fun3" # 阻止冒泡
```

**sync修饰符** 子组件修改父组件数据

```
@click="fn"
this.$emit('aa',200 )

# sync 语法糖，直接修改父组件值相当于
<hm-dialog :visable="visable" @update:visable="fn1"></hm-dialog> 
<hm-dialog :visable.sync="visable"></hm-dialog> 
```

**vue.compoent vs vue.use**

```
Vue.use(plugin), plugin格式为{install: function () {}}，则运行install方法，若plugin本身是function则直接运行。Vue.component才是真正的去注册组件。很多UI库用Vue.use来注册组件是因为在plugin的install方法中去执行Vue.component罢了
```

**v-model 是个语法糖**

```
<input type="text" v-model="username">
<input type="text" :value="username" @input="username=$event.targe.value"

实现 v-model
# 子
:value="value"
@input="handleInput"
handleInput(e){
	this.$emit('input',e.target.value)
}
# 父
v-model="user"

// 切换input type
:type="showPassword ? (passwordVisable ? 'text':'password') : type"
```


参考：

[关于* core-js/modules/es.array.fill in](https://www.jianshu.com/p/7fbdd031fe85)

[组件传参数](https://blog.csdn.net/l284969634/article/details/78595077)

[表单输入绑定](https://cn.vuejs.org/v2/guide/forms.html)