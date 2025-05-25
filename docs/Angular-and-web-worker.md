---
title: Angular × web worker
date: 2020-07-05 23:19:38
head:
  - - meta
    - name: keywords
      content: angular web worker performance
tags: [angular, web worker, performance]
---

继前段时间瞎折腾 Angular 应用性能之后，页面性能确实有所提升，但感觉还有提升空间。想到此前一直缠绕在心中的 Web Worker，于是耐不住萌（ji）动（mo）的心，准备再接再厉，来一顿骚操作，让页面更加丝滑。

## 升级 Angular

此前项目的 Angular 版本是 v7，足够支撑所有的业务功能了。**如果没有足够充分的理由，强烈不建议这种大版本升级（v7 -> v10.0.0）！！！强烈不建议这种大版本升级（v7 -> v10.0.0）！！！强烈不建议这种大版本升级（v7 -> v10.0.0）！！！** 不要问我为什么，问就是 *“谁升级谁知道”*。😔……

但是，想要在 Angular 应用中体验 Web Worker，则必须版本至少是 8.0。写原生 js？没问题，但是既然官方支持了，所有的配置、最佳实践啊都是现成的，它不香吗。正好体验一下 Ivy  :)

“诸位，青春可是永无止境的！” - 【[凯皇](https://naruto.fandom.com/wiki/Might_Guy)】

![Might Guy](https://vignette.wikia.nocookie.net/naruto/images/c/cf/Guy_Opening_7th_Gate.png/revision/latest/scale-to-width-down/1000?cb=20150709214439)

所以，尽情绽放吧，少年！哈哈哈哈哈哈哈哈哈

完整文档请参考此[官网链接](https://update.angular.io/#7.2:10.0)

## 升级依赖项 （可选）

我是使用如下命令一次性升级所有的依赖项（不推荐，但是我这个项目小，所以无所谓啦）：

``` bash
ng update --all --force
```

## 尝试运行项目，解决编译时/运行时的警告/错误提示 （可选）

毕竟，从 7 到 10，步子有点大，很多 breaking changes，不仅仅是 Angular 本身，包括我项目用到的 [NG ZORRO](https://github.com/NG-ZORRO/ng-zorro-antd) 等等。

我的项目中遇到的问题有（大概记录一下，不记得每个改动了）：

- 更改所有 `/deep/` 为 `::ng-deep`
- `nzTooltip` 移除 `nzTitle`，推荐使用 `nzTooltipTitle`
- `nzTable` 新的排序方式
- `nzModal` API 下，`nzGetContainer` 设置非空时，弹出框正文可能被遮挡

## 跑起来，确保升级之后应用仍可以正常运行且编译（很重要！！！）

一般情况下都是可以的正常运行的。真碰见问题，问 [Github](https://github.com/angular/angular/issues/) 或者搜索引擎。

好了，终于可以进入正题啦！

## 在项目目录中，创建一个基础的 Web Worker

``` shell
ng generate webWorker [name]
```

[参考链接](https://angular.cn/cli/generate#webworker)

## 查看项目变化

此时 Angular CLI 会自动处理好所有变更。比如添加 `tsconfig.worker.json`、修改 `angular.json`、添加 web worker 文件等等。

## 编写 web worker 文件

一般情况下，web worker 是需要操作请求服务器数据的，所以这里简单贴一下请求代码

### `xxxx.worker.ts` 文件

``` TypeScript
/// <reference lib="webworker" />

// importScripts('./worker-common.model');
import { WorkerMessage, WorkerAction } from './worker-common.model';

addEventListener('message', async ({ data }) => {
  if (data) {
    const theMessage = data as WorkerMessage;
    const theData = theMessage.data;
    const theAction = theMessage.action;

    let responseMessage: WorkerMessage;
    if (theAction === WorkerAction.FetchCheckpoints) {
      const tagID = +theData;
      if (typeof tagID !== 'number') {
        // throw new Error('tagID should be number');
        return postMessage(new Error('tagID should be number'));
      }
      const responseData = await fetchCheckpointsByTag(+theData);
      responseMessage = new WorkerMessage(responseData, theAction);
    } else {
      // if (action === WorkerAction.Ping)
      const content = (theData || '').split('').sort().join('');
      responseMessage = new WorkerMessage(content, theAction);
    }
    return postMessage(responseMessage);
  } else {
    console.error('data of MessageEvent is empty');
  }
});

/// localStorage is not available in web worker
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers
/** caching */
const __STORAGE__ = new Map<string, any>();

/** generate key for localStorage */
const genStorageKey = (...parameters) => {
  // arguments.callee is also not availabe in web worker
  return (parameters || []).join(':');
};

const fetchCheckpointsByTag = async (tagID?: number) => {
  const checkpoints = await fetchCheckpoints();
  if (tagID) {
    const checkpointIDs = (await fetchCheckpointTagMap()).filter(_ => _.TagID === tagID).map(_ => _.CheckPointID);
    const hashMap = new Set(checkpointIDs);
    return checkpoints.filter(_ => hashMap.has(_.ID));
  } else {
    return checkpoints;
  }
};

type CheckPoint = { ID: number, Title: string };

/** function to fetch checkpoints */
const fetchCheckpoints = async () => {
  const storeKey = genStorageKey(fetchCheckpoints.name);
  let checkpoints: Array<CheckPoint> = __STORAGE__.get(storeKey);
  if (!(Array.isArray(checkpoints) && checkpoints.length)) {
    // no data stored in localStorage
    const resp = await fetch('http://localhost:44316/api/CheckPoints', {
      method: 'POST',
      credentials: 'include'
    });
    checkpoints = await resp.json();
    __STORAGE__.set(storeKey, checkpoints);
  }
  return checkpoints || [];
};

type CheckPoint_Tag_Map = { CheckPointID: number, TagID: number };
const fetchCheckpointTagMap = async () => {
  const storeKey = genStorageKey(fetchCheckpointTagMap.name);
  let checkpointTagMap: Array<CheckPoint_Tag_Map> = __STORAGE__.get(storeKey);
  if (!(Array.isArray(checkpointTagMap) && checkpointTagMap.length)) {
    const resp = await fetch('http://localhost:44316/api/CheckPointTagMap', {
      method: 'POST',
      credentials: 'include'
    });
    checkpointTagMap = await resp.json();
    __STORAGE__.set(storeKey, checkpointTagMap);
  }
  return checkpointTagMap || [];
};

```

### `worker-common.model.ts` 文件

``` TypeScript

/** enumerator for all worker actions */
export enum WorkerAction {
    Ping,
    FetchCheckpoints
}

export enum WorkerStatusCode {
    Initial,
    OK,
    Error,
    Empty,
    ToBeContinued
}

export class WorkerMessage {
    constructor(
        public data: any,
        public action: WorkerAction
    ) {

    }
    public status?: WorkerStatusCode = WorkerStatusCode.Initial;
}

```

## 编写 `*.component.ts` 文件

同样，简单示例一下，`xxxx.component.ts` 文件：

``` TypeScript

  ngOnInit(): void {
    // register web worker
    if (typeof Worker !== 'undefined') {
      this.webWorker = new Worker('../xxxx.worker', { type: 'module' });
      this.webWorker.addEventListener('message', ({ data }) => {
        const theMessage = data as WorkerMessage;
        const theAction = theMessage.action;
        if (theAction === WorkerAction.FetchCheckpoints) {
          this.qwCheckPoints.response.Data = theMessage.data || [];
          this.qwCheckPoints.status = Utility.isNotEmptyArray(this.qwCheckPoints.response.Data) ?
            QueryStatus.SUCCESS : QueryStatus.EMPTY;
        }
      });
      this.webWorker.postMessage(new WorkerMessage(null, WorkerAction.FetchCheckpoints));
    } else {
      // Web workers are not supported in this environment.
      // TODO: You should add a fallback so that your program still executes correctly.
      console.log('The browser doesn\'t support Web Worker.');
    }
  }
  
  someAction(tce) {
    const tagID = tce.index === 0 ? 0 : (this.qwCheckPointTags.response.Data[tce.index - 1] || {}).ID;
    // this.qwCheckPoints.query(tagID);
    this.webWorker.postMessage(new WorkerMessage(tagID, WorkerAction.FetchCheckpoints));
  }
```

## 拉出来遛一遛

<script setup>const myAppLink=`${window.location.origin}/ng/#/lab/emoji`;</script>

<a :href="myAppLink" target="_blank" rel="noopener noreferrer"><fa-icon icon="search"/> Emoji 搜索工具</a>

emmmm，一切都按照预期走了，没什么问题。除了：Google Chrome 调试 Web Worker 真的是鸡肋！！！以后真的在项目中大量使用了再说吧。。。。。。

## 参考链接

- [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [The Basics of Web Workers](https://www.html5rocks.com/en/tutorials/workers/basics/#toc-gettingstarted)
- [Functions and classes available to Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers)
- [Web Worker 文献综述](https://github.com/CntChen/cntchen.github.io/issues/19)
