---
title: "通用语言教程-C++ 篇【2】基础数据类型"
date: 2024-10-05T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.jpg
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 基础数据类型

```cpp
#include <cstdint> //导入头文件以使用int16_t, int32_t, int64_t等别名
#include <iostream>
#include <string> //使用string类型
using namespace std;

typedef long long int64;
typedef string str;

int main() {
    char c1 = 'A'; //字符A，本质上是存储的是整数65
    char c2 = 65; //ASCII码65
    char c3 = 0b1000001; //二进制65
    char c4 = 0x41; //十六进制65

    char c5[100] = "Hello Sekai!"; //char字符数组
    str s1 = "Hello Sekai!"; //string字符串
    //二者都可以通过for循环遍历，也可以使用下标访问、修改元素
    c5[0] = 'h'; //修改字符数组第一个字符为h
    s1[0] = 'h'; //修改字符串第一个字符为h
    cout << c5[0] << c5[1] << c5[2] << endl; //输出字符数组的第一个三个字符
    cout << s1[0] << s1[1] << s1[2] << endl; //输出字符串的第一个三个字符

    short s = 10;
    int i = 10;
    long long ll = 1e18;

    //别名
    int16_t i16 = 1; //short
    int32_t i32 = 1; //int
    int64_t i64 = 1; //long long long

    float f = 10.5; //单精度浮点数
    double d = 10.5; //双精度浮点数

    long double ld = 10.5; //长双精度浮点数，比double精度高，但是不常用，一般double足够用

    cout << c1 << endl;
    cout << static_cast<char>(c2) << endl; //强制类型转换为char类型，转换65为字符A
    cout << static_cast<char>(c3) << endl; //强制类型转换为char类型，转换二进制数表达的65为字符A
    cout << static_cast<char>(c4) << endl; //强制类型转换为char类型，转换十六进制数表达的65为字符A

    cout << s << endl;
    cout << i << endl;
    cout << ll << endl;
    cout << i16 << endl;
    cout << i32 << endl;
    cout << i64 << endl;
    cout << f << endl;
    cout << d << endl;
    
    cout << 1ll * i << endl; //使用1ll转换为long long类型
    cout << (long long)s << endl; //强制类型转换为long long类型
    cout << (int)ll << endl; //强制类型转换为int类型
    cout << (short)i << endl; //强制类型转换为short类型
    cout << (double)f << endl; //强制类型转换为double类型
    cout << (float)d << endl; //强制类型转换为float类型
    return 0;
}
```