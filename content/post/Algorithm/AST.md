---
title: "如何自己写一个编译器——抽象语法树（AST）"
date: 2025-11-24T09:00:00+08:00
timezone: UTC+8
tags: ["算法","编译原理","抽象语法树","AST"]
categories: 
  - 算法与数学
  - 算法
draft: false
math: true
---

# 前言

学校曾经出题，让我们自己写一个终端中实现的计算器程序（至少满足基本的四则运算功能）。

对于C语言来说，使用`switch`语句来实现四则运算的功能，代码如下：

```c
#include <stdio.h>

int main() {
    int a, b, op;
    printf("输入两个数和运算符 (+, -, *, /): ");
    scanf("%d %d %d", &a, &b, &op);
    switch(op) {
        case '+':
            printf("%d + %d = %d\n", a, b, a+b);
            break;
        case '-':
            printf("%d - %d = %d\n", a, b, a-b);
            break;
        case '*':
            printf("%d * %d = %d\n", a, b, a*b);
            break;
        case '/':
            if(b == 0) {
                printf("除数不能为0\n");
            } else {
                printf("%d / %d = %d\n", a, b, a/b);
            }
            break;
        default:
            printf("无效的运算符\n");
    }
    return 0;
}
```

但是显然的，这个程序只能处理两个数的四则运算，而且实现非常的死板。所以我在想，有没有一种可以处理多个数值的表达式的算法呢？

> 有的兄弟，有的

## 抽象语法树（Abstract Syntax Tree，AST）

抽象语法树（Abstract Syntax Tree，AST）是一种树形结构，用来表示源代码的语法结构。它是一种抽象的、树状的表现形式，它将源代码的每个元素都用一个节点来表示，每个节点都有自己的类型和子节点。

抽象语法树的每个节点都代表着源代码中的一个语法结构，例如，表达式、语句、函数调用、变量声明、赋值语句等等。

首先构建一个简单的加法运算`1 + 2 + 3的AST：

```text
     +
    / \
   +   3
  / \
1   2
```

这是一个左结合的树，数学运算天然适合表示结合性，下面介绍两种语法分析器。

### 递归下降语法分析

抽象语法树的生成过程可以用递归下降语法分析（Recursive Descent Parsing）来实现。

递归下降语法分析是一种自顶向下的解析方法，它通过分析输入的词法单元（token）来构造语法树，每次分析一个词法单元，就将其与已经构造好的语法树进行匹配，直到输入的词法单元序列结束（或出现输入错误）。


接下来我们使用Python（简化造轮子流程）实现一个简单的**加法递归下降算术表达式解释器**，首先来构建一个词法分析器（Tokenizer）来将输入的字符串分割成词法单元序列。

```python
def tokenizer(expression: str) -> list: # 词法分析器，参数为表达式字符串

    tokens = [] # 词法单元序列
    
    i = 0 # 索引位置
    while i < len(expression):
        char = expression[i] # 当前字符

        if char.isspace():
            i += 1
            continue # 过滤空格

        elif char.isdigit(): # 读取数字
            start = i

            while i < len(expression) and expression[i].isdigit():
                i += 1

            tokens.append({"Type": "Number", "Value": int(expression[start:i])}) # 将连续数字储存为一个值

        elif char == "+":
            tokens.append({"Type": "Operator", "Value": "+"})
            i += 1

        else:
            raise ValueError(f"不支持的运算符{char}") # 出现不支持的运算符时抛出异常

    return tokens
```

这个函数会将词法单元序列储存为哈希表键值对（字典），其中键为`Type`（类型）和`Value`（值），例如`{"Type": "Number", "Value": 123}`表示一个数字。

现在，可以构建AST节点了：

```python
from abc import ABC, abstractmethod

class Node(ABC): # AST节点基类
    @abstractmethod # 使用抽象基类，确保子类必定完成初始化，但在这个简单例子中其实不需要）
    def __init__(self):
        super().__init__()
        pass

class Number(Node): # 数字节点
    def __init__(self, value):
        super().__init__()
        self.value = value

class BinaryOperation(Node): # 二元运算节点（暂时只实现了加法，实际可拓展到任何二元运算符）
    def __init__(self, left, right):
        super().__init__()
        self.left = left
        self.right = right
```

接下来，可以实现递归下降语法分析器（parser）：

```python
def parser(tokens: list) -> Node: # 递归下降语法分析器，参数为词法单元序列，返回节点类型
    if not tokens:
        raise ValueError("表达式不能为空")
    
    if tokens[0]["Type"] != "Number":
        raise ValueError("无效的格式")

    left = Number(tokens[0]["Value"])
    i = 1

    if i >= len(tokens): # 表达式只有一个数字，直接返回
        return left

    while i < len(tokens):
        if i + 1 >= len(tokens):
            raise ValueError("无效的格式")

        if tokens[i]["Type"] != "Operator" or tokens[i]["Value"] != "+":
            raise ValueError(f"不支持的运算符{tokens[i]['Value']}")

        if tokens[i + 1]["Type"] != "Number":
            raise ValueError("无效的格式")

        right = Number(tokens[i + 1]["Value"]) # 创建右操作数节点
        left = BinaryOperation(left, right) # 创建二元运算节点，实现左结合

        i += 2 # 跳过运算符和右操作数

    return left
```

现在已经可以正常构建AST了，可以编写一个可视化模块来看看生成的AST：

```python
def printast(node: Node, indent=0):
    if isinstance(node, Number):
        print(" " * indent + f"Number({node.value})")

    elif isinstance(node, BinaryOperation):
        print(" " * indent + "BinaryOperation")
        printast(node.left, indent + 2)
        printast(node.right, indent + 2)

printast(parser(tokenizer("1 + 2 + 3 + 4")))
'''
应该会输出：

BinaryOperation
  BinaryOperation
    BinaryOperation
      Number(1)
      Number(2)
    Number(3)
  Number(4)

其中BinaryOperation表示我们的加号运算符"+"
'''
```

这个表达式表示为AST则是：

```text
      +
     / \
    +   4
   / \
  +   3
 / \
1   2
```

最后，可以编写解释器来执行这个AST：

```python
def evaluator(node: object) -> int:
    if isinstance(node, Number):
        return node.value
    if isinstance(node, BinaryOperation):
        return evaluator(node.left) + evaluator(node.right)

# 此时，我们的加法算术表达式解释器已经完成
print(evaluator(parser(tokenizer("1 + 2 + 3 + 4")))) # 输出10
```

最终代码：
```python
from abc import ABC, abstractmethod

class Node(ABC):
    @abstractmethod
    def __init__(self):
        super().__init__()
        pass

class Number(Node):
    def __init__(self, value):
        super().__init__()
        self.value = value

class BinaryOperation(Node):
    def __init__(self, left, right):
        super().__init__()
        self.left = left
        self.right = right

def tokenizer(expression: str) -> list:
    tokens = []
    i = 0
    while i < len(expression):
        char = expression[i]
        if char.isspace():
            i += 1
            continue
        elif char.isdigit():
            start = i
            while i < len(expression) and expression[i].isdigit():
                i += 1
            tokens.append({"Type": "Number", "Value": int(expression[start:i])})
        elif char == "+":
            tokens.append({"Type": "Operator", "Value": "+"})
            i += 1
        else:
            raise ValueError(f"不支持的运算符{char}")
    return tokens

def parser(tokens: list,) -> Node:
    if not tokens:
        raise ValueError("表达式不能为空")

    if tokens[0]["Type"] != "Number":
        raise ValueError("无效的格式")
    left = Number(tokens[0]["Value"])
    i = 1
    if i >= len(tokens):
        return left
    while i < len(tokens):
        if i + 1 >= len(tokens):
            raise ValueError("无效的格式")
        if tokens[i]["Type"] != "Operator" or tokens[i]["Value"] != "+":
            raise ValueError(f"不支持的运算符{tokens[i]['Value']}")
        if tokens[i + 1]["Type"] != "Number":
            raise ValueError("无效的格式")
        right = Number(tokens[i + 1]["Value"])
        left = BinaryOperation(left, right)
        i += 2
    return left

def evaluator(node: object) -> int:
    if isinstance(node, Number):
        return node.value
    if isinstance(node, BinaryOperation):
        return evaluator(node.left) + evaluator(node.right)

res = evaluator(parser(tokenizer(expression := input())))
print(f"{expression} = {res}")
```

输入`1 + 2 + 3 + 4`，输出`1 + 2 + 3 + 4 = 10`，得益于我们的tokenizer，对于随机的格式如`1+ 2 + 3+4    + 5`，输出`1+ 2 + 3+4    + 5 = 15`，正确。

眼尖的小伙伴们这时候就要说了，这不就是`eval()`函数吗？

**确实是。**

实际上，`eval()`函数的底层实现就是靠的AST，我们的代码是实现了一个简化版的`eval()`函数，只支持加法运算。

接下来，我们来扩展这个加法运算解释器，把它变成四则运算解释器。