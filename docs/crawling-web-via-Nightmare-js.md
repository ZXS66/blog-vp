---
title: 使用 Nightmare.js 爬取页面
tags:
  - crawler
  - spider
  - nightmare.js
date: 2021-07-24 17:31:01
---

## 背景

此前我已有一个 [scrapy](https://docs.scrapy.org/en/latest/index.html) 爬虫项目，一切看起来都挺美好的。能爬到动态加载的数据，用 [scrapyd](https://scrapyd.readthedocs.io/en/stable/) 管理爬虫任务，还自己写了一个创建爬虫任务的小工具。但是，写爬虫就是这样，即使矛多锐利，盾也不会差，不会出现其中某一个特别强另一个特别弱的情形。二者处在一个动态平衡的局面，可能现在是矛更厉害，过段时间盾一定会打回来的（反爬虫进化）；也可能现在是盾厉害更胜一筹，但过不了多久一定会有大神破解出来（变态如 12306 都能被破解）。所以，不要追求完美和一劳永逸，保持乐观和持续学习的心态就好了！ 😄

先说问题吧：

1. `python` 写的。虽然也是脚本语言，调整起来很快，但是和 `nodejs` 比起来，还是有差别的，毕竟后者用的是和页面一样的编程语言。解析页面数据、注入脚本、模拟用户行为等等，后者肯定是优于前者。
2. `scrapy` 欠缺用户交互 API，如滚屏、模拟点击等等。我才疏学浅，没找到，但是有用户交互行为的爬虫，能够很大程度上减少被反爬虫🈲的可能性。
3. `scrapy` 调试时缺少浏览器窗口，无法快速编写爬虫程序。

看完这几个问题，大家应该清楚了，使用 `nodejs` 来写爬虫要优于 `python`。（当然，这仅仅是个人观点，不喜勿喷）

所以，今天的主角登场了：

[Nightmare JS](https://github.com/segmentio/nightmare)

为什么是它呢，而不是前端自动测试使用更广泛的 [Selenium](https://www.selenium.dev/)、[PhantomJS]() 或者 [Electron](http://electron.atom.io/)？emmm，因为用过。🙂

## 范例

**声明：以下代码仅供学习使用，如果您坚持要用在产品环境或者商用，概不负责！！！**

搜狗搜索（片段）：

``` js
const Nightmare = require("nightmare");
const {
  IS_PROD,
  NIGHTMARE_TYPE_INTERVAL,
  NIGHTMARE_USER_AGENT,
  NIGHTMARE_VIEWPORT,
  NIGHTMARE_GOTOTIMEOUT,
  NIGHTMARE_LOADTIMEOUT,
  PROXY_SERVER_HOST,
  PROXY_SERVER_PORT,
  PROXY_USER_NAME,
  proxy_user_PASSWORD,
  SOGOU_NEWS_HOST,
} = require("../constants");
const {
  isNotEmptyString,
  get3rdPartyShortName,
  persistAdverseMedias
} = require("../utility");

/** name of the third party */
let thirdPartyName = process.argv[2]; //get third party name from command line

if (!isNotEmptyString(thirdPartyName)) {
  process.exit(404); // third party name is mandatory
}

/// if the third party name contains empty string ' ',
/// the full name might be cutted into multiple fragments
let argvIdx = 3;
while (isNotEmptyString(process.argv[argvIdx])) {
  thirdPartyName += " " + process.argv[argvIdx];
  argvIdx++;
}

/** short name of the third party */
const thirdPartyName_short = get3rdPartyShortName(thirdPartyName);

const nm = Nightmare({
  //   switches: {
  //     "proxy-server": PROXY_SERVER_HOST + ":" + PROXY_SERVER_PORT
  //   },
  //   openDevTools: {
  //     mode: "detach"
  //   },
  show: !IS_PROD,
  typeInterval: NIGHTMARE_TYPE_INTERVAL,
  width: NIGHTMARE_VIEWPORT.width,
  height: NIGHTMARE_VIEWPORT.height,
  gotoTimeout: NIGHTMARE_GOTOTIMEOUT,
  loadTimeout: NIGHTMARE_LOADTIMEOUT
});

const searchTerm = '"' + thirdPartyName_short + '"';

/** extract adverse media */
const extractResults = (
  /** response data */
  resp,
  /** third party name */
  vendor,
  /** third party short name */
  vendor_short,
  /** search term for the site */
  EY_Search_Term
) => {
  const smartHint = document.getElementById("smart_hint_container");
  if (smartHint) {
    const smartHintText = smartHint.innerText.trim();
    if (
      smartHintText.startsWith("抱歉，没有找到与") &&
      smartHintText.includes("相关的网页。")
    ) {
      // can't find any adverse media with such search term.
      resp.hasNextPage = false;
      return resp;
    }
  }
  resp.data = resp.data || [];
  if (resp.data.length > 256) {
    // over 256 records were found, no need to seek more pages
    resp.hasNextPage = false;
    return resp;
  }
  console.log("before extracting:", resp.data.length);
  const items = document.querySelectorAll("#main .results .vrwrap");
  if (items && items.length) {
    console.log(items.length + " records were found...");
    for (let i = 0; i < items.length; i++) {
      const _ = items[i];
      const myurl = document.location.href;
      const List_date = new Date().toISOString().substr(0, 10);
      const obj = {
        vendor,
        vendor_short,
        List_date,
        EY_Search_Term,
        myurl,
        title: _.querySelector(".vr-title").innerText,
        href:
          document.location.origin +
          _.querySelector(".vr-title a").getAttribute("href"),
        summary: _.querySelector(".star-wiki").innerText,
        newsSite: _.querySelector(".news-from span").innerText,
        newsDate: _.querySelector(".news-from span:last-child").innerText,
        newsTime: "" // N/A
      };
      console.log("push item: ", JSON.stringify(obj));
      resp.data.push(obj);
    }
  }
  console.log("after extracting:", resp.data.length);
  // scroll down to the paginator
  document.getElementById("pagebar_container") &&
    document
      .getElementById("pagebar_container")
      .scrollIntoView({ behavior: "smooth", block: "end" });
  resp.hasNextPage = !!document.getElementById("sogou_next");
  return resp;
};
/** fetch adverse media of next page  */
const crawlNexPage = nm => {
  return resp => {
    debugger;
    // pagination
    if (resp.hasNextPage) {
      console.log("crawling next page...");
      return nm
        .click("#sogou_next")
        .wait(2048)
        .wait("#main")
        .evaluate(
          extractResults,
          resp,
          thirdPartyName,
          thirdPartyName_short,
          searchTerm
        )
        .then(crawlNexPage(nm, resp));
    }
    return resp;
  };
};

console.log("start crawling adverse media for " + searchTerm);
// main processing logic code
nm.useragent(NIGHTMARE_USER_AGENT)
  //.authentication(PROXY_USER_NAME, proxy_user_PASSWORD)
  .goto(SOGOU_NEWS_HOST)
  .wait(4096)
  .type("#query", searchTerm)
  .click("#searchBtn")
  .wait(2048)
  .wait("#main")
  .evaluate(
    extractResults,
    { data: [], hasNextPage: true },
    thirdPartyName,
    thirdPartyName_short,
    searchTerm
  )
  .then(crawlNexPage(nm))
  .then(response => {
    // persistent
    console.log("persistent, amount: ", response.data.length);
    return persistAdverseMedias(response.data);
  })
  .finally(_ => {
    console.log("Done, exiting...");
    process.exit(0);
  });
```

头条新闻搜索（片段）：

``` js
const Nightmare = require("nightmare");
const {
  IS_PROD,
  NIGHTMARE_TYPE_INTERVAL,
  NIGHTMARE_USER_AGENT,
  NIGHTMARE_VIEWPORT,
  NIGHTMARE_GOTOTIMEOUT,
  NIGHTMARE_LOADTIMEOUT
} = require("../constants");
const {
  isNotEmptyString,
  get3rdPartyShortName,
  persistAdverseMedias
} = require("../utility");

/** name of the third party */
let thirdPartyName = process.argv[2]; //get third party name from command line

if (!isNotEmptyString(thirdPartyName)) {
  process.exit(404); // third party name is mandatory
}

/// if the third party name contains empty string ' ',
/// the full name might be cutted into multiple fragments
let argvIdx = 3;
while (isNotEmptyString(process.argv[argvIdx])) {
  thirdPartyName += " " + process.argv[argvIdx];
  argvIdx++;
}

/** short name of the third party */
const thirdPartyName_short = get3rdPartyShortName(thirdPartyName);

const nm = Nightmare({
  //   switches: {
  //     "proxy-server": PROXY_SERVER_HOST + ":" + PROXY_SERVER_PORT
  //   },
  //   openDevTools: {
  //     mode: "detach"
  //   },
  show: !IS_PROD,
  typeInterval: NIGHTMARE_TYPE_INTERVAL,
  width: NIGHTMARE_VIEWPORT.width,
  height: NIGHTMARE_VIEWPORT.height,
  gotoTimeout: NIGHTMARE_GOTOTIMEOUT,
  loadTimeout: NIGHTMARE_LOADTIMEOUT
});

// const searchTerm = '"' + thirdPartyName_short + '"';
const searchTerm = thirdPartyName;
/** 头条搜索·资讯频道 home page */
const homePage =
  "https://so.toutiao.com/search?keyword=baidu.com&pd=information&source=input&dvpf=pc&aid=4916&page_num=0";

/** extract adverse media from HTTP response */
const extractResults = (
  /** response data */
  resp,
  /** third party name */
  vendor,
  /** third party short name */
  vendor_short,
  /** search term for the site */
  EY_Search_Term
) => {
  console.log("extracting…");
  resp.data = resp.data || [];
  if (resp.data.length > 256) {
    // over 256 records were found, no need to seek next page
    resp.hasNextPage = false;
    return resp;
  }
  console.log("before extracting:", resp.data.length);
  const items = document.querySelectorAll(".main .result-content[data-i]");
  if (items && items.length) {
    console.log(items.length + " records were found...");
    for (let i = 0; i < items.length; i++) {
      const _ = items[i];
      const myurl = document.location.href;
      const List_date = new Date().toISOString().substr(0, 10);
      //   debugger;
      const link = _.querySelector("a");
      const summary = _.querySelector(".text-underline-hover");
      const newsSite = _.querySelector(".cs-source-content span");
      const newsDate = _.querySelector(".cs-source-content>span:last-child");
      const obj = {
        vendor,
        vendor_short,
        List_date,
        EY_Search_Term,
        myurl,
        title: link ? link.innerText : "",
        href: link ? document.location.origin + link.getAttribute("href") : '',
        summary: summary ? summary.innerText : "",
        newsSite: newsSite ? newsSite.innerText : "",
        newsDate: newsDate ? newsDate.innerText : "",
        newsTime: "" // N/A
      };
      console.log("push item: ", JSON.stringify(obj));
      resp.data.push(obj);
    }
  }
  console.log("after extracting:", resp.data.length);
  // scroll down to the paginator
  const paginator = document.querySelector(".cs-pagination");
  if (paginator) paginator.scrollIntoView({ behavior: "smooth", block: "end" });
  resp.hasNextPage =
    paginator &&
    paginator.querySelector("a:last-child") &&
    paginator.querySelector("a:last-child").classList.contains("cs-button-mb");
  return resp;
};
/** fetch adverse media of next page  */
const crawlNexPage = nm => {
  return resp => {
    console.log("crawling next page…");
    // pagination
    if (resp.hasNextPage) {
      console.log("crawling next page...");
      return nm
        .click(".cs-pagination a:last-child")
        .wait(2048)
        .wait(".main .s-result-list")
        .evaluate(
          extractResults,
          resp,
          thirdPartyName,
          thirdPartyName_short,
          searchTerm
        )
        .then(crawlNexPage(nm, resp));
    }
    return resp;
  };
};

console.log("start crawling adverse media for " + searchTerm);
// main processing logic code
nm.useragent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0"
) // .useragent(NIGHTMARE_USER_AGENT)
  //.authentication(PROXY_USER_NAME, proxy_user_PASSWORD)
  .goto(homePage)
  .wait(4096)
  .wait('input[type="search"]')
  .type('input[type="search"]', "") // clear first
  .type('input[type="search"]', searchTerm)
  //   .type('input[type="search"]', "\u000d")// press the enter key
  .click(".search_1sPyO_")
  .wait(4096)
  .wait(".main .s-result-list")
  .evaluate(
    extractResults,
    { data: [], hasNextPage: true },
    thirdPartyName,
    thirdPartyName_short,
    searchTerm
  )
  .then(crawlNexPage(nm))
  .then(response => {
    // persistent
    console.log(
      "trying persistent adverse medias, amount: ",
      response.data.length
    );
    return persistAdverseMedias(response.data);
  })
  .catch(err => {
    console.error(err);
    console.log(JSON.stringify(err));
  })
  .finally(_ => {
    console.log("Done, exiting...");
    process.exit(0);
  });
```

## 最佳实践

1. [evaluate](https://github.com/segmentio/nightmare/blob/HEAD/Readme.md#evaluatefn-arg1-arg2) 其实是把方法体注入到页面里，所以，假如你的 `evaluate` 方法体引用了外部变量，那肯定是不行的。解决办法也很简单，使用立即执行函数(IIFE，Immediately invoked function expression)传入外部变量即可。
2. [evaluate](https://github.com/segmentio/nightmare/blob/HEAD/Readme.md#evaluatefn-arg1-arg2) 记得 `catch`，否则很容易中断执行。
3. 记得设置 [loadTimeout](https://github.com/segmentio/nightmare#loadtimeout-default-infinite)，因为默认是 `infinite`！如果某些网站（你懂的）一直不报错，也不返回结果，或者返回结果超级慢，那你的这个爬虫程序就卡在这里了。
4. 翻页的话，使用之前的 `nightmare` 实例就行。

## 参考链接

- [Nightmare JS](https://github.com/segmentio/nightmare)
