---
title: "通用语言教程-C++ 篇【8】面向对象-结构体与联合体"
date: 2024-10-05T17:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.jpg
banner: "images/banner.webp"
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

**从结构体开始，本C++系列教程正式进入高级应用（面向对象编程）。**

---

## 结构体

```cpp
// 结构体是一种把多个数据类型变量组合在一起的复合数据类型。
// 结构体是类（class）的简化版。
// 简单理解就是固定数据类型与格式的字典，严格来说更像一个规定好的【表格】。
// 结构体可以包含变量、常量、函数、数组、指针等。
// 结构体可以作为函数的参数和返回值。
// 结构体可以嵌套在其他结构体中。
// 每个成员有自己的内存空间。

#include <iostream>
#include <string>
using namespace std;

// 结构体定义最常见的形式如下：
struct Student { // struct + 结构体名
    int id;
    string name;
    int age;
    float score;
}; // 不要忘记分号

// c语言风格定义结构体：（仅做介绍，不要在c++中使用）
typedef struct CStudent {
    int id;
    string name;
};

// 方法1：定义结构体后再声明变量
struct Pid {
    int x; // 结构体中的成员变量
    int y;
};

Pid p1, p2; // 手动声明两个Pid结构体变量

// 方法2：声明变量时同时定义结构体
struct Pid1 {
    int x;
    int y;
} p11, p22; // 声明两个Point结构体变量

struct Date {
    int year;
    int month;
    int day;
};

// 结构体数组
struct Point {
    int x;
    int y;
};

// 包含数组的结构体
struct Classroom {
    int roomNumber;
    int seats;
    string equipment[3]; // 结构体中包含数组
};

// 嵌套结构体
struct Address {
    string city;
    string street;
    int zipCode;
};

struct Employee {
    int id;
    string name;
    Address addr; // 结构体嵌套
    double salary;
};

// 函数声明
void printDate(Date d);
void printStudentInfo(Student s);
void printPoints(Point points[], int size);
void printEmployee(Employee emp);

int main() {

    struct Pid pid1; // 声明一个Pid结构体变量pid1，struct关键字为c语言写法
    Pid pid2; // c++中推荐的声明方式
    
    // 逐个初始化成员变量
    pid1.x = 10;
    pid1.y = 20;
    p1.x = 100;
    p1.y = 200;
    
    // 使用初始化列表（推荐使用）
    Pid pid3 = {10000, 20000};
    Student S1 = {1001, "张三", 20, 90.5}; // 带=号的初始化
    Student S2 {1002, "李四", 19, 85.5}; // C++11标准写法（不需要=号）
    
    // 使用.访问成员变量
    cout << "pid3: (" << pid3.x << ", " << pid3.y << ")" << endl;
    cout << "学生信息: " << S1.id << " " << S1.name << " " << S1.age << " " << S1.score << endl;
    
    // 结构体数组的使用
    Point points[3] = {
        {1, 2},
        {3, 4},
        {5, 6}
    };
    
    cout << "\n结构体数组" << endl;
    for(int i = 0; i < 3; i++) {
        cout << "点" << i+1 << ": (" << points[i].x << ", " << points[i].y << ")" << endl;
    }
    
    // 包含数组的结构体
    Classroom room101 = {101, 30, {"投影仪", "电脑", "白板"}};
    cout << "\n教室信息" << endl;
    cout << "教室号: " << room101.roomNumber << ", 座位数: " << room101.seats << endl;
    cout << "设备: ";
    for(int i = 0; i < 3; i++) {
        cout << room101.equipment[i] << " ";
    }
    cout << endl;
    
    // 嵌套结构体
    Employee emp1 = {
        1001,
        "王五",
        {"北京", "中关村大街", 100080}, // 嵌套结构体的初始化
        8000.0
    };
    
    cout << "\n员工信息" << endl;
    cout << "ID: " << emp1.id << ", 姓名: " << emp1.name << endl;
    cout << "地址: " << emp1.addr.city << emp1.addr.street << ", 邮编: " << emp1.addr.zipCode << endl;
    cout << "工资: " << emp1.salary << endl;
    
    // 结构体与函数
    Date d1 = {2025, 10, 1};
    cout << "\n结构体作为函数参数" << endl;
    printDate(d1);
    printStudentInfo(S1);
    
    // 结构体赋值（值拷贝）
    Student S3 = S1; // 会复制所有成员变量的值
    S3.id = 1003;
    S3.name = "赵六";
    cout << "\n结构体赋值" << endl;
    cout << "S1的姓名: " << S1.name << endl; // 还是"张三"
    cout << "S3的姓名: " << S3.name << endl; // 变为"赵六"
    
    // 结构体数组作为函数参数
    cout << "\n结构体数组函数" << endl;
    printPoints(points, 3);
    
    // 嵌套结构体作为函数参数
    cout << "\n嵌套结构体函数" << endl;
    printEmployee(emp1);
    
    return 0;
}

// 函数定义
void printDate(Date d) {
    cout << d.year << "-" << d.month << "-" << d.day << endl;
}

void printStudentInfo(Student s) {
    cout << "学号: " << s.id << ", 姓名: " << s.name 
         << ", 年龄: " << s.age << ", 成绩: " << s.score << endl;
}

void printPoints(Point points[], int size) {
    for(int i = 0; i < size; i++) {
        cout << "点" << i+1 << ": (" << points[i].x << ", " << points[i].y << ")" << endl;
    }
}

void printEmployee(Employee emp) {
    cout << "员工ID: " << emp.id << endl;
    cout << "姓名: " << emp.name << endl;
    cout << "城市: " << emp.addr.city << endl;
    cout << "街道: " << emp.addr.street << endl;
    cout << "邮编: " << emp.addr.zipCode << endl;
    cout << "工资: " << emp.salary << endl;
}
```

## 联合体

```cpp
// 与结构体不同的是，联合体所有成员共享同一块内存空间，某些情况下可以优化性能
// 联合体不常用。

#include <iostream>
using namespace std;

// 联合体的定义
// 联合体的大小等于其最大成员的大小（本例中为4字节，因为int和float都是4字节）
union SimpleUnion {
    int number;    // 4字节整数
    char letter;   // 1字节字符
    float decimal; // 4字节浮点数
};

int main() {
    SimpleUnion u; // 声明一个联合体变量，分配4字节内存
    
    // 内存共享特性
    u.number = 65;  // 将65存入联合体（ASCII码的'A'）
    // 此时4字节内存中存储的是整数65的二进制表示
    cout << "整数: " << u.number << endl;    // 正确解释为整数65
    
    // letter和number共享同一内存
    // 读取letter时，会从同一内存地址读取，但只取第一个字节
    // 65的二进制表示中，第一个字节正好对应ASCII字符'A'
    cout << "字符: " << u.letter << endl;    // 输出'A'  同一内存的不同解释
    
    // 类型安全风险
    u.decimal = 3.14; // 存入浮点数3.14
    // 这会覆盖之前存储的整数65
    // 浮点数3.14在内存中的二进制表示与整数65完全不同
    cout << "浮点数: " << u.decimal << endl;  // 正确输出3.14
    
    // 危险操作：将浮点数的内存表示错误解释为整数
    // 浮点数3.14的二进制表示被当作整数解释，得到无意义的值
    // 这体现了联合体的类型不安全特性
    cout << "错误解释: " << u.number << endl;
    
    return 0;
}
```