---
title: Hexo博客使用二维码生成器
tags:
  - qr code
  - hexo
date: 2021-05-16 17:30:56
---

一般情况下，网上的二维码生成器都是后台解决方案，即前台填写信息后，发送至后台，后台生成二维码图片返回前台。比如 [草料二维码](https://cli.im) 或 [自学PHP网的二维码生成器](https://zixuephp.net/inc/qrcode_img.php?url=https://zxs66.github.io) 或者

考虑到二维码生成器是个很简单的任务，没必要非要搞个后台托管服务器，这里提供另一种纯前端方案。具体使用方法可以参考 [这个仓库](https://github.com/ZXS66/qrcode-web)

这里我就介绍一下 `Hexo` 静态博客中如何启用。

1. 拷贝 [此仓库](https://github.com/ZXS66/qrcode-web) 中 `index.html` 和 `qrcode.min.js` 文件到目标博客目录，比如 `/source/static`；

2. 打开需要使用的二位生成器的脚本或页面，引用链接到上一步复制的 `index.html`，动态传入参数 `data`(记得转义字符)，比如 `/static/qrcode.html?data=https%3A%2F%2Fzxs66.github.io%2F2021%2F05%2F16%2Fself-serve-QRCode-in-hexo%2F`(此处重命名 `index.html` 为 `qrcode.html`)；

3. 更新 `Hexo` 配置 `_config.yml`，添加忽略目标目录 `skip_render`，比如 `static/**`；

4. 更多可参考本博客每篇文章右下角的分享/微信分享。

## 参考链接

- [qrcode - npm](https://www.npmjs.com/package/qrcode)
