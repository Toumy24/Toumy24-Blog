---
title: "通用语言教程-Rust 篇【6】Trait 与泛型"
date: 2026-05-07T14:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","Trait","泛型"] 
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

如果说所有权是 Rust 的安全基石，那么 **Trait（特征）** 与**泛型（Generics）** 就是 Rust 实现代码复用与抽象的核心工具。

- **Trait** 类似于其他语言的接口（Interface）或抽象类，定义了一组行为规范
- **泛型** 类似于 C++ 的模板（Template），让代码可以处理多种类型

两者结合，是 Rust 实现**零成本抽象**的关键所在。

## 泛型

### 泛型函数

在函数签名中使用类型参数 `<T>` 即可定义泛型函数：

```rust
// 非泛型版本：只能处理 i32
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// 泛型版本：可以处理任意支持比较的类型
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    // T: PartialOrd 表示 T 必须实现 PartialOrd（可比较大小）
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大数: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符: {}", largest(&chars));
}
```

### 泛型结构体

```rust
// 泛型结构体，T 可以是任意类型
struct Point<T> {
    x: T,
    y: T,
}

// 也可以使用多个类型参数
struct Pair<T, U> {
    first: T,
    second: U,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Point<T> {
        Point { x, y }
    }

    fn x(&self) -> &T {
        &self.x
    }
}

// 还可以为特定类型单独实现方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

fn main() {
    let int_point = Point::new(5, 10);
    let float_point = Point::new(1.0, 4.0);

    println!("x = {}", int_point.x());
    println!("到原点距离: {:.2}", float_point.distance_from_origin()); // 4.12

    let pair = Pair { first: "hello", second: 42 };
    println!("{} {}", pair.first, pair.second);
}
```

> **零成本抽象**：Rust 的泛型在编译时会进行**单态化（Monomorphization）**，编译器会为每个实际用到的类型生成专用代码，运行时没有任何额外开销，与手写各类型版本性能完全相同。

## Trait（特征）

### 定义与实现 Trait

Trait 定义了一组方法签名，实现了某 Trait 的类型必须提供这些方法的具体实现：

```rust
// 定义 Trait，类似 Java 的 interface
trait Describable {
    fn describe(&self) -> String; // 必须实现的方法（抽象方法）

    fn short_desc(&self) -> String { // 有默认实现的方法（可以覆盖）
        format!("简介: {}", self.describe())
    }
}

struct Article {
    title: String,
    content: String,
}

struct Tweet {
    username: String,
    text: String,
}

// 为 Article 实现 Describable
impl Describable for Article {
    fn describe(&self) -> String {
        format!("文章《{}》: {}", self.title, self.content)
    }
}

// 为 Tweet 实现 Describable
impl Describable for Tweet {
    fn describe(&self) -> String {
        format!("@{}: {}", self.username, self.text)
    }

    // 覆盖默认实现
    fn short_desc(&self) -> String {
        format!("推文 by @{}", self.username)
    }
}

fn main() {
    let article = Article {
        title: String::from("Rust入门"),
        content: String::from("Rust是一门系统级语言..."),
    };
    let tweet = Tweet {
        username: String::from("rustlang"),
        text: String::from("Rust 2024 Edition发布！"),
    };

    println!("{}", article.describe());
    println!("{}", article.short_desc()); // 使用默认实现
    println!("{}", tweet.short_desc());   // 使用覆盖实现
}
```

### Trait 作为函数参数

使用 `impl Trait` 语法，可以让函数接受任意实现了某 Trait 的类型：

```rust
// impl Trait 语法（语法糖）
fn notify(item: &impl Describable) {
    println!("通知: {}", item.describe());
}

// 等价的 Trait Bound 语法（更通用）
fn notify_generic<T: Describable>(item: &T) {
    println!("通知: {}", item.describe());
}

// 多个 Trait 约束（用 + 连接）
use std::fmt::Display;
fn notify_display<T: Describable + Display>(item: &T) {
    println!("{}", item); // 需要 Display
    println!("{}", item.describe()); // 需要 Describable
}

// where 子句（当约束复杂时更清晰）
fn compare_and_display<T, U>(t: &T, u: &U)
where
    T: Describable + Display,
    U: Describable,
{
    println!("T: {}", t);
    println!("U描述: {}", u.describe());
}
```

### 常用标准库 Trait

Rust 标准库定义了大量常用 Trait，了解它们非常重要：

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq)] // derive 宏自动实现常用 Trait
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

// 手动实现 Display Trait（控制 println!("{}", ...) 的输出格式）
impl fmt::Display for Color {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "rgb({}, {}, {})", self.r, self.g, self.b)
    }
}

// 实现加法运算符重载（通过 Add Trait）
use std::ops::Add;

impl Add for Color {
    type Output = Color;
    fn add(self, other: Color) -> Color {
        Color {
            r: self.r.saturating_add(other.r), // saturating_add 防止溢出
            g: self.g.saturating_add(other.g),
            b: self.b.saturating_add(other.b),
        }
    }
}

fn main() {
    let red   = Color { r: 255, g: 0, b: 0 };
    let green = Color { r: 0, g: 255, b: 0 };

    let mixed = red.clone() + green.clone(); // clone 来自 Clone Trait

    println!("{}", red);    // rgb(255, 0, 0)     —— Display
    println!("{:?}", mixed); // Color { r: 255, g: 255, b: 0 } —— Debug

    println!("{}", red == red.clone()); // true —— PartialEq
}
```

| 常用 Trait | 说明 | derive 支持 |
|------------|------|-------------|
| `Debug` | 调试格式输出 `{:?}` | ✅ |
| `Display` | 用户显示格式 `{}` | ❌ 需手动 |
| `Clone` | 显式深拷贝 `.clone()` | ✅ |
| `Copy` | 隐式按位复制（栈类型） | ✅ |
| `PartialEq` / `Eq` | `==` 运算符 | ✅ |
| `PartialOrd` / `Ord` | 比较大小 `<` `>` | ✅ |
| `Hash` | 可用作 HashMap 键 | ✅ |
| `Iterator` | 迭代器协议 | ❌ 需手动 |
| `From` / `Into` | 类型转换 | 部分 ✅ |

### 自定义迭代器

实现 `Iterator` Trait 可以让自定义类型支持 `for` 循环及所有迭代器方法：

```rust
struct Countdown {
    count: u32,
}

impl Countdown {
    fn new(start: u32) -> Countdown {
        Countdown { count: start }
    }
}

impl Iterator for Countdown {
    type Item = u32; // 迭代器产出的元素类型

    fn next(&mut self) -> Option<u32> {
        if self.count > 0 {
            self.count -= 1;
            Some(self.count + 1)
        } else {
            None // 返回 None 表示迭代结束
        }
    }
}

fn main() {
    let countdown = Countdown::new(5);

    // 支持 for 循环
    for n in countdown {
        print!("{} ", n); // 5 4 3 2 1
    }
    println!();

    // 支持所有迭代器方法（因为实现了 Iterator Trait）
    let sum: u32 = Countdown::new(10).sum();
    println!("1到10的和: {}", sum); // 55

    let doubled: Vec<u32> = Countdown::new(5).map(|x| x * 2).collect();
    println!("{:?}", doubled); // [10, 8, 6, 4, 2]
}
```
