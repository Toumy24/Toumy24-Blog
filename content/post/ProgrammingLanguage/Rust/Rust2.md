﻿﻿﻿﻿---
title: "通用语言教程-Rust 篇【2】控制流"
date: 2026-05-07T10:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","控制流","match"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

控制流决定了程序执行哪些代码、执行多少次。Rust 的控制流语法乍看和 C/C++ 很像，但有一些设计上的差异，用起来会有些意外——比如 `if` 和 `loop` 都可以作为表达式返回值，这在命令式语言里不太常见。

## if / else

最基本的条件分支。**通用语法格式：**

```text
if 条件表达式 {
    // 条件为 true 时执行
} else if 另一个条件 {
    // 前面的条件都不满足、这个条件为 true 时执行
    // （可以有零个或多个 else if 分支）
} else {
    // 以上所有条件都不满足时执行
    // （else 分支可以省略）
}
```

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

和 C++ 不同的地方：条件不需要括号（当然加了也不报错，只是风格上不推荐），但花括号是必须的，哪怕分支只有一行也不能省。

### if 作为表达式

Rust 里的 `if` 不只是一条语句，它是一个**表达式**，整体可以产生一个值：

```rust
fn main() {
    let x = 10;
    let label = if x > 5 { "大" } else { "小" };
    println!("{label}");
}
```

这等价于其他语言里的三元运算符。Rust 没有 `? :` 语法，用 `if-else` 表达式替代。

两个分支必须是相同的类型，否则编译器不知道该给变量分配什么类型的内存：

```rust
// 这段代码无法编译
let result = if true { 42 } else { "hello" };
// error: `if` and `else` have incompatible types
```

每个分支的最后一个表达式就是这个分支的值，注意不能加分号——加了分号就变成语句，返回的是 `()`（空元组）而不是那个值。

## loop

`loop` 是无限循环，必须用 `break` 退出。**通用语法格式：**

```text
loop {
    // 循环体，无限执行
    break;           // 退出循环
    break 值;        // 退出循环，同时返回一个值（作为整个 loop 表达式的值）
    continue;        // 跳过当前剩余代码，直接进入下一次循环
}
```

```rust
fn main() {
    let mut count = 0;
    loop {
        count += 1;
        if count == 5 {
            break;
        }
        println!("count = {count}");
    }
    println!("结束，count = {count}");
}
```

`loop` 同样是表达式。`break` 后面可以带一个值，作为整个 `loop` 的返回值：

```rust
fn main() {
    let mut attempts = 0;
    let result = loop {
        attempts += 1;
        if attempts == 3 {
            break attempts * 10; // loop 表达式的值是 30
        }
    };
    println!("result = {result}"); // 30
}
```

这个模式在"重试直到成功"的场景里很实用，成功时把结果通过 `break` 带出来，外部直接用 `let` 接收，不需要额外的中间变量。

## while

条件为真时持续循环，条件变假时退出。**通用语法格式：**

```text
while 条件表达式 {
    // 每次循环开始前检查条件，为 true 则执行，为 false 则退出
    continue; // 可选：跳过当前次剩余代码，回到条件检查
    break;    // 可选：立刻退出循环
}
```

```rust
fn main() {
    let mut n = 1;
    while n < 100 {
        n *= 2;
    }
    println!("第一个不小于 100 的 2 的幂次：{n}"); // 128
}
```

`continue` 跳过当前迭代，直接开始下一次：

```rust
fn main() {
    let mut i = 0;
    while i < 10 {
        i += 1;
        if i % 2 == 0 {
            continue; // 偶数跳过
        }
        print!("{} ", i); // 只打印奇数
    }
    println!();
}
```

Rust 没有 `do-while`。需要"先执行一次再判断条件"时，用 `loop` 加 `break` 实现：

```rust
fn main() {
    let mut x = 0;
    loop {
        x += 1;
        println!("执行了一次，x = {x}");
        if x >= 3 { break; }
    }
}
```

## for 与迭代器

Rust 的 `for` 循环不是 C 风格的 `for(int i=0; i<n; i++)`，而是专门用于**遍历迭代器（Iterator）**的。所谓迭代器，就是一个能够按顺序产生一系列值的对象——数组、Vec、范围、字符串的字符等，都可以产生迭代器。

**通用语法格式：**

```text
for 变量 in 迭代器 {
    // 每次循环，变量绑定到迭代器产生的下一个值
    // 迭代器耗尽时自动退出循环
}
```

```rust
fn main() {
    let fruits = ["苹果", "香蕉", "橙子"];
    for fruit in fruits {
        println!("{fruit}");
    }
}
```

数字范围用 `..`（左闭右开）或 `..=`（左闭右闭）：

```rust
fn main() {
    for i in 1..5 {   // 1, 2, 3, 4
        print!("{} ", i);
    }
    println!();

    for i in 1..=5 {  // 1, 2, 3, 4, 5
        print!("{} ", i);
    }
    println!();
}
```

逆序遍历用 `.rev()`：

```rust
fn main() {
    for i in (1..=5).rev() {
        print!("{} ", i); // 5 4 3 2 1
    }
    println!();
}
```

同时获取索引和值，用 `.enumerate()`：

```rust
fn main() {
    let colors = ["红", "绿", "蓝"];
    for (i, color) in colors.iter().enumerate() {
        println!("第 {i} 个颜色是 {color}");
    }
}
```

### 遍历时的所有权问题

遍历一个集合时有三种写法，行为不一样：

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 写法一：直接遍历，v 的所有权被消耗，循环后 v 不可用
    // for x in v { println!("{x}"); }

    // 写法二：遍历不可变引用，v 之后仍然可用
    for x in &v {
        println!("{x}"); // x 类型是 &i32
    }
    println!("v 还在: {v:?}");

    // 写法三：遍历可变引用，可以修改元素
    let mut v2 = vec![1, 2, 3];
    for x in &mut v2 {
        *x *= 2; // 解引用后修改
    }
    println!("{v2:?}"); // [2, 4, 6]
}
```

这个所有权的问题在 Rust 3 篇里会详细解释，现在只需要记住：通常用 `&v` 遍历，这样不会消耗掉集合。

## 循环标签

嵌套循环里，`break` 和 `continue` 默认只作用于最内层循环。如果需要跳出外层循环，用**循环标签**：

```rust
fn main() {
    'outer: for i in 0..5 {
        for j in 0..5 {
            if i + j == 6 {
                println!("找到: i={i}, j={j}");
                break 'outer; // 直接退出外层循环
            }
        }
    }
}
```

标签以单引号开头，写在循环关键字前面，`break` 或 `continue` 后面跟上标签名就能精确控制跳到哪一层。

## match 表达式

`match` 是 Rust 最强大的控制流结构，也是区别于大多数语言的地方。表面看像是加强版的 `switch`，但本质上是一个**模式匹配（Pattern Matching）**系统——不只能匹配字面值，还能解构复杂数据结构、附加条件守卫等。

**通用语法格式：**

```text
match 被匹配的值 {
    模式1 => 表达式,                  // 单行分支，不需要花括号
    模式2 => {                        // 多行分支，需要花括号
        // 多行代码
        表达式                        // 最后一行是这个分支的值（无分号）
    },
    模式3 | 模式4 => 表达式,          // | 表示"或"，匹配任意一个模式
    模式 if 守卫条件 => 表达式,       // 附加守卫条件
    _ => 表达式,                      // 通配符，匹配所有其他情况（必须放最后）
}
```

`match` 是表达式，整体有一个值，可以赋给变量：

```rust
fn main() {
    let day = 3;

    let name = match day {
        1 => "周一",
        2 => "周二",
        3 => "周三",
        4 => "周四",
        5 => "周五",
        6 | 7 => "周末",   // | 表示"或"
        _ => "无效",        // _ 通配符，匹配所有剩余情况
    };
    println!("{name}"); // 周三
}
```

每个分支是"模式 => 表达式"的形式。

### 穷尽性检查

`match` 必须覆盖所有可能的情况。如果漏掉了某个分支，编译器报错：

```rust
enum Direction { North, South, East, West }

fn describe(d: Direction) -> &'static str {
    match d {
        Direction::North => "北",
        Direction::South => "南",
        Direction::East  => "东",
        // 忘了 West → 编译错误：non-exhaustive patterns: `West` not covered
    }
}
```

这个机制在枚举新增变体时特别有用：所有用到这个枚举的 `match` 都会在编译时报错，强迫你处理新情况，而不是悄悄走进一个未处理的分支。

整数类型没有穷尽问题，但也必须要么列出所有值，要么用 `_` 通配符兜底：

```rust
fn main() {
    let score = 82;
    let grade = match score {
        90..=100 => "优秀",
        75..=89  => "良好",
        60..=74  => "及格",
        _        => "不及格", // 没有这行就报错
    };
    println!("{grade}");
}
```

### 解构

`match` 的真正威力在于可以**解构**复杂的数据，把里面的值提取出来：

```rust
fn main() {
    // 解构元组
    let point = (1, -3);
    match point {
        (0, 0) => println!("原点"),
        (x, 0) => println!("x 轴上，x = {x}"),
        (0, y) => println!("y 轴上，y = {y}"),
        (x, y) => println!("({x}, {y})"),
    }

    // 带 if 守卫（guard）：在模式匹配的基础上附加额外条件
    let num = 7;
    match num {
        n if n < 0  => println!("负数: {n}"),
        0           => println!("零"),
        n if n < 10 => println!("个位数: {n}"),
        n           => println!("大于等于 10: {n}"),
    }
}
```

解构枚举变体里携带的数据：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn process(msg: Message) {
    match msg {
        Message::Quit        => println!("退出"),
        Message::Move {x, y} => println!("移动到 ({x}, {y})"),
        Message::Write(text) => println!("写入: {text}"),
    }
}
```

枚举和 `match` 是 Rust 数据建模的核心工具，后面几篇还会反复用到。

## if let

有时候只关心一种匹配情况，其余全部忽略，写完整的 `match` 显得冗余：

```rust
fn main() {
    let num = Some(7);

    // 完整 match，None 分支什么都不做，纯粹为了让编译器满意
    match num {
        Some(n) => println!("有值: {n}"),
        None    => {}
    }

    // if let：只处理 Some 的情况，更简洁
    if let Some(n) = num {
        println!("有值: {n}");
    }

    // 也可以带 else
    if let Some(n) = num {
        println!("有值: {n}");
    } else {
        println!("没有值");
    }
}
```

`if let` 是 `match` 的语法糖，两者等价。用哪个取决于你关心几种情况：只关心一种就用 `if let`，需要处理多种情况就用 `match`。

## while let

`while let` 的逻辑类似：只要模式匹配成功就继续循环，匹配失败时退出：

```rust
fn main() {
    let mut stack = vec![1, 2, 3];

    // pop() 返回 Option<T>，有元素时 Some，空时 None
    while let Some(top) = stack.pop() {
        println!("{top}"); // 3 2 1，从末尾弹出
    }
}
```
