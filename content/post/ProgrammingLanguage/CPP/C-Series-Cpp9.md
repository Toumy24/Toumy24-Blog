---
title: "通用语言教程-C++ 篇【9】面向对象-类与对象"
date: 2024-10-05T18:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.png
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---

> 本章节会顺着类与对象的知识点，循序渐进的实现一个简单的公司员工银行账户系统。

## 类

类（class）是面向对象编程的基本单元，它定义了对象的属性和行为。类可以包含数据成员（data member）、成员函数（member function）、构造函数（constructor）、析构函数（destructor）、友元函数（friend function）等。

### 类定义

类定义的语法如下：

```c++
class 类名 {
    // 成员变量
    数据类型 变量名;
    // 成员函数
    返回类型 函数名(参数列表) {
        // 函数体
    }
};
```

可以发现类的定义很像结构体的定义，这是因为在C++中结构体就是简化版本的类。

### 类成员访问控制

类成员可以分为**公有成员（public）、私有成员（private）、保护成员（protected）** 三种。  

- **公有成员**：可以被所有类成员访问，在类外也可以访问。
- **私有成员**：只能被类本身访问，在类外不能访问，子类也不能访问。
- **保护成员**：可以被类本身及其子类访问，在类外不能访问。

**注意，类成员不进行访问控制的声明默认是private，结构体默认是public**

### 类成员

类成员分为数据成员和成员函数。

- **数据成员**：类中用于存储数据的变量。
- **成员函数**：类中用于操作数据的函数。

类成员的定义：

```c++
class Person {
    public:
        string name = "Unknown";   // 类内初始化
        int age = 0;
    private:
        int salary = 5000;         // 私有的也可以类内初始化
    protected:
        string id = "000001";
};
```

下面也是一种类成员初始化的写法：

```c++
class Person {
    public:
        string name{"Unknown"};
        int age{0};
    private:
        int salary{5000};
    protected:
        string id{"000001"};
```

#### 构造函数

构造函数（constructor）是类中特殊的成员函数，它在对象创建时被调用，用来初始化对象的数据成员。构造函数的名字与类名相同，没有返回值（连void都没有），可以有默认参数。

```c++
class Person {
    public:
        // 默认构造函数（不带参数或所有参数都有默认值）
        Person() { 
            name = "Unknown";
            age = 0;
            salary = 5000;
        }
        
        // 带默认参数的构造函数（至少需要两个参数，所以不存在二义性）
        Person(string n, int a, int s = 5000) {
            name = n;
            age = a;
            salary = s;
        }
};
```

使用方式：

```c++
Person p1;                  // 这里调用默认构造函数（带参构造函数需要至少两个参数，所以这里不会与带参构造函数冲突）
Person p2("Alice", 30);     // 这里调用带参构造函数
Person p3("Tom", 25, 8000);
```

##### 成员初始化列表

C++11引入了成员初始化列表，可以简化构造函数的定义。

```c++
class Person {
    private:
        string name;
        int age;
        int salary;

    public:
        // 使用成员初始化列表
        Person() : Person("Unknown", 0, 5000) {} // 同上写法，但是将默认构造函数委托给带参构造函数（高级用法）

        // 成员初始化列表的基础用法
        Person(string n, int a, int s = 5000) : name(n), age(a), salary(s) {} //不要省略{}
};
```

#### 析构函数

析构函数（destructor）是类中特殊的成员函数，它在对象销毁时被调用，用来释放对象占用的资源。析构函数的名字与类名相同。

如果要显式析构函数，可以定义一个空的析构函数：

```c++
class Person {
    public:
        // 析构函数
        ~Person() {
            cout << name << "对象被销毁" << endl;
        }
};
```

析构函数在对象生命周期结束时自动调用：

- 局部对象 → 离开作用域时（如函数结束）
- 动态对象（new 出来的） → delete 时
- 静态/全局对象 → 程序结束时

```c++
int main() {
    Person p1("Tom", 25);    // 构造
    {
        Person p2;           // 构造 → 离开这个块就析构
    }                        // ← 这里调用 p2 的析构函数 → 析构 “Alice对象被销毁”
}                            // ← 这里调用 p1 的析构函数 → 析构 “Tom对象被销毁”
```

#### 成员函数的类外定义

成员函数可以在类内定义，也可以在类外定义。类外定义需要使用作用域解析运算符 `::`

```c++
class Person {
    public:
        void sayHello();                     // 仅声明
        int Salary_with_bonus(int bonus);    // 仅声明
};

// 类外定义，必须加 Person::
void Person::sayHello() {
    cout << "我叫做 " << name << endl;
}

int Person::Salary_with_bonus(int bonus) {
    return salary + bonus;   // 类外定义仍在类作用域内，可以访问私有成员
}
```

这样做的好处是：类定义更简洁，头文件中只放声明，源文件中放定义，实现“声明与定义分离”。

#### this指针

类成员函数中有一个隐含的参数 `this`，它指向当前对象的地址。

```c++
class Person {
    private:
        string name;
        int age;
    
    public:
        // 使用this区分同名参数和成员变量
        Person(string name, int age) {
            this->name = name;   // this->name 表示成员变量，name是参数
            this->age = age;
        }
        
        // 返回当前对象的引用，支持链式调用
        Person& setName(string name) {
            this->name = name;
            return *this;        // 返回当前对象的引用
        }
        
        // 实现链式调用
        Person& setAge(int age) {
            this->age = age;
            return *this;        // 链式调用的关键
        }
        
        void introduce() {
            // 使用this访问成员变量（通常可以省略）
            cout << "我叫做" << this->name 
                 << "，我" << this->age << "岁了" << endl;
        }
        
        // 比较两个Person对象的年龄
        bool isOlderThan(const Person& other) const {
            return this->age > other.age;  // 明确表示比较当前对象和另一个对象
        }
};

// 使用链式调用
Person p("Tom", 25);
p.setName("Alice").setAge(30);  // 链式调用，setName返回*this，继续调用setAge
p.introduce(); // 输出 "我叫做Alice，我 30岁了"
```

#### const成员函数

const成员函数（const member function）是指不能修改对象的成员变量的成员函数。

```c++
返回类型 函数名(参数列表) const {
    // 函数体 - 不能修改成员变量（mutable除外）
}
```

const的用法：

```c++
class BankAccount {
public:
    // const对象只能调用const成员函数
    double getBalance() const { return balance; }
    
    // 非const函数
    void withdraw(double amount) { balance -= amount; }
};

// 使用
const BankAccount account;  // const对象
cout << account.getBalance();  // 可以调用
// account.withdraw(100);     // 编译错误
```

mutable成员变量：可以被const函数修改的成员变量。

```c++
class BankAccount {
private:
    mutable int accessCount;  // 即使在const函数中也能修改
public:
    double getBalance() const {
        accessCount++;  // 允许修改
        return balance;
    }
};
```

#### 静态成员

静态成员（static member）是指属于整个类，而不是某个对象，可以被所有对象共享。

```c++
class Person {
    public:
        static int count;   // 静态成员变量
    
    private:
        string name;
        int age;
};

int Person::count = 0;   // 静态成员变量的定义
```

静态成员的作用：

- 计数器
- 全局变量
- 常量

### 前向声明

当两个类互相引用，或者只是需要指针/引用时，可以先“前向声明”，不必包含完整定义。

```c++
// 没有前向声明会导致编译错误
class A {
    B* b;  // 错误：编译器不知道B是什么
};

class B {
    A* a;
};
```

添加前向声明：
```c++
class B;  // 前向声明

class A {
    B* b;  // 现在可以了
};

class B {
    A* a;
};
```

回到我们的代码：

```C++
class BankAccount;        // 前向声明，告诉编译器有这么个类就行

class AccountManager {
    public:
        void displayBalance(const BankAccount& account);  // 可以用引用或指针，或者说，如果要使用前向声明，必须传地址

        // 注意，const对象或const引用只能调用const成员函数（安全性考虑）
};
```

如果要访问成员，就必须包含完整定义。前向声明常用于减少头文件相互包含，提高编译速度。

### 友元

友元（friend）是一种特权机制，允许一个类访问另一个类的私有成员。友元函数和友元类都可以访问私有成员。

友元破坏了封装性，但有时却非常有用。

友元函数：可以访问类的私有和保护成员

```c++
class BankAccount {
    private:
        double balance = 1000.0;
        friend void showBalance(const BankAccount& acc);  // 声明友元函数
};

// 这里完整的定义了BankAccount，所以在这之后的所有函数都可以传值而不用传地址，接下来为了统一，还是继续传地址

void showBalance(const BankAccount& acc) {
    cout << acc.balance << endl;   // 可以直接访问 private 成员
}
```

- 友元类：整个类都是友元

```c++
class BankAccount {
    private:
        double balance = 1000.0;
        friend class BankAuditor;      // BankAuditor 的所有成员函数都能访问
};

class BankAuditor {
    public:
        void audit(const BankAccount& acc) {
            cout << "余额：" << acc.balance << endl;   // 可以访问
        }
};
```

成员函数作为友元：

```c++
class BankAccount {
    private:
        double balance = 1000.0;
        friend void AccountManager::displayBalance(const BankAccount&);
};
```

## 对象

对象（object）是类的实例，是程序运行时内存中实际存在的实体。对象包含数据成员和成员函数。

对象创建（又称对象的实例化）：

```c++
// 文章的例子
Person p1; // 类名 + 对象名 （隐式调用默认构造函数）
Person p2("Alice", 30); // 类名 + 对象名 + 构造函数（传参）
```

眼熟吗？在上面构造函数的部分出现过，创建对象时，会自动调用构造函数。

对于一个简单的类：

```c++
class A {
    public:
        int x;
        int y = 20;
    private:
        int z = 10;
};

A a; // 实例化对象
a.x = 10; // 访问数据成员
a.z = 20; // 错误：不能访问私有成员
cout << a.y << endl; // 访问对象a的成员 输出 20
```

## 上面代码的综合示例

```c++
#include <iostream>
#include <string>

using namespace std;

class Person {
    public: // 公有成员
        // 数据成员
        string name;
        int age;
        
        // 静态成员变量 - 统计Person对象数量
        static int count;
        
        // 构造函数
        Person() { // 默认构造函数
            name = "Unknown";
            age = 0;
            salary = 5000;
            count++;  // 每创建一个对象，计数器加1
        }
        
        // 使用this指针区分参数和成员变量
        Person(string name, int age, int salary = 5000) { // 带参构造函数
            this->name = name;
            this->age = age;
            this->salary = salary;
            count++;
        }
        
        // 成员函数
        void sayHello() {
            cout << "你好，我叫做" << name << endl;
            cout << "我" << age << "岁了" << endl;
            cout << "我的薪水是" << salary << "元" << endl; // 私有成员可以在类内部访问
        }
        
        // const成员函数 - 不会修改对象状态
        void displayInfo() const {
            cout << "姓名: " << name << ", 年龄: " << age << endl;
            // salary = 1000;  // 错误：const成员函数不能修改成员变量
        }
        
        // 使用this指针支持链式调用
        Person& setName(string name) {
            this->name = name;
            return *this;
        }
        
        Person& setAge(int age) {
            this->age = age;
            return *this;
        }
        
        int Salary_with_bonus(int bonus); // 声明函数，但不定义
        
        // 设置私有成员的函数
        void setSalary(int s) {
            salary = s;
        }
        
        // 静态成员函数
        static int getCount() {
            return count;
        }
        
        // 析构函数
        ~Person() {
            count--;  // 对象销毁时计数器减1
            cout << name << "对象被销毁" << endl;
        }

    private: // 私有成员
        int salary;
        
    protected: // 保护成员
        string id = "000001";
};

// 静态成员变量定义
int Person::count = 0;

// 定义成员函数
int Person::Salary_with_bonus(int bonus) {
    return salary + bonus;
}

// 友元函数示例
class BankAccount; // 前向声明

class AccountManager {
    public:
        void displayBalance(const BankAccount& account); // const引用参数
};

class BankAccount {
    private:
        double balance = 1000.0;
        mutable int accessCount = 0; // mutable成员，const函数中也能修改
    
    public:
        // const成员函数
        double getBalance() const {
            accessCount++;  // mutable成员可以在const函数中修改
            return balance;
        }
        
        // 使用this指针支持链式调用
        BankAccount& deposit(double amount) {
            balance += amount;
            return *this;
        }
        
        BankAccount& withdraw(double amount) {
            if (amount <= balance) {
                balance -= amount;
            }
            return *this;
        }
        
        // 声明友元函数
        friend void AccountManager::displayBalance(const BankAccount& account);
        
        // 声明友元类
        friend class BankAuditor;
};

void AccountManager::displayBalance(const BankAccount& account) {
    cout << "账户余额: " << account.balance << endl; // 友元函数可以访问私有成员
}

class BankAuditor {
    public:
        void audit(const BankAccount& account) {
            cout << "审计账户，余额为: " << account.balance << endl; // 友元类可以访问私有成员
        }
};

int main() {
    // 显示初始对象计数
    cout << "初始Person对象数量: " << Person::getCount() << endl;
    
    // 使用默认构造函数实例化对象
    Person p1;
    p1.name = "Tom";
    p1.age = 25;
    p1.sayHello();
    
    // 使用带参构造函数实例化对象
    Person p2("Alice", 30, 8000);
    p2.sayHello();
    
    // 使用链式调用
    Person p3;
    p3.setName("Bob").setAge(35);
    p3.displayInfo();  // 调用const成员函数
    
    // 访问私有成员需要通过公有成员函数
    p1.setSalary(7000);
    cout << "Tom的薪水加上奖金是" << p1.Salary_with_bonus(1000) << endl;
    
    // 显示当前对象计数
    cout << "当前Person对象数量: " << Person::getCount() << endl;
    
    // 友元函数和友元类示例
    BankAccount account;
    
    // 链式调用银行账户操作
    account.deposit(500).withdraw(200);
    cout << "最终余额: " << account.getBalance() << endl;
    
    AccountManager manager;
    manager.displayBalance(account);
    
    BankAuditor auditor;
    auditor.audit(account);
    
    // 测试作用域和析构函数
    {
        Person p4("临时对象", 40);
        cout << "作用域内Person对象数量: " << Person::getCount() << endl;
    } // p4离开作用域，析构函数被调用
    
    cout << "最终Person对象数量: " << Person::getCount() << endl;
    
    return 0;
}
```

**这段代码输出：**

```console
初始Person对象数量: 0
你好，我叫做Tom
我25岁了
我的薪水是5000元
你好，我叫做Alice
我30岁了
我的薪水是8000元
姓名: Bob, 年龄: 35
Tom的薪水加上奖金是8000
当前Person对象数量: 3
最终余额: 1300
账户余额: 1300
审计账户，余额为: 1300
作用域内Person对象数量: 4
临时对象对象被销毁
最终Person对象数量: 3
Bob对象被销毁
Alice对象被销毁
Tom对象被销毁
```
