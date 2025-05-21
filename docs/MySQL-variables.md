---
title: MySQL 变量
tags:
  - mysql
  - variable
date: 2021-03-25 22:42:51
---

本文仅记录 MySQL 中本地变量和用户变量的相同和不同。

## TLDR

感觉英文还行的看官，请直接移步 [参考链接](#参考链接) 查看 MySQL 官方文档。

### 相同点

都可以使用 SET 语句赋值。

### 不同点

| |本地变量|用户变量|
|-------|-------|-------|
|变量名称格式|不以@开头|必须以@开头|
|是否需要DECLARE|✔️|❌|
|常见使用场景|存储过程|即时查询窗口|
|存在作用域|当前存储过程|当前会话|

> The scope of a local variable is the BEGIN ... END block within which it is declared. The variable can be referred to in blocks nested within the declaring block, except those blocks that declare a variable with the same name. Because local variables are in scope only during stored program execution, references to them are not permitted in prepared statements created within a stored program. Prepared statement scope is the current session, not the stored program, so the statement could be executed after the program ends, at which point the variables would no longer be in scope. For example, SELECT ... INTO local_var cannot be used as a prepared statement.

> User-defined variables are session specific. A user variable defined by one client cannot be seen or used by other clients. (Exception: A user with access to the Performance Schema user_variables_by_thread table can see all user variables for all sessions.) All variables for a given client session are automatically freed when that client exits.

## 参考链接

- [MySQL::User-Defined Variables](https://dev.mysql.com/doc/refman/8.0/en/user-variables.html)
- [MySQL::Local Variable Scope and Resolution](https://dev.mysql.com/doc/refman/8.0/en/local-variable-scope.html)
- [Declare and Use Variables in MySQL](https://www.delftstack.com/howto/mysql/mysql-declare-variable/)
