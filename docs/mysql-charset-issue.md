---
title: MySQL 编码问题
tags:
  - mysql
  - charset
  - encoding
  - utf8
  - utf8mb4

date: 2022-04-07 09:26:56
---

`MySQL` 到底支持不支持 `Emoji`？

可能有些人说支持，有些人说不支持。并且双方都能给出自己的亲身实践经验。😄😄

简单来说：支持，但是需要注意几个点：

1. 数据库编码设置为 `utf8mb4`；
2. 数据库连接编码设置为 `utf8`；
3. 编程语言（`Python`、`SQL` 等）代码保存格式为 `utf8`。

第一点简单，网上教设置（吐槽）的文章很多，就不赘述了。

第二点，就是说从程序连接到 `MySQL` 时，需要显示的指明编码，比如 `C#` 的连接字符串：
```xml
<add name="MySQLConnection" connectionString="server=xxxx;database=yyyy;uid=zzzz;pwd=your_password;charset=utf8" />
```
再比如 `Python` 的连接字符串（默认是 [`utf8mb4`](https://dev.mysql.com/doc/connector-python/en/connector-python-connectargs.html)）：
```py
mysqlconn.connect(user=user,password=password,database=database,charset='utf8',connection_timeout=timeout)
```

至于第三点，一般情况下，都不是问题，因为现代编程语言，基本默认都是存成 `utf8` 了。但是，当你卡壳了，记住，这一点也很重要！举个🌰：

在 MySQL Workbench 查询窗口中，我是用 `ASCII` 字符拼接，是可以正常返回的：
![sql query with normal characters concat statement](/img/mysql-character-set-issue/working-concat-sql.JPG)
但当我尝试使用 `Emoji` 字符拼接时，它就不行了：
![sql query with emoji characters concat statement](/img/mysql-character-set-issue/not-working-concat-sql.png)

但是，其实你把同样的拼接语句，放在 `Python` 或者 `C#` 代码里直接运行，都是可以按照预期返回结果的（前提：正确配置连接编码）。

### 参考链接

- [Unicode HOWTO - Python](https://docs.python.org/3/howto/unicode.html)
