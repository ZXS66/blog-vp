---
title: node 包的版本号
date: 2020-08-20 16:11:52
tags: [node, package.json]
---

## 背景

复习时间到啦 <font-awesome-icon icon="bell" />

突然脑子不灵光了，不记得 `package.json` 文件下面的包，带 `^` 和 `~` 有什么区别了，看来是上年纪了。

## TLDR，太长不看版

一句话加深印象：

> `~`(波峰小)表示接受补丁升级(变动小)，`^`(波峰大)表示接受次要版本及补丁升级(变动大)。 

## 正片

直接上[官方解释](https://nodejs.dev/learn/the-package-json-guide)：

---------------------------

### Package versions

You have seen in the description above version numbers like these: `~3.0.0` or `^0.13.0`. What do they mean, and which other version specifiers can you use?

That symbol specifies which updates your package accepts, from that dependency.

Given that using semver (semantic versioning) all versions have 3 digits, the first being the major release, the second the minor release and the third is the patch release, you have these rules:

- `~`: if you write ~0.13.0, you want to only update patch releases: 0.13.1 is ok, but 0.14.0 is not.
- `^`: if you write ^0.13.0, you want to update patch and minor releases: 0.13.1, 0.14.0 and so on.
- `*`: if you write *, that means you accept all updates, including major version upgrades.
- `>`: you accept any version higher than the one you specify
- `>=`: you accept any version equal to or higher than the one you specify
- `<=`: you accept any version equal or lower to the one you specify
- `<`: you accept any version lower to the one you specify

There are other rules, too:

- no symbol: you accept only that specific version you specify
- `latest`: you want to use the latest version available

and you can combine most of the above in ranges, like this: `1.0.0 || >=1.1.0 <1.2.0`, to either use 1.0.0 or one release from 1.1.0 up, but lower than 1.2.0.

---------------------------

简单翻译一下：

---------------------------

### Package versions

你可以在上面描述中看到类似于 `~3.0.0` 或 `^0.13.0` 这样的版本编号。它们是什么意思，我们又如何抉择？

这个符号指明了哪些更新为当前依赖包所接受的。

考虑到所有版本号都遵循 `semver` (semantic versioning，语义版本控制) 规则：第一个数字是主版本号，第二个数字是此版本号，第三个数字是补丁编号，我们有如下规则：

- `~`: 如果我们写 ~0.13.0，我们仅更新补丁版本： 0.13.1 可以更新，但 0.14.0 不行
- `^`: 如果我们写 ^0.13.0，我们可以更新补丁及次要版本：0.13.1, 0.14.0 等等
- `*`: 如果我们写 *, 意味着我们可以接受所有更新，包括主版本
- `>`: 我们可以更新到任何比指定版本高的版本
- `>=`: 我们可以更新到指定版本或者任何比指定版本号高的版本
- `<=`: 我们可以更新到指定版本或者任何比指定版本号低的版本
- `<`: 我们可以更新到任何比指定版本低的版本

也有一些其他的规则：

- 没有标识符：仅接受指定版本
- `latest`：我们可以使用最新可用版本

同时我们可以结合上面所列的大部分规则，就像这样：`1.0.0 || >=1.1.0 <1.2.0`，表示或者使用 1.0.0，或者使用一个大于 1.1.0 且小于 1.2.0 的版本。
