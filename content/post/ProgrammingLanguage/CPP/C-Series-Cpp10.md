---
title: "通用语言教程-C++ 篇【10】面向对象-类的继承与多态"
date: 2024-10-05T19:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/cpp.png
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
---
## 类的继承与多态

### 继承

继承是面向对象编程的一个重要概念。继承是指一个类从另一个类中继承了其属性和方法，并可以对其进行扩展。继承可以使得子类具有父类的全部属性和方法，并可以对其进行扩展。

在C++中，使用关键字`class`来定义类，并使用`:`来实现继承。

```c++
class Animal {
    public:
        void eat(){
            cout << "动物正在吃东西" << endl;
        }

        void sleep(string name){
            cout << name << "正在睡觉" << endl;
        }
};

class Dog : public Animal { //Dog类继承Animal类（继承了eat()方法）
    public:
        void eat(){
            cout << "狗正在吃东西" << endl; //重写父类的方法
        }
        void bark(){
            cout << "狗在叫" <<endl;
        }
};

class Cat : public Animal {}; //Cat类继承Animal类


Dog dog;  //创建Dog类的对象
dog.eat(); // 调用Dog类的eat()方法，输出：狗正在吃东西
dog.bark(); // 调用Dog类的bark()方法，输出：狗在叫

Cat cat;  //创建Cat类的对象
cat.eat(); // 调用Cat类的eat()方法，输出：动物正在吃东西
cat.sleep("猫猫"); // 调用Cat类的sleep()方法，输出：猫猫正在睡觉
```

继承会使得子类获得父类的所有**公有成员**和**保护成员**，无法访问私有成员。

#### 继承的构造函数与析构函数调用顺序

```c++
class Base { // 父类
    public:
        Base(){
            cout << "父类的构造函数" << endl;
        }
        ~Base(){
            cout << "父类的析构函数" << endl;
        }
};

class Derived : public Base { // 子类（派生类）
    public:
        Derived(){
            cout << "子类的构造函数" << endl;
        }
        ~Derived(){
            cout << "子类的析构函数" << endl;
        }
};

Derived d; // 创建派生类的对象
// 输出顺序
// 父类的构造函数
// 子类的构造函数
// 父类的析构函数
// 子类的析构函数
```

### 多态

多态是面向对象编程的一个重要概念。多态是指一个对象可以有不同的形态，而这些形态都可以被同一个方法调用。

在C++中，多态是通过虚函数实现的。虚函数是指在基类中声明，在派生类中实现的函数。

#### 虚函数

虚函数是指在基类中声明，在派生类中实现的函数。

```c++
class Animal {
    public:
        virtual void speak(){
            cout << "动物发出声音" << endl;
        }
};

class Dog : public Animal {
    public:
        void speak(){
            cout << "汪汪！" << endl; // 重写虚函数
        }
};

class Cat : public Animal {
    public:
        void speak() override {
            cout << "喵喵！" << endl;
        }
};

int main() {
    Animal* animal1 = new Dog();
    Animal* animal2 = new Cat();

    animal1->speak(); // 调用Dog类的speak()方法，输出：汪汪！
    animal2->speak(); // 调用Cat类的speak()方法，输出：喵喵！

    delete animal1;
    delete animal2;

    return 0;
}
```

#### 纯虚函数与抽象类

纯虚函数是指在基类中声明，不提供函数体的虚函数。纯虚函数的声明以`= 0`结尾。

```c++
class Shape {
    public:
        virtual double area() = 0; // 纯虚函数
        virtual double draw() = 0; // 纯虚函数
};

class Circle : public Shape {
    private:
        double radius;
    public:
        Circle(double r) : radius(r) {}
        double area() overrride {
            return 3.14 * radius * radius;
        }
        double draw() override {    
            // 画圆的代码
            return 0;
        }
};