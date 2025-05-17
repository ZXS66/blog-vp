---
title: SQL Server 数据透视表
date: 2020-10-20 16:46:37
tags: [随笔, sql, sql server, pivot table]
---

## 背景

在搜索 [STRING_AGG](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-agg-transact-sql?view=sql-server-ver15) 方法（同 MySQL 中的 [GROUP_CONCAT](https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html#function_group-concat)）在低版本 SQL Server 中实现的时候，无意中想到，之前好像有用过 pivot table (数据透视表)，用来拼接字符串？？年代久远，记忆模糊了，没办法，又得学习一遍。为加深印象，还是记一下笔记吧。

## TLDR，太长不看版

数据透视表就是 **把数据表转置，行变列，或者列变行**。

## pivot 范例

脚本如下：

``` sql
USE AdventureWorks2014;  
GO  
SELECT VendorID, [250] AS Emp1, [251] AS Emp2, [256] AS Emp3, [257] AS Emp4, [260] AS Emp5  
FROM   
(SELECT PurchaseOrderID, EmployeeID, VendorID FROM Purchasing.PurchaseOrderHeader) p  
PIVOT  
(COUNT (PurchaseOrderID) FOR EmployeeID IN  ([250], [251], [256], [257], [260])) AS pvt  
ORDER BY pvt.VendorID;
```

输出结果如下：

|VendorID    |    Emp1    |    Emp2    |    Emp3    |    Emp4    |    Emp5    |
|------------|------------|------------|------------|------------|------------|
|1492        |     2      |       5      |     4      |     4      |     4    |
|1494        |     2      |       5      |     4      |     5      |     4    |
|1496        |     2      |       4      |     4      |     5      |     5    |
|1498        |     2      |       5      |     4      |     4      |     4    |
|1500        |     3      |       4      |     4      |     5      |     4    |

## unpivot 范例

脚本如下：

```sql
-- Create the table and insert values as portrayed in the previous example.  
CREATE TABLE pvt (
    VendorID INT, 
    Emp1 INT, 
    Emp2 INT,  
    Emp3 INT, 
    Emp4 INT, 
    Emp5 INT
);  
GO  
INSERT INTO pvt VALUES (1,4,3,5,4,4);  
INSERT INTO pvt VALUES (2,4,1,5,5,5);  
INSERT INTO pvt VALUES (3,4,3,5,4,4);  
INSERT INTO pvt VALUES (4,4,2,5,5,4);  
INSERT INTO pvt VALUES (5,5,1,5,5,5);  
GO  
-- Unpivot the table.  
SELECT VendorID, Employee, Orders  
FROM   
(SELECT VendorID, Emp1, Emp2, Emp3, Emp4, Emp5  FROM pvt) p  
UNPIVOT  
(Orders FOR Employee IN (Emp1, Emp2, Emp3, Emp4, Emp5))AS unpvt;  
GO
```

输出结果如下：

|VendorID  |  Employee  |  Orders|
|-----------|-----------|--------|
|1      |      Emp1    |   4|
|1      |      Emp2    |   3|
|1      |      Emp3    |   5|
|1      |      Emp4    |   4|
|1      |      Emp5    |   4|
|2      |      Emp1    |   4|
|2      |      Emp2    |   1|
|2      |      Emp3    |   5|
|2      |      Emp4    |   5|
|2      |      Emp5    |   5|
|...  |...  |...  |

## 附录1：STRING_AGG polyfill

虽然 [STRING_AGG](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-agg-transact-sql?view=sql-server-ver15) 方法只在 SQL Server 2017 及之后版本可用，但在此之前的版本，则可以通过运行以下代码创建自定义方法：

``` sql
-- coming soon
```

## 附录2：STRING_SPLIT polyfill

[STRING_SPLIT](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-split-transact-sql?view=sql-server-ver15) 方法只在 SQL Server 2016 及之后版本可用，在此之前的版本，则可通过运行以下代码创建自定义方法：

``` sql
CREATE FUNCTION [dbo].[fx_STRING_SPLIT](
	@SourceString NVARCHAR(MAX)
	,@Seperator VARCHAR(25)=','
)
RETURNS @ResultTable TABLE(
	[Position] INT IDENTITY(1,1),
	[Value] NVARCHAR(MAX)
)
AS
/**************************************************************
* Author: Beaulin @ www.MyTecBits.com
* Description: Function to split the delimited text and
* returns teh result in table format
**************************************************************/
BEGIN
DECLARE @w_xml xml;

SET @w_xml = N'<root><i>' + replace(@SourceString, @Seperator,'</i><i>') + '</i></root>';

INSERT INTO @ResultTable
([Value])
SELECT 
	[i].value('.', 'NVARCHAR(MAX)') AS Value 
FROM 
@w_xml.nodes('//root/i') AS [Items]([i]);
RETURN;
END;

GO
```

## 参考链接

- [FROM - Using PIVOT and UNPIVOT](https://docs.microsoft.com/en-us/sql/t-sql/queries/from-using-pivot-and-unpivot?view=sql-server-ver15)
