-- | Music.AST -- 乐谱抽象语法树 (Abstract Syntax Tree)
-- |
-- | 本模块定义了从 Markdown 音乐代码块解析出的所有数据类型。
-- | 这些类型构成了 Parser 与 Renderer 之间的契约：
-- |   Parser 生产 Score，Renderer 消费 Score。
-- |
-- | 设计原则：
-- |   1. 所有类型均为纯数据，不包含任何副作用或渲染逻辑。
-- |   2. 使用 ADT (Algebraic Data Type) 对有限枚举建模，
-- |      编译器可在 pattern match 时检查穷尽性。
-- |   3. Record 类型用于结构化字段，便于序列化为 JSON / Foreign。
-- |
-- | 类型关系:
-- |   Score
-- |     +-- title   : Maybe String        (可选标题)
-- |     +-- clef    : Clef                 (谱号，默认 Treble)
-- |     +-- key     : String               (调号，如 "C", "G", "Bb")
-- |     +-- time    : String               (拍号，如 "4/4", "3/4")
-- |     +-- measures: Array Measure
-- |           +-- Array Note
-- |                 +-- noteType : NoteType (Note | Rest)
-- |                 +-- pitch    : Maybe Pitch
-- |                 +-- duration : Duration
module Music.AST where

import Prelude
import Data.Generic.Rep (class Generic)
import Data.Show.Generic (genericShow)
import Data.Maybe (Maybe)

-- | Accidental -- 临时变音记号
-- |
-- | 音乐中的三种变音状态：
-- |   Sharp   -- 升半音 (#)
-- |   Flat    -- 降半音 (b)
-- |   Natural -- 还原 / 无变音
-- |
-- | 使用 ADT 而非字符串建模，确保不可能出现非法值。
-- | Generic 派生使 Show 实例可自动映射到构造器名称，
-- | 序列化后 JS 端直接得到 "Sharp" / "Flat" / "Natural" 字符串。
data Accidental = Sharp | Flat | Natural

derive instance eqAccidental :: Eq Accidental
derive instance genericAccidental :: Generic Accidental _
instance showAccidental :: Show Accidental where
  show = genericShow

-- | Clef -- 谱号
-- |
-- | VexFlow 支持的常用谱号：
-- |   Treble     -- 高音谱号 (G 谱号)，默认
-- |   Bass       -- 低音谱号 (F 谱号)
-- |   Alto       -- 中音谱号 (C 谱号，第三线)
-- |   Tenor      -- 次中音谱号 (C 谱号，第四线)
-- |   Percussion -- 打击乐谱号
-- |
-- | 扩展方式：直接在此处添加新构造器，然后在
-- | clefToString 中添加对应映射即可。
data Clef = Treble | Bass | Alto | Tenor | Percussion

derive instance eqClef :: Eq Clef
derive instance genericClef :: Generic Clef _
instance showClef :: Show Clef where
  show = genericShow

-- | clefToString -- 将 Clef ADT 转为 VexFlow 识别的小写字符串
-- |
-- | VexFlow 的 stave.addClef() 接受的标识符：
-- |   "treble" | "bass" | "alto" | "tenor" | "percussion"
clefToString :: Clef -> String
clefToString Treble     = "treble"
clefToString Bass       = "bass"
clefToString Alto       = "alto"
clefToString Tenor      = "tenor"
clefToString Percussion = "percussion"

-- | Pitch -- 音高
-- |
-- | 由三部分组成：
-- |   letter     -- 音名 (A-G)，用 Char 表示
-- |   accidental -- 变音记号
-- |   octave     -- 八度 (3-7)，默认 4 (中央 C 所在八度)
type Pitch = { letter :: Char, accidental :: Accidental, octave :: Int }

-- | Duration -- 时值
-- |
-- | 用整数表示音符时值的分母：
-- |   1 = 全音符, 2 = 二分音符, 4 = 四分音符, 8 = 八分音符
-- | VexFlow 内部也使用相同的数值约定。
type Duration = Int

-- | NoteType -- 音符类型
-- |
-- | 区分实际发声的 Note 和静默的 Rest。
-- | 休止符没有音高 (pitch 为 Nothing)，但仍有时值。
data NoteType = Note | Rest

derive instance eqNoteType :: Eq NoteType
derive instance genericNoteType :: Generic NoteType _
instance showNoteType :: Show NoteType where
  show = genericShow

-- | Note -- 单个音符 / 休止符
-- |
-- | noteType : 区分音符与休止符
-- | pitch    : 音高信息；休止符时为 Nothing
-- | duration : 时值 (1/2/4/8)
type Note = 
  { noteType :: NoteType
  , pitch :: Maybe Pitch
  , duration :: Duration
  }

-- | Measure -- 小节
-- |
-- | 一个小节是一组 Note 的有序数组。
-- | 小节内所有音符的时值之和应等于拍号指定的总拍数，
-- | 但此约束由 VexFlow 的 Voice 在渲染时校验，AST 层不强制。
type Measure = Array Note

-- | Score -- 完整乐谱
-- |
-- | 顶层数据结构，包含乐谱的所有元数据和音符内容。
-- |   title    : 可选标题
-- |   clef     : 谱号 (默认 "treble")
-- |   key      : 调号 (默认 "C")
-- |   time     : 拍号 (默认 "4/4")
-- |   measures : 小节数组
-- |
-- | clef 字段在序列化时通过 clefToString 输出为字符串，
-- | 使 JS 端可直接传给 VexFlow 的 addClef()。
type Score = 
  { title :: Maybe String
  , clef :: String
  , key :: String
  , time :: String
  , measures :: Array Measure
  }