---
title: "如何自己写一个编译器——抽象语法树（AST）【第一章】"
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

首先构建一个简单的加法运算`1 + 2 + 3`的AST：

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

**注意，递归下降只是一种逻辑上的方法论，并不是真正的递归编程技巧。**

#### 加法运算的递归下降解释器

接下来我们使用Python（简化造轮子流程）实现一个简单的**加法递归下降算术表达式解释器**，首先来构建一个词法分析器（Tokenizer）来将输入的字符串分割成词法单元序列。

>**为了明确数据类型，增添可读性，本文使用类型注解。**


```python
def tokenizer(expression: str) -> list[dict]: # 词法分析器，参数为表达式字符串

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

这个函数会将词法单元序列储存为哈希表键值对（字典实现），其中键为`Type`（类型）和`Value`（值），例如`{"Type": "Number", "Value": 123}`表示一个数字。

现在，可以构建AST节点了：

```python
from abc import ABC, abstractmethod

class Node(ABC): # AST节点基类
    @abstractmethod # 使用抽象基类，确保子类必定完成初始化，但在这个简单例子中其实不需要）
    def __init__(self):
        super().__init__()
        pass

class Number(Node): # 数字节点
     def __init__(self, value: int) -> None:
        super().__init__()
        self.value = value

class BinaryOperation(Node): # 二元运算节点（暂时只实现了加法，实际可拓展到任何二元运算符）
    def __init__(self, left: Node, right: Node) -> None:
        super().__init__()
        self.left = left
        self.right = right
```

接下来，可以实现递归下降语法分析器（parser）：

```python
def parser(tokens: list[dict]) -> Node: # 递归下降语法分析器，参数为词法单元序列，返回节点类型
    if not tokens:
        raise ValueError("表达式不能为空")
    
    if tokens[0]["Type"] != "Number":
        raise ValueError("无效的格式")

    node = Number(tokens[0]["Value"]) # 创建数字节点
    i = 1

    if i >= len(tokens): # 表达式只有一个数字，直接返回
        return node

    while i < len(tokens):
        if i + 1 >= len(tokens):
            raise ValueError("无效的格式")

        if tokens[i]["Type"] != "Operator" or tokens[i]["Value"] != "+":
            raise ValueError(f"不支持的运算符{tokens[i]['Value']}")

        if tokens[i + 1]["Type"] != "Number":
            raise ValueError("无效的格式")

        right = Number(tokens[i + 1]["Value"]) # 创建右操作数节点
        node = BinaryOperation(node, right) # 创建二元运算节点，实现左结合

        i += 2 # 跳过运算符和右操作数

    return node
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
def evaluator(node: Node) -> int:
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
     def __init__(self, value: int) -> None:
        super().__init__()
        self.value = value

class BinaryOperation(Node):
    def __init__(self, left: Node, right: Node) -> None:
        super().__init__()
        self.left = left
        self.right = right

def tokenizer(expression: str) -> list[dict]:
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

def parser(tokens: list[dict]) -> Node:
    if not tokens:
        raise ValueError("表达式不能为空")
    if tokens[0]["Type"] != "Number":
        raise ValueError("无效的格式")
    node = Number(tokens[0]["Value"])
    i = 1
    if i >= len(tokens):
        return node
    while i < len(tokens):
        if i + 1 >= len(tokens):
            raise ValueError("无效的格式")
        if tokens[i]["Type"] != "Operator" or tokens[i]["Value"] != "+":
            raise ValueError(f"不支持的运算符{tokens[i]['Value']}")
        if tokens[i + 1]["Type"] != "Number":
            raise ValueError("无效的格式")
        right = Number(tokens[i + 1]["Value"])
        node = BinaryOperation(node, right)
        i += 2
    return node

def evaluator(node: Node) -> int:
    if isinstance(node, Number):
        return node.value
    if isinstance(node, BinaryOperation):
        return evaluator(node.left) + evaluator(node.right)

if __name__ == "__main__":
    res = evaluator(parser(tokenizer(expression := input())))
    print(f"{expression} = {res}")
```

输入`1 + 2 + 3 + 4`，输出`1 + 2 + 3 + 4 = 10`，得益于我们的tokenizer，对于随机的格式如`1+ 2 + 3+4    + 5`，输出`1+ 2 + 3+4    + 5 = 15`，正确。

眼尖的小伙伴们这时候就要说了，这不就是`eval()`函数吗？

**确实是。**

实际上，`eval()`函数的底层实现就是靠的AST，我们的代码是实现了一个简化版的`eval()`函数，只支持加法运算。

#### 扩展到四则运算

这个例子的递归下降解析不是很直观，接下来，我们来扩展这个加法运算解释器，把它变成四则运算解释器，并使用更直观的递归下降法来编写解析器。

首先对于一个完善的四则运算计算器来说，不应该只有四则运算，还应该可以处理负数、括号的情况，同时兼容小数点，所以，修改节点与tokenizer：

```python
from abc import ABC, abstractmethod

class Node(ABC):
    @abstractmethod
    def __init__(self):
        super().__init__()
        pass

class Number(Node):
    def __init__(self, value: int | float) -> None:
        super().__init__()
        self.value = value

class BinaryOperation(Node):
    def __init__(self, left: Node, operator: str, right: Node) -> None: # 储存运算符
        super().__init__()
        self.left = left
        self.operator = operator
        self.right = right

class UnaryOperation(Node): # 新增一元运算符（正负号）
    def __init__(self, operator: str, operand: Node) -> None:
        super().__init__()
        self.operator = operator
        self.operand = operand

def tokenizer(expression: str) -> list[dict]:
    tokens = []
    i = 0
    while i < len(expression):
        char = expression[i]
        if char.isspace():
            i += 1
            continue
        elif char.isdigit() or char == ".": # 新增小数点判断
            start = i
            dot = False # 初始化小数点不存在
            while i < len(expression) and (
                expression[i].isdigit() or expression[i] == "."
            ):
                if expression[i] == ".": # 检测到小数点
                    if dot:
                        raise ValueError("不能有多个小数点")
                    dot = True # 标记小数点存在
                i += 1
            if dot:
                tokens.append({"Type": "Number", "Value": float(expression[start:i])}) # 小数点存在时储存为浮点数
            else:
                tokens.append({"Type": "Number", "Value": int(expression[start:i])}) # 小数点不存在时储存为整数
        elif char in "+-*/":
            tokens.append({"Type": "Operator", "Value": char})
            i += 1
        elif char == "(": # 添加括号的支持
            tokens.append({"Type": "LeftParen", "Value": "("})
            i += 1
        elif char == ")":
            tokens.append({"Type": "RightParen", "Value": ")"})
            i += 1
        else:
            raise ValueError(f"不支持的运算符{char}")
    return tokens
```

接下来，修改parser（更直观的递归下降法）。在这里我们引入一个新的概念——**token消费**，即，我们原地操作tokens，每递归下降到对应的处理节点时，将对应的token从列表中移除，顺序处理。

```python
def parser(tokens: list[dict]) -> Node:
    tokens = tokens.copy()
    return parse_addition_subtraction(tokens)

def parse_addition_subtraction(tokens: list[dict]) -> Node:
    node = parse_multiplication_division(tokens)
    while tokens and tokens[0]["Type"] == "Operator" and tokens[0]["Value"] in "+-":
        operator = tokens.pop(0)["Value"]
        right = parse_multiplication_division(tokens)
        node = BinaryOperation(node, operator, right)
    return node

def parse_multiplication_division(tokens: list[dict]) -> Node:
    node = parse_factor(tokens)
    while tokens and tokens[0]["Type"] == "Operator" and tokens[0]["Value"] in "*/":
        operator = tokens.pop(0)["Value"]
        right = parse_factor(tokens)
        node = BinaryOperation(node, operator, right)
    return node

def parse_factor(tokens: list[dict]) -> Node:
    if not tokens:
        raise ValueError("表达式不能为空")

    token = tokens.pop(0)

    if token["Type"] == "Number":
        return Number(token["Value"])
    elif token["Type"] == "LeftParen":
        node = parse_addition_subtraction(tokens)
        if not tokens or tokens[0]["Type"] != "RightParen":
            raise ValueError("右括号呢？")
        tokens.pop(0)
        return node
    elif token["Type"] == "Operator" and token["Value"] in "+-":
        operand = parse_factor(tokens)
        return UnaryOperation(token["Value"], operand)
    else:
        raise ValueError(f"{token}何意味？")
```

 
tokens将在递归下降中发生这样的步骤：
1. 调用`parser`，传入`tokens`列表，返回调用`parse_addition_subtraction`的结果。
2. 当调用`parse_addition_subtraction`（加减法，最低优先级），如果当前项是加减号，则弹出并储存当前项，当前位置变为原项的后面一项，使用`right`变量储存，然后把当前项指定为`BinaryOperation`节点，并传入`left`为`node`（当前项），`operator`为当前项的运算符，`right`为`right`变量（当前项为原项的下一项）。如果当前项不是加减号，向下调用`parse_multiplication_division`。
3. 进入`parse_multiplication_division`（乘除法，次优先级）后，发生与第二步相同的步骤，直到当前项不是乘除法时，向下调用`parse_factor`。
4. 调用`parse_factor`（因子：数值、括号、一元运算符），如果当前项是数字，则返回`Number`节点。如果当前项是左括号，则调用`parse_addition_subtraction`（递归回`parse_addition_subtraction`），开始新的一轮操作循环，处理括号内的表达式，并返回结果。如果当前项是一元运算符，则调用`parse_factor`自身，处理运算符右边的操作数或表达式，处理的过程中遇到加减乘除号则重新向上返回开始上述步骤的循环，最终返回`UnaryOperation`节点。

**就像一个工厂流水线，不同的机械臂组装不同的组件，从零开始组装，组装完一次后带着初成品返回到掌管下一个组件组装的机械臂处，继续向前组装，返回，组装循环。**

光看这个步骤可能难以理解，有人这时候就要问了，唉唉，执行完`parse_factor`后，也没看见继续进行调用啊，递归在哪？  
实际上，到这一步，一个递归的过程还没有完成，我们引入**函数调用栈**来解释这个过程。  
从`parser`到`parse_factor`，只是完成了“递”，我们还没有进行“归”。函数中调用的函数即内层函数，如果没进行返回，外层函数会暂停，并储存在调用栈中，直到内层函数返回，才会继续执行外层函数。  
此时的**函数调用栈**可以这样表示：
```text
parser
└── parse_addition_subtraction
    └── parse_multiplication_division
        └── parse_factor  ← 当前正在执行
```
所以，当`parse_factor`执行完毕并返回，实际上是回到了上一层函数`parse_multiplication_division`，如果不满足条件，函数返回后继续执行上一个外层函数，直到回到`parser`函数，然后开始下一轮的下降分析。

以`1+2*3`为例，经过tokenizer处理后，我们得到（我将简化类型与值）：`['1', '+', '2', '*', '3']`。   
parser是这样处理这个tokens的：
1. 调用`parser`，传入`tokens`列表，返回调用`parse_addition_subtraction`的结果。
2. 第一步调用的`parse_addition_subtraction`发现第一项为数字1，向下调用`parse_multiplication_division`。
3. 第二步调用的`parse_multiplication_division`发现第一项为数字2，向下调用`parse_factor`。
4. 第三步调用的`parse_factor`发现第一项为数字1，返回`Number`节点，并弹出第一项数字1，此时第一项变为加号`+`。
5. `parse_factor`返回后，回到函数调用栈的上层函数`parse_multiplication_division`，发现加号并不满足乘除号，返回`node`，然后回到函数调用栈的再上层函数`parse_addition_subtraction`。
6. `parse_addition_subtraction`发现当前项为加号`+`，储存并弹出加号，此时第一项变为数字2，返回`BinaryOperation`节点，并传入`left`为`node`（左操作数），`operator`（加号）为当前项的运算符，`right`为`right`变量（右操作数，弹出加号后，当前项变成加号的下一项即数字2）。
7. `parse_addition_subtraction`返回后，回到函数调用栈的上层函数`parser`，由于`parser`为栈底，调用栈的所有内层函数结束，此时tokens列表为`['2', '*', '3']`，在`parser`中被传入`parse_multiplication_division`，继续进行下降分析处理剩下的tokens，以此类推。

**注意，整个下降分析过程是单次、连续的分析，并不分段、分多轮处理，这正是递归下降法的强大之处，这意味着它可以在一个函数调用栈中，最好O(1)时间复杂度、平均和最坏O(n)时间复杂度下，完成所有tokens的处理。**

解析器执行完毕后，AST构建完毕，对于`1+2*3`，AST如下：
```text
BinaryOperation('+')                 
    ├── Number(1)                    
    └── BinaryOperation('*')         
          ├── Number(2)              
          └── Number(3)

树表示：
    +
   / \
  1   *
     / \              
    2   3
```

现在，我们进行最后的数值运算：
```python
def evaluator(node: Node) -> int | float:
    if isinstance(node, Number): # 如果为数字节点，直接返回值
        return node.value
    elif isinstance(node, UnaryOperation): # 如果为一元运算节点，处理负数
        operand_val = evaluator(node.operand)
        if node.operator == "+":
            return operand_val
        elif node.operator == "-":
            return -operand_val
        else:
            raise ValueError("没有这个一元运算符")
    elif isinstance(node, BinaryOperation): # 如果为二元运算节点，处理运算符

        def handle_division(l: int | float, r: int | float) -> int | float: # 除法逻辑（能整除则使用整除输出整型，不能则返回浮点型）
            if not r:
                raise ValueError("除数不能为0")
            if isinstance(l, int) and isinstance(r, int) and not l % r:
                return l // r
            return l / r

        left_val, right_val = evaluator(node.left), evaluator(node.right) # 深度优先搜索（DFS），递归求值左右子树的值，自顶向下遍历，向上回溯得到每个左右操作数的值。

        operations = { # 字典映射替代冗长的if-elif-else链
            "+": lambda l, r: l + r,
            "-": lambda l, r: l - r,
            "*": lambda l, r: l * r,
            "/": handle_division,
        }

        if node.operator not in operations:
            raise ValueError("没有这个二元运算符")

        return operations[node.operator](left_val, right_val) # 返回左右操作数在当前运算符下的运算结果。
```

至此，支持自由格式、多数值运算的四则运算解释器就完成了。

编写一个主函数来使用它：
```python
def main():
    while str(expression := input("请输入表达式，输入exit退出：")) != "exit":
        res = evaluator(parser(tokenizer(expression)))
        print(f"表达式 \033[96m{expression}\033[0m 的计算结果为 \033[95m{res}\033[0m") 
        # 通过ANSI转义，用青色标记表达式，用紫色标记计算结果，增强用户可读性

if __name__ == "__main__":
    main()
```

下面是这个计算器的完整代码：
```python
from abc import ABC, abstractmethod

class Node(ABC):
    @abstractmethod
    def __init__(self) -> None:
        super().__init__()
        pass

class Number(Node):
    def __init__(self, value: int | float) -> None:
        super().__init__()
        self.value = value

class BinaryOperation(Node):
    def __init__(self, left: Node, operator: str, right: Node) -> None:
        super().__init__()
        self.left = left
        self.operator = operator
        self.right = right

class UnaryOperation(Node):
    def __init__(self, operator: str, operand: Node) -> None:
        super().__init__()
        self.operator = operator
        self.operand = operand

def tokenizer(expression: str) -> list[dict]:
    tokens = []
    i = 0
    while i < len(expression):
        char = expression[i]
        if char.isspace():
            i += 1
            continue
        elif char.isdigit() or char == ".":
            start = i
            dot = False
            while i < len(expression) and (
                expression[i].isdigit() or expression[i] == "."
            ):
                if expression[i] == ".":
                    if dot:
                        raise ValueError("不能有多个小数点")
                    dot = True
                i += 1
            if dot:
                tokens.append({"Type": "Number", "Value": float(expression[start:i])})
            else:
                tokens.append({"Type": "Number", "Value": int(expression[start:i])})
        elif char in "+-*/":
            tokens.append({"Type": "Operator", "Value": char})
            i += 1
        elif char == "(":
            tokens.append({"Type": "LeftParen", "Value": "("})
            i += 1
        elif char == ")":
            tokens.append({"Type": "RightParen", "Value": ")"})
            i += 1
        else:
            raise ValueError(f"不支持的运算符{char}")
    return tokens

def parser(tokens: list[dict]) -> Node:
    tokens = tokens.copy()
    return parse_addition_subtraction(tokens)

def parse_addition_subtraction(tokens: list[dict]) -> Node:
    node = parse_multiplication_division(tokens)
    while tokens and tokens[0]["Type"] == "Operator" and tokens[0]["Value"] in "+-":
        operator = tokens.pop(0)["Value"]
        right = parse_multiplication_division(tokens)
        node = BinaryOperation(node, operator, right)
    return node

def parse_multiplication_division(tokens: list[dict]) -> Node:
    node = parse_factor(tokens)
    while tokens and tokens[0]["Type"] == "Operator" and tokens[0]["Value"] in "*/":
        operator = tokens.pop(0)["Value"]
        right = parse_factor(tokens)
        node = BinaryOperation(node, operator, right)
    return node

def parse_factor(tokens: list[dict]) -> Node:
    if not tokens:
        raise ValueError("表达式不能为空")

    token = tokens.pop(0)

    if token["Type"] == "Number":
        return Number(token["Value"])
    elif token["Type"] == "LeftParen":
        node = parse_addition_subtraction(tokens)
        if not tokens or tokens[0]["Type"] != "RightParen":
            raise ValueError("右括号呢？")
        tokens.pop(0)
        return node
    elif token["Type"] == "Operator" and token["Value"] in "+-":
        operand = parse_factor(tokens)
        return UnaryOperation(token["Value"], operand)
    else:
        raise ValueError(f"{token}何意味？")

def evaluator(node: Node) -> int | float:
    if isinstance(node, Number):
        return node.value
    elif isinstance(node, UnaryOperation):
        operand_val = evaluator(node.operand)
        if node.operator == "+":
            return operand_val
        elif node.operator == "-":
            return -operand_val
        else:
            raise ValueError("没有这个一元运算符")
    elif isinstance(node, BinaryOperation):

        def handle_division(l: int | float, r: int | float) -> int | float:
            if not r:
                raise ValueError("除数不能为0")
            if isinstance(l, int) and isinstance(r, int) and not l % r:
                return l // r
            return l / r

        left_val, right_val = evaluator(node.left), evaluator(node.right)

        operations = {
            "+": lambda l, r: l + r,
            "-": lambda l, r: l - r,
            "*": lambda l, r: l * r,
            "/": handle_division,
        }

        if node.operator not in operations:
            raise ValueError("没有这个二元运算符")

        return operations[node.operator](left_val, right_val)

def main():
    while str(expression := input("请输入表达式，输入exit退出：")) != "exit":
        res = evaluator(parser(tokenizer(expression)))
        print(f"表达式 \033[96m{expression}\033[0m 的计算结果为 \033[95m{res}\033[0m")


if __name__ == "__main__":
    main()
```