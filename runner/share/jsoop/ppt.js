Apple.prototype.constructor.apply(this,'Foobar');


字符串、数字、布尔、对象（数组，日式时间，json）、Null、Undefined


而基本类型中的object，是特指对象中除了其他几大基本类型之外的对象，其内又包含数组、日期等等对象以及自定义对象。


JavaScript简单的类型包括数字、字符串、布尔值（true和false）、null值和undefined值。其他所有的值都是对象。
var a = new String('123');　String Number Boolean

2 .toString();
true.toString();
[1, 2, 3].toString();


作用域

有对象就指向调用对象
没调用对象就指向全局对象
用new构造就指向新对象
通过 apply 或 call 或 bind 来改变 this 的所指。


call apply


不懂原型和闭包，你也可以开发javascript程序，但是你写不出高质量、符合设计原则的javascript程序。


//对象类型 : 值和引用都相同才行


//constructor : 查看对象的构造函数

prototype　定义的都是静态属性，静态方法

//原型链 : 实例对象与原型之间的连接，叫做原型链

//原型链的最外层 : Object.prototype


一切皆对象　JavaScript 中所有变量都是对象，除了两个例外 null 和 undefined。（属性方法）

作用域


instanceof

对象拷贝

  　　var arr = [3,4];
    arr.number = 10;

　　　　arr.test = function(){
        console.log(123);
    }
　　　　arr.length;




    var a=2;

    window.aa=function(){
        var a=3;
        alert(this.a);
        console.log(this);
    }
    aa();



    var name = "The Window";   
    var object = {   
    　　　　name : "My Object",   
    　　　　getNameFunc : function(){   
    　　　　　　return function(){   
    　　　　　　　　return this.name;   
    　　　　　};   
    　　　　}   
    };   
    alert(object.getNameFunc()());  //The Window

Array.prototype.toString = function(){
	return this.join('+');
};

f1=new Foo();

f1.__proto__
Foo {}
Foo.prototype
Foo {}
Object.prototype.toString.call(Foo);
"[object Function]"
Object.prototype.toString.call(Foo.prototype);
"[object Object]"
Foo.prototype.constructor
1.html:25 function Foo(){

}
Object.prototype.toString.call(Foo.prototype.constructor);
"[object Function]"
Object.prototype.toString.call(Foo.prototype.constructor);
"[object Function]"
Foo.prototype.__proto__;
Object {}
Object.prototype.__proto__
null
var o1 = new Object();
undefined
var o2 = new Object();
undefined
o1.__proto__;
Object {}
o1.__proto__.constructor;
function Object() { [native code] }
o1.__proto__.constructor == Object;
true
Foo.__proto__
function Empty() {}
Object.prototype.toString.call(Foo.__proto__);
"[object Function]"
Foo.__proto__.__proto__
Object {}
Function.__proto__
function Empty() {}
Object.__proto__;
function Empty() {}
