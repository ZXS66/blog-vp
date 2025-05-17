---
title: ASP.NET 极简缓存及日志

date: 2020-09-06 15:14:51
tags: [asp.net, cache, caching, log, logging, memorycache]
---

声明：本文仅仅是我的个人工作回顾，各位看官不必深抠字眼。本人一贯主张点到为止、够用就行，省下来的时间留给自己多去钻研自己感兴趣的东西。😄

开篇闲聊：缓存和日志，是软件从原型走向产品必经之路。前者能显著提升性能，后者则是快速定位问题及后期用户数据挖掘的基础。二者都是传统软件项目的基础中间件，往复杂了写，能够写出非常庞大的企业级软件（如 [Redis](https://redis.io) 和 [Logstash](https://www.elastic.co/logstash)），但也可以非常简单，简单到百行代码即可搞定日常大部分应用场景。

考虑到我即将要下手的这个**项目体量够小**，且公司/部门没有现成的基础中间件，想要安装第三方的缓存/日志软件又**极其麻烦且不保证审核通过**，所以打算手撸一个。

本文目录：

- [缓存](#缓存)
- [日志](#日志)
- [ASP.NET应用](#aspnet应用)
- [参考链接](#参考链接)

## 缓存

提到缓存，小团队的选择，[Memcached](https://www.memcached.org/) 还是 [Redis](https://redis.io/)？稍大一点的团队可以直接购买阿里云或其他云平台的相关产品，省时省力有保证。大型企业基本上都有自己的中间件了。

前面说到，我打算自己造轮子，采用的是 C# 自带的 [System.Runtime.Caching.MemoryCache](https://docs.microsoft.com/en-us/dotnet/api/system.runtime.caching.memorycache)。Web 和非 Web 应用都可以使用。好处是基于内存（和目标应用公用一个 app pool 或进程），支持任意数据类型，避免同目标应用间的网络通信，支持简单的过期策略；坏处就是无法与其他因应用共享数据，无法启动自恢复（随着 app pool 或进程的终止而清空），数据量大了还会影响目标应用的性能。

Linus Torvalds 大神说过：

> Talk is cheap, show me ~~the fucking~~ code.

``` csharp
using System;
using System.Runtime.Caching;

namespace ProjX.Common.Caching
{
    /// <summary>
    /// super lite version of caching
    /// </summary>
    public static class LiteCache
    {
        /// <summary>
        /// default eviction and expiration details for a specific cache entry
        /// </summary>
        private static readonly CacheItemPolicy policy = new CacheItemPolicy()
        {
            //AbsoluteExpiration = DateTime.Now.AddHours(4),
            SlidingExpiration = TimeSpan.FromHours(4)
        };
        /// <summary>
        /// caching storage
        /// </summary>
        private static MemoryCache _store
        {
            get
            {
                return MemoryCache.Default;
            }
        }
        /// <summary>
        /// get the cache item by key
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="key"></param>
        /// <returns></returns>
        public static T Get<T>(string key) where T : class
        {
            return _store.Get(key) as T;
        }
        /// <summary>
        /// set value by key, nothing changed if value is null
        /// </summary>
        /// <param name="key"></param>
        /// <param name="value"></param>
        public static void Set(string key, object value)
        {
            if (value == null) return;
            _store.Set(key, value, policy);
        }
        /// <summary>
        /// remove cache entry by key
        /// </summary>
        /// <param name="key"></param>
        /// <returns>If the entry is found in the cache, the removed cache entry; otherwise, null.</returns>
        public static object Remove(string key)
        {
            return _store.Remove(key);
        }
        public static void RemoveAll()
        {
            // flush all
            foreach (var entry in _store)
                _store.Remove(entry.Key);
        }
    }
}
```

这样简单封装之后就可以使用了。

这个缓存也可以在 web.config 或 app.config 中配置的，详细请参考[此文档](https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/file-schema/runtime/add-element-for-namedcaches)。

使用方法过于简单，这里就不贴代码了。

## 日志

说起日志，以前我使用的是 [Log4Net](https://logging.apache.org/log4net/)，但是我嫌弃配置麻烦，本打算尝试 [NLog](https://nlog-project.org/)、[Serilog](https://serilog.net) 或者 [Microsoft.Extensions.Logging](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging/?view=aspnetcore-3.1) 其中一个的，但是都要安装第三方依赖包，就暂时打消了这个念头，

上菜！

``` csharp
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading;

namespace ProjX.Common.Logging
{
    /// <summary>
    /// represents a EventLog record
    /// </summary>
    public struct EventLog
    {
        public int ID { get; set; }
        /// <summary>
        /// log levels: Debug, Info, Error
        /// </summary>
        public string Level { get; set; }
        /// <summary>
        /// predefined code for the response
        /// </summary>
        public string EventCode { get; set; }
        /// <summary>
        /// when the event occurred
        /// </summary>
        public DateTime EventTime { get; set; }
        /// <summary>
        /// form data for investigation
        /// </summary>
        public string EventData { get; set; }
        /// <summary>
        /// who trigger the event
        /// </summary>
        public string User { get; set; }
        /// <summary>
        /// execution callstack of the event
        /// </summary>
        public string Callstack { get; set; }
        /// <summary>
        /// detail message when error occurred
        /// </summary>
        public string ErrorMessage { get; set; }
    }
    /// <summary>
    /// represents the Level of the log
    /// </summary>
    public static class LogLevel
    {
        public static readonly string Debug = "Debug";
        public static readonly string Info = "Info";
        public static readonly string Error = "Error";
    }
    public static class Logger
    {
        public static void Debug(EventLog log)
        {
            Log(log, LogLevel.Debug);
        }
        public static void Info(object eventData, string user, long duration = 0)
        {
            EventLog log = new EventLog()
            {
                EventCode = string.Empty,
                EventData = eventData == null ? string.Empty : Newtonsoft.Json.JsonConvert.SerializeObject(eventData),
                EventTime = DateTime.Now,
                Level = LogLevel.Info,
                User = user,
                Callstack = Environment.StackTrace,
                ErrorMessage = $"duration:{Convert.ToInt32(duration)}ms"
            };
            Info(log);
        }
        public static void Info(EventLog log)
        {
            Log(log, LogLevel.Info);
        }
        public static void Error(string eventCode, object eventData, string user, Exception exception)
        {
            EventLog log = new EventLog()
            {
                EventCode = eventCode,
                EventData = eventData == null ? string.Empty : Newtonsoft.Json.JsonConvert.SerializeObject(eventData),
                EventTime = DateTime.Now,
                Level = LogLevel.Error,
                User = user,
                Callstack = Environment.StackTrace,
                ErrorMessage = ProjX.Common.Utility.GetExceptionMessage(exception)
            };
            Error(log);
        }
        public static void Error(EventLog log)
        {
            Log(log, LogLevel.Error);
        }
        private static void Log(EventLog log, string level)
        {
            if (default(EventLog).Equals(log))
            {
                return;
            }
            log.Level = level;
            theQueue.Enqueue(log);
            if (theQueue.Count >= CAPACITY)
            {
                // the queue is full, persist them to database
                ThreadPool.QueueUserWorkItem((Object state) =>
                {
                    PersistenceEventLogs();
                });
            }
        }
        private static void PersistenceEventLogs()
        {
            if (theQueue.Count >= CAPACITY)
            {
                lock (theQueue)
                {
                    if (theQueue.Count >= CAPACITY)
                    {
                        // sp: just insert the log
                        string spName = "[ProjX].[log]";
                        // Constants.ConnectionString_Log comes from your application setting file
                        using (SqlConnection con = new SqlConnection(Constants.ConnectionString_Log))
                        {
                            con.Open();
                            using (SqlCommand cmd = con.CreateCommand())
                            {
                                cmd.CommandText = spName;
                                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                                // TODO: bulk insert
                                EventLog defaultLog = default(EventLog);
                                while (theQueue.Count > 0)
                                {
                                    try
                                    {
                                        EventLog log = theQueue.Dequeue();
                                        if (defaultLog.Equals(log))
                                            continue;
                                        cmd.Parameters.Clear();
                                        cmd.Parameters.AddWithValue("level", log.Level);
                                        cmd.Parameters.AddWithValue("eventCode", log.EventCode ?? string.Empty);
                                        cmd.Parameters.AddWithValue("eventData", log.EventData ?? string.Empty);
                                        cmd.Parameters.AddWithValue("user", log.User ?? string.Empty);
                                        cmd.Parameters.AddWithValue("callstack", formatCallstack(log.Callstack));
                                        cmd.Parameters.AddWithValue("errorMessage", log.ErrorMessage ?? string.Empty);
                                        cmd.Parameters.AddWithValue("eventTime", log.EventTime);
                                        if (ENABLED)
                                            cmd.ExecuteNonQuery();
                                    }
                                    catch (Exception)
                                    {
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        /// <summary>
        /// remove lines which start with "at System."
        /// </summary>
        /// <param name="callstack"></param>
        /// <returns></returns>
        private static string formatCallstack(string callstack)
        {
            if (string.IsNullOrWhiteSpace(callstack)) return string.Empty;
            return string.Join
                (
                    Environment.NewLine,
                    callstack.Split(new string[1] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries).
                        Where(_ => !_.Contains("at System."))
                ).Trim();
        }
        /// <summary>
        /// the capacity of the log queue
        /// </summary>
        private static readonly int CAPACITY = 128;
        private static readonly Queue<EventLog> theQueue = new Queue<EventLog>(CAPACITY);
        /// <summary>
        /// enabled by default, you can disabled it temporary for special build
        /// </summary>
        private static readonly bool ENABLED = true;
    }
}
```

创建表及出入的存储过程此处省略。

使用方法在下一节讲 👇👇👇

## ASP.NET应用

缓存和日志都是跟业务逻辑无关的代码，如果直接做侵入式的代码修改，将会使得原有代码变得冗长、重复，变得越来越难以维护。这里就涉及到一个概念，[面向方面编程](https://stackoverflow.com/questions/242177/what-is-aspect-oriented-programming)(Aspect-Oriented Programming)。Python 使用 [decorator](https://wiki.python.org/moin/PythonDecorators) 实现 AOP，Java Spring 也支持 AOP，C# 也有自己的想法 😄

我用的是 Attribute 这个特性。

以下代码同时使用了上两节实现的缓存及日志。

``` csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Proj.Common.Caching;
using Proj.Common.Logging;
using EventLog = Proj.Common.Logging.EventLog;

namespace ProjX.API
{
    // reference: https://www.davidhaney.io/custom-asp-net-mvc-action-result-cache-attribute/

    /// <summary>
    /// Cache result &amp; Log request and response information for ActionResult of Controllers
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    //public class ActionCacheLogAttribute : Attribute, IActionFilter
    public class APICacheLogAttribute : ActionFilterAttribute
    {
        /// <summary>
        /// Gets a value that indicates whether multiple filters are allowed
        /// </summary>
        public override bool AllowMultiple { get { return false; } }
        /// <summary>
        /// default constructor of APICacheLogAttribute
        /// </summary>
        /// <param name="cacheable">set the variable as false if you want to log only (no caching)</param>
        public APICacheLogAttribute(bool cacheable = true)
        {
            this.cacheable = cacheable;
        }
        private readonly bool cacheable;

        /// <summary>
        /// Occurs when an action is executing.
        /// </summary>
        /// <param name="actionContext">The filter context.</param>
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            start_time = DateTime.Now.Ticks;
            if (cacheable)
            {
                // try to get result from cache
                string cacheKey = CreateCacheKey(actionContext);
                string cacheValue = LiteCache.Get<string>(cacheKey);
                if (!string.IsNullOrWhiteSpace(cacheValue))
                {
                    // Set the response
                    actionContext.Response = actionContext.Request.CreateResponse(System.Net.HttpStatusCode.OK);
                    actionContext.Response.Content = new StringContent(cacheValue, Encoding.UTF8, "application/json");
                }
            }
            // logging
            EventLog log = GetLogEntry(actionContext);
            Logger.Info(log);
        }
        /// <summary>
        /// ticks when the request begin
        /// </summary>
        private long start_time;
        /// <summary>
        /// Occurs when an action has executed.
        /// </summary>
        /// <param name="actionExecutedContext">The filter context.</param>
        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
        {
            var actionContext = actionExecutedContext.ActionContext;
            Exception e = actionExecutedContext.Exception;
            if (e != null)
            {
                // Don't cache errors
                EventLog err = GetLogEntry(actionContext, e);
                Logger.Error(err);
            }
            else if (cacheable)
            {
                // Get the cache key from HttpContext Items
                string cacheKey = CreateCacheKey(actionContext);
                // Cache the result of the action method
                LiteCache.Set(cacheKey, actionExecutedContext.Response.Content.ReadAsStringAsync().Result);
            }
            // logging the process
            EventLog log = GetLogEntry(actionContext);
            Logger.Info(log);
        }
        /// <summary>
        /// Creates the cache key.
        /// </summary>
        /// <returns>The cache key</returns>
        private string CreateCacheKey(HttpActionContext actionContext)
        {
            string controllerName = actionContext.ActionDescriptor.ControllerDescriptor.ControllerType.FullName,
                actionName = actionContext.ActionDescriptor.ActionName;
            Dictionary<string, object> arguments = actionContext.ActionArguments;
            string form = arguments != null && arguments.Count > 0 ? Newtonsoft.Json.JsonConvert.SerializeObject(arguments) : string.Empty;
            return $"{controllerName}.{actionName}^.^{form}";
        }
        private EventLog GetLogEntry(HttpActionContext actionContext, Exception exception = null)
        {
            Dictionary<string, object> arguments = actionContext.ActionArguments;
            string reqBody = arguments != null && arguments.Count > 0 ? Newtonsoft.Json.JsonConvert.SerializeObject(arguments) : string.Empty;

            string controllerName = actionContext.ActionDescriptor.ControllerDescriptor.ControllerType.FullName,
                actionName = actionContext.ActionDescriptor.ActionName;

            int duration = Convert.ToInt32(TimeSpan.FromTicks(DateTime.Now.Ticks - start_time).TotalMilliseconds);
            HttpRequestMessage req = actionContext.Request;
            return new EventLog()
            {
                User = req.Headers.UserAgent.ToString(),
                EventCode = controllerName + '`' + actionName,
                EventTime = DateTime.Now,
                EventData = reqBody,
                Callstack = Environment.StackTrace,
                ErrorMessage = exception == null
                    ? $"duration:{duration}ms"
                    : ProjX.Common.Utility.GetExceptionMessage(exception)
            };
        }
    }
}
```

从源码可以看出，该 `[APICacheHelper]` 可以 ① 将上次请求返回的数据先序列化成**字符串**然后缓存起来，下次相同的请求进来了直接从缓存读取结果并返回；② 记录每次 Action 执行的结果。

使用方法有两种：

1. 同时启用缓存和日志(默认)
    ``` csharp
    /// <summary>
    /// return the mock data
    /// </summary>
    /// <returns></returns>
    [APICacheLog]
    public IEnumerable<object> MockData()
    {
        return new List<object>()
        {
            new {foo = "foo", bar = "bar"},
            new {foo = "foo1", bar = "bar1"},
        };
    }
    ```
2. 只启用日志，无缓存。应用场景：非查询类（新增、删除、更新）数据请求、返回结果仅依赖函数参数列表（唯一输入确定唯一输出，没有全局/环境变量依赖）、返回结果非 JSON。
   ``` csharp
    /// <summary>
    /// sample WebAPI to update data
    /// </summary>
    /// <returns></returns>
    [APICacheLog(cacheable:false)]
    public bool UpdateRecord()
    {
        return true;//just for test
    }
   ```

就是这么简单。

## 参考链接

- [Caching in .NET Framework Applications](https://docs.microsoft.com/en-us/dotnet/framework/performance/caching-in-net-framework-applications)
- [Memory Cache in C#](https://www.c-sharpcorner.com/article/memory-cache-in-c-sharp/)
