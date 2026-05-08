---
title: "通用语言教程-Rust 篇【1】基础语法"
date: 2026-05-07T09:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 是一门专注于**安全性、并发性与高性能**的系统级编程语言。它不依赖垃圾回收器（GC），而是通过独特的**所有权系统**在编译期保证内存安全，兼具 C/C++ 的性能与更高的开发安全性。

但这篇文章不打算从"Rust 有多好"开始讲——我们直接下水。

> 如果你有 C++ 或 Python 的基础，你会发现 Rust 的部分概念似曾相识，但它的所有权机制是全新的思维方式，需要一些时间适应。本系列会在每个关键地方刨根问底，而不只是告诉你"怎么用"。

## 从 Hello Sekai 认识 Rust

首先确保你已安装 Rust 工具链，可通过 [rustup.rs](https://rustup.rs/) 一键安装：

```bash
rustc --version   # 查看编译器版本
cargo --version   # 查看构建工具版本
```

### 第一个 Rust 程序

```rust
fn main() {
    println!("Hello, Sekai!");
}
```

保存为 `main.rs`，然后：

```bash
rustc main.rs   # 编译
.\main.exe      # 运行（Windows）
```

输出：

```text
Hello, Sekai!
```

实际开发中，我们更多使用 Cargo 来管理项目：

```bash
cargo new hello_sekai  # 新建项目（自动生成标准目录结构）
cd hello_sekai
cargo run              # 编译并运行（一步到位）
cargo build            # 只编译，不运行（生成 target/debug/hello_sekai.exe）
cargo build --release  # 开启优化编译，性能大幅提升但编译更慢
```

### println! 到底是什么——宏与格式字符串的内部机制

注意到 `println!` 末尾有个感叹号 `!`，这说明它是一个**宏（macro）**，而不是普通函数。这个区别不是细节，是核心。

**为什么 `println!` 必须是宏而不能是函数？**

因为它需要在**编译期**解析格式字符串 `"Hello, {}"` 的占位符数量，并静态检查传入的参数数量与类型是否匹配。普通函数的参数在编译期是不透明的，做不到这一点；而宏在编译期展开，可以对源码级别的参数做任意分析。

换句话说，下面这段代码会在**编译时报错**，而不是运行时崩溃：

```rust
println!("{} {}", 42); // 错误：格式字符串有 2 个占位符，但只传了 1 个参数
```

```text
error: 2 positional arguments in format string, but there is 1 argument
```

这就是 Rust 的风格：**能在编译期发现的错误，绝不留到运行时。**

### 格式占位符完全指南

`println!` 的格式语法为：`{[参数][:][[填充字符]对齐][宽度][.精度][类型]}`

看着复杂，拆开来其实很清晰：

```rust
fn main() {
    // ── 基础占位 ──────────────────────────────────────────────────
    println!("{}", 42);                    // 按位置顺序
    println!("{0} {1} {0}", "a", "b");    // 按索引（从0开始），可重复引用：a b a
    println!("{val}", val = 99);           // 命名参数

    // Rust 1.58+ 直接在格式串内写变量名（最常用的现代写法）
    let name = "Sekai";
    println!("{name}");  // Sekai，不需要再写 , name

    // ── 对齐与填充 ────────────────────────────────────────────────
    //   语法：{:[填充字符][< 左 | ^ 中 | > 右]宽度}
    println!("{:<10}", "left");    // "left      "（左对齐，宽度10，默认空格填充）
    println!("{:>10}", "right");   // "     right"（右对齐）
    println!("{:^10}", "center");  // "  center  "（居中）
    println!("{:*^10}", "hi");     // "****hi****"（用 * 填充居中）
    println!("{:0>8}", 42);        // "00000042"（数字补零常用写法）

    // ── 数字格式 ──────────────────────────────────────────────────
    let pi = 3.14159265;
    println!("{:.2}", pi);         // 保留2位小数：3.14
    println!("{:10.3}", pi);       // 宽度10，3位小数，右对齐：     3.142
    println!("{:+}", 42);          // 强制显示正负号：+42
    println!("{:e}", 1234567.0f64); // 科学计数法：1.234567e6
    println!("{:E}", 1234567.0f64); // 科学计数法大写：1.234567E6

    // ── 进制 ──────────────────────────────────────────────────────
    println!("{:b}", 42u32);       // 二进制：101010
    println!("{:o}", 42u32);       // 八进制：52
    println!("{:x}", 255u32);      // 十六进制小写：ff
    println!("{:X}", 255u32);      // 十六进制大写：FF
    println!("{:#b}", 42u32);      // 带前缀二进制：0b101010
    println!("{:#x}", 255u32);     // 带前缀十六进制：0xff

    // ── 调试格式 ──────────────────────────────────────────────────
    let arr = [1, 2, 3];
    println!("{:?}", arr);         // [1, 2, 3]（单行调试格式）
    println!("{:#?}", arr);        // 美化多行输出，调试复杂嵌套结构时用
}
```

#### `{}` 与 `{:?}` 的本质区别

这两个占位符对应的是两个完全不同的 **Trait（特征）**：

- `{}` → 调用 `Display` trait，是"给用户看的"格式，**必须手动实现**
- `{:?}` → 调用 `Debug` trait，是"给开发者调试用的"格式，可以用 `#[derive(Debug)]` 自动派生

对标准库的基础类型（整数、浮点、字符串、数组等），两者都已内置实现。对于自定义类型：

```rust
#[derive(Debug)] // 自动派生 Debug，让 {:?} 可用
struct Point {
    x: f64,
    y: f64,
}

// Display 无法自动派生——"用户友好格式"是业务逻辑，编译器无法代劳
use std::fmt;
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
        // write! 是不换行版本的 println!，向 Formatter 写入内容
        // 返回 fmt::Result 表示是否写入成功
    }
}

fn main() {
    let p = Point { x: 1.0, y: 2.5 };
    println!("{}", p);    // (1, 2.5)                      ← Display
    println!("{:?}", p);  // Point { x: 1.0, y: 2.5 }     ← Debug
    println!("{:#?}", p); // 美化 Debug：换行缩进
}
```

> `eprintln!` 和 `println!` 用法完全相同，区别是输出到**标准错误流（stderr）**而非标准输出，适合输出错误和调试信息，不会与程序正常输出混在一起。

## 变量与常量

### 变量绑定与不可变性——这不只是语法糖

Rust 使用 `let` 声明变量，**默认不可变（immutable）**：

```rust
fn main() {
    let x = 5;
    // x = 6; // 编译错误：cannot assign twice to immutable variable `x`
}
```

这和 C++ 的 `const` 或 Python 的"约定俗成"不同——Rust 的不可变是**编译器强制执行的**，不是靠程序员自律。

**为什么要默认不可变？** 不是为了限制你，而是给编译器更多信息：当一个值确定不变，编译器可以做更激进的优化；在并发场景下，不可变数据可以在多线程间安全共享而无需加锁（后面的并发章节会深入）。

加 `mut` 才能修改：

```rust
fn main() {
    let mut y = 10;
    y = 20; // 合法
    println!("y = {y}");
}
```

### 变量遮蔽（Shadowing）——同名变量的"替身"

Rust 允许在同一作用域内用 `let` 重新声明同名变量，称为**遮蔽（shadowing）**：

```rust
fn main() {
    let x = 5;
    let x = x + 1;    // 新的 x，值 6，旧 x 被遮蔽（内存将在作用域结束时释放）
    let x = x * 2;    // 再次遮蔽，值 12
    println!("{x}");  // 12

    // 遮蔽与 mut 的核心区别：遮蔽可以改变类型，mut 不行
    let spaces = "   ";         // &str 类型
    let spaces = spaces.len();  // usize 类型，合法——这是全新的变量，只是同名
    println!("{spaces}");       // 3

    // 如果用 mut 尝试改变类型，编译器直接报错：
    // let mut s = "hello";
    // s = s.len(); // error: expected `&str`, found `usize`
}
```

### 常量（const）——与 let 的深层区别

```rust
// 常量必须标注类型，值必须是编译期可确定的常量表达式
const MAX_POINTS: u32 = 100_000; // 下划线是数字分隔符，纯粹增强可读性
const PI: f64 = 3.14159265358979;

fn main() {
    // let 与 const 的关键区别：
    // 1. const 编译时直接内联替换（类似 C 的 #define），没有固定内存地址
    // 2. let 是运行时的栈分配，有实际内存地址，可以取引用
    // 3. const 可以在全局作用域声明，let 只能在函数内
    // 4. const 绝对不可变，不能加 mut
    println!("{MAX_POINTS} {PI}");
}
```

## 基本数据类型

Rust 是**静态强类型语言**，编译器大多数时候可以自动推断类型，也可以显式标注。所有基本类型都存储在**栈（stack）**上，大小在编译期确定。

### 整数类型

| 类型 | 大小 | 有符号范围 | 无符号范围 |
|------|------|-----------|-----------|
| `i8` / `u8` | 1字节 | -128 ~ 127 | 0 ~ 255 |
| `i16` / `u16` | 2字节 | -32768 ~ 32767 | 0 ~ 65535 |
| `i32` / `u32` | 4字节 | -2³¹ ~ 2³¹-1 | 0 ~ 2³²-1 |
| `i64` / `u64` | 8字节 | -2⁶³ ~ 2⁶³-1 | 0 ~ 2⁶⁴-1 |
| `i128` / `u128` | 16字节 | ±2¹²⁷ | 0 ~ 2¹²⁸-1 |
| `isize` / `usize` | 平台相关 | 与指针等宽（64位=8字节）| 同左 |

> `usize` 是最重要的无符号整数类型之一——**数组索引、Vec 长度、内存偏移量全都是 `usize`**，因为它与平台指针大小一致，是寻址的自然单位。如果你用 `i32` 做索引，编译器会强制要求你转换类型。

```rust
fn main() {
    let a: i32 = -42;            // 默认整数类型是 i32
    let b: u64 = 1_000_000;      // 下划线分隔符，不影响值
    let c = 0xFF_u8;             // 十六进制，类型后缀跟在字面量后面
    let d = 0o77_i32;            // 八进制
    let e = 0b1111_0000_u8;      // 二进制
    let f = b'A';                // 字节字面量，类型固定为 u8，值为 ASCII 码 65

    println!("{a} {b} {c} {d} {e} {f}");
    // 输出：-42 1000000 255 63 240 65
}
```

#### 整数溢出：Debug 模式 vs Release 模式

这是很多教程略过但非常重要的细节：

```rust
fn main() {
    let x: u8 = 255;
    let _y = x + 1; // u8 最大值是 255，再 +1 会溢出
}
```

- **Debug 模式**（`cargo run`）：溢出时程序直接 **panic**。目的是在开发阶段尽早暴露 bug。
- **Release 模式**（`cargo run --release`）：溢出时按**二进制补码循环**（255u8 + 1 = 0），不 panic。目的是不牺牲性能。

如果需要在代码中明确控制溢出行为（而不是依赖编译模式的隐式行为），应使用标准库提供的方法：

```rust
fn main() {
    let x: u8 = 255;
    println!("{}", x.wrapping_add(1));          // 循环溢出：0
    println!("{:?}", x.checked_add(1));         // 溢出返回 None：None
    println!("{}", x.saturating_add(1));        // 饱和加法：255（不超过上限）
    let (val, overflowed) = x.overflowing_add(1);
    println!("{val} {overflowed}");             // 0 true
}
```

### 浮点类型

Rust 有 `f32`（单精度）和 `f64`（双精度），**默认推断为 `f64`**，因为现代 CPU 上 f64 与 f32 运算速度基本相同，但精度更高：

```rust
fn main() {
    let x = 2.0;       // f64，默认
    let y: f32 = 3.14; // f32，需显式标注

    // 浮点数遵循 IEEE 754 标准，天然存在精度问题
    println!("{}", 0.1_f64 + 0.2);          // 0.30000000000000004
    println!("{:.1}", 0.1_f64 + 0.2);       // 0.3（格式化可规避显示）

    // 永远不要用 == 直接比较浮点数，应比较差的绝对值是否在误差范围内
    let a = 0.1_f64 + 0.2;
    let b = 0.3_f64;
    println!("{}", (a - b).abs() < 1e-10);  // true（正确的浮点比较）

    // 特殊值（来自 IEEE 754 规范）
    println!("{}", f64::INFINITY);           // inf
    println!("{}", f64::NEG_INFINITY);       // -inf
    let nan = f64::NAN;
    println!("{nan}");                       // NaN
    println!("{}", nan == nan);             // false！NaN 不等于任何值包括自身
    println!("{}", nan.is_nan());           // true（正确的 NaN 判断方式）
}
```

### 布尔类型

```rust
fn main() {
    let t = true;
    let _f: bool = false;

    // bool 在内存中占 1 字节（不是 1 bit）
    // 原因：大多数 CPU 最小寻址单位是字节，单独操作 1 bit 需要额外的位运算
    use std::mem::size_of;
    println!("{}", size_of::<bool>()); // 1

    // 不像 C/C++，Rust 的 bool 不能隐式转换为整数，必须显式转换
    // let x: i32 = true; // 编译错误！
    let x = true as i32;  // 1
    let y = false as i32; // 0
    println!("{x} {y}");
}
```

### 字符类型

Rust 的 `char` 是**4字节的 Unicode 标量值**，不是 C 里那个 1 字节的 ASCII 字符：

```rust
fn main() {
    let c       = 'z';
    let emoji   = '😊';
    let chinese = '中';

    // char 固定占 4 字节，无论是 ASCII 字符还是表情符号
    use std::mem::size_of;
    println!("{}", size_of::<char>()); // 4

    // char 与整数互转
    let code = '中' as u32;
    println!("{code}");                      // 20013（Unicode 码点）
    println!("{}", char::from(65u8));        // A（u8 转 char，仅支持 ASCII 范围）
    println!("{}", char::from_u32(20013).unwrap()); // 中（完整 Unicode 转换）

    println!("{c} {emoji} {chinese}");
}
```

> **为什么字符串不能直接用 `s[0]` 取字符？** Rust 的 `String` / `&str` 内部是 **UTF-8 编码字节序列**，而不是 char 数组。UTF-8 中一个字符占 1-4 字节，如果按字节索引，很可能切到某个字符的中间，产生无效的 Unicode 数据。所以 Rust **在编译期就禁止了对字符串的字节索引**，强制你用 `.chars()` 按字符迭代，或 `.bytes()` 按字节迭代。

## 标准输入——拆解每一行代码的理由

Rust 的输入写起来比 Python 繁琐，但每一步都有其理由，逐行分析：

```rust
use std::io;

fn main() {
    let mut input = String::new();
    //  ^^^  必须是 mut，因为 read_line 会向字符串追加内容
    //                ^^^^^^^^^^^  在堆上分配一个空的可增长 UTF-8 字符串

    io::stdin()               // 获取标准输入句柄（Stdin 结构体）
        .read_line(&mut input)
        //         ^^^^  传入可变引用，read_line 把内容追加进去
        //               注意：是"追加"不是"覆盖"——多次调用字符串会越来越长
        .expect("读取失败");  // read_line 返回 Result<usize>
                              // Ok 时：usize 是读取的字节数（含换行符）
                              // Err 时：panic 并打印信息

    // 为什么必须 trim()？
    // read_line 会把用户按 Enter 时产生的换行符（\n，Windows 上是 \r\n）一起读进来
    // 不 trim 的话，字符串比较或 parse() 都会因末尾多了换行符而失败
    let input = input.trim();
    //  ^^^^^ 遮蔽了上面的 mut input，新变量是 &str 类型（对原字符串的切片引用）

    println!("你输入的是：「{input}」");
}
```

### 读取多种类型

读取数字的本质是：**读字符串 → trim → parse**

```rust
use std::io;

fn main() {
    let mut buf = String::new();
    io::stdin().read_line(&mut buf).expect("读取失败");

    // parse::<i32>() 是泛型方法
    // ::<i32> 是"turbofish"语法，在编译器无法推断类型时显式指定
    // 也可以通过变量类型标注来推断：let n: i32 = buf.trim().parse()...
    let n: i32 = buf.trim().parse().expect("请输入整数");
    println!("{}", n * 2);

    // 一行输入多个数字（空格分隔）
    let mut line = String::new();
    io::stdin().read_line(&mut line).expect("读取失败");

    let nums: Vec<i32> = line
        .trim()
        .split_whitespace()    // 按任意连续空白字符分割，返回迭代器
        .map(|s| s.parse().expect("不是整数"))
        .collect();            // 收集迭代器为 Vec<i32>

    println!("{nums:?}"); // 输入 "1 2 3" → 输出 [1, 2, 3]

    // 多行读取（循环到 EOF，常用于竞争性编程）
    use std::io::BufRead;
    for line in io::stdin().lock().lines() {
        // stdin().lock()：手动持锁，整个循环只加锁一次，比每次 read_line 都加解锁性能更好
        // .lines()：逐行迭代，每行是 Result<String>，换行符已自动去除
        let line = line.expect("读取失败");
        if line.is_empty() { break; }
        println!("读到：{line}");
    }
}
```

> **`stdin()` 与 `stdin().lock()` 的区别**：`stdin()` 的每次 `read_line` 都会对输入流加锁再解锁；`stdin().lock()` 手动持锁，整个循环期间只锁一次，大量行输入时性能明显更好。竞争性编程或需要处理大量输入时，优先使用 `stdin().lock()`。
