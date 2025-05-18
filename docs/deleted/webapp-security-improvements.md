---
title: Web 应用程序安全提升
tags: [web, security, asp.net, mvc, csp, content-security-policy, cache-control]
date: 2020-11-28 09:54:13
---

最近，应工作需要，将某小型应用整改，目的是将此前仅对内可用的小工具公布到互联网上供外部用户使用。这其中就要经历多重审核、整改、测试、上线。

鉴于细节过多，内容过于繁杂，就不一一列举每个整改步骤了。很多内容在系统设计之初就应当考虑在内，此处仅记录我在完成产品开发后，公司内部安全审核团队要求整改的点。

## Session timeout

前期便于快速原型开发及上线，此应用采用的是 Windows 认证。而一般此类应用不会考虑到 Session timeout 时长。但既然审查出了这个 finding （发现），那就要整改了。

其实也很简单，就是找到 `web.config` 文件，在 `<configuration>.<system.web>` 节点添加/更改子节点 `<sessionState>`，将 `timeout` 时长（单位分钟）设置成你想要的值。

``` xml
<configuration>
  <system.web>
    <sessionState timeout="8"/>
  </system.web>
</configuration>
```

## 删除服务器版本

默认 ASP.NET Web 应用程序的 HTTP 请求的响应头，会夹带 `IIS`、`ASP.NET MVC` 及其版本信息。要想成为健壮的网页应用程序，就必须移除这些信息。以下是要做的改动:

### web.config 文件

``` xml
<configuration>
  <system.web>
    <httpRuntime enableVersionHeader="8"/>
  </system.web>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
      </customHeaders>
    </httpProtocol>
    <security>
      <requestFiltering removeServerHeader="true"/>
    </security>
  </system.webServer>
</configuration>
```

### Global.asax.cs 文件

``` cs
namespace NGL.API
{
    public class WebApiApplication : HttpApplication
    {
        protected void Application_Start()
        {
            // remove asp.net mvc version from response header
            MvcHandler.DisableMvcResponseHeader = true;

            // AreaRegistration.RegisterAllAreas();
            // GlobalConfiguration.Configure(WebApiConfig.Register);
            // FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            // RouteConfig.RegisterRoutes(RouteTable.Routes);
            // //BundleConfig.RegisterBundles(BundleTable.Bundles);

            // var serializerSettings = GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings;
            // serializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
            // serializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
        }
    }
}
```

## Content-Security-Policy (CSP) 响应头

通过声明 `CSP` 响应头，可以有效减少现代浏览器在动态加载资源的时候被 `XSS` （跨站攻击）风险。标准做法是在**服务器端**添加，不过也可以在 `html` 文件中添加 `meta` 头声明。具体请移步至 [官网](https://content-security-policy.com/)。

*有点类似于 [SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (Subresource Integrity)，使用 CDN 加载第三方脚本/样式时，通过使用 `integrity` 属性声明，降低脚本/样式被篡改的风险。不同的是，`CSP`适用范围更广。*

在 ASP.NET 服务器端，修改 `web.config`：

``` xml
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <!-- CSP -->
        <add name="Content-Security-Policy" value="default-src 'self'; img-src 'self' https://api.tiles.mapbox.com; style-src 'self' 'unsafe-inline'" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### 2020/12/8 更新

上文所展示代码中，有一段代码 `'unsafe-inline'`，其实这依然是不安全的做法。严格的 CSP 策略会要求连这个都禁用 [<fa-link/>](https://content-security-policy.com/unsafe-inline/)。

可是，[Angular](https://angular.io) 或者 [Angular-CLI](https://cli.angular.io) 目前不支持自动计算 [hash](https://content-security-policy.com/hash/) 或者 [nonce](https://content-security-policy.com/nonce/) 。这就尴尬了。

要说明的是，Angular 其实是会将全局样式（包括 `styles.css` 和第三方类库的样式表文件）都编译到 `style.xxxxhashxxxx.css` 文件中，这种情况下 `style src 'self'` 是满足需求的，因为该样式文件是通过 `<style>` 标签引入的；问题是1️⃣开发者有时候（图省事）直接给标签的 `style` **属性** 设值或者动态改变其值；2️⃣Angular Component 组件样式是运行时动态插入的（具体可查看下图：1️⃣即是内联样式，2️⃣即是动态插入的样式，一般情况下都不是合法的，只有3️⃣样式表文件中的样式才是合法的）。

![CSP中合法与非法的样式](/img/webapp-security/CSP_styles.png)

这就出问题了，因为 CSP 响应头 [style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src) 即使加上了对应的 SHA 或 nounce 值，`style` 属性（非 style 标签）依旧是被禁止的 [<fa-link/>](https://stackoverflow.com/questions/52724956/why-doesnt-chrome-respect-my-content-security-policy-hashes)。解决方案也很简单：添加对应的 SHA 或 nounce 值到 [style-src-attr](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src-attr) 响应头可解决1️⃣内联样式的问题；避免引用 `style` 属性，改用 `class` 将1️⃣内联样式或者2️⃣动态样式改成3️⃣样式表文件。所以，临时解决办法是，把样式都挪到 `sytles.css` 全局样式表中去。emmm，有一点小膈应，毕竟，所有组件的样式都塞到一个样式表文件中，不好管理，挺糟心的。等之后找到了再更新吧。

从上面 `web.config` 的 CSP 配置中，可以看出，默认浏览器是默认(推荐)禁止 `unsafe-inline` 的 script 和 style。即内联的脚本和样式都是被禁止的。

### 2021/2/14 更新

网络安全有一系列响应头，除了 `Content-Security-Policy` 之外，还有 `X-Frame-Options`、`Strict-Transport-Security`、`X-XSS-Protection`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy` 等。想要查看您的网站还存在哪些问题，可以查看 [此网站](https://securityheaders.com/)。有关各响应头的详情，请查看 [MDN](https://developer.mozilla.org/en-US/)。

以下是 `web.config` 样例：

```xml
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <!-- Protects against Clickjacking attacks. ref.: http://stackoverflow.com/a/22105445/1233379 -->
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <!-- Protects against Clickjacking attacks. ref.: https://www.owasp.org/index.php/HTTP_Strict_Transport_Security_Cheat_Sheet -->
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains"/>
        <!-- Protects against XSS injections. ref.: https://www.veracode.com/blog/2014/03/guidelines-for-setting-security-headers/ -->
        <add name="X-XSS-Protection" value="1; mode=block" />
        <!-- Protects against MIME-type confusion attack. ref.: https://www.veracode.com/blog/2014/03/guidelines-for-setting-security-headers/ -->
        <add name="X-Content-Type-Options" value="nosniff" />
        <!-- CSP modern XSS directive-based defence, used since 2014. ref.: http://content-security-policy.com/ -->
        <add name="Content-Security-Policy" value="default-src 'self'; font-src *;img-src * data:; script-src *; style-src *;" />
        <!-- Prevents from leaking referrer data over insecure connections. ref.: https://scotthelme.co.uk/a-new-security-header-referrer-policy/ -->
        <add name="Referrer-Policy" value="strict-origin" />
        <!-- formerly known as Feature-Policy ref.: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy -->
        <!-- Permissions-Policy syntax ref.:https://github.com/w3c/webappsec-permissions-policy/blob/main/permissions-policy-explainer.md#appendix-big-changes-since-this-was-called-feature-policy -->
        <add name="Permissions-Policy" value="notifications=(),magnetometer=(),gyroscope=(),fullscreen=(self)"/>
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

## clientCache 设置 Cache-Control

公司要求禁用 `cache` ？？？

``` xml
<configuration>
    <system.webServer>
        <staticContent>
            <clientCache cacheControlMode="DisableCache"/>
        </staticContent>
    </system.webServer>
</configuration>
```

## 产品环境隐藏错误细节

这个简单，改改 `customErrors` 的模式即可。

``` xml
<configuration>
  <system.web>
    <customErrors mode="On"/>
    <!-- <customErrors mode="RemoteOnly"/> -->
  </system.web>
</configuration>
```

## 连接字符串加密

`web.config` 中连接字符串 (`connection string`) 默认是不加密的。如果启用 Windows 集成认证，那倒问题不大，但是有些情形下，会直接提供 `user id` 和 `password`，一旦泄露，会造成困扰。

对此，建议应用程序本身对连接字符串做简单加密。常见加密解密算法如下（引用 [网上的一张图](/img/webapp-security/algorithms.png)）：

| 序号 | 加密方式   | 是否可解密 | 存在密钥         | 解密后的特征                                                                                        | 备注                                                |
| ---- | ---------- | ---------- | ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1    | BASE64加密 | YES        | 不存在           | 长度是3的倍数，只含有65种字符，大写的A至Z，小写的a至z，数字到9，以及3种符号+/=，=最多两个，且在末尾 | 只要知道加密类型是BASE64，可通过BASE64解密程序解密  |
| 2    | 异或加密   | YES        | 存在             |                                                                                                     | 需要知道异或的值，再次异或该值，可得到加密前的value |
| 3    | MD5加密    | NO         |                  | 32位或者16位                                                                                        |                                                     |
| 4    | SHA128加密 | NO         |                  |                                                                                                     |
| 5    | SHA1加密   | NO         |                  |                                                                                                     |
| 6    | AES加密    |            | 需要密钥解密     |                                                                                                     |
| 7    | RSA加密    |            | 公钥加密私钥解密 |                                                                                                     |

### BASE64

这个算法其实就是简单地把人类能读懂的语言文字变成 ASCII 编码。这样处理之后，人类是很难读懂了，但是机器读懂它简直不能太 easy。所以，一般这个算法不会单独用来加密，但是可以用来混淆内容。

### MD5

emmm，严格来说，这个不算是加密算法，它只是信息摘要算法，就是把一大堆的内容转换成一串 ASCII 编码，同时这个算法有以下两个特点：

1. 相同内容的正文，肯定能输出相同的 ASCII 编码；
2. 只要内容稍加不同，输出的 ASCII 编码完全不一样。

这个算法（目前）是不可解密，所以不存在密钥一说。常用于校验我们从网上下载下来的文件是否被人恶意修改或植入病毒。在当前场景不适用。

### SHA

MD5 的升级版。

### AES 对称加密

加密和解密使用同一套密码，

### RSA 非对称加密

emmm，当今互联网社会的基石啊，多少人都在使用 `RSA` 当作公司 `VPN` 连接的双重身份认证凭证。加密的密钥（公钥）和解密的密钥（私钥）不一样，使用公钥加密的信息可以在互联网上传播，因为没有私钥解密的话此信息就算是天书吧。

结合当前场景（加密连接字符串），我们还用不上 `AES`、`RSA`，同时我们也不能单纯使用 `BASE64` 和 `MD5`/`SHA`，前者过于简单，后者不可逆（加密完我自己都读不懂，要你何用？）。

那，可不可以结合着使用？

以下是我个人在用的示例代码，仅供参考：

``` cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
public class Program
{
    public static void Main()
    {
        string connectionStringName = "Vanilla";
        /// remember to update the connection string value below
        string connectionStringValue = "Data Source=xxx.xxx.xxx.xxx;Initial Catalog=Project_Vanilla;user id=yyyy;password=zzzz";
        string secret = EncryptConnectionString(connectionStringName, connectionStringValue);
        Console.WriteLine(secret);
    }
    private static string EncryptConnectionString(string name, string connectionString)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentNullException(nameof(name));
        if (string.IsNullOrWhiteSpace(connectionString)) 
            throw new ArgumentNullException(nameof(connectionString));
        if (!connectionString.Contains('=')) 
            throw new ArgumentException(nameof(connectionString));

        connectionString = string.Join(string.Empty, connectionString.Reverse());
        int location = connectionString.IndexOf('=') / 2;
        string hash = GetCustomHash(name);
        string content = connectionString.Substring(0, location) +hash +connectionString.Substring(location);
        byte[] bytes = System.Text.Encoding.UTF8.GetBytes(content);
        return System.Convert.ToBase64String(bytes);
    }
    private static string GetCustomHash(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;
        using(MD5 provider = MD5.Create())
        {
            string SALT = "NewGreenLife";
            byte[] bytes = Encoding.UTF8.GetBytes(content+SALT);
            byte[] hashBytes = provider.ComputeHash(bytes);
            return BitConverter.ToString(hashBytes).Replace("-", string.Empty);
        }
    }
    private static string DecryptConnectionString(string name, string secret)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentNullException(nameof(name));
        if (string.IsNullOrEmpty(secret)) 
            throw new ArgumentNullException(nameof(secret));
        byte[] bytes = System.Convert.FromBase64String(secret);
        string base64Content = System.Text.Encoding.UTF8.GetString(bytes);
        string hash = GetCustomHash(name);
        if (!base64Content.Contains(hash))
            throw new ArgumentOutOfRangeException(nameof(secret));
        int location = base64Content.IndexOf(hash);
        string rawContent = base64Content.Substring(0, location) + base64Content.Substring(location + hash.Length);
        return string.Join(string.Empty, rawContent.Reverse());
    }
}
```

## 使用 aspnet_regiis 加密

*2020/12/16 更新*

更推荐的做法（加密 connection string）是，使用 aspnet_regiis 命令行，将本机的 web.config 中对应节点加密。更多技术细节请参考 [官网介绍](https://docs.microsoft.com/en-ca/previous-versions/aspnet/zhhddkxy(v=vs.100))，这里就说其特点和使用方法：

特点：加密后的文件对人不可读，对其他机器也不可解密，.Net Framework 会自动运行时解密。

使用方法(先找到 `aspnet_regiis.exe` 所在文件夹位置，一般在 `C:\Windows\Microsoft.NET\Framework\v4.0.30319` )：

1. 加密: `ASPNET_REGIIS -pef "connectionStrings" "D:\inetpub\wwwroot\applicationFolder"`

2. 解密：`ASPNET_REGIIS -pdf "connectionStrings" "D:\inetpub\wwwroot\applicationFolder"`

## 表单校验

表单校验，不仅仅是前端的事。好的系统，会在 API 层面，甚至数据库层面都会加上用户输入验证。验证要点包括但不限于：

1. 是否输入非法字符
2. 输入字符长度是否合法（最短、最长）
3. 特别地，密码是否符合公司密码复杂度要求
4. 特殊字符是否转译（防止 SQL 注入、XSS、CSRF）

前三项可能会根据业务，稍有不同，但基本大同小异，此处就不过多展开了。

## 防止 SQL 注入

[ScottGu](https://weblogs.asp.net/scottgu/Tip_2F00_Trick_3A00_-Guard-Against-SQL-Injection-Attacks) 早在十多年前就教大家如何防止 SQL 注入了，我搬一下砖：

1. 不要拼接动态 SQL 语句，使用更加类型安全的参数编码机制，如 `ADO.NET` 中的 [SqlParameter](https://docs.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlparameter?view=dotnet-plat-ext-5.0)；
2. 在部署到产品环境之前，始终坚持安全审查，每次更新时都坚持走正式的安全流程审核所有代码；
3. 从不存储明文的敏感数据在数据库；
4. 确保你编写了自动单元测试，显式的验证了你的数据访问层和应用程序能够很好防御 SQL 注入攻击；
5. 锁定你的数据库，仅授权网页应用程序访问它是功能所需的最小权限集。

## 防止 XSS 攻击

`ASP.NET` 中防止 `XSS` 有一套内置的办法：[AntiXssEncoder](https://docs.microsoft.com/en-us/dotnet/api/system.web.security.antixss.antixssencoder?view=netframework-4.8)。

1. 修改 `web.config`，启用 AntiXssEncoder:

   ```xml
   <httpRuntime encoderType="System.Web.Security.AntiXss.AntiXssEncoder" />  
   ```

2. 编码所有用户输入/潜在 `XSS` 攻击的参数：

   ```cs
   user_comment = System.Web.Security.AntiXss.AntiXssEncoder.HtmlEncode(user_comment, true);
   ```

3. 解码上一步编码的数据（以下代码仅展示 `Angular` 中如何解码，实际也可采用纯 `js`/`React`/`Vue` 等其它方式）：

   ```ts

  import { Pipe, PipeTransform } from '@angular/core';

  /** Used to map HTML entities to characters. */
  const htmlUnescapes = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': '\''
  };

  /** Used to match HTML entities and HTML characters. */
  const reEscapedHtml = /&(?:amp|lt|gt|quot|#(0+)?39);/g;
  const reHasEscapedHtml = RegExp(reEscapedHtml.source);

  /** unescape HTML entities */
  @Pipe({ name: 'unescape' })
  export class UnescapePipe implements PipeTransform {
      transform(value: any, args?: any): any {
          // solution 1 (may ignore "<script>")
          // const doc = new DOMParser().parseFromString(value, 'text/html');
          // return doc.documentElement.textContent;
          // solution 2 (not working for HTML entities like &amp;)
          // return value.replace(/&#(\d+);/g, (match, dec) => {
          //     return String.fromCharCode(dec);
          // });
          // solution 3 (enhanced version for solution 2)
          // reference: <https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/unescape.js>
          const escapedHtml = (value && reHasEscapedHtml.test(value))
              ? value.replace(reEscapedHtml, (entity) => (htmlUnescapes[entity] || '\''))
              : (value || '');
          return escapedHtml.replace(/&#(\d+);/g, (match, dec) => {
              return String.fromCharCode(dec);
          });
      }
  }

   ```
## 防止 CSRF 攻击

ASP.NET 中防止 CSRF 攻击很简单，前端页面 (.cshtml) 中添加 `@Html.AntiForgeryToken()`，后台 Controller 代码中，在相应的 Action 加上 \[ValidateAntiForgeryToken\] 即可。

## 参考链接

- [常见的加密解密算法](https://www.cnblogs.com/qianjinyan/p/10418750.html)
- [谷歌CSP工程化实践导读](https://mp.weixin.qq.com/s/YOpb8x-3Lp_WomRu-p1dIw)
- [Locking Down Your Website Scripts with CSP, Hashes, Nonces and Report URI](https://www.troyhunt.com/locking-down-your-website-scripts-with-csp-hashes-nonces-and-report-uri/)
- [Connection string encryption and decryption](https://techcommunity.microsoft.com/t5/iis-support-blog/connection-string-encryption-and-decryption/ba-p/830094)
- [Preventing Cross-site scripting (XSS) attacks in Angular and React](https://alex-klaus.com/protecting-angular-from-xss-attacks-with-csp/)
- [Cross Site Scripting, JavaScript Injection, Contextual Output Encoding](https://privacy.ellak.gr/wp-content/uploads/sites/9/2015/12/XSS_-_5.pdf)
