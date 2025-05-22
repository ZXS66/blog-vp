---
title: CDN 故障转移
date: 2020-07-23 14:49:22
tags: [cdn, javascript, failover, async, defer, execution order]
---

首先说一句，这篇文章标题可能不太准确，因为涉及的技能点可能有点杂，比较跳跃，但是都是我在做 CDN 故障转移时碰到的，所以全都扔在一篇文章里，不介意的话，将就着吧，有什么不懂的，请点击文章中的各种链接 😄

<!-- 这篇文章是继上篇文章 [可靠 CDN](/reliable-CDN) 之后的另一篇关于 CDN 的思考及实践。 -->

## SRI 检查

[SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) 是一种安全机制，让浏览器通过验证它接收到的资源（比如从 CDN）是未经过更改的。简单理解就是浏览器把（从 CDN）拿到的资源进行哈希计算，然后把这个哈希值与开发者事先计算好的哈希值（integrity) 匹配。目前[大多数浏览器都支持 SRI 检查](https://caniuse.com/#feat=subresource-integrity)(emmm，除了 IE)。 

实际使用很简单，就是指定 `script` 或 `link` 标签的 `integrity` 属性，值为事先计算的该静态资源的哈希值（sha256，sha384，sha512中的一个或多个） [<fa-link/>](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity#Using_Subresource_Integrity)。MDN 推荐了一个 [SRI Hash Generator](https://www.srihash.org/) *（有一个缺点，只能生成 script 便签，不能根据 css 文件成 link 标签，需要手动调整）*

需要注意的是，一般需要 SRI 检查的静态资源都在 CDN 上，所以都是需要开启 CORS。好在 CDN 默认都开启了，我们需要做的是浏览器端手动添加上 [crossorigin 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)，不然可能会出错 :(

## 标记 script 标签为 async 或 defer

下面是 `script` 标签的属性（`async`、`defer`、`module`、`nomodule`等）常用场景 [<fa-link/>](https://gist.github.com/jakub-g/385ee6b41085303a53ad92c7c8afd7a6)：

|`script`标签类型        |常见使用场景                     |
|------------|-------------------------------------|
|script src     |a legacy library that is needed by subsequent inline scripts|
|script src defer|deferred execution, maintaining order; e.g. a lib that is needed by other defer scripts; progressive enhancement code|
|script src async|deferred execution, without order (independent scripts); e.g. self-instantiating analytics lib|
|script src async defer|like above, but with IE9 support|
|script inline|1) small piece of code that must be executed immediately, before some subsequent code (inlined polyfills, timers, server-generated configuration), or to register certain event listeners as soon as possible; 2) non-cacheable (generated, often changing etc.) code; 3) experience critical code that is small and the round-trip latency to download it separately would be too much|
|script src module|library/app, for modern browsers only|
|script src module async|progressive enhancement code, for modern browsers only|
|script inline module |small piece of and/or non-cacheable code, for modern browsers only; perhaps inline config that is necessary for another non-async module declared after it|
|script inline module async|small piece of and/or non-cacheable progressive enhancement code (independent script), for modern browsers only; it may `import`s a well-cacheable library|
|script nomodule ...|a fallback script for legacy browsers, when shipping ES modules to modern browsers|

简略版的请看图：

![A comparison of various ways the script tags in HTML](/img/cdn-failover/a%20comparison%20of%20various%20ways%20the%20script%20tags%20in%20HTML.png)

总结：**一般情况下，`async` 用于加载基础类库（加载完立即执行，无依赖项），`defer` 用于加载一些 addon（待基础类库加载完后，`DOMContentLoaded` 事件前，依次执行）**。

## 调整 Hexo 模板生成脚本

### 增加 CDN 配置项

👇 _config.yaml

``` yaml
cdn: https://cdn.bootcdn.net/ajax/libs/
```

### 使用 [Hexo 默认的 helper 方法](https://hexo.io/docs/helpers.html) js/css 生成 script/link 标签。

👇 after-footer.ejs

``` ejs
<%- js({src:config.cdn+'jquery/2.0.3/jquery.min',integrity:'sha256-pXtSQrmprcTB74RsNlFHuJxHK5zXcPrOMx78uWU0ayU= sha384-ECTndYny330R2jlSXBiZkdXzAVi0Z/iDXJTwV6cp39HECmalqg6+b2sFZFf/Y2m6 sha512-epzJ9ms+0Pq+zFMrG1lXVNvjEXgtfKx9iuEWqz3hmbaU2m/Dp1pcmpYzuSdDLqX6PMIjzMOyGFwMc+SkgFhMFg==',crossorigin:'anonymous'}) %>
<% if (theme.fancybox){ %>
<%- css({href:config.cdn+'fancybox/2.1.5/jquery.fancybox.min',integrity:'sha384-RMsmRsuFJAxdvCCX2XHjTlWajoB7207PpLqA4HMVuie0TAWK0x+7ubbuDa58Tcij',crossorigin:'anonymous'}) %>
<%- js({src:config.cdn+'fancybox/2.1.5/jquery.fancybox.pack',integrity:'sha384-A/Tc8RFHsjkPvgL0yZebgTxxmCGCSaTpGkyQLeFFFJQIAzSozLwNGX9AOCIpxoXC',crossorigin:'anonymous',defer:true}) %>
<% } %>
<%- js({src:'js/script',defer:true}) %>
```

### 编写自定义 Hexo Helper 方法 (*Optional*)

Hexo 默认的 helper 方法 `js` 和 `css` 足够使用，但是还有精简的空间。比如每个方法的参数均包含 `config.cdn` 和 `crossorigin:'anonymous'`，一个程序员的基本素养就是 DRY (Don't Repeat Yourself)。以下就是其中一种优化措施 （[参考链接](https://hexo.io/api/helper.html)）：

在 `theme/your-theme/scripts` 下新建 `js_cdn.js` 和 `css_cdn.js` 文件。其中前者内容如下（后者内容极其相似）：

``` js
hexo.extend.helper.register("js_cdn", function(item) {
  const js = hexo.extend.helper.get("js").bind(hexo);
  const integrityProp = "integrity";
  const placeholder = " " + integrityProp;
  const crossoriginAttr = ' crossorigin="anonymous"';
  let markup = js(item);
  if (item.hasOwnProperty(integrityProp)) {
    // default `js` helper function doesn't include crossorigin="anonymous" in the generated script markup
    const idx = markup.indexOf(placeholder);
    markup = [markup.substring(0, idx), crossoriginAttr, markup.substring(idx)].join("");
  }
  return markup;
});
```

更新模板生成脚本 `after-footer.ejs` (删除 `,crossorigin:'anonymous'`)

``` ejs
<%- js_cdn({src:config.cdn+'jquery/2.0.3/jquery.min',integrity:'sha256-pXtSQrmprcTB74RsNlFHuJxHK5zXcPrOMx78uWU0ayU= sha384-ECTndYny330R2jlSXBiZkdXzAVi0Z/iDXJTwV6cp39HECmalqg6+b2sFZFf/Y2m6 sha512-epzJ9ms+0Pq+zFMrG1lXVNvjEXgtfKx9iuEWqz3hmbaU2m/Dp1pcmpYzuSdDLqX6PMIjzMOyGFwMc+SkgFhMFg=='}) %>
<% if (theme.fancybox){ %>
<%- css_cdn({href:config.cdn+'fancybox/2.1.5/jquery.fancybox.min',integrity:'sha384-RMsmRsuFJAxdvCCX2XHjTlWajoB7207PpLqA4HMVuie0TAWK0x+7ubbuDa58Tcij'}) %>
<%- js_cdn({src:config.cdn+'fancybox/2.1.5/jquery.fancybox.pack',integrity:'sha384-A/Tc8RFHsjkPvgL0yZebgTxxmCGCSaTpGkyQLeFFFJQIAzSozLwNGX9AOCIpxoXC',defer:true}) %>
<% } %>
<%- js_cdn({src:'js/script',defer:true}) %>
```

## CDN 故障转移

进入本文正文了！

考虑到 CDN 也有会有打盹的时候，所以，一个比较好的实践就是时刻做好 Plan B。我的方法是，在页面的自定义脚本中检查脚本加载情况并在执行尝试加载候选资源。

以下是示例代码（`js/script.js`）：

``` js
(function() {
  var dependencies = [
    {
      export: window.jQuery,
      failover: "https://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.0.3.min.js",
      // failover: "https://code.jquery.com/jquery-2.0.3.min.js",
      integrity: "sha256-sTy1mJ4I/LAjFCCdEB4RAvPSmRCb3CU7YqodohyeOLo="
    },
    {
      export: (window.jQuery || {}).fancybox,
      failover:
        "https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.pack.js",
      integrity:
        "sha384-A/Tc8RFHsjkPvgL0yZebgTxxmCGCSaTpGkyQLeFFFJQIAzSozLwNGX9AOCIpxoXC"
    }
  ];
  // failover to load alternative files when CDN libraries failed.
  var nonLoadedDependencies = dependencies.filter(function(dep) {
    return !dep.export;
  });
  /** lazy load js files */
  function loadDependency(dep) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = dep.failover;
      if (dep.integrity && dep.integrity.length) {
        script.integrity = dep.integrity;
        script.crossOrigin = "anonymous";
      }
      // // https://www.html5rocks.com/en/tutorials/speed/script-loading/#toc-dom-rescue
      script.async = false;
      script.addEventListener("load", function() {
        resolve(dep.failover + " is loaded");
      });
      script.addEventListener("error", function() {
        reject(dep.failover + " can't be loaded!");
      });
      document.body.appendChild(script);
    });
  }

  (nonLoadedDependencies.length
    ? new Promise(function(resolve, reject) {
        Promise.all(nonLoadedDependencies.map(loadDependency)).then(function() {
          resolve("All dependencies are loaded!");
        }, reject);
      })
    : Promise.resolve("All dependencies are loaded!")
  ).then(myBiz);

  /** business logic, will be executed when all dependencies loaded */
  function myBiz() {
    /// your business code comes here
  }
})();
```

其中有一行语句需要单独拎出来讲一下的，就是上面脚本的第 31 行，`script.async = false;`

如果您的 `dependencies` 都没有依赖项，有没有这条语句关系不大，相反还能提高加载性能。但是，现实情况是很多脚本都是有依赖项的，上面贴的代码就是个很好的例子。`jquery.fancybox.pack.js` 文件依赖于 `jquery.min.js` 文件。

所以，如果没有这行语句，默认这些 `script` 会按 `async` 的方式去执行（脚本下载成功立即执行），也就是说，可能会出现后面的脚本先被执行的情况。但是后面的脚本依赖于前面的脚本，立即执行会报错。

![](/img/cdn-failover/dependent%20script%20execution%20error.png)

受 [这篇文章](https://www.html5rocks.com/en/tutorials/speed/script-loading/) 启发，加上上面说的这条语句，就可以确保 async 的脚本的执行顺序了。

调整完之后的脚本下载时间不变，但是不报错了，因为执行顺序对上了。

![](/img/cdn-failover/async%20script%20execution%20order.png)

当然，这个脚本还有很大的提升空间（比如，`Promise` 在低版本浏览器兼容问题），这里暂时就不浪费体力了。

## 思考

既然动态添加的 `async` 脚本执行顺序不确定，那 `defer` 脚本如何呢？？

## 参考链接

- [&lt;script&gt; async, defer, async defer, module, nomodule, src, inline - the cheat sheet](https://gist.github.com/jakub-g/385ee6b41085303a53ad92c7c8afd7a6)
- [Scripts: async, defer](https://javascript.info/script-async-defer)
