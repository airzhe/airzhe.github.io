---
title: "使用awk处理csv文件"
date: 2020-01-06 15:00:00
tags: [awk,csv]
share: true
---

上周有个处理对账单的需求，从微信、招行下载每天的对账单，然后把订单号转成数据库里对应的商城单号，需求比较简单，打算用 shell 命令来写。

首先考虑了 join 命令，实现左连接、内连接都是没有问题的。

```
$ cat 1.csv 
No,Con
1,aaa
2,bbb
5,ccc

$ cat 2.csv
No,S_id
1,000555
5,000111
3,000333
8,000111

# 对1.csv、2.csv排序，使用逗号作为分隔符，用两个文件的第一列，跳过header，-a左连接。
$ join -t, -1 1 -2 1 -a 1 --header --nocheck-order <(sort -k 1 -n 1.csv) <(sort -k 1 -n 2.csv) 
No,Con,S_id
1,aaa,000555
2,bbb
5,ccc,000111
```

上面结果No = 2时后面没有补充逗号，而且格式化各列还需要 awk 再处理下，于是搜了下使用 awk 来实现 join
<!-- more -->

```
head 1.csv 2.csv 
==> 1.csv <==
1,aaa,,
2,bbb,,
5,ccc,r1,rrrr

==> 2.csv <==
1,000111
5,000555
3,000333
8,000111
r1,XXXR1

# FNR == NR 第一个文件时用第一列作数组 a 的下标，后面根据第二个文件的第一列是否在数组中，来则替换为对应的 value，循环+数组，感觉可以搞定一切.
awk 'BEGIN {
    FS = OFS = ",";
}
FNR == NR{
  	a[$1] = $2;
  	next 
}
{
	shop_id = $1;
	refund_id = $3;
	if ($1 in a) {
		shop_id = a[$1]
	};
	if ($3 in a) {
		refund_id=a[$3]
	};
	print shop_id","$2","refund_id","$4
}' 2.csv 1.csv
```

**生产使用** 其中 {} 里的为 php 变量

```
#列筛选
awk 'BEGIN {
    FS = OFS = ",";
}
{
    #清除列末尾空格
    gsub(/[ ]+$/, "", $18);
    #字符串链接
    $3  = ("{$date} "$3);
    #负数转正
    $16 = ($16 > 0) ? $16 :(-1) * $16;
    $26 = ($26 > 0) ? $26 :(-1) * $26;
    trade_no = $10 ; refund_no = "";
    if ($23 == "退款") {
        #获取对应的支付中心单号
        refund_no = trade_no;
        trade_no = "";
        $23 = "REFUND";
        $38 = ($38 == "S" ? "SUCCESS" : $38);
    } else {
        $23 = "SUCCESS";
        $38 = "";
    };
    #支付中心单号放最后面
    printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\\n",
    $3,$4,$5,$8,"","JSAPI",$23,$16,$24,"",$26,$38,$27,$17,$18,trade_no,refund_no
}' {$billFile} \
| sed '1d;N;\$d;P;D' > {$tmpFile}

#join 多个文件,通过 FNR==1 第一行时 {f++} 来判断是第几个文件
awk 'BEGIN {
    FS = OFS =",";
    printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\\n",
    "交易时间","公众账号ID","商户号","招行订单号","商城订单id","交易类型","交易状态","应结订单金额","招行退款单号","商城退单号","退款金额","退款状态","商品名称","手续费","费率","支付中心订单号","支付中心退单号"
}
FNR == 1 { 
    f++
} 
f == 1 { 
    rno2tno[$1] = $2;
    next
}
f == 2 { 
    no2id[$1] = $2;
    next
}
{    
    refund_no = $17;
    #根据refund_no取trade_no做兼容
    if (refund_no in rno2tno) {
        $16 = rno2tno[refund_no]
    }
    trade_no = $16;
    if (trade_no in no2id) {
        $5 = no2id[trade_no]
    };
    if (refund_no in no2id) {
        $10 = no2id[refund_no]
    };
    print $0
}' {$refundTradeMappingFile} {$mappingFile} {$tmpFile} > {$targetFile}
```

**其他的一些命令**

```
cut -f1,3,6,7,9,10,13,15-17,19-21,23-26 -d"," wx-20191221.csv > a.csv #使用cut来选择列
sed '1d;N;$d;P;D' a.csv #删除第一行和最后两行
```

**使用 GuzzleHttp\Client 来存储文件**

```sh
$client = new \GuzzleHttp\Client();
#$params[\GuzzleHttp\RequestOptions::TIMEOUT] = -1; 不能设置超时时间
$params['sink'] = '/path/to/file';
$response = $client->request($method, $url, $params);
```



参考:

https://stackoverflow.com/questions/42443801/how-to-join-3-files-using-awk

https://stackoverflow.com/questions/27600967/merge-csv-files-using-join-awk-sed

http://docs.guzzlephp.org/en/stable/request-options.html#sink

https://github.com/dilshod/xlsx2csv 

