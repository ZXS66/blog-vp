---
title: SQL Server 中的 GROUP_CONCAT
tags:
  - group_concat
  - sql server
  - string_agg
  - stuff for xml path
date: 2021-02-28 16:12:14
---

在日常数据库编程中，分组，以及将分组中每个元素拼接，是非常常见的操作。MySQL 中只需要使用 [GROUP_CONCAT](https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html#function_group-concat) 函数即可。而在 SQL Server 中，如果 SQL Server 版本大于等于 2017，则可以使用 [STRING_AGG](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-agg-transact-sql?view=sql-server-ver15) 函数。如果 SQL Server 版本小于 2017 的话，则稍微复杂一点。

遗憾的是，目前（我所接触到的）大多数企业，使用的 SQL Server 都不高于 2017，甚至，有些还在用 SQL Server 2008 R2，甚至是 2000 都有！😟

那么，如果在不支持 `STRING_AGG` 的低版本 SQL Server 中，如何才能把每个分组中的字段拼接起来？一般来说，使用 STUFF FOR XML PATH 语法就可以了。

以下是范例：

``` sql
SELECT  
    Categoria,
    STUFF((
        SELECT ', ' + B.Descricao 
        FROM dbo.Teste_Group_Concat B 
        WHERE ISNULL(B.Categoria, '') = ISNULL(A.Categoria, '')
        ORDER BY B.Descricao 
        FOR XML PATH('')), 1, 2, ''
    ) AS Descricao
FROM
    dbo.Teste_Group_Concat A
GROUP BY 
    Categoria
ORDER BY 
    Categoria
```

看起来，超级复杂有木有，这是什么怪癖写法，其中几个 Magic Number 先不管，`STUFF` 里跟着一个奇怪的，子查询？感兴趣的可以自行去微软官网自学去。

我这里介绍另一种稍微高阶，但是用起来超级简单的一种用法：[SQL CLR](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/sql/introduction-to-sql-server-clr-integration)。

使用方法如下：

第〇步：启用 SQL CLR（默认禁用）

```sql
sp_configure 'clr enabled', 1  
GO  
RECONFIGURE  
GO
```
第一步：编写 GROUP_CONCAT 程序，参考的是微软官网的 [范例](https://learn.microsoft.com/en-us/sql/relational-databases/clr-integration-database-objects-user-defined-functions/clr-user-defined-aggregate-invoking-functions)。
第二步：部署至 SQL Server。可选择编译好后，把 dll 文件扔到目标机器上后用 SSMS 完成发布；也可以直接使用 VS 连接到 SQL Server 直接发布，看实际情况和个人喜好。
第三步：使用。同其他内置函数一样，只不过要写清楚命名空间(namespace)。

更多请参考：[ZXS66/mssql_clr_util](https://github.com/ZXS66/mssql_clr_util)

### 参考链接

- [How to make a query with group_concat in sql server](https://stackoverflow.com/questions/17591490/how-to-make-a-query-with-group-concat-in-sql-server)
- [USE STUFF AND ‘FOR XML PATH’ IN SQL SERVER TO CONCATENATE STRING](https://codemegeek.com/2018/11/17/use-stuff-and-for-xml-path-in-sql-server-to-concatenate-string/)
- [Introduction to SQL Server CLR Integration](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/sql/introduction-to-sql-server-clr-integration)
- [CLR User-Defined Aggregate - Invoking Functions](https://learn.microsoft.com/en-us/sql/relational-databases/clr-integration-database-objects-user-defined-functions/clr-user-defined-aggregate-invoking-functions)
- [SQL Server – Como concatenar linhas agrupando os dados por uma coluna](https://dirceuresende.com/blog/sql-server-como-concatenar-linhas-agrupando-os-dados-por-uma-coluna-grouped-concatenation/)

