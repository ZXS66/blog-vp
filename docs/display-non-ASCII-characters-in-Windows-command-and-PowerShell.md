---
title: 在 Windows 命令行和 PowerShell 中显示非 ASCII 字符
tags:
  - ascii
  - encoding
  - utf8
  - bom
date: 2022-03-04 23:14:48
---

在 `Windows` 环境下，只要使用的足够多，相信大家一定会遇到在命令行 (`cmd.exe`) 和 `PowerShell` 中显示非 `ASCII` 字符（比如中日韩字符，俗称 `CJK` 编码）的情况。但是有时候，命令行并补能够正常所有字符，取而代之的是方块 `□` 或者问号 `�`。

![PowerShell 默认显示](/img/display-non-ASCII-characters-in-Windows-command-and-PowerShell/ps-default.png)

为什么会出现这种情况？简单来讲：

> It does not make sense to have a string without knowing what encoding it uses. <ZLink link="https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/"/>
> 一个字符串如果不知道它用的编码，将毫无意义。
> <cite>Joel Spolsky</cite>

换言之，命令行之所以出现乱码，都是因为编码不对。`Windows` 命令行的编码，默认都是 `UCS-2`（即 `UTF-16`，以前是 `Java` 和 `JavaScript` 中默认编码），这在二十年前，是相当常见的编码，基本上不会存在什么问题。但随着互联网的流行，`UTF-8` 编码变得越来越流行，使用 `UTF-8` 编码存储的文件也越来越普遍，这就有冲突了。*如果感兴趣，可以看看本篇的 [参考链接](#参考链接)。*

那如何解决命令行中显示非 ASCII 字符的问题呢？

按照网上说法，如果你使用的是默认命令行 (`cmd.exe`)，那么可以使用 `chcp` 命令来设置编码，比如：

``` bat
chcp 65001
```

或者你可以在 `.bat` 文件第一行使用该命令来设置编码。

![PowerShell chcp 65001 也不行啊](/img/display-non-ASCII-characters-in-Windows-command-and-PowerShell/ps-with-chcp-65001.png)

貌似不行啊… 😕

如果你使用的是 `PowerShell`，那需要使用 `-Encoding` 参数，指定编码格式。

```
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

![PowerShell 设置编码](/img/display-non-ASCII-characters-in-Windows-command-and-PowerShell/ps-set-encoding.png)

emmm… 还是不行… 😢

其实，还有另一种方式，那就是换个 `Terminal`，比如 [Windows Terminal](https://docs.microsoft.com/en-us/windows/terminal/)，他的默认编码就是 `UTF-8` 🙂。

![Windows Terminal](/img/display-non-ASCII-characters-in-Windows-command-and-PowerShell/windows-terminal-default.png)

![Windows Terminal chcp 65001 能行？](/img/display-non-ASCII-characters-in-Windows-command-and-PowerShell/windows-terminal-with-chcp-65001.png)

## 参考链接

- [Windows Command-Line: Backgrounder](https://devblogs.microsoft.com/commandline/windows-command-line-backgrounder/)
- [Using non-ASCII characters in a cmd batch file](https://stackoverflow.com/questions/18813495/using-non-ascii-characters-in-a-cmd-batch-file)
- [Set Windows PowerShell to UTF-8 Encoding to Fix GBK Codec Can Not Encode Character Error – PowerShell Tutorial](https://www.tutorialexample.com/set-windows-powershell-to-utf-8-encoding-to-fix-gbk-codec-can-not-encode-character-error-powershell-tutorial)
- [Add emoji support to Windows Console](https://github.com/Microsoft/Terminal/issues/190)
