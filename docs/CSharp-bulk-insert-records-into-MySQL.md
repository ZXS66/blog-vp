---
title: C# 批量插入记录至 MySQL
tags:
  - csharp
  - bulk insert
  - mysql
  - mysql.connector
date: 2022-05-20 14:58:42
---

本以为，`C#` 批量插入记录至 `MySQL` 这个情况应该很普遍，批量插入的代码很简单，就像批量插入 `SQL Server` 一样 (使用 [SQLBulkCopy](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/sql/bulk-copy-operations-in-sql-server))。结果：我草率了。

一般 `.NET` 开发人员，使用 [MySql.Data](https://www.nuget.org/packages/MySql.Data) 这个官方包来连接 `MySQL`。这个包很优秀，能够满足绝大多数的问题，但不包括批量插入（如果有哪位大牛知道官方的推荐做法，烦请告知，提前感谢！）。唯一和批量插入(bulk insert)可能有关联的是 [MySqlBulkLoader](https://dev.mysql.com/doc/dev/connector-net/6.10/html/T_MySql_Data_MySqlClient_MySqlCommandBuilder.htm)，但这个类的使用场景是从 csv 文件批量导入，类似于以下命令：`LOAD DATA INFILE '/tmp/data.csv' INTO TABLE bulk FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'`。

但其实，`.NET` 开发人员在日常开发过程中，需要把运行时的列表批量插入到数据库，比如 `IEnumerable<object>`。网上稍微找了一通，发现没有现成的封装类或可供参考的代码。没办法了，自己动手吧。

以下是我简单封装的代码，拿走不谢：

```cs
    /// <summary>
    /// handy functions for inquiring mysql
    /// </summary>
    public static class MySQLCommonHelper
    {
        /// <summary>
        /// bulk insert data into database
        /// </summary>
        /// <typeparam name="T">data type</typeparam>
        /// <param name="data">the data to be inserted into database</param>
        /// <param name="tableName">destination table name</param>
        /// <param name="connectionString">connection string of MySQL</param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException"></exception>
        public static bool BulkInsert<T>(IEnumerable<T> data, string tableName, string connectionString)
        {
            if (CommonUtility.IsNullOrEmptyList(data))
                return false;// throw new ArgumentNullException(nameof(dt));
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentNullException(nameof(tableName));
            if (string.IsNullOrEmpty(connectionString))
                throw new ArgumentNullException(nameof(connectionString));

            // init the DataTable for bulk inserting
            var table = new DataTable(tableName);
            var props = typeof(T).GetProperties();
            foreach (var prop in props)
            {
                table.Columns.Add(new DataColumn(prop.Name, prop.PropertyType));
            }
            foreach(var d in data)
            {
                var row = table.NewRow();
                foreach(var prop in props)
                {
                    row[prop.Name] = prop.GetValue(d, null);
                }
                table.Rows.Add(row);
            }

            using (MySqlConnection connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                using (MySqlCommand cmd = connection.CreateCommand())
                {
                    cmd.CommandText = $"SELECT * FROM {tableName} LIMIT 0";
                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.UpdateBatchSize = 8192;
                        using (MySqlCommandBuilder cb = new MySqlCommandBuilder(adapter))
                        {
                            adapter.InsertCommand = cb.GetInsertCommand();
                            adapter.Fill(table);
                            // Without the MySqlCommandBuilder this line would fail
                            var rows = adapter.Update(table);
                            return rows > 0;
                        }
                    };
                }
            }
        }
    }
```

## 参考链接
- [Bulk Insert asp.net Datatable to Mysql](https://social.msdn.microsoft.com/forums/en-US/a8c1e923-e2d1-439c-a114-2b734c9e7fd4/bulk-insert-aspnet-datatable-to-mysql)
- [Insert large amounts of data into Mysql](https://mysqly.com/educate/insert-bulk-into-mysql)
