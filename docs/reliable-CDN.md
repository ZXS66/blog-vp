---
title: 可靠 CDN
date: 2020-07-19 15:40:45
tags: [cdn, cloudflare, baidu, firefox, iconfont]
---

前几天，把博客的 [font-awesome](https://fontawesome.com/) 引用从博客站点本身切换到 CDN。图省事，就用了以前国内外通用的 [cloudflare](https://www.cloudflare.com/zh-cn/network/china/)，因为之前不管是在公司（外网），还是在家里（国内），访问都挺快的。然后，就出事了。。。

今天在家，闲来没事，打开自己的博客，发现 font-awesome 加载不了。起初，我以为是浏览器问题，因为我用 Firefox 有时候能正常渲染 icon font，过一会儿刷新一下又不能了，但是我用 Chrome 一直都可以正常工作。

去网上搜索一圈，发现 MDN 说：

> [<i class="mdui-icon material-icons">link</i>](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) Web Fonts (for cross-domain font usage in @font-face within CSS), so that servers can deploy TrueType fonts that can only be cross-site loaded and used by web sites that are permitted to do so. 

> [<i class="mdui-icon material-icons">link</i>](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) Fonts applied with @font-face. Some browsers allow cross-origin fonts, others require same-origin. 

发生跨域了？废话，用 CDN 肯定要跨域啊。但这些应该都是正常操作，Chrome 都行。emmm，Firefox 你在作妖吗。MDN 说的 others，该不会说的就是它自己吧。。。

查证一下 [Can I use](https://caniuse.com/#feat=fontface)：

![](/img/reliable-cdn/caniuse%20font%20face%20web%20fonts.jpg)

test:::
{% asset_img "/img/reliable-cdn/caniuse%20font%20face%20web%20fonts.jpg" "caniuse font face web fonts" %}

只要服务器支持 CORS 浏览器就没问题！[这篇文章](http://cssbakery.com/2010/07/fixing-firefox-font-face-cross-domain_25.html) 遇到的问题也是这样。

不会吧，CDN 不支持 CORS 那 CDN 要怎么用，cloudflare 肯定是支持 CORS 的！

再回头对比一下，我发现是 Firefox 请求字体文件出错时，发送的请求，是不带 HTTP 版本号的。

![firefox 请求字体文件不带版本号](/img/reliable-cdn/firefox%20cert%20invalid.jpg)

而正常请求是指定了 HTTP 版本号的：

![firefox 正常请求字体](/img/reliable-cdn/firefox%20working.jpg)

但是偶然又有一次带了版本号依然无法请求资源

![firefox 请求字体文件不带版本号](/img/reliable-cdn/firefox%20cert%20invalid%204.jpg)

什么鬼，你耍我？ ![？？？](/img/reliable-cdn/questions.png) 

莫非，真的是 CDN 问题？我查查...

好家伙，还真有问题！[Cloudflare DNS 服务中断，大量网站和服务无法访问](https://segmentfault.com/a/1190000023290310) 

虽然文中并未提及国内是否受波及，但为什么我受影响了？我去 [官网](https://www.cloudflarestatus.com/) 看看。官网说了

> All Systems Operational

所有节点均正常？你确定？然后，我发现，7月17号，也就是前天有一个 incident

> ## Cloudflare Network and Resolver Issues 
> Resolved - This incident has been resolved.
> Jul 17, 22:57 UTC
> Monitoring - A fix has been implemented and we are monitoring the results.
> Jul 17, 22:34 UTC
> Update - This afternoon we saw an outage across some parts of our network. It was not as a result of an attack. It appears a router on our global backbone announced bad routes and caused some portions of the network to not be available. We believe we have addressed the root cause and are monitoring systems for stability now.
> Jul 17, 22:09 UTC

嘶~~~ 有点不靠谱的感觉。没人攻击您，后台路由出问题了？

稍等，我之前好像看见，cloudflare 国内是和百度云合作的？嘶~~~ （不吹不黑，只是个人不喜欢太商业化的东西）

拜拜咯，cloudflare！下载一个 js 和 css 文件都这么慢，还不如直接使用自己站点资源 🤦‍

![firefox 请求 css 文件](/img/reliable-cdn/firefox%20cert%20invalid%202.jpg)
![firefox 请求 js 文件](/img/reliable-cdn/firefox%20cert%20invalid%203.jpg)

既然不用 cloudflare，那换谁呢？简单搜索了一下，目前看起来，bootcdn 还不错，行，安排！！

刷刷刷，搞定！

firefox 打开，正常！

