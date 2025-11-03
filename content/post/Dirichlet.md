---
title: "数论：狄利克雷卷积"
date: 2025-11-02T19:00:00+08:00
timezone: UTC+8
tags: ["算法","数论","狄利克雷卷积","卷积"]
categories: ["数学"]
draft: false
math: true
---

## 狄利克雷（Dirichlet）卷积

>数论函数 $f(x)$ 和 $g(x)$ 的狄利克雷卷积 $f \ast g$ 定义为：
>$$ (f * g)(n) = \sum_{d|n} f(d)g(\frac{n}{d}) = \sum_{d\ell = n} f(d)g(\ell) $$

其中，$d|n$ 表示 $n$ 能被 $d$ 整除，$\ell = \frac{n}{d}$ 表示 $n$ 除以 $d$ 得到的商，即与 $d$ 对称的因数，求和是对所有的 $d$ 进行的。

**例**，设 $f(n) =1$（[常数函数]({{< ref "NumTheoryFunction.md" >}})），$g(n) = n$（[恒等函数]({{< ref "NumTheoryFunction.md" >}})），则：

$$
(f * g)(6) = \sum_{d|n} f(d)g(\frac{6}{d}) = f(1)g(6) + f(2)g(3) + f(3)g(2) + f(6)g(1) = 1\cdot6 + 1\cdot3 + 1\cdot2 + 1\cdot1 = 12
$$

