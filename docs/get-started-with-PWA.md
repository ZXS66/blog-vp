---
title: 渐进式网页应用(PWA)入门
tags:
  - pwa
  - progressive web app
  - get started
  - workbox
date: 2021-05-06 12:54:15
---

`PWA` 现在越来越流行了。虽然国内见得不多，但国外已经非常常见了。闲来无事，那就把本博客改造成 `PWA` 好了。

## PWA 介绍

此处省略一万字。<ZLink link="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"/>

## 起步

参考的是 [这篇文档](https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/get-started)。~~此处又省略了一万字。~~

## 一个小 bug

`@pwabuilder/pwaupdate` 组件 [默认](https://github.com/pwa-builder/pwa-update#api) 加载的 `service worker` 是**当前路径**下的 "pwabuilder-sw.js" 文件。可是，当路径变了，比如跳到了更深一层目录，`service worker` 就不能正常加载了。解决办法是在注册 `service worker` 时（执行 `pwabuilder-sw-register.js` 文件），指定 `swpath` 为 "`/pwabuilder-sw.js`"。

``` js
import "https://cdn.jsdelivr.net/npm/@pwabuilder/pwaupdate";
const el = document.createElement("pwa-update");
// default is "pwabuilder-sw.js", but it doesn't work in subpaths
el.setAttribute("swpath", "/pwabuilder-sw.js");
document.body.appendChild(el);
```

## 强制更新

上线后一段时间发现，`PWA` 是可以正常工作了，也能离线使用，但是因为使用的是 `Cache-First` 策略，所以会发生服务器端其实已经更新了，但是本地一直看不到最新版本。PC 端还好，可以使用强制刷新 (`Ctrl`+`Shift`+`R`或者`Ctrl`+`Shift`+`F5`组合键或者长按刷新按钮)来查看最新版本，手机端怎么办。手机浏览器又没有强制刷新功能。

上网搜寻解决方案，发现我并不是一个人，很多人有这个痛点！！使用 `Cache-First` 策略的人，其实大部分人都是希望优先打开本地缓存版本（以提升速度），在设备联网的时候，有更新即更新版本，这次/下次刷新直接用，没更新就接着用本地缓存版。

![The stale-while-revalidate strategy](https://cdn.sanity.io/images/uf1om34c/production/5c7f0c54f4c05c14d0bbbfe4a76753c51faf9154-1014x492.png?w=1200&fm=webp&max-h=600&q=80&auto=format)

其实，Google 在设计 `workbox` 的时候，已经考虑到这个场景，解决办法非常简单，把策略改成 `Stale-While-Revalidate` 即可。
`pwabuilder-sw.js` 内容修改如下：

``` js
// This is the "Offline copy of assets" service worker
const CACHE = "pwabuilder-offline";
const QUEUE_NAME = "bgSyncQueue";
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin(
  QUEUE_NAME,
  // { maxRetentionTime: 7 * 24 * 60 } // Retry for max of 1 week (specified in minutes)
);
workbox.routing.registerRoute(
  new RegExp("/*"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE,
    plugins: [bgSyncPlugin]
  })
);
```

更多策略，请参考 [Workbox 官方文档](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) 或 [Workbox Strategies with examples and use-cases](https://www.charistheo.io/blog/2021/03/workbox-strategies-with-examples-and-use-cases/)。

发布上线，测试，完美解决问题！😄

## 参考链接

- [Get started with Progressive Web Apps (Chromium)](https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/get-started)
- [When and how does a PWA update itself?](https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox 官方文档](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [Workbox Strategies with examples and use-cases](https://www.charistheo.io/blog/2021/03/workbox-strategies-with-examples-and-use-cases/)
