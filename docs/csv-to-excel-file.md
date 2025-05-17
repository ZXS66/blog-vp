---
title: CSV转Excel
tags:
  - csv
  - encoding
  - utf-8
  - unicode
  - gb2312
  - excel
  - asp.net core
date: 2022-07-14 13:15:25
---

本篇是接 [上一篇文章](/2022/05/13/dotnet-core-build-standalone-executable-program/)，具体到 CSV 转 Excel 这一个场景下的实际应用。

# 背景

一般从数据库(比如 MySQL 或者 SQL Server)或者一些数据平台（比如 Symantec 日志）导出的 CSV 文件，基本都是采用 `UTF-8` 编码保存的文件。使用 `UTF-8` 保存的 CSV 文件作为通用的传输数据媒介，一般来说，是没有问题的。然而，有一些朋友，使用 CSV 文件并不一定是用来传输数据的，而是用来查看的。这些情况下，他们会尝试使用 Microsoft Excel 打开。哦额，问题来了，Excel 一般不会优先使用 `UTF-8` 编码打开 CSV 文件，结果就是乱码。

一般的通用解决办法是：

**使用 Excel 的“数据”菜单，选择“自文本”，然后通过一些列的鼠标点点点操作，把 CSV 文件加载到 Excel 中（具体细节请参考各大搜索引擎或博客）。**

~~本篇完！~~😄

既然身为程序员，最不能容忍的事情就是重复自己！最喜欢做的事情就是重复造轮子。😏

# 技术简介

直入主题，如何使用代码，才能把 CSV 转换成 Excel 格式？

1. 选择编程语言
2. 读取 CSV 文件文本内容
3. 按 CSV（Comma Separated Values）文件规范，转换成二维表格数据
4. 按 Excel 文件规范，把二维表格数据转换成 Excel 文件
5. 保存 Excel 文件

### 选择编程语言

这个就无所谓了，既然是造轮子，哪个语言顺手就用哪个。

### 读取 CSV 文件内容
### 按 CSV（Comma Separated Values）文件规范，转换成二维表格数据

上面两个内容我放一起，主要是~~我懒~~考虑到读取 CSV 文件实在是太常见了，网上已经有很多成熟的解决方案。我这里引用的是 [ClosedXML]()。

### 按 Excel 文件规范，把二维表格数据转换成 Excel 文件
### 保存 Excel 文件

同上，保存数据到 Excel 也太稀疏平常了。我这里引用的是 [ClosedXML]()。

综上，我们需要做的，就非常少了，仅剩一些业务代码。

[点击此处](https://github.com/ZXS66/csv2excel) 查看源代码。
