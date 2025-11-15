---
title: "前端教程-HTML篇【1.1】HTML常用属性"
date: 2025-11-05T13:00:00+08:00
timezone: UTC+8
cover: https://blog.24toumy.top/coverimg/html-5.png
banner: "images/banner.webp"
tags: ["前端","HTML","基础语法"]
categories: 
  - 计算机语言
  - 前端语言
draft: false
math: true
---

## HTML常用属性

下面给出常用的HTML属性：

### 全局属性（适用于所有HTML元素）

| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **id** | 元素的唯一标识符 | `id="header"`<br>`id="user-profile"` | 同一文档中必须唯一，不能重复 |
| **class** | 元素的类名 | `class="btn"`<br>`class="btn btn-primary active"` | 多个类名用空格分隔 |
| **style** | 行内CSS样式 | `style="color: red; font-size: 16px;"` | 分号分隔多个样式声明 |
| **title** | 鼠标悬停提示文本 | `title="点击查看更多信息"` | 用于提供额外信息 |
| **data-*** | 自定义数据属性 | `data-user-id="123"`<br>`data-price="29.99"` | 用于存储自定义数据 |
| **hidden** | 隐藏元素 | `hidden`<br>`hidden="hidden"` | 布尔属性，存在即生效 |
| **tabindex** | Tab键导航顺序 | `tabindex="1"`<br>`tabindex="-1"` | 数字表示顺序，-1表示不可用Tab访问 |
| **contenteditable** | 内容可编辑 | `contenteditable="true"`<br>`contenteditable="false"` | 设置元素内容是否可编辑 |
| **draggable** | 元素可拖拽 | `draggable="true"`<br>`draggable="false"` | 控制拖拽功能 |
| **lang** | 语言设置 | `lang="zh-CN"`<br>`lang="en"` | 设置元素内容的语言 |

## 链接和媒体属性

### `<a>` 标签属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **href** | 链接目标地址 | `href="page.html"`<br>`href="#section1"`<br>`href="mailto:test@example.com"` | 支持相对路径、锚点、协议链接 |
| **target** | 打开方式 | `target="_self"`<br>`target="_blank"`<br>`target="frame1"` | _blank在新窗口打开 |
| **download** | 下载链接 | `download`<br>`download="filename.pdf"` | 强制下载而非打开 |
| **rel** | 链接关系 | `rel="nofollow"`<br>`rel="noopener"` | 定义与目标资源的关系 |

### `<img>` 标签属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **src** | 图片源路径 | `src="image.jpg"`<br>`src="/images/photo.png"` | 支持相对和绝对路径 |
| **alt** | 替代文本 | `alt="公司Logo"`<br>`alt=""` | 图片无法显示时显示，空值表示装饰性图片 |
| **width/height** | 尺寸设置 | `width="300"`<br>`height="200"` | 数字，单位像素 |
| **loading** | 懒加载 | `loading="lazy"`<br>`loading="eager"` | lazy延迟加载，eager立即加载 |

## 表单相关属性

### 表单通用属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **name** | 表单字段名 | `name="username"`<br>`name="email"` | 用于表单提交和数据识别 |
| **value** | 默认值 | `value="默认文本"`<br>`value="123"` | 字段的初始值 |
| **placeholder** | 提示文本 | `placeholder="请输入用户名"` | 输入框内的灰色提示文字 |
| **required** | 必填项 | `required`<br>`required="required"` | 布尔属性，必须填写 |
| **disabled** | 禁用状态 | `disabled`<br>`disabled="disabled"` | 禁用表单控件 |
| **readonly** | 只读状态 | `readonly`<br>`readonly="readonly"` | 可查看但不可编辑 |

### `<input>` 特定属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **type** | 输入类型 | `type="text"`<br>`type="email"`<br>`type="password"` | 定义输入框类型 |
| **maxlength** | 最大长度 | `maxlength="10"` | 限制输入字符数 |
| **min/max** | 数值范围 | `min="0" max="100"` | 数值输入的最小最大值 |
| **pattern** | 正则验证 | `pattern="[A-Za-z]{3}"` | 使用正则表达式验证输入 |
| **checked** | 默认选中 | `checked`<br>`checked="checked"` | 用于单选/复选框 |

### `<form>` 标签属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **action** | 提交地址 | `action="/submit"`<br>`action="process.php"` | 表单数据提交的URL |
| **method** | 提交方法 | `method="GET"`<br>`method="POST"` | HTTP请求方法 |
| **enctype** | 编码类型 | `enctype="multipart/form-data"` | 文件上传时必须设置 |

## 表格属性

| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **colspan** | 跨列 | `colspan="2"` | 单元格横跨的列数 |
| **rowspan** | 跨行 | `rowspan="3"` | 单元格横跨的行数 |
| **headers** | 关联表头 | `headers="col1 col2"` | 关联的表头id，空格分隔 |
| **scope** | 表头范围 | `scope="col"`<br>`scope="row"` | 定义表头的作用范围 |

## 媒体元素属性

### `<audio>` / `<video>` 属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **controls** | 显示控件 | `controls`<br>`controls="controls"` | 显示播放控制界面 |
| **autoplay** | 自动播放 | `autoplay`<br>`autoplay="autoplay"` | 加载后自动播放 |
| **loop** | 循环播放 | `loop`<br>`loop="loop"` | 媒体循环播放 |
| **muted** | 静音 | `muted`<br>`muted="muted"` | 初始静音状态 |
| **preload** | 预加载 | `preload="auto"`<br>`preload="none"` | 预加载策略 |

## 元信息属性

### `<meta>` 标签属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **charset** | 字符编码 | `charset="UTF-8"` | 文档字符编码 |
| **name** | 元数据名称 | `name="viewport"`<br>`name="description"` | 元数据的名称 |
| **content** | 元数据内容 | `content="width=device-width"` | 与name或http-equiv关联的内容 |

### `<link>` 标签属性
| 属性 | 描述 | 值示例 | 说明 |
|------|------|--------|------|
| **rel** | 关系类型 | `rel="stylesheet"`<br>`rel="icon"` | 当前文档与链接资源的关系 |
| **href** | 资源路径 | `href="style.css"`<br>`href="/favicon.ico"` | 链接资源的URL |
