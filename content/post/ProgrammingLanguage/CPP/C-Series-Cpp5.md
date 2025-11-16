---
title: "通用语言教程-C++ 篇【5】数组"
date: 2024-10-05T15:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.png
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 数组

```cpp
#include <iostream>
#include <cstdio>
using namespace std;

using ll = long long; //为long long设置别名ll
//同typedef long long ll;

int main() {
    char str[100];//字符数组（末尾加空字符'\0'可作为原生字符串使用）
    bool flag[100];//布尔数组（只储存0或1，即false或true）
    int arr[100];//整型数组
    ll larr[100];//长整型数组（同理，其他整型数组也可这样定义）
    float farr[100];//浮点型数组
    double darr[100];//双精度浮点型数组

    str[0] = 'a';//通过下标（索引）修改字符数组
    flag[0] = true;//通过下标修改布尔数组
    arr[0] = 10;//通过下标修改整型数组
    larr[0] = 1e18;//通过下标修改长整型数组
    farr[0] = 3.14f;//通过下标修改浮点型数组（3.14f表示3.14的浮点型形式，同1ll的写法）
    darr[0] = 1.123e18l;//通过下标修改双精度浮点型数组（1.123e18l表示1.123e18的长双精度浮点型形式）

    int arr_2[10][10] = {};//二维数组，全部元素初始化为0，同样可以推广到三维及以上的数组
    //如果初始化不填任何数，则默认全部元素初始化为0，该方法可以快速初始化一个不方便指定元素值的数组，之后便于修改与操作，算法中常用。

    int arr_init[5][5] = {
        {1, 2, 3, 4, 5},
        {6, 7, 8, 9, 10},
        {11, 12, 13, 14, 15},
        {16, 17, 18, 19, 20},
        {21, 22, 23, 24, 25}
    };//二维数组的非零数字初始化方法，数字下标同线性代数中矩阵元素的坐标，但是从0开始。


    //常用：输出二维数组的全部元素（该数组为10x10的零矩阵）
    for (int i = 0; i < 10; i++) {
        for (int j = 0; j < 10; j++) {
            cout << arr_2[i][j] << "  ";
        }
        cout << endl;
    }

    cout << endl;

    //输出二维数组的全部元素（该数组为5x5的矩阵）
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            cout << arr_init[i][j] << "  ";
        }
        cout << endl;
    }


    //矩阵的转置

    //不修改原数组：
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            cout << arr_init[j][i] << "  ";
        }
        cout << endl;
    }
    //修改原数组：
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            arr_init[i][j] = arr_init[j][i];
        }
    }

    //矩阵的乘法
    int res[5][5] = {};
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            for (int k = 0; k < 5; k++) {
                res[i][j] += arr_init[i][k] * arr_init[k][j];
            }
        }
    }

    return 0;
}
```