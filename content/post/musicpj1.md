---
title: "优雅地在我的博客中编写乐谱【1】"
date: 2025-11-07T14:00:00+08:00
timezone: UTC+8
tags: ["前端","JavaScript","vexflow","markdown"]
categories: 
  - 项目
  - 前端项目
draft: false
math: true
---

## 前言

博客的文章都是使用 Markdown 语法编写的，数学公式则是使用 KaTeX 渲染的。但是对我学习音乐来说还不够，我还希望能够在博客中编写乐谱，而不是简单的文字描述或是直接贴出图片，所以我需要一个能够渲染乐谱的博客插件，这个项目由此诞生。

## 实现方案

对于渲染乐谱本身，市面上已经有较为成熟的开源解决方案，而我选择的正是 VexFlow。VexFlow 是一款开源的 JavaScript 库，可以用来在网页上渲染乐谱为 SVG 或 Canvas 。

由于 VexFlow 的使用方式需要进行大量底层代码编写，所以我希望通过像 LaTeX 一样的简化语法来在 Markdown 中编写乐谱，所以我有了以下的实现思路：

```text
输入音乐标记 → 解析器 → 数据结构 → 渲染器 → 可视化乐谱
 Markdown    语法分析  抽象语法树 VexFlow  SVG/Canvas
```