---
title: "通用语言教程-Rust 篇【9】并发与异步"
date: 2026-05-07T17:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","并发","线程","async","tokio"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 并发的挑战

并发编程很难，原因主要有两个：数据竞争（两个线程同时读写同一块内存，没有同步）和死锁（两个线程各自持有对方需要的锁，互相等待）。这两类问题在运行时才会出现，难以复现，难以调试。

Rust 的所有权系统和类型系统在编译期就能阻止数据竞争，不需要在运行时做额外检查。这就是 Rust 常说的"无畏并发"（fearless concurrency）——编译通过了，就不会有数据竞争。

## 线程

Rust 使用操作系统原生线程（1:1 线程模型），每个 Rust 线程对应一个 OS 线程，没有绿色线程或协程（异步用 async/await 实现，不是线程）。

### 创建线程

通用语法格式：

```text
use std::thread;

// 创建线程
let handle = thread::spawn(|| {
    // 线程中执行的代码
});

// 如果闭包要使用外部变量，用 move 转移所有权进线程
let handle = thread::spawn(move || {
    // 可以使用 move 进来的外部变量
});

handle.join().unwrap(); // 阻塞当前线程，等待子线程结束
```

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程: {}", i);
            thread::sleep(Duration::from_millis(50));
        }
    });

    for i in 1..=3 {
        println!("主线程: {}", i);
        thread::sleep(Duration::from_millis(80));
    }

    handle.join().unwrap(); // 等待子线程完成，不调用 join 的话主线程结束时子线程会被强制终止
}
```

`thread::spawn` 返回一个 `JoinHandle`，调用 `.join()` 会阻塞当前线程直到被等待的线程结束。`.join()` 返回 `Result`，如果子线程 panic 了，`join` 会得到 `Err`。

### move 闭包与线程

线程闭包里如果要用外部变量，必须用 `move` 把变量的所有权转移进闭包：

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    let handle = thread::spawn(move || { // 没有 move 会编译错误
        println!("{:?}", data);
    });

    // println!("{:?}", data); // data 的所有权已转移进线程，这里不能用了

    handle.join().unwrap();
}
```

原因是：新线程的生命周期可能比创建它的函数更长（如果你不等待它结束就返回）。如果只是借用，无法保证借用的数据在线程结束前仍然有效。`move` 语义把数据交给线程，保证线程拥有完整的生命周期控制权。

## 消息传递：Channel

线程之间可以通过 channel 传递数据。Rust 标准库提供 `mpsc` channel（multiple producer, single consumer——多生产者，单消费者）。

通用语法格式：

```text
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();  // tx 是发送端，rx 是接收端

// 在线程里发送（转移值的所有权给接收方）
tx.send(值).unwrap();

// 接收
let 值 = rx.recv().unwrap();  // 阻塞等待一个值（Err 表示所有 tx 都 drop 了）
for 值 in rx { ... }          // 当迭代器用：循环接收，直到所有 tx 都被 drop

// 多发送端（mpsc 的 "mp" 就是 multiple producer）
let tx2 = tx.clone();          // clone tx，两个发送端指向同一个接收端
```



```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel(); // tx 是发送端，rx 是接收端

    thread::spawn(move || {
        let msgs = vec!["hello", "from", "thread"];
        for msg in msgs {
            tx.send(msg).unwrap();
        }
        // tx 在这里 drop，rx 的 recv 会在此后返回 Err
    });

    for received in rx { // rx 作为迭代器使用：接收直到 tx 关闭
        println!("收到: {}", received);
    }
}
```

`send` 会转移值的所有权，发出去的值不能再在发送方使用。

### 多生产者

`tx` 可以通过 `clone` 创建多个发送端，都向同一个 `rx` 发消息：

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx2 = tx.clone(); // 创建第二个发送端

    thread::spawn(move || tx.send("from thread 1").unwrap());
    thread::spawn(move || tx2.send("from thread 2").unwrap());

    // 注意：必须在所有 tx 都 drop 后，rx 的循环才会结束
    // 原始的 tx 已经 move 进线程，tx2 也是，主线程没有剩余 tx，所以 rx 会正确关闭
    for msg in rx {
        println!("{}", msg);
    }
}
```

`rx` 的 `for` 循环会一直接收消息，直到所有 `tx`（包括 `clone` 出来的）都被 `drop`。如果主线程还持有一个 `tx`，循环就不会结束——这是初学者常见的陷阱。

## 共享状态：Mutex

另一种并发模式是多线程共享数据，通过锁保证同时只有一个线程访问：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0)); // Arc 是线程安全的引用计数，Mutex 保护数据

    let mut handles = vec![];

    for _ in 0..10 {
        let c = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = c.lock().unwrap(); // 获取锁，返回 MutexGuard
            *num += 1;
        }); // MutexGuard 在这里 drop，锁自动释放（RAII）
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("结果: {}", *counter.lock().unwrap()); // 10
}
```

这里 `Rc<T>` 不能用，因为 `Rc` 的引用计数不是原子操作，不能跨线程。`Arc<T>` 是原子引用计数，专门为多线程设计。

`Mutex::lock()` 返回 `LockResult<MutexGuard<T>>`。`MutexGuard` 实现了 `Deref`，可以直接通过它读写被保护的数据；实现了 `Drop`，离开作用域时自动释放锁。这就是 RAII——不需要手动解锁，不会忘记，不会锁住一半抛出异常然后永远不释放。

### 死锁预防

死锁通常发生在两个线程以不同顺序请求多个锁的时候。Rust **不能在编译期检测死锁**，这是它并发安全的边界。预防方法：

保持一致的加锁顺序；尽可能缩小持锁范围（让 `MutexGuard` 尽早 `drop`）；避免在持锁时调用未知的代码（可能内部也加锁）。

## Send 与 Sync：编译期线程安全保证

这是 Rust 无畏并发的底层机制，值得专门理解。

`Send` 是一个标记 trait（没有任何方法），表示"这个类型的值可以安全地转移到另一个线程"。实现了 `Send` 的类型，所有权可以跨线程转移。

`Sync` 也是标记 trait，表示"这个类型可以安全地从多个线程同时访问"。具体来说，`T: Sync` 等价于 `&T: Send`——对 `T` 的共享引用可以安全地在线程间传递。

绝大多数类型都实现了 `Send` 和 `Sync`，编译器自动推导：如果一个结构体的所有字段都是 `Send`，结构体自动是 `Send`。

几个重要例外：

`Rc<T>` 不是 `Send` 也不是 `Sync`，因为引用计数不是原子操作，不能跨线程。这就是为什么线程里必须用 `Arc<T>`。

`RefCell<T>` 是 `Send`（可以转移到另一个线程）但不是 `Sync`（不能同时从多个线程访问）。

`Mutex<T>` 当 `T: Send` 时是 `Send + Sync`——锁保证了同时只有一个线程访问，所以共享引用是安全的。

这一切检查都发生在编译期，不是运行时。如果你试图跨线程传递 `Rc` 或 `RefCell`，编译器会报错，告诉你这个类型没有实现 `Send`。这是 Rust 在语言层面消除了一整类数据竞争错误。

## 异步编程

线程适合 CPU 密集型任务，对于 IO 密集型任务（网络请求、文件读写，大量时间在等待），每个任务开一个线程开销太大。异步编程让一个线程可以在等待 IO 时去做其他事，大幅提升吞吐量。

### Future trait

Rust 的异步基础是 `Future` trait：

```rust
pub trait Future {
    type Output;
    fn poll(&mut self, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`Future` 代表一个"还没完成的计算"。`poll` 方法询问它是否完成：返回 `Poll::Ready(value)` 表示完成了，返回 `Poll::Pending` 表示还没好，执行器会在适当时候再次 `poll`。

异步函数会被编译器变成一个实现了 `Future` 的状态机，每个 `.await` 点是一个状态转移点。这个转换在编译期完成，运行时只是在正确的时机调用 `poll`，没有额外的动态分配（大多数情况下）。

### async/await

`async fn` 定义异步函数，`await` 挂起当前异步函数直到等待的 Future 完成。

通用语法格式：

```text
// 定义异步函数（调用时不会立刻执行，返回一个 Future）
async fn 函数名(参数: 类型) -> 返回类型 {
    let 值 = 另一个异步函数().await;  // .await 挂起此函数，等对方完成
    值
}

// 用 tokio 作为执行器（需要在 Cargo.toml 引入 tokio）
#[tokio::main]
async fn main() {
    函数名(参数).await;
}

// 并发等待多个 Future（同时开始，等最慢的那个）
let (结果1, 结果2) = tokio::join!(future1, future2);

// 后台独立运行（类似异步版 thread::spawn）
let handle = tokio::spawn(async { 值 });
let 结果 = handle.await.unwrap();
```

```rust
async fn fetch_data(url: &str) -> String {
    // 假设 http_get 是某个返回 Future 的库函数
    // http_get(url).await
    format!("data from {}", url)
}

async fn process() {
    let result = fetch_data("https://example.com").await;
    println!("{}", result);
}
```

`async fn` 返回的是一个 `Future`，调用时不会立刻执行，需要一个**执行器（executor）**来驱动它运行。标准库不提供执行器，需要用第三方 crate。

### tokio：最流行的异步运行时

`tokio` 是 Rust 生态里最广泛使用的异步运行时，提供执行器、异步 IO、定时器、channel 等：

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main] // 这个宏把 main 函数变成异步入口，设置 tokio 执行器
async fn main() {
    let result = fetch_something().await;
    println!("{}", result);
}

async fn fetch_something() -> String {
    tokio::time::sleep(std::time::Duration::from_millis(100)).await; // 非阻塞等待
    String::from("done")
}
```

`#[tokio::main]` 展开后大致等价于：

```rust
fn main() {
    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(async {
            // 原来的 async main 内容
        });
}
```

### 并发执行多个 Future

`.await` 是串行的：等前一个完成再开始下一个。如果想并发执行，用 `tokio::join!`：

```rust
use tokio::time::{sleep, Duration};

async fn task(name: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await;
    format!("{} done", name)
}

#[tokio::main]
async fn main() {
    // 串行：总耗时 300ms
    // let a = task("A", 100).await;
    // let b = task("B", 200).await;

    // 并发：总耗时约 200ms（最慢的那个）
    let (a, b) = tokio::join!(task("A", 100), task("B", 200));
    println!("{}", a);
    println!("{}", b);
}
```

`tokio::spawn` 可以把一个 Future 放到后台真正并发执行，返回 `JoinHandle`，类似线程：

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        task("background", 200).await
    });

    task("foreground", 50).await; // 和后台任务同时运行

    let result = handle.await.unwrap(); // 等待后台任务完成
    println!("{}", result);
}
```

### 异步中的 Send 约束

`tokio::spawn` 要求 Future 是 `Send`，因为 tokio 的多线程执行器可能在不同线程上 `poll` 同一个 Future。如果 Future 捕获了非 `Send` 的值（比如 `Rc`），编译器会报错。这同样是编译期检查，不是运行时。

## 小结

Rust 的并发安全来自两个层面：一是所有权和借用规则阻止了数据竞争；二是 `Send` 和 `Sync` 标记 trait 在类型系统层面确保了线程间传递的数据是安全的。

线程模型（`thread::spawn` + `Mutex`/`channel`）适合 CPU 密集的并行计算；异步模型（`async`/`await` + tokio）适合 IO 密集的高并发服务。两种模型可以混用，tokio 本身就是多线程执行器，在多个 OS 线程上调度大量 async 任务。
