---
title: "通用语言教程-Rust 篇【7】错误处理与生命周期"
date: 2026-05-07T15:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","错误处理","生命周期","Result","panic"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

这一章包含两个相对独立但都很重要的话题：

**错误处理**：Rust 没有异常机制，它把错误分为两类——"不可恢复的 panic"和"可恢复的 Result"。理解这个分类，以及 `?` 运算符背后的机制，是写出地道 Rust 代码的基础。

**生命周期**：借用检查器的底层工具，用来确保引用永远不会指向已经被释放的内存。大多数情况不需要手写，但遇到编译器要求标注时，必须知道为什么。

## 不可恢复错误：panic!

`panic!` 是 Rust 的"程序遇到了无法继续的错误"机制：

```rust
fn main() {
    let v = vec![1, 2, 3];
    // v[99]; // 越界访问，触发 panic：index out of bounds: the len is 3 but the index is 99

    panic!("这里遇到了无法处理的情况");
}
```

### panic 会发生什么？

Rust 提供两种 panic 行为，由 `Cargo.toml` 的 profile 配置决定：

**Unwinding（默认）**：

1. 从当前函数开始，逐层向上"展开"调用栈
2. 每层都执行析构函数（`drop`），释放该层持有的所有资源
3. 线程退出，打印错误信息和调用栈

**Abort（配置 `panic = "abort"`）**：

直接终止进程，不做任何清理，二进制体积更小，适合嵌入式场景。

```toml
# Cargo.toml
[profile.release]
panic = "abort"
```

> 对比 C++：C++ 的异常也有类似的"栈展开"机制，但 Rust 的 panic 是单独的机制，不是通用错误传播方式。Rust 中日常错误传播用 `Result`，`panic` 只用于"这里不应该发生"的情况（类似 C++ 的 `assert`）。

### 什么时候用 panic？

- 不变量被违反（代码 bug，不应该发生）
- 测试（`assert!`、`assert_eq!` 失败时 panic）
- 原型开发（`.unwrap()` 快速取值，之后再换成正式错误处理）

不应该用于：用户输入错误、文件不存在、网络超时等"预期内的失败"——这些用 `Result`。

## 可恢复错误：Result 与 ?

### ? 运算符的完整语义

`?` 是 Rust 错误处理的核心语法糖，理解它的展开过程很重要：

```rust
use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n = s.trim().parse::<i32>()?; // ? 运算符
    Ok(n * 2)
}

// 上面的 ? 等价于下面这段代码：
fn parse_and_double_expanded(s: &str) -> Result<i32, ParseIntError> {
    let n = match s.trim().parse::<i32>() {
        Ok(val)  => val,
        Err(e)   => return Err(e.into()), // .into() 调用 From trait 转换错误类型
    };
    Ok(n * 2)
}
```

注意 `.into()` / `From` 这个细节——`?` 不只是"遇到 Err 就返回"，它还会自动做**错误类型转换**。只要目标错误类型实现了 `From<源错误类型>`，`?` 就能自动转换。这是将多种错误来源统一成一个自定义错误类型的关键机制。

### 自定义错误类型

真实项目中，一个函数可能产生多种来源的错误（解析错误、IO 错误、业务逻辑错误），需要一个自定义错误枚举来统一：

```rust
use std::fmt;
use std::num::ParseIntError;
use std::io;

// 1. 定义错误枚举
#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),  // 包装标准库错误
    Io(io::Error),
    DivisionByZero,
    InvalidInput(String),
}

// 2. 实现 Display（方便打印错误信息）
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Parse(e)         => write!(f, "解析错误: {}", e),
            AppError::Io(e)            => write!(f, "IO 错误: {}", e),
            AppError::DivisionByZero   => write!(f, "除数不能为零"),
            AppError::InvalidInput(s)  => write!(f, "无效输入: {}", s),
        }
    }
}

// 3. 实现 From，让 ? 运算符能自动转换
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::Parse(e)
    }
}

impl From<io::Error> for AppError {
    fn from(e: io::Error) -> AppError {
        AppError::Io(e)
    }
}

// 4. 使用：? 会自动调用 From::from 做转换
fn process(input: &str) -> Result<i32, AppError> {
    if input.is_empty() {
        return Err(AppError::InvalidInput("输入不能为空".to_string()));
    }
    let n: i32 = input.trim().parse()?; // ParseIntError 自动转换为 AppError::Parse
    if n == 0 {
        return Err(AppError::DivisionByZero);
    }
    Ok(100 / n)
}

fn main() {
    let inputs = ["5", "0", "abc", ""];
    for input in inputs {
        match process(input) {
            Ok(result) => println!("结果: {}", result),
            Err(e)     => println!("错误: {}", e),
        }
    }
}
```

### thiserror：减少样板代码

实际项目中，手写 `Display` 和 `From` 很繁琐，通常用 `thiserror` 库的宏简化：

```toml
# Cargo.toml
[dependencies]
thiserror = "1.0"
```

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("解析错误: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("除数不能为零")]
    DivisionByZero,

    #[error("无效输入: {0}")]
    InvalidInput(String),
}
// thiserror 自动生成 Display 和 From 的实现
```

### unwrap 与 expect 的适用场景

```rust
fn main() {
    // unwrap：Ok 时取值，Err 时 panic
    let n: i32 = "42".parse().unwrap();

    // expect：和 unwrap 相同，但 panic 信息更清晰（推荐优先用 expect）
    let m: i32 = "10".parse().expect("端口号必须是有效整数");

    // 适合用 unwrap/expect 的场景：
    // 1. 单元测试
    // 2. 原型开发
    // 3. 逻辑上确定不会失败（如已经验证过格式的字符串）
    // 生产代码中应尽量用 ? 或 match
}
```

---

## 生命周期（Lifetimes）

### 问题：悬垂引用

生命周期的存在是为了防止这种情况：

```rust
fn dangling() -> &String {  // 尝试返回局部变量的引用
    let s = String::from("hello");
    &s
} // s 在这里被 drop，&s 成为悬垂指针（dangling pointer）
// 编译错误：returns a reference to data owned by the current function
```

C/C++ 中这是运行时的未定义行为，Rust 在编译期就拦截了。

### 生命周期省略规则（Elision Rules）

大多数情况下，编译器能**自动推断**生命周期，不需要手动标注。推断规则有三条（了解即可，不必背）：

1. 每个引用参数都有自己的生命周期参数
2. 若只有一个输入生命周期参数，它被赋给所有输出引用
3. 若有 `&self` 或 `&mut self` 参数，`self` 的生命周期被赋给所有输出引用

```rust
// 以下三个函数签名等价（编译器会把第一个自动补全成第三个）
fn first_word(s: &str) -> &str { &s[..] }
fn first_word<'a>(s: &'a str) -> &str { &s[..] }      // 规则1
fn first_word<'a>(s: &'a str) -> &'a str { &s[..] }   // 规则2
```

### 何时需要手动标注？

当函数有多个引用参数，且返回值引用时，编译器不知道返回的引用"来自"哪个参数：

```rust
// 这个函数无法编译，因为编译器不知道返回值的生命周期
// 应该是 x 的生命周期？还是 y 的？
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
// error[E0106]: missing lifetime specifier
```

需要手动标注，告诉编译器：**返回值的生命周期和 x、y 中较短的那个相同**：

```rust
// 'a 是生命周期参数，以 ' 开头
// 这里的含义：返回的引用至少活到 x 和 y 中生命周期较短的那个结束
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("最长: {}", result); // ✅ 在 s2 有效的作用域内使用
    }
    // println!("{}", result); // ❌ 编译错误：s2 已经 drop，result 可能失效
}
```

**生命周期标注不会改变引用的实际存活时间**，它只是给编译器提供信息，让编译器能验证你的代码是否安全。

### 结构体中的生命周期

结构体持有引用时，必须标注，表明"结构体实例的存活时间不能超过它所借用的数据"：

```rust
// 'a 表示：Excerpt 实例活着的时候，它借用的那个字符串数据也必须活着
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    // 这里返回 &str，依据规则3，生命周期与 &self 相同（即 'a）
    fn content(&self) -> &str {
        self.part
    }
}

fn main() {
    let novel = String::from("第一章。这是故事的开始...");
    let first_sentence = novel.split('。').next().expect("没找到句号");
    // first_sentence 借用了 novel 的数据

    let excerpt = Excerpt { part: first_sentence };
    // excerpt 的生命周期不超过 novel（被借用的数据）

    println!("{}", excerpt.content());
} // novel 和 excerpt 都在这里结束，顺序正确（excerpt 先于 novel 结束也可以）
```

### `'static` 生命周期

`'static` 是特殊的生命周期：引用在**整个程序运行期间**有效。

```rust
fn main() {
    // 字符串字面量编译进二进制，'static 生命周期
    let s: &'static str = "我永远存在";
    println!("{}", s);

    // 编译器有时会建议你加 'static，但不要随便加
    // 正确做法是先思考：这个引用真的需要活这么久吗？
    // 通常有 'static 错误，是因为你应该转移所有权而不是用引用
}
```

### 综合示例

```rust
use std::fmt::Display;

// 综合了：泛型 + Trait Bound + 生命周期
fn longest_with_msg<'a, T>(x: &'a str, y: &'a str, msg: T) -> &'a str
where
    T: Display,
{
    println!("额外信息: {}", msg);
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("rust");
    let s2 = String::from("go");
    let result = longest_with_msg(&s1, &s2, "比较两种语言名称长度");
    println!("较长的: {}", result); // rust
}
```

## 小结

| 概念 | 作用 | 核心记忆点 |
|------|------|-----------|
| `panic!` | 不可恢复错误，程序终止 | 用于 bug，不用于预期的失败 |
| `Result<T,E>` | 可恢复错误 | 函数签名显式声明可能失败 |
| `?` 运算符 | 错误传播语法糖 | 自动调用 `From` 转换错误类型 |
| 生命周期 `'a` | 引用有效性标注 | 告知编译器引用之间的存活关系 |
| `'static` | 整个程序生命周期 | 字符串字面量的类型 |
| 省略规则 | 自动推断生命周期 | 大多数情况不需要手写 |
