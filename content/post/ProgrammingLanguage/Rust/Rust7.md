---
title: "通用语言教程-Rust 篇【7】错误处理与生命周期"
date: 2026-05-07T15:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","错误处理","Result","生命周期"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## panic 与不可恢复错误

Rust 的错误分为两类：可以被调用者处理的**可恢复错误**（用 `Result`），以及不应该被调用者"兜住"的**不可恢复错误**（用 `panic!`）。

`panic!` 在程序遇到一个"不应该发生"的状态时触发，比如数组越界、`unwrap` 一个 `None`、显式调用 `panic!("message")`。

panic 发生后有两种行为，由 `Cargo.toml` 控制：

```toml
[profile.release]
panic = "abort"   # 直接终止进程，不展开栈，产物更小

[profile.dev]
# 默认是 "unwind"，栈展开后清理资源，可以被测试框架捕获
```

默认行为（`unwind`）是沿着调用栈向上展开，依次调用每个栈帧里的 `drop`，最终终止程序并打印 backtrace。设置环境变量 `RUST_BACKTRACE=1` 可以看到详细调用栈：

```
RUST_BACKTRACE=1 cargo run
```

`abort` 模式直接结束进程，不清理资源，让操作系统回收内存，程序体积更小，常用于嵌入式或 WebAssembly 场景。

## Result 深入

第 4 章简介了 `Result`，这里补充完整用法。

### ? 运算符的展开过程

在返回 `Result` 的函数里，`?` 对 `Result` 的作用等价于以下 match 表达式。

在介绍展开过程之前，先看通用语法格式：

```text
// ? 只能用在返回 Result<T, E> 或 Option<T> 的函数内
// 用于 Result：成功则取出 Ok 内的值继续执行，失败则提前 return Err(e.into())
let 值 = 可能失败的操作()?;

// 用于 Option：有值则取出 Some 内的值，None 则提前 return None
let 值 = 可能返回None的操作()?;

// 链式调用，每一步都可能提前返回
let 值 = 第一步()?.方法()?.第二步()?;
```

以下是 `?` 的完整展开过程：

```rust
// 以下两段代码等价：

// 使用 ?
let val = some_operation()?;

// 不使用 ?
let val = match some_operation() {
    Ok(v)  => v,
    Err(e) => return Err(e.into()),
};
```

注意 `e.into()`：如果当前函数声明的错误类型和 `some_operation` 的错误类型不同，只要实现了 `From<SourceError> for TargetError`，`?` 会自动调用 `into()` 完成转换。这让一个函数里可以用 `?` 传播多种不同类型的错误，只要它们都能转换成函数签名里声明的错误类型。

### 在 main 函数里用 ?

`main` 可以返回 `Result`：

```rust
use std::fs;
use std::io;

fn main() -> Result<(), io::Error> {
    let content = fs::read_to_string("hello.txt")?;
    println!("{content}");
    Ok(())
}
```

失败时，Rust 会打印错误信息并以非零退出码结束程序。

### 自定义错误类型

真实项目里，函数可能遭遇多种不同来源的错误。惯用做法是定义一个枚举把它们统一起来：

```rust
use std::fmt;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
    Custom(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e)     => write!(f, "IO 错误: {}", e),
            AppError::Parse(e)  => write!(f, "解析错误: {}", e),
            AppError::Custom(s) => write!(f, "错误: {}", s),
        }
    }
}

// 为每种底层错误实现 From，让 ? 能自动转换
impl From<io::Error> for AppError {
    fn from(e: io::Error) -> Self {
        AppError::Io(e)
    }
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        AppError::Parse(e)
    }
}
```

实现了 `From` 之后，函数里涉及 `io::Error` 或 `ParseIntError` 的操作，直接用 `?` 就能传播，无需手动转换：

```rust
use std::fs;

fn parse_config(path: &str) -> Result<i32, AppError> {
    let content = fs::read_to_string(path)?; // io::Error 自动转 AppError::Io
    let num: i32 = content.trim().parse()?;  // ParseIntError 自动转 AppError::Parse
    Ok(num)
}
```

### thiserror 库简化自定义错误

手动写 `Display` 和 `From` 的样板代码很繁琐，`thiserror` crate 用宏生成它们：

```toml
[dependencies]
thiserror = "1"
```

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("解析错误: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("错误: {0}")]
    Custom(String),
}
```

`#[error("...")]` 生成 `Display` 实现，`#[from]` 生成 `From` 实现，代码量大幅减少。

### unwrap 和 expect 的适用场景

`unwrap()` 和 `expect()` 在 `Err` 或 `None` 时直接 panic，适合以下场景：

原型代码或示例代码，不想在每处写错误处理时临时使用；你在逻辑上能确定某个操作不会失败（比如 `"42".parse::<i32>().expect("字面量解析不会失败")`）；测试代码里，让失败直接 panic 比返回 `Result` 更清晰。

在库代码里避免使用 `unwrap`，调用者应该有权自己决定如何处理错误。

## 生命周期

借用规则保证了引用不会比它指向的数据活得更长。但有时编译器没有足够信息来自动推断引用的存活范围，需要程序员显式标注，这就是**生命周期（lifetime）**。

生命周期不是一个新概念，它只是对引用的存活时间的描述。标注不会改变引用的实际存活时间，只是帮助编译器验证代码的正确性。

### 悬垂引用的例子

```rust
fn main() {
    let result;
    {
        let x = 5;
        result = &x; // 编译错误：x 在内层块结束时被 drop，result 成为悬垂引用
    }
    println!("{result}");
}
```

### 函数里的生命周期标注

这个函数返回两个字符串切片中较长的那个，需要生命周期标注。

通用语法格式：

```text
// 函数中标注生命周期（把参数声明放在 <> 里，紧跟函数名）
fn 函数名<'a>(参数1: &'a 类型, 参数2: &'a 类型) -> &'a 类型 { ... }
//          ^^                                               ^^
//          声明生命周期参数 'a                                返回值与参数的生命周期相同

// 多个不同生命周期
fn 函数名<'a, 'b>(x: &'a 类型, y: &'b 类型) -> &'a 类型 { ... }

// 结构体持有引用时
struct 结构名<'a> {
    字段: &'a 类型,   // 结构体的存活时间不能超过这个引用
}
impl<'a> 结构名<'a> { // impl 块也要重复生命周期参数
    fn 方法(&self) -> &'a 类型 { ... }
}
```

```rust
// 编译错误：编译器不知道返回的引用来自 x 还是 y，
// 也就不知道返回值的生命周期和哪个参数相关
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

加上生命周期标注告诉编译器：返回值的生命周期和两个参数中较短的那个一样长：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xy");
        result = longest(s1.as_str(), s2.as_str());
        println!("{result}"); // 在 s2 有效的范围内使用，没问题
    }
    // println!("{result}"); // 这里 s2 已经不存在了，如果 result 指向 s2 会出错
    // 编译器通过生命周期标注发现这种使用不安全，会报错
}
```

生命周期标注以 `'` 开头，通常用单个小写字母如 `'a`、`'b`。它们是类型参数的一部分，跟泛型参数一起写在 `<>` 里。

### 生命周期省略规则

大多数情况下，编译器能根据三条固定规则自动推断生命周期，不需要你手动标注：

规则一：每个引用参数都有自己独立的生命周期参数。

规则二：如果只有一个引用参数，那么返回值的生命周期和这个参数相同。

规则三：如果有多个引用参数，但其中有 `&self` 或 `&mut self`，那么返回值的生命周期和 `self` 相同。

```rust
// 这两个函数不需要手动标注：

fn first_word(s: &str) -> &str { // 规则一赋予参数生命周期，规则二赋予返回值相同生命周期
    let bytes = s.as_bytes();
    for (i, &b) in bytes.iter().enumerate() {
        if b == b' ' { return &s[..i]; }
    }
    s
}

struct Important<'a> {
    content: &'a str,
}

impl<'a> Important<'a> {
    fn announce(&self, msg: &str) -> &str { // 规则三：返回值生命周期 = self
        println!("{msg}");
        self.content
    }
}
```

### 结构体中的生命周期

如果结构体里存引用，必须标注生命周期，告诉编译器结构体的存活时间不能超过那个引用：

```rust
struct Excerpt<'a> {
    text: &'a str, // 结构体不能比 text 指向的数据活得更长
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("找不到句号");
    let excerpt = Excerpt { text: first_sentence }; // excerpt 不能在 novel 之后使用
    println!("{}", excerpt.text);
}
```

### 'static 生命周期

`'static` 是最长的生命周期，表示整个程序运行期间都有效。字符串字面量的类型是 `&'static str`，因为它们存在程序的二进制数据段里，永远不会被释放：

```rust
fn main() {
    let s: &'static str = "永久存在";
}
```

当编译器报错提示你加 `'static` 约束时，先想想是不是真的需要数据存活这么久，而不是随手加上去。大多数情况下，应该是生命周期标注不正确，而不是需要 `'static`。
