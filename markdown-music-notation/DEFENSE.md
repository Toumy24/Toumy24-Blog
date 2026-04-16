# markdown-music-notation 技术文档

> 面向高校答辩的详细技术介绍

---

## 一、项目概述

markdown-music-notation 是一个将 Markdown 纯文本解析并渲染为标准五线谱的博客插件。用户在 Markdown 代码块中写入简易的音符文本，插件自动完成词法分析、语法分析、布局计算和 SVG 渲染，最终在网页中展示可交互的乐谱。

### 1.1 解决的问题

传统博客插入乐谱的方式通常依赖图片截图或专业排版软件（如 LilyPond、MuseScore）导出。这些方式存在以下问题：

- 图片无法缩放，在移动端显示效果差
- 修改成本高，每次调整都需要重新截图
- 无法被搜索引擎索引，降低内容可发现性

本项目实现了从纯文本到矢量乐谱的全自动转换，用户只需在 Markdown 中书写：

```
C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/2
```

即可生成响应式 SVG 五线谱，无需任何外部工具。

### 1.2 技术架构

系统分为三层：

```
                            编译期                          运行期
  +-----------------+     spago      +-----------------+     fetch     +-----------------+
  | PureScript      | ------------> | CommonJS Module  | -----------> | JS Engine        |
  | Parser Combinator|   bundle     | (parser.js)      |   动态加载   | (engine.js)      |
  +-----------------+               +-----------------+               +---------+-------+
                                                                               |
                                                                        calcLayout()
                                                                               |
                                                                      +--------v--------+
                                                                      | VexFlow v4      |
                                                                      | SVG Renderer    |
                                                                      | (renderer.js)   |
                                                                      +-----------------+
```

---

## 二、PureScript 与 Parser Combinator

### 2.1 为什么选择 PureScript

PureScript 是一门编译到 JavaScript 的纯函数式语言，在本项目中有以下独特优势：

**类型安全的 ADT (代数数据类型)**

PureScript 的核心优势在于其强大的类型系统。本项目定义了一组 ADT 来精确描述乐谱的所有可能状态：

```purescript
data Accidental = Sharp | Flat | Natural
data NoteType   = Note | Rest
data Clef       = Treble | Bass | Alto | Tenor | Percussion
```

与 JavaScript 使用字符串（如 `"sharp"`、`"note"`）不同，ADT 在编译期就保证了值的合法性。对于 `Accidental` 类型，只有三种可能的值—— `Sharp`、`Flat`、`Natural` ——任何其他值都无法通过编译。这从根本上消除了运行时的非法状态。

在 pattern matching 中，编译器会检查穷尽性。如果漏写了一个分支：

```purescript
clefToString :: Clef -> String
clefToString Treble = "treble"
clefToString Bass   = "bass"
-- 编译器: Warning - 缺少 Alto / Tenor / Percussion 分支
```

这个特性在扩展谱号支持时极为重要——添加新的 `Clef` 构造器后，编译器会自动标记所有需要更新的位置。

**纯函数保证**

PureScript 强制区分纯函数和副作用。所有 Parser 函数都是纯函数，不依赖外部状态：

```purescript
parseScore :: String -> Score
```

输入相同的字符串，永远返回相同的 Score。这使得 parser 天然可测试、可缓存、可并行，且不会产生隐式的全局状态污染。

**与 JavaScript 生态的互操作**

PureScript 编译为标准 JavaScript，输出的 CommonJS 模块可直接被 JS 动态加载。`unsafeToForeign` 函数将 PureScript 的 Record 类型零成本转换为 JS 对象：

```purescript
parseMusicBlock :: String -> Foreign
parseMusicBlock input = unsafeToForeign (parseScore input)
```

Score record 的每个字段（String、Int、Array、Maybe）在编译后自然对应 JS 的原生类型，无需序列化/反序列化步骤。

### 2.2 Parser Combinator 范式

Parser Combinator 是函数式编程中的经典手法。其核心思想是：
- 每个 parser 是一个函数，消费输入文本的一部分，返回解析结果
- 通过组合子 (combinator) 将小 parser 组合成大 parser
- 代码结构直接映射文法规则，"代码即文法"

本项目使用 PureScript 的 `purescript-parsing` 库，以下是核心组合子及其在本项目中的应用：

**satisfy -- 谓词匹配**

```purescript
letter <- satisfy (\c -> c >= 'A' && c <= 'G')
```

`satisfy` 接受一个谓词函数 `Char -> Boolean`，当且仅当当前字符满足谓词时消费该字符并返回。这实现了音名 A-G 的词法约束。

**choice / try -- 分支回溯**

```purescript
noteType <- choice [ try (string "r" *> pure Rest), pure Note ]
```

`choice` 尝试多个 parser，返回第一个成功的结果。`try` 确保某个分支失败时不消费输入，从而允许后续分支重新匹配。这是实现 "休止符 vs 音符" 二选一的关键。

`try` 的重要性在于 Parser Combinator 默认是非回溯的——一旦消费了输入，就不能回退。`try` 将一个 parser 包装为原子操作：要么完全成功，要么完全回退。

**optionMaybe -- 可选匹配**

```purescript
accidental <- optionMaybe $ choice
  [ try (char '#' *> pure Sharp)
  , try (char 'b' *> pure Flat)
  , pure Natural
  ]
```

`optionMaybe` 将 parser 的结果包装为 `Maybe`，匹配失败时返回 `Nothing` 而非报错。变音记号和八度数字都是可选的，这个组合子完美建模了这种文法结构。

**sepBy -- 分隔列表**

```purescript
measureParser `sepBy` measureSeparator
```

`sepBy` 解析由分隔符隔开的重复元素。这一行代码表达了 "用 `|` 分隔的零到多个小节" 这一完整的文法规则。

### 2.3 完整的解析流水线

```
输入文本
   |
   v
按行拆分 -> 元数据提取 (title/key/time/clef)
   |              |
   v              v
音符行拼接    parseClef() -- 谱号标准化
   |
   v
按 "|" 分割 -> measureParser (每段独立解析)
   |
   v
noteParser -> pitchParser + durationParser
   |
   v
Score AST { title, clef, key, time, measures: [[Note]] }
```

以输入 `C#4/8 D5/4 | r/2` 为例，解析过程：

1. `noteParser` 匹配到 `C`，识别为 Note
2. `pitchParser` 消费 `C` (letter) -> `#` (Sharp) -> `4` (octave)
3. `durationParser` 消费 `/8`，返回 8
4. 第一个音符解析完成：`{ noteType: Note, pitch: { letter: 'C', accidental: Sharp, octave: 4 }, duration: 8 }`
5. `skipSpaces` 跳过空白
6. 第二个音符 `D5/4` 同理解析
7. `measureSeparator` 匹配 `|`
8. `noteParser` 匹配 `r`，识别为 Rest，`/2` 得到 duration=2
9. 最终输出两个小节的 Score AST

### 2.4 谱号扩展设计

谱号系统采用集中映射模式。扩展新谱号只需三步：

1. 在 `AST.purs` 的 `Clef` ADT 添加构造器
2. 在 `clefToString` 添加映射
3. 在 `Parser.purs` 的 `parseClef` 添加用户输入别名

编译器会自动检查步骤 2 的穷尽性。JS 端的 `normalizeClef` 函数做同步更新即可。整个流程不涉及正则表达式修改或状态机变更。

---

## 三、JavaScript 引擎层

### 3.1 三模块职责分离

| 模块 | 文件 | 职责 | 代码量 |
|------|------|-----|--------|
| Entry | renderer-v1.js | DOM 扫描、生命周期管理 | ~60 行 |
| Engine | engine.js | 配置、布局、加载、协调 | ~170 行 |
| Renderer | renderer.js | VexFlow API 调用 | ~140 行 |

依赖方向严格单向：Entry -> Engine -> Renderer，无循环依赖。

### 3.2 布局算法

布局算法将小节数量映射为二维坐标网格。核心数据结构：

```javascript
CONFIG = {
  baseStaveWidth: 250,   // 普通小节宽度
  measuresPerLine: 4,    // 每行小节数
  lineHeight: 87,        // 行间距
  clefSpaceWidth: 80,    // 首小节额外宽度
  padding: 10,           // 画布内边距
}
```

对于 N 个小节，布局计算如下：

```
firstMeasureWidth = baseStaveWidth + clefSpaceWidth = 330px
otherMeasureWidth = baseStaveWidth = 250px

totalWidth = 330 + 250 * 3 = 1080px  (以4小节/行为例)
totalHeight = 87 * ceil(N / 4)
```

每个小节的坐标由行列位置决定：

```
col = i % measuresPerLine
x = col == 0 ? padding : padding + firstMeasureWidth + (col-1) * otherMeasureWidth
y = padding + floor(i / measuresPerLine) * lineHeight
```

这是一个分段线性函数：每行首小节预留谱号空间，其余小节等宽排列。该算法的时间复杂度为 O(1)——每个小节的坐标计算仅需常数次算术运算。

### 3.3 Parser 加载策略

系统采用主备双 parser 架构：

```
fetch(parser.js)
      |
      v
  HTTP 200? ─── No ──> fallbackParser (JS 内置)
      |
     Yes
      |
      v
  内容检测 (防 HTML 注入)
      |
      v
  CommonJS 沙箱执行
      |
      v
  parseMusicBlock 函数可用
```

PureScript 编译的 parser 通过 CommonJS 沙箱加载：

```javascript
const mod = { exports: {} };
new Function('module', 'exports', code)(mod, mod.exports);
```

`new Function` 创建了一个隔离的函数作用域，模拟 Node.js 的 `require` 环境。这比 `eval` 更安全——不能访问创建时的词法作用域。

当 parser 加载失败时（网络错误、CDN 故障等），系统自动降级到内置的 `fallbackParser`。该 parser 用纯 JavaScript 实现了与 PureScript 版本兼容的解析逻辑，确保核心功能不受外部依赖影响。

### 3.4 引擎工厂模式

`createEngine()` 使用闭包模式封装引擎状态：

```javascript
export function createEngine(parserPath) {
  let parse = null, renderer = null, pending = null;

  async function initialize() {
    if (renderer) return;        // 已初始化，直接返回
    if (pending) return pending; // 正在初始化，返回同一 Promise
    pending = (async () => { ... })();
    return pending;
  }

  return { initialize, parseAndRender };
}
```

三个关键设计：

1. **闭包隐藏**：`parse`、`renderer`、`pending` 对外不可访问，避免外部篡改
2. **Promise 幂等**：`pending` 变量确保多次调用 `initialize()` 只执行一次实际初始化
3. **懒加载**：parser 在首次渲染时才加载，不阻塞页面初始加载

---

## 四、VexFlow 渲染管线

### 4.1 VexFlow 对象模型

VexFlow v4 的核心对象层级：

```
Renderer (SVG 后端)
  |
  v
Context (SVG 绘图上下文)
  |
  v
Stave (五线谱小节框)
  |-- addClef()           谱号
  |-- addTimeSignature()  拍号
  |-- addKeySignature()   调号
  |
  v
Voice (拍组)
  |-- addTickables([StaveNote])  音符序列
  |
  v
Formatter (排版引擎)
  |-- joinVoices()  合并声部
  |-- format()      计算间距
```

### 4.2 单遍渲染算法

本系统采用单遍算法替代 VexFlow 官方示例中常见的双遍算法：

**双遍算法**（传统）：
1. 第一遍：创建所有 Stave 和 Voice，存入数组
2. 第二遍：统一调用 Formatter，再逐个绘制

**单遍算法**（本项目）：
1. 对每个小节依次执行：创建 -> 格式化 -> 绘制

```javascript
ast.measures.forEach((measure, i) => {
  // 1. 计算坐标
  const col = i % layout.measuresPerLine;
  const x = col === 0 ? layout.padding
    : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;
  const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

  // 2. 创建并绘制 Stave
  const stave = new VF.Stave(x, y, w);
  if (i === 0) stave.addClef(clef).addTimeSignature(time).addKeySignature(key);
  stave.setContext(ctx).draw();

  // 3. 创建 Voice、格式化并绘制
  const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
  voice.addTickables(this._notes(measure));
  new VF.Formatter().joinVoices([voice]).format([voice], w - 20);
  voice.draw(ctx, stave);
});
```

单遍算法的优势：
- 内存效率：无需分配中间数组存储所有小节对象
- 代码简洁：单个循环完成全部工作
- 可流式渲染：理论上可以在解析完每个小节后立即渲染，无需等待全部解析完成

### 4.3 音符映射

AST 到 VexFlow StaveNote 的映射规则：

| AST | VexFlow |
|-----|---------|
| `{ noteType: "Note", pitch: { letter: 'C', octave: 4 }, duration: 4 }` | `new StaveNote({ keys: ['C/4'], duration: '4' })` |
| `{ noteType: "Rest", duration: 4 }` | `new StaveNote({ keys: ['b/4'], duration: '4r' })` |
| `accidental: "Sharp"` | `.addModifier(new Accidental('#'), 0)` |
| `accidental: "Flat"` | `.addModifier(new Accidental('b'), 0)` |

休止符的 `keys: ['b/4']` 是 VexFlow 约定——休止符需要一个参考位置确定在五线谱中的垂直位置，`b/4` 将其放置在第三线中央。

### 4.4 响应式 SVG

渲染后的 SVG 通过以下样式实现响应式布局：

```javascript
container.style.cssText = 'overflow:auto;max-width:100%';
svg.style.maxWidth = '100%';
svg.style.height = 'auto';
```

这确保了乐谱在桌面端完整显示，在移动端自动缩放且可左右滚动查看细节。

---

## 五、Hugo 集成

### 5.1 Markdown 代码块钩子

Hugo 的 `render-codeblock-music.html` 模板将 Markdown 的 fenced code block 转换为 DOM 元素：

```html
<div class="vex-music-score"
     data-content="{{ .Inner | htmlEscape }}">
</div>
```

当 Hugo 遇到 ` ```music ` 代码块时，自动调用此模板。`.Inner` 包含代码块的原始内容，`htmlEscape` 对 HTML 特殊字符进行转义（防止 XSS）。

### 5.2 运行时流程

完整的渲染流程：

```
1. Hugo 编译期：
   ```music ... ``` -> <div class="vex-music-score" data-content="...">

2. 浏览器加载：
   head.html 加载 VexFlow CDN + renderer-v1.js (ES Module)

3. DOM Ready：
   renderer-v1.js 扫描 .vex-music-score 元素

4. 逐个渲染：
   data-content -> engine.parseAndRender() -> SVG 乐谱

5. 清理：
   移除原始 <div>，仅保留渲染后的乐谱容器
```

---

## 六、构建与部署

### 6.1 PureScript 构建

```bash
spago bundle-module --main Main --to js/vex-music-parser.js
```

此命令将 PureScript 源码编译为单个 CommonJS 模块。`--main Main` 指定入口模块，`--to` 指定输出路径。构建产物是纯 JavaScript，不依赖 Node.js 运行时。

### 6.2 部署清单

| 文件 | 部署位置 | 加载方式 |
|------|---------|---------|
| vexflow@4 | CDN | `<script>` 标签 |
| vex-music-renderer-v1.js | static/js/ | `<script type="module">` |
| vex-music-engine.js | static/js/ | ES Module import |
| vex-music-renderer.js | static/js/ | ES Module import |
| vex-music-parser.js | static/js/ | fetch + CommonJS 沙箱 |
| render-codeblock-music.html | layouts/_markup/ | Hugo 自动调用 |

---

## 七、创新点总结

1. **PureScript 在前端解析中的应用**：使用 PureScript 这一小众但强大的纯函数式语言实现核心 parser，利用其类型系统和 ADT 保证了解析逻辑的正确性和可扩展性。相比 JavaScript 的正则表达式方案，Parser Combinator 更具可读性、可组合性和类型安全性。

2. **纯函数式 Parser Combinator**："代码即文法"的范式使解析规则可以像数学公式一样组合，`satisfy`、`choice`、`sepBy` 等组合子直接映射 EBNF 文法，降低了文法修改的心智负担。

3. **主备双 Parser 降级策略**：PureScript parser 作为主 parser 提供完整的语法检测能力，JavaScript fallback parser 在主 parser 不可用时保证基本功能，系统可用性达到 100%。

4. **单遍渲染算法**：相比传统的双遍算法，减少了中间状态的内存分配，代码复杂度更低。

5. **声明式谱号扩展**：通过 ADT + 集中映射表实现谱号的声明式扩展，编译器自动检查穷尽性，杜绝了遗漏分支的可能。

---

## 八、技术指标

| 指标 | 数值 |
|------|------|
| PureScript 核心代码 | ~210 行 (AST + Parser + Main) |
| JavaScript 模块代码 | ~370 行 (Engine + Renderer + Entry) |
| 外部依赖 | VexFlow v4 (CDN), purescript-parsing |
| 支持谱号 | 5 种 (treble/bass/alto/tenor/percussion) |
| Parser 类型 | Parser Combinator (递归下降) |
| 渲染后端 | SVG (矢量, 无限缩放) |
| 构建工具 | spago (PureScript), Hugo (SSG) |
