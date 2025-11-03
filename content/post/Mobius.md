---
title: "数论：莫比乌斯函数与莫比乌斯反演"
date: 2025-11-02T20:00:00+08:00
timezone: UTC+8
tags: ["算法","数论","莫比乌斯函数","莫比乌斯反演"]
categories: ["数学"]
draft: false
math: true
---

## 莫比乌斯（Möbius）函数

>对于正整数 $n$ ，其质因数分解为：$n = p_1^{k_1}p_2^{k_2}\cdots p_r^{k_r}$ ，其中 $p_i$ 为互不相等的质数，$k_r \geq 1$ 。  
>则莫比乌斯函数定义为：
>$$ \mu(n) = \begin {cases} 1 & \text{if}\ n = 1 \newline (-1)^r  & \text{if}\ k_1=k_2=\cdots={k_r}=1 \newline 0 & \text{if}\ \exists k_r \geq 2 \end {cases} $$

### 莫比乌斯函数的性质

- 莫比乌斯函数是积性函数，但不是完全积性函数。
- 对于正整数 $n$，有
    $$ 
    \sum_{d|n} \mu(d) = [n=1] = \begin {cases} 1 & \text{if}\ n = 1 \newline 0 & \text{if}\ n \neq 1 \end {cases} 
    $$
    使用狄利克雷卷积，可以将其写作 $\varepsilon = 1 * \mu$ ，即，莫比乌斯函数是常数函数的狄利克雷卷积逆元。

## 莫比乌斯反演

莫比乌斯反演是莫比乌斯函数最重要的一个应用。

>设两个数论函数 $f(n)$ 和 $g(n)$ ，它们满足：
>$$ g(n) = \sum_{d|n}f(d) $$
>则可以使用莫比乌斯反演将 $f(n)$ 变换为 $g(n)$ ：
>$$ f(n) = \sum_{d|n} \mu(d)g(\frac{n}{d}) $$
>或等价的：
>$$ f(n) = \sum_{d|n} \mu(\frac{n}{d})g(d) $$