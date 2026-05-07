---
title: "通用语言教程-Rust 篇【4】函数、结构体与枚举"
date: 2026-05-08T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","函数","结构体","枚举"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 函数

### 函数定义

Rust 使用 `fn` 关键字定义函数：

```rust
fn greet(name: &str) {        // 参数必须标注类型
    println!("你好，{}！", name);
}

fn add(a: i32, b: i32) -> i32 { // -> 后跟返回类型
    a + b  // 函数最后一个表达式的值即为返回值（不加分号）
    // 等价于 return a + b;
}

fn main() {
    greet("Rust");
    let sum = add(3, 5);
    println!("3 + 5 = {}", sum);
}
```

> **Rust 函数的返回值**：函数体中最后一个**不带分号的表达式**即为返回值，加了分号就变成语句，返回 `()`（空元组，相当于 void）。这与其他语言差异较大，需要特别注意。

### 多返回值

Rust 可以通过**元组**返回多个值：

```rust
fn min_max(arr: &[i32]) -> (i32, i32) {
    let mut min = arr[0];
    let mut max = arr[0];
    for &val in arr {
        if val < min { min = val; }
        if val > max { max = val; }
    }
    (min, max) // 返回元组
}

fn main() {
    let nums = [3, 1, 4, 1, 5, 9, 2, 6];
    let (min, max) = min_max(&nums); // 解构元组
    println!("最小值: {}, 最大值: {}", min, max);
}
```

### 函数作为参数（高阶函数）

```rust
fn apply(f: fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

fn double(x: i32) -> i32 { x * 2 }
fn square(x: i32) -> i32 { x * x }

fn main() {
    println!("{}", apply(double, 5));  // 10
    println!("{}", apply(square, 5)); // 25
}
```

### 闭包（Closure）

闭包是可以**捕获外部环境**变量的匿名函数，类似 Python 的 lambda 或 C++ 的 lambda：

```rust
fn main() {
    let factor = 3;
    let multiply = |x| x * factor; // 闭包捕获了外部变量 factor
    // 等价于 Python 中的：multiply = lambda x: x * factor

    println!("{}", multiply(5));  // 15
    println!("{}", multiply(10)); // 30

    // 带类型标注的闭包
    let add = |a: i32, b: i32| -> i32 { a + b };
    println!("{}", add(3, 4)); // 7

    // 闭包配合迭代器（最常用）
    let nums = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = nums.iter().map(|x| x * 2).collect();
    // 等价于 Python 中的：doubled = list(map(lambda x: x*2, nums))
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    let evens: Vec<&i32> = nums.iter().filter(|&&x| x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4]

    let sum: i32 = nums.iter().sum();
    println!("sum = {}", sum); // 15
}
```

## 结构体（Struct）

结构体是将相关数据组合在一起的自定义数据类型，类似于其他语言的类（但没有继承）。

### 定义与使用

```rust
// 定义结构体
struct Student {
    name: String,
    age: u32,
    score: f64,
}

fn main() {
    // 创建结构体实例
    let stu = Student {
        name: String::from("小明"),
        age: 18,
        score: 92.5,
    };

    // 访问字段
    println!("姓名: {}, 年龄: {}, 成绩: {}", stu.name, stu.age, stu.score);

    // 可变结构体（整个实例必须是 mut）
    let mut stu2 = Student {
        name: String::from("小红"),
        age: 17,
        score: 88.0,
    };
    stu2.score = 95.0;
    println!("更新后成绩: {}", stu2.score);

    // 结构体更新语法（从另一个实例中继承部分字段）
    let stu3 = Student {
        name: String::from("小李"),
        ..stu2 // 其余字段从 stu2 复制
    };
    println!("小李年龄: {}", stu3.age); // 17
}
```

### 方法（impl）

使用 `impl` 块为结构体定义方法：

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // 关联函数（类似其他语言的静态方法或构造器），不接收 self
    fn new(width: f64, height: f64) -> Rectangle {
        Rectangle { width, height } // 字段名与变量名相同时可简写
    }

    // 方法，第一个参数为 &self（不可变引用）
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    // 可变方法，第一个参数为 &mut self
    fn scale(&mut self, factor: f64) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut rect = Rectangle::new(5.0, 3.0); // 使用关联函数创建实例
    println!("面积: {}", rect.area());       // 15
    println!("周长: {}", rect.perimeter()); // 16

    rect.scale(2.0);
    println!("放大后面积: {}", rect.area()); // 60
}
```

## 枚举（Enum）

枚举允许定义一种类型，其值只能是若干**变体（variant）**之一。Rust 的枚举比其他语言强大得多，每个变体可以携带不同类型的数据。

### 基本枚举

```rust
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

fn move_player(dir: Direction) {
    match dir {
        Direction::Up    => println!("向上移动"),
        Direction::Down  => println!("向下移动"),
        Direction::Left  => println!("向左移动"),
        Direction::Right => println!("向右移动"),
    }
}

fn main() {
    move_player(Direction::Up);
}
```

### 携带数据的枚举

```rust
enum Shape {
    Circle(f64),              // 携带一个 f64（半径）
    Rectangle(f64, f64),      // 携带两个 f64（宽、高）
    Triangle(f64, f64, f64),  // 携带三个 f64（三条边）
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r)         => std::f64::consts::PI * r * r,
            Shape::Rectangle(w, h)   => w * h,
            Shape::Triangle(a, b, c) => {
                // 海伦公式
                let s = (a + b + c) / 2.0;
                (s * (s - a) * (s - b) * (s - c)).sqrt()
            }
        }
    }
}

fn main() {
    let shapes = vec![
        Shape::Circle(3.0),
        Shape::Rectangle(4.0, 5.0),
        Shape::Triangle(3.0, 4.0, 5.0),
    ];

    for shape in &shapes {
        println!("面积: {:.2}", shape.area());
    }
}
```

### Option 枚举

`Option<T>` 是 Rust 标准库中最重要的枚举，用于表示一个值**可能存在也可能不存在**，替代了其他语言中危险的 `null`：

```rust
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None     // 没有值
    } else {
        Some(a / b) // 有值
    }
}

fn main() {
    let result = divide(10.0, 2.0);
    match result {
        Some(val) => println!("结果: {}", val), // 5
        None      => println!("除数不能为零"),
    }

    // 常用的 Option 方法
    let x: Option<i32> = Some(5);
    println!("{}", x.unwrap());           // 5（若为 None 会 panic）
    println!("{}", x.unwrap_or(0));       // 5（若为 None 返回默认值 0）
    println!("{}", x.is_some());          // true
    println!("{}", x.is_none());          // false

    let doubled = x.map(|v| v * 2);      // 变换 Some 中的值
    println!("{:?}", doubled);            // Some(10)
}
```

### Result 枚举

`Result<T, E>` 用于**错误处理**，表示操作结果要么成功（`Ok(T)`），要么失败（`Err(E)`）：

```rust
use std::num::ParseIntError;

fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.trim().parse::<i32>() // parse 返回 Result 类型
}

fn main() {
    match parse_number("42") {
        Ok(n)  => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    match parse_number("abc") {
        Ok(n)  => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    // ? 运算符：若为 Err 则提前返回，简化错误传播
    // 后续章节详细介绍
}
```
