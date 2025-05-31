---
title: MySQL 大小写问题
tags:
  - mysql
  - case sensitivity

date: 2022-02-10 22:25:28
---

## 正文

先说结论，一个对于像我这样的 `MySQL` 小菜狗们来说可能不清楚的知识点：同样的 `SQL` 脚本，如果不注意大小规范，在某些系统上可以正常运行，而扔到另一个系统上可能就会报错。

举个🌰：

``` sql
SELECT col_name FROM tbl_name AS a WHERE a.col_name = 1 OR A.col_name = 2;
```

默认情况下，在 `Unix` 系统中表别名区分大小写，而 `Windows` 或者 `macOS` 中不。👆 上述语句在 `Unix` 系统中会报错，因为它同时引用到 `a` 和 `A`。

在 `MySQL` 中，存储在磁盘上的表格和数据库的名字由系统变量 [lower_case_table_names](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_lower_case_table_names) 决定。该变量不影响触发器(trigger)标识符的大小写敏感性。在 `Unix` 系统，默认值是 `0`，在 `Windows` 系统，默认值是 `1`，而在 `macOS` 系统，默认值是 `2`。

| 值 | 含义 |
| --- | --- |
| 0 | 存储在磁盘中的表格和数据的名字使用的是 [CREATE TABLE](https://dev.mysql.com/doc/refman/8.0/en/create-table.html) 或者 [CREATE DATABASE](https://dev.mysql.com/doc/refman/8.0/en/create-database.html) 语句中的字母大小写。名称比较区分大小写。如果你要在一个文件名大小写不敏感的系统上运行 `MySQL`**不**应该设置此变量为 `0`。如果你在一个文件名大小写不敏感的系统上使用 [--lower-case-table-names=0](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_lower_case_table_names) 强制设置该变量为 `0`，并且使用不同的大小写字母访问 `MyISAM` 表名，那么可能导致索引损坏。 |
| 1 | 存储在磁盘中的表格和数据的名字都是小写，并且名称比较不区分大小写。`MySQL` 在存储和查找时把所有表名转换成小写。该行为也适用于数据库名字和表别名。 |
| 2 | 存储在磁盘中的表格和数据的名字使用的是 [CREATE TABLE](https://dev.mysql.com/doc/refman/8.0/en/create-table.html) 或者 [CREATE DATABASE](https://dev.mysql.com/doc/refman/8.0/en/create-database.html) 语句中的字母大小写，但是 `MySQL` 在查找时会把它们转换成小写。名称比较不区分大小写。这仅仅在大小写不敏感的系统上可行！`InnoDB` 表名和视图名存储的是小写，类似于 `lower_case_table_names=1`。 |

如果你使用的 `MySQL` 服务器和客户端都是一个系统，那么使用默认值完全没问题。然而，如果你在文件系统大小写敏感性不一样的系统间传输表格和数据，你可能会遇到问题。

比如，我有一个 `MySQL` 源数据库，部署在 `Linux` 服务器上，其配置如下（执行脚本：`SHOW VARIABLES like 'lower%';`）：

| Variable_name | Value |
|-----|-----|
| lower_case_file_system | OFF |
| lower_case_table_names | 0 |

这意味着，其对应的数据库名和表明存储和查找时是区分大小写的！碰巧，我在上面有一个**名称大写**的数据库。

现在，我有另一台 `MySQL` 目标数据库，部署在 `Windows` 服务器上：

| Variable_name | Value |
|-----|-----|
| lower_case_file_system | ON |
| lower_case_table_names | 1 |

意味着存储时都是小写，查找时不区分大小写。

当我像往常一样，创建一张 `FEDERATED` 表格时，居然报错了，提示 `The foreign data source you are trying to reference does not exist`。

针对这个问题，`MySQL` 官方推荐了两个方法：

- 在所有系统中设置 `lower_case_table_names=1`。这样做最大的不足是，当你使用 [SHOW TABLES](https://dev.mysql.com/doc/refman/8.0/en/show-tables.html) 或者 [SHOW DATABASES](https://dev.mysql.com/doc/refman/8.0/en/show-databases.html) ，你将不能看到这些名字原始的大小写。
- 在 `Unix` 系统中设置 `lower_case_table_names=0`，在 `Windows` 中设置 `lower_case_table_names=2`。这样做将保留数据库和表名的字母大小写。缺点是你必须确保你的语句在 `Windows` 上始终以正确的字母大小写引用数据库和表名。如果你将你的 `sql` 语句迁移到 `Unix`(大小写很重要)，未正确拼写字母大小写将导致报错。

**例外：**如果你使用 `InnoDB` 表格并且想要避免数据传输问题，你应当在所有平台使用 `lower_case_table_names=1` 来强制转换名字成小写。

emmm，第一个推荐方法，我不能更改 `Linux` 上的 `MySQL` 啊，人家那是产品环境；第二个推荐办法，更改部署在 `Windows` 上的 `MySQL` 目标数据库配置？听起来似乎可行？且慢：

> `lower_case_table_names` 仅能在初始化服务器的时候设置。在服务器初始化之后更改 `lower_case_table_names` 设置是被禁止的。<ZLink link="https://dev.mysql.com/doc/refman/8.0/en/identifier-case-sensitivity.html"/>

> 禁止在服务器初始化之后，使用不同的 `lower_case_table_names` 设置来启动服务器。该限制十分必要，因为各种数据字典表字段使用的排序规则是由初始化服务器时的设置决定，使用不同的设置重新启动服务器会在标识符的排序和比较方式方面引入不一致。 <ZLink link="https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_lower_case_table_names"/>

以下是初始化服务器时的设置：

![show advanced and logging options](/img/mysql-case/show-advanced-and-logging-options.png)

![preserve given case](/img/mysql-case/preserve-given-case.png)

什么鬼，推荐了两个不能用的办法???

那还有没有其他办法？我先去倒杯咖啡，冷静一下！<font-awesome-icon icon="mug-hot"/>

<font-awesome-icon icon="lightbulb" /> 有了！既然服务器配置无法更改，那我试试改数据库配置？我记得，`MySQL` 数据库中有一个编码问题（`utf8`、`latin` 等等），还有一个 `collation` 问题。

OK，先调研，再备份，再动手。

根据这篇文档，

``` sql
ALTER DATABASE `your_database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs;
```

``` sql
CREATE SERVER s
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'Remote',PASSWORD '', HOST 'XXX.XXX.XXX.XXX', DATABASE 'test');
```

不行，没有预期结果。

这个好像是和表里的**数据**编码有关系，而不是**数据库/表**名称的编码。

所以，结论就是，到此为止了？？？

有一个办法，虽然肯定不是最佳实践，但应该能解决问题（我没试过 😂）：用一个能够区分数据库/表名称大小写的 `MySQL` 实例中转，然后在这个实例中名称能小写的都小写。然后再对这个中转实例创建 `FEDERATED` 表格。

## 参考链接

- [MySQL::Identifier Case Sensitivity](https://dev.mysql.com/doc/refman/8.0/en/identifier-case-sensitivity.html)
- [MySQL::Server System Variables](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_lower_case_table_names)
- [MySQL::Character Sets and Collations in MySQL](https://dev.mysql.com/doc/refman/8.0/en/charset-mysql.html)
- [How can I transfer data between 2 MySQL databases?](https://stackoverflow.com/questions/3242504/how-can-i-transfer-data-between-2-mysql-databases)
