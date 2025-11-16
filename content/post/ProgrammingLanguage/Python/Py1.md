---
title: "通用语言教程-Python 篇【1】基础语法"
date: 2022-06-05T09:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/python.png
tags: ["Python","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Python是一门非常灵活与优雅的动态语言，它省去了静态语言的繁琐语法与程序结构，封装了大量实用功能，让用户可以专注于编写核心功能而非关心底层实现以及造轮子；这么做并非没有代价，代价就是Python的性能远远弱于市面上其他静态语言如Java、C++等，所以当涉及高性能开发时，不应该选用Python。

## 从Hello Sekai认识Python

### `print()`

`print()`的功能正如字面意义，即打印。
`print()`默认换行，若不换行可加上`end=" "`

```python
print('hello, sekai')
print('--------')
print('hello')
print('sekai') #换行输出
print('--------')
print('a', end = ' ')
print('b', end = ' ') #不换行输出
```

## Python保留字

保留字即关键字，我们不能把它们用作任何标识符名称。Python 的标准库提供了一个 keyword 模块，可以输出当前版本的所有关键字：

```console
>>> import keyword
>>> keyword.kwlist
['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue',  
'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',  
'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',  
'raise', 'return', 'try', 'while', 'with', 'yield']
```

当命名变量时，应注意避开保留字的关键字进行命名。


## Python的输入

Python的输入通过``input()``方法实现：

```Python
a = input('输入')
print(a)
```

该代码段输出用户输入内容。  
``input()``默认传入字符串类型。