---
title: "通用语言教程-Python 篇【4】运算符与高级输入输出"
date: 2022-06-05T12:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/python.png
tags: ["Python","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 运算符

Python 在基础运算符的基础上新增了几个常用的运算符，如指数、整除等。  

```python
# 算术运算符
print(2 + 3)  # 5
print(2 - 3)  # -1  
print(2 * 3)  # 6
print(2 / 3)  # 0.6666666666666666 对于不能整除的小数，默认输出小数点后 15-17 位
print(2 // 3)  # 0   整除
print(2 % 3)   # 2   取余
print(2 ** 3)  # 8   指数

# 赋值运算符
a = 2
a += 3  # a = a + 3
a -= 3  # a = a - 3
a *= 3  # a = a * 3 
a /= 3  # a = a / 3
a //= 3  # a = a // 3
a %= 3  # a = a % 3
a **= 3  # a = a ** 3

# 比较运算符
print(2 == 3)  # False
print(2 != 3)  # True
print(2 > 3)   # False
print(2 < 3)   # True
print(2 >= 3)  # False
print(2 <= 3)  # True

# 逻辑运算符
print(True and False)  # False   与
print(True or False)   # True    或
print(not True)        # False   非

# 位运算符
m = 3 # 二进制 011
n = 4 # 二进制 100
print(m & n)  # 0    与
print(m | n)  # 7

# 成员运算符
print(2 in [1, 2, 3])  # True
print(2 not in [1, 2, 3])  # False
print('a' in 'hello')  # False
print('h' in 'hello')  # True

# 身份运算符
# 与==不同的是，身份运算符比较的是两个变量的内存地址是否相同，而不是值是否相同。
print(2 is 3)  # False
print(2 is not 3)  # True
# 直观表现比较内存地址：
arr = [1, 2, 3]
arr1 = arr
print(arr is arr1)  # True
print(arr == arr1)  # True
arr1 = arr[:]
print(arr is arr1)  # False
print(arr == arr1)  # True
```

## 高级输入输出

Python可以通过方法链实现很多较为高级的输入输出操作。

```python
# 输入
name = input("请输入您的姓名：")
print("您好，" + name + "！")

#使用空格分隔输入
age, height, weight = input("请输入您的年龄、身高、体重：").split()
print("您的年龄是：" + age + "岁，身高是：" + height + "cm，体重是：" + weight + "kg。")

# 使用空格分隔输入直到输入结束（输入进列表等）
nums = input("请输入多个数字，以空格分隔：").split()
nums = [int(num) for num in nums]
print(nums)

# 一行输入m个被空格隔开的值，输入n行
# 基本形式：
# 读取第一行获取行数 n
n = int(input())
# 循环读取 n 行
for _ in range(n):
    # 读取一行并用空格分割
    values = input().split() #split()默认空格分隔，储存为列表
    print(f"本行有 {len(values)} 个值: {values}")
    # 如果要转换为整数
    # numbers = list(map(int, values))
    
# 使用列表推导式的简化版：
# 读取第一行获取行数 n，然后读取 n 行数据
n = int(input())
data = [input().split() for _ in range(n)]
print(f"所有数据: {data}")
# 转为整数：
numbers = [list(map(int, input().split())) for _ in range(n)]
```