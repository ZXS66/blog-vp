---
title: MySQL怪癖
tags:
  - mysql
  - if statement
  - sleep
date: 2022-03-31 11:03:50
---

## MySQL 即时查询窗口不支持 IF 表达式

对于我这个菜鸡来说，虽然听起来很不可思议，但这是真的，你没（mèi）听错。根据 MySQL [官方文档](https://dev.mysql.com/doc/refman/8.0/en/if.html)，IF 表达式仅可以在存储程序（存储过程或函数）中适用（除此之外，还有一个 [IF 函数](https://dev.mysql.com/doc/refman/8.0/en/flow-control-functions.html#function_if)），即时查询窗口中用不了！早在 2008 年就有大佬报怨 <ZLink link="https://www.bennadel.com/blog/1340-mysql-does-not-support-if-else-statements-in-general-sql-work-flow.htm"/>，都 2022 年了，这个问题还没有解决，也不知道 MySQL 团队是咋想的。

BTW，[Oracle 开发工程师离职后怒喷 MySQL 很烂](https://www.theregister.com/2021/12/06/mysql_a_pretty_poor_database/) 这条新闻，去年就上了热搜，说起来确实是个笑话。

## MySQL 中 PRINT 方法

MySQL 中暂无此方法！如果有大佬知道，请告诉我，不胜感激！

## 支持 Emoji 字符

首先，MySQL 是支持 Emoji 字符的，但是，也不完全支持，即使编码设置的是 `utf8mb4`。

这里就不展开了，更多可以查看我的 [另一篇文章](/mysql-charset-issue)。

## MySQL 中 SLEEP 方法

基于 [MySQL SLEEP 命令官方文档](https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html#function_sleep)，推荐用法是 `SELECT SLEEP(1)`。但是，如果这样书写方式，会给存储过程的既定输出造成影响。 

通过面向搜索引擎编程，发现以下脚本居然可行？

``` sql
-- SELECT ...
DO SLEEP(5);
-- SELECT ...
```

为什么我需要到 `SLEEP` 方法，原因在于我需要根据参数 `ticket` 查询一个表的数据，但是目标表是不定时更新的。即使使用了 [批量插入](/CSharp-bulk-insert-records-into-MySQL)，把插入时间尽量缩短，仍存在插入途中遇到查询请求的情况。一般这时候都会引入锁的概念，以确保数据完整性。但是：

1. 锁会降低并发量，得不偿失；
2. 插入数据的代码不便更改，因为 owner 不是我（沟通/变更很费劲）。

考虑到大多数情况下，一个 `ticket` 及其对应的数据都能在 5 秒之内成功插入。那为何我发现该 `ticket` 对应的数据还在插入中，我多等一会儿行不行？？

## 真实案例

``` sql {21}
DELIMITER $$
USE `mydb`$$
DROP PROCEDURE IF EXISTS `sp_query_with_safe_check`$$
CREATE DEFINER=`mysql_user`@`%` PROCEDURE `sp_query_with_safe_check`(IN `ticket` VARCHAR(128)) COMMENT 'query data by ticket, with safe check (return only if the data insertion completed)'
proc_label:BEGIN

		DECLARE lastRowID INT;
		DECLARE newRowID INT;
		DECLARE lastTicket VARCHAR(45);
		SELECT MAX(t.id) INTO lastRowID FROM `mytable` t;
		SELECT t.ticket INTO lastTicket FROM `mytable` t WHERE id=lastRowID;

		-- SELECT lastRowID, lastTicket;

		-- safe check (if the data insertion completed)
		IF lastTicket=`ticket` THEN
			-- the lastest row's ticket is equal to the querying request form
			-- wait for 5 seconds to see if any new rows inserted
			-- if yes, the insertion is happening and just exit the query
			-- if no, continue the query
			DO SLEEP(5);
			SELECT MAX(t.id) INTO newRowID FROM `mytable` t;
			IF newRowID!=lastRowID THEN LEAVE proc_label; END IF;
		END IF;

		SELECT 
			DISTINCT t.*
		FROM `mytable` t WHERE t.ticket=`ticket`;
	END$$
DELIMITER ;
```

*👆 上面代码其实还可以继续优化，使用 `WHILE` 写法，在插入结束之前一直等着，这样可以避免等待了 5s 之后仍在插入返回空的情况。*

## 参考链接

- [MySQL::Miscellaneous Functions::Sleep](https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html#function_sleep)
- [How and when to use SLEEP() correctly in MySQL?](https://stackoverflow.com/questions/4284524/how-and-when-to-use-sleep-correctly-in-mysql)
- [Oracle大佬离职，怒喷MySQL是“糟糕的数据库”……](https://mp.weixin.qq.com/s/zajIrjPAJPYnBzrqyU0U4Q)
