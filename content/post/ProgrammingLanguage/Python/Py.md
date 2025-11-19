---
title: "通用语言教程-Python 篇【番外】算法竞赛常用库和方法函数"
date: 2022-06-07T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/python.png
tags: ["Python","基础语法","算法竞赛"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

# 算法竞赛常用库和方法函数

**Python提供了非常多的内置方法，可以非常容易的实现一些别的语言需要造轮子的功能，本文将介绍一些竞赛中提升效率的常用库和方法函数，让竞赛可以专注于算法实现而非底层代码。**

## 数学与数据处理

### 排序算法替代

Python的内置函数sorted()和list.sort()方法进行排序。

```python
# sorted()和list.sort()方法（原地排序）
# 二者使用最先进的TimSort算法，无需担忧性能
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(sorted(lst))  # [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
lst.sort()
print(lst)  # [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]

# 二者都有reverse参数，可以反转排序结果
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(sorted(lst, reverse=True))  # [9, 6, 5, 5, 5, 4, 3, 3, 2, 1, 1]
lst.sort(reverse=True)
print(lst)  # [9, 6, 5, 5, 5, 4, 3, 3, 2, 1, 1]

# 二者都有key参数，可以指定排序依据（key为函数，根据对每个元素进行函数处理的得到的返回值进行排序）
lst = [('Bob', 75), ('Alice', 92), ('Charlie', 67), ('David', 88)]
print(sorted(lst, key=lambda x: x[1]))  # [('Charlie', 67), ('Bob', 75), ('David', 88), ('Alice', 92)]
lst.sort(key=lambda x: x[1])
print(lst)  # [('Charlie', 67), ('Bob', 75), ('David', 88), ('Alice', 92)]
```

### 最大最小值遍历替代

Python的内置函数max()和min()方法可以找到序列中的最大值和最小值。

```python
# max()和min()方法
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(max(lst))  # 9
print(min(lst))  # 1

# 二者都有default参数，可以指定序列为空时的默认值
lst = []
print(max(lst, default=0))  # 0
print(min(lst, default=0))  # 0

# 二者都有key参数，可以指定比较依据（key为函数，根据对每个元素进行函数处理的得到的返回值进行比较）
lst = [('Bob', 75), ('Alice', 92), ('Charlie', 67), ('David', 88)]
print(max(lst, key=lambda x: x[1]))  # ('Alice', 92)
print(min(lst, key=lambda x: x[1]))  # ('Charlie', 67)
```

### 统计函数替代

Python的内置函数sum()和len()方法可以对序列进行求和和长度统计。

```python
# sum()和len()方法
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(sum(lst))  # 44
print(len(lst))  # 11

# 二者都有start参数，可以指定起始值（全部相加后再加上start）
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(sum(lst, start=10))  # 54
print(len(lst))  # 11
```

## 数据结构操作

### 替代栈、队列与链表

```python
from collections import deque # 双端队列库

# 栈&队列&链表替代
# 双端队列可以完全模拟栈与队列的行为
# 双端队列还可以模拟部分链表行为
stack_queue = deque([1, 2, 3, 4, 5])

stack_queue.append(6)  # 入栈
item = stack_queue.pop()  # 出栈

stack_queue.appendleft(0)  # 左端入队
item = stack_queue.pop()  # 右端出队
```

### 替代哈希表与计数器

```python
from collections import defaultdict, Counter

# 哈希表&计数器替代
# 字典数据类型本身就是一个哈希表实现
# 使用defaultdict可以自动初始化值
hash_counter = defaultdict(int)
words = ['apple', 'banana', 'apple', 'orange', 'banana', 'pear']
for word in words:
    hash_counter[word] += 1
print(dict(hash_counter)) # {'apple': 2, 'banana': 2, 'orange': 1, 'pear': 1}

# 专业频率统计函数Counter()
word_counts = Counter(words)
print(dict(wordword_counts)) # {'apple': 2, 'banana': 2, 'orange': 1, 'pear': 1}
```

### 堆与优先队列的实现

```python
import heapq # 堆方法库

# 堆&优先队列替代
# 通过heapq实现最小二叉堆

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 2)
heapq.heappush(heap, 8)
# [2, 5, 8]
'''
  2
 / \
5   8
'''
smallest = heapq.heappop(heap)  # 弹出最小元素2

# 实现最大堆（使用负数）
heap = []
heapq.heappush(heap, -5)
heapq.heappush(heap, -2)
heapq.heappush(heap, -8)
# [-8, -5, -2]
'''
  -8
  / \
-5  -2
'''
largest = -heapq.heappop(heap)  # 弹出最大元素8

# 堆化数组
list_heap = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
heapq.heapify(list_heap) # 原地转为堆
print(list_heap)  # [1, 1, 2, 3, 3, 9, 4, 6, 5, 5, 5]
```

## 搜索与查找算法

### 二分查找

```python
import bisect # 二分查找库

# 注意，二分查找的大前提是序列有序，这个库也一样

lst = [1, 3, 5, 7, 9]
pos = bisect.bisect_left(lst, 5)  # 2 返回第一个>=5的索引
pos = bisect.bisect_right(lst, 5)  # 3 返回第一个>5的索引
pos = bisect(lst, 5)  # 3 bisect()本身默认为bisect_right() 

# 如果想要二分查找某个指定的元素是否存在（返回True或False）
def binary_search(lst, target):
    index = bisect.bisect_left(lst, target)
    return index < len(lst) and lst[index] == target

# 返回索引
def binary_search_index(lst, target):
    index = bisect.bisect_left(lst, target)
    return index if index < len(lst) and lst[index] == target else -1
```

### 线性搜索

```python
# 通常使用for循环实现线性搜索
# 但是Python中可以直接进行成员检查，使用in关键字
lst = [1, 3, 5, 7, 9]
print(5 in lst)  # True

# in的内部实现就是线性搜索

# 查找索引
try:
    index = lst.index(5)
    print(index)  # 2
except ValueError:
    print("元素不存在")
```

## 排列与组合算法

### 排列

```python
import itertools # 排列组合库

# 排列
lst = [1, 2, 3]
for perm in permutations(lst, 2): #两个元素的所有排列 有顺序不同的重复
    print(perm) # (1, 2) (1, 3) (2, 1) (2, 3) (3, 1) (3, 2)
for perm in conbinations(lst, 2): #两个元素的所有组合 无顺序不同的重复
    print(perm) # (1, 2) (1, 3) (2, 3)
for prod in product([1, 2], ['a', 'b']): # 笛卡尔积
    print(prod) # (1, 'a') (1, 'b') (2, 'a') (2, 'b')
```


