## Oauth2

数据表

```sql
-- client 表
CREATE TABLE IF NOT EXISTS %s (
		id VARCHAR(255) NOT NULL PRIMARY KEY,
		secret VARCHAR(255) NOT NULL,
		domain VARCHAR(255) NOT NULL,
		data TEXT NOT NULL	
);
	  
-- token 表
CREATE TABLE IF NOT EXISTS %s (
		id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		code VARCHAR(255),
		access VARCHAR(255) NOT NULL,
		refresh VARCHAR(255) NOT NULL,
		data TEXT NOT NULL, --token结构体里的数据存在这里
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		KEY access_k(access),
		KEY refresh_k (refresh),
		KEY expired_at_k (expired_at),
		KEY code_k (code)
);
```



配置

```golang
config = oauth2.Config{
	ClientID:     "222222",
	ClientSecret: "22222222",
	Scopes:       []string{"all"},
	RedirectURL:  "http://localhost:9094/oauth2",
	Endpoint: oauth2.Endpoint{
		AuthURL:  authServerURL + "/authorize",
		TokenURL: authServerURL + "/token",
	},
}
```

token 结构体

```go
type Token struct {
	ClientID         string        `bson:"ClientID"`
	UserID           string        `bson:"UserID"`
	RedirectURI      string        `bson:"RedirectURI"`
	Scope            string        `bson:"Scope"`
	Code             string        `bson:"Code"`
	CodeCreateAt     time.Time     `bson:"CodeCreateAt"`
	CodeExpiresIn    time.Duration `bson:"CodeExpiresIn"`
	Access           string        `bson:"Access"`
	AccessCreateAt   time.Time     `bson:"AccessCreateAt"`
	AccessExpiresIn  time.Duration `bson:"AccessExpiresIn"`
	Refresh          string        `bson:"Refresh"`
	RefreshCreateAt  time.Time     `bson:"RefreshCreateAt"`
	RefreshExpiresIn time.Duration `bson:"RefreshExpiresIn"`
}
```

TokenInfo 接口
```go
// TokenInfo the token information model interface
TokenInfo interface {
	New() TokenInfo

	GetClientID() string
	SetClientID(string)
	GetUserID() string
	SetUserID(string)
	GetRedirectURI() string
	SetRedirectURI(string)
	GetScope() string
	SetScope(string)

	GetCode() string
	SetCode(string)
	GetCodeCreateAt() time.Time
	SetCodeCreateAt(time.Time)
	GetCodeExpiresIn() time.Duration
	SetCodeExpiresIn(time.Duration)

	GetAccess() string
	SetAccess(string)
	GetAccessCreateAt() time.Time
	SetAccessCreateAt(time.Time)
	GetAccessExpiresIn() time.Duration
	SetAccessExpiresIn(time.Duration)

	GetRefresh() string
	SetRefresh(string)
	GetRefreshCreateAt() time.Time
	SetRefreshCreateAt(time.Time)
	GetRefreshExpiresIn() time.Duration
	SetRefreshExpiresIn(time.Duration)
}
```



AuthCodeURL

```go
# 通过此方法创建用户授权url并拼装参数
# 主要有 response_type、client_id、redirect_uri、scope、state 参数
buf.WriteString(c.Endpoint.AuthURL)
v := url.Values{
	"response_type": {"code"},
	"client_id":     {c.ClientID},
}
if c.RedirectURL != "" {
	v.Set("redirect_uri", c.RedirectURL)
}
if len(c.Scopes) > 0 {
	v.Set("scope", strings.Join(c.Scopes, " "))
}
if state != "" {
	// TODO(light): Docs say never to omit state; don't allow empty.
	v.Set("state", state)
}

if strings.Contains(c.Endpoint.AuthURL, "?") {
	buf.WriteByte('&')
} else {
	buf.WriteByte('?')
}
buf.WriteString(v.Encode())
```

角色

```
用户中心->资源所有者
oauth 服务器->授权服务器
第三方应用->客户端
```







```
https://api.weibo.com/oauth2/authorize?response_type=code&client_id=1682292631&redirect_uri=http://my.leju.com/Web/Callback/callbackAdd?key=YjA2Yzk0MDhiWGt1YkdWcWRTNWpiMjA9YjA0YQ==&originUrl=%2F%2Fmy.leju.com%2Fsettings%2Fbindmobile%2FthirdBindView&state=ZDZmYmI4ZGRNam94TmpFM056azJORFU1ODE1NA==&scope=all###


https://open.weixin.qq.com/connect/qrconnect?appid=wx9d8d3686b76baff8&redirect_uri=https://passport.lagou.com/oauth20/callback_weixinProvider.html&response_type=code&scope=snsapi_login#wechat_redirect


https://open.weixin.qq.com/connect/qrconnect?appid=wx1b4c7610fc671845&redirect_uri=https://account.geekbang.org/account/oauth/callback?type=wechat&ident=704f12&login=0&cip=0&redirect=https%3A%2F%2Faccount.geekbang.org%2Fthirdlogin%3Fremember%3D1%26type%3Dwechat%26is_bind%3D0%26platform%3Dtime%26redirect%3Dhttps%253A%252F%252Ftime.geekbang.org%252Fcolumn%252F126%26failedurl%3Dhttps%3A%2F%2Faccount.geekbang.org%2Fsignin%3Fredirect%3Dhttps%253A%252F%252Ftime.geekbang.org%252Fcolumn%252F126&response_type=code&scope=snsapi_login&state=aeffd8302fd1c8f146f91aeeb063170b#wechat_redirect
```





参考：

https://www.cnblogs.com/cjsblog/p/9174797.html

https://github.com/go-oauth2/oauth2.git