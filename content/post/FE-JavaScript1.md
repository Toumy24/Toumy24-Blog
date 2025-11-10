---
title: "前端教程-JavaScript 篇【1】基础语法"
date: 2025-11-05T14:00:00+08:00
timezone: UTC+8
tags: ["前端","JavaScript","基础语法"]
categories: 
  - 计算机语言
  - 前端语言
draft: false
math: true
---

## 什么是 JavaScript？

JavaScript是一门基于ECMAScript标准的脚本语言，是一种动态类型、弱类型、基于原型的语言。

JavaScript最初由Netscape公司的Brendan Eich开发，目的是为了给网页增加动态功能；与HTML这种标记语言不同的是，JavaScript是一个真正的编程语言。

## JavaScript程序结构

JavaScript可以直接嵌入进HTML中，只需要将JavaScript代码放在`<script>`标签中即可，就像这样：

```html
<!DOCTYPE html>
<html>
<head>
    <title>title</title>
</head>
<body>
	<h1>Hello, Sekai!</h1>
	<script>
		// 这里编写JavaScript代码
	</script>
</body>
</html>
```

一般建议将JavaScript代码放在`<head>`标签和`<body>`标签中。

对于单独的JavaScript文件，可以将文件名后缀改为`.js`，并在`<script>`标签中指定文件路径：

```html
<!DOCTYPE html>
<html>
<head>
    <title>title</title>
</head>
<body>
    <h1>Hello, Sekai!</h1>
    <script src="./index.js"></script>
</body>
</html>
```

还可以在代码块中导入需要的模块：

```html
<!DOCTYPE html>
<html>
<head>
    <title>title</title>
</head>
<body>
    <h1>Hello, Sekai!</h1>
    <script>
        // 导入模块
        import { ... } from './index.js';
        // 使用模块
        ...
    </script>
</body>
</html>
```