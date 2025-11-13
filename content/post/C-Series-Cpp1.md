---
title: "通用语言教程-C++ 篇【1】程序结构与基础语法"
date: 2025-11-05T11:00:00+08:00
timezone: UTC+8
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 程序结构与基础语法

由于曾经进行过教学，之后的C++系列直接附上课件。

```cpp
#include <iostream>//导入头文件，iostream全名为input&output stream(输入输出流)
#include <cstdio>//导入头文件，cstdio全名为c standard input/output(C标准输入输出)
using namespace std;//命名空间，本质是一个全局性的作用域操作。
//std命名空间内封装了iostream、cstdio等常用头文件
//在算法竞赛中，使用using namespace std可以省去很多不必要的语法，提高效率；但是在生产实践中，尽量不要使用using namespace std，因为会污染全局命名空间，造成命名冲突。

//这是一条注释

int j=0;//定义变量(作用域为全局)

//什么是作用域?
int global_var=0;//这是全局变量的定义，作用域为全局

//这是一个函数
void temp() {
    int r=10;//定义在函数内部的局部变量，作用域为函数内部，外部无法访问
}

//为什么说命名空间是一个全局性的作用域操作?
//因为命名空间的声明和定义都在全局，因此可以被其他作用域、文件引用。
//命名空间的声明：using namespace 命名空间名;
//命名空间的定义：namespace 命名空间名 {}
namespace my_namespace {
    int x=10;//定义在命名空间内部的变量，作用域为命名空间内部，外部无法访问，但是通过可以通过标识my_namespace::访问
}

int main() {
    //入口函数，告诉计算机程序开始的地方，不可省略
    cin >> global_var;//c++风格的输入，读取全局变量global_var的值
    cout << "Hello Sekai!" << endl;//输出到控制台，endl表示换行，每个语句后面都要加上分号，表示终止符，目的是告诉计算机一条语句结束了。
    scanf("%d)", &global_var);//c风格的输入，读取全局变量global_var的值
    printf("%d\n", global_var);//c风格的输出，输出全局变量global_var的值
    /*
        对于c风格(c语言)的输入输出，需要使用cstdio头文件(c语言中为stdio.h)，同时scanf和printf函数的第一个参数是格式字符串，
        scanf函数的第二个参数是地址运算符&+变量名，用于获得变量的地址，然后使用将输入的值赋值给变量。
        对于字符串（字符数组），不需要&，直接使用变量名即可。
        printf不需要地址运算符，直接输出变量的值。
        口诀：输入要址，输出要值。
    */
    cout << r << endl;//错误，r是局部变量，不能在全局使用
    cout << x << endl;//错误，x是my_namespace命名空间内部的变量，不能在全局使用
    cout << my_namespace::x << endl;//正确，通过命名空间访问变量

    cout << "Hello Sekai!" << endl; //C++对缩进格式没有严格要求，如果你愿意，甚至可以全部写进一行，像这样↓
    for (int i = 1; i <= 10; i++) { cout << i; } cout << endl; while (j == 0) { j += 1;cout << j;}

    //同样的，for循环内部定义的变量i，作用域为for循环内部，外部无法访问。
    cout << i << endl; //错误，i是局部变量，不能在全局使用

    return 0; //任何c++程序都需要有一个返回值，0表示程序正常结束
    //注意，实际编写程序时如果省略return 0，编译器在编译时，会自动添加一个默认的return 0在内部，因此不会报错，但不建议不写return 0，请养成良好的编程习惯。
}
```