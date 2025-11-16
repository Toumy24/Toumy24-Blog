---
title: "通用语言教程-Python 篇【3】基础数据类型"
date: 2022-06-05T11:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/python.png
tags: ["Python","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

## 数据类型

在Python中，几乎所有的东西都能看作数据类型，因为Python奉行“万物皆对象”的理念。  
因此，对于每一种数据类型的操作（方法与函数）的讲解是无法避免的，所以本章提前引入部分常用的方法与函数。

Python有七种基本的数据类型：

1. 数字类型：整数、浮点数、复数
2. 字符串类型：单引号和双引号都可以表示字符串
3. 布尔类型：True、False
4. 列表类型：列表是一种有序的集合，可以存储任意类型的数据
5. 元组类型：元组是一种不可变的列表，元素不能修改
6. 字典类型：字典是一种无序的键值对集合，可以存储任意类型的数据
7. 集合类型：集合是一种无序的集合，元素不能重复，可以存储任意类型的数据

在代码中体现：

```python
# 数字类型
a = 10
b = 3.14
c = 1 + 2j

# 字符串类型
s1 = 'hello'
s2 = "sekai"
# 字符串有多种操作
s3 = s1 + s2 # 连接字符串
print(s3)  # hello sekai
s4 = s1 * 3 # 重复字符串
print(s4)  # hellohellohello
# 字符串有索引和切片操作，索引同数组，从0开始
print(s1[0])  # h
print(s1[1:3])  # el 切片是左闭右开区间
print(s1[1:4:2])  # eo 切片可以设置步长，这里步长为2
print(s1[::-1])  # olleh 反转字符串

# 布尔类型（其本质是整数0和1）
t = True
f = False

# 列表类型
# 列表是一种有序的集合，可以存储任意类型的数据（包括列表本身）
lst1 = [1, 2, 3, 4, 5]
lst2 = ['apple', 'banana', 'orange']
# 字符串中的任何索引和切片操作都可以应用到列表上
print(lst1[0])  # 1
print(lst1[1:3])  # [2, 3]
print(lst1[1:4:2])  # [2, 4]
print(lst1[::-1])  # [5, 4, 3, 2, 1]
# 列表有很多操作，比如append、extend、insert、remove、pop、clear等
lst1.append(6)  # 在末尾添加元素6
lst1.extend([7, 8, 9])  # 在末尾添加元素[7, 8, 9]，与append的区别是extend可以接受列表作为参数
lst1.insert(2, 10) # 在索引2处插入元素10
lst1.remove(10) # 删除第一个值为10的元素
lst1.pop()  # 默认删除末尾元素，可以传入索引，删除指定元素，然后会返回被删除的元素的值
print(lst1.pop(2))  # 3  删除索引为2的元素，并返回该元素的值
lst1.sort()  # 排序，默认升序，也可以传入reverse=True参数进行降序排序，还可以传入key参数进行自定义排序如key=len，按字符串长度排序
slst1 = sorted(lst1)  # 排序并返回新列表的函数，与sort的区别是返回新列表，不改变原列表
lstlen = len(lst1)  # 列表长度
maxval = max(lst1)  # 列表最大值
minval = min(lst1)  # 列表最小值
lstsum = sum(lst1)  # 列表元素求和
lst1.reverse()  # 反转列表
lst1.clear()  # 清空列表
# 成员检查（in、not in）
print(1 in lst1)  # True
print(7 in lst1)  # False
print('apple' in lst2)  # True
print('grape' not in lst2)  # True

# 元组类型
tup1 = (1, 2, 3, 4, 5)
tup2 = ('apple', 'banana', 'orange')
# 元组与列表类似，但元组是不可变的，不能修改元素
print(tup1[0])  # 1
print(tup1[1:3])  # (2, 3)
print(tup1[1:4:2])  # (2, 4)
print(tup1[::-1])  # (5, 4, 3, 2, 1)

# 字典类型
# 字典是无序的键值对集合，可以存储任意类型的数据（包括字典本身）
dic1 = {'name': 'Alice', 'age': 25}
dic2 = {'name': 'Bob', 'age': 30}
# 字典有很多操作，比如get、keys、values、items、update、pop、clear等
print(dic1.get('name'))  # Alice 获取键为'name'的元素的值
print(dic1.keys())  # dict_keys(['name', 'age']) 获取字典所有键，可使用list()转换为列表
print(dic1.values())  # dict_values(['Alice', 25]) 获取字典所有值，可使用list()转换为列表
print(dic1.items())  # dict_items([('name', 'Alice'), ('age', 25)]) 获取字典所有键值对，可使用list()转换为列表，其中包含键值对元组
dic1.update({'gender': 'female'})  # 更新字典
print(dic1)  # {'name': 'Alice', 'age': 25, 'gender': 'female'}
print(dic1.pop('age'))  # 25  删除键为'age'的元素，并返回该元素的值
dic1.clear()  # 清空字典

# 集合类型
# 集合是无序的集合，元素不能重复，可以存储任意类型的数据（包括集合本身）
set1 = {1, 2, 3, 4, 5}
set2 = {'apple', 'banana', 'orange'}
# 集合有很多操作，比如union、intersection、difference、symmetric_difference等
print(set1.union(set2))  # {1, 2, 3, 4, 5, 'apple', 'banana', 'orange'}  并集
print(set1.intersection(set2))  # {1, 2, 3, 4, 5}  交集
print(set1.difference(set2))  # {1, 2, 3, 4, 5}  差集（补集）
print(set1.symmetric_difference(set2))  # {1, 2, 3, 4, 5, 'apple', 'banana', 'orange'}  对称差集（两个集合中不同时存在的元素的集合）

# 对于列表去重，可以直接使用set()转换为集合，因为集合元素不重复，然后再转换为列表
lst3 = [1, 2, 3, 2, 1, 4, 5, 4, 6, 5]
lst4 = list(set(lst3))
print(lst4)  # [1, 2, 3, 4, 5, 6]
```



### 类型转换

Python中直接使用类型对应的函数进行类型转换：

```python
# 整数转字符串
a = 10
s = str(a)
print(s)  # '10'

# 字符串转整数
s = '10'
a = int(s)
print(a)  # 10

# 字符串转浮点数
s = '3.14'
a = float(s)
print(a)  # 3.14

# 整数转浮点数
a = 10
b = float(a)
print(b)  # 10.0

# 字符串转布尔值
s = 'True'
b = bool(s)
print(b)  # True

# 列表转元组  
lst = [1, 2, 3, 4, 5]
tup = tuple(lst)
print(tup)  # (1, 2, 3, 4, 5)

# 元组转列表
tup = (1, 2, 3, 4, 5)
lst = list(tup)
print(lst)  # [1, 2, 3, 4, 5]

# 字符串转列表
s = '1,2,3,4,5'
lst = s.split(',')  # 默认以','分割，可以传入参数指定分隔符
print(lst)  # ['1', '2', '3', '4', '5']

# 列表转字符串
lst = [1, 2, 3, 4, 5]
s = ','.join(str(i) for i in lst) # 列表元素转字符串，再用','连接，使用了推导式
print(s)  # '1,2,3,4,5'

# 字典转列表
dic = {'name': 'Alice', 'age': 25}
lst = list(dic.items())  # 字典转列表，元素为键值对元组
print(lst)  # [('name', 'Alice'), ('age', 25)]
# 键列表
keys = [i[0] for i in lst]
print(keys)  # ['name', 'age']
# 值列表
values = [i[1] for i in lst]

