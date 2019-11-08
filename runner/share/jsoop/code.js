

//http://segmentfault.com/a/1190000002728517

/*
 * 对象的创建
 */

//php
class Person{
    public $name;
    private $age;
    public function __construct($name,$age){
        $this->name = $name;
        $this->age    = $age;
    }
}
$a =  new Person('张三',24);

//js
function Person(name,age){
    this.name = name;
    var age = age; //private

    this.showAge = function(){
        return age;
    }
}
// Person.prototype.getName = function(){
//     return this.name;
// }

var a = new Person('张三',22);
var b = new Person('李四',24);
a.getName();

/*
 * prototype
 */

//几道比较绕的前端面试题
//http://segmentfault.com/q/1010000002622918


/*
 * 继承
 */

function Person(name,age){
    this.name = name;
    var age = age; //private

    this.showAge = function(){
        return age;
    }
}

function Student(name,age,number){
    // Person.call(this,name,age);
    this.name = name;
    var age = age; //private

    this.showAge = function(){
        return age;
    }
    this.number = number;
}
Student.prototype = Person.prototype;

var s1 = new Student('小明',15,111);

Student.prototype.getName = function(){
    return this.name + '====';
}
a.getName();
/*
 * 对象拷贝
 */
var obj  = {
    a :10,
    b : {c:20,d:30}
}
var obj1 = obj;
obj1.a=40;
console.log(obj);

//浅拷贝 
function extend(fromObj,toObj){
    for(var key in fromObj){
        toObj[key] = fromObj[key];
    }
}
var obj2 = {};
extend(obj,obj2);

obj2.a = 30;
console.log(obj,obj2);
obj2.b.c=40;
console.log(obj,obj2);

//深拷贝
var obj3 =  JSON.parse(JSON.stringify(obj));
console.log(obj3);
obj3.a = 30;
obj3.b.c = 40;
console.log(obj3,obj);