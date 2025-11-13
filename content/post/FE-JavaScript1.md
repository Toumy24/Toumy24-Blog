---
title: "前端教程-JavaScript 篇【1】基础概念"
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
	<h1>Hello Sekai!</h1>
	<script>
		// 这里编写JavaScript代码
	</script>
</body>
</html>
```

一般建议将JavaScript代码放在`<head>`标签和`<body>`标签中。

对于单独的JavaScript文件，可以在`<script>`标签中指定文件路径：

```html
<!DOCTYPE html>
<html>
<head>
    <title>title</title>
</head>
<body>
    <h1>Hello Sekai!</h1>
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
    <h1>Hello Sekai!</h1>
    <script>
        // 导入模块
        import { ... } from './index.js';
        // 使用模块
        ...
    </script>
</body>
</html>
```

生产实践中，不建议将全部的JS代码写在HTML中，除非需要实现的功能非常简单；否则建议将JS代码分离到单独的JS文件中，然后通过`<script>`标签引入。

那么对于单独的JS文件，有没有什么程序结构呢？  
**并没有。**

JS是一个灵活的动态语言，在编写过程中几乎没有什么固定的或被约束的程序结构，尽管它的语法和C/C++等C系语言相差无几，但实际使用起来更像Python。