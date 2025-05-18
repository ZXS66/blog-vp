---
title: 从 MySQL 迁移数据至 SQL Server
tags:
  - mysql
  - sql server
  - migration
  - microsoft sql server migration assistant for mysql
  - sql server integration service
  - etl
date: 2021-06-06 10:24:00
---

数据库之间数据同步，是很常见的场景。可能发生在相同服务器不同数据库名之间，也可能发生在不同服务器实例相同数据库之间，还可能发生在不同服务器不同数据库软件之间等等。本片文章只覆盖：如何从 MySQL 迁移数据至 SQL Server 中。

我目前使用了两种方法：

## 使用 Microsoft SQL Server Migration Assistant for MySQL 工具

这是微软官方出品的迁移工具。对于项目前期业务人员进行原型快速验证非常有帮助。

### 使用步骤

1. 下载 [Microsoft SQL Server Migration Assistant for MySQL](https://www.microsoft.com/en-us/download/details.aspx?id=54257) ；
2. 双击 exe 文件安装；
3. 运行 SSMA：
    1. 连接 MySQL
    2. 勾选需要迁移的表、视图、存储过程、函数等
    3. 连接 SQL Server
    4. 勾选需要迁移的目标 SQL Server 数据库
    5. 回到左边 MySQL Metadata Explorer 窗口，点击按钮 “Convert Schema”
    6. 待完成后，右键 SQL Server 数据库节点，“Synchronize with Database”
    7. 待完成后，点击“Migrate Data”
    8. 完成。

SSMA 网上有很多图文/视频教程，各位可以自行搜索。期间可能会遇到以下问题：

- MySQL ODBC Driver 缺失问题，可以自行去 [MySQL 官网下载](https://www.mysql.com/products/connector/)；如果还是有问题，可以去 SSMA 下载页找它的 System Requirements，里面会提到具体的 MySQL ODBC Driver 版本号，下载这一特定版本号就对了。
- Visual Studio 2019 x64 Redistributable 组件缺失问题，去 [微软官方下载](https://support.microsoft.com/en-us/topic/the-latest-supported-visual-c-downloads-2647da03-1eea-4433-9aff-95f26a218cc0) 安装即可。

### 优点
1. 非 IT 人士也可以上手，不用编写任何代码；

### 缺点
1. 前期环境安装和配置步骤繁琐，容易出错；
2. 无法自动化。

## 创建 SSIS

### 使用步骤

[官方参考文档](https://docs.microsoft.com/en-us/sql/integration-services/lesson-1-create-a-project-and-basic-package-with-ssis?view=sql-server-ver15)

1. 安装 MySQL ODBC Connector [点此下载](https://dev.mysql.com/downloads/connector/odbc/)；
2. 打开 Visual Studio，新建 Integration Services Project； 
3. 分别为 MySQL 和 SQL Server 添加 Connection（在 Solution Explorer 中，右键 Connection Managers，New Connection Manager），范例如下：
![MySQL Connection Manager](/img/migrate-data-from-MySQL-to-SQL-Server/MySQL-connection-manager.jpg)
![SQL Server Connection Manager](/img/migrate-data-from-MySQL-to-SQL-Server/SQL-Server-connection-manager.jpg)
4. 从 SSIS Toolbox 中拖入 Execute SQL Task 或者 Data Flow Task，前者可用于执行 SQL 脚本或者存储过程，后者则可以更加灵活配置；
5. 双击 Data Flow Task 切换至 Data Flow 视图，添加一个 `ADO NET Source`，双击编辑，ADO.NET Connection Manager选择刚才第3步所创建 MySQL Connection Manager，Data access mode 选择 SQL command，SQL command text 填入 SELECT 查询语句：
![MySQL Source](/img/migrate-data-from-MySQL-to-SQL-Server/MySQL-ADO.NET-Source.jpg)
6. 再添加一个 `ADO NET Destination`，双击编辑，ADO.NET Connection Manager选择刚才第3步所创建 SQL Server Connection Manager，Use a table or view 选择需要插入的目标表：
![SQL Server Destination](/img/migrate-data-from-MySQL-to-SQL-Server/SQL-Server-ADO.NET-Source.jpg)
7. 点击 ADO NET Source 蓝色箭头，连接至 SQL Server Destination（当然这中间可以加一些变换，可选）；
8. 切换回 Control Flow，也用蓝色箭头连接各 Execute SQL Task 或者 Data Flow Task；
9. 编译、本地调试一遍；
10. 邮件点击 Project Name，Deploy，Server Name 输入目标 SQL Server 地址，Path 设置完毕，Next，Deploy，数秒后完成；
11. 打开 SSMS (SQL Server Management Studio)，找到对应的 Package，右键 Execute：
![Execute SSIS](/img/migrate-data-from-MySQL-to-SQL-Server/execute-SSIS.jpg)
12. 稍等片刻，即可查看运行结果报告。

说一个我开发时遇到的坑吧：从 MySQL 到 SQL Server 类型转换时请参考 [文档](https://docs.microsoft.com/en-us/sql/integration-services/data-flow/integration-services-data-types?view=sql-server-ver15)，一般 `VARCHAR` 或者 `TEXT` 这些类型没有问题，但是 `DateTime` 需要注意精度问题、空值问题。精度不一致可能会导致精度丢失甚至运行报错。MySQL 中空时间为 `0000-00-00`，而 SQL Server 中空时间为 `1970-01-01`。

网上说的解决方案很多，但不一定适用，或者不适用于所有场景。我的解决方案很简单，就是在第5步时，填写 MySQL Source 的 SQL command text 时，稍加调整脚本，把 DATETIME 这些类型的数据做个变换：

```sql
-- approach 1: IF(`fromTime` IS NULL OR `fromTime`='0000-00-00', NULL, DATE_FORMAT(`fromTime`, '%Y-%m-%d')) AS `fromTime`,  -- for nullable date type
-- approach 2: CAST(`list_date` AS CHAR) AS `EY_List_date`,  -- for datetime type
-- approach 3: CAST(`list_date` AS DATE) AS `EY_List_date`,  -- for date type
```

### 优势：
1. 性能快；
2. 人工介入少，不易出错；
3. 可自动化，SQL Server 中可以直接查看每次运行的报告。

### 缺点：
1. SSIS 任务**只能使用 Windows 认证**。前期环境配置需要花费一定时间；
2. 开发 SSIS 时，部分提示信息不够准确清晰；
3. 第一次需要手动同步 Schema，以后每次 Schema 有变动，SSIS package 也需要跟着变动。

## 参考链接：

- [Download Microsoft SQL Server Migration Assistant for MySQL](https://www.microsoft.com/en-us/download/details.aspx?id=54257)
- [MySQL :: Download Connector/ODBC](https://dev.mysql.com/downloads/connector/odbc/)
- [Integration Services Data Types](https://docs.microsoft.com/en-us/sql/integration-services/data-flow/integration-services-data-types?view=sql-server-ver15)
