# markdown-music-notation PPT 大纲

---

## 第一部分：项目介绍

### 项目背景与目标
- 博客插入乐谱的传统方式：截图、外部工具导出
- 痛点：不可缩放、修改成本高、无法索引
- 目标：Markdown 纯文本 -> 矢量五线谱，开箱即用

### 效果展示
- 输入示例
- 渲染结果截图（桌面端 / 移动端对比）

---

## 第二部分：技术架构

### 整体架构
- 三层架构：PureScript Parser -> JS Engine -> VexFlow Renderer
- 编译期 (spago bundle) vs 运行期 (浏览器)
- 模块依赖：renderer-v1.js -> engine.js -> renderer.js

### 技术选型理由
- PureScript：纯函数式、强类型、ADT、编译到 JS
- VexFlow v4：成熟的开源乐谱渲染库、SVG 后端
- Hugo：静态站点生成器、代码块钩子机制

---

## 第三部分：PureScript 核心算法（重点）

### 抽象语法树 (AST) 设计

代码片段 1 -- AST 核心类型定义：

```purescript
data Accidental = Sharp | Flat | Natural
data NoteType   = Note | Rest
data Clef       = Treble | Bass | Alto | Tenor | Percussion

type Pitch = { letter :: Char, accidental :: Accidental, octave :: Int }
type Note  = { noteType :: NoteType, pitch :: Maybe Pitch, duration :: Int }
type Score = { title :: Maybe String, clef :: String, key :: String,
               time :: String, measures :: Array (Array Note) }
```

要点讲解：
- ADT 代数数据类型 vs JavaScript 字符串枚举
- 编译器穷尽性检查示例
- Maybe 类型处理可选值，替代 null

### Parser Combinator 核心

代码片段 2 -- 音符解析器：

```purescript
noteParser :: Parser String Note
noteParser = do
  skipSpaces
  noteType <- choice [ try (string "r" *> pure Rest), pure Note ]
  pitch <- case noteType of
    Rest -> pure Nothing
    Note -> Just <$> pitchParser
  skipSpaces
  duration <- optionMaybe (char '/' *> durationParser) >>= pure <<< fromMaybe 4
  pure { noteType, pitch, duration }
```

要点讲解：
- do notation：顺序组合多个 parser
- choice + try：分支匹配与回溯
- optionMaybe：可选元素的优雅处理
- "代码即文法"：代码结构直接对应 EBNF

代码片段 3 -- 音高解析器：

```purescript
pitchParser :: Parser String Pitch
pitchParser = do
  letter <- satisfy (\c -> c >= 'A' && c <= 'G')
  accidental <- optionMaybe $ choice
    [ try (char '#' *> pure Sharp)
    , try (char 'b' *> pure Flat)
    , pure Natural
    ]
  octave <- optionMaybe digit >>= case _ of
    Nothing -> pure 4
    Just d  -> pure $ case d of
      '3' -> 3; '4' -> 4; '5' -> 5; '6' -> 6; '7' -> 7; _ -> 4
  pure { letter, accidental: fromMaybe Natural accidental, octave }
```

要点讲解：
- satisfy 谓词匹配：限定字符范围
- 类型驱动开发：返回类型 Pitch 决定了必须收集所有字段
- 默认值处理：八度默认 4，变音记号默认 Natural

### 谱号解析与扩展

代码片段 4 -- 谱号标准化：

```purescript
data Clef = Treble | Bass | Alto | Tenor | Percussion

clefToString :: Clef -> String
clefToString Treble     = "treble"
clefToString Bass       = "bass"
clefToString Alto       = "alto"
clefToString Tenor      = "tenor"
clefToString Percussion = "percussion"

parseClef :: String -> String
parseClef s = case toLower (trim s) of
  "treble" -> "treble";  "g"    -> "treble"
  "bass"   -> "bass";    "f"    -> "bass"
  "alto"   -> "alto";    "c"    -> "alto"
  "tenor"  -> "tenor"
  "percussion" -> "percussion"; "perc" -> "percussion"
  _ -> "treble"
```

要点讲解：
- ADT 扩展只需添加构造器，编译器自动检查遗漏
- 用户友好别名：g/f/c 映射到正式名称
- 与 JS 端 normalizeClef 保持一致

---

## 第四部分：JavaScript 引擎层

### 布局算法

关键公式：
- firstMeasureWidth = baseStaveWidth + clefSpaceWidth
- totalWidth = firstMeasureWidth + otherMeasureWidth * (measuresPerLine - 1)
- x(i) = i%N==0 ? padding : padding + first + (i%N - 1) * other
- y(i) = padding + floor(i / N) * lineHeight

特点：O(1) 坐标计算、分段线性函数

### Parser 加载策略
- 主 parser：fetch + CommonJS 沙箱执行 PureScript 编译产物
- 备用 parser：JS 内置 fallback，功能兼容
- HTML 注入检测：防止 404 页面被当作 JS 执行

### 引擎工厂闭包模式
- 闭包隐藏私有状态
- Promise 幂等保证单次初始化
- 懒加载不阻塞页面

---

## 第五部分：VexFlow 渲染

### 单遍渲染算法

代码片段 5 -- 渲染核心循环：

```javascript
ast.measures.forEach((measure, i) => {
  const col = i % layout.measuresPerLine;
  const w = col === 0 ? layout.firstMeasureWidth : layout.otherMeasureWidth;
  const x = col === 0
    ? layout.padding
    : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;
  const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

  const stave = new VF.Stave(x, y, w);
  if (i === 0) stave.addClef(clef).addTimeSignature(time).addKeySignature(key);
  stave.setContext(ctx).draw();

  const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
  voice.addTickables(this._notes(measure));
  new VF.Formatter().joinVoices([voice]).format([voice], w - 20);
  voice.draw(ctx, stave);
});
```

要点讲解：
- 单遍 vs 双遍：无中间数组、内存效率更高
- Stave/Voice/Formatter 三级对象模型
- 响应式 SVG：max-width:100% + height:auto

---

## 第六部分：创新点与总结

### 创新点
1. PureScript 在前端词法分析中的应用——小众语言的独特优势
2. Parser Combinator 范式——代码即文法，可组合、类型安全
3. 主备双 Parser 降级——100% 可用性保障
4. 单遍渲染算法——简化逻辑、节省内存
5. 声明式谱号扩展——ADT + 编译器穷尽性检查

### 技术指标
- PureScript 核心代码约 210 行
- JavaScript 模块代码约 370 行
- 支持 5 种谱号
- 渲染后端 SVG 矢量图形

### 未来展望
- 支持更多音乐符号（连音线、力度标记、反复记号）
- 多声部渲染
- 实时编辑预览
- MIDI 播放
