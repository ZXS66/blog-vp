---
title: Flutter 入门
date: 2020-07-18 15:10:21
tags: [flutter, get started]
---

## 为什么要学 Flutter？

- 提升技能。移动端 skillset √ ，全栈开发 √
- Flutter 是趋势。“*Google 出品，必是精品！*”
- React Native 不感冒

## 网站

- [Flutter](https://flutter.dev/) *【Flutter 官网】*
- [Flutter 中文社区](https://flutter.cn/) *【Flutter 官网（中文）】*
- [Dart 开发语言概览](https://dart.cn/guides/language/language-tour) *【1小时入门 Dart】*
- [Flutter Codelabs](https://codelabs.flutter-io.cn/) *【更多入门案例】*
- [重磅|庖丁解牛之——Flutter for Web · 语雀](https://www.yuque.com/xytech/flutter/aqsvov) *【咸鱼出品】*

## 安装 

因为本来就打算尝试 Flutter for Web，而此功能目前还处于 beta 分支，所以下载 `xxxx-stable.zip` 安装包基本没用，最终还是需要切换分支，重新更新。所以，以下是我的安装方法：

##### 1. 从 GitHub 上下载最新 beta 分支 (git clone)

``` shell
git clone https://github.com/flutter/flutter.git -b beta
```

##### 2. 更新环境变量 [<fa-link/>](https://flutter.cn/docs/get-started/install/windows)

将 `flutter\bin` 添加至环境变量 `PATH`。Linux 和 Mac 用户命令行搞定：

``` shell
export PATH="$PWD/flutter/bin:$PATH"
```

Windows 用户可以选择鼠标点点，更改环境变量 （我的电脑->属性->高级系统设置->环境变量->用户变量）

##### 3. 配置 flutter 使用镜像站点 [<fa-link/>](https://flutter.cn/docs/get-started/install/windows)

Flutter 官方站点 (https://flutter.dev) 是在境外，被小镇禁止访问了，所以，此步骤是小镇用户需要做的额外操作。

类似于第二步，不同的是，这一步更改的是 `PUB_HOSTED_URL` 和 `FLUTTER_STORAGE_BASE_URL`

``` shell
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

当然，Flutter 镜像站点，除了 Flutter 中文社区 `flutter-io.cn` 这一个，还有另外两个，如果觉得这个主站点慢，可以随时切换：

- 上海交通大学软件源镜像服务

``` shell
export FLUTTER_STORAGE_BASE_URL: https://mirrors.sjtug.sjtu.edu.cn/
export PUB_HOSTED_URL: https://dart-pub.mirrors.sjtug.sjtu.edu.cn/
```

- 清华大学开源软件镜像站

``` shell
export FLUTTER_STORAGE_BASE_URL: https://mirrors.tuna.tsinghua.edu.cn/flutter
export PUB_HOSTED_URL: https://mirrors.tuna.tsinghua.edu.cn/dart-pub
```

##### 4. 初始化 [<fa-link/>](https://flutter.cn/docs/get-started/web)

``` shell
flutter channel beta
flutter upgrade
flutter config --enable-web
```
*备注：初始化过程中，可能会遇到下载失败问题，这时候可以参照第三步骤，切换镜像站点，并检查您此时的网络链接是否可以访问到镜像站点*

##### 5. 验证安装 [<fa-link/>](https://flutter.cn/docs/get-started/web)

``` shell
flutter devices
flutter doctor
```

![install successfully](/img/flutter/flutter%20doctor%20no%20issues%20found.jpg)

如果 `flutter devices` 书出一个名为 Chrome 的设备信息，则表示所有的安装、配置均完成。

## Hello, World! [<fa-link/>](https://flutter.cn/docs/get-started/web)

``` shell
flutter create testflutter
cd testflutter
flutter run -d chrome --web-hostname=127.0.0.1
```

打开 Chrome 浏览器，访问站点

![flutter run -d chrome --web-hostname=127.0.0.1](/img/flutter/flutter%20run.png)

## 编译、部署 [<fa-link/>](https://flutter.cn/docs/deployment/web)

编译：

``` shell
flutter build web
```

部署：随便找个站点挂挂，本地的，或者云上的。

![flutter build web](/img/flutter/flutter%20build%20web.png)

🎉🎉🎉 完美，算是迈出了第一步了！接下来就是找个练手项目，积攒经验值了。
