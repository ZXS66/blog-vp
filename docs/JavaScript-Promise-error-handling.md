---
title: JavaScript Promise 异常捕获
tags:
  - javascript
  - promise
  - throw
  - try...catch
date: 2021-06-19 17:34:03
---

[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 在前端编程中，越来越频繁地被使用了。作为 `ES6` 的核心功能之一，`Promise` 现在 [基本上没有兼容性问题](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#browser_compatibility)（除了 [Promise.prototype.finally](https://caniuse.com/mdn-javascript_builtins_promise_finally)、[Promise.allSettled](https://caniuse.com/mdn-javascript_builtins_promise_allsettled)、[Promise.any](https://caniuse.com/mdn-javascript_builtins_promise_any) 这些比较新的 API）。而且，现在 [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) 写法越来越普遍，`Promise` 作为其背后的基础功能，自然需要各位前端更好地掌握了。

这里推荐 [阮一峰老师](http://www.ruanyifeng.com/home.html) 的 [ES6 入门](https://es6.ruanyifeng.com/#docs/promise)，简洁明了，还举例说明，同时满足新手和专家不同的学习需求！👍👍👍

好了，进入主题：**如何捕获 JS 中 `Promise` 的异常？**

一般 JS 中异常捕获都是使用 [try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) 语句，而 `Promise` 中如果出现异常，一般都是 `reject()`，然后在 `Promise` 链的末尾 [Promise.prototype.catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) 里处理异常。

![Promise Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/promises.png)

但 `Promise` 也可以使用 [Promise.prototype.finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally) 或者使用 JS 原生的 `try...catch` 语句达到抛出异常的目的。

## 最佳实践 

根据 [MDN](https://developer.mozilla.org) 的文章 [<fa-link/>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#common_mistakes) 推荐，一般 `Promise` 链的最佳实践满足以下三个条件：

1. 内链返回新的 `Promise`；
2. 避免不必要的嵌套；
3. 使用 `catch` 中止 `Promise` 链。

反例 🙁：

```js
// Bad example! Spot 3 mistakes!
doSomething().then(function(result) {
  doSomethingElse(result) // Forgot to return promise from inner chain + unnecessary nesting
  .then(newResult => doThirdThing(newResult));
}).then(() => doFourthThing());
// Forgot to terminate chain with a catch!
```

正确姿势 🙂：

```js
doSomething()
.then(function(result) {
  return doSomethingElse(result);
})
.then(newResult => doThirdThing(newResult))
.then(() => doFourthThing())
.catch(error => console.error(error));
```

总结：

- [Promise.prototype.catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) 可以捕获 `Promise` 中所有的异常，包括 `reject` 掉的、或者抛出的异常；以下两种写法其实是等效的：
  ```js
  new Promise((resolve, reject) => {
    throw new Error("Whoops!");
  }).catch(alert); // Error: Whoops!
  ```
  ```js
  new Promise((resolve, reject) => {
    reject(new Error("Whoops!"));
  }).catch(alert); // Error: Whoops!
  ```
- 当我们明确知道哪里会出现异常，知道如何处理异常，请时刻牢记使用 [Promise.prototype.catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) 来捕获/分析/记录异常；如果我们不知道捕获到的异常种类（比如编程错别字导致的），那就重新抛出异常；
- 当然，如果发生了无法预料到的异常，那我们也可以不使用 [Promise.prototype.catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch)
- 任何情况下，我们都应该监听 `unhandledrejection` 事件，跟踪未捕获的异常并通知给用户（也可能是我们的服务器），这样的话我们的应用才不会“死”。

## 不同点

1. `reject` 只能用在 `Promise` 回调函数里，而抛出 (`throw`) 异常则可以使用在任何 `try...catch` 语句或者 `Promise` 中；
2. `reject` 异常之后，方法内的函数会继续执行，而抛出 (`throw`) 异常则会立刻终止执行；
3. `reject` 可以用在 `Promise` 的同步/异步回调函数里，而抛出 (`throw`) 异常只能用在同步回调函数里。

## 参考链接

- [Error handling with promises](https://javascript.info/promise-error-handling)
- [Using Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [Reject Vs Throw Promises in JavaScript](https://www.geeksforgeeks.org/reject-vs-throw-promises-in-javascript)
