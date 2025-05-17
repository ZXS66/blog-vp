---
title: 离线安装使用 Visual Studio 和 NuGet
tags:
  - visual studio
  - nuget
  - offline
date: 2021-01-15 11:04:45
---

不知不觉，国外好多软件的安装都采用了在线的方式，比如，Google Chrome、Firefox 等，当然也包括今天我要安装的 Visual Studio。当我们在他们官网上下载的时候，咻的一下就完成了，但其实我们高兴的太早了，它仅仅是下载了一个 web installer，当我们运行这个 web installer 的时候，它其实还是需要联网下载完整包的。

在线安装，有利有弊吧。简单说两点：① 安装大型软件如 Visual Studio 时，可以按需下载了。② 在某些地方（如限制访问互联网的公司局域网），在某些时候（服务器宕机），某些网站（如 Google）可能无法访问，或者访问如龟速，这时候还不如事先下载好然后分发到需要安装的机器上。

目前，我就遇到了需要离线安装 Visual Studio，并且离线安装 NuGet Package 的场景。

### 离线安装 Visual Studio

微软很“贴心”的给出了离线安装的指引[<fa-link/>](https://docs.microsoft.com/en-us/visualstudio/install/create-an-offline-installation-of-visual-studio?view=vs-2019)：

简单来说，有两种方式，图形化（GUI）或者命令行（Command Line)：

##### 图形化下载安装方式

这种方式适用于可联网的主机，在下载完成后，再断开连接完成安装。不过多展开了。

##### 命令行下载安装

这种方式虽然复杂一点，但是灵活，适用于在可联网的主机A下载，然后打包至主机B上安装。

步骤：

1. 下载 web installer。有如下不同版本供您选择：
   
    |版本|下载链接|
    |-----|-----|
    |Visual Studio Community（免费，下面步骤以此为例）|[vs_community.exe](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=community&rel=16&utm_medium=microsoft&utm_source=docs.microsoft.com&utm_campaign=offline+install&utm_content=download+vs2019)|    
    |Visual Studio Professional|[vs_professional.exe](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=professional&rel=16&utm_medium=microsoft&utm_source=docs.microsoft.com&utm_campaign=offline+install&utm_content=download+vs2019)|
    |Visual Studio Enterprise|[vs_enterprise.exe](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=enterprise&rel=16&utm_medium=microsoft&utm_source=docs.microsoft.com&utm_campaign=offline+install&utm_content=download+vs2019)|
    |Visual Studio Build Tools|[vs_buildtools.exe](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=buildtools&rel=16&utm_medium=microsoft&utm_source=docs.microsoft.com&utm_campaign=offline+install&utm_content=download+vs2019)|

2. 下载本地安装缓存。这一步各位可以按自己的技术栈选择需要下载的模块:
   
    |模块|命令行|
    |-----|-----|
    |.NET web and .NET desktop development|vs_community.exe --layout c:\vslayout --add Microsoft.VisualStudio.Workload.ManagedDesktop --add Microsoft.VisualStudio.Workload.NetWeb --add Component.GitHub.VisualStudio --includeOptional --lang en-US|    
    |.NET desktop and Office development|vs_community.exe --layout c:\vslayout --add Microsoft.VisualStudio.Workload.ManagedDesktop --add Microsoft.VisualStudio.Workload.Office --includeOptional --lang en-US|
    |C++ desktop development|vs_community.exe --layout c:\vslayout --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended --lang en-US|
    |完整安装包|vs_community.exe --layout c:\vslayout --lang en-US|

    其中，`c:\vslayout`为目标缓存文件夹，`--lang en-US` 为指定[安装语言](https://docs.microsoft.com/en-us/visualstudio/install/create-an-offline-installation-of-visual-studio?view=vs-2019#list-of-language-locales)，都可以更改。

3. 拷贝至需要安装的主机（可选）
   
4. 本地安装。也是安装需要的模块来安装。以 .NET web and .NET desktop development 为例，运行以下命令来安装：
   
    ``` bat
    c:\vslayout\vs_community.exe --noweb --add Microsoft.VisualStudio.Workload.ManagedDesktop --add Microsoft.VisualStudio.Workload.NetWeb --add Component.GitHub.VisualStudio --includeOptional
    ```

   接下来有安装界面了，鼠标点点就搞得定。
   
### 离线安装 NuGet Package

在某些情形下，我们需要离线使用 Visual Studio，这个时候，我们就需要实现下载好 NuGet 包，然后上传到指定文件夹中。

##### 下载 NuGet 包

可以选择上 [NuGet 官网](https://www.nuget.org/) 搜索对应的包名然后点击 “Download package” 下载，或者使用 [NuGet Package Explorer](https://github.com/NuGetPackageExplorer/NuGetPackageExplorer)。

##### 指定 NuGet Package Manager 本地安装库 [<fa-link/>](https://social.technet.microsoft.com/wiki/contents/articles/25127.nuget-offline-package.aspx)

打开菜单：Tools --> NuGet Package Manager --> Package Manager Settings，点击 Package Source Tab，点击 + 图标，选择离线安装包所在目录，点击 OK。

##### 参考链接

- [Creating a local NuGet repository for offline development](https://www.codurance.com/publications/2015/05/04/creating-a-local-nuget-repository)
