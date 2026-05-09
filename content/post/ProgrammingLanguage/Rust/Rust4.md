﻿﻿---
title: "通用语言教程-Rust 篇【4】函数、闭包与自定义类型"
date: 2026-05-07T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","函数","闭包","结构体","枚举","Option","Result"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 函数

Rust 的函数用 `fn` 关键字定义。每个参数必须显式声明类型，返回值类型用 `->` 标出。

**通用语法格式：**

```text
fn 函数名(参数名: 参数类型, 参数名: 参数类型, ...) -> 返回类型 {
    // 函数体
    // 最后一个表达式（不加分号）作为返回值
    // 也可以用 return 表达式; 提前返回
}

// 没有返回值时，省略 -> 部分（等同于 -> ()）
fn 函数名(参数名: 参数类型) {
    // 函数体
}
```

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b // 没有分号，这行的值就是函数的返回值
}
```

注意最后一行没有分号。这不是省略，而是 Rust 的**表达式语义**：没有分号的最后一行是函数的**返回值**。

加上分号就变成了**语句**，语句不产生值，函数就只返回 `()`（空元组，即"什么都不返回"）：

```rust
fn bad(a: i32) -> i32 {
    a + 1; // 分号让这行变成语句，函数返回 ()，和声明的 i32 不符
}          // 编译错误
```

也可以用 `return` 提前返回：

```rust
fn classify(n: i32) -> &'static str {
    if n < 0 {
        return "negative";
    }
    if n == 0 {
        return "zero";
    }
    "positive"
}
```

### 表达式与语句

这是 Rust 里让初学者困惑的地方，值得单独说清楚。

**语句**（statement）执行动作，没有值。`let x = 5;` 是语句，`println!("hello");` 是语句。语句以分号结尾，或者本身就是某些关键字结构（`use`、`fn` 定义等）。

**表达式**（expression）求值，有值。`3 + 4` 是表达式（值是 7），`{let x = 1; x + 2}` 这整个代码块也是表达式（值是 3），`if x > 0 { 1 } else { -1 }` 是表达式。

分号的作用是把表达式变成语句，丢弃它的值。正是因为这个语义，Rust 里的 `if` 和代码块都可以出现在赋值语句的右边：

```rust
fn main() {
    let n = 42;

    let description = if n > 0 { "positive" } else { "non-positive" };
    println!("{description}");

    let y = {
        let x = 3;
        x * x + 1 // 没有分号，这是块的值
    };
    println!("{y}"); // 10
}
```

### 多返回值

Rust 函数只能有一个返回值，但可以把多个值打包成元组返回：

```rust
fn min_max(v: &[i32]) -> (i32, i32) {
    let mut min = v[0];
    let mut max = v[0];
    for &x in v {
        if x < min { min = x; }
        if x > max { max = x; }
    }
    (min, max)
}

fn main() {
    let nums = [3, 1, 4, 1, 5, 9, 2, 6];
    let (min, max) = min_max(&nums); // 解构赋值
    println!("min={min}, max={max}");
}
```

## 闭包

闭包（Closure）是可以**捕获其定义环境中绑定**的匿名函数。和普通函数相比，闭包的两个特点是：不需要名字，以及可以"记住"外部作用域里的绑定（这叫捕获）。

**通用语法格式：**

```text
// 单行闭包（表达式直接作为返回值）
|参数1, 参数2, ...| 表达式

// 多行闭包
|参数1, 参数2, ...| {
    // 多行代码
    表达式  // 最后一行无分号，作为返回值
}

// 参数和返回值类型通常可省略，编译器自动推断
// 需要明确时可以标注：
|x: i32, y: i32| -> i32 { x + y }
```

```rust
fn main() {
    let base = 10;
    let add_base = |x| x + base; // 捕获了外部的 base 绑定
    println!("{}", add_base(5)); // 15
}
```

和函数不同，闭包通常不需要标注参数和返回值类型，编译器会根据使用方式推断。

### 闭包捕获绑定的方式

闭包根据如何使用捕获的绑定，分为三类：

**`Fn`** — 只读地借用捕获的绑定。可以被调用多次，每次调用后外部绑定仍然有效。

```rust
fn call_twice<F: Fn()>(f: F) {
    f();
    f();
}

fn main() {
    let msg = String::from("hello");
    call_twice(|| println!("{msg}")); // 不可变借用 msg
    println!("{msg}"); // msg 仍然有效
}
```

**`FnMut`** — 可变地借用捕获的绑定。每次调用可能修改捕获的值：

```rust
fn main() {
    let mut count = 0;
    let mut increment = || {
        count += 1;
        println!("count: {count}");
    };
    increment();
    increment();
}
```

**`FnOnce`** — 消耗捕获的绑定，只能被调用一次：

```rust
fn consume<F: FnOnce()>(f: F) {
    f();
    // f(); // 编译错误，f 的所有权已在第一次调用时被消耗
}

fn main() {
    let s = String::from("hello");
    consume(|| {
        println!("{s}");
        drop(s); // 这里消耗了 s，所以这是 FnOnce
    });
}
```

三者之间有包含关系：`Fn` 也是 `FnMut`，`FnMut` 也是 `FnOnce`。写参数类型时，能用 `Fn` 就用 `Fn`，限制最松，接受最广泛的闭包。

### move 闭包

有时需要闭包取得（而不是借用）捕获绑定的所有权，在 `||` 前加 `move`：

```rust
fn main() {
    let s = String::from("hello");
    let owned_closure = move || println!("{s}"); // s 的所有权移入闭包

    // println!("{s}"); // 编译错误：s 已被移走
    owned_closure();
}
```

`move` 闭包最常见于跨线程传递，因为新线程的生命周期不能确定，必须取得所有权而不是借用。

## 结构体

结构体（Struct）把多个有关联的数据字段组合在一起，给这组数据起一个有意义的名字。结构体是 Rust 里构建自定义类型的最基本方式之一。

**通用语法格式：**

```text
struct 结构体名 {
    字段名: 类型,
    字段名: 类型,
    // ...（字段之间用逗号分隔，最后一个字段后的逗号可选）
}
```

```rust
struct User {
    username: String,
    email: String,
    age: u32,
    active: bool,
}
```

创建实例时，所有字段都必须初始化：

```rust
fn main() {
    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        age: 30,
        active: true,
    };

    println!("{}", user1.username);
}
```

如果绑定名和字段名一样，可以简写：

```rust
fn new_user(username: String, email: String) -> User {
    User {
        username,          // 等同于 username: username
        email,             // 等同于 email: email
        age: 0,
        active: true,
    }
}
```

结构体更新语法可以从已有实例复制剩余字段：

```rust
fn main() {
    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        age: 30,
        active: true,
    };

    let user2 = User {
        email: String::from("bob@example.com"),
        username: String::from("bob"),
        ..user1 // age 和 active 从 user1 复制
    };
    // 注意：因为 username 和 email 是 String（不是 Copy），
    // ..user1 会移动 user1 中对应字段的所有权。
    // 这里 age 和 active 是 Copy，所以 user1.age 和 user1.active 仍可用。
}
```

### 元组结构体

没有字段名，只有类型的结构体：

```rust
struct Color(u8, u8, u8);
struct Point(f64, f64);

fn main() {
    let red = Color(255, 0, 0);
    let origin = Point(0.0, 0.0);
    println!("Red: {} {} {}", red.0, red.1, red.2);
}
```

元组结构体常用来给基本类型套一层有意义的名字，避免把 `Color` 和 `Point` 混用。

### 为结构体实现方法

方法定义在 `impl` 块里。所谓方法，就是第一个参数是 `self`（代表调用者自身）的函数，通过 `实例.方法名()` 调用；没有 `self` 的叫**关联函数（associated function）**，通过 `结构体名::函数名()` 调用，常用于构造器。

**通用语法格式：**

```text
impl 结构体名 {
    // 关联函数（没有 self，通过 结构体名::函数名() 调用）
    fn 函数名(参数: 类型, ...) -> 返回类型 { ... }

    // 不可变方法（只读，不修改 self）
    fn 方法名(&self) -> 返回类型 { ... }

    // 可变方法（可以修改 self 的字段）
    fn 方法名(&mut self) -> 返回类型 { ... }

    // 消耗方法（调用后 self 不可再用，少见）
    fn 方法名(self) -> 返回类型 { ... }
}
```

`Self`（大写）在 `impl` 块里是当前结构体类型的别名，等同于直接写结构体名：

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // &self 表示不可变借用 self，方法读取数据但不修改
    fn area(&self) -> f64 {
        self.width * self.height
    }

    // &mut self 表示可变借用，方法可以修改数据
    fn scale(&mut self, factor: f64) {
        self.width *= factor;
        self.height *= factor;
    }

    // self（无引用）表示消耗 self，调用后实例不可再用（少见）
    fn consume(self) -> f64 {
        self.width * self.height
    }

    // 没有 self 的叫关联函数（associated function），不绑定具体实例
    // 常用于构造器
    fn new(width: f64, height: f64) -> Self {
        Rectangle { width, height }
    }

    fn square(size: f64) -> Self {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    let mut rect = Rectangle::new(4.0, 3.0); // 关联函数用 :: 调用
    println!("面积: {}", rect.area());
    rect.scale(2.0);
    println!("放大后面积: {}", rect.area()); // 48.0
}
```

## 枚举

枚举（Enum）定义一种类型，它的值只能是若干个**变体（variant）**之一。每个变体可以没有数据，也可以携带不同类型和数量的数据。

**通用语法格式：**

```text
enum 枚举名 {
    变体名,                              // 无数据的变体
    变体名(类型),                        // 元组变体，携带一个值
    变体名(类型1, 类型2),                // 元组变体，携带多个值
    变体名 { 字段名: 类型, ... },        // 结构体变体，带命名字段
}
```

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let dir = Direction::North;
    match dir {
        Direction::North => println!("向北"),
        Direction::South => println!("向南"),
        Direction::East  => println!("向东"),
        Direction::West  => println!("向西"),
    }
}
```

枚举的强大之处在于每个变体可以携带不同类型和数量的数据：

```rust
enum Shape {
    Circle(f64),                      // 半径
    Rectangle(f64, f64),              // 宽、高
    Triangle { base: f64, height: f64 }, // 具名字段
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
        Shape::Triangle { base, height } => 0.5 * base * height,
    }
}
```

这种"携带数据的枚举"在其他语言里通常需要用类继承或标记 union 来模拟，Rust 把它内置进了语言。

## Option：用类型替代 null

很多语言用 `null` 表示"值不存在"。问题是 null 检查常常被遗忘，"百亿美元的错误"（null pointer dereference）由此而来。

Rust 没有 null。标准库的 `Option<T>` 枚举承担了同样的职责，但通过类型系统强制你处理"值不存在"的情况：

```rust
enum Option<T> {
    Some(T), // 有值
    None,    // 没有值
}
```

`Option` 在 prelude 里，不需要 `use`，`Some` 和 `None` 也可以直接用：

```rust
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    match divide(10.0, 2.0) {
        Some(result) => println!("结果: {result}"),
        None         => println!("除数不能为零"),
    }

    // 或者用更简洁的 if let
    if let Some(result) = divide(10.0, 0.0) {
        println!("结果: {result}");
    } else {
        println!("除数不能为零");
    }
}
```

`Option<T>` 和 `T` 是两种不同的类型。你不能把 `Option<i32>` 当 `i32` 使用，必须先解包。这就是"强制处理"：要么用 `match`，要么用 `if let`，要么用各种辅助方法。

常用辅助方法：

```rust
fn main() {
    let a: Option<i32> = Some(5);
    let b: Option<i32> = None;

    // unwrap_or：有值返回值，None 返回默认值
    println!("{}", a.unwrap_or(0)); // 5
    println!("{}", b.unwrap_or(0)); // 0

    // map：有值时转换，None 原样传递
    let doubled = a.map(|x| x * 2); // Some(10)
    println!("{doubled:?}");

    // unwrap：有值返回值，None 时 panic（只在确定有值时用）
    println!("{}", a.unwrap()); // 5
    // b.unwrap(); // panic！
}
```

## Result：用类型替代异常

Java/Python 用异常处理错误：错误从发生点沿调用栈往上抛，任何中间层不处理的话会一直传播，最终可能导致程序崩溃。问题是异常是隐式的，看函数签名看不出它会不会抛，容易漏处理。

Rust 用 `Result<T, E>` 枚举显式表示可能失败的操作：

```rust
enum Result<T, E> {
    Ok(T),  // 成功，携带结果值
    Err(E), // 失败，携带错误信息
}
```

标准库所有可能失败的函数都返回 `Result`。调用者必须处理两种情况，否则编译器会警告（忽略 `Result` 是告警）：

```rust
use std::fs;
use std::io;

fn read_file_content(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path)
}

fn main() {
    match read_file_content("config.txt") {
        Ok(content) => println!("文件内容: {content}"),
        Err(e)      => println!("读取失败: {e}"),
    }
}
```

`Result` 和 `Option` 的辅助方法类似：

```rust
fn main() {
    let result: Result<i32, &str> = Ok(42);

    // unwrap_or：Ok 返回值，Err 返回默认值
    println!("{}", result.unwrap_or(0));

    // map：Ok 时转换值
    let doubled = result.map(|x| x * 2);
    println!("{doubled:?}"); // Ok(84)

    // unwrap/expect：Ok 返回值，Err 时 panic
    // expect 可以提供更有意义的 panic 信息
    println!("{}", result.expect("计算失败"));
}
```

`expect("msg")` 和 `unwrap()` 的区别只是 panic 信息。在你确定操作不会失败的地方（或者在快速的示例代码里），用 `expect` 给出一个有意义的失败原因比用 `unwrap` 更好。

`?` 运算符是 `Result` 的语法糖，在返回 `Result` 的函数里使用时，`Err` 会立即被返回给调用者，`Ok` 则自动解包：

```rust
use std::fs;
use std::io;

fn process() -> Result<(), io::Error> {
    let content = fs::read_to_string("a.txt")?; // 失败则提前返回 Err
    let second  = fs::read_to_string("b.txt")?;
    println!("{content} {second}");
    Ok(())
}
```

`?` 让错误处理代码干净很多，不需要每次都写 `match`。关于 `?` 的完整机制（`From` trait 的自动转换）会在错误处理章节详细介绍。
