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

- 莫比乌斯函数是积性函数。