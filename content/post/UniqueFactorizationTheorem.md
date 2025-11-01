---
title: "三种基础素数搜索算法"
date: 2025-11-01
timezone: UTC+8
tags: ["算法","筛法","线性筛","埃拉托斯特尼筛","素数","数论"]
categories: ["算法原理"]
draft: false
math: true
---

## 试除法

素数的定义是仅能被1和自身整除的数（1除外）。反之，如果一个数能被1和其本身以外的数整除，则不是素数。
若要进行试除，只需要试到该数的平方根即可，因为：

>若一个数为合数，则一定有一对因子分布在其平方根两侧。

所以试完平方根前的数，后面的数就没有必要继续试了。  
而对于0、1、全体偶数，都不可能是素数，所以可以直接排除提升效率。

有了这样的思路，代码很容易实现：

```c++
// 判断素数
int is_prime(int n) {
  if (n < 2) return 0;
  if (n % 2 == 0) return n == 2;
  for (int i = 3; i * i <= n; i += 2) {
    if (n % i == 0) return 0;
  }
  return 1;
}
// 构建素数列
int prime_arr(int *arr, int n) {
    int cnt = 0;
    for (int i = 2; i <= n; i++) {
        if (is_prime(i)) {
            arr[cnt++] = i;
        }
    }
    return cnt;
}
```

这个算法的时间复杂度是$O(\sqrt{n})$。

## 埃拉托斯特尼筛法（埃氏筛）

>核心思想：把素数的倍数全部筛掉，剩下的即为素数。

试除法中提到的将偶数全部排除，其实就是一种埃氏筛的思想，对于3的倍数、5的倍数等同理，不过多赘述。

根据这个过程进行模拟，很容易写出以下代码：

```c++
const int MAXN = 1000000;
std::vector<bool> is_prime(MAXN, true); // 初始化标记数组，将标记数组的所有元素标记为true，即暂时默认所有数都是素数
void eratosthenes() {
    is_prime[0] = is_prime[1] = false; // 0和1不是素数
    for (int i = 2; i * i <= N; i++) { // 同样只遍历到平方根
        if (is_prime[i]) {
            for (int j = i * i; j < N; j += i) {
                is_prime[j] = false; // 把每个i的倍数都标记为合数
            }
        }
    }
}
```

这个算法的时间复杂度是$O(n\log\log n)$，比试除法的$O(\sqrt{n})$要快很多。

## 线性筛法（欧拉筛）

很容易观察到，埃氏筛在筛倍数的同时，重复筛了很多数字，例如12，同时被2、3筛了，现在我们要避免这些不必要的重复过程，对埃氏筛进行优化，于是引入线性筛。

#### 唯一分解定理

>对于任意一个大于1的整数n，都可以表示为有限个素数的乘积。即，因子中一定存在一个最小素因子。

例如 $12$ ，可以表示为 $2\times 2\times 3$ ，其中 $2$ 是最小素因子。

因此，根据唯一分解定理，可以对埃氏筛进行优化：确保所有的合数只被其最小素因子筛掉，从而保证每个合数只被筛掉一次，这样我们就得到了欧拉筛。

欧拉筛：

```c++
const int MAXN = 1000000;
std::vector<bool> is_prime(MAXN, true);
std::vector<int> primes;  // 存储所有找到的素数
void euler_sieve() {
    is_prime[0] = is_prime[1] = false;
    for (int i = 2; i < MAXN; i++) {
        if (is_prime[i]) {
            primes.push_back(i);  // i是素数，加入素数列
        }
        for (int j = 0; j < primes.size() && i * primes[j] < MAXN; j++) {
            is_prime[i * primes[j]] = false;  // 标记i*primes[j]为合数
            if (i % primes[j] == 0) { // 确保i是最小素因子
                break;
            }
        }
    }
}
```
由于没有重复步骤，所以欧拉筛的时间复杂度是$O(n)$，必秒埃氏筛的$O(n\log\log n)$ 。