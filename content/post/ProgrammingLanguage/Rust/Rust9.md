---
title: "通用语言教程-Rust 篇【9】并发编程"
date: 2026-05-07T17:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","并发","线程","async","tokio"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 的并发编程是这门语言最有竞争力的特性之一。

其他语言里，并发 bug（数据竞争、死锁、use-after-free）大多只能在运行时发现，甚至在压测时才偶现。Rust 的所有权系统把很多这类问题直接挪到了编译期——**编译不通过，就不会有数据竞争**。

这就是 Rust 的并发口号：**无畏并发（Fearless Concurrency）**。

---

## 线程

### 创建线程：thread::spawn

Rust 使用 1:1 线程模型——每个 Rust 线程对应一个操作系统线程（和 Go 的 M:N 协程模型不同）：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // spawn 接受一个闭包，在新线程中执行
    // 返回 JoinHandle<T>，T 是闭包的返回值类型
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程: {}", i);
            thread::sleep(Duration::from_millis(50)); // 让出 CPU 时间片
        }
    });

    for i in 1..=3 {
        println!("主线程: {}", i);
        thread::sleep(Duration::from_millis(50));
    }

    // join：阻塞当前线程，直到 handle 对应的线程执行完毕
    // 类比 C++ 的 thread.join() / Java 的 thread.join()
    handle.join().unwrap(); // 若子线程 panic，join 返回 Err
    println!("所有线程结束");
}
```

输出顺序不确定（取决于操作系统调度），但不会发生数据竞争——因为两个线程没有共享数据。

### move 闭包：把数据所有权转入线程

如果子线程的闭包需要使用外部变量，必须用 `move` 将所有权转移进去：

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        // move 把 data 的所有权转入这个线程
        // 这样编译器确信：data 的生命周期和这个线程绑定，不会出现悬垂引用
        println!("子线程数据: {:?}", data);
        data.iter().sum::<i32>()
    });

    // println!("{:?}", data); // 编译错误：data 已被移入子线程

    let sum = handle.join().unwrap(); // 获取子线程返回值
    println!("sum = {}", sum); // 15
}
```

**为什么必须 move？** 子线程的生命周期可能比父线程更长，如果不转移所有权，父线程结束后 `data` 被释放，子线程还在访问它——悬垂引用。Rust 拒绝这种代码。

---

## 消息传递：Channel

Rust 推崇通过消息传递来实现线程间通信，而不是共享内存。标准库提供了 `mpsc`（multi-producer, single-consumer，多生产者单消费者）通道：

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel::<String>(); // 创建通道，tx 发送端，rx 接收端

    thread::spawn(move || {
        let messages = vec!["你好", "来自", "子线程"];
        for msg in messages {
            tx.send(msg.to_string()).unwrap(); // 发送（若接收方断开，返回 Err）
            thread::sleep(Duration::from_millis(100));
        }
        // tx 在此 drop（移入了闭包）→ 通道发送端关闭 → rx 知道没有更多消息了
    });

    // recv() 阻塞直到收到消息，通道关闭后 for 循环自然结束
    for received in rx {
        println!("收到: {}", received);
    }
    println!("通道关闭，所有消息处理完毕");
}
```

### 多生产者（Multiple Producers）

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        let tx_clone = tx.clone(); // 克隆发送端（多生产者的关键）
        thread::spawn(move || {
            tx_clone.send(format!("线程 {} 的消息", id)).unwrap();
        });
    }
    drop(tx); // 释放原始 tx
    // 注意：必须显式 drop 原始 tx
    // 否则 rx 会等待"原始 tx 发送的消息"，而它永远不会发，rx 的 for 循环永远不结束

    for msg in rx {
        println!("{}", msg);
    }
}
```

**Channel 的内部结构**：`mpsc::channel` 是无界通道（发送方不阻塞，消息无限累积）。如果需要有界通道（背压机制，发送方在缓冲区满时阻塞），用 `mpsc::sync_channel(capacity)`。

---

## 共享内存：Mutex 与 Arc

当确实需要多线程共享数据时，使用 `Arc<Mutex<T>>`：

- `Arc<T>`：线程安全的引用计数（Atomic Reference Counting），和 `Rc<T>` 用法相同，但用原子操作保证线程安全
- `Mutex<T>`：互斥锁，保证同一时刻只有一个线程能访问数据

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0i32)); // Arc 包 Mutex，Mutex 包数据
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter); // 克隆 Arc（引用计数 +1）
        let handle = thread::spawn(move || {
            let mut guard = counter.lock().unwrap();
            // lock() 获取互斥锁，返回 MutexGuard<T>
            // 若其他线程持有锁，当前线程阻塞
            // unwrap()：若持有锁的线程 panic（锁中毒），返回 Err
            *guard += 1;
            // MutexGuard 实现了 Deref，*guard 解引用得到 i32
        }); // guard 离开作用域 → Drop 自动释放锁（RAII）
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap()); // 10
}
```

**与 C++ 对比**：C++ 中忘记 `mutex.unlock()` 是经典 bug，Rust 的 `MutexGuard` 基于 RAII，离开作用域**自动解锁**，这类 bug 在 Rust 中不存在。

**死锁**：Rust 虽然防止了数据竞争，但**死锁**仍然可能发生（两个线程互相等待对方释放锁）。死锁是逻辑问题，不是类型系统能完全防止的。预防方法：始终以相同顺序获取多个锁；使用 `try_lock()` 代替 `lock()`。

---

## 异步编程（async/await）

对于 **I/O 密集型任务**（网络请求、文件读写、数据库查询等），线程模型效率不高——大量线程大多在等待，浪费内存和上下文切换开销。异步编程用**少量线程**处理大量并发 I/O。

### Future trait：异步的底层机制

Rust 的 `async fn` 返回一个 **`Future`**。`Future` 是一个"可以被轮询的计算"：

```rust
// Future 的简化定义（概念）：
trait Future {
    type Output;
    fn poll(&mut self, cx: &mut Context) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),    // 计算完成，返回值
    Pending,     // 还没好，等会儿再 poll
}
```

`async fn` 会被编译器展开成一个实现了 `Future` 的状态机（类似 C++ 协程的 `co_await` 原理）。

**`Future` 是惰性的**——仅创建 Future 不会执行任何代码，必须有一个**运行时（executor）**来不断 `poll` 它，直到 `Ready`。这就是为什么需要 tokio 这样的异步运行时。

### 基本用法（需要 tokio 运行时）

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
use tokio::time::{sleep, Duration};

// async fn 返回 impl Future<Output = String>
async fn fetch_data(id: u32) -> String {
    sleep(Duration::from_millis(100)).await; // .await 暂停当前 Future，让出执行权
    format!("数据 #{}", id)
}

// #[tokio::main] 宏把 async main 包装成普通 main，并启动 tokio 运行时
#[tokio::main]
async fn main() {
    let result = fetch_data(1).await;
    println!("{}", result); // 数据 #1
}
```

`.await` 不会阻塞当前**线程**，只是暂停当前**异步任务**，让 tokio 的工作线程去执行其他任务。

### 并发执行多个异步任务

```rust
use tokio::time::{sleep, Duration};

async fn task(name: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await;
    format!("任务 {} 完成（{}ms）", name, ms)
}

#[tokio::main]
async fn main() {
    // 顺序执行：总耗时 = 100 + 200 + 150 = 450ms
    // let r1 = task("A", 100).await;
    // let r2 = task("B", 200).await;
    // let r3 = task("C", 150).await;

    // 并发执行：总耗时 ≈ max(100, 200, 150) = 200ms
    // join! 宏同时驱动多个 Future，等所有完成才继续
    let (r1, r2, r3) = tokio::join!(
        task("A", 100),
        task("B", 200),
        task("C", 150),
    );
    println!("{}", r1);
    println!("{}", r2);
    println!("{}", r3);
}
```

### 异步任务与错误处理

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    // spawn 把异步任务交给 tokio 的线程池，立即返回 JoinHandle
    let mut handles = vec![];

    for i in 0..5 {
        let handle = task::spawn(async move {
            sleep(tokio::time::Duration::from_millis(10)).await;
            i * i // 任务的返回值
        });
        handles.push(handle);
    }

    // await 每个 handle，获取结果
    for handle in handles {
        match handle.await {
            Ok(result)  => println!("结果: {}", result),
            Err(e)      => println!("任务失败: {}", e), // 任务 panic 时
        }
    }
}
```

---

## 并发模型对比

| 场景 | 推荐方式 | 说明 |
|------|----------|------|
| CPU 密集计算 | `thread::spawn` | 充分利用多核 |
| I/O 密集（网络/文件） | `async/await` + tokio | 高并发，低内存占用 |
| 线程间传递数据 | `mpsc::channel` | 消息传递，无共享状态 |
| 线程间共享数据 | `Arc<Mutex<T>>` | 互斥锁，谨慎避免死锁 |
| 单线程共享可变数据 | `Rc<RefCell<T>>` | 无锁，运行时借用检查 |

---

## Send 与 Sync：线程安全的类型保证

Rust 的线程安全不是靠约定，而是**类型系统保证**的。两个标记 Trait：

- `Send`：类型的所有权可以安全地转移到另一个线程（`Rc<T>` 没有实现 `Send`，因为引用计数不是原子的）
- `Sync`：类型可以安全地被多个线程同时通过引用访问（`Cell<T>` 没有实现 `Sync`）

```rust
fn require_send<T: Send>(val: T) {}
fn require_sync<T: Sync>(val: T) {}

fn main() {
    let v = vec![1, 2, 3];
    require_send(v); // Vec<i32> 实现了 Send ✅

    use std::rc::Rc;
    let rc = Rc::new(5);
    // require_send(rc); // 编译错误：Rc<i32> 没有实现 Send ❌
    // 这就是为什么 Rc<T> 不能跨线程传递——类型系统在编译期就拦截了
}
```

这意味着：如果你的代码能编译通过，你写的并发代码就没有**数据竞争**。这不是运行时检查，是编译期保证。这就是 Rust 无畏并发的底气所在。
