---
title: "angular js 基本使用"
date: 2020-01-17 20:36:00
tags: [angular js]
share: true
---

**基本使用**

- 引入 `angular.js`

```
 <script src="https://cdn.bootcss.com/angular.js/1.7.8/angular.min.js"></script>
```

- 数据绑定

```
<div ng-app="myApp">
    <input type="text" ng-model="name"/>
</div>

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {
    $scope.name = "runner"
})
```

- 下拉列表框、单选框数据绑定 `ng-model`、触发事件` ng-change`、是否可用`ng-disabled`

```
<select class="form-control" ng-model="list.filter.group_id"
    ng-options="k as v for (k,v) in data_source.list_group_list" ng-change="list.refresh()" required>
</select>

<label class="radio-inline" ng-repeat="data_format in data_source.data_format_list">
    <input type="radio" name="data_format[]" value="{{data_format}}" ng-model="edit.data_format"
        ng-click="edit.clear_data_body()" ng-disabled="edit.mode=='view'" ng-change="edit.form_change()">
    {{data_format}}
</label>
```

- Button 按钮是否显示 `ng-show`

```
<button type="submit" class="btn btn-primary" ng-show="edit.mode == 'insert' || edit.mode=='update'" ng-disabled="edit.form_validate()">提交</button>
```
<!-- more -->

- 动态添加 class `ng-class`
```
<span class="glyphicon" ng-class="row.is_ok == -1 ? 'text-warning glyphicon-question-sign' : (row.is_ok == 0 ? 'text-danger glyphicon-remove-sign' : 'text-success glyphicon-ok-sign')"> </span>
```

- 三元表达式
```
 <text placeholder="{{edit.mode == 'view' ? '' : (edit.data_format == 'json' ? edit.placeholder.json : edit.placeholder.form_data)}}"></text>
```


- ajax 请求

```
app.controller('myCtrl', function ($scope, $http, $interval) {
    $http({
        method: 'POST',
        url: base_url + '/api/update',
        contentType: 'application/json;charset=UTF-8',
        data: data
    }).then(function successCallback(rs) {
        if (rs.data.code === 0) {
            $('#myModal').modal('show')
            var row = rs.data.data
            all_data[row['id']] = row;
            list.refresh()
        }
    });
})
```

- 定时器

```
var timer = $interval(function () {
    func.monitor_list()
}, 1000)
```



**路由**

- 路由需要单独引入 `angular-route.js` 文件

```
<script src="https://cdn.bootcss.com/angular.js/1.7.8/angular-route.js"></script>
```

- body 内定义连接信息，引入`ng-view` 指令标签

```
<body ng-app="app">
    <ul>
        <li><a href="#/a">click a</a></li>
        <li><a href="#/name/runner/age/33?height=180">click b</a></li>
        <li><a href="#/c">click c</a></li>
    </ul>
    <div ng-view>

    </div>
</body>
```

- 模板内容:

```
head a.html b.html 
==> a.html <==
{{ content }}
==> b.html <==
page b: {{params}}
```

- 定义各个页面的控制器和路由信息，防止 html5 url转义，需要配置 `$locationProvider.hashPrefix("");`

```
<script>
var app = angular.module('app', ['ngRoute'])
    .controller('aController', ['$scope', function ($scope) {
        $scope.content = "page a";
    }])
    .controller('bController', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.params = $routeParams
    }])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        // $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("");
        $routeProvider.when('/a', {
            controller: 'aController',
            templateUrl: './a.html'
        }).when('/name/:name/age/:age', {
            // URL: index.html#/name/runner/age/33?height=180
            // $routeParams ==> {"height":"180","name":"runner","age":"33"}
            controller: 'bController',
            templateUrl: './b.html',
            resolve: {
                // 延迟 1秒再跳转
                delay: function ($q, $timeout) {
                    var delay = $q.defer();
                    $timeout(delay.resolve, 1000);
                    return delay.promise;
                }
            }
        }).otherwise({
            redirectTo: '/'
        });
    }]);
</script>
```

以上是在一个监控展示小项目中用到的操作，之后再写前端会尝试下 `vue` 