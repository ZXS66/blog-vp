---
title: CSharp 去抖和节流
tags:
  - csharp
  - debounce
  - throttle
date: 2021-04-20 11:49:11
---

去抖和节流，是前端频繁提及的概念。因为前端容易触及性能问题，比如窗口滑动、鼠标重复点击等等，如果没有去抖/节流/防重复提交这些操作，页面交互极有可能变得肉眼可见的卡顿。

现在 CSharp 编程中遇到类似情况，需要将同样的原理应用于后台编程。

一般情况下，我们可以使用第三方库，比如 [Reactive Extension](https://github.com/Reactive-Extensions/Rx.NET) (类似于前端的 [RxJS](https://rxjs.dev/) )。但是，我就只是要一个去抖和节流的功能，没必要引入一个第三方库吧。现实中项目如果要引入第三方库*可能*会引入各种问题。既然如此，何不重复造个轮子 😂

> Talk is cheap, show me the code!

```cs
/// <summary>
/// <para>Provides Debounce() and Throttle() methods.
/// Use these methods to ensure that events aren't handled too frequently.</para>
/// 
/// <para>Throttle() ensures that events are throttled by the interval specified.
/// Only the last event in the interval sequence of events fires.</para>
/// 
/// <para>Debounce() fires an event only after the specified interval has passed
/// in which no other pending event has fired. Only the last event in the
/// sequence is fired.</para>
/// </summary>
public class DebounceDispatcher
{
    private CancellationTokenSource debouncer;
    /// <summary>
    /// <para>Debounce an event by resetting the event timeout every time the event is 
    /// fired. The behavior is that the Action passed is fired only after events
    /// stop firing for the given timeout period.</para>
    /// 
    /// <para>Use Debounce when you want events to fire only after events stop firing
    /// after the given interval timeout period.</para>
    /// </summary>
    /// <param name="interval">Timeout in Milliseconds</param>
    /// <param name="action">Action<object> to fire when debounced event fires</object></param>
    /// <param name="param">optional parameter</param>
    public void Debounce(int interval, Action<object> action, object param = null)
    {
        if (debouncer != null && !debouncer.IsCancellationRequested)
        {
            debouncer.Cancel();
        }
        try
        {
            debouncer = new CancellationTokenSource();
            var t = Task.Delay(interval, debouncer.Token);
            t.ContinueWith((p) =>
            {
                if (p.Status == TaskStatus.RanToCompletion)
                    action.Invoke(param);
            });
            t.Start();
        }
        catch (Exception)
        {
            // duplicated invokes, the previous one was cancelled
            System.Console.WriteLine($"[{DateTime.Now}]: task was cancelled");
        }
    }
    private long throttler = 0;
    /// <summary>
    /// <para>This method throttles events by allowing only 1 event to fire for the given
    /// timeout period. Only the last event fired is handled - all others are ignored.
    /// Throttle will fire events every timeout ms even if additional events are pending.</para>
    /// 
    /// <para>Use Throttle where you need to ensure that events fire at given intervals.</para>
    /// </summary>
    /// <param name="interval">Timeout in Milliseconds</param>
    /// <param name="action">Action<object> to fire when debounced event fires</object></param>
    /// <param name="param">optional parameter</param>
    public void Throttle(int interval, Action<object> action, object param = null)
    {
        if (throttler == 0 || (DateTime.Now.Ticks - throttler) / 10000 >= interval)
        {
            action.Invoke(param);
            throttler = DateTime.Now.Ticks;
        }
    }
}
```

- 节流很简单，就不过多解释了；
- 去抖，此处用到了三个关键函数： [Task.Delay](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.delay?view=net-5.0) （类似于 js 中 setTimeout ）、[Task.ContinueWith](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.continuewith?view=net-5.0) （类似于 js 中的 Promise.then，不同的是后者接受两个参数，分别是成功回调和错误回调，而前者仅有一个回调，成功和错误都在一个里面）、[CancellationTokenSource.Cancel](https://docs.microsoft.com/en-us/dotnet/api/system.threading.cancellationtokensource.cancel?view=net-5.0)。

## 参考链接

- [Task.Delay Method](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.delay?view=net-5.0)
- [Task.ContinueWith Method](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.continuewith?view=net-5.0)
- [CancellationTokenSource.Cancel Method](https://docs.microsoft.com/en-us/dotnet/api/system.threading.cancellationtokensource.cancel?view=net-5.0)
