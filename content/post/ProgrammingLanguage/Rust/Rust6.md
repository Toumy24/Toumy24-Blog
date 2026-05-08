---
title: "通用语言教程-Rust 篇【6】泛型与 Trait"
date: 2026-05-07T14:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","泛型","Trait","多态"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 泛型

代码里经常会出现"结构完全相同，只是类型不同"的情况。泛型（Generics）让你写一份代码，适用于多种类型。泛型用 `<T>` 表示类型参数，`T` 只是习惯命名，可以用任何标识符。

### 泛型函数

**通用语法格式：**

```text
fn 函数名<T>(参数: T) -> T {
    // T 在这里代表"某种类型"，调用时由编译器根据实参推断具体是什么类型
}

// 有约束时（T 必须实现某些 trait 才能调用对应方法）
fn 函数名<T: Trait名>(参数: &[T]) -> &T { ... }

// 多个约束用 +
fn 函数名<T: Trait1 + Trait2>(参数: T) { ... }
```

不用泛型时，对 `i32` 求最大值写一个函数，对 `f64` 再写一个。用泛型写一次就够了：

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大值: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大值: {}", largest(&chars));
}
```

`<T: PartialOrd>` 表示 `T` 必须实现 `PartialOrd` trait，这样才能用 `>` 比较。这叫 **trait 约束（trait bound）**，没有约束的 `T` 什么方法都不能调用，因为编译器不知道这个类型支持哪些操作。

### 泛型结构体

```rust
struct Pair<T> {
    first: T,
    second: T,
}

impl<T> Pair<T> {
    fn new(first: T, second: T) -> Self {
        Pair { first, second }
    }
}

impl<T: std::fmt::Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.first >= self.second {
            println!("第一个更大: {}", self.first);
        } else {
            println!("第二个更大: {}", self.second);
        }
    }
}
```

两个 `impl` 块里，第一个对所有 `T` 都实现，第二个只对满足 `Display + PartialOrd` 约束的 `T` 实现。

### 单态化：零成本抽象

Rust 的泛型在**编译期**展开：编译器分析你实际用了哪些具体类型，为每种类型生成专门的代码。`largest::<i32>` 和 `largest::<char>` 会被编译成两份独立的机器码，和你手写两个函数一样高效。运行时不存在"查询类型是什么"的动态分发，没有任何额外开销。

这就是 Rust 常说的"零成本抽象"——用泛型写出来的代码，性能和手写的特化版本相同。代价是编译时间更长（因为要展开），以及编译产物的体积更大（每种类型都有一份代码）。

## Trait

Trait（特征）定义了一组方法签名，任何类型只要实现了这些方法，就说它"实现了这个 trait"。Trait 是 Rust 多态的基础，类似 Java 的 interface 或 Go 的 interface，但功能更丰富。

**通用语法格式：**

```text
// 定义 trait
trait Trait名 {
    fn 方法名(&self) -> 返回类型;         // 必须实现的方法（只有签名）
    fn 方法名(&self) -> 返回类型 {        // 有默认实现的方法（可以被覆盖）
        // 默认实现
    }
}

// 为某个类型实现 trait
impl Trait名 for 类型名 {
    fn 方法名(&self) -> 返回类型 {
        // 这个类型的具体实现
    }
}
```

### 定义与实现

```rust
trait Summary {
    fn summarize(&self) -> String;

    // 默认实现：如果类型没有提供自己的实现，使用这个
    fn preview(&self) -> String {
        format!("{}...", &self.summarize()[..20.min(self.summarize().len())])
    }
}

struct Article {
    title: String,
    content: String,
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, self.content)
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
    // preview 使用默认实现，不需要写
}
```

### 孤儿规则

可以为自己的类型实现外部 trait，也可以为外部类型实现自己的 trait，但不能为外部类型实现外部 trait。简单说：trait 和类型至少有一个得是你写的。

这条限制保证了别人的代码不会悄悄改变你的类型的行为。

### Trait 作为参数

用 `impl Trait` 语法表示"实现了某个 trait 的类型"：

```rust
fn notify(item: &impl Summary) {
    println!("新内容: {}", item.summarize());
}
```

这是语法糖，完整写法是：

```rust
fn notify<T: Summary>(item: &T) {
    println!("新内容: {}", item.summarize());
}
```

多个约束用 `+`：

```rust
fn notify<T: Summary + std::fmt::Display>(item: &T) {
    println!("{item}");
}
```

复杂时用 `where` 让签名更清晰：

```rust
fn compare_and_display<T, U>(t: &T, u: &U)
where
    T: std::fmt::Display + PartialOrd,
    U: std::fmt::Display + Clone,
{
    // ...
}
```

## 静态分发与动态分发

Trait 有两种使用方式，运行机制完全不同。

### 静态分发（impl Trait / 泛型）

用泛型或 `impl Trait` 时，编译器在编译期就知道具体类型，为每种类型生成专用代码。调用哪个方法在编译期就确定了，没有运行时查找，速度最快。缺点是同一个函数对不同类型会生成多份代码，编译产物更大。

### 动态分发（dyn Trait）

有时候你不能或不想在编译期确定类型，比如需要把不同类型的值放进同一个集合：

```rust
trait Draw {
    fn draw(&self);
}

struct Circle;
struct Square;

impl Draw for Circle {
    fn draw(&self) { println!("画圆"); }
}

impl Draw for Square {
    fn draw(&self) { println!("画方形"); }
}

fn main() {
    // Box<dyn Draw> 是指向堆上某个实现了 Draw 的对象的指针
    let shapes: Vec<Box<dyn Draw>> = vec![
        Box::new(Circle),
        Box::new(Square),
        Box::new(Circle),
    ];

    for shape in &shapes {
        shape.draw(); // 运行时才确定调用哪个 draw
    }
}
```

`dyn Draw` 的底层是一个"胖指针"，包含两个指针：一个指向数据本身，一个指向**虚函数表（vtable）**。vtable 里存着这个类型实现的所有 trait 方法的函数指针。调用方法时，先查 vtable 找到函数地址，再调用——这比静态分发多一次指针间接跳转，有一点开销，但通常可以忽略不计。

`dyn Trait` 必须放在引用（`&dyn Trait`）或 `Box`（`Box<dyn Trait>`）后面，因为编译器不知道具体类型的大小，不能直接放在栈上。

选择建议：大多数情况用泛型（静态分发）；需要把不同类型混放在一起、或者需要在运行时才知道类型时，用 `dyn Trait`（动态分发）。

## 常用标准库 Trait

| Trait | 用途 | 如何启用 |
|-------|------|---------|
| `Clone` | 显式深拷贝 | `#[derive(Clone)]` |
| `Copy` | 赋值时隐式复制（只适用于栈类型） | `#[derive(Copy, Clone)]` |
| `Debug` | `{:?}` 格式化输出 | `#[derive(Debug)]` |
| `Display` | `{}` 格式化输出 | 手动实现 `impl fmt::Display` |
| `PartialEq` / `Eq` | `==` 和 `!=` 比较 | `#[derive(PartialEq, Eq)]` |
| `PartialOrd` / `Ord` | `<`、`>`、`<=`、`>=` 比较 | `#[derive(PartialOrd, Ord)]` |
| `Default` | 提供默认值 | `#[derive(Default)]` 或手动实现 |
| `Iterator` | 实现迭代器协议 | 手动实现 `fn next` |
| `From` / `Into` | 类型转换 | 实现 `From`，`Into` 自动得到 |
| `Add`、`Sub` 等 | 运算符重载 | 手动实现 `std::ops::Add` 等 |

### derive 宏

`#[derive(...)]` 让编译器自动为你的类型生成标准实现：

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1.clone();
    println!("{p1:?}");    // Debug 格式
    println!("{}", p1 == p2); // PartialEq 比较，true
}
```

### 手动实现 Display

```rust
use std::fmt;

struct Matrix {
    a: f64, b: f64,
    c: f64, d: f64,
}

impl fmt::Display for Matrix {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{} {}]\n[{} {}]", self.a, self.b, self.c, self.d)
    }
}

fn main() {
    let m = Matrix { a: 1.0, b: 2.0, c: 3.0, d: 4.0 };
    println!("{m}");
}
```

### 运算符重载

```rust
use std::ops::Add;

#[derive(Debug, Clone, Copy)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl Add for Vec2 {
    type Output = Vec2;
    fn add(self, rhs: Vec2) -> Vec2 {
        Vec2 { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 3.0, y: 4.0 };
    let c = a + b;
    println!("{c:?}"); // Vec2 { x: 4.0, y: 6.0 }
}
```

### 自定义迭代器

实现 `Iterator` trait 只需要提供 `next` 方法：

```rust
struct Counter {
    count: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Counter {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let sum: u32 = Counter::new(5).sum(); // 1+2+3+4+5
    println!("{sum}"); // 15

    // 实现了 Iterator 后，filter/map/zip 等方法全部自动可用
    let result: Vec<u32> = Counter::new(5)
        .zip(Counter::new(5).skip(1))
        .map(|(a, b)| a * b)
        .collect();
    println!("{result:?}"); // [2, 6, 12, 20]
}
```

只需实现一个方法，就能获得标准库里几十个迭代器方法。这是 trait 的典型用法：提供少量核心接口，在上面构建大量通用逻辑。
