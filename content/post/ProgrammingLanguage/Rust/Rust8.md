---
title: "通用语言教程-Rust 篇【8】模块系统与智能指针"
date: 2026-05-07T16:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","模块","智能指针","Box","Rc","RefCell"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

这一章进入工程化视角。

**模块系统**解决"如何组织代码"的问题——如何把代码分成模块、文件、crate，如何控制可见性。

**智能指针**解决"所有权模型在复杂场景下不够用"的问题——有时你真的需要多个所有者，或者在不可变上下文里修改数据。Rust 通过智能指针在不破坏所有权原则的前提下，提供了这些能力。

---

## Cargo 与项目结构

Rust 的官方构建工具 Cargo 约定了标准目录结构：

```text
my_project/
├── Cargo.toml        # 项目配置（类似 package.json）
├── Cargo.lock        # 依赖版本锁定（自动生成，可执行程序应提交，库不提交）
└── src/
    ├── main.rs       # 可执行程序入口（bin crate 的根）
    ├── lib.rs        # 库入口（lib crate 的根）
    └── utils/
        ├── mod.rs    # utils 模块的声明文件（Rust 2015 风格）
        └── math.rs   # utils::math 子模块
```

`Cargo.toml` 示例：

```toml
[package]
name    = "my_project"
version = "0.1.0"
edition = "2021"     # Rust 版次，影响部分语法和默认设置

[dependencies]
serde = { version = "1.0", features = ["derive"] } # 序列化/反序列化
tokio = { version = "1",   features = ["full"] }   # 异步运行时
rand  = "0.8"                                       # 随机数

[dev-dependencies]
# 只在测试和 benchmark 时引入的依赖
```

执行 `cargo add serde --features derive` 可以自动修改 `Cargo.toml` 并更新 `Cargo.lock`。

---

## 模块系统（mod）

### 模块树

Rust 的模块系统组织成一棵树，根是 `crate`（`main.rs` 或 `lib.rs`）：

```text
crate (main.rs)
├── geometry
│   ├── Circle（pub struct）
│   └── shapes（pub mod）
│       └── square_area（pub fn）
└── utils
    └── math
        ├── gcd（pub fn）
        └── lcm（pub fn）
```

### 内联模块

```rust
// src/main.rs

mod geometry {                          // 模块声明（内联）
    pub struct Circle {                 // pub 表示对外可见
        pub radius: f64,                // 字段也需要 pub 才能从外部访问
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

use geometry::Circle;            // use 引入路径（类似 C++ 的 using）
use geometry::shapes::square_area;

fn main() {
    let c = Circle::new(5.0);
    println!("圆面积: {:.2}", c.area());             // 78.54
    println!("正方形面积: {:.2}", square_area(4.0)); // 16.00
}
```

### 跨文件模块（Rust 2018+ 推荐方式）

```rust
// src/math.rs（模块文件，不需要 mod.rs）
pub fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        let t = b; b = a % b; a = t;
    }
    a
}

pub fn lcm(a: u64, b: u64) -> u64 {
    a / gcd(a, b) * b
}
```

```rust
// src/main.rs
mod math;         // 告诉编译器加载 src/math.rs 文件作为 math 模块

use math::{gcd, lcm};

fn main() {
    println!("gcd(48, 18) = {}", gcd(48, 18)); // 6
    println!("lcm(4, 6)   = {}", lcm(4, 6));   // 12
}
```

### 可见性规则

```rust
mod outer {
    pub fn public_fn() {}       // crate 外可见
    fn private_fn() {}          // 只有当前模块可见

    pub(crate) fn crate_fn() {} // 当前 crate 内可见，外部不可见
    pub(super) fn super_fn() {} // 父模块可见

    pub mod inner {
        pub fn inner_fn() {
            super::private_fn(); // 子模块可以访问父模块的私有项
        }
    }
}
```

### use 的常用写法

```rust
use std::collections::HashMap;                 // 引入单个

use std::io::{self, Read, Write};              // 引入多个（self 表示 std::io 本身）

use std::collections::HashMap as Map;          // 重命名（类似 Python 的 as）

use std::io::prelude::*;                       // 引入全部 pub 项（谨慎，容易命名冲突）

use crate::math::gcd;                          // 绝对路径（从当前 crate 根开始）
use super::sibling_fn;                         // 相对路径（父模块）
```

---

## 智能指针

Rust 的智能指针是实现了 `Deref` 和 `Drop` Trait 的结构体。

- **`Deref`**：让智能指针能像普通引用一样使用（`*p` 自动解引用）
- **`Drop`**：在作用域结束时自动执行清理逻辑（RAII）

### Box\<T\>：堆上分配

`Box<T>` 把一个值放到堆上，本质是一个指向堆内存的单一所有权指针——类比 C++ 的 `std::unique_ptr`：

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b); // Deref 自动解引用，像普通值一样用

    // 用途1：大数据放堆上，避免栈溢出
    let large = Box::new([0u8; 1_000_000]); // 1MB 不放栈上
    println!("size: {}", large.len());
}

// 用途2：递归数据结构——编译器必须知道类型的大小
// 这段代码无法编译：
// enum BadList {
//     Cons(i32, BadList), // 错误：BadList 的大小是无限的（包含自己）
//     Nil,
// }

// 用 Box 修复：Box<List> 的大小固定（一个指针大小，8字节）
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

fn main() {
    use List::{Cons, Nil};
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("{:?}", list);
}
```

**Deref 强制转换（Deref Coercion）**：当类型实现了 `Deref` 时，`&Box<T>` 可以自动转换为 `&T`，`&String` 可以转换为 `&str`，`&Vec<T>` 可以转换为 `&[T]`。这就是为什么接受 `&str` 的函数可以传入 `&String`。

### Rc\<T\>：引用计数，多个所有者

`Rc<T>`（Reference Counting）允许多个变量共同拥有同一份数据，类比 C++ 的 `std::shared_ptr`：

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("共享的数据"));
    println!("初始引用计数: {}", Rc::strong_count(&data)); // 1

    let clone1 = Rc::clone(&data); // 克隆指针（不克隆数据），引用计数 +1
    let clone2 = Rc::clone(&data);
    println!("克隆后引用计数: {}", Rc::strong_count(&data)); // 3

    println!("{}", data);   // "共享的数据"
    println!("{}", clone1); // "共享的数据"
    println!("{}", clone2); // "共享的数据"

    drop(clone2);
    println!("drop 一个后: {}", Rc::strong_count(&data)); // 2
} // data 和 clone1 离开作用域，引用计数降到 0，数据被释放
```

**内部实现**：`Rc<T>` 在堆上分配一块内存，里面存：数据本身、强引用计数、弱引用计数。每次 `clone` 只是把强引用计数 +1（很快，O(1)），每次 `drop` 强引用计数 -1，降到 0 时释放内存。

**重要限制**：`Rc<T>` 是**非线程安全**的（引用计数操作不是原子的）。多线程环境必须用 `Arc<T>`（Atomic Reference Counting），用法完全相同，只是内部用原子操作保证线程安全，开销略高。

### RefCell\<T\>：内部可变性（运行时借用检查）

默认情况下，如果你有一个不可变引用 `&T`，你无法修改 `T`。`RefCell<T>` 把这个限制**从编译期推迟到运行期**：

```rust
use std::cell::RefCell;

fn main() {
    // RefCell 包裹的数据，即使 cell 本身是不可变的，内部也可以修改
    let cell = RefCell::new(vec![1, 2, 3]);

    // borrow() 返回不可变引用 Ref<T>（类似 &T），引用计数 +1
    println!("{:?}", cell.borrow()); // [1, 2, 3]

    // borrow_mut() 返回可变引用 RefMut<T>（类似 &mut T）
    cell.borrow_mut().push(4);
    println!("{:?}", cell.borrow()); // [1, 2, 3, 4]

    // 运行时仍然强制执行借用规则，违反时 panic（而不是编译错误）
    let r1 = cell.borrow();
    // let r2 = cell.borrow_mut(); // 运行时 panic：已有不可变借用，不能可变借用
    println!("{:?}", r1);
} // r1 离开作用域，borrow 引用释放
```

**什么时候用 RefCell？** 当你知道代码在逻辑上是正确的，但编译器的静态借用检查"过于保守"，拒绝了实际上安全的代码。典型场景：实现图数据结构、mock 对象测试、某些设计模式需要"内部状态修改但外部接口不可变"。

### Rc\<RefCell\<T\>\>：单线程共享可变数据

这是单线程下"共享 + 可变"的经典组合：

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value:    i32,
    children: Vec<Rc<RefCell<Node>>>,
}

impl Node {
    fn new(value: i32) -> Rc<RefCell<Node>> {
        Rc::new(RefCell::new(Node { value, children: vec![] }))
    }
}

fn main() {
    let root   = Node::new(1);
    let child1 = Node::new(2);
    let child2 = Node::new(3);

    // root 和 child1 都持有 child2 的引用（多所有者）
    root.borrow_mut().children.push(Rc::clone(&child1));
    root.borrow_mut().children.push(Rc::clone(&child2));
    child1.borrow_mut().children.push(Rc::clone(&child2)); // 菱形引用

    println!("root 的第一个子节点值: {}", child1.borrow().value);
    // 修改 child2，所有指向它的引用都看到变化
    child2.borrow_mut().value = 99;
    println!("{:#?}", root);
}
```

### 智能指针速查

| 类型 | 所有权 | 可变性 | 线程安全 | C++ 对应 |
|------|--------|--------|----------|---------|
| `Box<T>` | 单一 | 普通借用规则 | ✅ | `unique_ptr` |
| `Rc<T>` | 共享 | 只读 | ❌ | `shared_ptr`（单线程）|
| `Arc<T>` | 共享 | 只读 | ✅ | `shared_ptr` |
| `RefCell<T>` | 单一 | 内部可变（运行时检查） | ❌ | 无直接对应 |
| `Cell<T>` | 单一 | 内部可变（Copy 类型） | ❌ | 无直接对应 |
| `Rc<RefCell<T>>` | 共享 | 内部可变 | ❌ | `shared_ptr` + 手动 |
| `Arc<Mutex<T>>` | 共享 | 互斥锁 | ✅ | `shared_ptr<mutex<T>>` |

**选择指南（按需依次考虑）**：

1. 直接用值（所有权转移）→ 最优，无额外开销
2. 只需要借用 → `&T` / `&mut T`
3. 需要堆上分配 → `Box<T>`
4. 单线程多所有者 → `Rc<T>`；多线程 → `Arc<T>`
5. 需要可变共享 → 加 `RefCell<T>`（单线程）或 `Mutex<T>`（多线程）
