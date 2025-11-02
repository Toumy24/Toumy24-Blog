---
title: "数论：欧拉函数"
date: 2025-11-02T18:00:00+08:00
timezone: UTC+8
tags: ["算法","数论","欧拉函数","欧拉反演"]
categories: ["数学"]
draft: false
math: true
---

## 欧拉函数

>记作 $\varphi(n)$，定义：小于等于 $n$ 的正整数中与 $n$ 互质的数的个数。

公式表达为：

$$\varphi(n) = \sum_{d=1}^{n} [ \gcd(d,n) = 1]$$

#### 欧拉函数的性质

- $\varphi(1) = 1$
- 若 $n$ 是质数时，则 $\varphi(n) = n-1$
- 欧拉函数是积性函数，即对任意满足 $\gcd(m,n)=1$ 的整数 $m$ 和 $n$ ，有 $\varphi(mn) = \varphi(m) \varphi(n)$ 
- 当 $n$ 为偶数时，有 $\varphi(2n) = \varphi(n)$
- 对于质数 $p$ ，有 $\varphi(p^k) = p^{k-1}(p-1)$

#### 欧拉函数的计算

1. **定义法**
    - 根据定义”小于等于 $n$ 的正整数中与 $n$ 互质的数的个数“直接计算。  
    
    效率非常低。

2. **唯一分解定理**
    - 如果 $n = p_1^{k_1}p_2^{k_2}\cdots p_r^{k_r}$，则 
    $$\varphi(n) = n \prod_{i=1}^r (1-\frac{1} {p_i})$$

    例如，$100 = 2^2 \times 5^2$，则 $\varphi(100) = 100 \times (1-\frac{1} {2}) \times (1-\frac{1} {5}) = 100 \times \frac{1}{2} \times \frac{4}{5} = 40$。