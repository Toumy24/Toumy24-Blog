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

### 反转替代

```python
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
lst.reverse()
print(lst)  # [5, 3, 5, 6, 2, 9, 5, 1, 4, 1, 3]
# 也可以使用切片来反转
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(lst[::-1])  # [5, 3, 5, 6, 2, 9, 5, 1, 4, 1, 3] （不会改变原列表）
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

**对于低数据量，线性搜索和二分查找的效率差不多，但是对于大数据量（1w以上），二分查找的效率更高，优势开始显现。**

## 排列与组合算法

### 排列组合

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

### 迭代器

```python
from itertools import groupby, chain, cycle, islice

# groupby 分组连续相同的元素
# 注意：groupby只对连续相同的元素进行分组，非连续的相同元素会分到不同的组
data = "AAABBBCCAAA"
for key, group in groupby(data):
    print(f"{key}: {list(group)}")
# 分组结果：
# A: ['A', 'A', 'A']
# B: ['B', 'B', 'B']
# C: ['C', 'C']
# A: ['A', 'A', 'A']

# groupby配合自定义key函数
# 可以按照元素的某个属性进行分组，比如字符串长度
words = ["apple", "banana", "cherry", "date", "elderberry"]
print("\n按单词长度分组:")
for key, group in groupby(words, key=len):
    print(f"长度{key}: {list(group)}")
# 分组结果：
# 长度5: ['apple']
# 长度6: ['banana', 'cherry']
# 长度4: ['date']
# 长度10: ['elderberry']

# chain 连接多个迭代器
# chain可以将多个迭代器连接成一个连续的迭代器
list1 = [1, 2, 3]
list2 = [4, 5, 6]
list3 = [7, 8, 9]
combined = chain(list1, list2, list3)
print(f"\nchain连接列表: {list(combined)}")
# chain连接列表: [1, 2, 3, 4, 5, 6, 7, 8, 9]

# chain.from_iterable可以展平嵌套的迭代器
# 相当于先解包再连接
nested = [[1, 2], [3, 4], [5, 6]]
flattened = chain.from_iterable(nested)
print(f"chain展平嵌套列表: {list(flattened)}")
# chain展平嵌套列表: [1, 2, 3, 4, 5, 6]

# cycle 创建无限循环的迭代器
# cycle会无限重复给定的序列
colors = ['red', 'green', 'blue']
color_cycle = cycle(colors)
# 使用islice来限制无限迭代器的输出
first_9_colors = list(islice(color_cycle, 9))
print(f"\ncycle循环颜色: {first_9_colors}")
# cycle循环颜色: ['red', 'green', 'blue', 'red', 'green', 'blue', 'red', 'green', 'blue']

# cycle在实际中的应用：循环分配任务
tasks = ['task1', 'task2', 'task3', 'task4', 'task5']
workers = cycle(['Alice', 'Bob'])
assignments = [(next(workers), task) for task in tasks]
print(f"cycle分配任务: {assignments}")
# cycle分配任务: [('Alice', 'task1'), ('Bob', 'task2'), ('Alice', 'task3'), ('Bob', 'task4'), ('Alice', 'task5')]

# islice 对迭代器进行切片
# 类似于列表切片，但适用于任何迭代器，包括无限迭代器
numbers = range(20)
print(f"\n原始数据: {list(numbers)}")
# 原始数据: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

# 取前5个元素
first_5 = list(islice(numbers, 5))
print(f"前5个元素: {first_5}")
# 前5个元素: [0, 1, 2, 3, 4]

# 指定开始和结束位置
slice_2_to_8 = list(islice(range(20), 2, 8))
print(f"索引2到8: {slice_2_to_8}")
# 索引2到8: [2, 3, 4, 5, 6, 7]

# 指定步长
slice_with_step = list(islice(range(20), 2, 8, 2))
print(f"索引2到8步长2: {slice_with_step}")
# 索引2到8步长2: [2, 4, 6]

# 从指定位置到结束
from_5_to_end = list(islice(range(20), 5, None))
print(f"从索引5到结束: {from_5_to_end}")
# 从索引5到结束: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
```

## 函数式编程的工具

```python
from functools import reduce

# map 应用函数到每个元素
squared = list(map(lambda x: x**2, [1, 2, 3, 4]))  # [1, 4, 9, 16]

# filter 过滤元素
evens = list(filter(lambda x: x % 2 == 0, [1, 2, 3, 4]))  # [2, 4]

# reduce 累积计算
product = reduce(lambda x, y: x * y, [1, 2, 3, 4])  # 24

# 列表推导式
squared = [x**2 for x in [1, 2, 3, 4]]
evens = [x for x in [1, 2, 3, 4] if x % 2 == 0]
```

## 装饰器

### 缓存与记忆化

```python
from functools import lru_cache, cache # 缓存库

# 通过lru_cache实现缓存
# 注意，缓存的对象必须是可哈希的，列表不能作为缓存的键，整数、浮点数、字符串和元组是可哈希的。
# 缓存函数的返回值，避免重复计算
@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Python 3.9+ 使用cache (无大小限制)
@cache
def expensive_calculation(x, y):
    return x * y + x**2 - y**2

# 通过lru_cache实现记忆化搜索
# 记忆化搜索算法是一种动态规划算法，利用递归函数的返回值来避免重复计算

# 最典型直观的例子：斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
print(fibonacci(50))  # 递归运算需要花费大概13分钟
# 记忆化递归
@lru_cache(maxsize=None)
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
print(fibonacci(50))  # 递归运算去除重复运算，几乎瞬间完成

# 下面解决硬币找零问题，给定不同面额的硬币，计算最少需要多少枚硬币来凑够给定的金额
@lru_cache(maxsize=None)
def coin_change(coins, amount):
    if amount == 0:
        return 0
    if amount < 0:
        return float('inf')
    
    min_coins = float('inf')
    for coin in coins:
        num_coins = coin_change(coins, amount - coin)
        if num_coins != float('inf'):
            min_coins = min(min_coins, num_coins + 1)
    return min_coins if min_coins != float('inf') else -1

print(coin_change((1, 2, 5), 11)) # 3
print(coin_change((1, 2, 5), 21)) # 5
```

## 字符串

```python
# 字符串的基本操作
s = "hello sekai"
print(s.upper())  # HELLO SEKAI
print(s.lower())  # hello sekai
print(s.split())  # ['hello','sekai']
print(s.replace("l", "L"))  # heLLo sekai
print(s.startswith("he"))  # True
print(s.endswith("ai"))  # True
print(s.find("l"))  # 2
print(s.count("l"))  # 2
print(s.isalpha())  # False 是否全为字母（有空格）
print(s.isdigit())  # False 是否全为数字
print(s.isspace())  # False 是否全为空格
print(s.isalnum())  # False 是否全为字母或数字
print(s.isupper())  # False 是否全为大写
print(s.islower())  # True 是否全为小写

# 字符串的格式化
name = "Alice"
age = 25
print(f"My name is {name} and I am {age} years old.")  # My name is Alice and I am 25 years old.

# 字符串的编码与解码
s = "こんにちは世界"
print(s.encode("utf-8"))  # b'\xe3\x81\x93\xe3\x82\x93\xe3\x81\xab\xe3\x81\xa1\xe3\x81\xaf\xe4\xb8\x96\xe7\x95\x8c'
s_utf8 = b'\xe3\x81\x93\xe3\x82\x93\xe3\x81\xab\xe3\x81\xa1\xe3\x81\xaf\xe4\xb8\x96\xe7\x95\x8c'
print(s_utf8.decode(encoding="utf-8", errors="strict"))  # こんにちは世界

# 字符串的反转
s = "hello sekai"
print(s[::-1])  # iakes olleh

# 字符串的切片
s = "hello sekai"
print(s[1:4])  # ell
print(s[1:])  # ello sekai
print(s[:4])  # hell
print(s[::2])  # hloski

# 字符串的格式化
s = "hello {name}, you are {age} years old."
print(s.format(name="Alice", age=25))  # hello Alice, you are 25 years old.

# 子串搜索
s = "hello sekai"
print(s.find("l"))  # 2
print(s.rfind("l"))  # 3 (从右边开始)
print(s.index("l"))  # 2
print(s.rindex("l"))  # 3
print("sekai" in s)  # True
print("world" in s)  # False

# 字符串的比较
s1 = "hello"
s2 = "sekai"
print(s1 < s2)  # True 判断依据是ASCII码的顺序
print(s1.lower() < s2.lower())  # True 忽略大小写
```




