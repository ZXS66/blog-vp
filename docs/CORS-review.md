---
title: CORS 复习
tags:
  - cors
date: 2021-04-11 14:32:54
---

好久没有更新了，主要是~~工作忙~~懒。正好前两天给同事开发 API 的时候，遇见一个小问题，这里简单记录一下。

故事是这样的，我明明给他开启了 CORS （已设置响应头，正确处理 preflight options request），但是对方从本地开发环境访问仍说 CORS 错误。因为这个 API 启用了 Windows 认证，我让他设置 [withCredentials:true](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)，也没有用，一直报错 401 或 405：

![401 Unauthorized](/img/CORS-review/401_unauthorized.jpg)
![405 Method Not Allowed](/img/CORS-review/405_method_not_allowed.jpg)

明明是复制粘贴之前能正常工作的代码，怎么就不行了？

好吧，按照 [官方推荐做法](https://docs.microsoft.com/en-us/aspnet/web-api/overview/security/enabling-cross-origin-requests-in-web-api) 再来一遍：

1. 安装 NuGet 包： `Install-Package Microsoft.AspNet.WebApi.Cors`
2. 启用 CORS，在 *App_Start/WebApiConfig.cs* 文件新增如下代码：
   ```cs
  var cors = new System.Web.Http.Cors.EnableCorsAttribute
    (
        Constants.LocalDevEnv,
        "*",
        "*"
    );
  cors.SupportsCredentials = true;
  config.EnableCors(cors);
   ```
3. 接收 preflight request，在*web.config*文件&lt;system.webServer&gt;&lt;handlers&gt;节点添加以下内容(一般安装 NuGet 包时自动添加)：
   ```xml
  <system.webServer>
    <handlers>
      <remove name="ExtensionlessUrlHandler-Integrated-4.0" />
      <remove name="OPTIONSVerbHandler" />
      <add name="ExtensionlessUrlHandler-Integrated-4.0" path="*." verb="*" type="System.Web.Handlers.TransferRequestHandler" preCondition="integratedMode,runtimeVersionv4.0" />
    </handlers>
  </system.webServer>
   ```
4. 设置响应头，在 *web.config*文件&lt;system.webServer&gt;&lt;httpProtocol&gt;&lt;customHeaders&gt;节点添加以下内容：
   ```xml
  <add name="Access-Control-Allow-Origin" value="http://localhost:3000" />  <!-- set the origin specifically-->
  <add name="Access-Control-Allow-Headers" value="*" />
  <add name="Access-Control-Allow-Methods" value="*" />
  <add name="Access-Control-Allow-Credentials" value="true" />
   ```

值得注意的是，因为我们启用了 Windows 认证，也就是说，跨域的时候需要设置正确的响应头，否则浏览器依然会报错：

> If the browser sends credentials, but the response does not include a valid Access-Control-Allow-Credentials header, the browser will not expose the response to the application, and the AJAX request fails. Be careful about setting SupportsCredentials to true, because it means a website at another domain can send a logged-in user's credentials to your Web API on the user's behalf, without the user being aware. The CORS spec also states that setting origins to "*" is invalid if SupportsCredentials is true.

简单来说，当 API 需要发送 credentials 给 API 服务器时，`Access-Control-Allow-Origin` 不能为 `*`，必须得指明 Origin。

再次测试：

![测试结果](/img/CORS-review/test.png)

Bingo！

## 参考链接

- [Enable cross-origin requests in ASP.NET Web API 2](https://docs.microsoft.com/en-us/aspnet/web-api/overview/security/enabling-cross-origin-requests-in-web-api)
- [CORS](https://developer.mozilla.org/en-US/docs/Glossary/CORS)
- [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)
