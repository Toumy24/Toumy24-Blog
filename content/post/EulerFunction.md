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

>记作 $\varphi(n)$，定义：**小于等于 $n$ 的正整数中与 $n$ 互质的数的个数。**  
>公式表达为：  
>$$\varphi(n) = \sum_{d=1}^{n} [ \gcd(d,n) = 1]$$

### 欧拉函数的性质

- $\varphi(1) = 1$
- 若 $n$ 是质数时，则 $\varphi(n) = n-1$
- 欧拉函数是积性函数，即对任意满足 $\gcd(m,n)=1$ 的整数 $m$ 和 $n$ ，有 $\varphi(mn) = \varphi(m) \varphi(n)$ 
- 当 $n$ 为奇数时，有 $\varphi(2n) = \varphi(n)$
- 对于质数 $p$ ，有 $\varphi(p^k) = p^{k-1}(p-1)$
- $n = \sum_{d|n} \varphi(d)$
- 卷积恒等式： $ \varphi = \mu \cdot id$ ，其中 $\mu$ 是[莫比乌斯函数]({{< ref "Mobius.md" >}})。

### 欧拉函数的计算

#### 1.**定义法**
- 根据定义”小于等于 $n$ 的正整数中与 $n$ 互质的数的个数“直接计算。  
    
    效率非常低。

#### 2.**唯一分解定理**
- 如果 $n = p_1^{k_1}p_2^{k_2}\cdots p_r^{k_r}$，则 
    $$\varphi(n) = n \prod_{i=1}^r (1-\frac{1} {p_i})$$

    例如，$100 = 2^2 \times 5^2$，则 $\varphi(100) = 100 \times (1-\frac{1} {2}) \times (1-\frac{1} {5}) = 100 \times \frac{1}{2} \times \frac{4}{5} = 40$。

    对于这个计算方法的证明，需要用到**容斥定理**：
    - 从 $n$ 个数开始
    - 第一次减去 $p_1$ 的倍数，即减去 $\frac{n}{p_1}$ 个数
    - 第二次减去 $p_2$ 的倍数，即减去 $\frac{n}{p_2}$ 个数
    - 但是多减去了同时为 $p_1 、p_2$ 的倍数的数，因此需要重新加回来 $\frac{n}{p_1p_2}$ 个数
    - 以此类推，得到容斥定理版表达式：
    $$ \varphi(n) = n - \sum_{i} \frac{n}{p_i} + \sum_{i<j} \frac{n}{p_ip_j} - \sum_{i<j<k} \frac{n}{p_ip_jp_k} + \cdots + (-1)^{r} \frac{n}{p_1p_2\cdots p_r} $$
    或简化为：
    $$ \varphi(n) = n \sum_{k=0}^{r} (-1)^k \sum_{1\leq i_1<i_2<\cdots<i_k\leq r} \frac{n}{p_{i_1}p_{i_2}\cdots p_{i_k}} $$

