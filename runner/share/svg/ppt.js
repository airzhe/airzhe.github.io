(function(window){
    var WIDTH = 1024, HEIGHT = 768, FRAME = window.location.search.split("?")[1] || 1;
    var svg = Snap('#screen');
    // console.log(container)
    var shape = {};
    // function
    var fun = {};
    fun.sizeBody = function(){
        var width = window.innerWidth, height = window.innerHeight;
        var transfrom = "scale(" + [height / HEIGHT, height / HEIGHT].join() + ")";
        document.body.style.webkitTransform = transfrom;
        document.body.style.transfrom = transfrom;
    }
    fun.sizeBody();
    window.addEventListener('resize',fun.sizeBody);

    var titleAttr ={
        'x':512,
        'y':80,
        'font-size':50,
        'fill':'#d4aa00',
        'text-anchor':'middle'
    }
    var h2Attr = {
        'font-size':40,
        'fill':'#aad400'
    }
    var ulAttr ={
        'font-size':30,
    }

    var liAttr={
        'font-size':20,
    }
   
    var p = svg.path("M0 10 L10 10 L10 0").attr({
                        fill: "none",
                        stroke: "#beceeb"
                    }).pattern(0, 0, 10, 10); 
    var bgGridding = function(width,height){
        width = width || 150;
        height = height || 150;
        return svg.rect(0,0,width,height).attr({
            fill:p
        })
    } 
    var arcs = svg.path('M 50 0 A 50 50 0 1 1  35 -35').attr('stroke-width',2)
    var arrow = svg.path('m 14.284989,5.3695987 0,12.8644903 -12.8814802,0 c 0.0489,0.40417 0.38889,0.71328 0.80669,0.71328 l 11.9559102,0 c 0.4516,0 0.81517,-0.36357 0.81517,-0.81518 l 0,-11.9559003 c 0,-0.41221 -0.30003,-0.75069 -0.69629,-0.80669 z').attr('transform','matrix(1,0,0,1,21,-52)')
    var flush = svg.g(arcs,arrow).attr({
             'stroke':'#ccc',
              'fill':'#fff',
              'transform':'matrix(.4,0,0,.4,980,30)',
              'opacity':0,
              'cursor':'pointer'
      }).hover(function(){
            this.attr('opacity',1);
      },function(){
           this.attr('opacity',0);
      }).click(function(){
            window.location.href= window.location.pathname+'?'+FRAME;
      })
    // screen
    var frame = {
        //svg
        '1': function(){
              var _self = shape[FRAME] = {};
              _self.title = svg.text(512,400,'SVG').attr({
                    'font-size':180,
                    'text-anchor':'middle',
                    'fill':'l(1,0,1,1)rgba(246,241,7,1)-rgba(255,0,0,.6)',
                    'filter':svg.filter(Snap.filter.shadow(2,2,3))
              });
              // var _path = "M321.214785 420.1998l455.224775 2.045954-218.917083-550.361638zM373.386613 619.68032l346.789211-3.068931 61.378621-134.00999-450.10989 3.068931zM274.157842 489.762238l-274.157842 114.573427 147.308691 109.458541 175.952048-91.044955zM0 537.842158l259.836164-115.596404 279.272727-546.26973zM841.91009 423.268731l243.468531 125.826174-512.511489-670.04995zM836.795205 490.785215l-68.539461 141.170829 156.515485 86.953047 135.032967-113.55045zM368.271728 687.196803l-59.332667 15.344655-111.504496 62.401598 130.941059 47.056943 427.604396 0 129.918082-54.217782-124.803197-60.355644-41.942058-10.22977-350.881119 0z";
              // svg.path(_path).attr({
              //   'transform':'matrix(.1,0,0,.1,450,200) rotate(180deg)',
              //   'fill':'l(1,0,1,1)rgba(246,241,7,1)-rgba(255,0,0,.6)'
              // })
        },
        //简介
        '2': function(){
               var _self = shape[FRAME] = {};
               _self.title = svg.text(0,0,'SVG简介').attr(titleAttr);
               var ul = ['• 使用xml描述的矢量文件','• W3C标准(1.1) (http://www.w3.org/TR/SVG11/)','• 浏览器支持情况(http://caniuse.com/#search=SVG)'];
               _self.ul = svg.text(0,0,ul).attr(ulAttr).attr({
                transform:'matrix(1,0,0,1,100,160)'
               });
               var rowArr = _self.ul.selectAll('tspan')
               for(var i = 0,len = rowArr.length; i<len; i++){
                rowArr[i].attr({x:0,y:(i+1)*45})
               }
               _self.li = svg.text(0,0,'√ IE9+').attr(liAttr).attr({
                'fill':'#c83737',
                transform:'matrix(1,0,0,1,120,360)'
               })
               //案例
                _self.h2 = svg.text(0,0,'案例').attr(h2Attr).attr({
                    transform:'matrix(1,0,0,1,100,440)'
                }).click(function(){
                    _self.li2.attr('opacity',1);
                })

                var li2 = ['• http://top.baidu.com','• http://developer.baidu.com/map/jsdemo.htm#c1_1','• http://iconfont.cn'];
                _self.li2 = svg.text(0,0,li2).attr(liAttr).attr({
                    transform:'matrix(1,0,0,1,100,440)',
                    'opacity':0
                });
                var rowArr = _self.li2.selectAll('tspan')
                for(var i = 0,len = rowArr.length; i<len; i++){
                    rowArr[i].attr({x:0,y:(i+1)*45})
                }
        },
        //使用方式
        '3':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'使用方式').attr(titleAttr);
            var ul = ['• 浏览器直接打开','• 在HTML中使用<img>标签引用','• 直接在HTML中使用SVG标签','• 作为CSS背景'];
            _self.ul = svg.text(0,0,ul).attr(ulAttr).attr({
                transform:'matrix(1,0,0,1,100,160)'
            });
            var rowArr = _self.ul.selectAll('tspan')
            for(var i = 0,len = rowArr.length; i<len; i++){
                rowArr[i].attr({x:0,y:(i+1)*45})
            }
        },
        //基本图像和属性
        '4':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'基本图像和属性').attr(titleAttr);
            _self.oh2 = svg.text(0,0,'基本图形').attr(h2Attr).attr({
                transform:'matrix(1,0,0,1,100,160)'
            });
            var line = svg.line(0,0,100,100).attr({
                stroke:'#000',
            });
            var rect = svg.rect(0,0,100,100).attr({
                fill:'green',
                transform:'matrix(1,0,0,1,140,0)',
                'fill-opacity': 0.3
            });
            var circle = svg.circle(50,50,50).attr({
                fill:'blue',
                transform:'matrix(1,0,0,1,280,0)'
            });
            var polyline = svg.polyline(50,0,0,100,100,100).attr({
                fill:'red',
                transform:'matrix(1,0,0,1,400,0)'
            });
            var ellipses = svg.ellipse(50,50,80,50).attr({
                fill:'purple',
                transform:'matrix(1,0,0,1,580,0)'
            });
            _self.base_pattern = svg.g(line,rect,circle,ellipses,polyline).attr({
                transform:'matrix(1,0,0,1,120,240)'
            });
       
            _self.th2 = svg.text(0,0,'基本属性').attr(h2Attr).attr({
                transform:'matrix(1,0,0,1,100,560)'
            });
            _self.li2 = svg.text(0,0,'► fill、stroke、stroke-width、transfrom').attr(liAttr).attr({
                'fill':'#a00',
                'transform':'matrix(1,0,0,1,120,600)'
            })
        },
          //
        '5':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'基本属性').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ stroke & fill').attr(h2Attr);
            _self.li1 = svg.text(80,200,'► stroke,stroke-width,stroke-opacity,fill,fill-opacity').attr({
                'font-size':20,
                'fill':'#a00'
            });
             var c1 = svg.circle(0,0,50).attr({
                stroke:'red',
                'stroke-width':1,
                'fill':'none',
                transform:'matrix(1,0,0,1,50,50)'
             })
              var c2 = svg.circle(0,0,50).attr({
                stroke:'blue',
                'stroke-width':3,
                'fill':'none',
                 transform:'matrix(1,0,0,1,200,50)'
             })
            var c3 = svg.circle(0,0,50).attr({
                stroke:'purple',
                'stroke-width':2,
                'stroke-opacity':.1,
                'fill':'none',
                transform:'matrix(1,0,0,1,350,50)'
             })
            var c4 = svg.circle(0,0,50).attr({
                stroke:'none',
                'fill':'purple',
                'fill-opacity':'.5',
                transform:'matrix(1,0,0,1,480,50)'
            })
            _self.circle = svg.g(bgGridding(600,150),c1,c2,c3,c4).attr({
                  'transform':'matrix(1,0,0,1,80,240)'
            })
            // _self.li1 = svg.text(80,200,'stroke,stroke-width,stroke-opacity,fill,fill-opacity').attr({
            //     'font-size':20,
            //     'fill':'#a00'
            // });
            _self.li2 = svg.text(80,420,'► stroke-linecap').attr({
                'font-size':20,
                'fill':'#a00'
            });
            var  line1 = svg.line(0,0,280,0).attr({
                'stroke':"red",
                'stroke-width':5,
                'stroke-linecap':'butt',
            });
             var  line2 = svg.line(0,20,280,20).attr({
                'stroke':'green',
                'stroke-width':5,
                'stroke-linecap':'square',
            });
            var  line3 = svg.line(0,40,280,40).attr({
                'stroke':"blue",
                'stroke-width':5,
                'stroke-linecap':'round',
            });
            _self.linecap = svg.g(bgGridding(300,50),line1,line2,line3).attr({
                  'transform':'matrix(1,0,0,1,80,450)'
            })
            _self.li3 = svg.text(80,540,'► stroke-dasharray + stroke-dashoffset').attr({
                'font-size':20,
                'fill':'#a00'
            });
            var dash1 = svg.line(0,20,300,20.5).attr({
                'stroke':"l(0,1,1,1)rgb(255,0,0)-rgb(0,255,0)-rgb(0,0,255)",
                'stroke-width':2,
                'stroke-dasharray': '20 10',
                'stroke-dashoffset': '0'
            });
            var origin = dash1.attr('stroke-dashoffset').match(/\d/)[0];
            _self.dasharray = svg.g(bgGridding(300,50),dash1).attr({
                  'transform':'matrix(1.5,0,0,1.5,80,560)'
            })
            _self.btn1 = svg.text(0,0,'dashoffset+1').attr(liAttr).attr({
                'fill':'gray',
                'transform':'matrix(1,0,0,1,80,680)',
                'cursor':'pointer'
            }).mouseover(function(){
                origin = parseInt(origin) + 10;
                origin = parseInt(origin) + 10;
                dash1.attr({
                    'stroke-dashoffset': origin
                })               
            })
            //coffee
            _self.coffee = svg.image('./img/coffee.png',700,90,200,300).click(function(){
                _self._path.animate({
                    'stroke-dashoffset':0
                },1000)
            });
            _self._path = svg.path('M 204.81778,1.1716455 C 211.95158,110.55622 -39.694719,79.843869 60.485255,206.75788 120.51443,285.1377 -54.738229,357.78996 34.122001,399.92053').attr({
                fill:'none',
                'stroke':'purple',
                'transform':"matrix(1.3,0,0,.8,600,400)",
                'stroke-dasharray':'527 527',
                'stroke-dashoffset':'527'
            })
        },
        // line
        '6':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'线段').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ line').attr(h2Attr);
            var  line = svg.line(20,100,280,100).attr({
                'stroke':"#000",
                'stroke-width':1
            });
             _self.quadratic = svg.g(bgGridding(300,200),line).attr({
                  'transform':'matrix(1,0,0,1,80,200)'
             })
            var line1 = svg.line(10,10,280,200).attr({
                'stroke':"l(1,0,1,1)rgba(255,0,0,1)-rgba(89,220,16,.6)",
                'stroke-width':5,
                'stroke-dasharray':'20 10',
                'stroke-opacity':.8,
                'stroke-linecap':'round'
            });
            _self.line1 = svg.g(bgGridding(300,250),line1).attr({
                 'transform':'matrix(1,0,0,1,80,440)'
             })
            var lineDiv = document.createElement('div');
            lineDiv.id = 'line'

            var div1 = document.createElement('div');
            div1.className = 'line_code code';
            // div1.innerHTML =
            var html1 = '<svg xmlns="http://www.w3.org/2000/svg">\n\
    <line x1="20"  y1="100" x2="2800"  y2="100" stroke="#000"/>\n\
</svg>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            lineDiv.appendChild(div1);

            var div2 = document.createElement('div');
            div2.className = 'line_code code';
            var html2 =  '<svg xmlns="http://www.w3.org/2000/svg">\n\
    <defs>\n\
        <linearGradient id="myLinearGradient1"\n\
            x1="0%" y1="0%"\n\
            x2="100%" y2="100%"\n\
            stroke-dasharray="20 10"\n\
            stroke-opacity =".8"\n\
            <stop offset="0%"   stop-color="rgba(255,0,0,1)" />\n\
            <stop offset="100%" stop-color="rgba(89,220,16,.6)"/>\n\
        </linearGradient>\n\
    </defs>\n\
    <line x1="10"  y1="10" x2="280"  y2="200" stroke="url(#myLinearGradient1)" stroke-width="5" troke-dasharray="20 10" stroke-linecap="round"/>\n\
</svg>';
            html2_encode = '<pre>' + fun.htmlencode(html2) + '</pre>';
            div2.innerHTML = html2_encode;
            lineDiv.appendChild(div2);
            document.body.appendChild(lineDiv);
        },
        //矩形
        '7':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'矩形').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ rect').attr(h2Attr);
            _self.rect = svg.rect(0,0,180,100).attr({
                'stroke':"#ccc",
                'stroke-width':3,
                'fill':'#88aa00',
                'transform':'matrix(1,0,0,1,100,180)'
            });
            _self.rect1 = svg.rect(0,0,180,100,20,20).attr({
                'fill':'#f60',
                'transform':'matrix(1,0,0,1,100,310)'
            });
            _self.rect2 = svg.rect(0,0,180,140).attr({
                'stroke':"#fc0",
                'stroke-width':3,
                'fill':'none',
                'transform':'matrix(1,0,0,1,100,435)'
            });
             _self.rect3 = svg.rect(0,0,180,100).attr({
                'stroke':"#f55",
                'stroke-width':3,
                'stroke-dasharray':'10 5',

                'fill':'none',
                'transform':'matrix(1,0,0,1,100,610)',
            });

            var rectDiv = document.createElement('div');
            rectDiv.id = 'rect'

            var div1 = document.createElement('div');
            div1.className = 'rect_code code';
            // div1.innerHTML =
            var html1 = '<rect x="0" y="0" width="180" height="100" stroke="#cccccc" fill="#88aa00" stroke-width="3">\n\
</rect>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            rectDiv.appendChild(div1);

            var div2 = document.createElement('div');
            div2.className = 'rect_code code';
            var html2 =  '<rect x="0" y="0" width="180" height="100" rx="20" ry="20" fill="#ff6600">\n\
</rect>';
            html2_encode = '<pre>' + fun.htmlencode(html2) + '</pre>';
            div2.innerHTML = html2_encode;
            rectDiv.appendChild(div2);

            var div3 = document.createElement('div');
            div3.className = 'rect_code code';
            var html3 =  '<rect x="0" y="0" width="180" height="140" stroke="#ffcc00" fill="none" style="stroke-width: 3px;">\n\
</rect>';
            html3_encode = '<pre>' + fun.htmlencode(html3) + '</pre>';
            div3.innerHTML = html3_encode;
            rectDiv.appendChild(div3);

            var div4 = document.createElement('div');
            div4.className = 'rect_code code';
            var html4 =  '<rect x="0" y="0" width="180" height="100" stroke="#ff5555" fill="none" style="stroke-width: 3px; stroke-dasharray: 10px, 5px;">\n\
</rect>';
            html4_encode = '<pre>' + fun.htmlencode(html4) + '</pre>';
            div4.innerHTML = html4_encode;
            rectDiv.appendChild(div4);


            document.body.appendChild(rectDiv);
        },
        //圆
        '8':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'圆').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ circle').attr(h2Attr);
            _self.circle = svg.circle(0,0,100).attr({
                'stroke':"green",
                'stroke-width':1,
                'fill':'yellow',
                'transform':'matrix(1,0,0,1,170,280)'
            });
            _self.circle2 = _self.circle.clone().attr({
                'fill':'red',
                'fill-opacity':.5,
                'stroke':'none',
                'transform':'matrix(1,0,0,1,120,550)'
            });
            _self.circle3 = _self.circle.clone().attr({
                'stroke':'none',
                'fill':'purple',
                'transform':'matrix(1,0,0,1,220,550)'
            });

            var circleDiv = document.createElement('div');
            circleDiv.id = 'circle'

            var div1 = document.createElement('div');
            div1.className = 'circle_code code';
            // div1.innerHTML =
            var html1 = '<circle cx="0" cy="0" r="100" stroke="#008000" style="stroke-width: 1px;" fill="#ffff00">\n\
</circle>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            circleDiv.appendChild(div1);

            var div2 = document.createElement('div');
            div2.className = 'circle_code code';
            var html2 =  '<circle cx="0" cy="0" r="100" stroke="none" style="stroke-width: 1px; fill-opacity: 0.5;" fill="#ff0000">\n\
</circle>';
            html2_encode = '<pre>' + fun.htmlencode(html2) + '</pre>';
            div2.innerHTML = html2_encode;
            circleDiv.appendChild(div2);
            document.body.appendChild(circleDiv);
        },
        //椭圆
        '9':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'椭圆').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ ellipse').attr(h2Attr);
            _self.ellipse = svg.ellipse(0,0,50,40).attr({
                fill:'purple',
                stroke:'none',
                transform:'matrix(3,0,0,3,200,450)'
            })

            var ellipseDiv = document.createElement('div');
            ellipseDiv.id = 'ellipse'

            var div1 = document.createElement('div');
            div1.className = 'ellipse_code code';
            // div1.innerHTML =
            var html1 = '<ellipse cx="0" cy="0" rx="50" ry="40" fill="#800080" stroke="none" transform="matrix(3,0,0,3,200,450)">\n\
</ellipse>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            ellipseDiv.appendChild(div1);
            document.body.appendChild(ellipseDiv);
        },
        //多边形和折线
        '10':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'折线和多边形').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ polyline & polygon').attr(h2Attr);
            var polyline = svg.polyline('0,50,25,0,75,0,100,50,75,100,25,100').attr({
                'stroke':'blue',
                'stroke-width':1,
                'fill':'none'
            })
            _self.polyline = svg.g(bgGridding(100,100),polyline).attr({
                  'transform':'matrix(2,0,0,2,100,190)'
             })

            var polygon = svg.polygon('0,50,25,0,75,0,100,50,75,100,25,100').attr({
                'stroke':'none',
                'stroke-width':1,
                'fill':'purple'
            })
            _self.polygon = svg.g(bgGridding(100,100),polygon).attr({
                'transform':'matrix(2,0,0,2,100,480)'
             })

            var polyDiv = document.createElement('div');
            polyDiv.id = 'poly'

            var div1 = document.createElement('div');
            div1.className = 'poly_code code';
            // div1.innerHTML =
            var html1 = '<polyline points="0,50,25,0,75,0,100,50,75,100,25,100" stroke="#0000ff" fill="none" style="stroke-width: 1px;">\n\
</polyline>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            polyDiv.appendChild(div1);

            var div2 = document.createElement('div');
            div2.className = 'poly_code code';
            var html2 =  '<polygon points="0,50,25,0,75,0,100,50,75,100,25,100" stroke="none" fill="#800080" style="stroke-width: 1px;">\n\
</polygon>';
            html2_encode = '<pre>' + fun.htmlencode(html2) + '</pre>';
            div2.innerHTML = html2_encode;
            polyDiv.appendChild(div2);
            document.body.appendChild(polyDiv);
        },
        '11':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'path路径').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 基本命令').attr(h2Attr);
            var pathDiv = document.createElement('div');
            pathDiv.id = 'path_base'

            var div1 = document.createElement('div');
            div1.className = 'path_code';
            // div1.innerHTML =
            var html1 = '<table class="table table-bordered">\
  <tr>\
    <th>命令</th>\
    <th>名称</th>\
    <th>参数</th>\
  </tr>\
  <tr>\
    <td>M</td>\
    <td>moveto 移动到</td>\
    <td>(x y)+</td>\
  </tr>\
  <tr>\
    <td>L</td>\
    <td>lineto 画线到</td>\
    <td>(x y)+</td>\
  </tr>\
  <tr>\
    <td>H</td>\
    <td>horizontal lineto 水平线到</td>\
    <td>x+</td>\
  </tr>\
  <tr>\
    <td>V</td>\
    <td>vertical lineto 垂直线到</td>\
    <td>y+</td>\
  </tr>\
  <tr>\
    <td>C</td>\
    <td>curveto 三次贝塞尔曲线到</td>\
    <td>(x1 y1 x2 y2 x y)+</td>\
  </tr>\
  <tr>\
    <td>S</td>\
    <td>smooth curveto 光滑三次贝塞尔曲线到</td>\
    <td>(x2 y2 x y)+</td>\
  </tr>\
  <tr>\
    <td>Q</td>\
    <td>quadratic Bézier curveto 二次贝塞尔曲线到</td>\
    <td>(x1 y1 x y)+</td>\
  </tr>\
  <tr>\
    <td>T</td>\
    <td>smooth quadratic Bézier curveto 光滑二次贝塞尔曲线到</td>\
    <td>(x y)+</td>\
  </tr>\
  <tr>\
    <td>A</td>\
    <td>elliptical arc 椭圆弧</td>\
    <td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td>\
  </tr>\
  <tr>\
    <td>Z</td>\
    <td>closepath 关闭路径</td>\
    <td>(none)</td>\
  </tr>\
</table>';
            div1.innerHTML = html1;
            pathDiv.appendChild(div1);
            document.body.appendChild(pathDiv);
        },
        //path
        '12':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'path路径').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 画线').attr(h2Attr);
            
            var path = svg.path('M10 10 L50 50 M50 60 H140 M50 70 V140').attr({
                    fill:'none',
                    stroke:'#600'
            })
            _self.path1 = svg.g(bgGridding(),path).attr({
                transform:'matrix(1.5,0,0,1.5,100,240)'
            })
           
            var pathDiv = document.createElement('div');
            pathDiv.id = 'path2'

            var div1 = document.createElement('div');
            div1.className = 'path2_code code';
            // div1.innerHTML =
            var html1 = '<path d="M10 10 L50 50 M50 60 H140 M50 70 V140" fill="none" stroke="#660000"></path>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            pathDiv.appendChild(div1);
            document.body.appendChild(pathDiv);
        },
        //quadratic Bézier
        '13':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'path路径').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 二次贝塞尔曲线').attr(h2Attr);

            _self.img = svg.image('img/quadratic.png').attr({
                transform:'matrix(1,0,0,1,100,200)'
            });

            var pathDiv = document.createElement('div');
            pathDiv.id = 'path3'

            var div1 = document.createElement('div');
            div1.className = 'path3_code code';
            // div1.innerHTML =
            var html1 = '<path d="M 0 100 Q 50,30 200 100" fill="none" stroke="#660000"></path>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            pathDiv.appendChild(div1);
            document.body.appendChild(pathDiv);

            var path = 'M 0 100 Q 50 30 200 100';
            var originPath = {};
            var newPath = {};
            originPath.arr = path.split(' ');
            newPath.arr  = path.split(' ');
            originPath.x = originPath.y = newPath.x = newPath.y = 0;
            var code = document.querySelector('pre');

            var quadratic = svg.path(path).attr({
                fill:'none',
                'stroke':'#600'
            });

            var dot = svg.circle(50,30,3).attr({
                stroke:'none',
                fill:'blue',
                cursor:'move'
            }).drag(
                function(x,y){
                    newPath.x = originPath.x + x;
                    newPath.y = originPath.y + y;
                    dot.attr({
                        transform:'matrix(1,0,0,1,'+newPath.x+','+newPath.y+")'"
                    })
                    newPath.arr[4] = +originPath.arr[4] + x;
                    newPath.arr[5] = +originPath.arr[5] + y;
                    quadratic.node.attributes['d'].value = newPath.arr.join(' ');
                    code.innerHTML = code.innerHTML.replace(/d="(.*?)"/g,'d="'+  newPath.arr.join(' ') +'"');
                },function(x,y,z,t,e){
                    dot.attr('fill-opacity',.4)
                },function(e){
                    dot.attr('fill-opacity',1);
                    originPath  =   JSON.parse(JSON.stringify(newPath));
                }
            );
            _self.quadratic = svg.g(bgGridding(200,150),quadratic,dot).attr({
                transform:'matrix(1.5,0,0,1.5,100,480)'
            })
        },
        //
        '14':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'path路径').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 三次贝塞尔曲线').attr(h2Attr);

            _self.img = svg.image('img/svg-bezier.png').attr({
                transform:'matrix(1,0,0,1,80,200)'
            });
            _self.img2 = svg.image('img/svg-bezier-2.png').attr({
                transform:'matrix(.8,0,0,.8,450,200)'
            });
           
            var pathDiv = document.createElement('div');
            pathDiv.id = 'path4'

            var div1 = document.createElement('div');
            div1.className = 'path3_code code';
            // div1.innerHTML =
            var html1 = '<path d="M 0 100 C 50 10 150 190 200 100" fill="none" stroke="#660000"></path>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            pathDiv.appendChild(div1);
            document.body.appendChild(pathDiv);

            var path = 'M 0 100 C 50 10 150 190 200 100';
            var quadratic = svg.path(path).attr({
                fill:'none',
                'stroke':'#600'
            });

            var originPath = {};
            var newPath = {};
            originPath.arr = path.split(' ');
            newPath.arr  = path.split(' ');
            originPath.x = originPath.y = originPath.x1 = originPath.y1 = 0;
            newPath.x = newPath.y =  newPath.x1 = newPath.y1 = 0;
            var code = document.querySelector('pre');
           
            var dot = svg.circle(50,10,3).attr({
                stroke:'none',
                fill:'blue',
                cursor:'move'
            }).drag(
                function(x,y){
                    newPath.x = originPath.x + x;
                    newPath.y = originPath.y + y;
                    dot.attr({
                        transform:'matrix(1,0,0,1,'+newPath.x+','+newPath.y+")'"
                    })
                    newPath.arr[4] = +originPath.arr[4] + x;
                    newPath.arr[5] = +originPath.arr[5] + y;
                    quadratic.node.attributes['d'].value = newPath.arr.join(' ');
                    code.innerHTML = code.innerHTML.replace(/d="(.*?)"/g,'d="'+  newPath.arr.join(' ') +'"');
                },function(x,y,z,t,e){
                    dot.attr('fill-opacity',.4)
                },function(e){
                    dot.attr('fill-opacity',1);
                    originPath  =   JSON.parse(JSON.stringify(newPath));
                }
            );
            var dot2 = svg.circle(150,190,3).attr({
                stroke:'none',
                fill:'blue',
                cursor:'move'
            }).drag(
                function(x,y){
                    newPath.x1 = originPath.x1+ x;
                    newPath.y1 = originPath.y1 + y;
                    dot2.attr({
                        transform:'matrix(1,0,0,1,'+newPath.x1+','+newPath.y1+")'"
                    })
                    newPath.arr[6] = +originPath.arr[6] + x;
                    newPath.arr[7] = +originPath.arr[7] + y;
                    quadratic.node.attributes['d'].value = newPath.arr.join(' ');
                    code.innerHTML = code.innerHTML.replace(/d="(.*?)"/g,'d="'+  newPath.arr.join(' ') +'"');
                },function(x,y,z,t,e){
                    dot2.attr('fill-opacity',.4)
                },function(e){
                    dot2.attr('fill-opacity',1);
                    originPath  =   JSON.parse(JSON.stringify(newPath));
                }
            );
            _self.quadratic = svg.g(bgGridding(200,200),quadratic,dot,dot2).attr({
                transform:'matrix(1.5,0,0,1.5,80,440)'
            })
        },
        //arc
        '15':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'path路径').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 扇形').attr(h2Attr);

            var arcs = svg.path('M50,50 A50,50 0 0,1 100,100').attr({
                fill:'none',
                stroke:'#600'
            });
            _self.arcs = svg.g(bgGridding(150,150),arcs).attr({
                transform:'matrix(2,0,0,2,40,200)'
            })

            var p = '<p>绘制圆弧指令：A</p>\
<p>rx ry x-axis-rotation large-arc-flag sweep-flag x y</p>\
<p>SVG路径中的A指令有7个参数，分别控制曲线的的各个属性。下面解释一下参数的含义：rx, 弧的半长轴长度 ,ry 弧的半短轴长度</p>\
<p>x-axis-rotation 是此段弧所在的x轴与水平方向的夹角，即x轴的逆时针旋转角度，负数代表顺时针转动的角度。</p>\
<p>large-arc-flag 为1 表示大角度弧线，0 代表小角度弧线。</p>\
<p>sweep-flag 为1代表从起点到终点弧线绕中心顺时针方向，0 代表逆时针方向。</p>\
<p>x,y 是弧终端坐标。</p>';
            var acrDiv = document.createElement('div');
            acrDiv.id = 'acr'

            var div1 = document.createElement('div');
            div1.className = 'acr1_code code';
            // div1.innerHTML =
            var html1 = p;
            html1_encode = '<pre>' + (html1) + '</pre>';
            div1.innerHTML = html1_encode;
            acrDiv.appendChild(div1);
            document.body.appendChild(acrDiv);

            var arcs1 = svg.path('M50,50 A50,50 0 0,0 100,100').attr({
                fill:'none',
                stroke:'#600'
            });
            var arcs2 = svg.path('M50,50 A50,50 0 0,1 100,100').attr({
                fill:'none',
                stroke:'#600',
                transform:'matrix(1,0,0,1,100,0)'
            });
            var arcs3 = svg.path('M50,50 A50,50 0 1,0 100,100').attr({
                fill:'none',
                stroke:'#600',
                transform:'matrix(1,0,0,1,260,0)'
            });
            var arcs4 = svg.path('M50,50 A50,50 0 1,1 100,100').attr({
                fill:'none',
                stroke:'#600',
                transform:'matrix(1,0,0,1,320,0)'
            });

            _self.arcsArr = svg.g(bgGridding(600,180),arcs1,arcs2,arcs3,arcs4).attr({
                transform:'matrix(1,0,0,1,40,550)'
            })

        },
        //bingzhuangtu
        '16':function(){
              var _self = shape[FRAME] = {};
              _self.title = svg.text(0,0,'path路径').attr(titleAttr);
              _self.h2 = svg.text(50,150,'▪ 扇形实例 饼状图').attr(h2Attr);
              _self.ul = svg.text(80,200,'Top 10 Most Popular Programming Languages 2014').attr(liAttr).attr('color','#666');
              var data = [22,17,16,12,11,9,5,3,3,2];
              var dataText = ['javascript','php','java','html','c#','python','c++','object-c','r','c'];

              (function(){
                var angleData = [];
                for(var i = 0;i<data.length;i++){
                  angleData.push(360 * (data[i]/100).toFixed(2));
                }
                window.angleData = angleData;
              })(data)
              
              var r = 80;
              var dot         = {x:0,y:0};
              var startPoint  = {x:dot.x,y:dot.y-r},
                  endPoint    = {};
              var largeArcFlag = 0;
              var g = 0;
              var angle = 0;
              var all = {};

              var svgG = svg.paper.g();
              svgG.add(bgGridding(200,200).attr({
                'transform':'matrix(1,0,0,1,-100,-100)',
                'opacity':0
              }));
              var svgRtext = svg.paper.g();
              var padding = 0;
              for(i=0; i<angleData.length; i++){
                
                if(angleData[i] > 180 ){
                  largeArcFlag = 1;
                }

                g += angleData[i];
                angle = g;

                if(angle <= 90){

                }else if(angle <= 180){
                  angle = 180 - angle; 
                }else if(angle <= 270){
                  angle = angle - 180;
                }else{
                   angle = 360 - angle;
                }
                // console.log(angle);
                //
                endPoint.x = r * Math.sin(angle*Math.PI/180);
                endPoint.y = r * Math.cos(angle*Math.PI/180);
                //
                var text = {};
                var _len =  (r/2) / Math.cos(angle/2*Math.PI/180);
                // console.log(_len);
                var _angle = (90 - angle/2);
                text.x = _len * Math.cos(angle/2*Math.PI/180);
                text.y = _len * Math.sin(angle/2*Math.PI/180) - 5;
                //
                if(g <= 90){
                  endPoint.y = - endPoint.y;
                  text.y  = - text.y;
                }else if(g <= 180){
                  
                }else if(g <= 270){
                  endPoint.x = - endPoint.x;
                  text.x = - text.x;
                }else{
                  endPoint.x = - endPoint.x;
                  endPoint.y = - endPoint.y;
                  text.x = - text.x;
                  text.y = - text.y;
                }

                //draw
                var pathArr = ['M', dot.x, dot.y, 'L', startPoint.x, startPoint.y,
                               'A', r, r, 0, largeArcFlag, 1, endPoint.x, endPoint.y];
                var path = pathArr.join(' ');
                
                var cr = parseInt(Math.random()*255);
                var cg = parseInt(Math.random()*255);
                var cb = parseInt(Math.random()*255);
                var rgbColor = 'rgb('+ cr +','+ cg + ',' + cb+')';

                var _path = svg.path(path).attr({
                    stroke:'none',
                    fill:rgbColor,
                  })
                svgG.add(_path);
                //
                startPoint.x =  endPoint.x;
                startPoint.y =  endPoint.y;

                padding += data[i];
                svgRtext.add(svg.rect(140,25*i,8,8).attr({
                  fill:rgbColor,
                  transform:'matix(1,0,0,1,-10,-8)'
                }));

                svgRtext.add(svg.text(140,25*i,data[i] + '%' + ' ' + dataText[i])).attr({
                  'text-anchor':'right',
                });
                svgRtext.attr({
                  transform:'matix(1,0,0,1,400,320)'
                })
              }
              //
              svgG.attr({
                transform:'matix(2,0,0,2,300,420)'
              })
              _self.svgG = svgG;
              _self.svgRtext = svgRtext;
              //
              _self.code = svg.text(100,670,'<path d="M 0 0 L 0 -80 A 80 80 0 0 1 78.6 -15" stroke="none" fill="#3d8194"></path>').attr({
                id:'code',
                fill:"#c7254e",
                opacity:0
              })
              _self.svgG.click(function(){
                _self.svgG.select('rect').attr('opacity',1);
                _self.code.attr('opacity',1);
              })
        },
        //g
        '17':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'g').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ 组合').attr(h2Attr);
            _self.circleArr = svg.g(
                svg.circle(0,0,100),
                svg.circle(0,0,80),
                svg.circle(0,0,60),
                svg.circle(0,0,40),
                svg.circle(0,0,20),
                svg.circle(0,0,5),
                svg.text(0,0,'g标签').attr({
                    'fill':'yellow',
                    'text-anchor':'middle',
                    'font-size':20
                })
            ).attr({
                // 'fill':'r(.5,.5,.5,.5,.5)rgba(246,241,7,1)-rgba(246,241,7,.0)',
                'fill':'l(1,0,1,1)rgba(255,0,0,1)-rgba(89,220,16,.6)',
                'stroke-opacity':.4,
                'stroke':'gray',
                'stroke-width':3,
                'transform':'matrix(1.5,0,0,1.5,200,420)'
            });

            var gDiv = document.createElement('div');
            gDiv.id = 'g'

            var div1 = document.createElement('div');
            div1.className = 'g_code code';
   
            var html1 = '<g fill="url(\'#Si42ho681d\')" style="stroke-opacity: 0.4; stroke-width: 3px;" stroke="#808080" transform="matrix(1.5,0,0,1.5,250,400)">\n\
    <circle cx="0" cy="0" r="100"></circle>\n\
    <circle cx="0" cy="0" r="80"></circle>\n\
    <circle cx="0" cy="0" r="60"></circle>\n\
    <circle cx="0" cy="0" r="40"></circle>\n\
    <circle cx="0" cy="0" r="20"></circle>\n\
    <circle cx="0" cy="0" r="5"></circle>\n\
    <text x="0" y="0" fill="yellow" style="text-anchor: middle; font-size: 20px;">g标签</text>\n\
</g>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            gDiv.appendChild(div1);
            document.body.appendChild(gDiv);
        },
        //text
        '18':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'文本').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ text').attr(h2Attr);
            (function(){
                var text1 = svg.text(50,20,'这是文本1');
                var text2 = svg.text(50,50,'这是文本2').attr('text-anchor','start');
                var text3 = svg.text(50,80,'这是文本3').attr('text-anchor','middle');
                var text4 = svg.text(50,110,'这是文本4').attr('text-anchor','end');
                var line = svg.line(50,0,50,120).attr('stroke','red');
                _self.text1 = svg.g(bgGridding(120,120),text1,text2,text3,text4,line).attr({
                transform:'matrix(2,0,0,2,100,200)'
                })
            })(_self);

            (function(){
                var text1 = svg.text(20,20,'Fill only').attr({
                    'fill':'red',
                    'font-size':22
                });
                var text2 = svg.text(20,50,'Stroke only').attr({
                    'stroke':'blue',
                    'stroke-width':'.5',
                    'fill':'none',
                    'font-size':18
                });
                var text3 = svg.text(20,80,'Fill and stroke').attr({
                    'stroke':'red',
                    'stroke-width':'.5',
                    'font-size':24
                });
                var text4 = svg.text(190,0,'竖排文本').attr({
                    'writing-mode': 'tb',
                    'glyph-orientation-vertical':90,

                });
                //
                var text5 = svg.text(190,110,'倒过来念的是猪').attr({
                    'direction': 'rtl',
                    'unicode-bidi': 'bidi-override',
                    'font-family':"方正楷体_GBK",
                    'font-size':20,
                    'fill':'l(0,0,1,1)rgba(255,0,0,1)-rgba(89,220,16,.6)',
                    'fill-rule':'nonezero'
                });
                _self.text2 = svg.g(text1,text2,text3,text4,text5).attr({
                    transform:'matrix(2,0,0,2,450,200)'
                })
               
            })(_self);

            (function(){
                var text3 = svg.text(0,20,['ABCDE']);
                text3.select('tspan').attr({
                    dx:"0 10 20 30 10",
                    // dy:"0 10 20 30 10"
                }).click(function(){
                    this.attr('dy','0,10,10,10,10')
                })
                _self.text3 = svg.g(bgGridding(120,100),text3).attr({
                    transform:'matrix(2,0,0,2,100,500)'
                })
            })(_self);

            (function(){
                var text = 'Text along a more advanced path with lines and curves';
                var path ="M75,20 l100,0 l100,30 q0,100 150,100";
                _self.pathText = svg.text(20,20,text).attr({
                    'textpath':path,
                    'transform':'matrix(1,0,0,1,400,500)'
                });
                var text2 = "沿路径环绕文本";
                var path2 = "M0,-50 A 50 50 0 1 1 0 -49.5 z";
                _self.pathText1 = svg.text(0,0,text2).attr({
                    'textpath':path2,
                    'letter-spacing': 18,
                    'fill':'green',
                    'transform':'matrix(1,0,0,1,520,700)',
                });
            })(_self);

            
        },
        //image
        '19':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'图像').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ image').attr(h2Attr);
            _self.img = svg.image('img/mv.jpg',0, 0, 80, 50).attr({
                transform:'matrix(8,0,0,8,180,220)'
            })
        },
        //a link
        '19':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'超链接').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ a').attr(h2Attr);

            var aDiv = document.createElement('div');
            aDiv.id = 'a'

            var div1 = document.createElement('div');
            div1.className = 'a_code code';
       
            var html1 = '<svg xmlns="http://www.w3.org/2000/svg"\n\
    xmlns:xlink="http://www.w3.org/1999/xlink">\n\
    <a xlink:href="/svg/index.html">\n\
        <text x="10" y="20">/svg/index.html</text>\n\
    </a>\n\
    <a xlink:href="/svg/index.html" target="_blank">\n\
        <text x="10" y="80">m/svg/index.html\n\
         (target="_blank")</text>\n\
    </a>\n\
    <a xlink:href="/svg/index.html" target="_top">\n\
        <text x="10" y="100">/svg/index.html\n\
        (target="_top")</text>\n\
    </a>\n\
</svg>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            aDiv.appendChild(div1);
            document.body.appendChild(aDiv);
        },
        //defs
        '20':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'定义').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ defs').attr(h2Attr);
            var graph = svg.g(
                svg.circle(0,0,50),
                svg.rect(0,0,50,50),
                svg.circle(0,0,4).attr('fill','#fff')
            ).attr({
                fill:'green',
                transform:'matrix(1,0,0,1,200,200)',
                id:'defs_shape'
            }).toDefs();
            svg.append(svg.use().attr({
                'xlink:href':'#defs_shape',
                'x':0,
                'y':100
            }))
            svg.append(svg.use().attr({
                'xlink:href':'#defs_shape',
                'x':0,
                'y':240
            }))
            _self.use = svg.selectAll('use');

            var defsDiv = document.createElement('div');
            defsDiv.id = 'defs'

            var div1 = document.createElement('div');
            div1.className = 'defs_code code';
       
            var html1 = '<svg>\n\
  <defs>\n\
    <g id="shape">\n\
        <rect x="50" y="50" width="50" height="50" />\n\
        <circle cx="50" cy="50" r="50" />\n\
    </g>\n\
  </defs>\n\
  <use xlink:href="#shape" x="0" y="100" />\n\
  <use xlink:href="#shape" x="0" y="240" />\n\
</svg>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            defsDiv.appendChild(div1);
            document.body.appendChild(defsDiv);
            _self.ul = svg.text(100,650,'渐变色 、滤镜').attr(liAttr);
        },
        '21':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'渐变').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ Linear Gradients').attr(h2Attr);
            _self.linearGradient = svg.rect(0,0,150,150).attr({
                fill:'l(0,0,0,1)rgb(255,0,0)-rgba(0,255,0)',
                'transform':'matrix(1,0,0,1,100,220)'
            })

            _self.h21 = svg.text(50,450,'▪ Radial Gradients').attr(h2Attr);
            _self.radialGradient = svg.circle(0,0,80,80).attr({
                fill:'r(.5,.5,.5)rgba(255,0,0,1):60-rgba(255,255,0,.2)',
                'transform':'matrix(1.2,0,0,1.2,170,590)'
            })

            var gradientsDiv = document.createElement('div');
            gradientsDiv.id = 'gradient'

            var div1 = document.createElement('div');
            div1.className = 'gradient_code code';
            // div1.innerHTML =
            var html1 = '<linearGradient x1="0" y1="0" x2="0" y2="1" id="Si43t2iqs7">\n\
    <stop offset="0%" stop-color="#ff0000"></stop>\n\
    <stop offset="100%" stop-color="#00ff00"></stop>\n\
</linearGradient>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            gradientsDiv.appendChild(div1);

            var div2 = document.createElement('div');
            div2.className = 'gradient_code code';
            var html2 =  '<radialGradient cx="0.5" cy="0.5" r="0.5" id="Si43t574ua">\n\
    <stop offset="60%" stop-color="#ff0000"></stop>\n\
    <stop offset="100%" stop-color="#ffff00" stop-opacity="0.2"></stop>\n\
</radialGradient>';
            html2_encode = '<pre>' + fun.htmlencode(html2) + '</pre>';
            div2.innerHTML = html2_encode;
            gradientsDiv.appendChild(div2);
            document.body.appendChild(gradientsDiv);
        },
        '22':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'裁切').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ clip-path').attr(h2Attr);

            var rect = svg.rect(15,15,40,40);

            var circle = svg.circle(25,25,20).attr({
                fill:'purple'
            }).click(function(){
                this.attr('clip-path',rect)
            })

            _self.clip1 = svg.g(rect,circle).attr({
                transform:'matrix(2.5,0,0,2.5,100,200)'
            })
            
            var text = svg.text(5,55,'这是一段文本').attr({
                'font-size':32,
                'font-family':"方正姚体_GBK"
            }).toDefs();
            var rect1 = svg.rect(0,0,200,100).attr({
                'fill':'l(0,0,1,1)rgb(255,0,0):23-rgb(0,255,0):50-rgb(0,0,255)',
                'clip-path':text
            })
            _self.clip2 = svg.g(rect1).attr({
                transform:'matrix(1.5,0,0,1.5,500,200)'
            })

            var pathValue = 'M736 684c-65.952 0-128.576-25.024-176.384-70.464-4.576-4.32-28.672-28.736-47.328-47.68L464.96 612.96C417.12 658.784 354.272 684 288 684c-141.152 0-256-114.848-256-256 0-82.432 41.184-144.288 76.48-182.496l316.896-320.128C450.464-99.68 478.304-116 512-116c33.696 0 61.568 16.32 86.752 41.504l316.736 320 2.208 2.464C955.904 295.616 992 340.608 992 428 992 569.152 877.152 684 736 684z';
            var heart = svg.path(pathValue).attr({
                fill:'red',
                'transform':"matrix(.01,0,0,.01,35,10)"
                // 'transform':"matrix(.4,0,0,.4,35,20) rotate(180deg)"
            })

            _self.img = svg.image('img/mv.jpg',0, 0, 80, 50).attr({
                transform:'matrix(6,0,0,6,240,400)',
                'clip-path':heart
            }).click(function(){
                heart.animate({
                    'transform':"matrix(.06,0,0,.06,10,8) rotate(540deg)"
                },800);
            })
        },
        //mark
        '23':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'遮照').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ Mask').attr(h2Attr);

            
            var _mask = svg.rect(5,0,90,50).attr('fill','#fff');
            var rect = svg.rect(0,0,100,100).attr('fill','purple').click(function(){
                this.attr('mask',_mask)
            })
            var blackBtn = svg.text(120,15,'黑 #000').attr('class','btn').data('color','#000');
            var grayBtn = svg.text(120,45,'灰 #ccc').attr('class','btn').data('color','#ccc');

            svg.selectAll('.btn').forEach(function(element,index){
                element.click(function(){
                    var color = element.data('color');
                    _mask.attr({
                        fill:color
                    })
                })
            });
            // console.log(a);
            _self.mask1 = svg.g(bgGridding(180,180),rect,_mask,blackBtn,grayBtn).attr({
                transform:"matrix(1.5,0,0,1.5,60,200)"
            })

            //
            var maskCircle = svg.circle(175,140,60);
            maskCircle.attr({
                fill:'r(.5,.5,.5)rgba(255,255,255,1):70-rgba(255,255,255,.2)',
            })
            var img = svg.image('img/mv2.jpg',0,0).attr('mask',maskCircle).click(function(){
                maskCircle.attr('class','mask')
            });
            _self.mask2 = svg.g(img).attr({
                transform:'matrix(1,0,0,1,450,90)'
            })

            var maskDiv = document.createElement('div');
            maskDiv.id = 'mask'

            var div1 = document.createElement('div');
            div1.className = 'mask_code code ';
            // div1.innerHTML =
            var html1 = '<radialGradient cx="0.5" cy="0.5" r="0.5" id="Si43zqftae">\n\
    <stop offset="70%" stop-color="#ffffff"></stop>\n\
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2"></stop>\n\
</radialGradient>';
            html1_encode = '<pre>' + fun.htmlencode(html1) + '</pre>';
            div1.innerHTML = html1_encode;
            maskDiv.appendChild(div1);
            document.body.appendChild(maskDiv);

        },
        //transform
        '24':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'变形').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ transform').attr(h2Attr);
            //缩放
            var rect1 = svg.rect(0,0,200,120).attr({
                'fill':'red',
            }).hover(function(){
                var m = new Snap.Matrix();
                this.transform(m.scale(1.2, 1.2,100,60))
            })
            var scale = svg.text(0,180,'scale 缩放').attr(liAttr);
            _self.rect1 = svg.g(bgGridding(300,150),rect1,scale).attr({
                transform:'matrix(1,0,0,1,100,200)'
            })
            //旋转
            var rect2 = svg.rect(0,0,200,120).attr({
                'fill':'green',
            }).hover(function(){
                var m = new Snap.Matrix();
                this.transform(m.rotate(60,100,60))
            })
            var rotate = svg.text(0,180,'rotate 旋转').attr(liAttr);
            _self.rect2 = svg.g(bgGridding(300,150),rect2,rotate).attr({
                transform:'matrix(1,0,0,1,600,200)'
            })
            //移动
            var rect3 = svg.rect(0,0,200,120).attr({
                'fill':'blue',
            }).hover(function(){
                var m = new Snap.Matrix();
                this.transform(m.translate(100,50))
            })
            var translate = svg.text(0,180,'translate 移动').attr(liAttr);
            _self.rect3 = svg.g(bgGridding(300,150),rect3,translate).attr({
                transform:'matrix(1,0,0,1,100,500)'
            })
            //倾斜
            var rect4 = svg.rect(0,0,200,120).attr({
                'fill':'yellow',
            }).hover(function(){
                var m = new Snap.Matrix();
                this.attr('transform','matrix(1,-.12,0,1,0,0)')
            })
            var skew = svg.text(0,180,'skew 倾斜').attr(liAttr);
            _self.rect4 = svg.g(bgGridding(300,150),rect4,skew).attr({
                transform:'matrix(1,0,0,1,600,500)'
            })
        },
        //animate
        '25':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'动画').attr(titleAttr).attr('y',-25).animate({
                y:80
            },500,mina.bounce).click(function(){
                _self.oCar.attr('opacity',1)
            })
            _self.h2 = svg.text(50,150,'▪ animate').attr(h2Attr);

            //旋转
            var rect1 = svg.rect(0,0,200,120).attr({
                'fill':'purple',
            }).hover(function(){
                this.animate({
                    'transform':'rotate(870,100,60) scale(1.5,1.5,100,60)'
                },1000)
             }            
            )
            _self.rect1 = svg.g(bgGridding(300,150),rect1).attr({
                transform:'matrix(1,0,0,1,100,200)'
            })
           
            
            // path
            var motion_pah = 'M 0.77736539,283.81539 C 36.820214,203.65902 15.95939,106.88011 67.021498,32.113291 89.634458,-8.5319867 155.06122,-14.80713 180.74025,25.808581 c 17.3248,34.77157 17.03552,75.435369 23.33862,113.273299 6.30195,32.99062 11.71071,75.84102 45.67688,91.66747 47.24346,18.20825 91.40718,-14.78945 134.93297,-28.24473 37.93516,-10.08892 70.34574,17.60339 104.02649,29.07363 20.71322,2.87761 52.12426,1.08613 72.75542,2.33867 L 650 230';
            var motion_arr = {
                'path':motion_pah,
                'begin':'0s',
                'dur':'8s',
                'repeatCount':'indefinite',

                'rotate':'auto',
            }
            _self.path1 = svg.path(motion_pah).attr({
                fill:'none',
                'stroke':'purple',
                transform:'matrix(1,0,0,1,300,400)'
            })
            //car
            var car = svg.path('m 62.870536,12.352679 0,60 -57.1562503,0 0,65.718751 18.0937503,0 c -0.70251,2.74059 -1.09375,5.60285 -1.09375,8.5625 0,19.01 15.4275,34.4375 34.4375,34.4375 19.01,0 34.40625,-15.4275 34.40625,-34.4375 0,-2.95974 -0.3912,-5.82184 -1.09375,-8.5625 l 42.781254,0 c -1.25948,3.57744 -1.9375,7.42933 -1.9375,11.4375 0,19.01 15.39625,34.40625 34.40625,34.40625 19.01,0 34.40625,-15.39625 34.40625,-34.40625 0,-4.00817 -0.67802,-7.86006 -1.9375,-11.4375 l 21.8125,0 0,-65.718751 -45.71875,0 0,-60 -111.406254,0 z').attr({
                fill:'#ccc',
                transform:'matrix(.4,0,0,.4,0,-40)'
            })

            var svgNS = 'http://www.w3.org/2000/svg';           
            function createTag(tag,objAttr){    
                var oTag = document.createElementNS(svgNS , tag);   
                for(var attr in objAttr){
                    oTag.setAttribute(attr , objAttr[attr]);
                }   
                return oTag;    
            }
           
            var motion_pah_obj = createTag('animateMotion',motion_arr);
            car.node.appendChild(motion_pah_obj);
            _self.oCar =  svg.g(car).attr({
                transform:'matrix(1,0,0,1,300,400)',
                'opacity':0
            });
        },
        //snap.svg.js && inkscape
        '26':function(){
            var _self = shape[FRAME] = {};
            _self.title = svg.text(0,0,'snap.svg.js && inkscape').attr(titleAttr);
            _self.h2 = svg.text(50,150,'▪ snap.svg.js').attr(h2Attr);
            _self._img = svg.image('./img/snap.svg.png',100,220,62,100);
            _self.text1 = svg.text(80,360,'Snap.svg是一个强大且直观的SVG动画内容操纵API，能够帮助开发人员创建带有SVG功能的网页，并支持屏蔽、裁剪、全梯度和组别等功能。')
            _self.h21 = svg.text(50,450,'▪ inkscape').attr(h2Attr);
            _self._img2 = svg.image('./img/inkscape.png',100,480,100,100);
            _self.text2 = svg.text(80,640,'Inkscape是一个开放原始码的向量绘图软件');
        },
        //end
        '27':function(){
            var _self = shape[FRAME] = {};
            _self.rect = svg.rect(0,0,1024,768).attr({
                fill:'r(.5,.5,.5)#ccc-#fff'
            })
            _self.txt = svg.text(512,374,'END').attr({
                'font-size':100,
                'text-anchor':'middle'
            })
        }

    },frameBack = {
        '1': function(){
            fun.clear();
        },
        '2': function(){
            fun.clear();
        },
        '3': function(){
            fun.clear();
        },
        '4': function(){
            fun.clear();
        },
        '5': function(){
            fun.clear();
        },
        '6': function(){
            fun.clear();
            document.querySelector('#line').remove();
        },
        '7': function(){
            fun.clear();
            document.querySelector('#rect').remove();
        },
        '8': function(){
            fun.clear();
            document.querySelector('#circle').remove();
        },
        '9': function(){
            fun.clear();
            document.querySelector('#ellipse').remove();
        },
        '10': function(){
            fun.clear();
            document.querySelector('#poly').remove();
        },
        '11': function(){
            fun.clear();
            document.querySelector('#path_base').remove();
        },
        '12': function(){
            fun.clear();
            document.querySelector('#path2').remove();
        },
        '13': function(){
            fun.clear();
            document.querySelector('#path3').remove();
        },
        '14': function(){
            fun.clear();
            document.querySelector('#path4').remove();
        },
        '15': function(){
            fun.clear();
            document.querySelector('#acr').remove();
        },
        '16': function(){
             fun.clear();
        },
        '17':function(){
            fun.clear();
            document.querySelector('#g').remove();
        },
        '18':function(){
            fun.clear();
        },
        '19':function(){
            fun.clear();
            document.querySelector('#a').remove();
        },
        '20':function(){
            fun.clear();
            document.querySelector('#defs').remove();
        },
        '21':function(){
            fun.clear();
            document.querySelector('#gradient').remove();
        },
        '22':function(){
            fun.clear();
        },
        '23':function(){
            fun.clear();
            document.querySelector('#mask').remove();
        },
        '24':function(){
            fun.clear();
        },
        '25':function(){
            fun.clear();
        },
        '26':function(){
            fun.clear();
        },
        '27':function(){
            fun.clear()
        }
    }
    //remove
    fun.remove = function(name) {
        if (shape[name]) {
            shape[name].remove();
            shape[name] = null;
        }
    };
    //clear
    fun.clear = function(frame){
        frame = frame || FRAME;
        for(var i in shape[frame]){
                if(shape[frame].hasOwnProperty(i)){
                    shape[frame][i].remove();
                }
            }
    }
    //html encode
    fun.htmlencode = function(s){ 
        var div = document.createElement('div');  
        div.appendChild(document.createTextNode(s));  
        return div.innerHTML;
    }
    //xml getAttributeValue
    fun.getAttributeValue = function  (xmlNode,attrName){
        if(!xmlNode)return "" ;
        if(!xmlNode.attributes) return "" ;   
        if(xmlNode.attributes[attrName]!=null) return xmlNode.attributes[attrName].value ;
        if(xmlNode.attributes.getNamedItem(attrName)!=null)  return xmlNode.attributes.getNamedItem(attrName).value ;
        return "" ;
    }
    //
    fun.frame = function(direction){
        frame[FRAME] && frame[FRAME]();
    }

    fun.frame();
    document.querySelector('#page_num').innerHTML = FRAME;

	
    fun.next = function(){
    	if(FRAME == 27) return;
            frameBack[FRAME] && frameBack[FRAME]('next');
            FRAME++;
            fun.frame();
            document.querySelector('#page_num').innerHTML = FRAME;
    }
    fun.prev = function(){
     	if(FRAME == 1) return;
            frameBack[FRAME] && frameBack[FRAME]('prev');
            FRAME--;
            fun.frame();
            document.querySelector('#page_num').innerHTML = FRAME;
    }
    //keypress
    document.addEventListener('keyup',function(event){
        //down:40
        //right:39
        //up:38
        //left:37
        // console.log(FRAME);
        // console.log(shape);
        switch (event.keyCode){
            case 39: case 40:
                fun.next();
                break;
            case 37: case 38:
            console.log(FRAME);
                fun.prev();
                break;
        }
    });

    //mousewheel
    document.addEventListener('mousewheel',function(event){
      if(event.wheelDelta<0){
	fun.next();
      }else{
 	fun.prev();
      }
    })
    // firefox
    document.addEventListener('DOMMouseScroll',function(event){
      if(event.detail<0){
          fun.prev();
      }else{
          fun.next();
      }
    })
//
})(window)
