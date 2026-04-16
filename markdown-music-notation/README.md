# markdown-music-notation

在 Markdown 中书写乐谱，在 Hugo / Hexo 博客中渲染为标准五线谱。

## 技术栈

- **PureScript** -- Parser Combinator 词法/语法分析器，将纯文本解析为乐谱 AST
- **VexFlow v4** -- 开源乐谱渲染引擎，将 AST 渲染为 SVG
- **JavaScript (ES Module)** -- 引擎层 + 渲染层 + 入口层

## 快速开始

### 1. 构建 Parser (需要 PureScript 工具链)

```bash
# 安装 PureScript 和 spago
npm install -g purescript spago

# 在项目根目录
spago install
spago bundle-module --main Main --to js/vex-music-parser.js
```

### 2. 部署到 Hugo 博客

复制以下文件到博客对应目录：

```
js/                              -> static/js/
  vex-music-engine.js
  vex-music-renderer.js
  vex-music-renderer-v1.js
  vex-music-parser.js             (spago 构建产物)
layouts/_markup/
  render-codeblock-music.html    -> layouts/_default/_markup/
```

在 Hugo 的 `head.html` partial 中添加：

```html
<script src="https://cdn.jsdelivr.net/npm/vexflow@4/build/cjs/vexflow.js"></script>
<script type="module" src="{{ "js/vex-music-renderer-v1.js" | relURL }}"></script>
```

### 3. 在 Markdown 中使用

````markdown
```music
title: Twinkle Twinkle Little Star
key: C
time: 4/4
clef: treble
C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/2 | F4/4 F4/4 E4/4 E4/4 | D4/4 D4/4 C4/2
```
````

## 输入格式

### 元数据行 (可选)

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `title:` | (无) | 乐谱标题 |
| `key:` | C | 调号 (C, G, D, F, Bb 等) |
| `time:` | 4/4 | 拍号 |
| `clef:` | treble | 谱号 (treble/bass/alto/tenor/percussion) |

### 音符格式

```
音名[变音][八度][/时值]
```

- 音名: A-G
- 变音: `#` (升) 或 `b` (降)，可省略
- 八度: 3-7，默认 4
- 时值: `/1` 全音符, `/2` 二分, `/4` 四分, `/8` 八分，默认 `/4`
- 休止符: `r/4` (四分休止符)
- 小节分隔: `|`

### 谱号支持

| 输入 | 谱号 |
|------|------|
| `treble` 或 `g` | 高音谱号 |
| `bass` 或 `f` | 低音谱号 |
| `alto` 或 `c` | 中音谱号 |
| `tenor` | 次中音谱号 |
| `percussion` 或 `perc` | 打击乐谱号 |

## 布局配置

修改 `js/vex-music-engine.js` 中的 `CONFIG` 对象：

```javascript
export const CONFIG = {
  baseStaveWidth: 250,   // 普通小节宽度 (px)
  measuresPerLine: 4,    // 每行小节数
  lineHeight: 87,        // 行间距
  clefSpaceWidth: 80,    // 首小节额外宽度 (谱号区域)
  padding: 10,           // 画布内边距
};
```

## 项目结构

```
markdown-music-notation/
  src/                    PureScript 源码
    Main.purs               JS FFI 入口
    Music/
      AST.purs              乐谱抽象语法树类型定义
      Parser.purs           Parser Combinator 解析器
  js/                     JavaScript 模块
    vex-music-engine.js     配置 + 布局 + 加载 + 协调
    vex-music-renderer.js   VexFlow v4 SVG 渲染
    vex-music-renderer-v1.js  博客入口 (DOM 扫描 + 自动渲染)
    vex-music-parser.js     (构建产物，需 spago bundle)
  layouts/_markup/
    render-codeblock-music.html  Hugo 模板
  debug/
    index.html              调试测试页面
```

## 适配 Hexo

Hexo 的代码块渲染钩子不同，需要创建一个 tag plugin：

```javascript
// scripts/music.js
hexo.extend.tag.register('music', function(args, content) {
  return '<div class="vex-music-score" data-content="' + content.trim() + '"></div>';
}, { ends: true });
```

其余 JS 文件和 VexFlow CDN 引入方式与 Hugo 相同。

## License

MIT
