---
title: "通用语言教程-Rust 篇【6】Trait 与泛型"
date: 2026-05-07T14:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","Trait","泛型","零成本抽象"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

如果说所有权解决了"内存安全"问题，那么 Trait 和泛型解决的是"代码复用"问题。

Rust 实现代码抽象有两种主要方式：**泛型（静态分发）** 和 **Trait 对象（动态分发）**。它们在运行时的行为截然不同，理解这个区别是写出高效 Rust 代码的关键。

## 泛型（Generics）

### 泛型函数

泛型用类型参数 `<T>` 表示"这里放一个类型，具体是什么运行时才知道"——但实际上在编译期就已经确定了：

```rust
// 只能处理 i32 的版本
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}

// 泛型版本：T 必须实现 PartialOrd（支持 > 比较）
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大数: {}", largest(&numbers)); // 100

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符: {}", largest(&chars)); // y
}
```

### 单态化（Monomorphization）：零成本的秘密

编译器处理泛型代码时，会做**单态化**——为每个实际使用到的类型生成一份专用代码：

```text
// 你写的：
fn largest<T: PartialOrd>(list: &[T]) -> &T { ... }

// 编译器生成的（概念上）：
fn largest_i32(list: &[i32]) -> &i32 { ... }   // 针对 i32
fn largest_char(list: &[char]) -> &char { ... } // 针对 char
```

这意味着泛型代码和手写各类型版本的**性能完全相同**——没有任何运行时类型查找或间接调用的开销。这就是 Rust 的**零成本抽象（Zero-cost abstraction）**。

代价是编译时间增加、二进制体积变大（每种类型一份代码），但运行时是纯粹的静态调用。

### 泛型结构体

```rust
#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

// impl 块也需要声明 <T>
impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }

    fn x(&self) -> &T { &self.x }
    fn y(&self) -> &T { &self.y }
}

// 可以为特定类型单独实现额外方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

fn main() {
    let p1 = Point::new(5, 10);         // Point<i32>
    let p2 = Point::new(1.0_f64, 4.0); // Point<f64>

    println!("p1.x = {}", p1.x());
    println!("到原点距离: {:.2}", p2.distance_from_origin()); // 4.12
    // p1.distance_from_origin(); // 编译错误：i32 版本没有这个方法
}
```

## Trait：定义共同的行为

Trait 定义了一组方法签名，任何实现了该 Trait 的类型都必须提供这些方法。这类似于 Java/C# 的 Interface，但功能更强大（可以有默认实现，可以作为泛型约束）。

### 定义与实现

```rust
trait Summary {
    // 必须实现的方法（无默认实现）
    fn summarize_author(&self) -> String;

    // 有默认实现的方法（子类可以覆盖）
    fn summarize(&self) -> String {
        format!("（{}撰写）", self.summarize_author())
    }
}

struct NewsArticle {
    headline: String,
    author:   String,
    content:  String,
}

struct Tweet {
    username: String,
    content:  String,
}

impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }

    // 覆盖默认实现
    fn summarize(&self) -> String {
        format!("{}, by {} — {}", self.headline, self.author, &self.content[..20])
    }
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // 不覆盖 summarize，使用默认实现
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust 2024 Edition 发布"),
        author:   String::from("Ferris"),
        content:  String::from("今天，Rust 社区正式发布了..."),
    };
    let tweet = Tweet {
        username: String::from("rustlang"),
        content:  String::from("Rust 越来越好用了！"),
    };

    println!("{}", article.summarize());
    println!("{}", tweet.summarize()); // 使用默认实现
}
```

### Trait 作为参数：静态分发 vs 动态分发

这是 Rust 中非常重要的选择点，值得深入理解。

**方式一：`impl Trait` / Trait Bound（静态分发）**

```rust
// impl Trait 写法（语法糖）
fn notify(item: &impl Summary) {
    println!("消息: {}", item.summarize());
}

// 等价的泛型 Trait Bound 写法
fn notify_generic<T: Summary>(item: &T) {
    println!("消息: {}", item.summarize());
}

// 多个 Trait 约束
fn notify_display<T: Summary + std::fmt::Display>(item: &T) {
    println!("{}", item);
    println!("{}", item.summarize());
}

// where 子句（约束复杂时更易读）
fn compare<T, U>(t: &T, u: &U)
where
    T: Summary + std::fmt::Debug,
    U: Summary + Clone,
{
    println!("{:?}", t);
    println!("{}", u.summarize());
}
```

编译器会为每种具体类型生成专用的 `notify` 函数（单态化），调用开销与直接调用方法相同。

**方式二：`dyn Trait`（动态分发，Trait 对象）**

```rust
fn notify_dynamic(item: &dyn Summary) {
    // 运行时通过 vtable（虚函数表）查找实际方法
    println!("消息: {}", item.summarize());
}

fn main() {
    let article = NewsArticle { /* ... */
        headline: String::from("新闻"),
        author:   String::from("作者"),
        content:  String::from("内容内容内容内容内容"),
    };
    let tweet = Tweet {
        username: String::from("user"),
        content:  String::from("推文"),
    };

    // 可以存储不同类型到同一个 Vec（静态分发做不到）
    let items: Vec<Box<dyn Summary>> = vec![
        Box::new(NewsArticle { headline: String::from("h"), author: String::from("a"), content: String::from("aaaaaaaaaaaaaaaaaaa") }),
        Box::new(Tweet { username: String::from("u"), content: String::from("t") }),
    ];

    for item in &items {
        println!("{}", item.summarize());
    }
}
```

**vtable（虚函数表）**：每个 `dyn Trait` 的胖指针由两部分组成：
1. 指向数据的指针
2. 指向该类型的 vtable 的指针

vtable 里存了各方法的函数指针，运行时通过它查找实际调用哪个函数。

| 方式 | 分发时机 | 性能 | 灵活性 |
|------|---------|------|-------|
| `impl Trait` / `<T: Trait>` | 编译期（单态化） | 最优（无间接调用） | 同一函数调用必须是同一类型 |
| `dyn Trait` | 运行时（vtable） | 有间接调用开销 | 可以混合不同类型 |

**经验法则**：默认用泛型（静态分发）；当你需要**在运行时存储不同类型**（比如插件系统、事件回调），再用 `dyn Trait`。

### 常用标准库 Trait

```rust
use std::fmt;
use std::ops::Add;

#[derive(Debug, Clone, PartialEq)]
struct Vector2D {
    x: f64,
    y: f64,
}

// Display Trait：控制 {} 格式化输出
impl fmt::Display for Vector2D {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// Add Trait：重载 + 运算符
impl Add for Vector2D {
    type Output = Vector2D; // 关联类型：指定 + 的返回类型
    fn add(self, other: Vector2D) -> Vector2D {
        Vector2D {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let v1 = Vector2D { x: 1.0, y: 2.0 };
    let v2 = Vector2D { x: 3.0, y: 4.0 };

    println!("{}", v1);       // (1, 2)     ← Display
    println!("{:?}", v1);     // Vector2D { x: 1.0, y: 2.0 } ← Debug
    println!("{}", v1 == v1.clone()); // true ← PartialEq + Clone

    let v3 = v1 + v2;         // ← Add
    println!("{}", v3);       // (4, 6)
}
```

| Trait | 作用 | `#[derive]` |
|-------|------|------------|
| `Debug` | `{:?}` 调试输出 | ✅ |
| `Display` | `{}` 用户友好输出 | ❌ 需手动 |
| `Clone` | `.clone()` 深拷贝 | ✅ |
| `Copy` | 隐式按位复制 | ✅（需所有字段也是 Copy）|
| `PartialEq` / `Eq` | `==` 运算符 | ✅ |
| `PartialOrd` / `Ord` | 比较大小 | ✅ |
| `Hash` | 可用作 HashMap 键 | ✅ |
| `Default` | `Default::default()` 默认值 | ✅ |
| `From` / `Into` | 类型转换 | 部分 ✅ |
| `Iterator` | 迭代器协议 | ❌ 需手动 |

### 自定义迭代器

任何实现了 `Iterator` Trait 的类型，都能使用 `for` 循环以及所有迭代器适配器（`map`、`filter`、`take` 等）：

```rust
struct Fibonacci {
    a: u64,
    b: u64,
}

impl Fibonacci {
    fn new() -> Fibonacci {
        Fibonacci { a: 0, b: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64; // 迭代器产出的元素类型

    fn next(&mut self) -> Option<u64> {
        let next_val = self.a;
        // 更新状态
        let new_b = self.a + self.b;
        self.a = self.b;
        self.b = new_b;
        Some(next_val) // 斐波那契数列无穷，永远返回 Some
    }
}

fn main() {
    // take(10) 限制只取前 10 个
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("{:?}", fibs); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // 配合所有迭代器方法
    let sum: u64 = Fibonacci::new().take(10).sum();
    println!("前10项之和: {}", sum); // 88

    let big_fibs: Vec<u64> = Fibonacci::new()
        .take(20)
        .filter(|&x| x > 100)
        .collect();
    println!("前20项中 > 100 的: {:?}", big_fibs);
}
```

实现 `next` 方法，你就免费获得了整个迭代器适配器生态系统——这就是 Trait 的威力。
