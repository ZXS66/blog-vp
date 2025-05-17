---
title: dotnet core 编译绿色版程序
tags:
  - dotnet core
  - standalone
  - console program
date: 2022-05-13 11:24:33
---

一般情况下，运维人员一般都会点 `Python`，遇到问题，都会写一些脚手架、小脚本什么的。如果写得好，领导看重，进而分享给更多同事/上传至服务器，这就需要运维人员把其编写的程序编译（打包）成 `exe` 程序（一般公司同事都在用 `Windows` 系统），然后同事直接双击 `exe` 程序即可获取相同结果（虽然编译/运行过程中会遇到各种各样的问题…）。

但是，其实 `Windows` 系统理应是 `.NET` 程序员的主场。以前，传统 `.NET` 程序员会编写完控制台应用程序，然后使用 `Visual Studio` 编译好，直接把 `./bin/Debug` 或者 `./bin/Release` 文件夹下的文件打包复制到目标机器上，然后就可以跟在本地运行一样。当然，高级一点的，可以使用 `Visual Studio` 的发布功能，这样，在目标服务器上先安装，再使用。

不过，这种方式有个缺点：**需要目标机器和本地机器一样，有安装运行环境（.net framework）**。

但是，某些情况下，目标机器不允许安装运行环境（需要提升权限），或者，目标机器用户不知道需要安装运行环境，怎么办？

~~一般这时候，通常轮到介绍 `Docker` 了 😏~~

所以，`.NET` 程序员，如何解决“一次编写，到处运行”这个难题？

直接揭晓“我的魔法”吧：**使用 `.NET Core` 编写**！

实际代码编写就略过了，这里只讲如何编译：

1. 右键项目，“发布”；
2. 选择“文件夹发布”；
3. 更换部署模式为“Self-contained”，根据目标机器类型 [<fa-link/>](https://docs.microsoft.com/en-us/dotnet/core/deploying/deploy-with-vs?tabs=vs156)：
![publish profile](/img/dotnet-core-build-standalone-executable-program/publish_profile.png)

当然，上述操作可以使用 `.NET Core CLI` 达到相同目的 [<fa-link/>](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-publish)

### 参考链接

- [.NET application publishing overview](https://docs.microsoft.com/en-us/dotnet/core/deploying/)
