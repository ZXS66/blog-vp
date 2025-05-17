---
title: Entity Framework 最佳实践
date: 2020-07-08 18:39:49
tags: [entity framework, c#, best practices]
---

平时如果需要搭建原型，选择 [Entity Framework](https://docs.microsoft.com/en-us/ef/)（后简称 EF）将会帮助您**更快地交付和迭代**。

但是，EF 虽好，可不要贪杯哦。原型阶段使用 EF 完全莫得问题，但是到后期项目变的越来越大，需要真正交付产品时，建议还是切换到其他的 ORM 框架或者 ADO.NET，因为，这里面真的有很多莫名坑，新手，甚至是有一定经验的程序员都会不知不觉地踩进去。

## EF 访问数据的架构

EF 其实就是负责 C# Object 和数据库数据之间的映射，让 .Net 开发人员操作 Object 就像操作数据库一样丝滑，背后 EF 会自动转换 sql 代码。

祭一张 EF 数据访问架构图

![Entity Framework architecture for accessing data](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/ef/media/wd-efarchdiagram.gif)

*来自 [Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/ef/overview)*

下面就是我这个踩坑小能手用泪水和汗水总结的笔记，希望下次再用 EF 的时候，能够减少入坑次数。

## 及时调用 `.ToList()` 方法 ！！！

这第一条，自然是有它的道理的。只怪自己当初没有好好理解透彻 EF 深层原理。

EF 默认会做很多操作，优化我们的查询，比如延迟发送请求，再比如合并查询请求。这就引进了一个常见的错误，

`.ToList()` 方法就是告诉立即执行查询，

## 序列化配置

把 Controller 返回结果序列化成 JSON 字符串时，在 `Global.asax.cs` 文件 `Application_Start` 方法中添加以下代码：

``` CSharp
/// append below code to the end of Application_Start
var serializerSettings = GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings;
/// no returned loop reference objects
serializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
/// decrease json string length by removing null value
serializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
```

## API 仅返回页面需要的字段

好习惯！虽然累了点，但是优秀的程序员始终将高性能和可扩展性放在心里 🙂

## 查询表时，删除关联表结果

同上一点相关，当数据库的表有外键时，如果直接查询该表，它相关联表的记录也会跟着返回，不仅拖慢查询，序列化返回页面时也会徒增流量。解决办法是返回结果集前，把相应的属性置空。

```CSharp
/// <summary>
/// the EF will return referencing tables along with current table value,
/// this method will prevent this default behavior
/// </summary>
/// <typeparam name="T"></typeparam>
/// <param name="data"></param>
/// <returns></returns>
public static IEnumerable<T> ReturnEFResult<T>(IEnumerable<T> data) where T : class, new()
{
    if (IsNullOrEmptyList(data)) return data;
    // remove all ICollection type fields
    List<T> ls = new List<T>();
    //Type icollectionType = typeof(ICollection<>);
    //var props = typeof(T).GetProperties().Where(_ => !_.PropertyType.IsAssignableFrom(icollectionType));
    
    var props = typeof(T).GetProperties().Where(_ =>
    {
        //return !ImplementsInterface(_.PropertyType, icollectionType);
        var pt = _.PropertyType;
        return pt.Name != "ICollection`1" && !pt.Namespace.StartsWith("your.namespace.here");
    }).ToList();
    foreach (T d in data)
    {
        T tmp = new T();
        foreach (var p in props)
        {
            p.SetValue(tmp, p.GetValue(d));
        }
        ls.Add(tmp);
    }
    return ls;
}
```
## 新增、更新或删除记录，记得调用 `SaveChanges()` 方法提交改动

多撸几次自然就记住了，不浪费各自精力了。

## (待续)

是的，因为懒，就到这里了，鸽了。。。

## 参考链接

- [Performance considerations for EF 4, 5, and 6](https://docs.microsoft.com/en-us/ef/ef6/fundamentals/performance/perf-whitepaper)
- [Tips to improve Entity Framework Performance](https://www.dotnettricks.com/learn/entityframework/tips-to-improve-entity-framework-performance)
- [Six ways to build better Entity Framework (Core and EF6) applications](https://www.thereformedprogrammer.net/six-ways-to-build-better-entity-framework-core-and-ef6-applications/)


