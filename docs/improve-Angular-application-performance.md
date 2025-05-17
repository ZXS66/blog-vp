---
title: 提升 Angular 应用性能技巧
date: 2020-06-22 17:47:35
tags: [angular, performance, javascript]
---

以下是我在项目中实际使用到的优化方法，更多详情，请移步本文末尾 [参考链接](#参考链接)

## ChangeDetectionStrategy.OnPush 策略：只有我的命令，让你刷新你才刷新 💗

``` Typescript
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit, OnDestroy {  
    constructor(
        private cdr: ChangeDetectorRef
    ) {

    }
}
```

## Subscription 记得及时取消订阅/销毁

特别的，目前 Angular 中发送 HTTP 请求都是使用的 [`HttpClient`](https://angular.cn/api/common/http/HttpClient)，该对象实例的 `post` 和 `get` 方法默认返回 `Observable<any>`，这就是个坑，**它不会自动销毁**，在请求完成之后。我的解决办法是，在 `HttpClient.post` 方法之后，重新 `pipe` 一个 `take(1)`。

``` Typescript
export class BaseService {
    constructor(
        private http: HttpClient
    ) {
        this.BASE_URL = '/your-app-root-path-here/';
    }
    /** ApiController URL */
    private BASE_URL: string;

    /** sending post request to API  */
    _post(actionName: string, formData?: object): Observable<any> {
        // const url = this._baseURL + actionName;
        const url = `${this.BASE_URL}${actionName}/${Math.round(performance.now())}`;
        return this.http.post(
            url,
            getRequestBody(formData),   // custom
            _HTTP_OPTIONS    // options
        ).pipe(take(1));
    }
}
```
更多请参考 ~~[此 gist](https://gitee.com/nextwave/codes/89lyrde47iqb1n0v6pc2a62)~~ [此 gist](https://gist.github.com/ZXS66/b31d4f513ee5d19846742844d6260921)

## ngFor 指令添加 trackBy
目的是让 Angular 刷新组件部分刷新，而不是全部。

## 不要在表达式中调用方法，包括 getter

使用组件的属性，它不香吗，既能缓存结果，提高页面渲染性能，又能规范书写，将业务处理规则放 js/ts 端，显示规则放页面端。

## 使用纯管道 (pure pipe)

上一点提到，使用组件的属性缓存结果，能够提高页面渲染性能。相应的，Angular 官方推荐使用 pure pipe。

## 缓存 💗

能缓存的地方，都缓存，包括但不限于 HTTP 请求、静态资源、JS Object 等。

## 性能差的组件，可以考虑用原生 HTML 控件实现 💗

有时候，打麻雀，一把 98K 就够了，没必要用大炮，你说呢 (好像还是大材小用了😄)。

## 其他常规页面优化方法 💗

[High Performance website](https://book.douban.com/subject/2084131/)

## 参考链接:

- [15 Angular Performance Tips & Tricks](https://angular-guru.com/blog/angular-performance-tips)
- [Best practices for a clean and performant Angular application](https://www.freecodecamp.org/news/best-practices-for-a-clean-and-performant-angular-application-288e7b39eb6f/)
- [Memory Management - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [Performance - Mozilla | MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Performance)
- [mgechev/angular-performance-checklist - GitHub](https://github.com/mgechev/angular-performance-checklist)
