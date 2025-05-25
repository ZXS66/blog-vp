---
title: C# 动态类型
date: 2020-11-17 15:08:11
tags: [csharp, dynamic, anonymous type, var]
---

以前大家常说，虽说 `C#` 是强类型的静态编程语言，数据类型都在编译的时候已经确定了，不支持运行时更改数据类型（像 `JS` 或者 `Python` 那样）。但是在某些特定场景，开发者就是希望 `C#` 支持动态类型，怎么办。比如以下场景：

1. 数据由数据库中的 `JSON` 字符串反序列化得出，但反序列化后数据的属性不定；
2. 某个方法的某个参数，它可以是类型A，也可以是类型B（类似于 `C++` 或者 `TypeScript` 中的 [Union](https://en.cppreference.com/w/cpp/language/union) 类型），但是我不想因为这个简单的场景，去定义一个父类或者接口。

针对于此，自 `C# 4.0` (`.Net 4.5`) 开始即推出了 `dynamic` 类型。`dynamic` 类型的变量，在编译的时候不会类型检查，所以运行时可以更改数据类型（就像 `JS` 或者 `Python` 那样）。大部分场景，`dynamic` 类型变量，就像 `object` 类型变量一样，可以使用 `ToString()` 等方法，并且可以使用 `GetType` 方法获取运行时当前变量的实际数据类型。

即便有如此便利的工具，我个人还是不建议大家频繁使用这个关键字。就像 `TypeScript` 不推荐大家使用 `any` 关键字一样。能够解决问题，但不是最佳实践。

## 与 object 类型的区别

`C#` 中所有类型都直接或间接继承于 `Object` 类型，原始数据类型（`int`、`float` 等等）也不例外！我们可以把任意类型定义为 `object` 类型，比如 `object i = 666;`。这里面涉及装箱和拆箱的问题，此处就不展开了。但是使用 `dynamic` 就不涉及装拆箱操作，看起来更丝滑，更像是一个动态类型编程语言了。

## 与 var 声明的变量区别

与大多数现代编程语言一样，`C#` 支持使用 `var` 声明变量，自带类型推断。表面上看，`var` 也是可以声明任意类型的变量，但是 `dynamic` 类型和 `var` 的变量完全不一样。

### 动态类型和静态类型

`var` 关键字虽然可以存储任意类型的变量，但是其类型一旦确定（在**编译**的时候，**推断**得出）**不可变更**。`dynamic` 的类型则是**运行时**由编译器得出。声明为类型1之后仍可重新赋值为类型2，**可变更**。

### `var` 需要初始化，~~`dynamic` 不用~~

保持一个简单的想法在脑子里，`C#` 的 `var` 只是一个语法糖，我们可以在写代码时候偷懒，不必书写完整的类型名称，编译器会在编译的时候替我们自动补全，但是毕竟 `C#` 是一门强类型的编程语言，数据类型在编译的时候必须指定。所以，类似于 `JS` 或者 `Python` 中 `var temp;` 或者 `var temp = null;` 这样书写风格的语句，是会报错的。

~~`dynamic temp;` 这样的书写风格倒是没毛病，但是个人不建议。~~

### `dynamic` 类型变量可以作为函数参数或者函数返回值，`var` 不可以

原因和上面一点一样。`var` 仅仅是语法糖，实际上是有数据类型的，由编译器编译时推断得出。如果 `var` 作为函数的参数/返回值类型，他从何推断？？一切少了右半部分赋值操作的 `var` 使用方法都是错误的。

使用 `dynamic` 就没有这些烦恼。

### `var` 只能在方法体内使用，不能用作类实例的属性。

↑ 原因同上。

## 与 Anonymous Type （匿名类型） 变量区别

`Anonymous` 类型（匿名类型）的变量，一般都是结合 `var` 使用得出的。 `Anonymous` 类型的变量，其实也是一种类型的，只不过对于开发者不可见（开发者也不用知道其类型），编译器及 IDE 都会自动推断出来 `Anonymous` 类型变量的各个属性。详细参见下图：

![Anonymous type, source](/img/csharp-dynamic-type/anonymous-type.png)

![Anonymous type, compiled assembly](/img/csharp-dynamic-type/anonymous-type-2.png)

我的理解是这样的，`Anonymous` 类型是一种泛型，类似于元组 `Tuple`，不同的是，你不需要书写 `Tuple` 或者 `Anonymous` 这样的关键字。<ZLink link="https://docs.microsoft.com/en-us/dotnet/standard/base-types/choosing-between-anonymous-and-tuple"/>

其实，更常见的场景是，我们在用 `LINQ` 的时候会用到 `Anonymous` 类型 <ZLink link="https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/features-that-support-linq#anonymous-types"/>。

## 引用链接

- [Using type dynamic (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/types/using-type-dynamic)
- [Dynamic Data Type In C#](https://www.c-sharpcorner.com/UploadFile/f0b2ed/dynamic-data-type-in-C-Sharp/)
- [Dynamic Type in C#](https://thedotnetguide.com/dynamic-type-in-csharp)
- [Anonymous Types in C#](https://thedotnetguide.com/anonymous-types-in-csharp/)
