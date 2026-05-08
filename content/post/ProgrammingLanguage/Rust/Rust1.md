---
title: "通用语言教程-Rust 篇【1】从零开始"
date: 2026-05-07T09:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","基础语法","Cargo"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

Rust 是一门以内存安全和高性能著称的系统级语言。它不靠垃圾回收器管理内存，而是在编译期通过所有权系统完成这件事。这个设计带来了 C/C++ 级别的运行速度，同时消除了大量运行时的内存错误。

你可能在各种地方看到"Rust 很难学"这样的说法，主要是指所有权和借用这套机制——这是 Rust 独有的东西，需要一段时间适应。但基础语法本身并没有那么难，有 C++ 或 Python 背景的话会发现很多相似的地方。

这一篇从安装、工具链、项目管理开始，一步一步讲到基础语法。

## 安装 Rust

Rust 官方提供了一个叫 `rustup` 的工具链管理器，它负责安装和更新 Rust 编译器、标准库以及相关工具。推荐通过它安装，而不是用系统包管理器，因为 `rustup` 能精确控制版本。

访问 [rustup.rs](https://rustup.rs/)，按提示执行安装命令。安装完成后，在终端运行：

```bash
rustc --version
cargo --version
```

两个命令都有输出就说明安装成功了。`rustc` 是 Rust 编译器，`cargo` 是 Rust 的构建工具和包管理器，两者都是必须的。

## Cargo 入门

Rust 项目几乎都用 Cargo 来管理。它做的事情很多：创建项目、编译、运行、下载依赖、生成文档……可以把它理解成 Python 的 `pip` + 构建工具的组合。

### 创建项目

```bash
cargo new hello_rust
cd hello_rust
```

这条命令创建了一个名为 `hello_rust` 的目录，里面已经有了完整的初始结构，同时还自动初始化了一个 Git 仓库。目录里有三个东西：`src/main.rs` 是程序入口文件，`Cargo.toml` 是项目配置文件，`.gitignore` 是 Git 忽略规则（忽略了编译产物目录 `target/`）。

`src/main.rs` 里已经有一段 Hello World 代码，可以直接运行。

### Cargo.toml 的结构

打开 `Cargo.toml`，内容大致是这样：

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2024"

[dependencies]
```

`[package]` 段描述这个包的基本信息。`name` 是包名，`version` 遵循语义化版本规范（主版本.次版本.补丁版本），`edition` 是 Rust 的"版次"——Rust 每隔几年会出一个新版次，每个版次可以引入一些不向后兼容的改进，目前默认使用 2024（`cargo new` 从 Rust 1.85 起自动生成 `edition = "2024"`）。2024 版次把 `gen` 正式列为关键字，部分旧库方法名因此做了改动（比如 `rand` 0.9+ 把 `gen` / `gen_range` 重命名），本教程所有示例均以 Rust 2024 为准。

`[dependencies]` 段列出这个项目依赖的第三方库。现在是空的，等会儿会用到。

### 添加第三方库

Rust 的第三方库托管在 [crates.io](https://crates.io/)，这是官方的包注册表。添加依赖有两种方式。

第一种，用命令行（需要 cargo 1.62+）：

```bash
cargo add rand
```

这条命令会自动找到 `rand` 的最新版本，写入 `Cargo.toml` 的 `[dependencies]` 段。

第二种，手动编辑 `Cargo.toml`，在 `[dependencies]` 下加一行：

```toml
[dependencies]
rand = "0.9"
```

然后执行 `cargo build`，Cargo 会自动下载这个包以及它所有的间接依赖，缓存到本地。第一次下载可能需要一点时间，之后会用缓存。

项目里还会出现一个 `Cargo.lock` 文件，里面记录了所有依赖的精确版本（包括间接依赖）。可执行程序项目应该把 `Cargo.lock` 提交到 Git，这样团队里所有人用的版本完全一致；如果你在写一个库，则不提交 `Cargo.lock`。

### 使用已安装的库

添加依赖后，在代码里通过 `use` 语句引入需要的内容。比如用 `rand` 生成随机数：

```rust
use rand::Rng; // 把 rand::Rng 这个 trait 引入当前作用域

fn main() {
    // rand 0.9+：rand::rng() 获取线程本地 RNG（原 thread_rng()）
    // gen_range 已改名为 random_range（gen 是 Rust 2024 的关键字）
    let n: i32 = rand::rng().random_range(1..=100); // 生成 1 到 100 的随机整数
    println!("随机数: {n}");
}
```

`use` 语句的作用是把某个路径引入当前作用域，省去每次都写完整路径的麻烦。标准库的内容也是这样用的，后面读取键盘输入时会用到 `use std::io`。

有些内容不需要 `use` 就能直接用，比如 `println!`、`Vec`、`String`、`Option` 等——它们属于 Rust 的**预导入（prelude）**，编译器会自动引入每个文件。预导入的完整列表很短，其余一切都需要显式 `use`。

### 常用 cargo 命令

```bash
cargo run          # 编译并运行（开发时最常用）
cargo build        # 只编译，不运行（输出在 target/debug/）
cargo build --release  # 优化编译（输出在 target/release/），性能大幅提升，编译慢
cargo check        # 只做语法和类型检查，不生成二进制文件，速度最快
cargo test         # 运行测试
cargo doc --open   # 生成文档并在浏览器打开（包括所有依赖的文档）
cargo clean        # 删除 target/ 目录，清理编译产物
```

`cargo check` 特别有用——它不生成最终文件，速度比 `cargo build` 快很多，在开发时反复运行可以快速确认代码是否有错。

## 第一个程序

`src/main.rs` 的初始内容：

```rust
fn main() {
    println!("Hello, world!");
}
```

`fn main()` 是程序的入口点，程序从这里开始执行。每个可执行 Rust 程序都必须有且只有一个 `main` 函数。`fn` 是定义函数的关键字，`main` 是函数名，括号里是参数（这里是空的），花括号内是函数体。

把 `"Hello, world!"` 改成我博客一贯的风格 `"Hello, Sekai!"`，然后运行：

```bash
cargo run
```

## 四种输出宏

Rust 提供了四个用于输出文本的宏，功能各有侧重。

`println!` 是最常用的，输出内容后自动追加一个换行符，光标移到下一行。

`print!` 和 `println!` 的唯一区别是：不追加换行符，输出后光标停在当前行末尾。

```rust
fn main() {
    print!("第一段");
    print!("第二段");
    println!("第三段"); // 这里才换行
    println!("第四段");
}
```

输出：

```text
第一段第二段第三段
第四段
```

需要注意的是，终端输出通常是有缓冲的。如果你用 `print!` 输出了内容，但后续代码有耗时操作，可能看不到输出——因为它还在缓冲区里没刷新到屏幕。如果遇到这种情况，可以手动刷新：

```rust
use std::io::{self, Write};

fn main() {
    print!("请输入内容：");
    io::stdout().flush().unwrap(); // 强制刷新输出缓冲区
    // 然后读取输入...
}
```

`eprintln!` 和 `eprint!` 的功能与前两者一样，区别是输出到**标准错误流（stderr）**而非标准输出流（stdout）。在终端里看起来没什么不同，但在脚本或管道中，stderr 和 stdout 是分开的，错误信息走 stderr 不会混进正常输出。

```rust
fn main() {
    println!("这是正常输出，走 stdout");
    eprintln!("这是错误信息，走 stderr");
}
```

这四个都是宏（名字后面有 `!`），不是普通函数。宏在编译期展开，可以做普通函数做不到的事——比如在编译期检查格式字符串和参数数量是否匹配。如果你写了一个格式字符串但参数数量不对，编译就会报错，而不是等到运行时才崩溃。

## 格式化字符串

格式字符串中的 `{}` 是占位符，运行时会被替换成对应参数的值。Rust 有两种写法：

```rust
fn main() {
    let name = "Sekai";
    let score = 95;

    // 旧写法：占位符和变量名分开，变量名跟在格式字符串后面
    println!("姓名：{}，成绩：{}", name, score);

    // 新写法（Rust 1.58 起）：直接把变量名写进占位符里，更直观
    println!("姓名：{name}，成绩：{score}");

    // 按索引引用参数（字面量没有名字，只能用索引写法，索引从 0 开始）
    println!("{0} 和 {1}，以及再次出现的 {0}", "第一", "第二");
}
```

> **本教程约定**：从这里起，所有代码示例统一使用 `{变量名}` 的新写法。这是现代 Rust 代码里的推荐风格，代码更简洁，变量和占位符的对应关系一目了然。

`{}` 调用的是这个值的 `Display` trait，也就是"给人看的格式"。另一个常用的是 `{:?}`，调用 `Debug` trait，输出更接近代码表示，常用于调试：

```rust
fn main() {
    let v = vec![1, 2, 3];
    println!("{v:?}");   // [1, 2, 3]
    println!("{v:#?}");  // 每个元素单独一行，更易读
}
```

格式占位符还可以控制对齐、宽度、精度、进制等：

```rust
fn main() {
    // 宽度控制（不足时用空格填充）
    println!("{:10}", "left");      // "left      "（默认左对齐字符串）
    println!("{:>10}", "right");    // "     right"（右对齐）
    println!("{:^10}", "center");   // "  center  "（居中）
    println!("{:*^10}", "hi");      // "****hi****"（用 * 填充居中）

    // 数字精度
    println!("{:.2}", 3.14159);     // "3.14"（保留2位小数）
    println!("{:8.2}", 3.14);       // "    3.14"（宽度8，2位小数）

    // 进制
    println!("{:b}", 42);   // "101010"（二进制）
    println!("{:o}", 42);   // "52"（八进制）
    println!("{:x}", 255);  // "ff"（十六进制小写）
    println!("{:X}", 255);  // "FF"（十六进制大写）
    println!("{:#x}", 255); // "0xff"（带前缀）

    // 正号和补零
    println!("{:+}", 42);    // "+42"
    println!("{:05}", 42);   // "00042"（用0补足宽度）
}
```

## 变量

### let 绑定与类型推断

Rust 用 `let` 声明变量。变量声明时必须立刻初始化（赋值），但不一定需要写出类型——编译器会根据赋的值推断：

```rust
fn main() {
    let x = 5;       // 编译器推断为 i32（整数默认类型）
    let y = 3.14;    // 推断为 f64（浮点默认类型）
    let z = true;    // 推断为 bool
    let s = "hello"; // 推断为 &str

    println!("{x} {y} {z} {s}");
}
```

如果需要指定类型，在变量名后面加冒号：

```rust
fn main() {
    let x: i64 = 5;       // 明确指定为 i64
    let y: f32 = 3.14;    // 明确指定为 f32
}
```

有时候编译器推断不出类型，必须手动标注，比如从迭代器收集结果时：

```rust
fn main() {
    let numbers: Vec<i32> = vec![1, 2, 3]; // 必须告诉编译器这是 Vec<i32>
}
```

### 可变变量

Rust 的变量默认是**不可变**的。声明后再次赋值，编译器会报错：

```rust
fn main() {
    let x = 5;
    x = 10; // 编译错误：cannot assign twice to immutable variable
}
```

需要可变变量时，加 `mut` 关键字：

```rust
fn main() {
    let mut x = 5;
    println!("{x}"); // 5
    x = 10;
    println!("{x}"); // 10
}
```

这个设计是刻意的。在实际项目中，大量变量是"赋值一次，之后只读"的，默认不可变能避免不少因为意外修改导致的 bug。需要修改时再加 `mut`，代码的意图也更清晰。

### 变量遮蔽

Rust 允许在同一作用域内用 `let` 重新声明同名变量，后者会遮蔽（shadow）前者：

```rust
fn main() {
    let x = 5;
    let x = x + 1;    // 新的 x 遮蔽了旧的 x，值为 6
    let x = x * 2;    // 再次遮蔽，值为 12

    println!("{x}"); // 12

    // 遮蔽可以改变类型，这是 mut 做不到的
    let spaces = "   ";     // &str 类型
    let spaces = spaces.len(); // usize 类型，遮蔽了前面的 spaces
    println!("{spaces}"); // 3
}
```

遮蔽和 `let mut` 的区别：`let mut` 改变的是同一个变量的值，类型不能变；遮蔽是创建了一个全新的变量，类型可以完全不同。

在用某个值计算出另一个值后，如果不再需要原来的值，遮蔽比起再想一个新名字要更简洁。

## 常量

`const` 用来声明常量。常量必须标注类型，且在整个程序运行期间值不变：

```rust
const MAX_SCORE: u32 = 100;
const PI: f64 = 3.141_592_653;

fn main() {
    println!("最高分: {MAX_SCORE}");
}
```

常量可以定义在任何作用域，包括函数外。按惯例，常量名用全大写加下划线。

还有 `static`，和 `const` 类似，但有一个固定的内存地址，整个程序运行期间这块内存都存在。`const` 的值在编译时会被内联到每个用到的地方，`static` 有一个确定的地址。大多数情况下用 `const` 就够了，`static` 主要用于需要全局唯一地址的场景（比如一些底层程序）。

```rust
static GREETING: &str = "你好";

fn main() {
    println!("{GREETING}");
}
```

## 基础数据类型

### 整数类型

Rust 的整数类型按有无符号和位宽分为多种：

有符号整数（可以表示负数）：`i8`、`i16`、`i32`、`i64`、`i128`、`isize`。

无符号整数（只能表示非负数）：`u8`、`u16`、`u32`、`u64`、`u128`、`usize`。

数字就是位宽：`i8` 占 1 字节，范围 -128 到 127；`i32` 占 4 字节，范围约 -21 亿到 21 亿；`u8` 是 0 到 255，常用于处理字节数据。

`isize` 和 `usize` 的宽度由 CPU 架构决定：64 位系统上是 64 位，32 位系统上是 32 位。`usize` 是数组下标和集合长度的默认类型，因为它天然表示"这台机器能寻址的最大范围"。

没有特别需求时，整数默认用 `i32`，Rust 的类型推断也会把整数字面量默认推断为 `i32`。

写整数字面量时可以用下划线分隔，增加可读性：

```rust
fn main() {
    let million = 1_000_000; // 和 1000000 完全相同
    let hex = 0xFF;          // 十六进制，值为 255
    let octal = 0o77;        // 八进制，值为 63
    let binary = 0b1010;     // 二进制，值为 10
    let byte = b'A';         // u8 字节字面量，值为 65（ASCII 码）
}
```

### 整数溢出

整数溢出在 Rust 里行为取决于编译模式，这是很多语言没有的设计。

Debug 模式下（`cargo build` 或 `cargo run` 时默认），整数溢出会引发 **panic**，程序立刻终止并打印错误信息。这让开发时能立刻发现溢出问题。

Release 模式下（`cargo build --release`），溢出会做**环绕运算**：比如 `u8` 的 255 加 1 变成 0，不会 panic。这是为了性能——Release 模式下不做溢出检查。

如果你希望在任何模式下都有确定的行为，可以用以下方法显式控制：

```rust
fn main() {
    let x: u8 = 200;

    // wrapping_add：始终环绕，不 panic
    println!("{}", x.wrapping_add(100)); // 44（(200+100) % 256 = 44）

    // checked_add：溢出时返回 None
    println!("{:?}", x.checked_add(100)); // None
    println!("{:?}", x.checked_add(10));  // Some(210)

    // saturating_add：溢出时停在边界值
    println!("{}", x.saturating_add(100)); // 255（u8 最大值）

    // overflowing_add：返回 (结果, 是否溢出)
    println!("{:?}", x.overflowing_add(100)); // (44, true)
}
```

### 浮点类型

浮点数有 `f32` 和 `f64` 两种，分别是 IEEE 754 单精度和双精度。默认推断为 `f64`，因为现代 CPU 处理 64 位浮点和 32 位几乎一样快，精度更高。

```rust
fn main() {
    let a = 2.0;     // f64
    let b: f32 = 2.0; // f32

    println!("{}", 0.1 + 0.2); // 0.30000000000000004，浮点精度问题
}
```

浮点精度是所有使用 IEEE 754 的语言共有的问题，不是 Rust 特有的。比较浮点数时不要用 `==`，而是判断差值是否小于一个很小的值（epsilon）：

```rust
fn main() {
    let a = 0.1_f64 + 0.2;
    let b = 0.3_f64;
    println!("{}", (a - b).abs() < f64::EPSILON); // true
}
```

### 布尔类型

`bool` 只有 `true` 和 `false` 两个值，在内存里占 1 字节：

```rust
fn main() {
    let is_active = true;
    let is_empty: bool = false;

    if is_active {
        println!("激活");
    }
}
```

### 字符类型

Rust 的 `char` 类型表示一个 **Unicode 标量值**，占 4 字节（而 C/C++ 的 `char` 是 1 字节的 ASCII）。这意味着汉字、emoji 都是合法的 `char`：

```rust
fn main() {
    let c = 'a';
    let chinese = '中';
    let emoji = '😀';

    println!("{c} {chinese} {emoji}");
    println!("char 占 {} 字节", std::mem::size_of::<char>()); // 4
}
```

用单引号表示 `char`，双引号表示字符串。

## 类型转换

Rust 不会隐式转换数值类型，哪怕是从小范围转到大范围也不行：

```rust
fn main() {
    let x: i32 = 5;
    let y: i64 = x; // 编译错误：expected i64, found i32
}
```

需要显式用 `as` 关键字转换：

```rust
fn main() {
    let x: i32 = 1000;
    let y = x as i64;    // i32 → i64，安全
    let z = x as u8;     // i32 → u8，可能截断：1000 % 256 = 232
    let f = x as f64;    // i32 → f64

    println!("{y} {z} {f}"); // 1000 232 1000
}
```

从大范围向小范围转换时，`as` 会直接截断高位字节，不报错。需要自己确认不会出问题，或者用 `try_from` / `try_into` 做安全转换（返回 `Result`，溢出时返回错误而不是截断）。

## 运算符

了解基本类型之后，就可以用运算符对它们进行操作了。Rust 的运算符按功能分为以下几类。

### 算术运算符

对数值类型进行基本数学运算：

| 运算符 | 含义 | 示例（结果） |
| --- | --- | --- |
| `+` | 加法 | `3 + 2`（5） |
| `-` | 减法 | `3 - 2`（1） |
| `*` | 乘法 | `3 * 2`（6） |
| `/` | 除法 | `7 / 2`（3，整数截断） |
| `%` | 取余 | `7 % 2`（1） |

整数除法 `7 / 2` 结果是 `3` 而不是 `3.5`——两个整数相除结果还是整数，小数部分直接丢弃（向零截断）。要得到小数结果，必须把其中一个转成浮点类型。

```rust
fn main() {
    let a = 10;
    let b = 3;

    println!("{}", a + b); // 13
    println!("{}", a - b); // 7
    println!("{}", a * b); // 30
    println!("{}", a / b); // 3（不是 3.333...，整数截断）
    println!("{}", a % b); // 1（余数）

    // 想要小数结果，先转成 f64
    println!("{:.4}", a as f64 / b as f64); // 3.3333

    // 复合赋值：等号左边的变量参与运算后把结果存回去
    let mut x = 10;
    x += 3;  // x = 13，等价于 x = x + 3
    x -= 5;  // x = 8
    x *= 2;  // x = 16
    x /= 4;  // x = 4
    x %= 3;  // x = 1
    println!("{x}"); // 1
}
```

> Rust 没有 `++` 和 `--` 运算符（C/C++/Java 有），自增自减统一用 `+= 1` 和 `-= 1`。

### 比较运算符

比较运算符对两个值进行比较，结果是 `bool` 类型（`true` 或 `false`）：

| 运算符 | 含义 |
| --- | --- |
| `==` | 等于 |
| `!=` | 不等于 |
| `<` | 小于 |
| `>` | 大于 |
| `<=` | 小于等于 |
| `>=` | 大于等于 |

```rust
fn main() {
    let x = 5;
    let y = 10;

    println!("{}", x == y);  // false
    println!("{}", x != y);  // true
    println!("{}", x < y);   // true
    println!("{}", x >= 5);  // true（x 就是 5，满足 >= 5）

    // 比较结果可以直接赋值给 bool 变量
    let is_adult = 18 <= 20; // true
    println!("{is_adult}");
}
```

### 逻辑运算符

逻辑运算符对 `bool` 值进行组合，结果仍然是 `bool`：

| 运算符 | 含义 | 说明 |
| --- | --- | --- |
| `&&` | 逻辑与 | 两边都为 `true` 时结果才为 `true` |
| `\|\|` | 逻辑或 | 至少一边为 `true` 时结果为 `true` |
| `!` | 逻辑非 | 取反，`true` 变 `false`，`false` 变 `true` |

```rust
fn main() {
    let a = true;
    let b = false;

    println!("{}", a && b); // false（需要两边都 true）
    println!("{}", a || b); // true（有一边 true 就行）
    println!("{}", !a);     // false（取反）

    // 常见用法：在 if 条件里组合多个条件
    let x = 5;
    if x > 0 && x < 10 {
        println!("{x} 在 1 到 9 之间");
    }

    let name = "admin";
    if name == "admin" || name == "root" {
        println!("超级用户");
    }
}
```

`&&` 和 `||` 有**短路求值**特性：`&&` 左边为 `false` 时右边不会执行（因为结果已经确定是 `false`）；`||` 左边为 `true` 时右边不会执行。这在右边是函数调用时很重要——短路时函数不会被调用。

### 位运算符

位运算直接操作整数在内存中的二进制位。这类运算在底层编程、标志位处理、网络协议解析等场景里常用：

| 运算符 | 含义 |
| --- | --- |
| `&` | 按位与（两位都是 1 才为 1） |
| `\|` | 按位或（任意一位是 1 就为 1） |
| `^` | 按位异或（不同的位为 1） |
| `!` | 按位取反 |
| `<<` | 左移（高位溢出丢弃，低位补 0） |
| `>>` | 右移（无符号右移补 0，有符号右移补符号位） |

```rust
fn main() {
    let a: u8 = 0b_1100; // 12，二进制 00001100
    let b: u8 = 0b_1010; // 10，二进制 00001010

    println!("{:08b}", a & b); // 00001000 = 8（同位都是1才为1）
    println!("{:08b}", a | b); // 00001110 = 14（任意一位是1就为1）
    println!("{:08b}", a ^ b); // 00000110 = 6（不同的位为1）

    let x: u32 = 1;
    println!("{}", x << 4); // 16（左移4位，相当于乘以 2^4）
    println!("{}", 16u32 >> 2); // 4（右移2位，相当于除以 2^2）
}
```

### 运算符优先级

表达式里有多种运算符时，优先级决定计算顺序。记住几条主要规则：算术运算 `*` `/` 优先于 `+` `-`；比较运算优先于逻辑运算；`&&` 优先于 `||`。

遇到不确定的情况，**加括号明确意图永远是最好的选择**：

```rust
fn main() {
    println!("{}", 2 + 3 * 4);        // 14（* 先算）
    println!("{}", (2 + 3) * 4);       // 20（括号优先）
    println!("{}", true || false && false); // true（&& 优先于 ||，等同于 true || (false && false)）
}
```

## use 与标准库

Rust 的标准库叫 `std`，按功能分成若干模块：`std::io`（输入输出）、`std::collections`（集合类型）、`std::thread`（线程）、`std::fs`（文件系统）等等。

用 `use` 把需要的内容引入当前作用域：

```rust
use std::io;                    // 引入 io 模块本身
use std::io::BufRead;           // 引入 io 里的 BufRead trait
use std::collections::HashMap;  // 引入 HashMap
use std::collections::{HashMap, HashSet}; // 一次引入多个
```

也可以不用 `use`，每次写完整路径，但那样代码很冗长：

```rust
fn main() {
    let mut map = std::collections::HashMap::new(); // 没有 use 时的写法
}
```

引入外部库（已在 Cargo.toml 里声明了依赖）的方式完全相同，只是把 `std` 换成库名：

```rust
use rand::Rng;
use serde::{Serialize, Deserialize};
```

`use` 语句通常写在文件顶部，函数外面，这样整个文件都能用。也可以写在函数内部，那就只在这个函数里生效。

## 读取键盘输入

从标准输入读取一行文本：

```rust
use std::io;

fn main() {
    let mut input = String::new(); // 创建一个可增长的空字符串，用来存输入内容

    io::stdin()             // 获取标准输入句柄
        .read_line(&mut input) // 读取一行，追加到 input 里
        .expect("读取失败");   // 若读取出错，panic 并打印这条消息

    // read_line 读到的内容末尾带有换行符 \n（Windows 上是 \r\n），
    // trim() 去掉首尾空白字符（包括换行符）
    let trimmed = input.trim();
    println!("你输入的是：{trimmed}");
}
```

`.read_line()` 有几个细节值得注意。它不会清空 `input`，而是把内容追加进去。如果你在循环里反复调用，需要在每次循环开头用 `input.clear()` 清空，否则每次读到的内容都会追加在一起。读取的内容包含末尾的换行符，所以几乎总是需要 `.trim()`。

把输入的字符串转成数字：

```rust
use std::io;

fn main() {
    println!("请输入一个整数：");
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("读取失败");

    // parse() 把字符串解析成指定类型，通过类型标注告诉它解析成什么
    let number: i32 = input.trim().parse().expect("请输入有效的整数");
    println!("你输入了 {number}，它的两倍是 {}", number * 2);
}
```

`.parse()` 返回的是 `Result` 类型（后面章节会详细讲），`.expect()` 是一种简便处理方式：如果解析成功就取出值，如果失败就 panic 并打印括号里的消息。生产代码里应该用更完善的错误处理，但在练习时 `expect` 很好用。

下面是一个完整的例子，读取两个数字并输出它们的和：

```rust
use std::io;

fn main() {
    let mut input = String::new();

    println!("输入第一个数：");
    io::stdin().read_line(&mut input).expect("读取失败");
    let a: f64 = input.trim().parse().expect("无效数字");

    input.clear(); // 清空，准备读下一个

    println!("输入第二个数：");
    io::stdin().read_line(&mut input).expect("读取失败");
    let b: f64 = input.trim().parse().expect("无效数字");

    println!("{a} + {b} = {}", a + b);
}
```

## 标准库（std）模块概览

Rust 的标准库按功能划分为多个模块，下表列出最常用的部分，遇到相关需求时可以快速定位：

| 模块 | 主要用途 |
| --- | --- |
| `std::io` | 输入输出基础（Read/Write trait、stdin/stdout/stderr、BufReader） |
| `std::fs` | 文件系统操作（读写文件、创建/删除目录、元数据查询） |
| `std::collections` | 常用集合（`HashMap`、`HashSet`、`BTreeMap`、`VecDeque`、`LinkedList`） |
| `std::thread` | 线程创建（`spawn`）、`JoinHandle`、线程本地存储 |
| `std::sync` | 同步原语（`Mutex`、`RwLock`、`Arc`、`Condvar`、`Barrier`、`mpsc channel`） |
| `std::net` | 底层 TCP/UDP 网络编程（`TcpListener`、`TcpStream`、`UdpSocket`） |
| `std::path` | 文件路径处理（`Path`、`PathBuf`，跨平台处理 `/` 和 `\`） |
| `std::env` | 环境变量（`var`）、命令行参数（`args`）、当前目录 |
| `std::process` | 启动子进程（`Command`）、退出程序（`exit`） |
| `std::fmt` | 格式化（`Display`、`Debug`、`Formatter` 等 trait 定义） |
| `std::ops` | 运算符重载 trait（`Add`、`Sub`、`Mul`、`Deref`、`Index` 等） |
| `std::cmp` | 比较 trait（`PartialOrd`、`Ord`、`Ordering`） |
| `std::iter` | 迭代器 trait 和工具函数（`Iterator`、`chain`、`zip`、`repeat` 等） |
| `std::mem` | 内存工具（`size_of`、`swap`、`replace`、`drop`） |
| `std::time` | 高精度计时（`Instant`）和时间段（`Duration`） |
| `std::str` | 字符串切片方法的底层定义 |
| `std::num` | 数字相关（`NonZeroU32` 等非零类型、饱和/溢出方法） |
| `std::error` | 错误处理基础 trait（`Error`） |

使用时，用 `use` 把需要的内容引入作用域：

```rust
use std::collections::HashMap;
use std::io::{self, Read, Write};   // self 表示引入 std::io 本身
use std::path::PathBuf;
```

查阅文档有两种方式：在线查 [doc.rust-lang.org/std](https://doc.rust-lang.org/std/)（有搜索功能）；或者在项目目录下运行 `cargo doc --open`，会在浏览器里生成并打开本项目所有依赖（含标准库）的文档。

## Rust 生态系统：常用第三方库

Rust 的第三方库托管在 [crates.io](https://crates.io/)，文档在 [docs.rs](https://docs.rs/) 自动生成。以下是各领域最常用的库，遇到对应需求时可以直接从这里找起：

**序列化与反序列化**

`serde`（配合 `serde_json`/`serde_toml` 等格式库使用）：Rust 生态里几乎人人都用的序列化框架。结构体加上 `#[derive(Serialize, Deserialize)]` 就能自动转换成 JSON/TOML/YAML 等格式，使用简单，性能极高。

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**异步运行时**

`tokio`：最主流的异步运行时，提供异步 IO、任务调度、定时器、channel 等。绝大多数异步库都基于 tokio 生态。

`async-std`：另一个异步运行时，API 风格更接近标准库。

**HTTP**

`reqwest`：基于 tokio 的 HTTP 客户端，支持同步和异步两种用法，发送 HTTP 请求的首选。

**Web 框架**

`axum`：tokio 官方团队出品，现在写 Rust 后端服务最流行的框架。

`actix-web`：老牌高性能 Web 框架，社区成熟，文档丰富。

**命令行**

`clap`：命令行参数解析，支持子命令、自动生成帮助文档，写 CLI 工具首选。

**随机数**

`rand`：随机数生成，从简单的随机整数到复杂的概率分布都有。0.9+ 版本适配 Rust 2024，`rand::rng()` 取代原来的 `thread_rng()`，方法名 `gen` / `gen_range` 改为 `random` / `random_range`。

**错误处理**

`thiserror`：简化自定义错误类型（适合库作者），用宏代替手写 `Display` 和 `From`。

`anyhow`：简化应用代码里的错误处理（适合应用开发者），把各种错误统一成一个 `anyhow::Error`，加 `?` 就能传播。

**日期与时间**

`chrono`：日期时间处理，解析、格式化、时区转换等。标准库的 `std::time` 只能计时，具体的年月日要用 `chrono`。

**正则表达式**

`regex`：正则表达式匹配，Rust 官方团队维护，使用线性时间算法，没有回溯爆炸。

**日志**

`log`：轻量的日志门面（只定义 trait，不负责输出），应用代码用它记录日志。

`tracing`：更强大的结构化日志和追踪库，tokio 生态的标准日志方案。

**数学与科学计算**

`nalgebra`：线性代数库（矩阵、向量、变换等），图形/游戏开发常用。

`ndarray`：N 维数组，类似 Python 的 NumPy。

这些库都可以加到 `Cargo.toml` 的 `[dependencies]` 里，版本号在 crates.io 上查。

