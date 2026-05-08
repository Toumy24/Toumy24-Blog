---
title: "通用语言教程-Rust 篇【4】函数、结构体与枚举"
date: 2026-05-07T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","函数","结构体","枚举","闭包"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

这一章把 Rust 里"组织代码"的核心工具全部过一遍：函数、闭包、结构体、枚举，以及标准库里最重要的两个枚举 `Option` 和 `Result`。

每个知识点都有值得深挖的内部机制，比如"函数最后一个表达式就是返回值"背后的语义，闭包捕获变量的三种方式，枚举在内存里的存储方式，以及 `Option` 彻底替代 `null` 的设计逻辑。

## 函数

### 定义与调用

```rust
fn greet(name: &str) {        // 参数必须标注类型
    println!("你好，{}！", name);
}

fn add(a: i32, b: i32) -> i32 { // -> 后跟返回类型
    a + b  // 最后一个表达式（不带分号）就是返回值
}

fn main() {
    greet("Rust");
    let sum = add(3, 5);
    println!("3 + 5 = {}", sum);
}
```

### 表达式 vs 语句——为什么不加分号就是返回值？

Rust 区分两个概念：

- **语句（statement）**：执行某些操作，**不产生值**，末尾有分号
- **表达式（expression）**：求值，**产生一个值**，末尾没有分号

```rust
fn example() -> i32 {
    let x = 5;   // 语句：let 绑定，不产生值（x = 5 本身是赋值语句，不能写 let y = let x = 5）
    x + 1        // 表达式：产生值 6，这就是函数的返回值
    // x + 1;   // 若加了分号，变成语句，函数返回 () 而非 i32 → 编译错误
}
```

加了分号代表"我不想用这个值，执行就好"；不加分号代表"这个值就是我要传出去的"。函数体就是一个块表达式，它的值是最后一个表达式的值。

这种设计来源于函数式语言（Haskell、ML 等），Rust 把这个思想引入了系统级语言。

### 多返回值：用元组

```rust
fn min_max(arr: &[i32]) -> (i32, i32) {
    let mut min = arr[0];
    let mut max = arr[0];
    for &val in arr {      // &val 解构引用，val 直接是 i32
        if val < min { min = val; }
        if val > max { max = val; }
    }
    (min, max) // 返回元组（仍是表达式，不加分号）
}

fn main() {
    let nums = [3, 1, 4, 1, 5, 9, 2, 6];
    let (min, max) = min_max(&nums); // 解构赋值
    println!("最小: {}, 最大: {}", min, max);
}
```

## 闭包（Closure）

闭包是**能捕获外部环境变量**的匿名函数。

```rust
fn main() {
    let factor = 3;

    // 闭包语法：|参数| 表达式 或 |参数| { 块 }
    let multiply = |x| x * factor; // 捕获了外部的 factor
    // 等价于 Python 的：multiply = lambda x: x * factor

    println!("{}", multiply(5));  // 15
    println!("{}", multiply(10)); // 30

    // 完整写法（带类型标注，通常不需要，编译器能推断）
    let add = |a: i32, b: i32| -> i32 { a + b };
    println!("{}", add(3, 4)); // 7
}
```

### 闭包捕获变量的三种方式

闭包根据如何使用被捕获的变量，实现三个不同的 Trait：

| Trait | 捕获方式 | 说明 |
|-------|---------|------|
| `FnOnce` | 取得所有权（move） | 只能调用一次（值被消耗） |
| `FnMut` | 可变借用 `&mut` | 可以修改被捕获的变量，可多次调用 |
| `Fn` | 不可变借用 `&` | 只读，可多次调用 |

编译器会自动推断闭包实现哪个 Trait（取最宽松的那个）：

```rust
fn main() {
    let s = String::from("hello");

    // Fn：只读借用
    let print_s = || println!("{}", s); // 只是读 s，实现 Fn
    print_s();
    print_s(); // 可以多次调用
    println!("{}", s); // s 仍然有效

    // FnMut：可变借用
    let mut count = 0;
    let mut increment = || {
        count += 1; // 修改了 count，实现 FnMut
        count
    };
    println!("{}", increment()); // 1
    println!("{}", increment()); // 2

    // FnOnce：通过 move 取得所有权
    let s2 = String::from("world");
    let consume = move || {
        println!("{}", s2); // move 强制将 s2 所有权移入闭包
        drop(s2);           // 消耗掉 s2
    };
    consume();
    // consume(); // 编译错误：s2 已被消耗，FnOnce 只能调用一次
}
```

`move` 关键字在**线程**中非常重要：线程的闭包必须用 `move`，确保捕获的变量的所有权转移进线程，而不是留在原线程上（原线程可能先于子线程结束）。

### 闭包配合迭代器：函数式编程风格

```rust
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map + filter + collect（惰性求值，只在 collect 时真正执行）
    let result: Vec<i32> = nums.iter()
        .filter(|&&x| x % 2 == 0)  // 保留偶数
        .map(|&x| x * x)           // 求平方
        .collect();
    // 等价于 Python：[x**2 for x in nums if x % 2 == 0]
    println!("{:?}", result); // [4, 16, 36, 64, 100]

    // 折叠（fold/reduce）
    let sum: i32 = nums.iter().sum();
    let product: i32 = nums.iter().product();
    println!("sum={}, product={}", sum, product);

    // any / all
    println!("有偶数: {}", nums.iter().any(|&x| x % 2 == 0)); // true
    println!("全是正数: {}", nums.iter().all(|&x| x > 0));    // true
}
```

## 结构体（Struct）

### 定义与使用

```rust
struct Student {
    name: String,
    age:  u32,
    score: f64,
}

fn main() {
    let stu = Student {
        name: String::from("小明"),
        age:  18,
        score: 92.5,
    };
    println!("姓名: {}, 年龄: {}, 成绩: {}", stu.name, stu.age, stu.score);

    // 可变实例（整个结构体都是 mut，不能只让某个字段可变）
    let mut stu2 = Student {
        name: String::from("小红"),
        age:  17,
        score: 88.0,
    };
    stu2.score = 95.0;

    // 结构体更新语法：从另一个实例继承未指定的字段
    let stu3 = Student {
        name: String::from("小李"),
        ..stu2 // 注意：stu2.name 的所有权被移走（如果有 String 字段）
               // age 和 score 是 Copy 类型，直接复制
    };
    println!("小李年龄: {}", stu3.age); // 17（从 stu2 继承）
}
```

### 方法（impl 块）

Rust 通过 `impl` 块为结构体定义方法，把数据和行为关联起来——这就是 Rust 的"面向对象"（但没有继承）：

```rust
struct Rectangle {
    width:  f64,
    height: f64,
}

impl Rectangle {
    // 关联函数（associated function）：不接收 self，类似其他语言的静态方法
    // 常用作构造器，按惯例命名为 new
    fn new(width: f64, height: f64) -> Rectangle {
        Rectangle { width, height } // 字段名与变量名同名时可简写
    }

    // 方法：第一个参数是 &self（对当前实例的不可变引用）
    // 调用时写 rect.area()，Rust 自动传入 &rect 作为 self
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    // 可变方法：第一个参数是 &mut self
    fn scale(&mut self, factor: f64) {
        self.width  *= factor;
        self.height *= factor;
    }

    // 消耗 self（取得所有权）：第一个参数是 self（无引用）
    // 调用后 self 失效
    fn describe(self) -> String {
        format!("Rectangle({}x{})", self.width, self.height)
    }
}

fn main() {
    let mut rect = Rectangle::new(5.0, 3.0);
    println!("面积: {}", rect.area());       // 15
    println!("周长: {}", rect.perimeter()); // 16
    rect.scale(2.0);
    println!("放大后: {}", rect.describe()); // Rectangle(10x6)
    // println!("{}", rect.area()); // 编译错误：rect 已被 describe 消耗
}
```

**方法解析（Method Resolution）**：调用 `rect.area()` 时，Rust 会自动给 `rect` 加上 `&`（因为 `area` 需要 `&self`）。这就是 Rust 的**自动引用与解引用**（auto-ref/deref），和 C++ 的 `->` 操作符类似但更统一。

### 元组结构体（Tuple Struct）

没有字段名的结构体，通过 `.0`、`.1` 访问字段，常用于创建新类型：

```rust
struct Meters(f64);    // 米
struct Kilograms(f64); // 千克

fn add_meters(a: Meters, b: Meters) -> Meters {
    Meters(a.0 + b.0)
}

fn main() {
    let height = Meters(1.75);
    let weight = Kilograms(70.0);
    // add_meters(height, weight); // 编译错误：类型不同，即使底层都是 f64
    // 这就是"新类型模式"（newtype pattern），用来在类型系统层面区分语义
    println!("身高: {}m", height.0);
}
```

## 枚举（Enum）

Rust 的枚举是**带标签的联合体（tagged union）**，每个变体可以携带不同类型的数据。这比 C 的 `union` 安全（因为始终知道当前是哪个变体），也比 C++ 的 `std::variant` 简洁。

### 内存布局

```rust
enum Shape {
    Circle(f64),          // 变体标签(1字节) + f64(8字节) → 共 16 字节（含对齐）
    Rectangle(f64, f64),  // 变体标签 + f64 + f64 → 共 24 字节
    Point,                // 变体标签 + 无数据 → 1字节（含对齐后可能更多）
}
// 整个枚举的大小 = 最大变体的大小（所有变体共用同一块内存）
```

```rust
enum Direction { North, South, East, West }

fn move_player(dir: Direction) {
    match dir {
        Direction::North => println!("向北"),
        Direction::South => println!("向南"),
        Direction::East  => println!("向东"),
        Direction::West  => println!("向西"),
    }
}
```

### 携带数据的枚举

```rust
#[derive(Debug)]
enum Message {
    Quit,                       // 无数据
    Move { x: i32, y: i32 },   // 匿名结构体
    Write(String),              // 元组变体
    Color(u8, u8, u8),          // 多元组变体
}

impl Message {
    fn process(&self) {
        match self {
            Message::Quit              => println!("退出"),
            Message::Move { x, y }    => println!("移动到 ({}, {})", x, y),
            Message::Write(text)       => println!("写入: {}", text),
            Message::Color(r, g, b)   => println!("颜色 RGB({}, {}, {})", r, g, b),
        }
    }
}

fn main() {
    let msgs = vec![
        Message::Move { x: 10, y: 20 },
        Message::Write(String::from("Hello")),
        Message::Color(255, 128, 0),
        Message::Quit,
    ];
    for msg in &msgs {
        msg.process();
    }
}
```

## Option\<T\>：告别 null

`null` 是托尼·霍尔（Tony Hoare）1965年设计的，他后来称之为"十亿美元错误"——因为空指针解引用导致了无数程序崩溃和安全漏洞。

Rust 没有 `null`。它用 `Option<T>` 枚举来表示"可能有值，也可能没有"：

```rust
// 标准库中 Option 的定义（概念上）：
// enum Option<T> {
//     Some(T), // 有值
//     None,    // 没有值
// }

fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    // 必须处理 None 才能用值
    let result = divide(10.0, 2.0);
    match result {
        Some(val) => println!("结果: {}", val),
        None      => println!("除数不能为零"),
    }

    // 常用的 Option 方法
    let x: Option<i32> = Some(5);

    println!("{}", x.unwrap());           // 5（None 时 panic，不推荐生产代码用）
    println!("{}", x.unwrap_or(0));       // 5（None 时返回默认值 0，推荐）
    println!("{}", x.unwrap_or_else(|| { // None 时调用闭包计算默认值
        println!("计算默认值...");
        42
    }));

    // map：对 Some 中的值做变换，None 直接传透
    let doubled = x.map(|v| v * 2);
    println!("{:?}", doubled); // Some(10)

    // and_then：链式处理，也叫 flatMap
    let parsed: Option<i32> = Some("42").and_then(|s| s.parse().ok());
    println!("{:?}", parsed); // Some(42)

    // ?  运算符（在返回 Option 的函数中）
    // 若为 None 则提前返回 None，类似 Result 中的 ?
}
```

**`Option` 和 `null` 的根本区别**：`Option<T>` 是一个独立的类型，`T` 和 `Option<T>` 完全不同。你不能在需要 `i32` 的地方传入 `Option<i32>`，必须先解包。这强制你处理"没有值"的情况，而不是等到运行时崩溃。

## Result\<T, E\>：类型化的错误处理

`Result` 是 Rust 错误处理的核心，用于表示"操作要么成功，要么失败"：

```rust
// enum Result<T, E> {
//     Ok(T),  // 成功，携带返回值
//     Err(E), // 失败，携带错误信息
// }

use std::num::ParseIntError;

fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.trim().parse::<i32>() // .parse() 本身就返回 Result
}

fn main() {
    // 必须处理 Err 才能拿到值
    match parse_number("42") {
        Ok(n)  => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    match parse_number("abc") {
        Ok(n)  => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    // ? 运算符：若为 Err 则提前返回，简化错误传播（第7篇详细介绍）
    fn double_parse(s: &str) -> Result<i32, ParseIntError> {
        let n = s.trim().parse::<i32>()?; // 失败时直接 return Err(e)
        Ok(n * 2)
    }

    println!("{:?}", double_parse("21")); // Ok(42)
    println!("{:?}", double_parse("x"));  // Err(...)
}
```

**`Result` 和异常（Exception）的区别**：

Java/Python 的异常是**隐式**的——一个函数可能抛出异常，但从函数签名上看不出来，调用者可能完全不知道需要处理。`Result` 是**显式**的——函数签名直接告诉你"我可能失败，失败时返回这个错误类型"，不处理就编译报错（不能对 `Result` 不管不顾）。

Rust 的哲学：**错误是程序逻辑的一部分，应该在类型系统中明确表达，而不是隐藏在异常机制里。**
