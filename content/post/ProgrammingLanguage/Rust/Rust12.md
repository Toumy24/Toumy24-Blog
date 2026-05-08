---
title: "通用语言教程-Rust 篇【12】面向对象编程"
date: 2026-05-08T11:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/rust.png
tags: ["Rust","OOP","面向对象","struct","enum","trait"]
categories:
  - 计算机语言
  - 通用语言
draft: false
---

## 前言：Rust 的 OOP 是什么样的

面向对象编程（OOP）的核心概念是**封装**、**继承**、**多态**。Rust 支持前两个，但不支持传统的类继承。原因很明确：继承在大型代码库里常常带来脆弱的设计（"脆弱基类问题"），而组合（composition）往往是更好的选择。

Rust 的 OOP 体系由三个核心构件组成：

- **`struct`**：存储数据（相当于其他语言的类的"成员变量"部分）
- **`impl` 块**：给 `struct`（或 `enum`）添加方法（相当于"成员函数"）
- **`trait`**：定义接口和行为（相当于 Java 的 `interface` 或 Go 的 `interface`，实现多态）

`enum` 在 Rust OOP 里扮演特殊角色：它代表"一个值可以是若干种不同形态之一"，配合模式匹配，可以替代继承层次结构完成许多传统 OOP 需要多态才能解决的问题。

## 封装：struct + impl

### 基本封装

`struct` 定义数据，`impl` 块定义对数据的操作：

```rust
// 定义一个"账户"类型
pub struct Account {
    owner: String,    // 私有字段：只有 Account 的方法能访问
    balance: f64,     // 私有字段
}

impl Account {
    // 关联函数（静态方法）：创建新实例，习惯上命名为 new
    pub fn new(owner: &str, initial: f64) -> Self {
        Account {
            owner: owner.to_string(),
            balance: initial,
        }
    }

    // 不可变方法：读取数据，&self 表示借用 self
    pub fn balance(&self) -> f64 {
        self.balance
    }

    pub fn owner(&self) -> &str {
        &self.owner
    }

    // 可变方法：修改数据，&mut self 表示可变借用 self
    pub fn deposit(&mut self, amount: f64) {
        if amount > 0.0 {
            self.balance += amount;
        }
    }

    pub fn withdraw(&mut self, amount: f64) -> Result<(), String> {
        if amount > self.balance {
            Err(format!("余额不足，当前余额 {}", self.balance))
        } else {
            self.balance -= amount;
            Ok(())
        }
    }
}

fn main() {
    let mut acc = Account::new("Alice", 1000.0);
    acc.deposit(500.0);
    match acc.withdraw(200.0) {
        Ok(()) => println!("取款成功，余额：{}", acc.balance()),
        Err(e) => println!("失败：{e}"),
    }
    // acc.balance = 9999.0; // 编译错误！balance 是私有字段，无法从外部直接修改
}
```

封装的保证来自可见性系统（`pub`/私有），而不是运行时检查。编译器直接拒绝非法访问。

### Builder 模式

当构造一个有许多可选字段的对象时，"Builder 模式"比一个参数很多的 `new` 函数要清晰得多：

```rust
#[derive(Debug)]
pub struct HttpRequest {
    url: String,
    method: String,
    timeout_secs: u64,
    headers: Vec<(String, String)>,
    body: Option<String>,
}

// Builder 结构体持有构建过程中的中间状态
pub struct HttpRequestBuilder {
    url: String,
    method: String,
    timeout_secs: u64,
    headers: Vec<(String, String)>,
    body: Option<String>,
}

impl HttpRequestBuilder {
    pub fn new(url: &str) -> Self {
        HttpRequestBuilder {
            url: url.to_string(),
            method: "GET".to_string(),
            timeout_secs: 30,
            headers: vec![],
            body: None,
        }
    }

    // 每个方法返回 Self（即 Builder 自身），支持链式调用
    pub fn method(mut self, method: &str) -> Self {
        self.method = method.to_string();
        self
    }

    pub fn timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }

    pub fn header(mut self, key: &str, value: &str) -> Self {
        self.headers.push((key.to_string(), value.to_string()));
        self
    }

    pub fn body(mut self, body: &str) -> Self {
        self.body = Some(body.to_string());
        self
    }

    // 消耗 Builder，返回最终的 HttpRequest
    pub fn build(self) -> HttpRequest {
        HttpRequest {
            url: self.url,
            method: self.method,
            timeout_secs: self.timeout_secs,
            headers: self.headers,
            body: self.body,
        }
    }
}

fn main() {
    let req = HttpRequestBuilder::new("https://api.example.com/data")
        .method("POST")
        .timeout(60)
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer token123")
        .body(r#"{"key": "value"}"#)
        .build();

    println!("{:#?}", req);
}
```

## 多态：trait 对象与泛型

### trait 定义共同行为

```rust
// 定义一个"形状"接口
pub trait Shape {
    fn area(&self) -> f64;
    fn perimeter(&self) -> f64;

    // 可以有默认实现
    fn describe(&self) -> String {
        format!("面积: {:.2}, 周长: {:.2}", self.area(), self.perimeter())
    }
}

pub struct Circle {
    pub radius: f64,
}

pub struct Rectangle {
    pub width: f64,
    pub height: f64,
}

pub struct Triangle {
    pub a: f64,
    pub b: f64,
    pub c: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    fn perimeter(&self) -> f64 {
        2.0 * std::f64::consts::PI * self.radius
    }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }
}

impl Shape for Triangle {
    fn area(&self) -> f64 {
        // 海伦公式
        let s = (self.a + self.b + self.c) / 2.0;
        (s * (s - self.a) * (s - self.b) * (s - self.c)).sqrt()
    }
    fn perimeter(&self) -> f64 {
        self.a + self.b + self.c
    }
}
```

### 两种多态方式

**方式一：泛型（静态分发）**——编译期确定类型，零运行时开销：

```rust
// 泛型函数：T 必须实现 Shape
fn print_shape_info<T: Shape>(shape: &T) {
    println!("{}", shape.describe());
}

// 泛型集合：Vec 里必须是同一种类型
fn total_area<T: Shape>(shapes: &[T]) -> f64 {
    shapes.iter().map(|s| s.area()).sum()
}

fn main() {
    let c = Circle { radius: 5.0 };
    let r = Rectangle { width: 4.0, height: 6.0 };

    print_shape_info(&c);
    print_shape_info(&r);

    let circles = vec![
        Circle { radius: 1.0 },
        Circle { radius: 2.0 },
        Circle { radius: 3.0 },
    ];
    println!("所有圆的总面积：{:.2}", total_area(&circles));
}
```

**方式二：trait 对象（动态分发）**——运行时确定类型，可以存储不同类型的集合：

```rust
fn main() {
    // Box<dyn Shape> 是"指向实现了 Shape 的某个类型"的指针
    // dyn 表示动态分发，运行时通过 vtable（虚函数表）找到正确的方法
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 3.0 }),
        Box::new(Rectangle { width: 4.0, height: 5.0 }),
        Box::new(Triangle { a: 3.0, b: 4.0, c: 5.0 }),
    ];

    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("总面积: {total:.2}");

    for shape in &shapes {
        println!("{}", shape.describe());
    }
}
```

**泛型 vs trait 对象的选择规则：**
- 如果集合里的所有元素都是同一类型（或者可以在编译时确定类型），用泛型
- 如果需要在运行时存储**不同具体类型**的集合（如插件系统、GUI 组件），用 `Box<dyn Trait>`
- 泛型性能更好（无额外间接寻址），trait 对象更灵活

## enum：替代继承层次结构

传统 OOP 里，"一个值可以是几种类型之一"通常用继承来表达（基类 + 多个子类）。Rust 的 enum 是更直接的解决方案，而且模式匹配能强制你处理所有情况。

### 表达状态机

```rust
// 订单状态——用 enum 而不是子类
#[derive(Debug)]
pub enum OrderStatus {
    Pending,                          // 待处理
    Processing { worker_id: u32 },    // 处理中，记录哪个工人在处理
    Shipped { tracking_no: String },  // 已发货，记录快递单号
    Delivered { signed_by: String },  // 已签收，记录签收人
    Cancelled { reason: String },     // 已取消，记录原因
}

#[derive(Debug)]
pub struct Order {
    pub id: u64,
    pub item: String,
    pub status: OrderStatus,
}

impl Order {
    pub fn new(id: u64, item: &str) -> Self {
        Order {
            id,
            item: item.to_string(),
            status: OrderStatus::Pending,
        }
    }

    // 状态转移：每种合法的状态变化都是一个方法
    pub fn start_processing(&mut self, worker_id: u32) -> Result<(), &'static str> {
        match &self.status {
            OrderStatus::Pending => {
                self.status = OrderStatus::Processing { worker_id };
                Ok(())
            }
            _ => Err("只有待处理的订单才能开始处理"),
        }
    }

    pub fn ship(&mut self, tracking_no: &str) -> Result<(), &'static str> {
        match &self.status {
            OrderStatus::Processing { .. } => {
                self.status = OrderStatus::Shipped {
                    tracking_no: tracking_no.to_string(),
                };
                Ok(())
            }
            _ => Err("只有处理中的订单才能发货"),
        }
    }

    pub fn deliver(&mut self, signed_by: &str) -> Result<(), &'static str> {
        match &self.status {
            OrderStatus::Shipped { .. } => {
                self.status = OrderStatus::Delivered {
                    signed_by: signed_by.to_string(),
                };
                Ok(())
            }
            _ => Err("只有已发货的订单才能签收"),
        }
    }

    pub fn status_description(&self) -> String {
        match &self.status {
            OrderStatus::Pending => "等待处理".to_string(),
            OrderStatus::Processing { worker_id } => format!("处理中（工人 {worker_id}）"),
            OrderStatus::Shipped { tracking_no } => format!("已发货，单号：{tracking_no}"),
            OrderStatus::Delivered { signed_by } => format!("已签收，签收人：{signed_by}"),
            OrderStatus::Cancelled { reason } => format!("已取消：{reason}"),
        }
    }
}

fn main() {
    let mut order = Order::new(1001, "键盘");
    println!("订单 {} 状态：{}", order.id, order.status_description());

    order.start_processing(42).unwrap();
    println!("订单 {} 状态：{}", order.id, order.status_description());

    order.ship("SF1234567890").unwrap();
    println!("订单 {} 状态：{}", order.id, order.status_description());

    // 尝试非法状态转移
    match order.start_processing(99) {
        Ok(()) => println!("开始处理"),
        Err(e) => println!("失败：{e}"),  // 输出：失败：只有待处理的订单才能开始处理
    }
}
```

### 表达"有几种变体的值"（替代继承）

想象一个绘图程序里的图形系统。传统 OOP 会用一个 `Shape` 基类加多个子类（`Circle`、`Rectangle`...）。在 Rust 里，如果图形类型是固定已知的，enum 更合适：

```rust
use std::f64::consts::PI;

// 所有图形类型都在这个 enum 里——编译器知道所有可能的情况
#[derive(Debug, Clone)]
pub enum Shape {
    Circle { x: f64, y: f64, radius: f64 },
    Rectangle { x: f64, y: f64, width: f64, height: f64 },
    Triangle { x1: f64, y1: f64, x2: f64, y2: f64, x3: f64, y3: f64 },
}

impl Shape {
    pub fn area(&self) -> f64 {
        match self {
            Shape::Circle { radius, .. } => PI * radius * radius,
            Shape::Rectangle { width, height, .. } => width * height,
            Shape::Triangle { x1, y1, x2, y2, x3, y3 } => {
                // 向量叉积公式
                ((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)).abs() / 2.0
            }
        }
    }

    pub fn move_by(&mut self, dx: f64, dy: f64) {
        match self {
            Shape::Circle { x, y, .. } => { *x += dx; *y += dy; }
            Shape::Rectangle { x, y, .. } => { *x += dx; *y += dy; }
            Shape::Triangle { x1, y1, x2, y2, x3, y3 } => {
                *x1 += dx; *y1 += dy;
                *x2 += dx; *y2 += dy;
                *x3 += dx; *y3 += dy;
            }
        }
    }

    pub fn scale(&self, factor: f64) -> Shape {
        match self {
            Shape::Circle { x, y, radius } => Shape::Circle {
                x: *x, y: *y, radius: radius * factor,
            },
            Shape::Rectangle { x, y, width, height } => Shape::Rectangle {
                x: *x, y: *y,
                width: width * factor,
                height: height * factor,
            },
            Shape::Triangle { x1, y1, x2, y2, x3, y3 } => {
                // 以重心为中心缩放
                let cx = (x1 + x2 + x3) / 3.0;
                let cy = (y1 + y2 + y3) / 3.0;
                Shape::Triangle {
                    x1: cx + (x1 - cx) * factor, y1: cy + (y1 - cy) * factor,
                    x2: cx + (x2 - cx) * factor, y2: cy + (y2 - cy) * factor,
                    x3: cx + (x3 - cx) * factor, y3: cy + (y3 - cy) * factor,
                }
            }
        }
    }
}

fn main() {
    let mut shapes = vec![
        Shape::Circle { x: 0.0, y: 0.0, radius: 5.0 },
        Shape::Rectangle { x: 1.0, y: 1.0, width: 4.0, height: 3.0 },
        Shape::Triangle { x1: 0.0, y1: 0.0, x2: 3.0, y2: 0.0, x3: 1.5, y3: 2.0 },
    ];

    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("总面积：{total:.2}");

    for shape in &mut shapes {
        shape.move_by(10.0, 5.0);
    }
    println!("移动后第一个图形：{:?}", shapes[0]);
}
```

**enum 的关键优势**：`match` 是穷尽的——如果你新增了一种 `Shape` 变体（比如 `Ellipse`），所有没有处理它的 `match` 语句都会产生编译错误，编译器强制你处理新情况。传统继承做不到这一点（忘记在子类里覆盖某个方法只会在运行时出错）。

## 组合替代继承

Rust 没有继承，但可以通过**嵌套 struct** 来实现代码复用：

```rust
// 想象一个游戏里的实体系统

#[derive(Debug, Clone)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Position {
    pub fn distance_to(&self, other: &Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }

    pub fn move_by(&mut self, dx: f64, dy: f64) {
        self.x += dx;
        self.y += dy;
    }
}

#[derive(Debug, Clone)]
pub struct Health {
    pub current: i32,
    pub max: i32,
}

impl Health {
    pub fn new(max: i32) -> Self {
        Health { current: max, max }
    }

    pub fn take_damage(&mut self, damage: i32) {
        self.current = (self.current - damage).max(0);
    }

    pub fn heal(&mut self, amount: i32) {
        self.current = (self.current + amount).min(self.max);
    }

    pub fn is_alive(&self) -> bool {
        self.current > 0
    }

    pub fn percentage(&self) -> f64 {
        self.current as f64 / self.max as f64 * 100.0
    }
}

// Player 通过组合 Position 和 Health 来"继承"它们的功能
#[derive(Debug)]
pub struct Player {
    pub name: String,
    pub position: Position,   // 组合 Position
    pub health: Health,       // 组合 Health
    pub level: u32,
    pub experience: u64,
}

impl Player {
    pub fn new(name: &str, x: f64, y: f64) -> Self {
        Player {
            name: name.to_string(),
            position: Position { x, y },
            health: Health::new(100),
            level: 1,
            experience: 0,
        }
    }

    pub fn move_to(&mut self, dx: f64, dy: f64) {
        self.position.move_by(dx, dy); // 委托给 Position
    }

    pub fn take_damage(&mut self, damage: i32) {
        self.health.take_damage(damage); // 委托给 Health
        if !self.health.is_alive() {
            println!("{} 已阵亡！", self.name);
        }
    }

    pub fn status(&self) -> String {
        format!(
            "{} Lv.{} | HP: {}/{} ({:.0}%) | 位置: ({:.1}, {:.1})",
            self.name, self.level,
            self.health.current, self.health.max,
            self.health.percentage(),
            self.position.x, self.position.y
        )
    }
}

// Enemy 也组合了 Position 和 Health，但有自己的字段和方法
#[derive(Debug)]
pub struct Enemy {
    pub kind: String,
    pub position: Position,
    pub health: Health,
    pub damage: i32,
}

impl Enemy {
    pub fn new(kind: &str, x: f64, y: f64, hp: i32, damage: i32) -> Self {
        Enemy {
            kind: kind.to_string(),
            position: Position { x, y },
            health: Health::new(hp),
            damage,
        }
    }

    pub fn attack(&self, player: &mut Player) {
        if self.health.is_alive() {
            println!("{} 攻击了 {}，造成 {} 点伤害！", self.kind, player.name, self.damage);
            player.take_damage(self.damage);
        }
    }

    pub fn is_in_range(&self, player: &Player, range: f64) -> bool {
        self.position.distance_to(&player.position) <= range
    }
}

fn main() {
    let mut player = Player::new("勇者", 0.0, 0.0);
    let mut enemy = Enemy::new("哥布林", 5.0, 0.0, 30, 15);

    println!("{}", player.status());

    player.move_to(3.0, 0.0); // 向敌人靠近
    println!("玩家移动后：{}", player.status());

    if enemy.is_in_range(&player, 3.0) {
        enemy.attack(&mut player);
    }
    println!("{}", player.status());

    enemy.attack(&mut player);
    println!("{}", player.status());
}
```

## enum + trait：开放/封闭结合

当图形类型需要"可扩展"（插件、第三方添加新类型），就用 `Box<dyn Trait>` 而不是 enum。当类型是固定且已知的，用 enum。两种方式经常配合使用：

```rust
// 外部可扩展的行为接口
pub trait Renderable {
    fn render(&self) -> String;
}

// 固定的节点类型（用 enum）
#[derive(Debug)]
pub enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    Text(String),
    Array(Vec<JsonValue>),
    Object(Vec<(String, JsonValue)>),
}

impl JsonValue {
    // 根据值的类型返回类型名
    pub fn type_name(&self) -> &'static str {
        match self {
            JsonValue::Null        => "null",
            JsonValue::Bool(_)     => "boolean",
            JsonValue::Number(_)   => "number",
            JsonValue::Text(_)     => "string",
            JsonValue::Array(_)    => "array",
            JsonValue::Object(_)   => "object",
        }
    }

    // 递归序列化为 JSON 字符串
    pub fn to_json(&self) -> String {
        match self {
            JsonValue::Null => "null".to_string(),
            JsonValue::Bool(b) => b.to_string(),
            JsonValue::Number(n) => {
                if n.fract() == 0.0 { format!("{}", *n as i64) }
                else { format!("{n}") }
            },
            JsonValue::Text(s) => format!("\"{}\"", s.replace('"', "\\\"")),
            JsonValue::Array(arr) => {
                let items: Vec<String> = arr.iter().map(|v| v.to_json()).collect();
                format!("[{}]", items.join(", "))
            },
            JsonValue::Object(pairs) => {
                let items: Vec<String> = pairs.iter()
                    .map(|(k, v)| format!("\"{k}\": {}", v.to_json()))
                    .collect();
                format!("{{{}}}", items.join(", "))
            },
        }
    }
}

fn main() {
    let data = JsonValue::Object(vec![
        ("name".to_string(), JsonValue::Text("Alice".to_string())),
        ("age".to_string(), JsonValue::Number(30.0)),
        ("active".to_string(), JsonValue::Bool(true)),
        ("scores".to_string(), JsonValue::Array(vec![
            JsonValue::Number(95.0),
            JsonValue::Number(87.0),
            JsonValue::Number(92.0),
        ])),
        ("address".to_string(), JsonValue::Null),
    ]);

    println!("{}", data.to_json());
    // {"name": "Alice", "age": 30, "active": true, "scores": [95, 87, 92], "address": null}
}
```

## 为 struct 实现标准 trait

Rust 标准库定义了许多常用 trait，为自定义类型实现它们，就能融入 Rust 的整个生态（比较、打印、迭代、排序等）：

```rust
use std::fmt;

#[derive(Clone)]  // 自动派生 Clone
pub struct Point {
    pub x: f64,
    pub y: f64,
}

// 实现 Display：用 {} 格式化时的输出
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// 实现 Debug：用 {:?} 格式化时的输出（通常用 #[derive(Debug)] 更简单）
impl fmt::Debug for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Point")
            .field("x", &self.x)
            .field("y", &self.y)
            .finish()
    }
}

// 实现 PartialEq：支持 == 和 != 运算符
impl PartialEq for Point {
    fn eq(&self, other: &Self) -> bool {
        (self.x - other.x).abs() < f64::EPSILON &&
        (self.y - other.y).abs() < f64::EPSILON
    }
}

// 实现加法运算符：支持 p1 + p2
impl std::ops::Add for Point {
    type Output = Point;
    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}

// 实现 From<(f64, f64)>：支持从元组直接转换
impl From<(f64, f64)> for Point {
    fn from((x, y): (f64, f64)) -> Self {
        Point { x, y }
    }
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2: Point = (3.0, 4.0).into(); // 使用 From/Into 转换

    println!("{p1}");               // (1, 2) - Display
    println!("{p1:?}");             // Point { x: 1.0, y: 2.0 } - Debug
    println!("{}", p1 == p1);       // true
    println!("{}", p1 == p2);       // false

    let p3 = p1.clone() + p2;       // Add 运算符
    println!("{p3}");               // (4, 6)

    // 可以放进集合、排序等
    let mut points = vec![
        Point { x: 3.0, y: 1.0 },
        Point { x: 1.0, y: 2.0 },
        Point { x: 2.0, y: 3.0 },
    ];
    // 按 x 坐标排序
    points.sort_by(|a, b| a.x.partial_cmp(&b.x).unwrap());
    for p in &points { print!("{p} "); }
    println!();
}
```

## 小结：Rust OOP 速查

| 传统 OOP 概念 | Rust 对应方案 |
| --- | --- |
| 类（class） | `struct` + `impl` 块 |
| 接口（interface） | `trait` |
| 多态（继承多态） | `trait` 对象（`Box<dyn Trait>`）或泛型 |
| 抽象类 | 有默认方法实现的 `trait` |
| 继承（代码复用） | 组合（在 struct 里嵌套其他 struct） |
| 枚举/联合类型 | `enum`（支持每个变体携带不同数据） |
| 访问控制 | `pub` / 私有（字段级别可控） |
| 构造函数 | `impl` 块里的 `new()` 关联函数（惯例） |
| 静态方法 | 关联函数（不带 `self` 参数的方法） |

Rust 的核心设计哲学之一是**组合优于继承**。当你发现自己想写继承时，想想：

1. 是否只需要共享行为？→ 用 `trait`
2. 是否需要共享数据/实现？→ 用组合（嵌套 struct）+ 委托方法
3. 是否是"一个值属于若干类型之一"的场景？→ 用 `enum` + `match`
