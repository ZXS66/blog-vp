---
title: SQL Server 复制
tags:
  - sql server
  - replication
date: 2021-09-27 17:07:26
---

前段时间，使用 `SSIS` (`SQL Server Integration Services`，SQL Server 数据集成服务)将数据从 A 同步到 B，基本满足需求。但是有些情况下，比如数据量特别大的时候，就该轮到 `SQL Server Replication` (SQL Server 复制) 出场了。

但是，在开启 `SQL Server Replication` 之前，相应的数据库和表必须满足若干条件。比如：

1. 源数据库和目标数据库能够连通（这是句废话）；
2. 源表和目标表结构一致；
3. 源表和目标表必须有主键；
4. 源数据库和目标数据库支持并 [已启用](https://docs.microsoft.com/en-us/sql/relational-databases/replication/enable-a-remote-publisher-at-a-distributor-sql-server-management-studio?view=sql-server-ver15) `SQL Server Replication`；
5. 拥有可访问数据库的账户，同时该账户可访问用于保存快照文件的目录（有权限），并可访问源数据库及目标数据库的复制发布者、分发者、订阅者；
6. 足够的带宽和存储空间。

满足这些条件之后，就可以按照 [官方教程](https://docs.microsoft.com/en-us/sql/relational-databases/replication/configure-publishing-and-distribution?view=sql-server-ver15) 或者 [这篇博客](https://www.sqlshack.com/sql-replication-basic-setup-and-configuration/) 一步一步设置即可。

目前，`SQL Server` 支持 [四种复制模式](https://docs.microsoft.com/en-us/sql/relational-databases/replication/types-of-replication?view=sql-server-ver15)：

1. `Transaction Replication` (事务复制)。一般需要近实时或者较快同步频率时采用；
2. `Merge Replication` (合并复制)。一般变更在源和目标数据库都会发生时采用这种模式；
3. `Snapshot Replication` (快照复制)。一般不需要实时同步，只需要目标数据库重现源数据库在某个时间点的情况即可；
4. `Peer-to-peer Replication` (点对点复制)。基于事务复制，但是支持多个源数据库和多个目标数据库。

好像更新版本的 `SQL Server` 支持额外两种模式：

5. `Bidirectional Replication` (双向复制)。基于事务复制，一般用于源数据库和目标数据库都可以推送/结束数据；
6. `Updateable Replication` (可更新订阅复制)。基于事务复制，一般用于将一个变更推送到其他发布者然后再次分发。

具体步骤这里就不赘述了，仅记录一下我遇到的问题：

- **硬盘空间不足**。因为每次复制都需要创建快照，所以可能会遇到“`There is not enough space on the disk`”错误。简单，记得定期清理一下快照文件夹下的文件。

- **发布者需要重新初始化**。因为某些未知错误，需要定期重新初始化 `SQL Server Replication` 发布者。

### 参考链接

- [SQL Server Replication](https://docs.microsoft.com/en-us/sql/relational-databases/replication/sql-server-replication?view=sql-server-ver15)
- [SQL Replication: Basic setup and configuration](https://www.sqlshack.com/sql-replication-basic-setup-and-configuration/)
