---
title: "前端教程-HTML篇【1】基础概念"
date: 2025-11-05T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/html-5.png
tags: ["前端","HTML","基础语法"]
categories: 
  - 计算机语言
  - 前端语言
draft: false
math: true
---

## HTML简介

HTML（HyperText Markup Language）即超文本标记语言，是用于创建网页的标记语言。它是一种基于XML的标准通用标记语言，由W3C组织进行维护，是一种简单、易学、快速、可移植的网页制作语言。

**注意**：HTML是一种标记语言，不是编程语言。

## HTML基本语法

HTML使用标签来描述网页的内容结构，标签由尖括号包围，如`<html>`、`<head>`、`<body>`等。

### HTML的基础结构

HTML的基本结构如下：

```html
<!DOCTYPE html>
<!-- ↑声明文档类型为HTML5 -->
<html>
  <head>
    <meta charset="UTF-8">
    <title>网页标题</title>
  </head>
  <body>
    <!-- 网页内容 -->
  </body>
</html>
```

实际在web浏览器中显示时，只显示`<body>`标签内的内容。

### HTML元素

每个网页都是由不同的元素嵌套组成的，如上面基本结构实例中，`<html>`、`<head>`、`<body>`等都是HTML元素。

每一个元素对应两个标签，一个**开始标签**（如`<html>`）和一个**结束标签**（如`</html>`）。

没有内容的元素被称作空元素，如`<img>`、`<br>`、`<input>`等，它们的开始标签和结束标签之间没有内容，也不需要闭合，因此可以写成`<img />`、`<br />`、`<input />`的形式，即自闭合标签。注意，这在HTML5中实际上是没有必要的，但是在XHTML是必要的，因此写成这样可以同时兼容HTML5和XHTML。

### HTML属性

HTML元素可以有属性，属性是附加到元素上的额外信息，以键值对的形式出现，如`<a href="https://www.baidu.com">百度</a>`中的`href`属性就是一个属性。

HTML有许多常用的属性，详见[常用HTML属性]({{< ref "FE-html1-1.md" >}})

