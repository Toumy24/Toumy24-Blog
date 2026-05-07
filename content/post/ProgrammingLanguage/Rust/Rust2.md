---
title: "通用语言教程-Rust 篇【2】控制流"
date: 2026-05-08T10:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

控制流是所有编程语言的核心组成部分。Rust 的控制流语法与 C/C++ 较为相似，但有一些独特的设计——比如 `if` 和 `loop` 可以作为**表达式**返回值，这一点更接近函数式语言。

## 条件语句

### if / else if / else

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

> 注意：Rust 的 `if` 条件**不需要括号**，但花括号 `{}` 是**必须的**，即使只有一行。

### if 作为表达式

Rust 中 `if` 可以直接返回值，相当于其他语言的三元运算符：

```rust
fn main() {
    let x = 10;
    let result = if x > 5 { "大于5" } else { "不大于5" };
    // 等价于 Python 中的：result = "大于5" if x > 5 else "不大于5"
    println!("{}", result);

    // 注意：两个分支的类型必须一致
    let y = if x % 2 == 0 { x / 2 } else { x * 3 + 1 };
    println!("y = {}", y);
}
```

## 循环结构

Rust 提供三种循环：`loop`、`while`、`for`。

### loop 循环

`loop` 是无限循环，需要使用 `break` 退出：

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
    println!("循环结束，count = {}", count);
}
```

`loop` 同样可以作为表达式，`break` 后可跟返回值：

```rust
fn main() {
    let mut n = 0;
    let result = loop {
        n += 1;
        if n == 10 {
            break n * 2; // 将 n*2 作为 loop 表达式的返回值
        }
    };
    println!("result = {}", result); // 20
}
```

### while 循环

`while` 循环与其他语言类似，根据条件决定是否继续执行：

```rust
fn main() {
    // 计算 1 到 100 的和
    let mut sum = 0;
    let mut i = 1;

    while i <= 100 {
        sum += i;
        i += 1;
    }
    println!("1+2+...+100 = {}", sum); // 5050

    // continue 跳过当前循环
    let mut j = 0;
    while j < 10 {
        j += 1;
        if j % 2 == 0 {
            continue; // 跳过偶数
        }
        println!("{}", j); // 输出所有奇数
    }
}
```

### for 循环

`for` 循环在 Rust 中用于**遍历迭代器**，是最常用、最安全的循环方式：

```rust
fn main() {
    // 遍历数组
    let fruits = ["苹果", "香蕉", "橙子"];
    for fruit in fruits {
        println!("{}", fruit);
    }

    // 遍历数字范围（Range）
    // 等价于 C++ 的 for(int i=1; i<10; i++)
    for i in 1..10 {     // 左闭右开 [1, 10)
        print!("{} ", i);
    }
    println!();

    for i in 1..=10 {    // 左闭右闭 [1, 10]
        print!("{} ", i);
    }
    println!();

    // 逆序遍历
    for i in (1..=5).rev() {
        print!("{} ", i); // 5 4 3 2 1
    }
    println!();

    // 同时获取索引与值（enumerate）
    // 等价于 Python 的 enumerate()
    let colors = ["红", "绿", "蓝"];
    for (index, color) in colors.iter().enumerate() {
        println!("第 {} 个颜色是 {}", index, color);
    }
}
```

#### 循环标签

当存在嵌套循环时，可以使用**标签**精确控制 `break` 和 `continue` 作用于哪一层循环：

```rust
fn main() {
    'outer: for i in 0..5 {
        for j in 0..5 {
            if i + j == 6 {
                println!("找到了: i={}, j={}", i, j);
                break 'outer; // 直接退出外层循环
            }
        }
    }
}
```

> 这等价于 C++ 中的 `goto`，但更安全、可读性更强。

## match 模式匹配

`match` 是 Rust 最强大的控制流结构之一，类似于其他语言的 `switch`，但功能远比它强大：

```rust
fn main() {
    let day = 3;

    let day_name = match day {
        1 => "周一",
        2 => "周二",
        3 => "周三",
        4 => "周四",
        5 => "周五",
        6 | 7 => "周末",   // 多个模式用 | 连接
        _ => "无效",        // _ 是通配符，匹配其他所有情况（相当于 default）
    };
    println!("{}", day_name); // 周三

    // match 同样可以作为表达式直接返回值（上面已经展示）

    // 匹配范围
    let score = 82;
    let grade = match score {
        90..=100 => "优秀",
        75..=89  => "良好",
        60..=74  => "及格",
        _        => "不及格",
    };
    println!("等级: {}", grade);
}
```

### if let 简化匹配

当只关心一种匹配情况时，可以用 `if let` 代替完整的 `match`：

```rust
fn main() {
    let num = Some(7); // Option 类型，后续章节详解

    // 完整 match 写法
    match num {
        Some(n) => println!("有值: {}", n),
        None => {}
    }

    // 等价的 if let 简化写法
    if let Some(n) = num {
        println!("有值: {}", n);
    }
}
```
