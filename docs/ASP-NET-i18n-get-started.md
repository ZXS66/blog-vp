---
title: ASP.NET 应用国际化
date: 2020-10-28 18:11:56
tags: [asp.net, mvc, get started, i18n]
---

一般规模稍大，或者受众同时有国内、国外用户的项目，都要考虑提供中英文两个版本，即国际化（Internationalization），简称 i18n。

之前写过 [Angular i18n](/Angular-internationalization) 相关的文章，今天记录一下 ASP.NET 中如何 i18n。

正片开始！

*(此处省略创建项目过程)*

## 一、添加资源文件

在添加资源文件之前，新建一个文件夹（可选），命名 `Resources` 或者 `Locales` 等等。

先添加一个英文的资源文件，取名 `Resources.resx`。请注意，记得将 `访问修饰符`（`Access Modifier`）修改成 `公开`（`Public`）！

再添加一个中文的资源文件，取名 `Resources.zh.resx`。

添加若干测试字符串:

![Resources.zh.resx](/img/asp-net-i18n/Resources.zh.resx.png)

## 二、在前端页面 (*.cshtml) 中引用资源字符串

在编辑 .cshtml 页面之前，可以找到 `~/Views/web.config`，添加资源的命名空间，这样之后每次引用资源字符串就不必写全路径了。

``` xml
<?xml version="1.0"?>
<configuration>
  <!-- ... -->
  <system.web.webPages.razor>
    <host factoryType="System.Web.Mvc.MvcWebRazorHostFactory, System.Web.Mvc, Version=5.2.7.0, Culture=neutral, PublicKeyToken=31BF3856AD364E35" />
    <pages pageBaseType="System.Web.Mvc.WebViewPage">
      <namespaces>
        <add namespace="System.Web.Mvc" />
        <add namespace="System.Web.Mvc.Ajax" />
        <add namespace="System.Web.Mvc.Html" />
        <add namespace="System.Web.Optimization"/>
        <add namespace="System.Web.Routing" />
        <add namespace="Your.Project" />
        <add namespace="Your.Project.Resources"/>
      </namespaces>
    </pages>
  </system.web.webPages.razor>
  <!-- ... -->
</configuration>
```

打开需要引用资源字符串的文件，使用 `@Resources.xxxx` 获取要动态引用的字符串。

``` cshtml
✔️
@Resources.i18n
@Resources.test

✔️
@ViewBag.l10n
@Resources.test
```

## 三、在后台代码 (*.cs) 中引用资源字符串

后台代码直接引用：

``` cs
public ActionResult Index()
{
    ViewBag.Title = Resources.Resources.home;
    ViewBag.l10n = Resources.Resources.l10n;
    return View();
}
```

## 四、设置当前线程的语言

首先，设置 ASP.NET MVC 的路由（可选）。打开 `RouteConfig.cs` 文件：

``` cs
public class RouteConfig
{
    public static void RegisterRoutes(RouteCollection routes)
    {
        routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
        //routes.MapMvcAttributeRoutes();
        routes.MapRoute(
            name: "Default",
            url: "{culture}/{controller}/{action}/{id}",
            defaults: new { culture = "en", controller = "Home", action = "Index", id = UrlParameter.Optional }
        );
    }
}
```

然后，添加 MVC 的父 Controller：

``` cs
public class CISBaseController : Controller
{
    protected bool isChineseCulture
    {
        get; private set;
    }
    private static readonly IEnumerable<string> ChineseCultures = new List<string>() { "zh", "zh-han", "zh-hans" };
    
    public ActionResult RedirectToDefaultLocalized()
    {
        return RedirectPermanent("/en");
    }

    protected override void OnActionExecuting(ActionExecutingContext filterContext)
    {
        // Grab the culture route parameter
        string culture = filterContext.RouteData.Values["culture"]?.ToString();
        // Set the action parameter just in case we didn't get one
        // from the route.
        filterContext.ActionParameters["culture"] = culture;
        // update this.isChineseCulture
        this.isChineseCulture = ChineseCultures.Contains(culture.ToLower());
        var cultureInfo = CultureInfo.GetCultureInfo(culture);
        Thread.CurrentThread.CurrentCulture = cultureInfo;
        Thread.CurrentThread.CurrentUICulture = cultureInfo;
        // Because we've overwritten the ActionParameters, we
        // make sure we provide the override to the 
        // base implementation.
        base.OnActionExecuting(filterContext);
    }
}
```

## 五、测试

Visual Studio 直接开启调试：

（默认英文路由）：

![index.en](/img/asp-net-i18n/index.en.png)

切换到中文路由：

![index.zh](/img/asp-net-i18n/index.zh.png)

✔️ 完美！

## 参考链接

- [Getting Started With ASP.NET MVC i18n](https://phrase.com/blog/posts/getting-started-with-asp-net-mvc-i18n/)
- [CultureInfo Class](https://docs.microsoft.com/en-us/dotnet/api/system.globalization.cultureinfo?view=netframework-4.7)
