---
title: Windows 显示已保存 WiFi 密码
date: 2020-07-15 15:05:03
tags: [windows, command, wifi, password]
---

有的时候，需要查看 Windows 下已保存的 WiFi 密码。比如好基友问：你要你家 WiFi 密码多少，连上去一起打局 Dota 玩玩。额，我看看。。。

只知道，在网络配置里可以找得到，但是具体在哪里，emmm，别问，问就是不知道。Windows 7 之后，Windows 的设置经常改来改去，传统的设置界面和新款的设置界面经常纠缠不清。

一般情况，快速的解决办法就是去度娘一下。  [出门左转](https://www.baidu.com/s?wd=Windows%2010%E6%9F%A5%E7%9C%8Bwifi%E5%AF%86%E7%A0%81)

下面的方案，则是使用命令行，简单粗暴又高效。

## 步骤一: 显示所有已保存配置

``` bat
netsh wlan show profiles
```

![](/img/windows-saved-wifi-password/Windows%20saved%20wifi_1.png)

## 步骤二: 显示指定配置的详情

``` bat
netsh wlan show profile name="your-profile-name" key=clear
```

![](/img/windows-saved-wifi-password/Windows%20saved%20wifi_2.png)

找到图片中 Key Content 就是了！

## 参考链接

[How to See All Your Saved Wi-Fi Passwords on Windows 10](https://www.howtogeek.com/426257/how-to-see-all-your-pcs-saved-wi-fi-passwords/)
