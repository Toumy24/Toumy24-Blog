---
title: "基础数论函数"
date: 2025-11-02T17:00:00+08:00
timezone: UTC+8
tags: ["算法","数论","数论函数","算术函数"]
categories: ["数学"]
draft: false
math: true
---

## 几种常用的数论函数

### 一、单位函数

- 符号：$\varepsilon(n)$ 或 $e(n)$
- 定义：
    $$
    \varepsilon(n) = \begin{cases} 1 & n = 1 \newline 0 & n > 1 \end{cases}
    $$
- 性质：狄利克雷卷积的单位元 $f * \varepsilon = f$

### 二、1常数函数

- 符号：$1(n)$ 或 $I(n)$
- 定义：对所有正整数 $n$，$1(n) = 1$
- 性质：完全积性函数

### 三、恒等函数

- 符号：$id(n)$ 或 $N(n)$
- 定义：$id(n) = n$
- 性质：完全积性函数

### 四、幂函数

- 符号：$id_k(n)$
- 定义：$id_k(n) = n^k$
- 性质：完全积性函数

### 五、欧拉函数

- **见[数论：欧拉函数]({{< ref "EulerFunction.md" >}})**

### 六、莫比乌斯函数

- **见[数论：莫比乌斯函数与莫比乌斯反演]({{< ref "Mobius.md" >}})**