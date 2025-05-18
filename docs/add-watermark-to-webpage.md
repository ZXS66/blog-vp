---
title: 页面添加水印
tags:
  - watermark
  - svg
date: 2021-11-06 12:47:16
---

水印，这个让人又爱又恨的发明，终于，老板让我染指了… 😟

需求很简单，就是给页面加上水印，这样不管用户是截图还是保存页面的时候，都会强制带上水印信息。

简单来讲，按用途来分，水印也分两种：

1. 版权声明。一般在网络上散布的各种图片当中，肉眼可见的水印。
2. 监控回溯。比如之前有新闻报道，某员工将内部邮件截图发布到网上，然后公司立马约该员工喝茶，其实就是利用了邮件 APP 中肉眼极其难以分辨的水印。😰

我这次的用户需求，更贴合第一种情况。

首先，在面向搜索引擎编程之前，一定要自己试试，有哪些可能的解决方案。我大概构思了一下，简单列觉如下：

1. 整体 `body` 或者主要内容的 `div` 设置 `background-image`，并设置 `opacity`；
2. 在页面上放置一个 `position:fixed` 或者和页面同宽高的 `img` 或者 `div`（设置 `background-image`），然后设置 `z-index` 和 `opacity`；
3. 给需要加水印的 `div` 或者 `img` 添加 `:before` 或者 `:after` 属性，自动添加水印；

当然，为了防篡改，以上的这些 `CSS` 属性设置，也可以通过 `JS` 代码实现；并且通过定时任务，保持水印。更多防擦除水印，可以自行搜索，或者参考业界防复制的办法…

我的解决办法，超级简单，就是采用第一种，整体设置 `background-image`。但是这个 `image` 比较特殊，是个 SVG。考虑用 SVG 的原因是：

1. 水印内容为纯文本信息，很简单，省的制作背景图片了；
2. 对提升网络请求有益；
3. 方便之后动态设置水印内容（比如附带时间信息）；

SVG 文件的内容参考如下：

``` svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" opacity="0.125" fill="#999" font-style="italic" transform-origin="center" transform="rotate(-30)">Confidential</text></svg>
```

设置整体 `background-image`：

``` css
#app-root {
  background-image: url("/assets/images/confidential.svg");
}
```

如果需要通过代码设置动态 SVG 的话，可以使用以下代码：

``` css
.watermark {
   background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200'%3E%3Cpath d='M10 10h123v123H10z'/%3E%3C/svg%3E");
}
```

然后通过操作 [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) 来替换对应的样式，比如 [CSSStyleSheet.replaceSync()](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync) 整体替换，或者 `[cssRules](https://developer.mozilla.org/en-US/docs/Web/API/CSSRuleList)\[index\].style` 部分替换。

``` js
// https://bl.ocks.org/jennyknuth/222825e315d45a738ed9d6e04c7a88d0
function encodeSvg(svg: string) {
  return svg.replace('<svg', (~svg.indexOf('xmlns') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"'))
    .replace(/"/g, '\'')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/{/g, '%7B')
    .replace(/}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
}
const dataUri = `data:image/svg+xml;utf8,${encodeSvg(svg)}`;
const stylesheet = document.styleSheets[0]; // need to update accordingly
stylesheet.cssRules[0].style.backgroundImage=dataUri; // need to update accordingly
```

某些时候，修改了以上代码之后，你会发现，页面好像没有任何的变动，或者只有部分组件有水印。这可能是因为，页面 `DOM` 设置了背景颜色，比如我的项目代码中引用了 `Ant Design` 的组件，而这些组件默认背景色就是白色。解决办法就是调整主题样式：

``` css
#app-root .ant-btn,
#app-root .ant-card,
#app-root .ant-alert,
#app-root .ant-drawer,
#app-root .ant-form,
#app-root .ant-grid,
#app-root .ant-moal,
#app-root .ant-notification,
#app-root .ant-popover,
#app-root .ant-tabs,
#app-root .ant-table,
#app-root .ant-table tr th:not(.ant-table-cell-fix-left),
#app-root .ant-table tr td:not(.ant-table-cell-fix-left) {
  background-color: initial;
}
```

## 参考链接

- [How to add SVGs with CSS (background-image)](https://www.svgbackgrounds.com/how-to-add-svgs-with-css-background-image/)
- [CSSStyleSheet.replaceSync()](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync) 
- [Modify a stylesheet rule with CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Using_dynamic_styling_information#modify_a_stylesheet_rule_with_cssom)
