---
title: "通用语言教程-Rust 篇【10】迭代器"
date: 2026-05-08T09:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","迭代器","函数式编程"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

迭代器（Iterator）在之前的章节里已经多次出现：`for` 循环遍历集合、`.iter().enumerate()`、`v.iter().map(...).collect()` 等等。但我们从来没有系统地讲过"迭代器是什么"以及它能做哪些事。

本章专门讲迭代器，因为它在 Rust 代码里太普遍了——写 Rust 的日常工作有一大半都是在和迭代器打交道。

## Iterator trait：什么是迭代器

迭代器是实现了 `Iterator` trait 的类型。这个 trait 定义在 `std::iter::Iterator`，核心只有一个方法：

```rust
pub trait Iterator {
    type Item;                                  // 关联类型：这个迭代器产生什么类型的值
    fn next(&mut self) -> Option<Self::Item>;   // 产生下一个值，没有了返回 None
}
```

每次调用 `next()`，迭代器返回 `Some(值)`；当所有值都产生完后，返回 `None`。`for` 循环本质上就是反复调用 `next()` 直到 `None`：

```rust
fn main() {
    let v = vec![1, 2, 3];
    let mut iter = v.iter(); // 创建迭代器

    // 手动调用 next()，等同于 for 循环里发生的事
    println!("{:?}", iter.next()); // Some(1)
    println!("{:?}", iter.next()); // Some(2)
    println!("{:?}", iter.next()); // Some(3)
    println!("{:?}", iter.next()); // None（没有了）
}
```

了解这个原理后，你对 `for` 循环的理解就更深了：`for x in v` 实际上是在调用 `v.into_iter()` 拿到迭代器，然后反复 `next()` 直到 `None`。

## 三种迭代方式

对一个集合，创建迭代器有三种方式，分别对应不同的所有权行为：

```rust
fn main() {
    let v = vec![1, 2, 3];

    // iter()：产生不可变引用 &T
    // v 的所有权不变，循环后 v 仍然可用
    for x in v.iter() {
        // x 类型是 &i32
        println!("{x}");
    }
    println!("v 还在: {v:?}"); // 可以继续用 v

    // iter_mut()：产生可变引用 &mut T
    // 可以在遍历中修改元素
    let mut v2 = vec![1, 2, 3];
    for x in v2.iter_mut() {
        *x *= 10; // 通过可变引用修改，需要 * 解引用
    }
    println!("{v2:?}"); // [10, 20, 30]

    // into_iter()：消耗集合本身，产生 T（元素的值，不是引用）
    // 循环后 v3 的所有权被转移，不可再用
    let v3 = vec![String::from("a"), String::from("b")];
    for s in v3.into_iter() {
        // s 类型是 String，不是引用，拥有所有权
        println!("{s}");
    }
    // println!("{v3:?}"); // 编译错误：v3 已被消耗
}
```

`for x in &v` 等同于 `for x in v.iter()`，`for x in &mut v` 等同于 `for x in v.iter_mut()`，`for x in v` 等同于 `for x in v.into_iter()`。

## 迭代器是惰性的

创建迭代器不会立刻做任何计算，只有当你真正"消费"它时才会执行：

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 这行不会做任何事！map 只是创建了一个"等待执行的计划"
    let _mapped = v.iter().map(|x| {
        println!("处理 {x}"); // 这行现在不会执行
        x * 2
    });

    println!("迭代器创建好了，但还没执行");

    // 当调用消费者方法（collect/sum/for_each 等）时才真正执行
    let result: Vec<i32> = v.iter().map(|x| x * 2).collect();
    println!("{result:?}"); // [2, 4, 6, 8, 10]，现在才执行
}
```

这个惰性特性让链式的迭代器操作非常高效：多个步骤（filter、map、take 等）合并成一次遍历，不会产生中间的临时集合。

## 常用迭代器适配器

**适配器（adapter）**是接受一个迭代器、返回另一个迭代器的方法。它们是惰性的，自身不触发计算，需要配合消费者使用。

### map：转换每个元素

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 每个元素乘以 2
    let doubled: Vec<i32> = v.iter().map(|&x| x * 2).collect();
    println!("{doubled:?}"); // [2, 4, 6, 8, 10]

    // 把数字转成字符串
    let strings: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    println!("{strings:?}"); // ["1", "2", "3", "4", "5"]
}
```

### filter：过滤元素

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8];

    // 只保留偶数
    let evens: Vec<&i32> = v.iter().filter(|&&x| x % 2 == 0).collect();
    println!("{evens:?}"); // [2, 4, 6, 8]

    // filter 闭包接收 &&T（两层引用）：外层是 iter() 给的 &T，filter 再借用一次变成 &&T
    // 写 &&x 在模式里解引用两层，得到 i32 的值
    // 或者也可以写成：
    let evens2: Vec<i32> = v.iter().filter(|x| *x % 2 == 0).cloned().collect();
    println!("{evens2:?}"); // [2, 4, 6, 8]
}
```

### filter_map：过滤 + 转换合二为一

当你既要过滤又要转换，且转换结果是 `Option` 时，`filter_map` 比 `filter` + `map` 更简洁：

```rust
fn main() {
    let strings = vec!["1", "2", "abc", "4", "xyz", "6"];

    // 把能解析成数字的字符串过滤出来并转换
    let numbers: Vec<i32> = strings
        .iter()
        .filter_map(|s| s.parse::<i32>().ok()) // parse 失败返回 None，filter_map 自动跳过
        .collect();
    println!("{numbers:?}"); // [1, 2, 4, 6]
}
```

### take 和 skip：前 N 个、跳过 N 个

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // take(n)：只取前 n 个
    let first3: Vec<&i32> = v.iter().take(3).collect();
    println!("{first3:?}"); // [1, 2, 3]

    // skip(n)：跳过前 n 个
    let after3: Vec<&i32> = v.iter().skip(3).collect();
    println!("{after3:?}"); // [4, 5, 6, 7, 8, 9, 10]

    // take_while：取元素直到条件不满足
    let small: Vec<&i32> = v.iter().take_while(|&&x| x < 5).collect();
    println!("{small:?}"); // [1, 2, 3, 4]

    // skip_while：跳过元素直到条件不满足，然后取剩余所有
    let rest: Vec<&i32> = v.iter().skip_while(|&&x| x < 5).collect();
    println!("{rest:?}"); // [5, 6, 7, 8, 9, 10]
}
```

### enumerate：同时获取下标和值

```rust
fn main() {
    let fruits = ["苹果", "香蕉", "橙子", "葡萄"];

    for (i, fruit) in fruits.iter().enumerate() {
        // i 是 usize 类型的下标，fruit 是 &&str 类型
        println!("第 {} 个：{fruit}", i + 1);
    }
}
```

### zip：把两个迭代器合并成一个

```rust
fn main() {
    let names = ["Alice", "Bob", "Charlie"];
    let scores = [95, 87, 73];

    // zip 把两个迭代器"拉链"合并，产生 (元素1, 元素2) 的元组迭代器
    // 长度取两者中较短的那个
    let combined: Vec<_> = names.iter().zip(scores.iter()).collect();
    for (name, score) in &combined {
        println!("{name}: {score}");
    }
}
```

### chain：把两个迭代器首尾相连

```rust
fn main() {
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];

    let combined: Vec<_> = a.iter().chain(b.iter()).collect();
    println!("{combined:?}"); // [1, 2, 3, 4, 5, 6]
}
```

### flat_map：映射后展平

`flat_map` 对每个元素应用一个返回迭代器的函数，然后把所有结果迭代器展平成一个：

```rust
fn main() {
    let words = ["hello world", "foo bar baz"];

    // 对每个字符串，先 split 成单词（产生一个迭代器），再 flat_map 展平
    let all_words: Vec<&str> = words.iter()
        .flat_map(|s| s.split_whitespace())
        .collect();
    println!("{all_words:?}"); // ["hello", "world", "foo", "bar", "baz"]
}
```

### cloned 和 copied：把引用转成值

`iter()` 产生的是引用，如果想要值的集合，用 `cloned()`（调用 `.clone()`）或 `copied()`（用于 `Copy` 类型）：

```rust
fn main() {
    let v = vec![1, 2, 3];

    // iter() 产生 &i32，cloned() 把 &i32 转成 i32
    let owned: Vec<i32> = v.iter().cloned().collect();

    // 对 Copy 类型，copied() 更常用（避免 clone 的语义，更明确是按位复制）
    let owned2: Vec<i32> = v.iter().copied().collect();

    println!("{owned:?} {owned2:?}");
}
```

## 常用消费者方法

**消费者（consumer）**是真正执行迭代、产生最终结果的方法。调用消费者后，迭代器就被消耗了，不能再用。

### collect：收集成集合

`collect` 是最常用的消费者，把迭代器产生的值收集成任何实现了 `FromIterator` 的类型：

```rust
use std::collections::{HashMap, HashSet};

fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 收集成 Vec
    let doubled: Vec<i32> = v.iter().map(|&x| x * 2).collect();

    // 收集成 HashSet（自动去重）
    let with_dups = vec![1, 2, 2, 3, 3, 3];
    let unique: HashSet<i32> = with_dups.iter().copied().collect();
    println!("{unique:?}"); // {1, 2, 3}（顺序不定）

    // 收集 (key, value) 元组成 HashMap
    let pairs = vec![("one", 1), ("two", 2), ("three", 3)];
    let map: HashMap<_, _> = pairs.into_iter().collect();
    println!("{map:?}");

    // 收集 Result<T, E> 成 Result<Vec<T>, E>（任意一个 Err 就整体失败）
    let strings = vec!["1", "2", "3"];
    let numbers: Result<Vec<i32>, _> = strings.iter().map(|s| s.parse::<i32>()).collect();
    println!("{numbers:?}"); // Ok([1, 2, 3])
}
```

### sum 和 product：求和与求积

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    let sum: i32 = v.iter().sum();
    println!("{sum}"); // 15

    let product: i32 = v.iter().product();
    println!("{product}"); // 120（1×2×3×4×5）
}
```

### fold：通用累积

`fold(初始值, |累积值, 当前元素| -> 新累积值)` 是最通用的归约操作，`sum` 和 `product` 都是它的特例：

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 用 fold 模拟 sum
    let sum = v.iter().fold(0, |acc, &x| acc + x);
    println!("{sum}"); // 15

    // 用 fold 找最大值
    let max = v.iter().fold(i32::MIN, |acc, &x| acc.max(x));
    println!("{max}"); // 5

    // 用 fold 拼接字符串
    let words = vec!["hello", "world", "sekai"];
    let sentence = words.iter().fold(String::new(), |mut acc, &w| {
        if !acc.is_empty() { acc.push(' '); }
        acc.push_str(w);
        acc
    });
    println!("{sentence}"); // hello world sekai
}
```

### count：计数

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    let total = v.iter().count();
    println!("{total}"); // 6

    // 计满足条件的元素个数
    let even_count = v.iter().filter(|&&x| x % 2 == 0).count();
    println!("{even_count}"); // 3
}
```

### any 和 all：是否存在、是否全部满足

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // any：至少一个元素满足条件
    println!("{}", v.iter().any(|&x| x > 4));  // true（有 5）
    println!("{}", v.iter().any(|&x| x > 10)); // false

    // all：所有元素都满足条件
    println!("{}", v.iter().all(|&x| x > 0));  // true（全是正数）
    println!("{}", v.iter().all(|&x| x > 3));  // false（1、2、3 不满足）

    // any 和 all 也是短路的：找到/找不到就立刻停止，不继续遍历
}
```

### find 和 position：查找元素

```rust
fn main() {
    let v = vec![1, 5, 3, 7, 2];

    // find：返回第一个满足条件的元素的引用（Option<&T>）
    let found = v.iter().find(|&&x| x > 4);
    println!("{found:?}"); // Some(5)

    // position：返回第一个满足条件的元素的下标（Option<usize>）
    let pos = v.iter().position(|&x| x > 4);
    println!("{pos:?}"); // Some(1)（5 在下标 1）

    // 找最大最小值
    println!("{:?}", v.iter().min()); // Some(1)
    println!("{:?}", v.iter().max()); // Some(7)
}
```

### for_each：对每个元素执行操作（不收集结果）

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // for_each 和 for 循环等价，但可以接在链式调用末尾
    v.iter()
        .filter(|&&x| x % 2 == 0)
        .for_each(|x| println!("偶数：{x}"));
}
```

## 链式调用示例

迭代器最大的优势在于可以流畅地链式组合，代码像描述意图一样自然：

```rust
fn main() {
    let data = vec![
        ("Alice", 85),
        ("Bob", 92),
        ("Charlie", 76),
        ("Diana", 95),
        ("Eve", 68),
    ];

    // 找出成绩 >= 80 的人，按成绩从高到低排序，取前三名，输出名字
    let mut top: Vec<_> = data.iter()
        .filter(|(_, score)| *score >= 80)      // 只要 >= 80 的
        .collect();
    top.sort_by(|a, b| b.1.cmp(&a.1));          // 按成绩降序排
    let top_names: Vec<&str> = top.iter()
        .take(3)
        .map(|(name, _)| *name)
        .collect();
    println!("{top_names:?}"); // ["Diana", "Bob", "Alice"]

    // 计算平均成绩
    let avg = data.iter().map(|(_, s)| s).sum::<i32>() as f64 / data.len() as f64;
    println!("平均成绩：{avg:.1}");
}
```

## 自定义迭代器

只要实现了 `Iterator` trait 的 `next` 方法，自定义类型就成为迭代器，并**自动获得**标准库里所有的 `map`、`filter`、`collect` 等方法：

```rust
// 斐波那契数列迭代器
struct Fibonacci {
    a: u64,
    b: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { a: 0, b: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        let next = self.a + self.b;
        self.a = self.b;
        self.b = next;
        Some(self.a) // 斐波那契数列无限延伸，永远返回 Some
    }
}

fn main() {
    // take(10) 限制只取前 10 个，否则会无限循环
    let first_10: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("{first_10:?}"); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

    // 求前 10 个斐波那契数之和
    let sum: u64 = Fibonacci::new().take(10).sum();
    println!("sum={sum}"); // 143

    // 第一个大于 100 的斐波那契数
    let big = Fibonacci::new().find(|&x| x > 100);
    println!("{big:?}"); // Some(144)
}
```

只要实现一个 `next` 方法，就免费拥有了几十个方法。这是 Rust trait 系统的典型设计思路：定义少量核心接口，在上面构建丰富的默认实现。

## std::iter 里的工具函数

有几个 `std::iter` 里的函数不是方法，而是全局函数，用于创建特殊的迭代器：

```rust
use std::iter;

fn main() {
    // once(x)：只产生一个值的迭代器
    let one: Vec<i32> = iter::once(42).collect();
    println!("{one:?}"); // [42]

    // repeat(x)：无限重复同一个值，需要配合 take
    let fives: Vec<i32> = iter::repeat(5).take(4).collect();
    println!("{fives:?}"); // [5, 5, 5, 5]

    // repeat_with(f)：每次调用闭包产生一个值（闭包可以有状态）
    let mut counter = 0;
    let counts: Vec<i32> = iter::repeat_with(|| { counter += 1; counter }).take(5).collect();
    println!("{counts:?}"); // [1, 2, 3, 4, 5]

    // empty()：空迭代器（产生 0 个值）
    let empty: Vec<i32> = iter::empty().collect();
    println!("{empty:?}"); // []

    // successors(初始值, |上一个值| -> Option<下一个值>)
    // 从初始值开始，每次根据上一个值计算下一个，返回 None 时停止
    let powers_of_2: Vec<u32> = iter::successors(Some(1u32), |&n| {
        if n < 1000 { Some(n * 2) } else { None }
    }).collect();
    println!("{powers_of_2:?}"); // [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
}
```
