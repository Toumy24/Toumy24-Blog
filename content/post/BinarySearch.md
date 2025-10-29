---
title: "二分查找的原理及实现"
date: 2025-10-29
tags: ["算法","二分查找"]
categories: ["算法"]
draft: false
math: true
---

## 二分查找

二分查找（Binary Search）是一种在数组中查找某一特定元素的搜索算法。它属于一种折半搜索算法，每次查找都通过折半的方式缩小查找范围，直到找到目标元素或确定查找范围为空。它与数学上的二分法思想类似。

### 算法步骤

>核心思想：折半查找，找不到就继续折半。

**大前提**：数组必须是**有序的**，无序数组需要先排序。

1. 设置两个指针，$low$ 和 $high$，分别指向数组的第一个元素和最后一个元素。
2. 计算中间位置 $mid = (low + high) / 2$ ，并判断目标元素是否在该位置上。
3. 如果目标元素等于数组中元素的值，则查找成功，返回该元素的下标；否则，根据目标元素与中间元素的大小关系，移动指针 $low$ 或 $high$ ，并重复步骤2。
4. 直到 $low$ 和 $high$ 相遇（$low > high$），查找失败，返回-1。

根据这些步骤，很容易写出二分查找的代码。

```c++
int binarySearch(int *arr, int l, int r, int key) {
    int res = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2; //与(l+r)/2等价，但是防止溢出
        if (arr[mid] == key) {
            res = mid;
            break;
        } else if (arr[mid] < key)
            l = mid + 1;
        else {
            r = mid - 1;
        }
    }
    return res;
}
```