---
title: MySQL 正则表达式支持多字节字符
tags:
  - mysql
  - regex
  - multi-bytes
date: 2022-06-25 17:30:04
---

# 背景

最近在工作中遇到一个小问题，就是需要一些简单的字符串匹配，自然而然想到使用正则表达式了。简单搜索了一下，`MySQL` 中如何使用正则，基本上都介绍用 [REGEXP](https://dev.mysql.com/doc/refman/8.0/en/regexp.html) 函数。

但是，这个函数有个限制，在 MySQL 8.0.4 之前的版本，它是按字节匹配的，而不是字符！换句话说，对于汉字或者 Emoji 这样多字节的字符，它不支持！

> The REGEXP and RLIKE operators work in byte-wise fashion, so they are not multibyte safe and may produce unexpected results with multibyte character sets. In addition, these operators compare characters by their byte values and accented characters may not compare as equal even if a given collation treats them as equal. <ZLink link="https://dev.mysql.com/doc/refman/5.6/en/regexp.html"/>

所以，在 MySQL 8.0.4 之前的版本，我们该如何针对多字节的字符使用正则表达式呢？

升级 MySQL？好吧，当我没问。🙊

针对一个线上的 MySQL，如果要必须要实现业务逻辑，又不能变更 MySQL，有什么好的办法？

不用正则表达式，采用 IF ELSE 语句替代？也不是不可以，但是逻辑稍负责一点，SQL 脚本就开始变得冗长、性能低下且难以维护了。

以下是我自己的经验总结，仅供参考。

# 思考

既然 MySQL 8.0.4 之前的 REGEXP 只能支持单字节，那我把多字节字符都替换成单字节字符再正则匹配不就行了？[REPLACE](https://dev.mysql.com/doc/refman/8.0/en/replace.html) 函数是支持多字节的。

# 放码

```sql
DELIMITER $$

USE `project_otis2019`$$
DROP FUNCTION IF EXISTS `fx_regexp_over_multi_characters_sample`$$

CREATE DEFINER=`zxs66`@`%` FUNCTION `fx_regexp_over_multi_characters_sample`(content TEXT) RETURNS TINYINT(4)
    COMMENT 'check if given content match specific regular expression'
BEGIN

 DECLARE normalized_content TEXT;
 SET normalized_content=REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
     REPLACE(REPLACE(REPLACE(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(content,'水果','`'),'蔬菜','`'),'牛奶','`'),'牛羊肉','`'),'杂粮','`'),
      '，',','),'；',','),'。',','),
      '种植','@'),'运输','@'),'储藏','@'),'销售','@'),'检验','@'),'保供','@'),'批发','@');

 -- the regular expression below can be revised based on your actual bussiness requirements.
 RETURN normalized_content REGEXP '`[^,;\.]*@' OR normalized_content REGEXP '@[^,;\.]*`'; 

END$$

DELIMITER ;
```

# 回顾

上述脚本仅提供一种思路，肯定不是最优解，还存在诸多弊端，其中一个显而易见的问题就是，替换掉的单字节字符不能与原来的文件内容有冲突。如果有不同意见，还请不吝赐教。
