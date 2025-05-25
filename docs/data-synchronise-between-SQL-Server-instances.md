---
title: SQL Server 实例间的数据同步
tags:
  - sql server
  - bulk insert
date: 2022-10-07 18:06:06
---

# 背景
组内有两套 SQL Server 环境，简单理解：一套生产环境，一套测试环境。测试环境还好，和本地开发环境类似，是互通的，也即是说可以直接通过 SSMS/Visual Studio/其他 app 或者程序连接上去。问题就出现在生产环境上。一般来说，生产环境有专人负责运维的，一般开发是不会接触的到。但是有的时候，开发真的需要生产环境的一些数据（比如日志），或者开发有几个 hotfix 数据包需要发布到生产环境，同时情况又很紧急，不想走审批流程，有没有简单又快速的办法？

不同的程序员估计会有不同的解决方案。我的解决方案，超级简单粗暴，但是亲测有效，就是把一个环境（源）下的数据先导出成 excel/csv 文件，然后人肉复制粘贴到另一个环境（目标）下，然后再导入数据库。

我用 dotnet 写成了一个小程序，可以直接运行。欢迎大家参考并提出宝贵意见。<ZLink link="https://github.com/ZXS66/SQLServerSync"/>

# 参考链接

- [ZXS66/SQLServerSync](https://github.com/ZXS66/SQLServerSync)
