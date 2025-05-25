---
title: ASP.NET WebAPI 编译包瘦身
date: 2020-08-31 23:07:55
tags: [asp.net, webapi, build, package, shrink]
---

伏尔泰曾说：

> 生命，在于~~运动~~折腾！

不知何时起，经过数次迭代，项目的依赖项（第三方包）逐渐变多，导致现在编译的时间变长了，发布包也慢慢的变大了。有些依赖项可能只是引用了其中的某一个小功能，有些则是完全废弃的包，但是项目编译的时候都会编译。确实是因为项目小，人手少，所有的改动（还包括不成熟的 research 模块）都在一个代码库上，导致现在编译包过大。理想做法是，有一个主分支，至少一个开发分支。考虑到，可预见的未来内，项目组成员是不会变了（对，就我一个），所以，还是一个开发分支省事（其实就是因为懒）。但也不能屈服于现状，得做点事，改善一下，证明我还是个好程序猿。

说干就干。但是动手前，得足够了解自身项目，了解所有的项目依赖项。

其次，了解哪些源文件/依赖项还在用，这样我们就可以删除掉那些不再使用的源文件/依赖项。前端有 [Tree Shaking](https://webpack.js.org/guides/tree-shaking/) 的概念，相应地可以推广到 ASP.NET 中。虽说强类型语言编译时已做到了排除未使用(unused)/无法触达(unreachable)代码，但是奈何有些开发人员代码编写不规范，编译器也无法识别出 TA 写的代码到底该不该排除，导致编译时默认还是会包含很多不需要的内容。所以，Tree Shaking 也应该推广到开发人员的思维。🙂

以下是动手之前，我的项目依赖项清单 (NuGet 的 `packages.config` 文件)：

``` xml
<?xml version="1.0" encoding="utf-8"?>
<packages>
  <package id="Antlr" version="3.5.0.2" targetFramework="net461" />
  <package id="BouncyCastle" version="1.8.3.1" targetFramework="net461" />
  <package id="EntityFramework" version="6.2.0" targetFramework="net461" />
  <package id="Google.Protobuf" version="3.6.1" targetFramework="net461" />
  <package id="Microsoft.AspNet.Mvc" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.Razor" version="3.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.TelemetryCorrelation" version="1.0.0" targetFramework="net461" />
  <package id="Microsoft.AspNet.Web.Optimization" version="1.1.3" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.Client" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.Core" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.HelpPage" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.WebHost" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebPages" version="3.2.4" targetFramework="net461" />
  <package id="Microsoft.CodeDom.Providers.DotNetCompilerPlatform" version="2.0.0" targetFramework="net461" />
  <package id="Microsoft.Web.Infrastructure" version="1.0.0.0" targetFramework="net461" />
  <package id="MySql.Data" version="8.0.16" targetFramework="net461" />
  <package id="MySql.Data.Entities" version="6.8.3.0" targetFramework="net461" />
  <package id="MySql.Data.Entity" version="6.10.8" targetFramework="net461" />
  <package id="Newtonsoft.Json" version="12.0.2" targetFramework="net461" />
  <package id="popper.js" version="1.14.0" targetFramework="net461" />
  <package id="System.Diagnostics.DiagnosticSource" version="4.4.1" targetFramework="net461" />
  <package id="WebGrease" version="1.5.2" targetFramework="net461" />
</packages>
```

可以看到，虽然之前已经移除了很多默认的、没必要的依赖项，比如 `bootstrap`、`jQuery` 等，但是还是有 23 个包！考虑到该项目是个 Web API 程序，所以，还是有很多依赖项可以删除。

::: danger ⚠⚠⚠ 警告 ⚠⚠⚠
**一定要在足够了解自身项目，并且明白每个依赖项的用处的前提下，思考再三才能动手**。前者可以在平日的项目经验积累获得，后者只能通过看官方文档、社区问答、博客去了解。
:::

官方文档是指 [NuGet](https://www.nuget.org/) 的官方链接或者其 [Github](https://github.com/) 主页介绍。社区问答参考 [Stackoverflow](https://stackoverflow.com) 等。博客的话就比较广了，可以参考各搜索引擎的结果。

以下是我的参考链接节选：

- [What's This and Can I Delete It? Examining A Default ASP.NET MVC Project](https://exceptionnotfound.net/whats-this-and-can-i-delete-it-examining-a-default-asp-net-mvc-project/)
- [Removing roslyn from ASP.NET 4.5.2 project template](https://galdin.dev/blog/removing-roslyn-from-asp-net-4-5-2-project-template/)
- [NuGet Gallery | MySql.Data](https://www.nuget.org/packages/MySql.Data/)

以下是此次移除的依赖项清单：

- Antlr <ZLink link="https://www.nuget.org/packages/Antlr/"/>

  此依赖项被 `WebGrease` 所引用（参考 NuGet 主页 Used By 章节，一般 top 5 NuGet packages 都会有你想要的东西），后者是优化 `JavaScript`、`CSS` 及图片的工具包。考虑到该项目性质是 Web API，不是 Web Application，删除。

- BouncyCastle <ZLink link="https://www.nuget.org/packages/BouncyCastle/"/>

  此依赖项被 `MySql.Data` 所引用，后者是项目前期 Research 阶段使用 MySQL 引入的。现阶段项目采用 SQL Server 作为结构化数据存储数据库，删除。

- EntityFramework <ZLink link="https://www.nuget.org/packages/EntityFramework/"/>

  EntityFramework 是项目前期快速搭建 prototype 引入的。现阶段项目采用 ADO.NET 及 Stored Procedure 作为底层数据访问方式，删除。

- Google.Protobuf <ZLink link="https://www.nuget.org/packages/Google.Protobuf/"/>

  此依赖项被 `MySql.Data` 所引用，后者是项目前期 Research 阶段使用 MySQL 引入的。现阶段项目采用 SQL Server 作为结构化存储数据库，删除。

- Microsoft.AspNet.TelemetryCorrelation <ZLink link="https://www.nuget.org/packages/Microsoft.AspNet.TelemetryCorrelation"/>

  此依赖项被 `Microsoft.ApplicationInsights.Web`，后者在上一次瘦身中已经移除，故移除。

- Microsoft.AspNet.Web.Optimization <ZLink link="https://www.nuget.org/packages/Microsoft.AspNet.Web.Optimization/"/>

  此依赖项是优化 `JavaScript` 和 `CSS` 文件打包的，考虑到该项目性质是 Web API，不是 Web Application，删除。

  Tips: 既然不是个 Web Application，那就应在项目中排除 `Views` 文件夹。

- Microsoft.CodeDom.Providers.DotNetCompilerPlatform <ZLink link="https://www.nuget.org/packages/Microsoft.CodeDom.Providers.DotNetCompilerPlatform"/>

  这个是 .Net 编译平台 [Roslyn](https://github.com/aspnet/RoslynCodeDomProvider/) 的包，移除此依赖项得当心，因为很可能导致项目编译不通过。但是移除此依赖项会带来显著的效果。移除前，每次编译，都会在项目的 `bin\roslyn` 文件夹下生成一堆你并不想要的东西，还特别大。移除后，这些烦恼随着文件夹一并烟消云散了。根据官方文档，`Roslyn` 是能够让我们在老的运行环境 （.Net Framework）里可以使用新的语法，比如 [C# 6.0](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-6) 里 `?.`、`??` 空值条件运算符，新的使用美元符进行字符串拼接，`nameof` 运算符等等。

  因为项目的目标运行环境(.Net Framework)版本是 4.6.1，[该版本天然支持 C# 6.0 语法](https://devblogs.microsoft.com/dotnet/announcing-net-framework-4-6/) (或参考此[问答](https://stackoverflow.com/questions/28921701/does-c-sharp-6-0-work-for-net-4-0))，只要我不去学习 C# 7.0，那就可以任意玩耍了，哈哈，机智如我。*（此处未经验证，如有错误，欢迎指正）*

- MySql.Data <ZLink link="https://www.nuget.org/packages/MySql.Data/"/>
- MySql.Data.Entities <ZLink link="https://www.nuget.org/packages/MySql.Data.Entities/"/>
- MySql.Data.Entity <ZLink link="https://www.nuget.org/packages/MySql.Data.Entity/"/>
- popper.js <ZLink link="https://www.nuget.org/packages/popper.js/"/>

  以上四个依赖项，皆因项目前期 Research 阶段使用 MySQL 引入的。现阶段项目采用 SQL Server 作为结构化存储数据库，删除。

- System.Diagnostics.DiagnosticSource <ZLink link="https://www.nuget.org/packages/System.Diagnostics.DiagnosticSource"/>

  官网看不出来做什么用的，但是自信项目没用到这个依赖项，删！(迷之自信)

- WebGrease <ZLink link="https://www.nuget.org/packages/WebGrease/"/>

  `WebGrease` 是优化 `JavaScript`、`CSS` 及图片的工具包。考虑到该项目性质是 Web API，不是 Web Application，删除。

所有依赖项删除完了之后，现在的 `packages.config` 长这样：

``` xml
<?xml version="1.0" encoding="utf-8"?>
<packages>
  <package id="Microsoft.AspNet.Mvc" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.Razor" version="3.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.Client" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.Core" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.HelpPage" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebApi.WebHost" version="5.2.4" targetFramework="net461" />
  <package id="Microsoft.AspNet.WebPages" version="3.2.4" targetFramework="net461" />
  <package id="Microsoft.Web.Infrastructure" version="1.0.0.0" targetFramework="net461" />
  <package id="Newtonsoft.Json" version="12.0.2" targetFramework="net461" />
</packages>
```

舒服多了 ~

还差最后一步，编译：✔️ 通过；发布：✔️ 通过；部署到测试环境：✔️ 运行没问题。

![自信](/img/shrink-ASP-NET-WebAPI-build-package-file-size/confidence.gif)

对比一下瘦身前与瘦身后的文件大小，可以开心一整天了。😄

![编译文件前后对比](/img/shrink-ASP-NET-WebAPI-build-package-file-size/comparison.png)
