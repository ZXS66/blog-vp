---
title: '微信、微博、QQ一键分享'
date: 2020-07-15 23:31:43
tags: [javaScript, hexo]
---

Hexo 默认的主题 Landscape，默认支持分享到 Twitter、Facebook、Pinterest、Linkedin 等国外社交媒体。但是，众所周知，这些社交媒体，在镇上都被🈲了！！

所以，这篇文章介绍如何将 Hexo 主题本地化，以支持微博、微信、QQ 及邮件分享。

## 替换文章分享生成脚本

大概位置从第 60 行开始，替换原来的 Twitter、Facebook、Pinterest、Linkedin 模板，用以下代码：

文件：`themes\landscape\source\js\script.jsthemes\landscape\source\js\script.js`

``` js
  // Share
  $("body")
    .on("click", function() {
      $(".article-share-box.on").removeClass("on");
    })
    .on("click", ".article-share-link", function(e) {
      e.stopPropagation();

      var $this = $(this),
        url = $this.attr("data-url"),
        title = "👍 //" + $this.attr("data-title"),
        encodedUrl = encodeURIComponent(url),
        encodedTitle = encodeURIComponent(title),
        id = "article-share-box-" + $this.attr("data-id"),
        offset = $this.offset();

      if ($("#" + id).length) {
        var box = $("#" + id);
        if (box.hasClass("on")) {
          box.removeClass("on");
          return;
        }
      } else {
        var html = [
          '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '" readonly>',
          '<div class="article-share-links">',
          // 微博分享
          '<a href="http://service.weibo.com/share/share.php?title=' +
            encodedTitle +
            "&url=" +
            encodedUrl +
            '" class="article-share-weibo" target="_blank" title="微博分享"></a>',
          // 微信二维码分享
          '<a href="https://zixuephp.net/inc/qrcode_img.php?url=' +
            encodedUrl +
            '" class="article-share-wechat" target="_blank" title="微信分享"></a>',
          // QQ 好友分享
          '<a href="https://connect.qq.com/widget/shareqq/index.html?url=' +
            encodedUrl +
            "&sharesource=qzone&title=" +
            encodedTitle +
            '" class="article-share-qq" target="_blank" title="分享给QQ好友"></a>',
          // 邮件分享
          '<a href="mailto:your@mail.com?subject=' +
            encodedTitle +
            "&body=" +
            encodedUrl +
            '" class="article-share-mail" target="_blank" title="邮件分享"></a>',
          "</div>",
          "</div>"
        ].join("");

        var box = $(html);
        $("body").append(box);
      }

      $(".article-share-box.on").hide();

      box
        .css({
          top: offset.top + 25,
          left: offset.left
        })
        .addClass("on");
    })
    /// more click events here
```

## 更改配置 

（此步骤可省略，可用于 Contact 页面）

大概从第 30 行开始，增加 `weibo`、`wechat`、`qq`、`mail` 配置项

文件：`_config.yml`

```yml
# Miscellaneous
weibo: your weibo name
wechat: your wechat name
qq: your QQ
mail: your email
```

## 更改文章模板文件 

大概从第 26 行开始，增加 `data-title` 属性绑定

文件：`themes\landscape\layout\_partial\article.ejs`

```ejs
    <footer class="article-footer">
      <a data-url="<%- post.permalink %>" data-id="<%= post._id %>" data-title="<%= post.title %>" class="article-share-link"><%= __('share') %></a>
      <% if (post.comments && config.disqus_shortname){ %>
      <a href="<%- post.permalink %>#disqus_thread" class="article-comment-link"><%= __('comment') %></a>
      <% } %>
      <%- partial('post/tag') %>
    </footer>
```

## 配置文章分享样式 

大概从第 273 行开始，添加一下样式

文件：`themes\landscape\layout\_partial\article.styl`

```styl
.article-share-weibo
  @extend $article-share-link
  &:before
    content: "\f18a"
  &:hover
    background: color-weibo
    text-shadow: 0 1px darken(color-weibo, 20%)

.article-share-qq
  @extend $article-share-link
  &:before
    content: "\f1d6"
  &:hover
    background: color-qq
    text-shadow: 0 1px darken(color-qq, 20%)

.article-share-wechat
  @extend $article-share-link
  &:before
    content: "\f1d7"
  &:hover
    background: color-wechat
    text-shadow: 0 1px darken(color-wechat, 20%)
    
.article-share-mail
  @extend $article-share-link
  &:before
    content: "\f003"
  &:hover
    background: color-mail
    text-shadow: 0 1px darken(color-mail, 20%)
```

## 更改变量 

大概从第 5 行开始

文件：`themes\landscape\source\css\_variables.styl`

``` styl
// Colors
color-default = #555
color-grey = #999
color-border = #ddd
color-link = #258fb8
color-background = #eee
color-sidebar-text = #777
color-widget-background = #ddd
color-widget-border = #ccc
color-footer-background = #262a30
color-mobile-nav-background = #191919
color-weibo = #ff8140
color-wechat = #1aad19
color-qq = #00aced
color-mail = #a2e65b
```

## 升级 iconfont 版本

Hexo 默认使用 [fontawesome](http://www.fontawesome.com.cn/) 作为 iconfont，如果您的 fontawesome 版本过低，请升级到至少 4.1，因为 [qq](http://www.fontawesome.com.cn/icons/qq/) 和 [wechat](http://www.fontawesome.com.cn/icons/wechat/) 图标是从 4.1 开始才收录的。我的升级方法，简单粗暴，就是下载最新的 iconfont，替换 `themes\landscape\source\css\fonts` 下的相关字体文件。

## 参考链接

- [一键分享到QQ空间、QQ好友、新浪微博、微信代码](https://zixuephp.net/article-309.html)
- [hexojs/hexo-theme-landscape](https://github.com/hexojs/hexo-theme-landscape)
