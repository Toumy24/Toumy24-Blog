---
title: "前端教程-JavaScript 篇【2】基础语法"
date: 2025-11-05T15:00:00+08:00
timezone: UTC+8
tags: ["前端","JavaScript","基础语法"]
categories: 
  - 计算机语言
  - 前端语言
draft: false
math: true
---

## 前言

由于JavaScript的语法与C/C++非常相似，所以不过多赘述类似的语法部分。

## 变量

JS是动态类型语言，变量的类型可以自动判断，不需要声明变量的类型。  
变量的声明方式有以下几种：

- `var` 声明变量，可以重复声明，可以跨块使用
- `let` 声明变量，只能在当前块内使用，不能重复声明，不能跨块使用
- `const` 声明常量，只能在当前块内使用，不能重复声明，不能跨块使用

```javascript
// var 声明变量
var a = 10;
var b = "hello";

// let 声明变量
let c = 20;
let d = "sekai";

// const 声明常量
const e = 30;
const f = "javascript";
```

由于历史问题，`var`声明变量会产生很多不明的作用域问题，所以生产环境中建议使用`let`或`const`声明，避免使用`var`。

对于不需要重新赋值的量，建议默认使用`const`。

## 数据类型

JS是动态类型语言，可以自动判断类型为以下几种：

#### 数字

JS只有一种数字类型，没小数点有小数点都可以，支持科学计数法。

```javascript
var num1 = 10;
var num2 = 3.14;
var num3 = 1.2e3; // 1.2 * 10^3
```

#### 字符串

JS的字符串用单引号或双引号表示，支持转义字符。

```javascript
var str1 = "hello";
var str2 = 'sekai';
var str3 = "I'm a string.";
```

#### 布尔值

JS有两个布尔值，`true`和`false`。

```javascript
var bool1 = true;
var bool2 = false;
```

#### 数组

JS的数组可以存储不同类型的数据，可以用方括号`[]`表示。

```javascript
var arr1 = [1, 2, 3];
var arr2 = ["apple", "banana", "orange"];
```

#### 对象