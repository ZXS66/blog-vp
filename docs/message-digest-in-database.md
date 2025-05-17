---
title: 数据库信息摘要
tags:
  - database
  - message digest
  - md5
  - sha256
date: 2021-05-23 16:17:58
---

数据库中，经常遇见需要去重的场景。可能是整行记录（除了 ID）去重，也可能是整行记录的部分字段去重（仅看核心字段）。一般都是采用 SELECT DISTINCT 或者 GROUP BY 方式拿到唯一值，但是这个方法有一个缺陷，SELECT DISTINCT 或者 GROUP BY 多个字段的时候，每次都要书写把所有参与去重逻辑的字段写全了，稍微更改字段或调整次序都需要在所有 SELECT DISTINCT 或者 GROUP BY 的地方同步代码，既繁琐又易出错。下面介绍一下我在项目中使用到的办法（其实很简单，在插入数据库记录时，每次都是先计算好这一条记录的[信息摘要](https://baike.baidu.com/item/%E6%95%B0%E5%AD%97%E6%91%98%E8%A6%81/4069118?fromtitle=%E6%B6%88%E6%81%AF%E6%91%98%E8%A6%81&fromid=4547744&fr=aladdin)并存成额外的字段如checksum，查询的时候只需要看这一个字段就行）：

### MySQL 解决办法

```sql
UPDATE tableA SET checksum=MD5(CONCAT_WS(
  col1
  ,col2
  ,col3
  -- more columns here
  ))
-- WHERE col1=1;
```

### SQL Server 解决办法


```sql
UPDATE tableA SET checksum=CONVERT(VARCHAR(256),HashBytes('SHA2_256', CONCAT(
  col1
  ,col2
  ,col3
  -- more columns here
  )),2)
-- WHERE col1=1;
```

备注：此种方法有一个限制，参与计算信息摘要的所有字段不能超过一定长度限制。

### 参考链接

- [HASHBYTES (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/functions/hashbytes-transact-sql?view=sql-server-ver15)
