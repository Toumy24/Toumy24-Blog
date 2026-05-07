---
title: "通用语言教程-Rust 篇【9】并发编程"
date: 2026-05-08T17:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","并发","线程","async"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 的并发编程是其最具竞争力的特性之一。许多并发 Bug（如数据竞争、死锁）在其他语言中只能在运行时发现，而 Rust 的所有权与类型系统能在**编译期**就捕获大部分并发问题。

Rust 的并发口号是：**无畏并发（Fearless Concurrency）**。

## 线程

### 创建线程

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 使用 spawn 创建新线程，传入一个闭包
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程: {}", i);
            thread::sleep(Duration::from_millis(50));
        }
    });

    for i in 1..=3 {
        println!("主线程: {}", i);
        thread::sleep(Duration::from_millis(50));
    }

    handle.join().unwrap(); // 等待子线程执行完毕，类似 C++ 的 thread.join()
    println!("所有线程执行完毕");
}
```

### move 闭包

线程的闭包通常需要使用 `move` 关键字，将外部变量的**所有权转移**进闭包，确保线程能安全使用这些数据：

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        // move 将 data 的所有权转移进了这个线程
        println!("在子线程中: {:?}", data);
        let sum: i32 = data.iter().sum();
        println!("sum = {}", sum);
    });

    // println!("{:?}", data); // 错误！data 已被 move 进子线程

    handle.join().unwrap();
}
```

### 消息传递：Channel

Rust 推崇通过**消息传递**来实现线程间通信，而非共享内存（"不要通过共享内存来通信，而应通过通信来共享内存"）：

```rust
use std::thread;
use std::sync::mpsc; // multi-producer, single-consumer（多生产者，单消费者）

fn main() {
    let (tx, rx) = mpsc::channel(); // 创建通道，tx 发送端，rx 接收端

    thread::spawn(move || {
        let messages = vec!["hello", "from", "thread"];
        for msg in messages {
            tx.send(msg).unwrap(); // 发送消息
            thread::sleep(std::time::Duration::from_millis(100));
        }
    }); // tx 在此被 drop，通道关闭

    // rx.recv() 会阻塞直到收到消息，通道关闭后循环结束
    for received in rx {
        println!("收到: {}", received);
    }
}
```

多个发送者：

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆发送端，实现多生产者
    for id in 0..3 {
        let tx_clone = tx.clone();
        thread::spawn(move || {
            tx_clone.send(format!("来自线程 {} 的消息", id)).unwrap();
        });
    }
    drop(tx); // 释放原始 tx，否则 rx 不知道所有发送者是否都关闭了

    for msg in rx {
        println!("{}", msg);
    }
}
```

### 共享内存：Mutex 与 Arc

当确实需要多线程共享数据时，使用 `Arc<Mutex<T>>`：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc: 线程安全的引用计数，Mutex: 互斥锁
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // 获取锁，阻塞直到可用
            *num += 1;
        }); // 离开作用域时，MutexGuard 自动释放锁（RAII）
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap()); // 10
}
```

> 与 C++ 相比：C++ 中忘记解锁 `mutex` 是常见 Bug，而 Rust 的 `MutexGuard` 基于 RAII，**离开作用域自动解锁**，从根本上消除了死锁中"忘记解锁"这一类问题。

## 异步编程（async/await）

对于 I/O 密集型任务（网络请求、文件读写等），使用异步编程比多线程更高效。

### 基本概念

```rust
// async fn 返回一个 Future，需要被 await 才会执行
async fn fetch_data(id: u32) -> String {
    // 模拟异步等待
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    format!("数据 #{}", id)
}

// 使用 tokio 运行时（需在 Cargo.toml 中添加 tokio = { version="1", features=["full"] }）
#[tokio::main]
async fn main() {
    let result = fetch_data(1).await; // .await 等待 Future 完成
    println!("{}", result);
}
```

### 并发执行多个异步任务

```rust
use tokio::time::{sleep, Duration};

async fn task(name: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await;
    format!("任务 {} 完成（{}ms）", name, ms)
}

#[tokio::main]
async fn main() {
    // 顺序执行（耗时 = 300ms）
    // let r1 = task("A", 100).await;
    // let r2 = task("B", 200).await;

    // 并发执行（耗时 ≈ 200ms，取决于最慢的任务）
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

### spawn 异步任务

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let mut handles = vec![];

    for i in 0..5 {
        let handle = task::spawn(async move {
            // 异步任务，类比 thread::spawn 但不阻塞线程
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
            i * i
        });
        handles.push(handle);
    }

    for handle in handles {
        let result = handle.await.unwrap();
        println!("结果: {}", result);
    }
}
```

## 并发模型对比

| 场景 | 推荐方式 | 说明 |
|------|----------|------|
| CPU 密集型（计算）| `thread::spawn` | 充分利用多核 |
| I/O 密集型（网络/文件）| `async/await` + tokio | 高并发，低开销 |
| 线程间传递数据 | `mpsc::channel` | 消息传递，无共享 |
| 线程间共享数据 | `Arc<Mutex<T>>` | 加锁共享，谨慎使用 |
| 单线程共享可变数据 | `Rc<RefCell<T>>` | 无锁，运行期检查 |
