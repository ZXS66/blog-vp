---
title: JavaScript 轻量级缓存
tags:
  - javascript
  - storage
  - localstorage
  - sessionstorage
date: 2021-06-29 17:41:15
---

## localStorage VS sessionStorage

二者统称为 [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)。使用场景是少量数据缓存，用来替代 `Cookie` 还是很不错滴。

| | localStorage | sessionStorage|
|-----|-----|-----|
|常见场景|代替 `cookie` 和 `window` 全局变量，存储一些计算费时的，需要多页面/组件共享的变量|类似 `localStorage`，但是有时效 *|
|时效性|长期存在，仅当用户/程序手动删除时才失效|有点复杂，本身 `session` 就很难讲请，`sessionStorage` 的时效性和 `session` 又有区别😂|
|限额|5MB|5MB|

## IndexedDB

光看它的 API 文档 <ZLink link="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"/>，就已经晕了😵。简单理解就是，前端的事务性数据库。所以，它能够支持大量数据存储/查询。根据官方介绍 <ZLink link="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria"/>，`IndexedDB` 最多能存硬盘的 50%，每个组（简单理解为一个站点）能存最少 10MB 最多 2GB！简直不要太开心~

不过考虑到上手难度极高，一般都会使用第三方库 <ZLink link="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#see_also"/> 来操作 `IndexedDB`。

## Web SQL

注意，Web SQL 并不是 `HTML 5` 标准，目前仅支持 Chromium 系的浏览器 <ZLink link="https://caniuse.com/sql-storage"/>。虽然以前 [W3C 提案](https://www.w3.org/TR/webdatabase/) 过，但早就舍弃了。所以，不用看了！

~~使用方法也炒鸡简单，仅三个基础 API：opendatabase、transaction、executeSql。~~

## storageHelper

```ts
import { Utility } from './utility';
import * as objectHash from 'object-hash';
import { ENGAGEMENT } from './constants';

/** reference of the storage */
const STORAGE: Storage = window.sessionStorage;
// const STORAGE:Storage = window.localStorage;

/** key prefix for cache, distinguish from other apps */
const STORAGE_KEY_PREFIX = 'myStorage:key:'

/** generate storage key */
const genStorageKey = (...params) => {
    return STORAGE_KEY_PREFIX + objectHash.MD5(params.join('\n'));
};

/**
 * try fetch response data from storage
 * @param keyFactors factors used for generating key (position matter)
 */
export const getStorage = (...keyFactors: string[]) => {
    if (!Utility.isNotEmptyArray(keyFactors))
        return null;
    const key = genStorageKey(keyFactors);
    const value = STORAGE.getItem(key);
    return Utility.isNotEmptyString(value) ? JSON.parse(value) : null;
    // if (Utility.isNotEmptyString(value)) {
    //     try {
    //         return JSON.parse(value);
    //     } catch (e) {
    //         return value;
    //     }
    // }
};

/**
 * try save response data into storage
 * @param value value to be cached
 * @param keyFactors factors used for generating key (position matter)
 */
export const setStorage = (value: any, ...keyFactors: string[]) => {
    if (value && Utility.isNotEmptyArray(keyFactors)) {
        const key = genStorageKey(keyFactors);
        try {
            STORAGE.setItem(key, JSON.stringify(value));
        } catch (e) {
            // may exceed the quota
            console.warn('exceeded the quota of Storage');
        }
    }
};
/** clear local cache */
export const clearStorage = () => {
    const keys = Object.keys(STORAGE);
    if (Utility.isNotEmptyArray(keys)) {
        keys.forEach(_ => {
            if (_.startsWith(STORAGE_KEY_PREFIX))
                STORAGE.removeItem(_);
        });
    }
};

```

备注：

1. 因为限额，在计算缓存主键的时候，我使用了 `MD5` 信息摘要算法以缩小键的长度。可能会有些哈希碰撞问题，可考虑替换成 `SHA1` 或者其他更高级的算法（如果性能不是关注点的话）。
2. 有时候我们的页面可能会和其他页面共存，甚至是我们的页面内嵌在其他页面中。如果这时候需要清空缓存，简单粗暴的直接调用 `Storage.clear` 方法，可能会导致其他页面报错/不正常工作。为避免此类事情发生，在计算缓存主键的时候，我额外添加了固定前缀。这样的话，如果真要清空缓存，挑出属于自己程序的缓存再手动删除。
3. 因为会有 5MB 的限额，程序很容易会超过这个限制，所以程序设计时一定要考虑这种情况，比如使用 `LRU` 这样的过期策略。我这里简单起见，直接忽略了 😄。

## 参考链接

- [Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [What is WEB SQL?](https://www.geeksforgeeks.org/what-is-web-sql/)
