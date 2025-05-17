---
title: CSharp 正则表达式初尝
tags:
  - csharp
  - regular expression
date: 2021-04-15 18:05:56
---

检测用户名和密码是否符合相应的强度要求：

```cs
  string username = "BF-37";
  if (!System.Text.RegularExpressions.Regex.Match(username, @"^[a-zA-Z0-9\-\.]{4,16}$").Success)
  {
    // 大小写、数字、分隔符(-)、点号(.)，密码长度4到16
    Console.WriteLine("invalid user name");
  }
  string password = "Super hent@i";
  if (!System.Text.RegularExpressions.Regex.Match(password, @"^[\s!-~]{8,32}$").Success)
  {
    // 可打印字符（ASCII码从空格到~结束），密码长度8到32
    Console.WriteLine("invalid password");
  }
```
