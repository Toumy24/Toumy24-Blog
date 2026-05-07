---
title: "通用语言教程-Rust 篇【3】所有权与借用"
date: 2026-05-07T11:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","所有权","借用"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

如果说 Rust 有什么最独特的设计，那一定是**所有权系统（Ownership）**。它是 Rust 在不使用垃圾回收器（GC）的情况下保证内存安全的核心机制，也是很多初学者觉得 Rust 难学的主要原因。

理解所有权，是真正掌握 Rust 的第一道门槛。

## 内存管理的三种方式

在了解所有权之前，先回顾一下主流语言的内存管理方式：

- **手动管理**（C/C++）：程序员手动 `malloc/free`，灵活但容易出现内存泄漏、悬垂指针等问题
- **垃圾回收**（Java、Python、Go）：运行时自动回收，安全方便，但有性能开销与停顿
- **所有权系统**（Rust）：编译期静态分析，在编译时就确定内存的分配与释放，**零运行时开销且内存安全**

## 所有权的三条规则

Rust 的所有权遵循以下三条核心规则：

1. Rust 中每个值都有一个**所有者（owner）**
2. 值在任意时刻**有且只有一个所有者**
3. 当所有者**离开作用域**，这个值将被**自动丢弃（drop）**

```rust
fn main() {
    {
        let s = String::from("hello"); // s 进入作用域，s 是这个字符串的所有者
        // 可以使用 s
        println!("{}", s);
    } // s 的作用域结束，Rust 自动调用 drop，释放内存

    // println!("{}", s); // 错误！s 已经被释放
}
```

## 移动（Move）

将一个值赋给另一个变量时，所有权会**转移（Move）**，原来的变量将**失效**：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的所有权移动到 s2

    // println!("{}", s1); // 错误！s1 已经失效（所有权已转移）
    println!("{}", s2); // 正常使用 s2
}
```

> 这与 Python 中的赋值完全不同。Python 中 `s2 = s1` 只是让两个变量指向同一个对象，而 Rust 中所有权只能有一个持有者。

对于**基本类型**（如整数、浮点数、布尔值、字符），赋值时会自动**复制（Copy）**而不是移动：

```rust
fn main() {
    let x = 5;
    let y = x; // 整数实现了 Copy trait，这里是复制，不是移动
    println!("x = {}, y = {}", x, y); // 两者都可以正常使用
}
```

## 克隆（Clone）

如果需要对堆上的数据进行**深拷贝**，可以显式调用 `.clone()`：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 深拷贝，s1 和 s2 各自拥有独立的数据

    println!("s1 = {}, s2 = {}", s1, s2); // 两者都可以使用
}
```

> `.clone()` 有额外的内存和时间开销，通常用在真正需要独立副本的场景。

## 函数与所有权

所有权的转移在函数调用中同样适用：

```rust
fn print_string(s: String) { // s 获得所有权
    println!("{}", s);
} // s 在此被 drop，内存释放

fn main() {
    let s = String::from("hello");
    print_string(s); // 所有权移入函数

    // println!("{}", s); // 错误！s 的所有权已转移进函数
}
```

如果希望函数调用后仍能使用变量，可以将所有权**返回**：

```rust
fn process(s: String) -> String {
    println!("处理: {}", s);
    s // 将所有权移回给调用者
}

fn main() {
    let s1 = String::from("hello");
    let s2 = process(s1); // 所有权转入再转出
    println!("{}", s2);   // 正常使用
}
```

这样做比较繁琐，Rust 提供了更优雅的解决方案——**引用与借用**。

## 引用与借用（References & Borrowing）

**引用**允许你使用一个值而不获取它的所有权，这称为**借用（Borrowing）**：

```rust
fn calculate_length(s: &String) -> usize { // & 表示引用
    s.len()
} // s 是引用，不拥有所有权，所以这里不会 drop

fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s); // 传入引用
    println!("'{}' 的长度是 {}", s, len); // s 仍然有效！
}
```

### 可变引用

默认的引用是**不可变的**，若需要通过引用修改值，需要使用**可变引用 `&mut`**：

```rust
fn change(s: &mut String) {
    s.push_str(", world"); // 通过可变引用修改字符串
}

fn main() {
    let mut s = String::from("hello"); // 原变量也必须是 mut
    change(&mut s);
    println!("{}", s); // hello, sekai
}
```

### 借用的规则

Rust 对引用有严格的规则，以防止数据竞争：

```rust
fn main() {
    let mut s = String::from("hello");

    // 规则1：可以有多个不可变引用
    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2); // 没问题

    // 规则2：可变引用在同一时刻只能有一个
    let r3 = &mut s;
    // let r4 = &mut s; // 错误！不能同时存在两个可变引用

    // 规则3：不可变引用与可变引用不能同时存在
    // let r5 = &s;
    // let r6 = &mut s; // 错误！
    println!("{}", r3);
}
```

> **一句话总结借用规则**：在同一作用域内，同一数据要么只有**任意多个不可变引用**，要么只有**一个可变引用**，两种情况不能同时存在。

## 切片（Slice）

切片是对一段连续数据的**引用**，不拥有所有权：

```rust
fn main() {
    // 字符串切片
    let s = String::from("hello sekai");
    let hello = &s[0..5];  // 等价于 &s[..5]
    let world = &s[6..11]; // 等价于 &s[6..]
    println!("{} {}", hello, world); // hello sekai

    // 数组切片
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..3]; // [2, 3]
    println!("{:?}", slice);
}
```

字符串字面量 `"hello"` 本质上就是一个字符串切片 `&str`，它是对二进制文件中字符串数据的引用：

```rust
fn main() {
    let s: &str = "hello, sekai"; // &str 类型，不可变引用，存储在程序的静态数据段
    println!("{}", s);
}
```
