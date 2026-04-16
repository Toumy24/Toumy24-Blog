# markdown-music-notation PPT 大纲

---

## 第一部分：项目介绍

### 这个项目是做什么的
- 在博客里写乐谱，传统做法是截图粘贴，不方便修改也不清晰
- 我们的方案：直接在 Markdown 里用文字写音符，自动渲染成五线谱
- 输出的是 SVG 矢量图，放大不模糊，手机上也能看

### 效果展示
- 展示输入文本和渲染结果的对比
- 桌面端和移动端的显示效果截图

---

## 第二部分：整体架构

### 系统分三层
- 解析层：PureScript 写的解析器，把文字变成结构化数据
- 引擎层：JavaScript 写的，算布局、管加载
- 渲染层：调用 VexFlow 库画五线谱

### 为什么这样选型
- PureScript：函数式语言，类型严格，适合做文本解析
- VexFlow：成熟的开源乐谱渲染库
- Hugo：博客框架，支持自定义代码块渲染

---

## 第三部分：PureScript 解析器（重点）

### 数据结构设计（AST）

代码片段 1 -- 核心数据类型：

```purescript
data Accidental = Sharp | Flat | Natural     -- 升号/降号/还原
data NoteType   = Note | Rest                -- 音符/休止符
data Clef       = Treble | Bass | Alto | Tenor | Percussion  -- 5种谱号

type Pitch = { letter :: Char, accidental :: Accidental, octave :: Int }
type Note  = { noteType :: NoteType, pitch :: Maybe Pitch, duration :: Int }
type Score = { title :: Maybe String, clef :: String, key :: String,
               time :: String, measures :: Array (Array Note) }
```

讲什么：
- 用 data 定义几种固定的值（叫 ADT），比如变音记号只能是 Sharp/Flat/Natural 三种，写错了编译不过
- 跟 JS 用字符串 "sharp" 对比，说明 ADT 更安全
- Maybe 就是"可以有也可以没有"，比 null 更安全

### 解析器怎么拼出来的

代码片段 2 -- 音符解析器：

```purescript
noteParser :: Parser String Note
noteParser = do
  skipSpaces                                                    -- 跳过空格
  noteType <- choice [ try (string "r" *> pure Rest), pure Note ] -- 是休止符还是音符？
  pitch <- case noteType of
    Rest -> pure Nothing                                        -- 休止符没有音高
    Note -> Just <$> pitchParser                                -- 音符就解析音高
  duration <- optionMaybe (char '/' *> durationParser)          -- 可选的时值
              >>= pure <<< fromMaybe 4
  pure { noteType, pitch, duration }
```

讲什么：
- 像搭积木一样拼解析器：先写小的（识别单个字符），再组装成大的（识别整个音符）
- choice：多选一，先试休止符，不是就当音符
- try：试一下不行就回退，不影响后面的尝试
- optionMaybe：有就读，没有就用默认值
- 代码结构和文法规则几乎一一对应

代码片段 3 -- 音高解析器：

```purescript
pitchParser :: Parser String Pitch
pitchParser = do
  letter <- satisfy (\c -> c >= 'A' && c <= 'G')   -- 音名必须是A到G
  accidental <- optionMaybe $ choice                -- 可选的升降号
    [ try (char '#' *> pure Sharp)
    , try (char 'b' *> pure Flat)
    ]
  octave <- optionMaybe digit                       -- 可选的八度数字
  pure { letter
       , accidental: fromMaybe Natural accidental
       , octave: fromMaybe 4 (map digitToInt octave) }
```

讲什么：
- satisfy 就是一个条件检查：这个字符满足条件吗？满足就消费掉
- 每一行都在做一件具体的小事，合起来就完成了音高的完整解析
- 默认值：没写八度就是 4（中央C所在八度），没写升降号就是还原

### 加新谱号很容易

代码片段 4 -- 谱号扩展：

```purescript
data Clef = Treble | Bass | Alto | Tenor | Percussion

clefToString :: Clef -> String
clefToString Treble     = "treble"
clefToString Bass       = "bass"
clefToString Alto       = "alto"
clefToString Tenor      = "tenor"
clefToString Percussion = "percussion"
-- 如果加了新的 Clef 但忘了写对应的行，编译器会报警告
```

讲什么：
- 加新谱号只需要三步：加一个值、加一行映射、加用户别名
- 编译器会检查你是不是每种情况都处理了，漏了会提醒

---

## 第四部分：JavaScript 引擎层

### 布局怎么算的

思路：像表格一样排列小节，每行放 4 个

```
每个小节宽 250px
第一个小节多给 80px（放谱号）
行高 87px
```

公式很简单：
- 第几列 = 编号 % 4
- 第几行 = 编号 / 4（向下取整）
- x、y 坐标根据行列号算出

### 两套解析器自动切换
- 优先用 PureScript 解析器（功能完整）
- 网络出问题就自动切到 JS 备用版
- 用户感觉不到差别

### 引擎怎么管理状态
- 用闭包把内部变量藏起来，外面改不了
- 初始化只执行一次，不会重复加载

---

## 第五部分：VexFlow 渲染

### 渲染核心循环

代码片段 5 -- 逐小节渲染：

```javascript
ast.measures.forEach((measure, i) => {
  // 1. 根据编号算位置
  const col = i % layout.measuresPerLine;
  const x = col === 0
    ? layout.padding
    : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;
  const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

  // 2. 画五线谱框，第一小节加谱号和拍号
  const stave = new VF.Stave(x, y, w);
  if (i === 0) stave.addClef(clef).addTimeSignature(time).addKeySignature(key);
  stave.setContext(ctx).draw();

  // 3. 放音符进去，自动排版，画出来
  const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
  voice.addTickables(this._notes(measure));
  new VF.Formatter().joinVoices([voice]).format([voice], w - 20);
  voice.draw(ctx, stave);
});
```

讲什么：
- 每个小节处理完就立刻画，不用等全部处理完（单遍渲染）
- VexFlow 里 Stave 是五线谱框、Voice 是音符组、Formatter 负责排版
- 生成的 SVG 加了 max-width:100%，手机上会自动缩放

---

## 第六部分：总结

### 做了什么
1. 用 PureScript 这个函数式语言写了文本解析器，类型安全、不容易出 bug
2. 解析器用的是 Parser Combinator 模式，代码和文法规则几乎一一对应
3. 准备了主备两套解析器，网络有问题也能正常用
4. 渲染采用单遍算法，每个小节处理完就画，代码简单
5. 加新谱号只改几行代码，编译器帮你检查有没有漏的

### 数据
- PureScript 约 210 行，JavaScript 约 370 行
- 支持 5 种谱号
- 输出 SVG 矢量图

### 以后可以做什么
- 支持连音线、力度标记等更多音乐符号
- 多声部（钢琴谱的左右手）
- 实时编辑预览
- MIDI 播放
