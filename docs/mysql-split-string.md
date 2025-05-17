---
title: mysql 字符串拆分行
tags:
  - mysql
  - split
date: 2021-11-10 18:25:13
---

SQL Server 没有 [GROUP_CONCAT](/GROUP-CONCAT-in-SQL-Server)，MySQL 没有 [STRING_SPLIT](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-split-transact-sql?view=sql-server-ver15)。 😔

还能咋办，人肉填坑啊！

大概看了一下网上的解决方案，很多都在推荐使用 [SUBSTRING_INDEX(str,delim,count)](https://dev.mysql.com/doc/refman/5.7/en/string-functions.html#function_substring-index) 函数，join `mysql.help_topic` 表的自增列来完成。示例如下：

``` sql
SELECT
    a.id,
    a. NAME,
    SUBSTRING_INDEX(
        SUBSTRING_INDEX(
            a.shareholder,
            ',',
            b.help_topic_id + 1
        ),
        ',' ,- 1
    ) AS shareholder
FROM
    company a
JOIN mysql.help_topic b ON b.help_topic_id < (
    LENGTH(a.shareholder) - LENGTH(
        REPLACE (a.shareholder, ',', '')
    ) + 1
)
```

emmm，不够优雅，但至少能解决大部分场景问题。

可以参照 SQL Server 中 [STRING_SPLIT](https://www.sqlshack.com/the-string-split-function-in-sql-server/) 的用法，将上述的解决方案封装一下：

``` sql
-- todo
```

### 参考链接

- [mysql根据逗号将一行数据拆分成多行数据](https://www.cnblogs.com/David3290/p/11378579.html)
- [How to split the name string in mysql?](https://stackoverflow.com/questions/14950466/how-to-split-the-name-string-in-mysql)
- [The STRING_SPLIT function in SQL Server](https://www.sqlshack.com/the-string-split-function-in-sql-server/)

