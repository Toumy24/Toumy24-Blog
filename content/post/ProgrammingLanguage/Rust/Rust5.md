﻿﻿﻿﻿---
title: "通用语言教程-Rust 篇【5】常用集合类型"
date: 2026-05-07T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","Vec","String","HashMap","集合"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

本章介绍 Rust 里几种最基础的复合类型与集合类型：

- **元组（Tuple）**：固定长度、可混合不同类型，存在栈上
- **数组（Array）**：固定长度、同类型元素序列，存在栈上
- **Vec\<T\>**：可变长度的动态数组，数据在堆上
- **String**：可变长度的字符串，数据在堆上
- **HashMap\<K, V\>**：键值映射，数据在堆上

元组和数组是 Rust 内置的基础类型，直接由编译器支持，不需要 `use` 引入。Vec 和 String 在 prelude（预导入）里，可以直接用；HashMap 需要 `use std::collections::HashMap` 才能用。

## 元组（Tuple）

元组把若干个**类型可以不同**的值组合成一个复合值。长度固定，一旦创建元素个数不能增减，也不能改变各字段的类型。

**基本语法：**

```text
let 变量名: (类型1, 类型2, ...) = (值1, 值2, ...);
// 类型标注可以省略，让编译器推断
let 变量名 = (值1, 值2, ...);
```

```rust
fn main() {
    // 显式类型标注
    let t: (i32, f64, bool, &str) = (42, 3.14, true, "hello");

    // 省略类型标注，编译器推断
    let point = (10, 20);

    // 用 .0 .1 .2 等整数索引访问字段，索引从 0 开始
    println!("{}", t.0); // 42
    println!("{}", t.1); // 3.14
    println!("{}", point.0); // 10
}
```

### 解构赋值

用**解构（destructuring）**把元组的各字段分别绑定到新变量，比逐个用 `.0` `.1` 访问更清晰：

```rust
fn main() {
    let point = (10, 20);

    // 解构赋值，同时绑定两个变量
    let (x, y) = point;
    println!("x={x}, y={y}");

    // 用 _ 忽略不关心的字段
    let t = (1, "hello", true, 3.14);
    let (first, _, _, last) = t; // 只取第一和最后一个字段
    println!("{first} {last}"); // 1 3.14
}
```

解构时必须和元组字段数量完全一致，不关心的位置用 `_` 占位。

### 元组的主要用途

**从函数里返回多个值**。Rust 函数只能有一个返回类型，把多个值打包成元组就能绕过这个限制：

```rust
fn min_max(v: &[i32]) -> (i32, i32) { // 返回类型是 (i32, i32) 元组
    let mut min = v[0];
    let mut max = v[0];
    for &x in v {
        if x < min { min = x; }
        if x > max { max = x; }
    }
    (min, max) // 打包成元组返回
}

fn main() {
    let nums = [3, 1, 4, 1, 5, 9];
    let (min, max) = min_max(&nums); // 用解构接收两个返回值
    println!("最小={min}, 最大={max}");
}
```

### 单元类型 ()

空元组 `()` 是一种特殊的元组，叫**单元类型（unit type）**，只有唯一一个值，也写作 `()`。在 Rust 里，"没有返回值"的函数实际上返回的就是 `()`，类似于 C/C++ 的 `void`，但它在 Rust 类型系统里是真实存在的类型。

```rust
fn greet(name: &str) { // 没有写 -> 返回类型，等同于 -> ()
    println!("你好, {name}!");
    // 末尾隐式返回 ()
}

fn main() {
    let result: () = greet("世界");
    println!("{result:?}"); // 输出：()
}
```

## 数组（Array）

数组是**固定长度**的同类型元素序列，长度在编译期确定，整个数组存储在**栈上**。它和 `Vec` 的本质区别在于：数组的长度是其类型的一部分，`[i32; 5]` 和 `[i32; 10]` 是两种完全不同的类型，不能互相赋值或混用。

**基本语法：**

```text
// 方式一：列举所有初始值
let 变量名: [元素类型; 长度] = [值1, 值2, ..., 值N];

// 方式二：重复值语法（所有元素用同一个值初始化）
let 变量名: [元素类型; 长度] = [初始值; 长度];

// 类型标注可以省略，编译器从字面量推断
let 变量名 = [值1, 值2, ...];
```

```rust
fn main() {
    // 方式一：列举初始值（编译器推断为 [i32; 5]）
    let arr = [1, 2, 3, 4, 5];

    // 显式类型标注
    let primes: [i32; 5] = [2, 3, 5, 7, 11];

    // 方式二：重复值语法，创建长度为 10、所有元素为 0 的数组
    let zeros = [0; 10];

    let flags = [false; 8]; // 8 个 false

    println!("{arr:?}");   // [1, 2, 3, 4, 5]
    println!("{zeros:?}"); // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let _ = (primes, flags); // 消除未使用警告
}
```

### 访问元素

用 `[]` 下标访问，下标从 0 开始，最后一个元素的下标是 `长度 - 1`：

```rust
fn main() {
    let arr = [10, 20, 30, 40, 50];

    println!("{}", arr[0]); // 10（第一个元素）
    println!("{}", arr[4]); // 50（最后一个，下标 = 长度-1）

    // arr[5]; // 运行时 panic：index out of bounds: the len is 5 but the index is 5
    // 和 C/C++ 不同，Rust 的越界访问不会产生未定义行为，
    // 而是程序立刻终止并打印错误信息，安全有保障
}
```

### 长度与遍历

用 `.len()` 获取数组长度，有三种常见遍历写法：

```rust
fn main() {
    let arr = [10, 20, 30, 40, 50];

    println!("长度: {}", arr.len()); // 5

    // 写法一：直接 for in 数组，得到每个元素（对 Copy 类型会复制值）
    for x in arr {
        print!("{x} "); // 10 20 30 40 50
    }
    println!();

    // 写法二：需要下标时，遍历 0..arr.len() 范围
    for i in 0..arr.len() {
        print!("arr[{i}]={} ", arr[i]);
    }
    println!();

    // 写法三：同时获取下标和值，用 .iter().enumerate()
    for (i, &val) in arr.iter().enumerate() {
        // i 是 usize 类型的下标，val 是 i32 类型的元素值（& 解引用）
        print!("{i}:{val} ");
    }
    println!();
}
```

### 修改数组元素

数组变量必须用 `mut` 声明，才能修改其中的元素：

```rust
fn main() {
    let mut arr = [1, 2, 3, 4, 5];

    // 通过下标直接赋值
    arr[2] = 99;
    println!("{arr:?}"); // [1, 2, 99, 4, 5]

    // 遍历可变引用，用 * 解引用后修改（& 号前面加 mut）
    for x in &mut arr {
        *x *= 2; // *x 表示"x 这个引用所指向的值"
    }
    println!("{arr:?}"); // [2, 4, 198, 8, 10]
}
```

### 数组切片

可以取数组某一段的**切片**（类型写作 `&[T]`）。切片是对连续内存的引用，不复制数据：

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];

    let slice = &arr[1..4]; // 取下标 1、2、3（左闭右开），得到 [2, 3, 4]
    println!("{slice:?}");  // [2, 3, 4]
    println!("{}", slice[0]); // 2
    println!("{}", slice.len()); // 3
}
```

函数参数写 `&[T]`（切片引用）而不是 `&[T; N]`（固定长度数组引用），是因为 `&[T]` 可以接受任意长度的数组和 Vec，更通用：

```rust
fn print_sum(values: &[i32]) { // &[i32] 接受任意长度
    let sum: i32 = values.iter().sum();
    println!("sum = {sum}");
}

fn main() {
    let arr = [1, 2, 3, 4, 5];
    let vec = vec![10, 20, 30];

    print_sum(&arr);       // 数组引用自动转为 &[i32]
    print_sum(&vec);       // Vec 引用也自动转为 &[i32]
    print_sum(&arr[1..3]); // 切片直接传
}
```

### 多维数组

数组可以嵌套，类型写作 `[[元素类型; 列数]; 行数]`（注意行数在外层）：

```rust
fn main() {
    // 3 行 3 列的二维数组
    let matrix: [[i32; 3]; 3] = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ];

    // 先写行下标，再写列下标，都从 0 开始
    println!("{}", matrix[1][2]); // 6（第 2 行、第 3 列）

    // 嵌套 for 循环遍历矩阵
    for row in &matrix {
        for val in row {
            print!("{val:3}"); // 宽度 3，让各列对齐
        }
        println!();
    }
}
```

### 数组常用方法

数组通过切片继承了很多有用的方法：

```rust
fn main() {
    let mut arr = [3, 1, 4, 1, 5, 9, 2, 6];

    arr.sort();                           // 就地排序（从小到大）
    println!("{arr:?}"); // [1, 1, 2, 3, 4, 5, 6, 9]

    arr.sort_by(|a, b| b.cmp(a));        // 自定义排序（从大到小）
    println!("{arr:?}"); // [9, 6, 5, 4, 3, 2, 1, 1]

    arr.reverse();                        // 就地反转
    println!("{arr:?}"); // [1, 1, 2, 3, 4, 5, 6, 9]

    println!("{}", arr.contains(&5));     // 是否包含 5，true
    println!("{:?}", arr.iter().min());   // 最小值 Some(1)
    println!("{:?}", arr.iter().max());   // 最大值 Some(9)

    let sum: i32 = arr.iter().sum();      // 求和
    println!("sum={sum}");

    // windows(n)：大小为 n 的滑动窗口
    for w in arr.windows(3) {
        println!("{w:?}");
    }

    // chunks(n)：每次取 n 个，不重叠
    for c in arr.chunks(3) {
        println!("{c:?}");
    }
}
```

## Vec\<T\>：动态数组

`Vec<T>` 是元素类型为 `T` 的动态数组，和其他语言里的 `ArrayList` 或 `vector` 类似。在栈上存储三个值：指向堆上数组数据的指针、当前元素个数（`len`）、已分配的容量（`capacity`）。

### 创建

```rust
fn main() {
    // 方式一：创建空 Vec，然后添加元素
    let mut v: Vec<i32> = Vec::new();
    v.push(1);
    v.push(2);
    v.push(3);

    // 方式二：vec! 宏，推荐用于有初始值的情况
    let v2 = vec![1, 2, 3];

    // 方式三：预分配容量，避免后续反复重新分配内存
    let mut v3: Vec<i32> = Vec::with_capacity(100);
    println!("len={}, capacity={}", v3.len(), v3.capacity()); // 0, 100
}
```

`with_capacity` 的意义：每次 `push` 时如果容量不够，`Vec` 会在堆上申请一块更大的内存，把所有元素复制过去，再释放旧内存。如果你提前知道大概需要多少个元素，用 `with_capacity` 预留足够空间，就能避免这种反复搬迁。

### 访问元素

```rust
fn main() {
    let v = vec![10, 20, 30, 40, 50];

    // 方式一：下标索引，越界时 panic
    println!("{}", v[2]); // 30

    // 方式二：get 方法，返回 Option<&T>，越界返回 None
    match v.get(2) {
        Some(val) => println!("{val}"),
        None      => println!("越界了"),
    }

    // v.get(100) 会返回 None，不会 panic
}
```

用 `[]` 还是 `get` 取决于你是否能确保下标合法。如果越界是不应该发生的逻辑错误，用 `[]` 让它 panic，问题更显眼；如果越界是正常的输入情况，用 `get` 处理 `None`。

### 遍历

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];

    // 遍历不可变引用
    for x in &v {
        print!("{x} ");
    }
    println!();

    // 遍历可变引用，可以修改元素
    for x in &mut v {
        *x *= 2; // *x 解引用后赋值
    }
    println!("{v:?}"); // [2, 4, 6, 8, 10]
}
```

### 常用方法

```rust
fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    v.push(5);              // 追加到末尾
    v.pop();                // 移除末尾元素，返回 Option<T>
    v.insert(2, 99);        // 在下标 2 处插入 99
    v.remove(2);            // 移除下标 2 的元素并返回它
    v.sort();               // 就地排序
    v.dedup();              // 移除连续重复元素（排序后去重）
    v.reverse();            // 就地反转
    println!("长度: {}", v.len());
    println!("是否为空: {}", v.is_empty());

    // retain：只保留满足条件的元素
    v.retain(|&x| x > 3);
    println!("{v:?}");

    // extend：把另一个迭代器的元素追加到末尾
    let more = vec![10, 20];
    v.extend(more.iter());
    println!("{v:?}");
}
```

### Vec 的迭代器方法

`Vec`（以及所有实现了 `Iterator` 的类型）可以接链式的迭代器方法，这些方法在 Rust 中被广泛使用：

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    // filter + map + collect
    let result: Vec<i32> = v.iter()
        .filter(|&&x| x % 2 == 0) // 偶数
        .map(|&x| x * x)           // 平方
        .collect();                // 收集成新 Vec
    println!("{result:?}"); // [4, 16, 36]

    // fold：累积
    let sum: i32 = v.iter().fold(0, |acc, &x| acc + x);
    println!("sum={sum}"); // 21

    // any / all
    println!("{}", v.iter().any(|&x| x > 5)); // true
    println!("{}", v.iter().all(|&x| x > 0)); // true
}
```

迭代器方法是**惰性**的，只有在 `collect`、`sum`、`fold` 等**消费者**方法被调用时才真正执行。这让链式操作在效率上和手写循环基本等价，不会产生中间 Vec。

## String 与 &str

Rust 有两种字符串类型：`String` 和 `&str`。理解两者的区别是使用 Rust 字符串的基础。

`&str` 是字符串切片，是对某段 UTF-8 字节序列的引用，本身不拥有数据。字面量 `"hello"` 的类型就是 `&str`，它指向程序二进制的数据段，生命周期贯穿整个程序。

`String` 是存在堆上的可增长字符串，拥有数据。

使用建议：函数参数如果只需要读取字符串，用 `&str`，这样调用者可以传入字面量或 `String` 的引用，更灵活；如果需要拥有字符串所有权或修改它，用 `String`。

### 创建 String

```rust
fn main() {
    let s1 = String::from("hello");       // 从字面量创建
    let s2 = "hello".to_string();         // to_string 等价于 String::from
    let s3 = String::new();               // 空字符串
    let s4 = String::with_capacity(64);   // 预分配容量
}
```

### 为什么不能用下标访问字符串

```rust
fn main() {
    let s = String::from("hello");
    // let c = s[0]; // 编译错误
}
```

这个限制背后有实质性的原因。Rust 字符串是 UTF-8 编码，UTF-8 是变长编码：ASCII 字符占 1 字节，大多数中文字符占 3 字节，某些 Emoji 占 4 字节。

如果 `s[0]` 返回第 0 个字节，那它是 `u8`，而不是完整的字符——对非 ASCII 字符来说，第 0 个字节只是字符编码的一部分，没有意义。如果返回第 0 个字符，那么这个操作就不是 O(1) 的，而是需要从头扫描到第 0 个字符边界，这会误导用户以为它很高效。Rust 选择在编译期拒绝这个操作，强制你用明确表达意图的方式来访问字符串内容。

按字节访问用 `.as_bytes()` 或切片：

```rust
fn main() {
    let s = String::from("hello");
    let bytes: &[u8] = s.as_bytes();
    println!("{}", bytes[0]); // 104，即 'h' 的 ASCII 码
}
```

按字符（Unicode 标量值）迭代用 `.chars()`：

```rust
fn main() {
    let s = String::from("你好世界");
    for c in s.chars() {
        print!("{c} "); // 你 好 世 界
    }
    println!();
    println!("字符数: {}", s.chars().count()); // 4

    // len() 返回字节数，不是字符数
    println!("字节数: {}", s.len()); // 12（每个汉字 3 字节）
}
```

如果要按字节切片，必须确保切割点在字符边界上：

```rust
fn main() {
    let s = String::from("你好");
    let ni = &s[0..3]; // "你"，占字节 0、1、2
    println!("{ni}");
    // let bad = &s[0..1]; // 运行时 panic：不在字符边界
}
```

### 拼接字符串

```rust
fn main() {
    // 方式一：push_str 追加 &str，不转移所有权
    let mut s = String::from("hello");
    s.push_str(", sekai");
    s.push('!'); // push 追加单个 char
    println!("{s}");

    // 方式二：+ 号（实际上调用 add 方法）
    let s1 = String::from("hello");
    let s2 = String::from(", sekai");
    let s3 = s1 + &s2; // s1 的所有权被移走，s2 被借用
    // println!("{s1}"); // 编译错误：s1 已被移走
    println!("{s3}");

    // 方式三：format! 宏，不转移任何所有权，推荐用于拼接多个字符串
    let a = String::from("hello");
    let b = String::from(", ");
    let c = String::from("sekai");
    let result = format!("{}{}{}", a, b, c);
    println!("{result}");
    println!("{a} {b} {c}"); // a b c 仍然有效
}
```

`+` 的右侧必须是 `&str` 或 `&String`（后者会自动转为 `&str`），且会移走左侧 `String` 的所有权——这是因为 `add` 的签名是 `fn add(self, s: &str) -> String`。拼接多个字符串时 `+` 会让所有权关系变得混乱，推荐用 `format!`。

## HashMap\<K, V\>：哈希映射

`HashMap` 不在 prelude 里，需要显式引入：

```rust
use std::collections::HashMap;
```

### 创建与插入

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<String, i32> = HashMap::new();
    scores.insert(String::from("Alice"), 100);
    scores.insert(String::from("Bob"), 85);

    // 从两个 Vec 创建
    let names = vec!["Charlie", "Diana"];
    let vals  = vec![90, 78];
    let map: HashMap<_, _> = names.iter().zip(vals.iter()).collect();
    println!("{map:?}");
}
```

### 所有权注意事项

`insert` 会转移键和值的所有权。如果键或值是 `String`，插入后原变量不可用：

```rust
use std::collections::HashMap;

fn main() {
    let key = String::from("name");
    let val = String::from("Alice");

    let mut map = HashMap::new();
    map.insert(key, val); // key 和 val 的所有权被转移

    // println!("{key}"); // 编译错误
}
```

如果不想转移所有权，插入引用（但需要注意引用的生命周期不短于 HashMap）。

### 访问

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("Alice", 100);
    scores.insert("Bob", 85);

    // get 返回 Option<&V>
    if let Some(&score) = scores.get("Alice") {
        println!("Alice: {score}");
    }

    // 遍历（顺序不确定）
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
}
```

Rust 的 `HashMap` 使用 SipHash 算法，对哈希洪水攻击有抵抗力，适合处理不受信任的输入。如果对性能有极端需求，可以替换为 `FxHashMap`（来自 `rustc-hash` crate）等更快的哈希器。

### entry API

直接插入时，如果键已存在，`insert` 会覆盖旧值。很多时候我们想要的是"不存在就插入，存在就更新"，`entry` API 是惯用写法：

```rust
use std::collections::HashMap;

fn main() {
    let text = "hello world hello sekai world hello";
    let mut word_count: HashMap<&str, i32> = HashMap::new();

    for word in text.split_whitespace() {
        // entry 返回对应键的 Entry，or_insert 在键不存在时插入默认值
        // 无论哪种情况，返回对值的可变引用
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }

    println!("{word_count:?}");
}
```

`or_insert` 是最常见的用法，还有 `or_insert_with`（只在需要时才调用闭包创建值，适合创建代价较高的情况）和 `or_default`（用类型的 `Default` 值）：

```rust
use std::collections::HashMap;

fn main() {
    let mut map: HashMap<&str, Vec<i32>> = HashMap::new();

    // 不存在时插入空 Vec，存在时直接使用
    map.entry("evens").or_insert_with(Vec::new).push(2);
    map.entry("evens").or_insert_with(Vec::new).push(4);
    map.entry("odds").or_default().push(1);

    println!("{map:?}");
}
```

### 其他常用方法

```rust
use std::collections::HashMap;

fn main() {
    let mut m = HashMap::new();
    m.insert("a", 1);
    m.insert("b", 2);

    println!("{}", m.contains_key("a")); // true
    m.remove("b");
    println!("长度: {}", m.len());

    // values() / keys() 返回迭代器
    let sum: i32 = m.values().sum();
    println!("值的总和: {sum}");
}
```

## 数组 vs Vec 的选择

固定大小、大小在编译期确定时用数组 `[T; N]`，存在栈上，没有分配开销；运行时大小不确定或需要动态增减元素时用 `Vec<T>`。

在函数参数里，如果只需要读取一段连续元素而不关心它是来自数组还是 Vec，用切片 `&[T]`：

```rust
fn sum(values: &[i32]) -> i32 {
    values.iter().sum()
}

fn main() {
    let arr = [1, 2, 3, 4, 5];
    let vec = vec![10, 20, 30];

    println!("{}", sum(&arr)); // 数组引用自动转为 &[i32]
    println!("{}", sum(&vec)); // Vec 引用也自动转为 &[i32]
}
```
