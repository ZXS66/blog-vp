---
title: JavaScript window.print 不能正常调用
tags:
  - javascript
  - window.print
date: 2021-06-09 17:19:13
---

一直以来，我都是调用 `window.print` 方法唤起页面打印功能（这个方法还可以用来保存 pdf 文件）。但是今天开始，这个方法不能 100% 正常工作了。我以为，只要我调用了这个方法，打印对话框就跟我调用 `window.alert` 一样立马出来。但是现实啪啪打脸，它并没有出来。

网上搜了一大堆资料，发现遇到这个问题的人还不少。看来是我想当然了。

这里记录一下结论（坑）：**页面还卡在加载资源的时候，是不能调用 `window.print` 方法的**（见参考 [链接 1](https://stackoverflow.com/questions/18622626/chrome-window-print-print-dialogue-opens-only-after-page-reload-javascript/46051099#46051099)）。

可能你遇到的问题和我的还不太一样，更多可能原因，请参考 [链接 2](https://www.xspdf.com/resolution/51316274.html)

### 参考链接

- [Chrome: window.print() print dialogue opens only after page reload (javascript)](https://stackoverflow.com/questions/18622626/chrome-window-print-print-dialogue-opens-only-after-page-reload-javascript/46051099#46051099)
- [Google chrome printing issues 2020](https://www.xspdf.com/resolution/51316274.html)
