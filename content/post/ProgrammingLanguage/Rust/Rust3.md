---
title: "通用语言教程-Rust 篇【3】所有权与借用"
date: 2026-05-07T11:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","所有权","借用","内存安全"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 的所有权（Ownership）是这门语言里最难也最重要的概念。很多人在这里卡住，并不是因为概念本身有多复杂，而是因为它和之前学过的所有语言的内存管理方式都不一样。

这篇文章会从"内存到底放在哪"开始讲，把所有权、借用、切片背后的逻辑全部串联起来。

## 先搞清楚：栈和堆

在理解所有权之前，必须先搞清楚内存的两个区域：

**栈（Stack）**：LIFO 结构，由编译器自动管理，分配和释放都极快。存放**编译期已知固定大小**的数据：整数、浮点数、布尔值、数组（固定长度）等。

**堆（Heap）**：由程序员（或运行时）手动管理，分配速度较慢，但可以存放**大小在运行时才确定**的数据：`String`、`Vec<T>` 等。

```
栈内存：                    堆内存：
+------------------+        +----------------------+
| i: i32 = 5      |    ┌──▶│ "hello, sekai"       │
| s: (ptr, len, cap)├───┘   │ (字符串实际内容)      │
| ptr: 0x1234      |        +----------------------+
| len: 12          |
| cap: 12          |
+------------------+
```

`String` 类型在栈上存的是三个字段：**指针**（指向堆上的实际字符数据）、**长度**（已使用的字节数）、**容量**（堆上分配的总字节数）。这个设计是理解所有权"移动"行为的关键。

## 三种内存管理方式的取舍

在了解所有权之前，先看看其他语言怎么做的，以及各自的代价：

- **手动管理（C/C++）**：`malloc/free`，程序员全权负责，性能最优，但一不小心就是内存泄漏、悬垂指针、double free
- **垃圾回收（Java/Python/Go）**：运行时追踪对象引用，自动回收无用内存，安全省心，但有 GC 暂停（Stop-The-World）和持续的运行时开销
- **所有权系统（Rust）**：编译器在编译期通过所有权规则静态分析，确定每块内存的分配和释放时机，**零运行时开销，同时保证内存安全**

所有权不是某个特殊功能，它是 Rust 的类型系统在编译期完成的内存管理分析。

## 所有权的三条规则

整个所有权系统建立在三条规则之上：

1. Rust 中**每个值都有一个所有者（owner）**
2. 任意时刻，**有且只有一个所有者**
3. 所有者**离开作用域**时，该值被**自动丢弃（drop）**

```rust
fn main() {
    {
        let s = String::from("hello"); // 在堆上分配内存，s 成为所有者
        println!("{}", s);
    } // s 离开作用域，Rust 自动调用 drop(s)，释放堆内存
      // 相当于 C++ 的析构函数被调用

    // println!("{}", s); // 编译错误：s 已经不存在了
}
```

`drop` 不是手动调用的函数，Rust 编译器会在作用域末尾**自动插入** `drop` 调用。这就是 Rust 的 **RAII（Resource Acquisition Is Initialization）**——资源的释放和变量的生命周期绑定。

## 移动（Move）：所有权转移

将一个 `String` 赋值给另一个变量时，所有权会**转移**，原变量立刻失效：

```rust
fn main() {
    let s1 = String::from("hello");
    // s1 在栈上：{ ptr: 0x1234, len: 5, cap: 5 }
    // 堆上 0x1234 处：'h' 'e' 'l' 'l' 'o'

    let s2 = s1;
    // Rust 做的事：把栈上的三个字段（ptr, len, cap）复制给 s2
    //              然后让 s1 失效（编译器标记它为"已移动"）
    // s2 现在拥有堆上数据的唯一所有权

    // println!("{}", s1); // 编译错误：value borrowed here after move
    println!("{}", s2);   // 正常
}
```

**为什么不直接让 s1 和 s2 共同指向同一块堆内存？** 因为那样在 s1 和 s2 分别离开作用域时，堆内存会被 `drop` 两次，导致 **double free**——这是 C++ 中臭名昭著的内存错误之一。

Rust 的设计选择是：移动而非共享，以彻底杜绝 double free。

### Copy：基本类型的特殊待遇

对于存在栈上的**基本类型**（整数、浮点数、布尔、字符、以及这些类型的元组/数组），赋值时会直接**按位复制（bitwise copy）**，原变量仍然有效：

```rust
fn main() {
    let x = 5;
    let y = x; // i32 实现了 Copy trait，这是复制，不是移动
    println!("x = {}, y = {}", x, y); // 两者都有效

    // 实现了 Copy 的类型（部分）：
    // i8, i16, i32, i64, i128, isize
    // u8, u16, u32, u64, u128, usize
    // f32, f64
    // bool, char
    // (T, U) 若 T 和 U 都实现了 Copy
    // [T; N] 若 T 实现了 Copy

    // String 没有实现 Copy（因为它管理堆内存，不能随意复制）
}
```

判断规则很简单：**如果一个类型完全存在于栈上，就可以 Copy；只要涉及堆内存，就不能 Copy。**

## 克隆（Clone）：显式深拷贝

如果真的需要独立副本（堆上的数据也复制一份），使用 `.clone()`：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 堆上数据也被复制了一份，s1 和 s2 各自独立

    println!("s1 = {}, s2 = {}", s1, s2); // 两者都有效
    // 代价：额外的堆内存分配 + 数据复制时间
}
```

`.clone()` 是昂贵操作，Rust 要求你显式写出来，就是在提醒你"这里有额外开销"。

## 函数调用与所有权

所有权规则在函数调用中同样适用：把值传给函数，和把值赋给另一个变量，在所有权行为上完全相同。

```rust
fn consume(s: String) {          // s 获得所有权
    println!("消耗掉: {}", s);
}                                // s 在这里被 drop

fn main() {
    let s = String::from("hello");
    consume(s);                  // s 的所有权移入函数

    // println!("{}", s); // 编译错误：s 已被移走
}
```

如果想在函数调用后继续用这个值，可以把所有权再返回出来——但这很啰嗦：

```rust
fn process(s: String) -> String {
    println!("处理: {}", s);
    s // 把所有权返回给调用者
}

fn main() {
    let s1 = String::from("hello");
    let s2 = process(s1); // 所有权进去又出来
    println!("{}", s2);
}
```

这种写法太繁琐了。Rust 提供了更优雅的方案：**引用**。

## 引用与借用（References & Borrowing）

引用允许你"借用"一个值而不取走所有权。语法是在类型前加 `&`：

```rust
fn calculate_length(s: &String) -> usize {
    // s 是对 String 的引用，不拥有所有权
    s.len()
} // s（引用）在这里被丢弃，但它指向的数据没有被 drop（因为 s 不是所有者）

fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s); // 传入引用（借用 s）
    println!("'{}' 的长度是 {}", s, len); // s 仍然有效！
}
```

内存视角：

```
栈上：                        堆上：
s: { ptr: 0x1234, ... }  ──▶  "hello"
ref: { ptr: &s }         ──▶  （指向 s 的栈上位置）
```

引用本身就是一个指针，存在栈上，不拥有它所指向的数据。

### 可变引用

默认的引用是**不可变**的。如果要通过引用修改数据，需要 `&mut`：

```rust
fn append_sekai(s: &mut String) {
    s.push_str(", sekai!"); // 通过可变引用修改
}

fn main() {
    let mut s = String::from("hello"); // 变量本身必须是 mut
    append_sekai(&mut s);
    println!("{}", s); // hello, sekai!
}
```

### 借用规则——为什么这么严格？

Rust 对引用有严格限制，规则只有两条：

**规则一**：同一时刻，同一数据可以有**任意多个不可变引用（`&T`）**，但不能同时有可变引用

**规则二**：同一时刻，同一数据可以有**至多一个可变引用（`&mut T`）**，且不能同时有不可变引用

```rust
fn main() {
    let mut s = String::from("hello");

    // ✅ 多个不可变引用：可以
    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2); // r1 和 r2 的最后一次使用在这里
    // 注意：Rust 的 NLL（Non-Lexical Lifetimes）让引用在最后一次使用后就失效
    // 所以 r1 和 r2 在 println! 之后已经"不存在"了

    // ✅ 之后可以创建可变引用
    let r3 = &mut s;
    r3.push_str(", world");
    println!("{}", r3);

    // ❌ 不可变和可变引用同时存在：不行
    // let r4 = &s;
    // let r5 = &mut s;  // 编译错误
    // println!("{} {}", r4, r5);
}
```

**这些规则在防什么？** 它们在防**数据竞争（data race）**——两个指针同时访问同一块内存，至少有一个在写入，且没有同步机制。在 C++ 中，这种情况会导致未定义行为；在 Rust 中，在编译期就被拦截。

**什么是 NLL（Non-Lexical Lifetimes）？**

早期 Rust 的借用检查按**词法作用域**判断引用的生命周期（到作用域结束才算完）。NLL（Rust 2018 Edition 引入）改为按**实际最后一次使用**来判断，让很多"看起来安全"的代码能正常编译。

## 切片（Slice）：对部分数据的引用

切片是对某段连续内存的**引用**，它不拥有所有权。语法是 `&data[start..end]`：

```rust
fn main() {
    let s = String::from("hello sekai");

    let hello = &s[0..5];  // 字节索引 [0, 5)
    let sekai = &s[6..11];
    println!("{} {}", hello, sekai); // hello sekai

    // 简写形式
    let all = &s[..];      // 完整切片：等价于 &s[0..s.len()]
    let prefix = &s[..5];  // 省略起始：等价于 &s[0..5]
    let suffix = &s[6..];  // 省略终止：等价于 &s[6..s.len()]
}
```

### 字符串切片的类型：&str

`&str` 是字符串切片类型，它的本质是一个"(指针, 长度)"的胖指针，指向某段 UTF-8 编码的字节序列。

字符串字面量 `"hello"` 的类型就是 `&'static str`——它是对二进制文件中静态数据段的引用，生命周期是整个程序运行期间。

```rust
fn first_word(s: &str) -> &str {
    // 找到第一个空格的位置
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {  // b' ' 是空格字节的字面量
            return &s[..i];
        }
    }
    &s[..] // 没有空格，整个字符串就是第一个单词
}

fn main() {
    let sentence = String::from("hello sekai");
    let word = first_word(&sentence); // &String 可以自动转为 &str（Deref 强制转换）
    println!("第一个单词: {}", word); // hello

    // 如果在 word 有效期间修改 sentence，编译器会报错
    // sentence.clear(); // 编译错误：不能在不可变引用存在时可变借用
    println!("{}", word); // word 还在使用中
}
```

**为什么切片能防止这类 bug？** `first_word` 返回的是对原字符串数据的引用。如果调用者试图在引用仍然存在时修改原字符串，借用检查器会在编译期报错——这类 bug 在 C/C++ 中只能在运行时发现。

### 数组切片

切片不只适用于字符串，任何连续内存都可以切片：

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice: &[i32] = &arr[1..4]; // 类型是 &[i32]
    println!("{:?}", slice); // [2, 3, 4]

    // 函数接受切片参数而非数组，更通用
    fn sum(s: &[i32]) -> i32 {
        s.iter().sum()
    }
    println!("sum = {}", sum(&arr));       // 整个数组
    println!("sum = {}", sum(&arr[1..4])); // 部分元素
}
```

## 总结：所有权的整体图景

```
所有权系统
├── 所有权（Ownership）
│   ├── 移动（Move）：赋值 / 函数传参 → 所有权转移，原变量失效
│   ├── 复制（Copy）：基本类型 → 按位复制，原变量仍有效
│   └── 克隆（Clone）：显式深拷贝，有额外开销
├── 借用（Borrowing）
│   ├── 不可变引用 &T：可以有多个，不能同时有可变引用
│   └── 可变引用 &mut T：同时只能有一个，且不能同时有不可变引用
└── 切片（Slice）
    ├── &str：字符串切片（胖指针 = 指针 + 长度）
    └── &[T]：数组/Vec 切片
```

所有权系统刚开始学起来确实反直觉，但每一条规则背后都有具体的内存安全理由。当你不断追问"为什么这里编译报错"，最终会发现编译器在替你挡掉的都是真实存在的内存 bug。
