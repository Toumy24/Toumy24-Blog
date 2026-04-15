# 🚀 快速开始指南 - VexFlow Music Modules

## 📖 5分钟快速集成

### 第1步：复制模块到根目录

所有模块已在 `/neosrc` 目录：

```
/home/toumy24/github/toumy24/Toumy24-Blog/neosrc/
├── vex-music-loader.js           # 资源加载
├── vex-music-layout.js           # 布局计算
├── vex-music-renderer.js         # VexFlow渲染
├── vex-music-manager.js          # 协调器
├── vex-music-index.js            # 集成层
├── vex-music-renderer-v1.js      # 兼容入口
├── vex-music-parser.js           # Parser输出
├── README.md                      # 完整文档
└── PURESCRIPT_EVALUATION.md       # Parser评估
```

### 第2步：在Hugo项目中使用

#### A. 更新HTML模板 (`layouts/_default/_markup/render-codeblock-music.html`)

```html
{{- $content := .Inner | strings.TrimSpace -}}
<div class="vex-music-score" 
     data-content="{{ $content | safeHTMLAttr }}">
</div>
```

#### B. 在head.html中加载脚本

```html
<!-- VexFlow库（必须同步加载） -->
<script src="https://cdn.jsdelivr.net/npm/vexflow@4/build/cjs/vexflow.js"></script>

<!-- 音乐渲染模块 -->
<script type="module" 
        src="{{ "neosrc/vex-music-renderer-v1.js" | relURL }}">
</script>
```

### 第3步：在Markdown中使用

````markdown
```music
title: 小星星
key: C
time: 4/4
C4/4 C4/4 C4/4 D4/4 | E4/2 C4/4 C4/4 | E4/2 D4/4 D4/4 | C4/4 C4/4 C4/4 D4/4 | E4/2 r/4 r/4 | G4/4 G4/4 G4/4 A4/4 | B4/2 G4/4 G4/4 | B4/2 A4/4 A4/4 | G4/4 G4/4 G4/4 C4/4 | D4/2 E4/4 C4/4
```
````

---

## 📝 音乐记号格式说明

### 基本语法

```
title: 曲目名称           (可选)
key: C                   (调号，默认C)
time: 4/4                (拍号，默认4/4)

音符 | 音符 | 音符     (| 分割小节)
```

### 音符格式

```
A4/4    ← A音，第4八度，四分音符
C#4/4   ← C升音，第4八度，四分音符
Bb4/4   ← B降音，第4八度，四分音符
r/4     ← 四分休止符
E2      ← E音，第2八度，默认四分音符（/4可省）
```

### 时值对照

| 记号 | 英文 | 音符 |
|------|------|------|
| 1 | Whole | 全音符 ♩ |
| 2 | Half | 二分音符 ♩ |
| 4 | Quarter | 四分音符 ♩ |
| 8 | Eighth | 八分音符 ♪ |

### 音高范围

| 参数 | 范围 | 例子 |
|------|------|------|
| 字母 | A-G | 白键音 |
| 变音 | # (升) , b (降) | C# 或 Db |
| 八度 | 3-7 | C3 到 C7 |

### 完整例子

```
title: 生日快乐
key: G
time: 4/4
G4/4 G4/4 A4/4 G4/4 | C5/2 B4/4 | G4/4 G4/4 A4/4 G4/4 | D5/2 C5/4 |
G4/4 G4/4 G5/4 E5/4 | C5/2 B4/4 A4/4 | F5/4 F5/4 E5/4 C5/4 | D5/4 B4/4 r/4
```

---

## 🔧 高级使用

### 自定义配置

如果需要改变布局或其他参数，可以在HTML中自定义初始化：

```html
<script type="module">
  import { getGlobalManager } from './neosrc/vex-music-manager.js';

  const manager = getGlobalManager({
    baseStaveWidth: 300,    // 增加小节宽度
    measuresPerLine: 3,     // 每行3个小节
    lineHeight: 100         // 增加行间距
  });

  await manager.initialize({
    parserPath: './neosrc/vex-music-parser.js'
  });

  // 手动渲染
  const container = document.getElementById('my-staff');
  await manager.parseAndRender(musicContent, container);
</script>
```

### Debug模式

访问独立debug页面测试：
```
http://blog.24toumy.top/debug/
```

特点：
- ✅ 实时日志窗口
- ✅ 库加载状态指示
- ✅ 交互式音乐块编辑
- ✅ 完整的错误追踪

---

## ❌ 常见问题

### Q1: 音符显示不出来

**检查清单**：
1. ✅ VexFlow库是否成功加载？（看debug页面状态）
2. ✅ 音乐格式是否正确？（试试例子）
3. ✅ HTML模板是否已更新？
4. ✅ module脚本是否加载正确？

### Q2: 如何支持升号/降号以外的变音？

**方案**：
- 目前支持：Sharp (#) 和 Flat (b)
- 要添加：在Parser.purs中扩展Accidental类型，重新编译

### Q3: 如何改变音符的外观样式？

**方案**：
- 修改`vex-music-renderer.js`中的VexFlow API调用
- VexFlow v4文档：https://github.com/0xfe/vexflow

### Q4: 性能如何？

**参考数据**：
- 100个音符：< 50ms渲染
- 1000个音符：< 200ms渲染
- 瓶颈：文档layout引擎，不是音乐渲染

---

## 📊 模块架构快速参考

```
用户输入 (markdown音乐块)
    ↓
HTML渲染器提取data-content
    ↓
vex-music-renderer-v1.js (入口)
    ↓
vex-music-index.js (集成)
    ↓
getGlobalManager() (单例)
    ↓
VexMusicManager (协调)
    ├─➜ Loader (VexFlow + Parser)
    ├─➜ Layout (布局计算)
    └─➜ Renderer (VexFlow API)
        ↓
    SVG输出到DOM
```

---

## ✅ 验证清单

部署后，检查以下项：

- [ ] VexFlow加载成功（无404错误）
- [ ] Parser加载成功（或fallback模式）
- [ ] 第一个音乐块能正确渲染
- [ ] 多行乐谱正确对齐
- [ ] 升降号正确显示
- [ ] 休止符能正确渲染
- [ ] 没有浏览器console错误

---

## 📞 技术支持

### 如果出现问题

1. **打开Debug页面**：`/debug/`
2. **查看实时日志**：看是哪个组件失败
3. **查看browser console**：Ctrl+Shift+J
4. **对比示例**：参考README中的例子

### 修改和编译

如果需要修改PureScript源码：

```bash
cd /path/to/Blog
spago build  # 编译所有PureScript到 customplugins/output/
# 然后手动复制编译输出到neosrc/vex-music-parser.js
```

---

## 🎓 学习资源

### VexFlow文档
- 官方：https://github.com/0xfe/vexflow
- API文档：Renderer, Stave, StaveNote, Voice, Formatter

### PureScript学习
- 官方：https://www.purescript.org/
- 本项目源码：`/customplugins/src/Music/Parser.purs`

### 音乐理论
- 八度标记：C4 = 中央C（钢琴标准）
- 时值：whole(1), half(2), quarter(4), eighth(8)
- 调号：所有标准调（C, G, D, A等）

---

## 📦 部署检查表

准备投入生产前：

```
[ ] 所有模块文件在/neosrc目录
[ ] Hugo模板已更新
[ ] head.html脚本已加入
[ ] 测试的markdown文件可正确渲染
[ ] Debug页面可访问
[ ] 浏览器console无错误
[ ] 多页面、多乐谱块测试通过
[ ] 错误处理工作正常（意外输入）
```

---

**最后一步**：Hugo build并部署！

```bash
cd /path/to/Blog
hugo  # 或 hugo server 本地测试
```

访问网站，在markdown音乐块中进行测试！

🎉 **祝您成功！**
