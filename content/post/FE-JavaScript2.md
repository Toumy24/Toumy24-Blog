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

由于历史问题，`var`声明变量会产生很多不明的作用域问题，在ES6诞生以后，生产环境中建议使用`let`或`const`声明，避免使用`var`。

对于不需要重新赋值的量，建议默认使用`const`。

## 数据类型

JS是动态类型语言，可以自动判断类型为以下几种：

#### 数字

JS只有一种数字类型，没小数点有小数点都可以，支持科学计数法。

```javascript
const num1 = 10;
const num2 = 3.14;
const num3 = 1.2e3; // 1.2 * 10^3
```

#### 字符串

JS的字符串用单引号或双引号表示，支持转义字符。

```javascript
const str1 = "hello";
const str2 = 'sekai';
const str3 = "I'm a string.";
```

#### 布尔值

JS有两个布尔值，`true`和`false`。

```javascript
const bool1 = true;
const bool2 = false;
```

#### 数组

JS的数组可以存储不同类型的数据，可以用方括号`[]`表示，JS的数组是动态长度，不需要预先定义长度。

```javascript
const arr1 = [1, 2, 3];
const arr2 = ["apple", "banana", "orange"];
```

可以使用下标访问数组元素，也可以使用`length`属性获取数组长度。

```javascript
const arr = [1, 2, 3];
console.log(arr[0]); // 1
console.log(arr.length); // 3
```

#### 对象

JS的对象可以存储键值对，可以用花括号`{}`表示。

```javascript
const obj1 = {name: "John", age: 30};
const obj2 = {name: "Mike", age: 25, city: "New York"};
```

## 运算符

#### 算术运算符

JS支持C/C++中的所有算术运算符，不多赘述。  
相较之下，JS新增了`**` 指数运算符，`2 ** 3`等于`8`。

#### 赋值运算符

JS同样支持C/C++中的所有赋值运算符，不多赘述。
在此基础上，新增了指数赋值运算符`**=`。

值得注意的是，JS有解构赋值：

```javascript
const [a, b] = [1, 2];
console.log(a); // 1
console.log(b); // 2

const {name, age} = {name: "John", age: 30};
console.log(name); // John
console.log(age); // 30
```

#### 比较运算符

同样的，支持所有常见的比较运算符如大于小于等。

但是对于等于运算符，JS有所不同：

- `==` 相等（会进行类型转换后比较）
- `===` 严格相等（不会进行类型转换）
- `!=` 不等（会进行类型转换后比较）
- `!==` 严格不等（不会进行类型转换）

```javascript
console.log(5 == "5");   // true - 相等（类型转换）
console.log(5 === "5");  // false - 严格相等
console.log(5 != "5");   // false - 不等
console.log(5 !== "5");  // true - 严格不等
```