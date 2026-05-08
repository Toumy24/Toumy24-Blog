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

## 模块系统

随着项目增大，把所有代码放进一个文件会让代码难以维护。Rust 提供了一套模块（module）系统来组织代码。

### 模块的基本概念

`mod` 关键字定义模块，模块可以嵌套。

通用语法格式：

```text
// 在文件内直接定义模块
mod 模块名 {
    pub fn 公开函数() { ... }  // pub 使其对外可见
    fn 私有函数() { ... }      // 默认私有，只有模块自身及子模块可访问

    pub mod 子模块 {           // 子模块默认也是私有的
        pub fn 子函数() { ... }
    }
}

// 声明外部文件模块（放在 main.rs 或 lib.rs 中）
mod 模块名;   // 编译器去找 src/模块名.rs 或 src/模块名/mod.rs

// 访问模块内容
模块名::函数名();
模块名::子模块::函数名();
```

```rust
mod greetings {
    pub fn hello() {
        println!("hello");
    }

    pub mod formal {
        pub fn greet(name: &str) {
            println!("Good day, {}", name);
        }
    }
}

fn main() {
    greetings::hello();
    greetings::formal::greet("Alice");
}
```

默认情况下，模块内的所有内容都是私有的，外部无法访问。`pub` 关键字把它公开。

### 可见性修饰符

Rust 的可见性比 `public`/`private` 更细粒度：

- `pub`：对所有人公开
- `pub(crate)`：只在当前 crate（整个项目）内公开，外部库无法访问
- `pub(super)`：只对父模块公开
- `pub(in path)`：只对指定路径的模块公开
- 无修饰（私有）：只在当前模块及其子模块内可用

```rust
mod outer {
    pub(crate) fn crate_visible() {} // 整个 crate 可见
    pub(super) fn parent_visible() {} // 只有 outer 的父模块可见

    mod inner {
        fn private() {}

        pub fn call_private() {
            private(); // 子模块可以访问父模块的私有内容
        }
    }
}
```

结构体字段也需要单独标注 `pub`，仅 `pub struct` 不够：

```rust
pub struct Config {
    pub host: String,   // 公开
    port: u16,         // 私有
}
```

枚举不同：`pub enum` 后，所有变体都自动公开（因为枚举的主要用途是模式匹配，私有变体会让 `match` 无法穷尽）。

### 跨文件模块

实际项目里模块分散在不同文件。有两种组织方式：

**方式一**：`src/模块名.rs`，在 `src/main.rs` 或 `src/lib.rs` 里声明 `mod 模块名;`

```
src/
├── main.rs
├── greetings.rs   ← 模块内容在这里
└── math.rs        ← 另一个模块
```

`main.rs`:
```rust
mod greetings; // 告诉编译器去找 greetings.rs 或 greetings/mod.rs
mod math;

fn main() {
    greetings::hello();
    println!("{}", math::add(1, 2));
}
```

**方式二**：`src/模块名/mod.rs`，适合模块内还有子模块的情况：

```
src/
├── main.rs
└── network/
    ├── mod.rs      ← 模块根文件（等同于 network.rs）
    ├── tcp.rs      ← 子模块
    └── udp.rs      ← 子模块
```

`network/mod.rs`:
```rust
pub mod tcp;
pub mod udp;
```

### use 的各种写法

通用语法格式：

```text
use 路径::名称;                      // 引入单个名称
use 路径::{名称1, 名称2, self};      // 同前缀批量引入（self 引入路径本身）
use 路径::*;                         // 通配符引入，通常只在测试模块里使用
use 路径::名称 as 别名;              // 重命名，解决名称冲突
pub use 路径::名称;                  // 重导出：外部代码可以通过当前模块访问此名称

// 路径起点
crate::模块::类型   // 绝对路径，从当前 crate 根开始
super::模块::类型   // 相对路径，从父模块开始
self::类型          // 相对路径，从当前模块开始（self:: 通常可省略）
```

```rust
use std::collections::HashMap;          // 引入单个路径
use std::io::{self, Read, Write};       // 同前缀，一次引入多个（self 引入 std::io 本身）
use std::collections::*;                // 通配符引入，通常只在测试模块里用
use std::collections::HashMap as Map;  // 重命名

// 路径写法：绝对路径从 crate:: 开始，相对路径用 self:: 或 super::
mod config {
    pub fn load() {}
}

mod app {
    use super::config; // super 指父模块，这里即 crate 根
    pub fn start() {
        config::load();
    }
}
```

`use` 引入的只在当前作用域有效，不会影响子模块。如果想让子模块也能用，用 `pub use`（重导出）：

```rust
pub use std::collections::HashMap; // 外部代码可以通过当前模块访问 HashMap
```

## 智能指针

Rust 的普通引用（`&T`、`&mut T`）只是指针，不拥有数据。智能指针是一类结构体，表现得像指针，但同时拥有数据（或额外的元数据）。标准库里最常用的有三种：`Box<T>`、`Rc<T>`、`RefCell<T>`。

所有智能指针都实现了两个关键 trait：

`Deref`：让智能指针可以用 `*` 解引用，像普通引用一样使用。

`Drop`：自定义当智能指针离开作用域时的清理逻辑（比如释放堆内存、减少引用计数）。

### Box\<T\>：堆分配

`Box<T>` 把值分配到堆上，在栈上只留一个指针。

通用语法格式：

```text
let 变量: Box<类型> = Box::new(值);  // 把值移到堆上，栈上保存指针
*变量                                // 通过 Deref 访问堆上的值
```

最常见的三个用途：

**用途一**：递归类型需要已知大小，`Box` 是解法。

Rust 在编译期需要知道每种类型占多少字节。递归类型（如链表、树）如果直接把自身作为字段，大小就会是无限的。把子节点包在 `Box` 里，只需存一个指针大小：

```rust
enum List {
    Cons(i32, Box<List>), // Box<List> 大小固定（一个指针），可以编译
    Nil,
}

fn main() {
    let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
}
```

**用途二**：有时想存大型数据到堆上，避免在栈上大量复制。

**用途三**：`Box<dyn Trait>` 实现动态分发，见第 6 章。

```rust
fn main() {
    let x = Box::new(42); // 42 存在堆上
    println!("{}", *x);   // Deref 解引用，和 42 一样用

    // 离开作用域时，Box 的 Drop 自动释放堆内存
}
```

### Deref 强制转换

实现了 `Deref` 的类型，在需要引用的地方会自动解引用，这叫 Deref 强制转换（Deref coercion）：

```rust
fn print(s: &str) {
    println!("{}", s);
}

fn main() {
    let s = Box::new(String::from("hello"));
    print(&s); // Box<String> → &String → &str，自动完成两次 Deref
}
```

这就是为什么 `String` 可以在需要 `&str` 的地方使用——`String` 实现了 `Deref<Target = str>`，引用时自动转换。

### Rc\<T\>：引用计数

普通所有权规则是一个值只有一个所有者。`Rc<T>`（Reference Counted）允许**多个所有者**：它在堆上记录有多少个 `Rc` 指针指向同一份数据，当计数降为零时才释放数据。

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(vec![1, 2, 3]);
    let clone1 = Rc::clone(&shared); // 只复制指针和增加计数，不复制数据
    let clone2 = Rc::clone(&shared);

    println!("引用计数: {}", Rc::strong_count(&shared)); // 3
    println!("{:?}", clone1);

    drop(clone1);
    println!("引用计数: {}", Rc::strong_count(&shared)); // 2
}
// shared 和 clone2 离开作用域，计数降为 0，数据释放
```

`Rc<T>` **不是线程安全的**。它的引用计数用普通整数加减，没有原子操作保护。如果在多线程里共享，用线程安全版本 `Arc<T>`（Atomic Reference Counted）。

`Rc<T>` 的限制：只允许不可变借用。多个所有者同时可变会引发数据竞争，这和借用规则冲突。

### RefCell\<T\>：内部可变性

借用规则在**编译期**检查。`RefCell<T>` 把检查推迟到**运行时**，允许你在只有不可变引用的情况下修改内部数据——这叫内部可变性（interior mutability）。

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    {
        let mut d = data.borrow_mut(); // 运行时检查：此时没有其他借用，允许
        d.push(4);
    } // 可变借用在这里释放

    let d = data.borrow(); // 不可变借用，此时没有可变借用存在，允许
    println!("{:?}", d);
}
```

`borrow()` 和 `borrow_mut()` 返回的是 `Ref<T>` 和 `RefMut<T>` 智能指针，内部维护一个借用计数。如果在已有可变借用的情况下再借用，**运行时 panic**（而不是编译错误）。

### Rc\<RefCell\<T\>\>：共享可变数据

`Rc` 提供多所有者，`RefCell` 提供内部可变性，组合起来就得到"多个地方可以共享并修改的数据"：

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared = Rc::new(RefCell::new(0));

    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    *a.borrow_mut() += 10;
    *b.borrow_mut() += 20;

    println!("{}", shared.borrow()); // 30
}
```

这个组合在单线程场景里很常见，比如多个节点互相引用的图结构，或者回调函数修改外部状态。多线程场景用 `Arc<Mutex<T>>`，见下一章。

### 三种智能指针对比

`Box<T>`：单一所有权，堆分配，编译期借用检查，无运行时开销。

`Rc<T>`：多个所有者（单线程），引用计数，不可变借用，计数操作有轻微开销。

`RefCell<T>`：单一所有权，借用检查推迟到运行时，允许内部可变，借用时有少量运行时检查开销。

选择时优先用普通引用，不够用再考虑 `Box`，再考虑 `Rc`，最后才考虑 `RefCell`。`RefCell` 把编译期保证换成了运行时保证，要谨慎使用。
