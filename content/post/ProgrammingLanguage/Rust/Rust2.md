---
title: "通用语言教程-Rust 篇【2】控制流"
date: 2026-05-07T10:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","基础语法","控制流"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 的控制流语法乍看和 C++ 没什么区别——`if`、`while`、`for`，一眼认出。但越往里摸，越会发现藏着的机关：`if` 是表达式而不是语句，`match` 有编译期穷尽性检查，`for` 循环背后是完整的迭代器协议……这些都不是语法糖，而是语言设计哲学的体现。

这篇文章会把这些"隐藏规则"全部翻出来。

## if / else：表达式，不是语句

先说最熟悉的 `if`。

```rust
fn main() {
    let score = 85;

    if score >= 90 {
        println!("优秀");
    } else if score >= 75 {
        println!("良好");
    } else if score >= 60 {
        println!("及格");
    } else {
        println!("不及格");
    }
}
```

两点和 C++ 不同：条件**不需要括号**，但花括号 `{}` **必须写**，即使只有一行。这是 Rust 强制要求的，没有商量余地。

### if 是表达式意味着什么？

在 C++/Java 里，`if` 是**语句（statement）**，执行后不产生值。但在 Rust 里，`if` 是**表达式（expression）**，整个 `if-else` 块可以有一个返回值：

```rust
fn main() {
    let x = 10;

    // 这里 if-else 整体是一个表达式，赋值给 result
    let result = if x > 5 { "大于5" } else { "不大于5" };
    println!("{}", result); // 大于5

    // 等价于其他语言的三元运算符：x > 5 ? "大于5" : "不大于5"
    // Rust 没有专门的三元运算符，就是这么用 if 的
    let y = if x % 2 == 0 { x / 2 } else { x * 3 + 1 };
    println!("y = {}", y); // 5
}
```

**重要约束**：两个分支的类型必须一致。下面这个会编译报错：

```rust
// 错误示例
let z = if x > 5 { 42 } else { "hello" };
// error[E0308]: `if` and `else` have incompatible types
//   expected integer, found `&str`
```

为什么要这么严格？因为 `z` 的类型必须在编译期确定，Rust 是**静态类型语言**，变量类型不能在运行时发生变化。两个分支类型不同，编译器就不知道该给 `z` 分配多少内存。

## loop：唯一真正的无限循环

Rust 有三种循环结构，其中 `loop` 是最"底层"的：

```rust
fn main() {
    let mut count = 0;

    loop {
        count += 1;
        if count == 5 {
            break; // 退出循环
        }
        println!("count = {}", count);
    }
    println!("循环结束，count = {}", count); // 5
}
```

### loop 也是表达式——break 可以携带返回值

这是 `loop` 最有意思的地方：`break` 可以后跟一个值，使整个 `loop` 表达式产生那个值：

```rust
fn main() {
    let mut n = 0;

    let result = loop {
        n += 1;
        if n == 10 {
            break n * 2; // loop 表达式的返回值是 n * 2 = 20
        }
    };

    println!("result = {}", result); // 20
}
```

**这有什么实际用途？** 一个典型场景是"重试直到成功"：

```rust
fn try_connect() -> Result<String, ()> {
    // 模拟：每次调用有 50% 概率成功
    Ok("connected".to_string())
}

fn main() {
    let connection = loop {
        match try_connect() {
            Ok(conn) => break conn, // 成功时将连接对象作为 loop 的返回值
            Err(_)   => println!("连接失败，重试..."),
        }
    };
    println!("连接成功: {}", connection);
}
```

没有 `loop` 的返回值，这个模式就需要额外的 `Option` 变量来传递结果，代码更繁琐。

## while：条件控制循环

`while` 和其他语言基本一致，没什么特别的：

```rust
fn main() {
    let mut sum = 0;
    let mut i = 1;

    while i <= 100 {
        sum += i;
        i += 1;
    }
    println!("1+2+...+100 = {}", sum); // 5050

    // continue 跳过当前迭代
    let mut j = 0;
    while j < 10 {
        j += 1;
        if j % 2 == 0 {
            continue; // 跳过偶数
        }
        print!("{} ", j); // 1 3 5 7 9
    }
    println!();
}
```

### 为什么没有 do-while？

Rust 没有 `do-while` 语法。如果需要"先执行一次再判断条件"，可以用 `loop` + `break`：

```rust
fn main() {
    let mut x = 0;
    loop {
        x += 1;
        println!("执行了: {}", x);
        if x >= 3 { break; }
    }
    // 等价于 C++ 的：do { x++; ... } while (x < 3);
}
```

## for：迭代器协议的语法糖

`for` 是 Rust 中最常用的循环，但它和 C 风格的 `for(int i=0; i<n; i++)` 有本质区别。

**Rust 的 `for` 循环是迭代器协议的语法糖。**

具体来说，`for item in collection` 在编译器内部会展开成这样：

```rust
// 这段代码：
for item in collection {
    // ...
}

// 等价于：
let mut iter = collection.into_iter(); // 调用 IntoIterator::into_iter()
loop {
    match iter.next() {          // 反复调用 Iterator::next()
        Some(item) => { /* ... */ } // 有值就继续
        None       => break,         // 没有值了就退出
    }
}
```

所以 `for` 能遍历的任何东西，都必须实现 `IntoIterator` trait。这是统一的抽象，不是魔法。

```rust
fn main() {
    // 遍历数组（数组实现了 IntoIterator）
    let fruits = ["苹果", "香蕉", "橙子"];
    for fruit in fruits {
        println!("{}", fruit);
    }

    // Range 也实现了 IntoIterator
    for i in 1..10 {    // [1, 10) 左闭右开
        print!("{} ", i);
    }
    println!();

    for i in 1..=10 {   // [1, 10] 左闭右闭
        print!("{} ", i);
    }
    println!();

    // 逆序：rev() 是迭代器适配器，将迭代方向反转
    for i in (1..=5).rev() {
        print!("{} ", i); // 5 4 3 2 1
    }
    println!();

    // enumerate()：同时获取索引和值
    // 等价于 Python 的 enumerate()
    let colors = ["红", "绿", "蓝"];
    for (index, color) in colors.iter().enumerate() {
        println!("第 {} 个颜色是 {}", index, color);
    }
}
```

### `fruits` vs `&fruits` vs `fruits.iter()` 的区别

遍历集合时有三种写法，区别很重要：

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 1. for x in v         → 消耗 v（所有权移入循环），v 之后不可用
    //    x 的类型：i32

    // 2. for x in &v        → 不可变借用，v 之后仍可用
    //    x 的类型：&i32
    for x in &v {
        print!("{} ", x); // 1 2 3
    }
    println!("{:?}", v); // v 仍然有效

    // 3. for x in &mut v    → 可变借用，可以修改元素
    //    x 的类型：&mut i32
    let mut v2 = vec![1, 2, 3];
    for x in &mut v2 {
        *x *= 2; // 必须解引用才能修改
    }
    println!("{:?}", v2); // [2, 4, 6]
}
```

## 循环标签：精确控制嵌套循环

嵌套循环中，`break` 和 `continue` 默认作用于**最内层**循环。如果要跳出外层循环，需要用**循环标签（loop label）**：

```rust
fn main() {
    // 标签以 ' 开头
    'outer: for i in 0..5 {
        for j in 0..5 {
            if i + j == 6 {
                println!("找到了: i={}, j={}", i, j);
                break 'outer; // 直接退出 'outer 标记的循环
            }
        }
    }
    // 输出：找到了: i=2, j=4（第一个满足 i+j==6 的组合）

    // continue 同样可以配合标签
    'outer2: for i in 0..3 {
        for j in 0..3 {
            if j == 1 {
                continue 'outer2; // 跳过外层当前迭代（j=1时直接进入 i 的下一次迭代）
            }
            println!("i={}, j={}", i, j);
        }
    }
}
```

这类似 C++ 里用 `goto` 跳出嵌套循环，但 Rust 的标签语义更清晰——你明确指定了跳到哪一层，而不是跳到某个任意代码位置。

## match：不只是强化版 switch

`match` 是 Rust 最强大的控制流结构，但把它理解成"强化版 switch"是低估了它。

### 基本用法

```rust
fn main() {
    let day = 3;

    let day_name = match day {
        1 => "周一",
        2 => "周二",
        3 => "周三",
        4 => "周四",
        5 => "周五",
        6 | 7 => "周末",   // | 表示"或"，多个模式共用同一个分支
        _ => "无效",        // _ 通配符，匹配所有剩余情况
    };
    println!("{}", day_name); // 周三

    // match 同样是表达式，可以直接赋值
    let score = 82;
    let grade = match score {
        90..=100 => "优秀",  // 范围模式（必须用 ..= 包含右端点）
        75..=89  => "良好",
        60..=74  => "及格",
        _        => "不及格",
    };
    println!("{}", grade); // 良好
}
```

### match 的穷尽性检查（Exhaustiveness Checking）

`match` 和 `switch` 最根本的区别不是语法，而是**编译器强制要求覆盖所有可能的情况**：

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn describe(dir: Direction) -> &'static str {
    match dir {
        Direction::North => "向北",
        Direction::South => "向南",
        Direction::East  => "向东",
        // 如果漏掉 West，编译器报错：
        // error[E0004]: non-exhaustive patterns: `West` not covered
    }
}
```

**编译器如何做到这一点？**

对于枚举类型，编译器在编译期知道所有变体，检查 match 分支时就逐一核对。对于整数类型，必须有 `_` 通配符覆盖剩余值，否则同样报错。

这一机制在实践中意义重大：当你给枚举添加一个新变体时，**所有用到该枚举的 match 都会在编译时报错**，强制你处理新情况，而不是悄悄走进未处理的分支。

### match 中的模式解构

`match` 不只是比较值，它还能**解构**复杂数据：

```rust
fn main() {
    // 解构元组
    let point = (3, -5);
    match point {
        (0, 0) => println!("原点"),
        (x, 0) | (0, x) => println!("在坐标轴上: {}", x),
        (x, y) if x == y => println!("在对角线上: {}", x), // if 守卫（guard）
        (x, y) => println!("({}, {})", x, y),
    }

    // 解构枚举中携带的数据
    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        Color(u8, u8, u8),
    }

    let msg = Message::Move { x: 10, y: 20 };
    match msg {
        Message::Quit              => println!("退出"),
        Message::Move { x, y }    => println!("移动到 ({}, {})", x, y),
        Message::Write(text)       => println!("写入: {}", text),
        Message::Color(r, g, b)   => println!("颜色: ({}, {}, {})", r, g, b),
    }
}
```

### if let：只关心一种情况时的简写

当你只想处理 `match` 中的某一个分支，其余全部忽略时，`if let` 是更简洁的写法：

```rust
fn main() {
    let num = Some(7);

    // 完整 match 写法（其余分支什么都不做）
    match num {
        Some(n) => println!("有值: {}", n),
        None    => {}    // 这个分支没什么意义，但 match 要求你写出来
    }

    // 等价的 if let 写法
    if let Some(n) = num {
        println!("有值: {}", n);
    }

    // if let 也可以带 else
    if let Some(n) = num {
        println!("有值: {}", n);
    } else {
        println!("没有值");
    }
}
```

`if let` 本质上是 `match` 的语法糖，但用在"只关心一种情况"时更简洁，代码意图也更清晰。

### while let：循环直到匹配失败

类似 `if let`，还有 `while let`，常用于消耗一个 `Option` 或从 channel 接收消息：

```rust
fn main() {
    let mut stack = vec![1, 2, 3];

    // pop() 返回 Option<T>：有元素返回 Some，空了返回 None
    while let Some(top) = stack.pop() {
        println!("{}", top); // 3 2 1（从末尾弹出）
    }
    // stack.pop() 返回 None 时，while let 自动退出
}
```

## 小结

| 结构 | 是否是表达式 | 典型场景 |
|------|------------|---------|
| `if` / `else` | ✅ 是 | 条件分支、替代三元运算符 |
| `loop` | ✅ 是（break 带值） | 重试循环、无限服务循环 |
| `while` | ❌ 否 | 条件控制的循环 |
| `for` | ❌ 否 | 遍历迭代器（最常用） |
| `match` | ✅ 是 | 模式匹配、穷尽性检查 |
| `if let` | ✅ 是 | 只关心一种匹配情况 |
| `while let` | ❌ 否 | 循环直到模式不匹配 |

一个关键认知：Rust 中**表达式无处不在**，几乎所有控制结构都能产生值。这让代码可以写得非常紧凑——不需要专门的三元运算符，不需要额外的临时变量，`let x = if ... { ... } else { ... };` 就足够了。
