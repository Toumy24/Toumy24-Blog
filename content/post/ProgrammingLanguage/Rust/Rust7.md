---
title: "通用语言教程-Rust 篇【7】错误处理与生命周期"
date: 2026-05-08T15:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","错误处理","生命周期"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

本章涉及两个 Rust 中非常重要但也容易让初学者头疼的概念：

- **错误处理**：Rust 强制要求开发者显式处理每一个可能的错误，不存在未捕获的异常
- **生命周期**：Rust 编译器用来确保引用永远有效的机制，也是借用检查器的底层基础

---

## 错误处理

### 不可恢复错误：panic!

`panic!` 会立即终止当前线程，并打印错误信息，适用于程序遇到无法继续执行的严重错误：

```rust
fn main() {
    let v = vec![1, 2, 3];
    // v[99]; // 越界访问，触发 panic：index out of bounds

    panic!("遇到了严重错误，程序终止");
}
```

> 类比 C++ 中的 `assert` 或直接崩溃，但 Rust 的 panic 会提供完整的调用栈信息。

### 可恢复错误：Result

大多数错误是"可恢复"的，应该使用 `Result<T, E>` 进行处理：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?; // ? 运算符：若 Err 则提前返回
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

fn main() {
    match read_file("hello.txt") {
        Ok(content) => println!("文件内容:\n{}", content),
        Err(e)      => println!("读取失败: {}", e),
    }
}
```

### ? 运算符（错误传播）

`?` 是 Rust 最常用的错误处理语法糖，它会：

1. 若结果是 `Ok(val)`，将 `val` 取出继续执行
2. 若结果是 `Err(e)`，立即从当前函数返回 `Err(e)`

```rust
use std::num::ParseIntError;

// 不使用 ? 的繁琐写法
fn parse_and_double_verbose(s: &str) -> Result<i32, ParseIntError> {
    let n = match s.trim().parse::<i32>() {
        Ok(val) => val,
        Err(e)  => return Err(e),
    };
    Ok(n * 2)
}

// 使用 ? 的简洁写法（等价）
fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n = s.trim().parse::<i32>()?; // ? 替代了上面的 match
    Ok(n * 2)
}

fn main() {
    println!("{:?}", parse_and_double("21"));    // Ok(42)
    println!("{:?}", parse_and_double("abc"));   // Err(...)
    println!("{:?}", parse_and_double("  10 ")); // Ok(20)
}
```

### 自定义错误类型

在实际项目中，通常需要定义自己的错误类型来整合多种错误来源：

```rust
use std::fmt;
use std::num::ParseIntError;

// 定义自定义错误枚举
#[derive(Debug)]
enum AppError {
    ParseError(ParseIntError),
    DivisionByZero,
    NegativeNumber(i32),
}

// 实现 Display，方便打印错误信息
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::ParseError(e)      => write!(f, "解析错误: {}", e),
            AppError::DivisionByZero     => write!(f, "错误: 除数不能为零"),
            AppError::NegativeNumber(n)  => write!(f, "错误: 不接受负数 {}", n),
        }
    }
}

// 实现 From，让 ? 运算符可以自动转换错误类型
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::ParseError(e)
    }
}

fn safe_sqrt(s: &str) -> Result<f64, AppError> {
    let n: i32 = s.trim().parse()?; // ParseIntError 自动转换为 AppError
    if n < 0 {
        return Err(AppError::NegativeNumber(n));
    }
    Ok((n as f64).sqrt())
}

fn main() {
    let inputs = ["16", "-4", "abc", "25"];
    for input in inputs {
        match safe_sqrt(input) {
            Ok(result) => println!("√{} = {:.2}", input, result),
            Err(e)     => println!("输入 '{}' 失败: {}", input, e),
        }
    }
}
```

### unwrap 与 expect

在原型开发或确定不会出错的场景下，可以使用 `unwrap` / `expect` 快速取出结果：

```rust
fn main() {
    // unwrap：Ok 时返回值，Err 时 panic
    let n: i32 = "42".parse().unwrap();

    // expect：与 unwrap 相同，但可以自定义 panic 信息（更推荐）
    let m: i32 = "10".parse().expect("请确保输入是有效整数");

    println!("{} {}", n, m);

    // 生产代码中应避免 unwrap，用 ? 或 match 代替
}
```

---

## 生命周期

### 为什么需要生命周期？

生命周期（Lifetime）是 Rust 编译器用来追踪引用有效期的机制，其目的是**防止悬垂引用（dangling reference）**：

```rust
// 下面这段代码无法编译，因为引用的生命周期比被引用的数据更长
fn dangling() -> &String {  // 错误：返回对局部变量的引用
    let s = String::from("hello");
    &s // s 在函数结束时被 drop，引用变成悬垂指针
}
```

大多数情况下，编译器可以自动推断生命周期（**生命周期省略规则**），无需手动标注。但当编译器无法判断时，需要我们显式标注。

### 生命周期标注语法

生命周期参数以 `'` 开头，通常用 `'a`、`'b` 等字母表示：

```rust
// 这个函数返回两个字符串中较长的那个
// 编译器无法确定返回值的生命周期来自 x 还是 y，需要手动标注
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    // 'a 表示：返回的引用的生命周期不超过 x 和 y 中较短的那个
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("最长: {}", result); // 在 s2 有效的作用域内使用，没问题
    }
    // println!("{}", result); // 错误！s2 已被 drop，result 可能是悬垂引用
}
```

### 结构体中的生命周期

当结构体持有引用时，需要在结构体定义上标注生命周期，表示结构体实例的生命周期不能超过它所持有的引用：

```rust
// 表示 Excerpt 实例的生命周期不超过 part 引用所指向的数据
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn announce(&self, announcement: &str) -> &str {
        println!("公告: {}", announcement);
        self.part // 返回生命周期为 'a 的引用
    }
}

fn main() {
    let novel = String::from("从前有座山。山里有座庙...");
    let first_sentence;
    {
        let i = novel.find('。').unwrap_or(novel.len());
        first_sentence = &novel[..i];
    }
    let excerpt = Excerpt { part: first_sentence };
    println!("{}", excerpt.part);
}
```

### 'static 生命周期

`'static` 是特殊的生命周期，表示引用在**整个程序运行期间**都有效。字符串字面量就是 `'static` 的：

```rust
fn main() {
    let s: &'static str = "我是字符串字面量，存在于整个程序的生命周期";
    println!("{}", s);
}
```

### 综合示例：生命周期 + 泛型 + Trait Bound

```rust
use std::fmt::Display;

// 这是 Rust 中最复杂的函数签名之一，综合了三个特性：
fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display, // ann 必须实现 Display
{
    println!("公告: {}", ann);
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("hello");
    let s2 = String::from("hi");
    let result = longest_with_announcement(
        &s1,
        &s2,
        "今天是 Rust 学习第七课",
    );
    println!("最长: {}", result);
}
```

> **实践建议**：编写代码时先不标注生命周期，若编译器报错再添加。大多数日常代码都无需手动标注，编译器的自动推断已经足够强大。
