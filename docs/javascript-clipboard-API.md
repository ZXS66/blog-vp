---
title: javascript 剪切板
date: 2020-09-07 10:46:46
tags: [javascript, clipboard]
---

在页面上启用剪切板，一直是一个常见而又头疼的问题。我说的是自定义需要复制/剪切的内容。

以前，有如下几种解决方案：

1. 如果需要复制的内容来自页面上已有标签（`input`、`textarea`等），先调用该标签的 `.select()` 选中文本，然后调用 `document.execCommand('copy')` 复制至剪切板；
2. 如果需要复制的内容不来自页面上已有标签（比如拼接字符串），可以先创建一个 `input` 或 `textarea`，赋值需要复制的内容，append 到页面上，调用 `document.execCommand('copy')` 复制至剪切板，再从页面上 remove；
3. 把需要复制的内容，使用 `window.prompt` 弹出来，再提示用户按 `Ctrl` + `C`；
4. 使用第三方插件，具体内部原理因插件不同而不同。大概 4、5 年前依稀记得有一款插件还需要依赖 `Flash`？？？现在与时俱进了，有一款不依赖 `Flash` 和其他 framework 的插件 [clipboard.js](https://clipboardjs.com/)；

不过如果仅仅是自定义需要复制内容的话，完全没必要引入第三方库。有了 Clipboard 的新 API，使用剪切板将变得炒鸡方便啦。

先看一下目前（2020/9/7）的[兼容性](https://caniuse.com/?search=clipboard)。

*(仅看最重要的 [writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) 的情况)*

![`writeText` 的兼容性](/img/javascript-clipboard-API/writeText%20compatibility.png)

嗯，还行，82.33% 啦。如果不需要其他 API（readText、监听 ClipboardEvent 等），不考虑 IE 用户的话，足够了！

说干就干。那就从本博客的源代码复制开始着手吧。

Hexo 的默认主题 landscape 不支持源代码复制功能，那就手撸一个吧。

先更改 `themes/landscape/source/js/script.js`，在末尾处添加如下代码：

``` js
  // append copy icon to each source code section
  if (navigator.clipboard) {
    const className_shining = "shining";
    const copySourceCode = async () => {
      const $elem = event.currentTarget;
      const sourceCode = $elem.parentElement.querySelector(".code").innerText;
      await navigator.clipboard.writeText(sourceCode);
      const $msg = $elem.querySelector("span");
      // const duration = $msg.style.animationDuration;
      const duration = 512; // 512ms
      $elem.classList.add(className_shining); // add the class to trigger the animation
      // swap the innerText during the animation
      setTimeout(() => {
        $msg.innerText = $msg.dataset.afterMsg;
      }, duration / 2);
      // resume
      setTimeout(() => {
        // https://css-tricks.com/restart-css-animation/
        $elem.classList.remove(className_shining);
        void $elem.offsetWidth; // trigger reflow
        $elem.classList.add(className_shining);
        setTimeout(() => {
          $msg.innerText = $msg.dataset.beforeMsg;
        }, duration / 2);
        setTimeout(() => {
          $elem.classList.remove(className_shining);
        }, duration);
      }, duration * 4);
    };
    Array.from(
      document.querySelectorAll(".article-entry figure.highlight")
    ).forEach($fig => {
      const $fa = document.createElement("i");
      $fa.classList.add("copy");
      $fa.classList.add("fa");
      $fa.classList.add("fa-files-o");
      const beforeMsg = `👈 tap this icon to copy the code snippet`;
      const afterMsg = `copied`;
      const $msg = document.createElement("span");
      $msg.classList.add("msg");
      $msg.innerText = beforeMsg;
      $msg.dataset.beforeMsg = beforeMsg;
      $msg.dataset.afterMsg = afterMsg;
      const $row = document.createElement("div");
      $row.classList.add("source-clipboard");
      $row.appendChild($fa);
      $row.appendChild($msg);
      $row.addEventListener("click", copySourceCode);
      $fig.appendChild($row);
    });
  }
```

更改 `themes/landscape/source/css/_partial/article.styl`，设置样式:

``` styl
figure
  &.highlight
    .source-clipboard
      margin-top: 0.5em
      border-top: 1px solid gray
      padding-top: 0.5em
      .msg
        display: inline-block
        padding: 0 0.5em
        opacity: 1
      &.shining
        .msg
          animation-name: shining 
          animation-duration: 0.512s
          animation-iteration-count: 1
          animation-timing-function: ease-in-out
          animation-fill-mode: forwards
          animation-direction: alternative

@keyframes shining{
  0% { opacity: 1;}
  50% { opacity: 0;}
  100% { opacity: 1;}
}
```

使用了点 CSS 3 animation 新特性。🙂

## 友情提醒

The clipboard-write permission is granted automatically to pages when they are in the active tab. The clipboard-read permission must be requested, which you can do by trying to read data from the clipboard.

## 展示

![copy source code demo](/img/javascript-clipboard-API/demo.gif)

## 参考链接

- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Interact with the clipboard](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard)
- [How do I copy to the clipboard in JavaScript?](https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript)
