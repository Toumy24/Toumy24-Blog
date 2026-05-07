---
title: "通用语言教程-Rust 篇【8】模块系统与智能指针"
date: 2026-05-08T16:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","模块","智能指针","Cargo"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

从本章开始，正式进入 Rust 的**工程化**与**高级内存管理**领域。

- **模块系统**：Rust 组织代码的方式，类似 C++ 的头文件 + 命名空间，但更现代化
- **智能指针**：对应 C++11 的 `std::unique_ptr` / `std::shared_ptr`，是安全管理堆内存的利器

---

## 模块系统与 Cargo

### Cargo 项目结构

Rust 的官方构建工具 Cargo 约定了标准项目结构：

```text
my_project/
├── Cargo.toml        # 项目配置文件（类似 package.json 或 CMakeLists.txt）
├── Cargo.lock        # 依赖版本锁定文件（自动生成）
└── src/
    ├── main.rs       # 可执行程序入口
    ├── lib.rs        # 库入口（如果是库项目）
    └── utils/
        ├── mod.rs    # 模块声明文件
        └── math.rs   # 子模块
```

`Cargo.toml` 示例：

```toml
[package]
name    = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde       = { version = "1.0", features = ["derive"] } # 序列化库
rand        = "0.8"                                       # 随机数库
```

添加依赖后执行 `cargo build` 即可自动下载并编译，类比 Python 的 `pip install`。

### 模块（mod）

Rust 使用 `mod` 关键字组织代码模块：

```rust
// src/main.rs

mod geometry {                          // 内联模块
    pub struct Circle {                 // pub 表示公开（类似 C++ 的 public）
        pub radius: f64,
    }

    impl Circle {
        pub fn new(radius: f64) -> Circle {
            Circle { radius }
        }

        pub fn area(&self) -> f64 {
            std::f64::consts::PI * self.radius * self.radius
        }
    }

    pub mod shapes {                    // 嵌套模块
        pub fn square_area(side: f64) -> f64 {
            side * side
        }
    }
}

// use 引入模块路径（类似 C++ 的 using namespace）
use geometry::Circle;
use geometry::shapes::square_area;

fn main() {
    let c = Circle::new(5.0);
    println!("圆面积: {:.2}", c.area());             // 78.54
    println!("正方形面积: {:.2}", square_area(4.0)); // 16.00
}
```

### 跨文件模块

将模块拆分到独立文件：

```rust
// src/math.rs
pub fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        let temp = b;
        b = a % b;
        a = temp;
    }
    a
}

pub fn lcm(a: u64, b: u64) -> u64 {
    a / gcd(a, b) * b
}
```

```rust
// src/main.rs
mod math; // 声明加载 src/math.rs 文件

use math::{gcd, lcm};

fn main() {
    println!("gcd(48, 18) = {}", gcd(48, 18)); // 6
    println!("lcm(4, 6)   = {}", lcm(4, 6));   // 12
}
```

### use 的常用写法

```rust
// 引入单个
use std::collections::HashMap;

// 引入多个（嵌套路径）
use std::io::{self, Read, Write};

// 引入并重命名（as 别名，类似 Python 的 import ... as ...）
use std::collections::HashMap as Map;

// 引入全部公开项（谨慎使用）
use std::io::prelude::*;

// 绝对路径（以 crate:: 开头）
use crate::math::gcd;
```

---

## 智能指针

Rust 的智能指针是实现了 `Deref` 和 `Drop` Trait 的结构体，它们在拥有额外功能的同时，表现得像普通引用。

### Box\<T\>：堆上分配

`Box<T>` 将数据分配在**堆**上，类似 C++ 的 `new`，但会在离开作用域时**自动释放**（无需 `delete`）：

```rust
fn main() {
    // 基本用法：将值放到堆上
    let b = Box::new(5);
    println!("b = {}", b); // 可以像普通值一样使用（Deref 自动解引用）

    // 主要用途1：存储大数据，避免栈溢出
    let large_array = Box::new([0u8; 1_000_000]); // 1MB 数据放堆上
    println!("数组长度: {}", large_array.len());

    // 主要用途2：递归数据结构（编译期大小未知）
    // 若不用 Box，编译器无法确定 List 的大小
}

// 递归数据结构（链表）：必须用 Box 打破无限大小
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>), // Box 使得 List 的大小确定（一个指针大小）
    Nil,
}

fn main() {
    use List::{Cons, Nil};
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("{:?}", list);
}
```

### Rc\<T\>：引用计数共享所有权

`Rc<T>`（Reference Counting）允许**多个所有者**共享同一份数据，类似 C++ 的 `std::shared_ptr`：

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("共享数据"));
    println!("引用计数: {}", Rc::strong_count(&a)); // 1

    let b = Rc::clone(&a); // 克隆指针（不克隆数据），引用计数 +1
    let c = Rc::clone(&a);
    println!("引用计数: {}", Rc::strong_count(&a)); // 3

    println!("a = {}", a);
    println!("b = {}", b);
    println!("c = {}", c);

    drop(c); // 手动提前释放
    println!("引用计数: {}", Rc::strong_count(&a)); // 2
} // a 和 b 离开作用域，引用计数归零，数据被释放
```

> **注意**：`Rc<T>` 只适用于**单线程**场景。多线程环境下需要使用原子引用计数 `Arc<T>`（Atomic Reference Counting），用法完全相同。

### RefCell\<T\>：内部可变性

`RefCell<T>` 允许在**拥有不可变引用**时修改内部值（将借用规则检查从编译期推迟到运行期）：

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 获取不可变借用
    println!("{:?}", data.borrow());

    // 获取可变借用并修改
    data.borrow_mut().push(4);
    println!("{:?}", data.borrow()); // [1, 2, 3, 4]

    // 运行时会检查借用规则，违反时 panic
    // let r1 = data.borrow();
    // let r2 = data.borrow_mut(); // 运行时 panic！已有不可变借用
}
```

### Rc\<RefCell\<T\>\>：共享可变数据

在实际开发中，`Rc<RefCell<T>>` 是单线程下实现**共享可变数据**的经典组合：

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<RefCell<Node>>>,
}

impl Node {
    fn new(value: i32) -> Rc<RefCell<Node>> {
        Rc::new(RefCell::new(Node { value, children: vec![] }))
    }

    fn add_child(parent: &Rc<RefCell<Node>>, child: Rc<RefCell<Node>>) {
        parent.borrow_mut().children.push(child);
    }
}

fn main() {
    let root  = Node::new(1);
    let child1 = Node::new(2);
    let child2 = Node::new(3);

    Node::add_child(&root, Rc::clone(&child1));
    Node::add_child(&root, Rc::clone(&child2));
    Node::add_child(&child1, Node::new(4)); // child1 也可以继续添加子节点

    println!("{:#?}", root);
}
```

### 智能指针对比

| 类型 | 所有权 | 可变性 | 线程安全 | 类比（C++）|
|------|--------|--------|----------|------------|
| `Box<T>` | 单一所有权 | 正常借用规则 | ✅（所有权转移） | `unique_ptr` |
| `Rc<T>` | 共享所有权 | 只读共享 | ❌ 单线程 | `shared_ptr`（单线程）|
| `Arc<T>` | 共享所有权 | 只读共享 | ✅ 多线程 | `shared_ptr` |
| `RefCell<T>` | 单一所有权 | 内部可变性 | ❌ 单线程 | 无直接对应 |
| `Rc<RefCell<T>>` | 共享所有权 | 内部可变性 | ❌ 单线程 | `shared_ptr` + 手动锁 |
| `Arc<Mutex<T>>` | 共享所有权 | 互斥锁保护 | ✅ 多线程 | `shared_ptr<mutex>` |

> 多线程并发的详细内容将在下一章专门介绍。
