---
title: 浏览器查找多个关键词
tags:
  - browser
  - tampermonkey
date: 2022-05-04 14:17:16
---

平时我们使用浏览器浏览页面时，经常使用 `Ctrl` + `F` 快捷键快速查找关键字。但，假如我们想查找多个关键字时该怎么办，一个一个便利关键字查找吗？不不不，合格的程序员是不会允许重复自己的。

我的解决方案：使用油猴脚本同时高亮多个关键字。

1. 安装油猴
   不同浏览器安装方法都不一样，`Microsoft Edge` 的话，直接跳转 [这个页面](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) 安装即可
2. 安装 [Text Highlight and Seek](https://greasyfork.org/scripts/13007-text-highlight-and-seek) 脚本
3. 配置启用脚本
   ![点击油猴图标，进入仪表盘](/img/browser-find-multiple-keywords/tampermonkey-menu.jpg)
   ![点击已安装的脚本](/img/browser-find-multiple-keywords/tampermonkey-installed-userscripts.jpg)
   ![进入脚本配置页](/img/browser-find-multiple-keywords/tampermonkey-settings.jpg)
   ![添加 user includes](/img/browser-find-multiple-keywords/tampermonkey-user-includes.jpg)

*备注：更多请查看 [油猴文档](https://www.tampermonkey.net/documentation.php#_include)*

实际使用效果预览：

![浏览器查找多个关键词](/img/browser-find-multiple-keywords/browser-find-multiple-entries.jpg)

- [Tampermonkey - Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- [Tampermonkey · Documentation](https://www.tampermonkey.net/documentation.php)
- [Text Highlight and Seek](https://greasyfork.org/scripts/13007-text-highlight-and-seek)
