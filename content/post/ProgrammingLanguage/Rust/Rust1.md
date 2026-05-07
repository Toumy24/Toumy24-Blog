---
title: "通用语言教程-Rust 篇【1】基础语法"
date: 2026-05-08T09:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 是一门专注于**安全性、并发性与高性能**的系统级编程语言。它不依赖垃圾回收器（GC），而是通过独特的**所有权系统**在编译期保证内存安全，兼具 C/C++ 的性能与更高的开发安全性。Rust 常用于操作系统、嵌入式开发、WebAssembly、游戏引擎等对性能要求极高的领域。

> 如果你有 C++ 或 Python 的基础，你会发现 Rust 的部分概念似曾相识，但它的所有权机制是全新的思维方式，需要一些时间适应。

## 从 Hello Sekai 认识 Rust

每一门语言的入门都从 Hello Sekai 开始。首先确保你已安装 Rust 工具链，可通过 [rustup.rs](https://rustup.rs/) 一键安装。

```bash
# 检查安装是否成功
rustc --version
cargo --version
```

### 第一个 Rust 程序

新建文件 `main.rs`，写入以下代码：

```rust
fn main() {
    println!("Hello, Sekai!");
}
```

使用 `rustc` 编译并运行：

```bash
rustc main.rs
./main   # Linux / macOS
.\main.exe  # Windows
```

输出：

```text
Hello, Sekai!
```

实际开发中，我们更多使用 Cargo（Rust 的包管理与构建工具）来管理项目：

```bash
cargo new hello_sekai  # 新建项目
cd hello_sekai
cargo run              # 编译并运行
```

> `println!` 是一个**宏**（注意末尾的 `!`），不是普通函数。宏在 Rust 中十分常见，后续会详细介绍。

## 变量与常量

### 变量绑定

Rust 使用 `let` 声明变量，**变量默认是不可变的（immutable）**：

```rust
fn main() {
    let x = 5;
    println!("x = {}", x);

    // x = 6; // 错误！默认不可变，不能重新赋值
}
```

若需要可变变量，添加 `mut` 关键字：

```rust
fn main() {
    let mut y = 10;
    println!("y = {}", y);
    y = 20;  // 可以修改
    println!("y = {}", y);
}
```

### 变量遮蔽（Shadowing）

Rust 允许用同名变量"遮蔽"旧变量，遮蔽后可以改变类型：

```rust
fn main() {
    let z = 5;
    let z = z + 1;       // 遮蔽，此时 z = 6
    let z = z * 2;       // 再次遮蔽，此时 z = 12
    println!("z = {}", z); // 12

    // 遮蔽允许改变类型，与 mut 不同
    let spaces = "   ";       // &str 类型
    let spaces = spaces.len(); // usize 类型（遮蔽）
    println!("spaces = {}", spaces); // 3
}
```

### 常量

常量使用 `const` 声明，**必须标注类型**，且不可使用 `mut`：

```rust
const MAX_SCORE: u32 = 100_000; // 下划线可用作数字分隔符，增强可读性
// 等价于 C++ 中的 const int MAX_SCORE = 100000;

fn main() {
    println!("最高分: {}", MAX_SCORE);
}
```

## 基本数据类型

Rust 是**静态强类型语言**，编译器在大多数情况下可以自动推断类型，但也可以显式标注。

### 整数类型

| 类型 | 位数 | 范围（有符号） |
|------|------|----------------|
| `i8`  | 8  | -128 ~ 127 |
| `i16` | 16 | -32768 ~ 32767 |
| `i32` | 32 | -2³¹ ~ 2³¹-1（**默认整数类型**）|
| `i64` | 64 | -2⁶³ ~ 2⁶³-1 |
| `i128`| 128| 极大范围 |
| `isize` | 与平台相关 | 指针大小 |
| `u8` ~ `u128`, `usize` | 同上 | 无符号，范围翻倍 |

```rust
fn main() {
    let a: i32 = -42;
    let b: u64 = 1_000_000;
    let c = 0xFF;        // 十六进制
    let d = 0o77;        // 八进制
    let e = 0b1111_0000; // 二进制
    let f = b'A';        // 字节（u8）

    println!("{} {} {} {} {} {}", a, b, c, d, e, f);
    // 输出：-42 1000000 255 63 240 65
}
```

### 浮点类型

```rust
fn main() {
    let x = 2.0;       // f64（默认浮点类型）
    let y: f32 = 3.14; // f32

    println!("{} {}", x, y);
}
```

### 布尔类型

```rust
fn main() {
    let t: bool = true;
    let f = false; // 类型推断为 bool

    println!("{} {}", t, f); // true false
}
```

### 字符类型

Rust 的 `char` 类型表示一个**Unicode 标量值**（4字节），可以表示任意 Unicode 字符：

```rust
fn main() {
    let c = 'z';
    let emoji = '😊';
    let chinese = '中';

    println!("{} {} {}", c, emoji, chinese);
}
```

> 注意：Rust 的 `char` 使用**单引号**，字符串使用**双引号**，不能混用。

## 输出格式

`println!` 宏支持丰富的格式化输出：

```rust
fn main() {
    let name = "Rust";
    let version = 2021;
    let pi = 3.14159;

    // 基本占位
    println!("语言: {}, 版本: {}", name, version);

    // 命名参数
    println!("{lang} is awesome!", lang = name);

    // 调试格式（:?）常用于打印复杂类型
    let arr = [1, 2, 3];
    println!("{:?}", arr);    // [1, 2, 3]
    println!("{:#?}", arr);   // 美化输出

    // 数字格式
    println!("{:.2}", pi);       // 保留两位小数：3.14
    println!("{:08.2}", pi);     // 宽度为8，补零：00003.14
    println!("{:b}", 42_u32);    // 二进制：101010
    println!("{:x}", 255_u32);   // 十六进制：ff
    println!("{:o}", 8_u32);     // 八进制：10
}
```

## 输入

Rust 的标准输入需要引入 `std::io`：

```rust
use std::io;

fn main() {
    let mut input = String::new(); // 创建可变字符串

    println!("请输入你的名字：");
    io::stdin()
        .read_line(&mut input)  // 读取一行，追加到 input
        .expect("读取失败");     // 错误处理（后续章节详解）

    let input = input.trim(); // 去除首尾空白（包括换行符）
    println!("你好，{}！", input);
}
```

> 与 Python 的 `input()` 相比，Rust 的输入略显繁琐，但这些步骤确保了内存安全与错误处理的明确性。

若需要将输入转换为数字：

```rust
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("读取失败");

    let num: i32 = input.trim().parse().expect("请输入一个整数");
    println!("你输入的数字是: {}", num);
}
```
