---
title: "基础数论概念"
date: 2025-11-02T16:00:00+08:00
timezone: UTC+8
tags: ["算法","数论","基础概念"]
categories: ["数学"]
draft: false
math: true
---

## 整除

>对于两个数 $a$ 和 $b$，如果存在整数 $k$ 使得 $b = k \times a$，则称 $a$ 整除 $b$ 或 $b$ 被 $a$ 整除，记作 $a \mid b$。  
>此时称 $a$ 为 $b$ 的因数（或约数），$b$ 为 $a$ 的倍数。

例如：
- $3 \mid 6$，因为 $6 = 2 \times 3$
- $5 \nmid 12$ （ $5$ 不整除 $12$），因为 $12$ 除以 $5$ 余 $2$。

#### 性质

1. 符号无关： $a \mid b \Leftrightarrow -a \mid b \Leftrightarrow a \mid -b \Leftrightarrow |a| \mid |b|$
2. 自反性： $a \mid a$ ，即任何整数整除自身。
3. 传递性：如果 $a \mid b \wedge b \mid c$，则 $a \mid c$。
4. 线性性：如果 $a \mid b \wedge a \mid c$，那么对于任意整数 $x$ 和 $y$ ，有 $a \mid (bx+cy)$ 。例如，$3 \mid 6 \wedge 3∣9$，则 $3 \mid (6x+9y)$ 对于任意整数 $x,y$ 成立。
5. 任何数都可以被 $1$ 和 $-1$ 整除。
6. 任何非零整数整除 $0$ ，但是 $0$ 不整除任何数。