---
title: "通用语言教程-C++ 篇【6】函数"
date: 2025-10-05T16:00:00+08:00
timezone: UTC+8
tags: ["C++","基础语法"]
categories: 
  - 计算机语言
  - 通用语言
draft: false
math: true
---

## 函数

```cpp
#include <iostream>
#include <string>
#include <cstdio>
using namespace std;

//函数声明（不可以进行函数嵌套，即在函数内定义函数，函数可以声明在任何不同的作用域内）
//函数的构成：数据类型 函数名(参数1,参数2,...){函数体} （参数可为空）
//函数声明里的参数：形参（形式参数），函数调用里的参数：实参（实际参数）

//返回值型函数，如果没有返回值，函数不会传出任何值。
int xplusy(int x, int y){
    return x+y; //返回值，即函数输出的值，返回值的数据类型为你声明函数使用的数据类型（直观理解为数学上的f(x,y)=x+y）
}

//函数的重载，同名函数可以有不同数据类型的返回值、参数，不同数量的参数
//重点：调用同名函数时，编译器会根据实参数据类型、
long long xplusy(long long x, long long y, double z = 3e17){ //带默认参数的重载函数，对形参进行赋值即为默认参数，导入的实参会覆盖默认参数，若没有指定参数，则使用默认参数
    return x+y+z;
}
// 注意：3e17默认为double类型
// 当传入整数时会隐式转换为double

double pi() { //double类型返回值，无参数的，使用代码段的方式计算π的函数
    double pi=0.0;
    for(int k=0; k<10000000; k++) {
        pi+=(k%2?-4.0:4.0)/(2*k+1); //莱布尼兹级数（反正切函数在x=1处的泰勒展开，收敛为pi/4），得到凑合精度的π值
    }
    return pi;
}
// 注意：莱布尼茨级数收敛较慢
// 此实现需要1000万次迭代才能得到较好精度
// 实际应用中可使用更高效的算法


//重点：返回值为字符串字面量的函数声明const char*（不使用string的c语言风格定义），由于涉及到指针内容，请先记住定义方法，下节课详细讲解指针。
//牢记：char*、char[]、char的性能远强于string，虽然string方便，但涉及精细性能优化的时候，使用char及其衍生类型更合适。
const char* stropt_c(int x, int y) { //由于x，y定义于函数内部作用域，只能在函数内部使用，函数外部无法访问，因此与其他函数的参数重名是不影响的。
    if(x>y) {
        return "x大于y";
    }
    return "x小于等于y"; //对于if-else条件语句，一个if+相反return即可还原其行为。
}


//c++风格声明字符串返回值的函数，直接使用string。
string stropt_cpp(int x, int y) {
    if(x>y) {
        return "x大于y";
    }
    return "x小于等于y";
}


//操作型函数，调用该函数会执行函数中的代码段，但不会返回任何值（使用void类型定义，void是一种特殊的数据类型，即为无类型或空类型，没有任何意义）
void printHello(){
    cout << "Hello Sekai!" << endl;
}//无返回值


namespace funcV1 { //不同作用域定义函数的示例：在命名空间内定义
    int xplusy(int x, int y) {
        int z = x + y;
        return z;
    }
}
namespace funcV2 {
    int xplusy(int x, int y) {
        return x + y;
    }
}
//通过定义两个不同的命名空间，由于作用域独立，可以实现同一个函数的不同版本转换

//函数的递归，核心思想：自己调用自己，直到达到递归的边界条件。
int fibonacci_an(int n) {
    if(n <= 1) {
        return n;
    }
    return fibonacci_an(n-1) + fibonacci_an(n-2); //斐波那契数列，通过自己调用自己，得到a_(n-1)和a_(n-2)，使用递归计算
}
// 注意：此递归实现时间复杂度高(O(2^n))，仅用于教学演示
// 实际应用中建议使用迭代或记忆化递归

void changeArgument(int &m, int &n) { //使用引用传递参数，修改传入实参的变量的值
    int temp = m; //临时变量，储存m的值
    m = n; //修改m的值为n
    n = temp; //修改n的值为temp（m）
}

int arrin(int *arr) { //函数传入数组的标准写法
    return arr[0]; //返回数组第一个元素
}

int main() {
    cout << xplusy(2, 3) << endl;
    cout << xplusy(1e17, 2e17, 4e17) << endl; //使用科学计数法的数字，默认为double类型，形参类型不匹配，但由于有三个参数，故调用重载函数，double类型转为long long类型
    cout << xplusy(1, 2, 3) << endl;//三个参数，同样调用重载函数
    cout << xplusy(100000000000000000, 200000000000000000) << endl;//使用两个参数时想要编译器调用重载函数，只能写整型，或对数字进行类型转换，否则会报错，因此，重载函数不应滥用。
    printf("%.10lf\n", pi());//使用printf输出π值，精度为10位小数，比cout方便
    cout << stropt_c(1, 2) << endl;
    cout << stropt_cpp(1, 2) << endl;
    printHello();
    cout << funcV1::xplusy(2, 3) << endl; //funcV1命名空间中的第一个版本的函数
    cout << funcV2::xplusy(2, 4) << endl; //funcV2命名空间中的第二个版本的函数

    for (int i = 0; i < 10; i++) {
        cout << fibonacci_an(i) << " "; //输出斐波那契数列的前10项，注意，该斐波那契数列的递归实现需要搭配for循环才是完全体。
    }
    cout << endl;

    //可以在函数内嵌套的例外：lambda表达式，即为匿名函数，没有名字的小型函数。
    //声明方式：[捕获外部变量](参数列表){函数体}（方括号为捕获列表，决定外部变量能否使用，有两个可选参数=,&，分别表示复制外部变量的值和直接操作外部变量，一般优先使用=）
    //这里引入一个新的数据类型概念：auto，他会根据值自动推导出数据类型。
    //最常见的lambda声明
    auto lambda = []() {
        cout << "I am a lambda function" << endl;
    };// 注意lambda函数体花括号后面需要加上分号
    lambda(); //调用lambda函数

    auto plus = [](auto x, auto y) { //带参数的lambda函数
        return x + y;
    };
    cout << plus(5, 3) << endl;

    int a = 10, b = 20;
    auto lambda2 = [&]() { //带外部变量的lambda函数（由于&为地址运算符（今后将其称作引用运算符或引用），直接指向外部变量的地址，所以直接操作外部变量）
        a = 5;
    };
    lambda2();
    cout << "a=10->a=" << a << endl;//a的值被修改为5

    auto lambda3 = [=]() { //不使用=就不能在lambda函数体内使用外部变量
        return a + 1;
    };
    cout << "a=5,a+1=" << lambda3() << endl; //输出6（因为上面修改了a的值为5）
    //注意，=捕获的是外部的所有变量
    //如果想只捕获外部变量a，可以写成[a](){}，多个变量但不全捕获则可以写成[a,b,...](){}
    auto lambda4 = [a]() {
        return a + 2;
    };
    cout << "a=5,a+2=" << lambda4() << endl; //输出7（因为a的值为5）
    //同理，&也一样
    auto lambda5 = [&b]() {
        b = 15;
    };
    lambda5();
    cout << "b=20->b=" << b << endl; //输出23（因为b的值为20）

    int m = 0, n = 1;
    changeArgument(m,n);//调用交换函数，修改m和n的值
    cout << m << " " << n << endl;

    int arr[5] = {1,2,3,4,5};
    cout << arrin(arr) << endl; //输出数组第一个元素

    return 0;
}
```