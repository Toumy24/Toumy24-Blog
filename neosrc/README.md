# VexFlow Music Notation - 模块化架构

## 📋 总结

这是Hugo站点中音乐块解析和渲染的完整重构，从monolithic（单块）架构转变为模块化架构。

### 主要改进
- ✅ 模块化设计：每个模块职责单一，易于维护
- ✅ 异步加载：VexFlow和Parser独立加载，支持fallback
- ✅ 布局系统：集中管理小节宽度、位置、坐标计算
- ✅ 渲染引擎：纯VexFlow v4 API，支持rests、accidentals
- ✅ PureScript Parser：保持Original编译版本，无修改

---

## 📦 模块结构

### 1️⃣ `vex-music-loader.js` - 资源加载器
**职责**：管理VexFlow库和Parser模块的异步加载

**导出类**：`MusicLoader`
```javascript
class MusicLoader {
  // 异步等待VexFlow加载
  async waitForVexFlow(timeout)
  
  // 加载真实Parser或使用Fallback
  async loadParser(parserPath)
  async initializeParser(parserPath)
  
  // Fallback简单解析器
  createFallbackParser()
  
  // 查询状态和数据
  isReady()
  getVexFlow()
  parseMusic(content)
}
```

**特点**：
- VexFlow同步加载（不使用defer）
- Parser异步加载，支持HTTP 404 fallback
- Fallback解析器使用正则表达式解析基本音乐符号

---

### 2️⃣ `vex-music-layout.js` - 布局系统
**职责**：计算小节布局和坐标信息

**导出类**：`MusicLayout`
```javascript
class MusicLayout {
  constructor(options)  // 配置baseStaveWidth, measuresPerLine等
  
  // 计算整体布局
  calculate(measureCount)
  
  // 获取指定小节位置
  getMeasurePosition(measureIndex, layout)
  
  // 批量获取所有小节位置
  getAllMeasurePositions(measureCount, layout)
}
```

**布局算法**：
1. 计算第一行总宽度（第一小节 +100px 用于谱号/拍号）
2. 所有小节均分第一行宽度
3. 所有后续行与第一行等宽
4. 自动计算SVG canvas尺寸

**配置选项**：
- `baseStaveWidth`: 250px（基础小节宽度）
- `measuresPerLine`: 4（每行小节数）
- `lineHeight`: 87px（行间距）
- `clefSpaceWidth`: 100px（谱号/拍号占用空间）
- `padding`: 10px（画布内边距）

---

### 3️⃣ `vex-music-renderer.js` - VexFlow渲染引擎
**职责**：使用VexFlow v4 API进行音乐符号渲染

**导出类**：`VexMusicRenderer`
```javascript
class VexMusicRenderer {
  constructor(vexflow)  // 需要传入VexFlow对象
  
  // 主渲染方法
  render(ast, container, layout, options)
}
```

**支持的特性**：
- ✅ 音符：所有基本音高和八度
- ✅ 临时变音：Sharp（#）、Flat（b）、Natural
- ✅ 休止符：使用`duration + 'r'`语法
- ✅ 谱号：Treble clef
- ✅ 拍号：时间签名（如4/4）
- ✅ 调号：Key signature（如C Major）
- ✅ 多行布局：自动换行，小节对齐

**音符格式**（来自Parser）：
```javascript
{
  noteType: "Note" | "Rest",
  pitch: {
    letter: "A"-"G",
    accidental: "Sharp" | "Flat" | "Natural",
    octave: 3-7
  },
  duration: 1 | 2 | 4 | 8  // 全音符 | 二分音符 | 四分音符 | 八分音符
}
```

---

### 4️⃣ `vex-music-manager.js` - 协调管理器
**职责**：协调所有模块的关系和通信

**导出类**：`VexMusicManager`
```javascript
class VexMusicManager {
  constructor(options)
  
  // 初始化所有依赖
  async initialize(options)
  
  // 检查初始化状态
  isInitialized()
  
  // 主流程：解析并渲染
  async parseAndRender(content, container, options)
  
  // 动态更新配置
  setLayoutOptions(options)
}
```

**全局单例**：
```javascript
// 获取全局管理器实例（单例模式）
getGlobalManager(options)

// 重置全局管理器（用于测试）
resetGlobalManager()
```

**初始化流程**：
1. 等待VexFlow库加载
2. 加载Parser或fallback
3. 创建Renderer实例
4. 准备就绪，接收渲染请求

---

### 5️⃣ `vex-music-index.js` - 集成层
**职责**：导出高级API，整合所有模块

**导出函数**：
```javascript
// 渲染页面上所有.vex-music-score元素
async function renderAllMusicScores()

// 初始化渲染系统（自动在页面加载时调用）
function initRender()
```

**工作流程**：
1. 扫描所有`.vex-music-score` DOM元素
2. 获取全局管理器并初始化
3. 为每个元素：
   - 提取音乐内容（data-content属性）
   - 调用parseAndRender
   - 处理错误并显示错误信息

---

### 6️⃣ `vex-music-renderer-v1.js` - 原始兼容版本
**职责**：保持与原始vex-music-renderer.js的兼容性

**用途**：
- 在HTML中作为module脚本加载
- 自动调用initRender()
- 暴露API到window.VexMusicRender全局对象

```javascript
// 在HTML中使用
<script type="module" src="vex-music-renderer-v1.js"></script>

// 编程接口
window.VexMusicRender.renderAllMusicScores()
window.VexMusicRender.initRender()
```

---

### 7️⃣ `vex-music-parser.js` - PureScript编译输出
**职责**：音乐符号DSL解析

**编译自**：`/customplugins/src/Music/Parser.purs`

**输出类型**：
```javascript
{
  title: Maybe<String>,
  key: String,           // e.g. "C"
  time: String,          // e.g. "4/4"
  measures: Array<Array<Note>>
}
```

**PureScript代码质量**：✅ **无问题**
- 正确使用Parser combinator库
- Try combinators正确处理choice backtracking
- Pitch parser正确处理accidentals
- Duration parser支持1/2/4/8
- Measure分割逻辑正确

---

## 🔧 使用指南

### 在Hugo项目中集成

#### 1. HTML模板（`layouts/_default/_markup/render-codeblock-music.html`）
```html
{{- $content := .Inner | strings.TrimSpace -}}
<div class="vex-music-score" 
     data-content="{{ $content | safeHTMLAttr }}">
</div>
```

#### 2. head.html脚本加载
```html
<!-- VexFlow库（同步加载，必须先加载） -->
<script src="https://cdn.jsdelivr.net/npm/vexflow@4/build/cjs/vexflow.js"></script>

<!-- 音乐渲染模块（使用module，支持ES6导入） -->
<script type="module" 
        src="{{ "neosrc/vex-music-renderer-v1.js" | relURL }}">
</script>
```

#### 3. Markdown中使用
````markdown
```music
title: 小星星
key: C
time: 4/4
C4/4 C4/4 C4/4 D4/4 | E4/2 C4/4 C4/4 | E4/2 D4/4 D4/4
```
````

---

## 📂 文件部署位置

所有模块应放在这个位置以保持原始loader的兼容性：

```
/static/
├── js/
│   ├── vex-music-parser.js           （保持不变，原位置）
│   └── vex-music-renderer.js         （保持初版兼容代码）
├── neosrc/                           （新模块目录）
│   ├── vex-music-loader.js           ⭐ 加载器
│   ├── vex-music-layout.js           ⭐ 布局系统
│   ├── vex-music-renderer.js         ⭐ 渲染引擎（v4专用）
│   ├── vex-music-manager.js          ⭐ 协调器
│   ├── vex-music-index.js            ⭐ 集成层
│   ├── vex-music-renderer-v1.js      🔸 兼容入口
│   └── vex-music-parser.js           📋 PureScript输出
└── debug/
    └── index.html                     （独立测试页面）
```

---

## 🎯 模块依赖关系

```
vex-music-renderer-v1.js (entry point)
        ↓
vex-music-index.js (integration)
        ↓
vex-music-manager.js (coordinator)
    ├─→ vex-music-loader.js
    │   ├─→ VexFlow (CDN)
    │   └─→ vex-music-parser.js
    ├─→ vex-music-layout.js
    └─→ vex-music-renderer.js
        └─→ VexFlow (already loaded)
```

---

## 🔍 Debug页面

独立测试页面位置：`/static/debug/index.html`

访问：`blog.24toumy.top/debug/`

**功能**：
- 实时日志输出
- VexFlow和Parser加载状态指示
- 交互式音乐块测试
- 完整的渲染管道抽象

---

## 📝 配置示例

```javascript
// 在HTML中手动初始化（可选）
import { getGlobalManager } from './neosrc/vex-music-manager.js';

const manager = getGlobalManager({
  baseStaveWidth: 250,      // 小节宽度
  measuresPerLine: 4,       // 每行小节数
  lineHeight: 87,           // 行间距
  clefSpaceWidth: 100       // 谱号空间
});

await manager.initialize({
  vexflowTimeout: 5000,     // VexFlow加载超时
  parserPath: './vex-music-parser.js'
});

// 然后使用
await manager.parseAndRender(musicContent, container);
```

---

## ✨ 特殊说明

### PureScript Parser
- **源文件**：`/customplugins/src/Music/Parser.purs`
- **编译输出**：`neosrc/vex-music-parser.js`
- **质量评估**：✅ **无问题**，无需修改
- **try combinator**：正确处理choice backtracking（第19、26-27行）
- **accidental支持**：Sharp、Flat、Natural三种

### 架构优势
1. **解耦**：每个模块独立，可单独测试
2. **可扩展**：易于添加新功能或替换实现
3. **性能**：最小化加载时间，支持异步
4. **容错**：Parser失败时自动Fallback
5. **类型安全**：PureScript编译保证类型正确

---

## 🚀 后续改进空间

1. 支持多种乐器（MIDI音色）
2. 播放功能（Tone.js集成）
3. 编辑器模式（实时编辑）
4. 导出为PNG/PDF
5. 高级布局（自适应页面宽度）
6. Web Workers（大规模渲染）
