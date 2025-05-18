---
title: Node.js 子进程
tags:
  - node.js
  - multitasking
date: 2021-12-30 14:10:42
---

很久之前，我写过[几个爬虫程序](/crawling-web-via-Nightmare-js)（个人学习用途！！！）。之前为了避免被反爬程序识别，特地一个一个串行执行，还降低爬取速度。但是多个目标站点就没必要自己给自己设限了。

我的设想（需求）是：拿到一个 search term，我会把它分发给多个搜索引擎的爬虫程序（比如百度、谷歌、必应）同时搜。

说干就干。

```js
const fs = require("fs");
const path = require("path");
const spawnProcess = require("child_process");
const { exit } = require("process");

const { REQUEST_DELAY } = require("./constants");

const jobsFolder = "./jobs";

/** send the search job to sogouCrawler */
const invokeSogouCrawler = searchTerm => {
  return new Promise((resolve, reject) => {
    console.log("start crawling sogou news for " + searchTerm);
    setTimeout(() => {
      const p = spawnProcess.spawn("node", [
        "./crawlers/sogouCrawler.js",
        searchTerm
      ]);
      p.on("close", function(spawnCode) {
        console.log("complete crawling sogou news for " + searchTerm);
        resolve(spawnCode);
      });
      setTimeout(resolve, 1048576); // bugfix: the program just stock there
    }, REQUEST_DELAY);
  });
};

/** send the search job to toutiaoCrawler */
const invokeToutiaoCrawler = searchTerm => {
  return new Promise((resolve, reject) => {
    console.log("start crawling toutiao news for " + searchTerm);
    setTimeout(() => {
      const p = spawnProcess.spawn("node", [
        "./crawlers/toutiaoCrawler.js",
        searchTerm
      ]);
      p.on("close", function(spawnCode) {
        console.log("complete crawling toutiao news for " + searchTerm);
        resolve(spawnCode);
      });
      setTimeout(resolve, 1048576); // bugfix: the program just stock there
    }, REQUEST_DELAY);
  });
};

// get job list
fs.readdir(jobsFolder, (err, files) => {
  if (err) {
    console.error(err);
    exit();
  }
  if (files == null || files.length === 0) {
    console.warn("no job file was found!");
    exit();
  }
  // get the lastest job file
  let theLatestFile = path.join(jobsFolder, files[0]);
  let theLatestMTime = new Date();
  for (let file of files) {
    const filePath = path.join(jobsFolder, file);
    const fileMTime = fs.statSync(filePath).mtime;
    if (theLatestFile === filePath) {
      theLatestMTime = fileMTime;
      continue;
    }
    if (fileMTime > theLatestMTime) {
      theLatestFile = filePath;
      theLatestMTime = fileMTime;
    }
  }
  // read content from the latest job file
  fs.readFile(theLatestFile, "utf8", (err, content) => {
    if (err) {
      console.error(err);
      exit();
    }
    if (content && content.length) {
      const rows = content
        .split("\n")
        .filter(_ => _ && _.length)
        .map(_ => _.trim());
      const tprs = Array.from(
        new Set(
          rows
            .map(_ => _.split("\t"))
            .reduce((prev, curr) => {
              return prev.concat(curr);
            }, [])
            .filter(_ => _.length >= 5)
        )
      );
      if (tprs.length) {
        console.log(tprs);
        const allDoneSignal = "Winner, Winner, Chicken Dinner~";
        /** invoke sogou crawler one by one */
        const nextSogouCrawlItem = (idx_sogou = 0) => {
          if (idx_sogou === tprs.length) {
            return Promise.resolve(allDoneSignal);
          }
          const p = invokeSogouCrawler(tprs[idx_sogou]);
          return p.then(() => {
            idx_sogou++;
            return nextSogouCrawlItem(idx_sogou);
          });
        };
        /** invoke toutiao crawler one by one */
        const nextToutiaoCrawlItem = (idx_toutiao = 0) => {
          if (idx_toutiao === tprs.length) {
            return Promise.resolve(allDoneSignal);
          }
          const p = invokeToutiaoCrawler(tprs[idx_toutiao]);
          return p.then(() => {
            idx_toutiao++;
            return nextToutiaoCrawlItem(idx_toutiao);
          });
        };
        let p_sogou = nextSogouCrawlItem();
        let p_toutiao = nextToutiaoCrawlItem();
        // let p_toutiao = Promise.resolve(allDoneSignal);  // disable temporary
        Promise.all([p_sogou, p_toutiao]).then(exitCode => {
          // exit code should always be equals to allDoneSignal
          console.log(exitCode);
          exit();
        });
      }
    } else {
      console.warn("empty job file: ", theLatestFile);
      exit();
    }
  });
});
```


## 参考链接

- [Node.js documentation](https://nodejs.org/api/child_process.html)
- [Node.js Child Process](https://www.educba.com/node-js-child-process/)
