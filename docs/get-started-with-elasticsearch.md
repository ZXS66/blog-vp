---
title: Elasticsearch 入门
tags:
  - elasticsearch
  - kibana
  - logstash
  - elk
date: 2022-02-03 23:28:57
---

最近公司有使用 `elasticsearch` 的需求，正好借此机会，复习一下之前的知识。

## 下载 elasticsearch 和 Kibana

[elasticsearch](https://www.elastic.co) 这几年的变化，还是挺大的，特别是从 [更改 license](https://www.elastic.co/blog/license-change-clarification) 之后，变得更加强大了。

~~我之前使用的是 `elasticsearch` 和 `elasticsearch-head` 插件，现在官方推出的 `Kibana` 足够强大了，就不用第三方插件了~~

目前官方支持的系统，从 `Linux` 到 `MacOS`，再到 `Windows`，再到 `Docker`，应有尽有。

因为我这边的日常工作基本上都是在 `Windows` 中进行，所以 [直接下载 zip 包](https://www.elastic.co/elastic-stack) 即可。当前我下载的版本是 `7.16.3` （`elasticsearch` 和 `Kibana` 版本一般需要统一，具体可以参考 [这个文档](https://www.elastic.co/support/matrix#matrix_compatibility)）。

## 安装和配置

1. 解压下载好的两个 zip 包
2. 更改 `elasticsearch-7.16.3/config/elasticsearch.yml` 配置如下(可根据实际情况做调整)：
  ``` elasticsearch.yml
  cluster.name: my-es
  node.name: ${HOSTNAME}
  network.host: 192.168.0.8
  http.port: 9200
  path.data: C:\my-es\elasticsearch-data
  path.logs: C:\my-es\elasticsearch-logs
  xpack.security.enabled : true
  discovery.type: single-node
  ```
3. 配置 `elasticsearch` 环境变量：因为 `elasticsearch` 是基于 `Apache Lucene` 构建的，所以 `Java` 虚拟机是必须的。为了减少小白用户的困扰，目前，`elasticsearch` 在下载好的 zip 包中已包含了 `jdk` (Open Java 版本) 的子文件夹。配置很简单，只需要设置 `ES_HOME`(`elasticsearch` zip 包解压文件夹) 和 `ES_JAVA_HOME`(`%ES_HOME%\jdk`) 两个环境变量即可。当然，如果你电脑已经安装了 `JDK`，那 `JAVA_HOME` 肯定已经配置好了，这个时候如果没有配置 `ES_JAVA_HOME`，`elasticsearch` 就会回滚读取 `JAVA_HOME` 里的 `jdk` 了
4. 设置 `elasticsearch` 密码 [<i class="mdui-icon material-icons">link</i>](https://www.elastic.co/guide/en/elasticsearch/reference/7.16/security-minimal-setup.html)：
  1. 进入 `ES_HOME` 目录，运行 `./bin/elasticsearch.bat` 命令;
  2. 进入 `ES_HOME` 目录，运行 `./bin/elasticsearch-setup-passwords.bat interactive` 命令，会提示给默认的几个账户(`apm_system`、`kibana_system`、`kibana`、`logstash_system`、`beats_system`、`remote_monitoring_user`、`elastic`)设置密码;
  3. 打开浏览器，输入网址 [http://192.168.0.8:9200](http://192.168.0.8:9200) 检查一下 ES 是否正常运行（需要提供上一步设置的用户名密码）。
5. 注册 `elasticsearch` 成为 `Windows` 服务（可选）[<i class="mdui-icon material-icons">link</i>](https://www.elastic.co/guide/en/elasticsearch/reference/7.16/zip-windows.html)：进入 `ES_HOME` 目录，运行 `./bin/elasticsearch-service.bat install` 命令
6. 更改 `kibana-7.16.3-windows-x86_64/config/kibana.yml` 配置如下(可根据实际情况做调整)：
  ``` kibana.yml
  server.host: "192.168.0.8"
  elasticsearch.hosts: ["http://192.168.0.8:9200"]
  elasticsearch.username: "kibana_system"
  elasticsearch.password: "your_password_here"
  ```
7. 打开浏览器，输入网址 [http://192.168.0.8:5601](http://192.168.0.8:5601) 检查一下 Kibana 是否正常运行。（需要提供上上一步设置的用户名密码）
  ![install successfully](/img/get-started-with-elasticsearch/install-successfully.jpg)

## 使用

`elastic` 官方已经给出了很多使用案例，包括日志分析、机器学习（需要付费解锁😄）、网络安全监测等等。这里就不深入了，仅介绍入门使用：使用 `elasticsearch` 的来增强关系型数据库的全文搜索能力。

首先需要插入部分数据（官方支持一键导入测试数据，此处略过）。




## 参考链接

- [Get started with Elasticsearch, Kibana and the Elastic Stack](https://www.elastic.co/start)
- [Set up minimal security for Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.16/security-minimal-setup.html)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Python Elasticsearch Client](https://elasticsearch-py.readthedocs.io/en/stable/)
- [@elastic/elasticsearch - npm](https://www.npmjs.com/package/@elastic/elasticsearch)
