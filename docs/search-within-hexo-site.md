---
title: Hexo 站点支持搜索
tags:
  - hexo
  - 搜索
date: 2020-12-16 23:22:37
---

### 背景

Hexo 默认的模板 landscape 对搜索的支持并不友好（也许是我没有领会到精髓😟），一般人选择先做好 SEO，然后把站内搜索直接转发给本地搜索引擎（如Google、百度等）。

本网站严格意义上来讲，并不算是个博客，只是本人随手瞎记录一下平时遇到的问题以及感想，所以，完全没心思去做 SEO 优化，仅作为个人备忘录在用。但是偶尔会遇到自己有印象写过xx知识点，但是又不记得具体在哪里的时候。这时，就需要搜索了。

出发点交代完毕，正文开启：

### 实现思路

实现思路很简单：

##### 安装 `hexo-generator-search`

详细请参考 [hexo-generator-search](https://github.com/wzpan/hexo-generator-search)

``` sh
npm install hexo-generator-search --save
```

##### 配置 `hexo-generator-search`

一般情况下，同样内容的数据，json 文件要比 xml 小，所以，此处我选择 `search.json` 文件。

##### 修改 landscape 模板的页面生成脚本，

打开 `header.ejs` 文件中，找到搜索相关代码，作相应修改。

我的 `header.ejs` 相关代码如下：

```ejs
      <div id="search-form-wrap">
        <%- search_form_cn({button: '&#xF002;'}) %>
        <% if (config.search){ %>
        <input type="hidden" id="search-index-file" value="<%=config.root+config.search.path%>" />
        <div id="search-form-datalist">
        </div>
        <% } %>
      </div>
      <nav id="sub-nav">
        <% if (theme.rss){ %>
        <a id="nav-rss-link" class="nav-icon" href="<%- url_for(theme.rss) %>" title="<%= __('rss_feed') %>"></a>
        <% } %>
        <a id="nav-search-btn" class="nav-icon" title="<%= __('search') %>"></a>
      </nav>
```

##### 修改 `script.js` 脚本

更新逻辑有如下：

1. 初始化 web worker，用于搜索实现（TODO:搜索排序）；
2. 加载 `search.json` 索引文件；
3. 监听搜索关键词输入框按键事件（如 `keyup`、`blur`等），当用户输入变更时，搜索索引文件；并根据返回结果渲染页面；
4. 响应键盘 ↑ ↓ 箭头按钮事件，高亮用户想要查看的内容；响应键盘确定按钮事件，跳转到对应的内容；
5. 调整 UI，完善 UX。

`script.js` 部分源码如下：

```js
    // Search
    const $searchWrap = document.getElementById("search-form-wrap");
    let isSearchAnim = false;
    const searchAnimDuration = 200;
    const startSearchAnim = () => (isSearchAnim = true);
    const stopSearchAnim = callback =>
      setTimeout(() => {
        isSearchAnim = false;
        callback && callback();
      }, searchAnimDuration);
    const showSearchForm = () => {
      if (isSearchAnim) return;
      startSearchAnim();
      $searchWrap.classList.add("on");
      stopSearchAnim(() =>
        document.querySelector(".search-form-input").focus()
      );
    };
    document
      .getElementById("nav-search-btn")
      .addEventListener("click", showSearchForm);
    const $searchInput = document.querySelector(".search-form-input");
    const $searchDataList = document.getElementById("search-form-datalist");
    let search_ww;
    $searchInput.addEventListener("keyup", evt => {
      const options = Array.from($searchDataList.children);
      let activeOptIdx = -1;
      options.some((_, i) => {
        if (_.classList.contains("active")) {
          activeOptIdx = i;
        }
      });
      const keyCode = evt.key;
      if (keyCode === "Enter") {
        // enter button was pressed
        // redirect to the highlight matched post
        const theOpt = $searchDataList.querySelector(".active");
        if (theOpt) {
          window.location.pathname = theOpt.dataset.url;
        }
      } else if (keyCode === "ArrowUp" || keyCode === "ArrowDown") {
        if (!(options && options.length && activeOptIdx !== -1)) {
          return; // no matched posts found
        }
        if (keyCode === "ArrowUp") {
          // up arrow button was pressed
          activeOptIdx--;
          if (activeOptIdx < 0) {
            activeOptIdx = options.length - 1;
          }
        } else {
          // down arrow button was pressed
          activeOptIdx = (activeOptIdx + 1) % options.length;
        }
        // highlight selected post by set class 'active'
        options.forEach((_, i) => {
          if (activeOptIdx === i) {
            _.classList.add("active");
          } else {
            _.classList.remove("active");
          }
        });
        $searchDataList.scrollTo({
          top: options[activeOptIdx].offsetTop,
          left: 0,
          behavior: "smooth"
        });
      } else {
        // user is typing search term
        // TODO: debounce
        search_ww.postMessage({ action: "SEARCH", data: $searchInput.value });
      }
    });
    $searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        startSearchAnim();
        $searchWrap.classList.remove("on");
        stopSearchAnim();
      }, 128);
    });
    if (window.Worker) {
      search_ww = new Worker("/js/search_ww.js");
      search_ww.onmessage = e => {
        // search result returned
        const matchedPosts = e.data;
        $searchDataList.innerHTML = "";
        // render datalist with matched posts
        if (matchedPosts && matchedPosts.length) {
          matchedPosts.forEach((_, i) => {
            const $opt = document.createElement("p");
            $opt.dataset.url = _.url;
            const $h = document.createElement("h5");
            $h.innerHTML = `<a href="${_.url}">${_.title}</a>`;
            $opt.appendChild($h);
            const $body = document.createElement("div");
            $body.innerText = _.content
              .trim()
              .replace(/\n/ig, " ")
              .substring(0, 256);
            $opt.appendChild($body);
            $searchDataList.appendChild($opt);
            // highlight the first matched post by default
            if (i === 0) {
              $opt.classList.add("active");
            }
          });
        } else {
          $searchDataList.innerHTML =
            "<p>NO post(s) that matched with your input can be found, please try other keywords.</p>";
        }
      };
      setTimeout(() => {
        // initial search web work with delay
        if (document.getElementById("search-index-file")) {
          const indexFilePath = document.getElementById("search-index-file")
            .value;
          search_ww.postMessage({ action: "INIT", data: indexFilePath });
        }
        // shortcut for showing search form
        document.body.addEventListener("keyup", evt => {
          if (["E", "e"].includes(evt.key)) {
            showSearchForm();
          }
        });
      }, 1024);
    }
```

`search-ww.js` 源码如下：

```js
///// web worker for searching post
let searchStore = [];
/** event listener for the web worker */
onmessage = async e => {
  let { action, data } = e.data;
  if (typeof action === "string" && action.length) {
    action = action.toUpperCase().trim();
    switch (action) {
      case "INIT":
        // initialization
        // fetch posts' indexing file
        const response = await fetch(data);
        const content = await response.json();
        searchStore = content || [];
        break;
      case "SEARCH":
      case "QUERY":
      default:
        // perform search with user input keyword
        let value = (data || "").toLowerCase();
        if (value.length === 0) {
          return;
        }
        // TODO: implement advanced search algorithm
        // reference: https://stackoverflow.com/questions/5859561/getting-the-closest-string-match
        const matchedPosts = searchStore
          .filter(
            _ =>
              _.title.toLowerCase().includes(value) ||
              _.content.toLowerCase().includes(value)
          )
          .slice(0, 10);
        postMessage(matchedPosts);
        break;
    }
  } else {
    console.log("please specify action when invoking search web worker!");
  }
};
```

具体可查看本博客源码（按 `F12` 快捷键即可）。
