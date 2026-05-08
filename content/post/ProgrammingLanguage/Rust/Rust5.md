---
title: "通用语言教程-Rust 篇【5】常用集合类型"
date: 2026-05-07T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","集合","Vec","HashMap","String"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 标准库的集合类型是日常编程的基础工具。这篇文章不会只讲"怎么用"——我们会顺带看看这些结构在内存里长什么样，以及 Rust 在设计时做了哪些和其他语言不同的选择。

## Vec\<T\>：动态数组

### 内部结构

`Vec<T>` 在栈上存三个字段：

```text
Vec<i32> 在栈上：
+-------+-------+----------+
|  ptr  |  len  |   cap    |
| 堆指针 | 已用长度 | 已分配容量 |
+-------+-------+----------+
       │
       ▼
堆上：[1, 2, 3, _, _, _]   （_ 是已分配但未使用的空间）
```

`len` 是当前元素个数，`cap` 是已经向堆申请的内存能容纳的元素数。当 `push` 导致 `len == cap` 时，Vec 会重新分配一块更大的内存（通常是当前容量的 2 倍），把所有元素复制过去，然后释放旧内存。

这就是为什么**频繁 push 时最好提前用 `with_capacity` 指定容量**——避免反复重分配和复制。

### 创建与基本操作

```rust
fn main() {
    // 空 Vec，类型必须标注（没有初始值推断不出）
    let mut v: Vec<i32> = Vec::new();

    // 提前申请容量（减少 push 时的重分配次数）
    let mut v2: Vec<i32> = Vec::with_capacity(100);
    println!("len={}, cap={}", v2.len(), v2.capacity()); // len=0, cap=100

    // vec! 宏：最常用的快速创建方式
    let mut nums = vec![1, 2, 3, 4, 5];

    // 添加元素
    nums.push(6);           // 末尾追加，均摊 O(1)
    nums.insert(0, 0);      // 在索引0处插入，O(n)（需要移动后面所有元素）

    // 删除元素
    let last = nums.pop();  // 移除末尾元素，返回 Option<T>，O(1)
    let removed = nums.remove(0); // 移除指定位置，O(n)
    println!("pop={:?}, removed={}", last, removed);

    // 访问
    let first = &nums[0];       // 直接索引，越界会 panic（适合"一定有值"的情况）
    let second = nums.get(1);   // 返回 Option<&T>，越界返回 None（适合不确定的情况）
    if let Some(val) = second {
        println!("second = {}", val);
    }

    println!("len={}, cap={}", nums.len(), nums.capacity());
}
```

### 常用方法与迭代器链

```rust
fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6, 5, 3];

    // 排序
    v.sort();                           // 升序，原地排序，O(n log n)
    v.sort_by(|a, b| b.cmp(a));        // 降序（自定义比较器）
    v.sort_by_key(|&x| -(x as i64));   // 按 key 函数排序

    // 去重（必须先排序，dedup 只去除相邻重复元素）
    v.sort();
    v.dedup();
    println!("去重后: {:?}", v); // [1, 2, 3, 4, 5, 6, 9]

    // 分割与拼接
    let (left, right) = v.split_at(3); // 不可变分割为两个切片
    println!("left={:?}, right={:?}", left, right);

    // 函数式迭代器链
    let nums: Vec<i32> = (1..=10).collect(); // Range 收集成 Vec
    let result: Vec<i32> = nums.iter()
        .filter(|&&x| x % 2 == 0)  // 保留偶数
        .map(|&x| x * x)           // 平方
        .take(3)                   // 只取前 3 个
        .collect();
    println!("{:?}", result); // [4, 16, 36]

    // fold：从初始值开始，依次应用函数
    let product: i32 = nums.iter().fold(1, |acc, &x| acc * x);
    println!("10! = {}", product); // 3628800

    // 遍历并修改（需要可变引用）
    let mut v3 = vec![1, 2, 3];
    for x in v3.iter_mut() {
        *x *= 10; // 解引用才能修改
    }
    println!("{:?}", v3); // [10, 20, 30]

    // retain：原地过滤，只保留满足条件的元素
    let mut v4 = vec![1, 2, 3, 4, 5, 6];
    v4.retain(|&x| x % 2 == 0);
    println!("{:?}", v4); // [2, 4, 6]
}
```

## String：Rust 的字符串为何这么"难"？

### `String` vs `&str`——两种字符串类型的本质

```text
字符串字面量 "hello":
存在程序的 .rodata 段（只读数据段），是 &'static str
&str = { ptr: 指向 .rodata 的指针, len: 字节数 }

String::from("hello"):
在堆上分配内存，复制字节
String = { ptr: 堆指针, len: 5, cap: 5 }  （和 Vec<u8> 结构相同）
```

- `&str`：**字符串切片**，不可变，不拥有数据，是胖指针（指针+长度）
- `String`：**堆上可增长的字符串**，拥有所有权，本质是 `Vec<u8>`（但保证 UTF-8 有效）

### 为什么不能用索引访问字符串？

```rust
fn main() {
    let s = String::from("hello");
    // let c = s[0]; // 编译错误！
    // error[E0277]: the type `String` cannot be indexed by `{integer}`
}
```

原因在于 Rust 的字符串用 **UTF-8 编码**存储。UTF-8 是变长编码：

- ASCII 字符（英文字母、数字）：1 字节
- 汉字等：通常 3 字节
- Emoji 等：可能 4 字节

所以 `s[0]` 这个操作语义不明——是"第0个字节"还是"第0个字符"？如果是字节，用户可能得到一个不完整的字符；如果是字符，时间复杂度是 O(n)（必须从头扫描），而不是 O(1)。

Rust 索引操作的语义保证是 O(1)，两者矛盾，所以干脆禁止。

```rust
fn main() {
    let s = String::from("你好 Rust");

    // 字节迭代（u8）
    for byte in s.bytes() {
        print!("{} ", byte);
    }
    println!();

    // 字符迭代（char，Unicode 标量值，O(n) 扫描）
    for ch in s.chars() {
        print!("{} ", ch);
    }
    println!();

    // 按字节切片（必须保证切割点在字符边界，否则 panic）
    let hello = &s[0..6]; // "你好" 每个汉字 3 字节，所以 [0..6]
    println!("{}", hello);
}
```

### String 的常用操作

```rust
fn main() {
    let mut s = String::from("hello");

    // 追加
    s.push(' ');          // 追加单个 char
    s.push_str("sekai");  // 追加 &str
    println!("{}", s);    // hello sekai

    // + 运算符：本质是调用 fn add(self, s: &str) -> String
    // 注意：左边的所有权被移走，右边必须是 &str
    let s1 = String::from("Hello, ");
    let s2 = String::from("Rust!");
    let s3 = s1 + &s2; // s1 被移走，s2 仍可用（传的是引用）
    println!("{}", s3); // Hello, Rust!

    // 多段拼接推荐 format!（不移走任何所有权）
    let a = String::from("foo");
    let b = String::from("bar");
    let c = String::from("baz");
    let result = format!("{}-{}-{}", a, b, c);
    println!("{}", result); // foo-bar-baz（a, b, c 仍然有效）

    // 常用方法
    let text = "  Hello, Rust!  ";
    println!("trim: '{}'", text.trim());
    println!("大写: {}", text.to_uppercase());
    println!("包含: {}", text.contains("Rust"));
    println!("替换: {}", text.replace("Rust", "World"));
    println!("开头: {}", text.trim().starts_with("Hello"));

    // 分割
    let csv = "苹果,香蕉,橙子,葡萄";
    let fruits: Vec<&str> = csv.split(',').collect();
    println!("{:?}", fruits);

    // 字符串转数字
    let n: i32 = "42".parse().unwrap();
    let m: f64 = "3.14".parse().unwrap();
    println!("{} {}", n, m);

    // 数字转字符串
    let s = 42.to_string();
    let s2 = format!("{:.2}", 3.14159); // "3.14"
    println!("{} {}", s, s2);
}
```

## HashMap\<K, V\>：哈希表

### 内部实现简介

Rust 的 `HashMap` 使用 **SwissTable**（也叫 hashbrown）算法，这是 Google 的一个高性能哈希表实现，使用 SIMD 指令加速查找。默认哈希算法是 **SipHash 1-3**，抗 HashDoS 攻击（能防止攻击者构造大量哈希冲突的输入来让服务降速）。

如果你不需要安全性，只想要性能，可以换成 `FxHashMap`（需要第三方库 `rustc-hash`）。

### 基本操作

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<String, i32> = HashMap::new();

    // 插入
    scores.insert(String::from("Alice"), 95);
    scores.insert(String::from("Bob"),   82);
    scores.insert(String::from("Charlie"), 78);

    // 访问：返回 Option<&V>
    if let Some(score) = scores.get("Alice") {
        println!("Alice: {}", score); // 95
    }

    // 索引访问：不存在时 panic
    println!("Bob: {}", scores["Bob"]); // 82

    // 包含检查
    println!("有 Dave 吗: {}", scores.contains_key("Dave")); // false

    // 遍历（顺序不确定，HashMap 不保证插入顺序）
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }

    // 覆盖更新
    scores.insert(String::from("Alice"), 98);

    // entry API：仅在键不存在时插入（避免先检查后插入的竞态）
    scores.entry(String::from("Dave")).or_insert(90);
    scores.entry(String::from("Alice")).or_insert(60); // Alice 已存在，不执行
    println!("{:?}", scores);

    // 删除
    scores.remove("Bob");
    println!("删除 Bob 后人数: {}", scores.len());
}
```

### 典型模式：统计词频

```rust
use std::collections::HashMap;

fn main() {
    let text = "hello sekai hello rust hello sekai";
    let mut word_count: HashMap<&str, i32> = HashMap::new();

    for word in text.split_whitespace() {
        // entry().or_insert(0) 返回 &mut i32（可变引用），方便直接修改
        let count = word_count.entry(word).or_insert(0);
        *count += 1; // 解引用后自增
    }
    println!("{:?}", word_count);
    // 等价于 Python: from collections import Counter; Counter(text.split())
}
```

### 所有权与 HashMap

插入键值对时，键和值的所有权会**移入** HashMap：

```rust
use std::collections::HashMap;

fn main() {
    let key   = String::from("name");
    let value = String::from("Alice");

    let mut map = HashMap::new();
    map.insert(key, value);
    // println!("{}", key); // 编译错误：key 的所有权已移入 map

    // 如果插入引用，需要引用的生命周期不短于 HashMap 的生命周期
    let s = String::from("hello");
    let mut map2: HashMap<&str, i32> = HashMap::new();
    map2.insert(&s, 1); // 插入引用，s 必须比 map2 活得久
}
```

## 元组（Tuple）

元组是固定长度、可存储不同类型的值组合，存在栈上：

```rust
fn main() {
    let person: (&str, u32, f64) = ("Alice", 25, 1.68);

    // 解构
    let (name, age, height) = person;
    println!("{} 年龄 {} 身高 {}", name, age, height);

    // 索引访问（从 .0 开始）
    println!("{} {} {}", person.0, person.1, person.2);

    // 函数返回多值的自然方式
    fn divide_rem(a: i32, b: i32) -> (i32, i32) {
        (a / b, a % b) // 商和余数
    }
    let (quotient, remainder) = divide_rem(17, 5);
    println!("17 / 5 = {} 余 {}", quotient, remainder);

    // 单元类型 ()：零大小的元组，Rust 中"无返回值"的函数实际返回 ()
    let unit: () = ();
    println!("unit = {:?}", unit);
}
```

## 数组（Array）与 Vec 的选择

数组是**固定长度**的同类型元素集合，存在**栈**上（而不是堆）：

```rust
fn main() {
    let arr: [i32; 5] = [1, 2, 3, 4, 5]; // 类型是 [i32; 5]，长度是类型的一部分
    let zeros = [0i32; 10];               // 10 个 0

    println!("{}", arr[0]); // 1
    println!("长度: {}", arr.len()); // 5

    // 越界在 Debug 模式运行时 panic，Release 模式编译器会尽量检测
    // 与 C++ 不同，Rust 数组越界不会发生未定义行为，必然是明确的 panic

    for val in &arr {
        print!("{} ", val);
    }
    println!();
}
```

**何时用数组，何时用 Vec？**

| 特征 | 数组 `[T; N]` | 动态数组 `Vec<T>` |
|------|--------------|------------------|
| 大小 | 编译期确定，不可变 | 运行时可增减 |
| 存储位置 | 栈 | 堆（+ 栈上的元数据） |
| 性能 | 无堆分配开销 | 有堆分配，可能触发 realloc |
| 适用场景 | 固定大小的小型集合 | 大小不确定或可变 |

实际经验：**大多数时候用 Vec；只有在明确知道大小固定、并关心栈分配性能时用数组。**
