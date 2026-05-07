---
title: "通用语言教程-Rust 篇【5】常用集合类型"
date: 2026-05-07T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","集合","Vec","HashMap"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 标准库提供了几种常用的集合类型，它们将数据存储在**堆**上，大小可以在运行时动态变化。最常用的三种是：

- `Vec<T>`：动态数组，类似 Python 的 `list` 或 C++ 的 `vector`
- `String`：可增长的 UTF-8 字符串
- `HashMap<K, V>`：哈希映射，类似 Python 的 `dict`

## Vec（动态数组）

### 创建与基本操作

```rust
fn main() {
    // 创建空 Vec
    let mut v: Vec<i32> = Vec::new();

    // 使用宏快速创建
    let mut nums = vec![1, 2, 3, 4, 5];
    // 等价于 Python 中的：nums = [1, 2, 3, 4, 5]

    // 添加元素
    nums.push(6);       // 末尾追加
    nums.insert(0, 0);  // 在索引0处插入

    // 删除元素
    nums.pop();             // 删除并返回末尾元素（返回 Option<T>）
    nums.remove(0);         // 删除指定索引处的元素

    // 访问元素
    let first = &nums[0];       // 索引访问（越界会 panic）
    let second = nums.get(1);   // get 返回 Option<&T>，越界返回 None（更安全）

    println!("first = {}", first);
    if let Some(val) = second {
        println!("second = {}", val);
    }

    // 长度与容量
    println!("长度: {}", nums.len());
    println!("是否为空: {}", nums.is_empty());

    // 遍历
    for n in &nums {
        print!("{} ", n);
    }
    println!();

    // 遍历并修改
    for n in &mut nums {
        *n *= 2; // 通过解引用修改值
    }
    println!("{:?}", nums);
}
```

### 常用方法

```rust
fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6, 5, 3];

    // 排序
    v.sort();                           // 升序排序
    v.sort_by(|a, b| b.cmp(a));        // 降序排序（自定义比较函数）
    println!("{:?}", v);

    // 去重（需先排序）
    v.sort();
    v.dedup();
    println!("去重后: {:?}", v);

    // 搜索
    println!("包含5: {}", v.contains(&5));
    if let Some(pos) = v.iter().position(|&x| x == 5) {
        println!("5 在索引 {} 处", pos);
    }

    // 切片操作
    let slice = &v[1..4];
    println!("切片: {:?}", slice);

    // 迭代器链（函数式风格）
    let nums = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let result: Vec<i32> = nums.iter()
        .filter(|&&x| x % 2 == 0)   // 过滤偶数
        .map(|&x| x * x)             // 求平方
        .collect();                  // 收集结果
    // 等价于 Python 中的：result = [x**2 for x in nums if x % 2 == 0]
    println!("{:?}", result); // [4, 16, 36, 64, 100]

    let sum: i32 = nums.iter().sum();
    let max = nums.iter().max().unwrap();
    let min = nums.iter().min().unwrap();
    println!("sum={}, max={}, min={}", sum, max, min);
}
```

## String（字符串）

Rust 中有两种字符串类型：

- `&str`：字符串切片，不可变引用，通常用于字符串字面量
- `String`：堆分配的可增长字符串，拥有所有权

```rust
fn main() {
    // 创建 String
    let s1 = String::from("hello");
    let s2 = "world".to_string();
    let s3 = String::new(); // 空字符串

    // 追加
    let mut s = String::from("hello");
    s.push(' ');          // 追加字符
    s.push_str("world");  // 追加字符串切片
    println!("{}", s);    // hello sekai

    // 拼接（+ 运算符会移走左侧所有权）
    let s4 = String::from("Hello, ");
    let s5 = String::from("Rust!");
    let s6 = s4 + &s5;  // s4 的所有权被移走，s5 是引用
    // println!("{}", s4); // 错误！s4 已被移走
    println!("{}", s6);

    // 多个字符串拼接推荐用 format! 宏（不移走所有权）
    let a = String::from("Hello");
    let b = String::from(", ");
    let c = String::from("World!");
    let result = format!("{}{}{}", a, b, c);
    println!("{}", result); // Hello, Sekai!

    // 常用方法
    let text = String::from("  Hello, Rust!  ");
    println!("长度: {}", text.len());
    println!("去空白: '{}'", text.trim());
    println!("大写: {}", text.to_uppercase());
    println!("小写: {}", text.to_lowercase());
    println!("包含Rust: {}", text.contains("Rust"));
    println!("替换: {}", text.replace("Rust", "World"));

    // 分割
    let csv = "苹果,香蕉,橙子,葡萄";
    let fruits: Vec<&str> = csv.split(',').collect();
    // 等价于 Python 中的：fruits = csv.split(',')
    println!("{:?}", fruits);

    // 字符迭代（Rust 字符串以 UTF-8 存储，不能直接索引）
    for ch in "hello".chars() {
        print!("{} ", ch);
    }
    println!();

    // 字节迭代
    for byte in "hello".bytes() {
        print!("{} ", byte);
    }
    println!();
}
```

## HashMap（哈希映射）

```rust
use std::collections::HashMap; // 需要手动引入

fn main() {
    // 创建 HashMap
    let mut scores: HashMap<String, i32> = HashMap::new();

    // 插入键值对
    scores.insert(String::from("Alice"), 95);
    scores.insert(String::from("Bob"), 82);
    scores.insert(String::from("Charlie"), 78);
    // 等价于 Python 中的：scores = {"Alice": 95, "Bob": 82, "Charlie": 78}

    // 访问
    let alice_score = scores.get("Alice"); // 返回 Option<&i32>
    if let Some(score) = alice_score {
        println!("Alice 的分数: {}", score);
    }

    // 索引访问（不存在时会 panic）
    println!("Bob 的分数: {}", scores["Bob"]);

    // 检查是否存在
    println!("是否包含 Dave: {}", scores.contains_key("Dave"));

    // 遍历（顺序不确定）
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }

    // 更新
    scores.insert(String::from("Alice"), 98); // 覆盖更新

    // 仅在键不存在时插入（entry API）
    scores.entry(String::from("Dave")).or_insert(90);
    scores.entry(String::from("Alice")).or_insert(60); // Alice 已存在，不更新
    println!("{:?}", scores);

    // 基于旧值更新（统计词频的常用模式）
    let text = "hello sekai hello rust hello";
    let mut word_count: HashMap<&str, i32> = HashMap::new();
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1; // 解引用并修改
    }
    println!("{:?}", word_count);
    // 等价于 Python 中的：from collections import Counter; Counter(text.split())

    // 删除
    scores.remove("Bob");

    // 长度
    println!("人数: {}", scores.len());
}
```

## 元组（Tuple）

元组是将多个不同类型的值组合在一起的固定长度类型：

```rust
fn main() {
    // 创建元组
    let person = ("Alice", 25, 1.68_f64);
    // 等价于 Python 中的：person = ("Alice", 25, 1.68)

    // 解构
    let (name, age, height) = person;
    println!("{} 年龄 {} 身高 {}", name, age, height);

    // 索引访问（从 .0 开始）
    println!("{}", person.0); // Alice
    println!("{}", person.1); // 25
    println!("{}", person.2); // 1.68

    // 单元素元组（需要加逗号区分括号）
    let single = (42,);
    println!("{}", single.0);
}
```

## 数组（Array）

数组是**固定长度**的同类型元素集合，存储在**栈**上：

```rust
fn main() {
    // 固定大小的数组
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    // 等价于 C++ 中的：int arr[5] = {1, 2, 3, 4, 5};

    // 初始化全为同一值
    let zeros = [0; 10]; // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    // 访问
    println!("{}", arr[0]); // 1
    println!("长度: {}", arr.len()); // 5

    // 遍历
    for val in &arr {
        print!("{} ", val);
    }
    println!();

    // 切片
    let slice = &arr[1..4];
    println!("{:?}", slice); // [2, 3, 4]
}
```

> **Vec vs Array**：若长度固定且已知，优先使用数组（栈上分配，效率更高）；若长度需要动态变化，使用 `Vec`（堆上分配）。
