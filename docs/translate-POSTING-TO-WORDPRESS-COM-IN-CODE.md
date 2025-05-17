---
title: 译：从代码中发帖至 WordPress.com
date: 2020-10-01 21:04:08
tags: [translate, c#, wordpress, blog, 随笔]
---

各位中秋&国庆节日快乐~

[Jon Skeet](https://codeblog.jonskeet.uk) 大神更新博客啦！作为 C# 专家、Stackoverflow 排名第一的神一样的人物，自然是订阅的啦。正好放假，闲来无事，不如把这篇文章翻译一下，正好加深理解。 🙂

声明：如果各位英文够用，请移步[原文](https://codeblog.jonskeet.uk/2020/08/29/1793/)，本文仅仅是随笔，英文捉急的朋友可自由食用。

正文开始：

-----

## 历史

我从 2005 年开始写博客，也就是在我打算参加唯一的 [MVP 大会](https://mvp.microsoft.com/en-us/Summit) (Microsoft Most Valuble Professional Summit) 前不久。彼时，我把博客托管在 msmvps.com，那还是个很大的事情。

2014 年，我迁移到 wordpress.com 了，期望这会让事情变得美好、简单：它是个专注于博客托管的服务，因此我不应担心写作之外的事情。 事情没有这么简单。

我不记得我是什么时候开始使用 Markdown 来书写博客来取代使用 Windows Live Writer 创建 HTML，但是这绝对是我更喜欢的书写方式。我可以把它 *（译者：Markdown）* 的格式用到任何地方，它让发布代码变得更简单…它就是正确的格式（对于我而言）。

我在 wordpresscom 遇到的几乎所有问题都可以分为两类：

- WordPress 的 Markdown 并未按照我期望的方式运行。
- wordpress.com 的编辑器对 Markdown 用户不友好。

第一类，有两个问题。第一，我对于代码以外的换行感到烦恼。我喜欢书写段落的时候包括换行，这样文本可以可以基本上维持 80 - 100 字符每行。不幸的是，WordPress 和 GitHub 都将这种段落格式转换成多个短行，而不是一整个段落。我不知道为什么做这个决定，格式化成这样的，我可以看到 *一些* 场景下这样的处理确实有益处（比如“添加一个单词”的变动仅仅显示这一个变动，而不是所有当前段落的改动）。尽管如此，我还是不喜欢这个决定。

第二个令人烦恼的是代码中的尖括号（使用代码栅栏 &#96;&#96;&#96; 或反引号 &#96;）在 WordPress 中表现不可预期，以一种我不记得在其他哪个地方见过的方式。最常见的不得不更新文章的原因是我需要去修复一些 C# 代码中的泛型，摆弄 Markdown 以转义括号。最近这些天，我可能会试着记录这点，这样的话将来发表文章的时候可以正确使用它。总而言之，这肯定会让人很挫败。

我并不期望能够解决所有的问题，我也许可以通过某些形式的预处理来处理这些文章，但我担心只有非 *（尖括号）* 包围的段落而非代码块才能够变得这么快。没关系，我可以和这些问题共存。

第二种烦恼，在 wordpress.com 上编辑，正式本篇所要讲的大部分内容。

我严重怀疑大部分博主想要一个合理的所见即所得（`WYSIWYG`, What you see is what you get）体验，并且他们肯定不想以未格式化的原始格式（通常是 HTML，但对于我而言是 Markdown）看他们的博客。我记得很久之前，wordpress.com 的编辑器有两种模式：图形的和文本的。在某些情况下，图形编辑器可以转换 Markdown 为 HTML，进而显示在文本编辑器中…它只需要保留纯文本。我的习惯是保留一份文章备份的文本（最开始是在 [StackEdit](https://stackedit.io/) 但现在是在 [GitHub](https://github.com)），然后当我想要编辑东西的时候，复制全部到 WordPress 中。这样我不需要关心 WordPress 如何工作的。

然而，现在 wordpress.com 让这个工作流更加复杂了，他们切换到一个“块”编辑器，以一种简易的界面方式，且你只能通过管理员界面才能得到这个文本编辑器。

我觉得这真的是够了。如果我本地拿到这边文章的时候是以文本形式（然后存在 GitHub 上），完全没有必要去 wordpress.com 界面上去做除了评论之外的任何其他事情。是时候破解他们的 API 了。

## 什么是无 .NET 包？

WordPress 是一个非常通用的博客平台，让我们接受它。我完全不奇怪它有一个 REST API 允许你去发表文章（我之前使用 StackEdit 多年的事实就是一个很好的证明）。我也不奇怪它使用 OAuth2 来认证，判定 OAuth 的异常。

我好奇的是，我不能找到任何 .NET 包来写一个控制台应用程序来调用仅包含极简代码的 API。我甚至不能找到任何简单的适用于控制台应用程序而非 web 应用程序的 OAuth 库。 [RestSharp](https://restsharp.dev/) 看起来像他承诺的那样，就像他的首页所说：“支持 Basic, OAuth 1, OAuth 2, JWT, NTLM”，但是 [这篇认证文档](https://restsharp.dev/usage/authenticators.html) 仅能够做有限的事情。看他们的源码，它除了启动一个本地的 web 服务器以接收 OAuth 代码，然后用于交换完整的认证令牌之外，并未做任何其它的事情（我知道并不多的 OAuth 2，但是足够我在查看一些库源码的时候明白缺少了什么）。[WordPressPCL](https://github.com/wp-net/WordPressPCL) 看起来也像他承诺的那样，但是依赖 JWT 认证插件，我不想仅仅是为了安装一个简单的插件从 wordpress.com 个人账户升级商业账户（我知道它可能还有其他的好处，但……）。

因此，我有如下选项：

- 升级到商业账户，安装 JWT 插件，然后尝试使用 WordPressPCL
- 完全远离 wordpress.com，自行运行 WordPress（或者找另一个类 wordpress.com 站点，我猜）并让 JWT 插件可用，然后再使用 WordPressPCL
- 自行实现 OAuth2

## 自托管 WordPress

我很乐意自己运行 WordPress。我有一个 [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine) 群，用来托管 [nodatetime.org](https://nodatime.org/) 和其他的站点。我到现在才看明白，在 Kubernetes 群中安装 WordPress 会非常简单。有一个 [Bitnami Helm Chart](https://bitnami.com/stacks/helm) 正好合适，因此我决定试一试。

首先我必须安装 Helm，我听说过它，但从未使用过。我第一次尝试使用 shell 脚本，失败了……但用 Chocolatey，安装成功。

安装 WordPress 轻而易举，直到它出错，因为我的 Kubernetes 群没有足够的可用资源。它是个很小的群，当然，它并不用于商业，是我个人掏钱付的，因此我尝试保持花销相对较低。显然它太低了。

我调查了一下我大概需要花费多少来提高我的 Kubernetes 群的能力以自主运行 WordPress，最后我得出结论，这个比我开一个 wordpress.com 商业账户还要贵（甚至在我运维这个站点之前），我决定停止继续往前。

## 实现 OAuth2

最后，我不应该这么害怕自行实现 OAuth2。它并没有那么坏，特别是当我需要一个新的 token 时我喜欢通过一些手动步骤来实现，而不是全自动。

首先我必须在 wordpress.com 上创建一个“应用”。这个仅仅是一个注册，为了拿到用于 OAuth 的 `client_secret`、`client_id` 和批准的重定向 URI。我知道我正在本地运行服务，因此我允许 http://127.0.0.1:8080/auth 作为重定向 URI，并相应的创建此应用。

基本流程如下：

- 启动本地 web 服务器，接收来自 WordPress 服务器的重定向响应
- 在浏览器中访问一个精心构建的 URL
- 在浏览器中授权访问
- WordPress 响应并重定向到本地服务器，包含一个 `code`
- 本地服务器发起另一个 HTTP 请求到 WordPress 服务器，以交换 `code` 获取 `token`
- 本地服务器显示此 `token` 这样我可以复制粘贴到其他地方使用

当然，在一个正常的应用中，用户从不需要看见 `token`，这所有的一切都发生在背后。然而，在我最终的“调用 WordPress API 创建或更新文章的控制台应用程序”中执行此操作，比起复制、粘贴并硬编码 token 更加麻烦。这个代码安全吗，它是否被偷窃过？当然没有。我能接受这个风险吗？当然！

因此，最简单的方式是在一个独立的应用中启动 HTTP 服务器（我不需要它和其他东西集成）？你当然可以创建一个新的空 ASP.NET Core 应用，找到合适的地方处理请求…但我个人更喜欢使用 [.NET Functions 框架](https://github.com/GoogleCloudPlatform/functions-framework-dotnet)。作为框架的作者，我显然存在偏见，但我很高兴看到在实际工作中使用它是如此简单。解决方案非常简单，使用 `dotnet new gcf-http` 命令创建一个单 C# 文件和项目文件。这个 C# 文件包含一个类（`Function`）和一个函数 （`HandleAsync`），总共 50 行代码。

提醒你，它仍需要花费超过一小时以获取可正常创建 WordPress 文章的 token。是因为表单 URL 编码太复杂吗？不，尽管我的调查使我朝这个方向前进。是因为发出请求时需要对 token 进行 base64 编码吗？不是的，尽管 *（我的）* 很多尝试也是在这条路上。

我犯了两个错误：

- 在我的 *交换 code 以换取 token 的服务器* 上，我在交换请求时，我把 `redirect_uri` 填写成 “http://127.0.0.1/auth” 而不是 “http://127.0.0.1:8080/auth”
- 在 *测试 token 的应用* 中，我在 `AuthenticationHeaderValue` 中指定 schema 为 “Basic” 而不是 “Bearer” 

基本上全是拼写错误。难以置信的沮丧，但我确实在这里犯错了。

我有一个有趣的想法，现在我不是有一个 Function 可以做 OAuth 吗，那为什么我不将之部署成一个真的 Google Cloud Function 呢，这样我可以随时通过访问一个 URL 获取 `token` 而不需要本地运行任何程序。我只需要一点点的配置，当然 ASP.NET Core 已经让这一点做起来很容易了，不需要我们来做。

## 发表文章至 WordPress

当前，我有一个可以创建 WordPress 文章（以 Markdown 格式，这点非常重要）的测试应用，它也可以更新文章。

下一步是想办法找到我将来发表博客的工作流。考虑到我把博客的资源存储在 GitHub 上，我也许可以通过一个 GitHub 行为来触发代码，但我不确定这是不是一个行之有效的工作流。现在，我要“当我要创建/更新文章时显式运行一个应用”。

现在更新一个文章必须要知道文章 ID，这个我可以通过 WordPress 界面获取，但我也可以在最初创建文章的时候获取。但我需要一个存储它的地方，我可以为这些文章创建一个单独的元数据文件（metadata），但这个听起来像事情往复杂的方向发展的感觉。

取而代之，我目前的解决方案是在文章正文开始添加一点元数据头，这样应用可以读取它并做相应的处理。它也可以在 wordpress.com 上创建文章之后更新成文章 ID。这样也避免我在命令行中不得不指定比如标题这样的信息。在我写这篇文章的时候，这篇文章的元数据头如下：

```
title: Posting to wordpress.com in code
categories: C#, General
---
```

在我第一次运行我的应用之后，我预计这篇文章将会变成这样：

```
postId: 12345
title: Posting to wordpress.com in code
categories: C#, General
---
```

下次我让它去处理这个文件的时候，因为有 `postId` 值的存在，它将触发我的应用去“更新”而不是去“创建”。

这样就行了吗？几分钟之后见分晓。这段代码并未真正运行过。是的，我可以为它编写一些测试。但我就不，我并不打算编写测试。我觉得它很容易通过一些尝试和错误就能看出问题所在（它并不是特别复杂的代码）。

## 结论

如果你看到这篇文章，我已经用这个新的流程来发表我的博客了。我绝对不会手动创建这篇文章——如果这个代码不行的话，我是绝对不会让你看到的。

这个流程是其他人想要的吗？可能是，也可能不是。我并未打算开源它。但它是一个很好的范例，通过不大的努力来排解烦恼……我可以享受使用自己的 Function 框架并付诸行动，这对于我来说是个奖励。

该发布了！
