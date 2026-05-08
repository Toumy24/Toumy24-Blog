---
title: "通用语言教程-Rust 篇【11】测试"
date: 2026-05-08T10:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","测试","单元测试","集成测试"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

测试是 Rust 工具链里的一等公民。`rustc` 和 `cargo` 内置了完整的测试框架，不需要安装任何外部依赖就可以写测试、运行测试、查看测试报告。

本章介绍如何在 Rust 中编写单元测试和集成测试。

## 单元测试

### 测试函数的基本写法

通用语法格式：

```text
#[cfg(test)]                  // 只在 cargo test 时编译这个模块
mod tests {
    use super::*;             // 把父模块的所有内容引入（这样就能访问被测代码）

    #[test]                   // 标记这是一个测试函数
    fn 测试函数名() {
        // 准备数据
        // 调用被测代码
        // 用 assert! 系列宏验证结果
    }
}
```

单元测试写在被测代码所在文件的末尾，放在一个 `mod tests` 模块里。这个模块用 `#[cfg(test)]` 注解，意思是"只在运行测试时编译"——正常 `cargo build` 不会编译这段代码，不会增加最终二进制文件的体积。

```rust
// src/lib.rs（或者任何 .rs 文件的末尾）

/// 把两个数相加
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 判断一个数是否是偶数
pub fn is_even(n: i32) -> bool {
    n % 2 == 0
}

#[cfg(test)]
mod tests {
    use super::*; // 引入 add 和 is_even

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5); // 断言 2+3 == 5
        assert_eq!(add(-1, 1), 0);
        assert_eq!(add(0, 0), 0);
    }

    #[test]
    fn test_is_even() {
        assert!(is_even(4));         // 4 是偶数，assert! 期望 true
        assert!(!is_even(3));        // 3 不是偶数，取反后期望 true
        assert!(is_even(0));         // 0 是偶数
        assert!(!is_even(-1));       // -1 不是偶数
    }
}
```

运行测试：

```bash
cargo test           # 运行所有测试
cargo test test_add  # 只运行名字包含 "test_add" 的测试
```

### assert! 系列宏

Rust 测试主要靠这三个宏断言结果：

| 宏 | 用途 | 失败时显示 |
|---|---|---|
| `assert!(条件)` | 断言条件为真 | 条件 |
| `assert_eq!(a, b)` | 断言 a == b | 两个值的内容 |
| `assert_ne!(a, b)` | 断言 a != b | 两个值的内容 |

`assert_eq!` 和 `assert_ne!` 在失败时会打印两个值，方便调试：

```rust
#[test]
fn test_with_message() {
    let result = 2 + 2;
    assert_eq!(result, 4); // 通过

    // 也可以加自定义失败消息（用法和 format! 一样）
    assert_eq!(result, 4, "期望 2+2 等于 4，但得到了 {}", result);

    // 两个值必须实现 PartialEq（用于比较）和 Debug（用于打印）
    let v1 = vec![1, 2, 3];
    let v2 = vec![1, 2, 3];
    assert_eq!(v1, v2); // Vec 实现了 PartialEq，可以直接比较
}
```

### 测试应该 panic 的情况

有时候你要测试的行为是"传入非法参数时代码应该 panic"。用 `#[should_panic]` 注解：

```rust
pub fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("除数不能为 0！");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]  // 只要 panic 就算通过
    fn test_divide_by_zero() {
        divide(10.0, 0.0); // 期望这里 panic
    }

    // 更严格：指定 panic 消息里必须包含某个字符串
    #[test]
    #[should_panic(expected = "除数不能为 0")]
    fn test_divide_by_zero_message() {
        divide(10.0, 0.0);
    }
}
```

### 用 Result 作为测试返回值

测试函数也可以返回 `Result<(), E>`，这样就可以用 `?` 运算符，不需要到处写 `unwrap()`：

```rust
use std::num::ParseIntError;

#[cfg(test)]
mod tests {
    #[test]
    fn test_parse() -> Result<(), ParseIntError> {
        let n: i32 = "42".parse()?; // 如果 parse 失败，? 返回 Err 导致测试失败
        assert_eq!(n, 42);
        Ok(())
    }
}
```

## 控制测试运行

### 忽略某个测试

```rust
#[test]
#[ignore] // 默认不运行这个测试（太慢、需要特殊环境等）
fn expensive_test() {
    // 这个测试默认被跳过
}
```

```bash
cargo test              # 跳过 ignore 的测试
cargo test -- --ignored # 只运行 ignore 的测试
cargo test -- --include-ignored # 运行所有测试包括 ignore 的
```

### 控制测试线程数

`cargo test` 默认并行运行多个测试（多线程）。如果你的测试有副作用（比如读写同一个文件），需要顺序执行：

```bash
cargo test -- --test-threads=1  # 单线程顺序运行
```

### 显示 println! 输出

测试通过时，`println!` 的输出默认被吞掉。加 `--nocapture` 可以看到：

```bash
cargo test -- --nocapture
```

## 集成测试

单元测试在代码内部，测试单个函数；集成测试从外部使用你的库，测试整个模块协作。

集成测试放在 `tests/` 目录（与 `src/` 并列）：

```
my_project/
├── src/
│   └── lib.rs
└── tests/          ← 集成测试目录
    ├── integration_test.rs
    └── another_test.rs
```

```rust
// tests/integration_test.rs
// 注意：这里不需要 #[cfg(test)]，整个文件就是测试文件
// 也不需要 mod tests，每个文件就是独立的测试模块

use my_project::add; // 像外部用户一样使用库的公开接口

#[test]
fn test_add_integration() {
    assert_eq!(add(10, 20), 30);
}
```

集成测试只能访问库的公开（`pub`）API，这正是它的用意：模拟真实用户的使用方式。

## 测试的组织结构

一个完整项目的测试结构通常是这样的：

```
my_lib/
├── src/
│   ├── lib.rs          ← 单元测试用 #[cfg(test)] mod tests 写在文件末尾
│   ├── math.rs         ← 同上
│   └── string_utils.rs ← 同上
└── tests/
    ├── math_tests.rs   ← 集成测试：测试 math 模块的公开接口
    └── common/
        └── mod.rs      ← 测试辅助代码（测试间共享的工具函数），不会被当作测试文件
```

## 常用测试辅助库

标准库的 `assert!` 系列已经够用，但有些第三方库提供了更方便的断言：

| 库 | 功能 |
|---|---|
| `pretty_assertions` | `assert_eq!` 失败时显示更清晰的 diff，尤其对大的结构体/字符串 |
| `mockall` | 自动生成 mock 对象，用于隔离测试（模拟数据库、HTTP 请求等） |
| `proptest` | 属性测试（property-based testing）：自动生成随机输入验证不变量 |
| `criterion` | 基准测试（benchmark）：精确测量函数性能 |

在 `Cargo.toml` 里，测试用的依赖放在 `[dev-dependencies]` 下，不会进入最终产物：

```toml
[dev-dependencies]
pretty_assertions = "1"
```

```rust
// 使用 pretty_assertions
#[cfg(test)]
mod tests {
    use pretty_assertions::assert_eq; // 覆盖标准库的 assert_eq!

    #[test]
    fn test_complex() {
        let expected = vec!["a", "b", "c"];
        let actual = vec!["a", "b", "d"]; // 故意写错
        assert_eq!(expected, actual); // 失败时显示红绿 diff
    }
}
```
