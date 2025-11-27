---
title: "通用语言教程-C++ 篇【7】指针与引用"
date: 2024-10-05T16:30:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.png
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 指针

```c++
#include <iostream>
using namespace std;

int main() {
    // 什么是指针：指针是存储内存地址的变量
    // *：取值操作符（指针，又称解引用操作符）
    // &：取地址操作符，又称引用，引用是指针的语法糖
    int number = 42;        // 普通整型变量
    int* pointer = &number; // 指针变量，存储number的地址
    // 步骤：number获得一块内存地址，这块内存地址对应的值为42，然后定义一个int类型的指针int*，指针变量pointer获得一块新的内存地址，这块内存地址的值为number的内存地址。
    
    
    cout << "number的值: " << number << endl;
    cout << "number的地址: " << &number << endl;
    cout << "pointer存储的地址: " << pointer << endl;
    cout << "通过pointer访问的值: " << *pointer << endl; 
    // *pointer这一步叫做解引用指针变量。这是什么意思呢？首先要理解一个核心概念：取值操作符（指针）会把指针变量的值（内存地址）解析为对应的值，这个过程就是解引用。
    // 所以输出*pointer实际是number的内存地址对应的值：42。
    // 下面再演示一个解引用的操作
    *pointer = 100; // 通过指针修改变量的值
    cout << "修改后number的值: " << number << endl;
    
    // 指针的声明和初始化方式
    int value = 50;
    int* ptr1 = &value;     // 声明时初始化
    int* ptr2 = nullptr;    // 初始化为空指针（C++11推荐）
    int* ptr3;              // 未初始化的指针（危险，不要直接使用）
    
    // 空指针的使用和检查
    if(ptr2 == nullptr) {
        cout << "ptr2是空指针" << endl;
    }
    
    // 指针与数组的关系
    int numbers[5] = {10, 20, 30, 40, 50};
    int* arrPtr = numbers;  // 数组名的值就是首元素地址，一般情况下会退化为指向首元素的指针，所以直接对数组名解引用（*number）也是合法的。
    
    cout << "数组第一个元素: " << *arrPtr << endl;
    cout << "数组第二个元素: " << *(arrPtr + 1) << endl; // 指针算术，单独讲解
    
    // 使用指针遍历数组
    cout << "数组所有元素: ";
    for(int i = 0; i < 5; i++) {
        cout << *(arrPtr + i) << " "; // 还记得上面说数组名就是首元素的地址吗，首元素地址进行指针算术+i后解引用等价于numbers[i]
    }
    cout << endl;
    
    // 指针作为函数参数（实现修改外部变量）
    int a = 5, b = 10;
    cout << "交换前: a=" << a << ", b=" << b << endl;
    
    // 交换函数需要指针参数
    void swap(int* x, int* y); // 函数声明
    swap(&a, &b); // 传递变量的地址
    
    cout << "交换后: a=" << a << ", b=" << b << endl;
    
    // 动态内存分配：为什么需要new和delete
    // 问题：编译时不知道需要多少内存怎么办
    int size;
    cout << "请输入数组大小: ";
    cin >> size;
    
    // 传统数组的局限性：大小必须编译时确定
    // int staticArray[size]; // 错误，C++不支持变长数组
    
    // 解决方案：使用new动态分配内存
    int* dynamicArray = new int[size]; // 运行时决定大小
    
    // 初始化动态数组
    for(int i = 0; i < size; i++) {
        dynamicArray[i] = i * 10;
    }
    
    cout << "动态数组内容: ";
    for(int i = 0; i < size; i++) {
        cout << dynamicArray[i] << " ";
    }
    cout << endl;
    
    // new和delete的详细用法
    // 动态分配单个变量
    int* singleValue = new int(25); // 分配并初始化为25
    cout << "动态分配的整数: " << *singleValue << endl;
    
    // 动态分配数组
    double* doubleArray = new double[10]; // 分配10个double的数组
    
    // 必须使用delete释放内存
    delete singleValue;    // 释放单个变量
    delete[] dynamicArray; // 释放数组（必须用delete[]）
    delete[] doubleArray;  // 释放double数组
    
    // 动态内存的常见错误
    // 内存泄漏：忘记delete
    int* leaked = new int(100);
    // 忘记delete leaked; // 内存泄漏
    delete leaked; // 正确：记得释放
    
    // 重复释放
    int* ptr = new int(50);
    delete ptr;
    // delete ptr; // 错误，重复释放会导致程序崩溃
    
    // 使用已释放的内存
    int* freed = new int(75);
    delete freed;
    // *freed = 100; // 危险，使用已释放的内存
    
    // 数组释放错误
    int* array = new int[5];
    // delete array;  // 错误，应该用delete[]
    delete[] array;   // 正确
    
    // 动态内存的实际应用：学生成绩管理系统
    int studentCount;
    cout << "请输入学生人数: ";
    cin >> studentCount;
    
    // 动态分配成绩数组
    double* scores = new double[studentCount];
    
    // 输入成绩
    for(int i = 0; i < studentCount; i++) {
        cout << "请输入第" << i+1 << "个学生的成绩: ";
        cin >> scores[i];
    }
    
    // 计算平均分
    double sum = 0;
    for(int i = 0; i < studentCount; i++) {
        sum += scores[i];
    }
    double average = sum / studentCount;
    
    cout << "平均分: " << average << endl;
    
    // 释放内存
    delete[] scores;
    
    // 动态内存的优势：运行时决定内存大小，生命周期由程序员控制，可以创建大型数据结构
    
    // 动态内存的注意事项
    // 必须配对使用new和delete
    // 数组使用new[]和delete[]
    // 释放后指针置为nullptr
    int* example = new int(999);
    delete example;
    example = nullptr; // 好习惯：释放后置空
    
    return 0;
}

// 交换函数的实现
void swap(int* x, int* y) {
    int temp = *x;
    *x = *y;
    *y = temp;
}
```

### 指针算术

```c++
#include <iostream>
using namespace std;

int main() {
    int arr[3] = {10, 20, 30};
    int* ptr = arr;  // ptr指向数组首元素
    
    // 指针算术的公式：
    // ptr + n = ptr + n × sizeof(T)
    // 其中T是指针指向的类型，sizeof()是指针指向类型的大小（字节数）
    
    cout << "初始地址: " << ptr << endl;
    cout << "ptr + 1 = " << ptr + 1 << " (移动" << sizeof(int) << "字节)" << endl;
    cout << "ptr + 2 = " << ptr + 2 << " (移动" << 2 * sizeof(int) << "字节)" << endl;
    
    return 0;
}
```

设，初始指针地址：0x1000，指向int类型变量，sizeof(int) = 4字节。
- 首元素地址：ptr + 0 = 0x1000 + 0 × 4 = 0x1000
- 第二元素地址：ptr + 1 = 0x1000 + 1 × 4 = 0x1004
- 第三元素地址：ptr + 2 = 0x1000 + 2 × 4 = 0x1008
- 第四元素地址：ptr + 3 = 0x1000 + 3 × 4 = 0x100C
- 第n+1个（索引从0开始）元素地址：ptr + n = 0x1000 + n × 4 

## 引用

引用变量可以看作已存在变量的一个别名，可以通过引用变量直接操作原变量的值，可以避免拷贝带来的开销。

```c++
#include <iostream>
using namespace std;

void swap(int& x, int& y) { // 形参为引用变量（即，形参是实参的别名），因此直接修改实参本身的值
    int temp = x;
    x = y;
    y = temp;
}

int main() {
    int a = 10, b = 20;
    int& ref = a; // 声明引用变量ref，并初始化为a的引用
    
    cout << "a = " << a << endl; // 10
    cout << "b = " << b << endl; // 20
    cout << "ref = " << ref << endl; // 10
    
    ref = 30; // 直接修改a的值
    
    cout << "a = " << a << endl; // 30
    cout << "b = " << b << endl; // 20
    cout << "ref = " << ref << endl; // 30
    
    swap(a, b); // 调用函数交换a和b的值

    cout << "a = " << a << endl; // 20
    cout << "b = " << b << endl; // 30
    cout << "ref = " << ref << endl; // 20

    return 0;
}
```

