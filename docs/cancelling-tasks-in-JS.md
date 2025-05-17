---
title: JS 中如何取消任务
date: 2020-11-05 16:24:40
tags: [javascript, promise, fetch, xmlhttprequest, rxjs, abort, cancel]
---

在前端编程过程中，虽然很少发生，但确实会遇到，需要取消此前的任务。一般这些任务是耗时任务，比如网络请求、`setTimeout` 或动画等等。而这些不同的场景分别都有不同的解决方案。

## XMLHttpRequest

就是传统的 ajax 请求，要取消非常简单，直接调用 [abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort) 方法即可，炒鸡简单，完全木有兼容性问题，这里就不赘述了。

## Promise

[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 是早在 ES6 中就推出的方案，很早之前就被各大浏览器实现的，兼容性也 [挺好的](https://caniuse.com/promises) (IE：？？？)。但是，自 Promise 推出之日，就有两个备受诟病的点，其中一个就是无法取消任务。*另一个点是无法监听最新状态（类似于 [XMLHttpRequest: progress](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/progress_event) 事件)*

基本上现在很多的前端项目都用到 Promise，毕竟真的很好用。但是没有取消功能，有时候真的很让人捉急。W3C 规范一时半会儿是不会支持此功能了，难道只能这样，坐以待毙？作为一枚爱瞎折腾的前端开发，当然会说 “不” 。

[Stackoverflow](https://stackoverflow.com/questions/30233302/promise-is-it-possible-to-force-cancel-a-promise) 上有一个问答已经很好的回答了大部分用户的疑惑了。简单来说，① 是的，Promise 不支持取消功能 ② 但你可以使用第三方类库比如 [bluebird](https://github.com/petkaantonov/bluebird) ③ 手动传入取消 token ④ 利用 [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) 方法

##### 第三方类库

emmm，我就是想要取消一个 Promise 任务（停止执行 then 方法），为什么要我引入第三方库，而且还要对以前的代码大改？！anyway，第三方存在即合理，我就不去纠结引入第三方库的利弊了。各位如果感兴趣，请移步至其官网或各大搜索引擎。

##### 手动传入取消 token

这个稍微有点复杂，就是自己处理取消逻辑。拿 XMLHttpRequest 举例：

``` js
function getWithCancel(url, token) { // the token is for cancellation
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url);
   return new Promise(function(resolve, reject) {
      xhr.onload = function() { resolve(xhr.responseText); });
      token.cancel = function() {  // SPECIFY CANCELLATION
          xhr.abort(); // abort request
          reject(new Error("Cancelled")); // reject the promise
      };
      xhr.onerror = reject;
   });
};
 
/////// sample: cancel a promise 
var token = {};
var promise = getWithCancel("/someUrl", token);
// later we want to abort the promise:
token.cancel();
```

简单来说，就是在返回 `Promise` 实例之前，返回一个 `token`，其自带 `cancel` 方法供之后使用。

不过我个人觉得使用起来还是很麻烦，可以优化：

``` js
function getWithCancel(url) {
    const xhr = new XMLHttpRequest;
    xhr.open("GET", url);
    let cancel = ()=>{};
    const p = new Promise(function(resolve, reject) {
        xhr.onload = function() { resolve(xhr.responseText); });
        cancel = function() {  // SPECIFY CANCELLATION
            xhr.abort(); // abort request
            reject(new Error("Cancelled")); // reject the promise
        };
        xhr.onerror = reject;
    });
    return [p, cancel];
};
/////// sample: normal request
var [req1] = getWithCancel("/someUrl");
/////// sample: cancel a promise 
var [req2, cancel2] = getWithCancel("/someUrl");
// later we want to abort the promise:
cancel2();
```

##### 利用 Promise.race 方法

没用过这个方法的，可以参考 MDN 上的 [这个范例](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) 快速上手。

```js
const promise1 = new Promise((resolve, reject) => {
  setTimeout(resolve, 500, 'one');
});

const promise2 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, 'two');
});

Promise.race([promise1, promise2]).then((value) => {
  console.log(value);
  // Both resolve, but promise2 is faster
});
// expected output: "two"
```

通过名字即可看出，这个方法返回一个 `Promise` 实例，只要传入的一堆 promise 其中任何一个被 resolve 或者被 reject 了，该实例相应的立马被 resolve 或者 reject。

那怎么用 `Promise.race` 来实现取消功能？请参考以下代码：

```js
const myTask = new Promise((resolve,reject)=>{
    // use setTimeout to simulate a time-cost task
    setTimeout(resolve, 1024, 'fulfilled');
});
let cancel = ()=>{};//empty function
const cancelTask = new Promise(resolve=>cancel=resolve)
const testcase = Promise.race([cancelTask, myTask]);
testcase.then((result)=>{
    console.log(result); // just for test, print the result
    if (result !== 'cancelled'){
        // my business logic code here
    }
});
// cancel later
setTimeout(cancel,512,'cancelled');
```
*↑ 为了更好理解，上述有一些不太好编码风格。大家可以在真正需要使用取消功能之前稍加优化一下，这里我就偷个懒了 😛*

其实是上一种方法的变种，需要手动传入取消 token。有一个小限制就是，如果在运行 `testcase` 之前，已经订阅了 `myTask`（调用 .then 方法），那其实在取消（调用 `cancel` 方法）之后，该订阅者还是会被通知的。所以，应该订阅 `testcase` 而非 `myTask`。

##### 改写 `Promise.prototype.cancel`  ❌不推荐

其实还有一个更简单又很好用的办法，就是直接更改 `Promise` 原型，添加 `Promise.prototype.cancel` 方法，这样以前代码也不用变，还附赠了 `cancel` 方法。但是个人不推荐，因为，是侵入性的，太粗鲁了。不过我相信萝卜白菜，各有所爱，总有人好这一口。既然这样，大家自行实现去吧。 😄

当然，你也可以使用 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 或者对 `promise` 实例 [Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 而不是改写 `Prototype` 来减少侵入性。 👍

## fetch

`fetch` 是比 `Promise` 还要新的 API，现代浏览器基本上都有实现（IE：？？？），它返回的就是一个 `Promise` 实例。所以上一章节的方案也适用于 `fetch`。

可能是呼声太大了，fetch 其实还提供了额外的取消方式，请参考一下代码：

``` js
// abort in 1 second
let controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

try {
  let response = await fetch('/article/fetch-abort/demo/hang', {
    signal: controller.signal
  });
} catch(err) {
  if (err.name == 'AbortError') { // handle abort()
    alert("Aborted!");
  } else {
    throw err;
  }
}
```

简单理解，**此方案取消发送该网络请求并模拟 `reject` 一个 `AbortError` 实例**（执行 `then:onrejected`、`catch`、`finally`，但不执行`then:onfulfilled`）。

![source](/img/cancelling-tasks-in-JS/F12.source.2.png)
![console](/img/cancelling-tasks-in-JS/F12.console.2.png)
![network](/img/cancelling-tasks-in-JS/F12.network.2.png)

*更多请查看 [此文档](https://javascript.info/fetch-abort)*

代码不长，就是先初始化一个 [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 实例，在调用 `fetch` 方法的时候，将此实例的 `signal` 属性也传进去。在之后，如果想要取消了，直接调用该实例的 [abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) 方法。emmm，还挺香的嘛~

基本上支持 Promise 的现代浏览器，也都支持 [AbortController](https://www.caniuse.com/abortcontroller)。

## rxjs Subscription

在我平时的工作中，接触 [Angular](https://angular.cn) 比较多，`Angular` 默认依赖 [rxjs](https://rxjs.dev)。[HttpClient](https://angular.cn/api/common/http/HttpClient)（用于网络请求）的 `get` 或 `post` 方法返回值是 `rxjs` 中的 [Observable](https://rxjs.dev/guide/observable)。 如果此 `Observable` 未被订阅，那该请求就不会被发送出去；如果此 `Observable` 已被订阅（调用 `subscribe` 方法，返回值为 `Subscription` 类型），想要取消，很简单，直接调用 [unsubscribe](http://reactivex.io/rxjs/class/es6/Subscription.js~Subscription.html#instance-method-unsubscribe) 方法即可。值得注意的是，此方法不仅可以终止订阅时定义的成功返回的方法，也会 **终止发生错误的方法** (当然，第三个参数 `complete` 方法也会一并终止执行)，还同时回取消网络请求，一步到位！

![source](/img/cancelling-tasks-in-JS/F12.source.png)
![console](/img/cancelling-tasks-in-JS/F12.console.png)
![network](/img/cancelling-tasks-in-JS/F12.network.png)

## 参考链接

- [XMLHttpRequest.abort()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort)
- [Promise - is it possible to force cancel a promise](https://stackoverflow.com/questions/30233302/promise-is-it-possible-to-force-cancel-a-promise)
- [Promise.race()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
- [AbortController.abort()](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
