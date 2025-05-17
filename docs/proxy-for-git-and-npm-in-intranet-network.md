---
title: 企业网络下设置 git、npm 等代理
date: 2020-07-01 10:44:19
tags: [proxy, git, npm, intranet, corpnet]
---

在某些公司内，应 IT 安全政策要求，可能需要设置代理才能访问互联网。相应地，一些工具/软件也需要设置代理才能正常运行。

## 设置当前用户网络代理 

``` shell
set http_proxy=http://[username:password@]proxyserver:port
set https_proxy=https://[username:password@]proxyserver:port
```

## 设置 Git 代理：

``` shell
git config --global http.proxy http://xxx.xxx.xxx.xxx:80
```

## 移除 Git 代理：

``` shell
git config --global --unset http.proxy
```

## 设置 npm 代理

``` shell
npm config set proxy http://xxx.xxx.xxx.xxx:8080
npm config set https-proxy http://xxx.xxx.xxx.xxx:8080
```

## 移除 npm 代理

``` shell
npm config rm proxy
npm config rm https-proxy
```

更多常用代理命令，请移步各搜索引擎或 [Stackoverflow](https://stackoverflow.com)。

## 参考链接

- [How to Use pip behind a Proxy](http://leifengblog.net/blog/how-to-use-pip-behind-a-proxy/)
- [How to change Windows proxy settings using cmd/command prompt/registry/.cmd/.bat (and apply the settings instantly/immediately without reboot)](https://dannyda.com/2019/12/13/how-to-change-windows-proxy-settings-using-cmd-command-prompt-registry-cmd-bat)
