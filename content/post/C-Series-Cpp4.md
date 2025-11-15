---
title: "通用语言教程-C++ 篇【4】分支结构、循环结构"
date: 2024-10-05T14:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.jpg
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 分支结构

```cpp
#include <iostream>
using namespace std;

int main() {
    int a = 10;
    int b = 20;
    int c;

    // if-else 语句
    if (a > b) {
        c = a + b;
    } else {
        c = a - b;
    }

    // else if 语句
    if (a == b) {
        c = a * b;
    } else if (a < b) {
        c = a / b;
    } else {
        c = a % b;
    }

    // switch 语句
    switch (a) {
        case 10:
            c = a + b;
            break;
        case 20:
            c = a - b;
            break;
        default:
            c = a * b;
            break;
    }
    // switch 语句的穿透性，可以匹配多个 case
    switch (a) {
        case 10:
        case 20:
            c = a + b;
            break;
        default:
            c = a * b;
            break;
    }

    return 0;
}
```

## 循环结构

```cpp
#include <iostream>
using namespace std;

int main() {
    int i = 0;
    int sum = 0;

    // while 循环
    while (i < 10) {
        sum += i;
        i++;
    }

    // do-while 循环
    i = 0;
    do {
        sum += i;
        i++;
    } while (i < 10);

    // for 循环
    for (int j = 0; j < 10; j++) {
        sum += j;
    }

    sum = 0;
    // for-each 循环
    int arr[] = {1, 2, 3, 4, 5};
    for (int num : arr) { // 遍历数组 arr
        sum += num; // 累加结果为 15
    }

    return 0;
}
```
