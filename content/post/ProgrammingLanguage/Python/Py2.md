---
title: "通用语言教程-Python 篇【2】循环结构与分支结构"
date: 2022-06-05T10:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/python.png
tags: ["Python","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 前言

为什么要提前讲循环结构与分支结构呢？因为这两个结构相对于其他语言来说，在Python中更为灵活简单且强大，所以必须提前掌握。

## 循环结构

Python中有两种循环结构，一种是`for`循环，另一种是`while`循环。

### for循环

`for`循环是Python中最常用的循环结构，它可以遍历一个序列（如列表、元组、字符串）中的每个元素，并对每个元素进行操作。

```python
# 遍历列表
fruits = ['apple', 'banana', 'orange']
for fruit in fruits:
    print(fruit)

# 遍历字符串
string = 'hello sekai'
for char in string:
    print(char)

# 以数字范围遍历
for i in range(1, 10): # range()函数可以生成一个数字序列，默认从0开始，是左闭右开的
# 等价于C++中的for(int i=1; i<10; i++)
    print(i)
# range()可以调整步长，如range(1, 10, 2)表示从1到9，步长为2
# range()可以传入负数，表示逆序遍历
# range()可以配合len()函数使用，如range(len(fruits))表示遍历列表的长度

# 跳出循环语句
for i in range(1, 10):
    if i == 5: # 跳出循环
    print(i)
# 跳过当前循环，使用continue语句
for i in range(1, 10):
    if i == 5:
        continue # 跳过当前循环
    print(i)
# 占位符语句，可以用pass语句进行占位，表示什么也不做
for i in range(1, 10):
    pass # 占位语句
```


#### 推导式

>此处涉及到部分数据类型，下章详细介绍。

`for`循环还可以用推导式来生成循环变量，语法如下：

```python
# 推导式的基本结构：
[表达式 for 变量 in 可迭代对象 if 条件] # 这里的方括号表示列表推导式，推导式不止可以用于列表，还可以用于元组、字符串、字典、集合等

# 推导式生成列表
squares = [x**2 for x in range(1, 11)]
print(squares)
# 生成[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
'''
等价于C++中的
int squares[10];
for(int i=0; i<10; i++) {
    squares[i] = i*i;
'''

# 推导式生成字典
squares_dict = {x: x**2 for x in range(1, 11)}
print(squares_dict)
# 生成{1: 1, 2: 4, 3: 9, 4: 16, 5: 25, 6: 36, 7: 49, 8: 64, 9: 81, 10: 100}

# 推导式生成集合
squares_set = {x**2 for x in range(1, 11)}
print(squares_set)
# 生成{1, 4, 9, 16, 25, 36, 49, 64, 81, 100}

# 推导式生成字符串
string = ''.join([chr(x) for x in range(97, 123)])
print(string) # 输出所有小写字母
```

### while循环

`while`循环是另一种常用的循环结构，它可以根据一个条件来控制循环的次数。

```python
# 语法为：
while 条件表达式:
      循环体语句

# 计算1到10的和
sum = 0
i = 1
while i <= 10:
    sum += i
    i += 1
print(sum) # 输出55

# 计算1到100的偶数和
sum = 0
i = 2
while i <= 100:
    sum += i
    i += 2
print(sum) # 输出2500

# 无限循环
i = 0
while True:
    print(i)
    i += 1
    if i == 10: # 跳出循环
```

## 分支结构

Python中有两种分支结构，一种是`if`结构，另一种是`match`结构。

### if结构

```python
# 基本语法
if 条件表达式:
    条件成立时执行的代码
else:
    条件不成立时执行的代码

num = 10
if num > 5:
    print('num is greater than 5')
else:
    print('num is less than or equal to 5')

# 嵌套if-else
num = 10
if num > 5:
    if num < 15:
        print('num is between 6 and 14')
    else:
        print('num is greater than 14')
else:
    print('num is less than 6')

# 多个条件判断（添加了elif）
num = 10
if num > 5 and num < 15:
    print('num is between 6 and 14')
elif num > 15:
    print('num is greater than 14')
else:
    print('num is less than 6')
```

### match结构

```python
# 基本语法
match 变量:
    case 值1:
        条件1成立时执行的代码
    case 值2:
        条件2成立时执行的代码
    case _: # 通配符，表示其他情况
        以上条件都不成立时执行的代码

# 计算星期几
day = 'Monday'
match day:
    case 'Monday':
        print('星期一')
    case 'Tuesday':
        print('星期二')
    case 'Wednesday':
        print('星期三')
    case 'Thursday':
        print('星期四')
    case 'Friday':
        print('星期五')
    case 'Saturday':
        print('星期六')
    case 'Sunday':
        print('星期日')
    case _:
        print('输入错误')
```