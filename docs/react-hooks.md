---
title: React Hooks 学习笔记
date: 2020-10-10 16:46:10
tags: [随笔, javascript, react, hooks]
---

## 背景

刚看到一篇文章，2019年最值得学习的前端技能，里面给了 React Hooks 很大一部分介绍，不禁引起我的好奇，决定稍微深入了解一下，虽然我平时用 Angular 比较多。 🙂

## TLDR，太长不看版

其实这就是*面向对象编程* 和*函数式编程* 在前端编程的碰撞。

![ReactJS Function Component VS Class Component](https://www.wangbase.com/blogimg/asset/202009/bg2020091407.jpg)

以前类组件的编写方式是面向对象编程，而用 Hooks 是函数式编程。给个例子就能很好理解了：

![Function Component and Class Component](https://www.wangbase.com/blogimg/asset/202009/bg2020091320.jpg)

## 为什么会有 React Hooks，动机是什么？

官方的解释：

- 类组件不能很好重用状态逻辑代码

    使用 Hooks 则可以在不改变组件层次地前提下很好地重用状态逻辑，因为状态逻辑已经从组件中抽离出来了。

- 复杂组件变得越来越难以理解（维护）

    其实 React JS 以前的代码我也不喜欢，即使它使用了 JSX。因为感觉把所有东西都揉在一起了，这和以前 JSP，ASP.NET 不是差不多嘛。是时代在倒退吗？我喜欢模板（HTML）、样式（CSS）、逻辑（JS）分的清清楚楚的，就像 Angular 那样。我的确是个老顽固，但是我在用 Angular 之前，也用了 [mustache](https://github.com/mustache/mustache) 和 scss，感觉都挺好的。

    使用 Hooks 就逼迫我们把组件拆分成更小的方法了，模板和逻辑可以不用像以前那样，严重依赖于组件的生命周期。

- 程序员和机器并不能更好理解类

    emmm，前端等了这么多年，终于有了 class （虽然只是个语法糖），前端开发千辛万苦学会了面向对象，你现在说，不要面向对象？好吧，你说的都对，我继续学还不行吗！

    不过也的确是这样，机器里才没有类的概念，函数倒是基本上每个编程语言都有。使用函数（Hooks）可以让我们更贴近机器，也就能更好的利用 React 的特性。

## 我的理解

看起来挺好的，确实值得一学。毕竟，朝着我喜欢的方向在走（模板、样式、逻辑分清）。

## 参考链接

- [Introducing Hooks](https://reactjs.org/docs/hooks-intro.html)
- [轻松学会 React 钩子：以 useEffect() 为例](http://www.ruanyifeng.com/blog/2020/09/react-hooks-useeffect-tutorial.html)
- [ReactJS | useState Hook](https://www.geeksforgeeks.org/reactjs-usestate-hook/)
- [带你快速了解React Hooks](https://mp.weixin.qq.com/s/FQzSFwx3wWqwLCeQZ1eAEA)
