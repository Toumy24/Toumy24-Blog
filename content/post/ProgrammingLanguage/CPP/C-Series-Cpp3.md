---
title: "通用语言教程-C++ 篇【3】基础运算符与高级输出"
date: 2024-10-05T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.png
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 基础运算符与高级输出

```c++
#include <iostream>
#include <iomanip> //导入输出格式控制头文件
using namespace std;

int main() {
    // 基础运算符
    // 算术运算符
    int a = 10, b = 5;
    cout << a + b << endl; // 加法
    cout << a - b << endl; // 减法
    cout << a * b << endl; // 乘法
    cout << a / b << endl; // 除法
    cout << a % b << endl; // 取余

    cout << a++; // 先输出a，然后加1
    cout << ++a << endl; // 先加1，然后输出a
    cout << a-- << endl; // 先输出a，然后减1
    cout << --a << endl; // 先减1，然后输出a

    // 赋值运算符
    cout << a = b << endl; // 赋值运算符
    cout << a += b << endl; // 加法赋值运算符
    cout << a -= b << endl; // 减法赋值运算符
    cout << a *= b << endl; // 乘法赋值运算符
    cout << a /= b << endl; // 除法赋值运算符
    cout << a %= b << endl; // 取余赋值运算符

    // 关系运算符
    cout << a == b << endl; // 等于
    cout << a != b << endl; // 不等于
    cout << a > b << endl; // 大于
    cout << a < b << endl; // 小于
    cout << a >= b << endl; // 大于等于
    cout << a <= b << endl; // 小于等于

    // 逻辑运算符
    int c = 1, d = 0;
    cout << c && d << endl; // 逻辑与运算符（两个为真时输出真） 输出0
    cout << c || d << endl; // 逻辑或运算符（其中一个为真时输出真） 输出1
    cout << !c << endl; // 逻辑非运算符（反转当前布尔值） 输出0

    // 位运算符
    int e = 3, f = 4; // 假设e=3(011)，f=4(100)
    cout << e & f << endl; // 按位与运算符（转换为二进制数后从右边开始，两个位都为1时输出1） 输出0
    cout << e | f << endl; // 按位或运算符（转换为二进制数后从右边开始，两个位有一个为1时输出1） 输出1
    cout << e ^ f << endl; // 按位异或运算符（转换为二进制数后从右边开始，两个位不同时输出1，相同时输出0） 输出1
    cout << ~e << endl; // 按位取反运算符（转换为二进制数后从右边开始，每个位取反，即1变0，0变1） 输出4(100)
    cout << (e << 1) << endl; // 左移运算符（将e的二进制数向左移动一位，最低位补0，即乘2，相当于乘以2的幂） 输出6(110)
    cout << (e >> 1) << endl; // 右移运算符（将e的二进制数向右移动一位，最高位补0或符号，即除2，相当于除以2的幂，结果向下取整） 输出1(001)

    // 三元运算符
    int g = 10, h = 20;
    cout << (g > h ? g : h) << endl; // 当?前的表达式为真时，输出:前的表达式，否则输出:后的表达式 输出20


    int num = 10;
    cout << showbase << uppercase; // 设置显示进制前缀和大写字母
    cout << "八进制: " << oct << num << endl;
    cout << "十进制: " << dec << num << endl;
    cout << "十六进制: " << hex << num << endl;
    // 二进制特殊情况未直接支持，此处省略
    cout << "使用setbase 8: " << setbase(8) << num << endl;
    cout << "使用setbase 10: " << setbase(10) << num << endl;
    cout << "使用setbase 16: " << setbase(16) << num << endl;
    cout << noshowbase << nouppercase; // 关闭进制前缀和大写字母

    long long ll = 3141592653589793;
    double f = 3.14159265358979323846;
    cout << f << endl; // cout默认输出6位有效数字(浮点数)
    cout << (double)ll << endl; // 依然输出6位有效数字，但由于过大，自动使用科学计数法
    cout << fixed; // fixed单独使用时，输出固定小数点后6位(浮点数)
    cout << f << endl;
    cout << setprecision(10); // setprecision()在fixed模式中设置，保留小数点后位数
    cout << f << endl;
    cout << scientific; // 科学计数法
    cout << ll << " " << f << endl; // 整数不能使用scientific，无变化
    cout << (double)ll << endl;
    // 综合应用
    cout << fixed << setprecision(2) << f << endl; // 圆周率保留2位小数
    cout << fixed << setprecision(4) << scientific << (double)ll << endl; // 大圆周率整数保留4位小数，然后科学计数法输出
    // 流操作算子是永久的，除非进行显式重置，否则之后的输出仍然有效
    cout << defaultfloat; // 恢复默认浮点数输出格式
    cout << setprecision(6); // setprecision()在默认模式中设置，保留总有效数字位数
    cout << f << endl;
    cout << (double)ll << endl;
    return 0;
}
```