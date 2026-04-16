---
title: "欢迎来到我的博客"
date: 2021-06-01
timezone: UTC+8
draft: false
---
# markdown-music-notation 答辩讲稿

> 用于答辩时参考的技术讲解稿

---

## 一、项目是什么

简单来说，这个项目让你可以在写博客的时候，**用纯文本来写乐谱**。

传统做法是用 MuseScore 之类的软件画好谱子，截图贴进去。但截图有几个明显的问题：手机上看不清、想改一个音符就得重新截图、搜索引擎也搜不到图片里的内容。

我们的方案是：直接在 Markdown 里写音符，比如这样：

```
C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/2
```

网页打开后，插件会自动把这段文字变成好看的五线谱（SVG 矢量图，放大不模糊）。

### 整体架构

整个系统分三层，可以理解为一条流水线：

```
文字 --> [解析器] --> 结构化数据 --> [引擎] --> 坐标计算 --> [渲染器] --> 五线谱
```

具体来说：
1. **PureScript 解析器**：把用户输入的文字"翻译"成程序能理解的数据结构（AST）
2. **JS 引擎**：算出每个小节画在哪个位置、多宽多高
3. **VexFlow 渲染器**：调用 VexFlow 库，按坐标把五线谱画出来

```
  PureScript 解析器         JS 引擎            VexFlow 渲染器
  (编译期用 spago 打包)      (浏览器运行)        (画 SVG)
  
  "C4/4 G4/4"  --->  { measures: [...] }  --->  五线谱 SVG
```

---

## 二、PureScript 解析器（核心部分）

### 2.1 为什么不用 JavaScript 写解析器

先说结论：我选了 PureScript 这门比较小众的函数式语言来写核心的解析器，主要有三个原因。

**原因一：类型更严格，不容易出 bug**

PureScript 有一个叫"代数数据类型"（ADT）的东西。说白了就是：你可以告诉编译器，某个值只允许是几种情况之一。

比如变音记号，在 JS 里你可能写成字符串 `"sharp"`，但万一哪天手滑写成 `"shrp"`，运行时才会出错。PureScript 里是这样定义的：

```purescript
data Accidental = Sharp | Flat | Natural
```

这三个值就是全部的可能，写错一个字母编译都通不过。

再比如谱号：

```purescript
data Clef = Treble | Bass | Alto | Tenor | Percussion
```

如果以后要加一种新谱号，比如加了个 `Soprano`，但忘了在某个函数里处理它——编译器会直接报警告，告诉你"这里还有个情况没处理"。这叫做**穷尽性检查**，可以帮我们避免很多遗漏。

**原因二：纯函数，好测试**

PureScript 里的解析函数是纯函数——给同样的输入，永远返回同样的结果，不依赖任何外部状态：

```purescript
parseScore :: String -> Score
```

这意味着测试起来很方便，也不用担心"先调这个函数再调那个函数结果不一样"的问题。

**原因三：能直接编译成 JS**

PureScript 最终会编译成普通的 JavaScript 文件，浏览器可以直接用。我们用 `spago bundle-module` 命令打包，输出一个 JS 文件，里面导出一个 `parseMusicBlock` 函数。JS 端调用它就能拿到解析结果，过程对用户完全透明。

### 2.2 Parser Combinator 是什么

Parser Combinator 翻译过来就是"解析器组合子"。它的思路像搭积木——先写一堆小的解析器，每个只负责识别一小块内容，然后把它们拼起来组成完整的解析器。

举个例子，要解析 `C#4/8` 这样的音符，我拆成了这些小积木：

- `pitchParser`：识别音名 + 升降号 + 八度，也就是 `C#4` 这部分
- `durationParser`：识别时值，也就是 `/8` 这部分
- `noteParser`：把上面两个拼起来，识别一整个音符

**核心组合子（就是拼积木的工具）：**

`satisfy` -- 检查单个字符是否满足条件：

```purescript
letter <- satisfy (\c -> c >= 'A' && c <= 'G')
```

意思是：读一个字符，如果是 A 到 G 之间的就接受，否则报错。这就完成了"音名只能是 A-G"的限制。

`choice` + `try` -- 多选一：

```purescript
noteType <- choice [ try (string "r" *> pure Rest), pure Note ]
```

先尝试匹配 `r`（休止符），如果不是就当作普通音符。`try` 的作用是"试一下，不行就当没发生过"，让后面的选项还能继续尝试。

`optionMaybe` -- 可选内容：

```purescript
accidental <- optionMaybe $ choice
  [ try (char '#' *> pure Sharp)
  , try (char 'b' *> pure Flat)
  ]
```

变音记号（升号 `#` 或降号 `b`）不是必须有的，`optionMaybe` 就是"有就读，没有也行"。

`sepBy` -- 用分隔符隔开的列表：

```purescript
measureParser `sepBy` measureSeparator
```

一行代码就表达了"用竖线 `|` 分隔的多个小节"这个意思。

这种写法最大的好处就是**代码直接对应文法规则**，想改解析规则就改对应的小积木，不用去调复杂的正则表达式或者状态机。

### 2.3 解析的完整流程

用一个具体例子说明。假设输入是：

```
title: My Song
clef: bass
C#4/8 D5/4 | r/2
```

解析过程：

1. 先按行拆分，把 `title:` `clef:` 这些元数据提取出来
2. 剩下的 `C#4/8 D5/4 | r/2` 是音符部分
3. 按 `|` 拆成两段：`C#4/8 D5/4` 和 `r/2`
4. 每段分别用 `measureParser` 解析
5. `C#4/8` 被拆成：音名 C、升号 #、八度 4、时值 8
6. `r/2` 被识别为二分休止符

最终输出一个结构化对象（我们叫它 AST，抽象语法树）：

```javascript
{
  title: "My Song",
  clef: "bass",
  key: "C",
  time: "4/4",
  measures: [
    [{ noteType: "Note", pitch: { letter: 'C', accidental: "Sharp", octave: 4 }, duration: 8 },
     { noteType: "Note", pitch: { letter: 'D', accidental: "Natural", octave: 5 }, duration: 4 }],
    [{ noteType: "Rest", pitch: null, duration: 2 }]
  ]
}
```

### 2.4 扩展谱号很方便

目前支持 5 种谱号（高音、低音、中音、次中音、打击乐）。如果要加新谱号，只需改三个地方：

1. AST 里加一个新的值（比如 `Soprano`）
2. 加一行映射（`Soprano -> "soprano"`）
3. Parser 里加用户可以输入的名字

编译器会自动提醒你哪里漏改了，不用自己一个个去找。

---

## 三、JavaScript 引擎层

### 3.1 三个文件各管什么

| 文件 | 干什么 | 代码量 |
|------|--------|--------|
| renderer-v1.js | 页面入口：找到页面上所有需要渲染的音乐块 | ~60 行 |
| engine.js | 中间层：加载解析器 + 计算布局 | ~170 行 |
| renderer.js | 底层：调用 VexFlow 画五线谱 | ~140 行 |

调用关系是单向的：入口 -> 引擎 -> 渲染器，比较清晰。

### 3.2 布局算法

布局要解决的问题是："N 个小节，每个画在哪里？"

思路很简单，类似表格排列：

```
参数：
  每个小节宽 250px，每行放 4 个
  第一个小节因为要画谱号，所以多给 80px
  行与行之间间隔 87px
```

举个例子，8 个小节的布局：

```
第一行: [330px][250px][250px][250px]
第二行: [330px][250px][250px][250px]
```

每个小节的位置用简单的数学就能算出来：

```
第几列 = 当前小节编号 % 4
第几行 = 当前小节编号 / 4（向下取整）
x 坐标 = 根据列号累加宽度
y 坐标 = 行号 * 行高
```

这个计算对每个小节都是独立的，不需要遍历前面的小节来算，效率很高。

### 3.3 两套解析器的切换

为了保证可靠性，我们准备了两套解析器：

- **主解析器**：PureScript 写的，功能完整，从服务器用 fetch 下载
- **备用解析器**：JS 写的简化版，内置在代码里

流程是：先尝试加载主解析器，如果网络有问题或者文件不存在，就自动切换到备用的。用户感知不到区别，只是备用版的容错性稍差一些。

加载的时候还会检查拿回来的是不是真的 JS 文件（而不是 404 错误页面的 HTML），防止出意外。

### 3.4 引擎的设计

引擎用了 JS 的闭包来管理内部状态：

```javascript
export function createEngine(parserPath) {
  let parse = null, renderer = null; // 外面访问不到这两个变量

  async function initialize() { ... }       // 加载解析器
  async function parseAndRender() { ... }   // 解析 + 渲染

  return { initialize, parseAndRender };     // 只暴露两个方法
}
```

好处是：内部状态（用哪个解析器、渲染器实例）被保护起来了，外部代码不会不小心改到。而且初始化只会执行一次，重复调用不会有问题。

---

## 四、VexFlow 渲染

### 4.1 VexFlow 是什么

VexFlow 是一个开源的 JS 乐谱渲染库，能把音符数据画成 SVG 五线谱。我们用的是 v4 版本。

它主要有这几个对象：

```
Renderer  -- 创建 SVG 画布
Stave     -- 五线谱的一个小节（横线 + 谱号等）
StaveNote -- 一个音符或休止符
Voice     -- 把多个音符组成一拍
Formatter -- 自动计算音符之间的间距
```

### 4.2 渲染过程

我们用的是"单遍渲染"——遍历每个小节，立刻画出来，不用先收集全部再统一画。

对每个小节做四步：

```javascript
// 1. 根据编号算出画在哪
const x = ...; const y = ...;

// 2. 画五线谱框，第一小节加上谱号和拍号
const stave = new VF.Stave(x, y, width);
if (i === 0) stave.addClef('treble').addTimeSignature('4/4');
stave.setContext(ctx).draw();

// 3. 把 AST 里的音符转成 VexFlow 的音符对象
const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
voice.addTickables(notes);

// 4. 自动排版，然后画上去
new VF.Formatter().joinVoices([voice]).format([voice], width - 20);
voice.draw(ctx, stave);
```

AST 和 VexFlow 之间的转换也比较直接：

| 我们的 AST | VexFlow 写法 |
|-----------|-------------|
| 音名 C、八度 4、四分音符 | `new StaveNote({ keys: ['C/4'], duration: '4' })` |
| 休止符、四分 | `new StaveNote({ keys: ['b/4'], duration: '4r' })` |
| 升号 | `.addModifier(new Accidental('#'))` |

### 4.3 响应式适配

生成的 SVG 加了 CSS 样式 `max-width: 100%; height: auto`，在手机上会自动缩小，不会溢出屏幕。同时外层容器加了 `overflow: auto`，如果乐谱太宽也可以左右滑动。

---

## 五、和 Hugo 博客的集成

### 5.1 Markdown 怎么变成乐谱

Hugo（我用的博客框架）支持自定义代码块的渲染方式。我写了个模板，让 Hugo 碰到 ` ```music ` 这种代码块时，把内容塞进一个 `<div>` 里：

```html
<div class="vex-music-score" data-content="C4/4 G4/4 ..."></div>
```

然后页面加载后，JS 脚本会自动扫描这些 div，读取里面的内容，调用引擎解析和渲染。

### 5.2 完整流程

```
写 Markdown -> Hugo 编译成 HTML（代码块变成 div）
     -> 浏览器加载页面
     -> JS 找到所有 div
     -> 逐个解析 + 渲染
     -> 用户看到五线谱
```

---

## 六、构建与部署

PureScript 的构建很简单，一条命令：

```bash
spago bundle-module --main Main --to js/vex-music-parser.js
```

它会把所有 PureScript 代码编译打包成一个 JS 文件。

部署到博客时需要放这些文件：

| 文件 | 说哪干嘛 |
|------|---------|
| VexFlow v4 | 从 CDN 引入，不用本地放 |
| 3 个 JS 文件 | 放到博客的 static/js/ 目录 |
| parser.js | 也放 static/js/（构建产物） |
| 模板文件 | 放到 Hugo 的 layouts/_markup/ |

---

## 七、创新点

1. **用 PureScript 写前端解析器**：PureScript 是个比较小众的纯函数式语言，但它的类型系统在做文本解析时特别好用。和传统的正则表达式相比，Parser Combinator 的写法更直观、更不容易出错。

2. **代码即文法**：解析器的代码结构和你用 BNF/EBNF 写的文法规则几乎一一对应，想改语法规则，就改对应的代码片段，非常直接。

3. **主备解析器自动切换**：PureScript 解析器作为主力，JS 版作为备份。主解析器加载失败会自动降级，用户无感知。

4. **单遍渲染**：每个小节解析完就立刻画，不用先收集全部数据，代码更简单。

5. **谱号可扩展**：加新谱号只改几行代码，编译器会帮你检查有没有漏改的地方。

---

## 八、技术指标

| 指标 | 数值 |
|------|------|
| PureScript 核心代码 | ~210 行 |
| JavaScript 模块代码 | ~370 行 |
| 外部依赖 | VexFlow v4, purescript-parsing |
| 支持谱号 | 5 种 |
| 渲染方式 | SVG 矢量图 |
| 构建工具 | spago + Hugo |
