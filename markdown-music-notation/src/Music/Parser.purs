-- | Music.Parser -- 乐谱文本解析器
-- |
-- | 本模块实现从 Markdown 代码块纯文本到 Score AST 的完整转换。
-- | 解析分为两个阶段：
-- |
-- |   1. 元数据提取 (parseScore)
-- |      按行扫描，识别 "title:" / "key:" / "time:" / "clef:" 前缀，
-- |      剩余行拼接为音符文本。
-- |
-- |   2. 词法 + 语法分析 (noteParser / measureParser)
-- |      使用 PureScript 的 Parser Combinator 库 (purescript-parsing)，
-- |      将音符文本解析为 Array Measure。
-- |
-- | 输入格式示例：
-- |   title: Twinkle
-- |   key: C
-- |   time: 4/4
-- |   clef: treble
-- |   C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/2
-- |
-- | Parser Combinator 的优势：
-- |   - 每个 parser 都是可复合的一等值 (first-class value)
-- |   - 通过 <*>、>>=、<|> 等运算符组合小 parser 构成大 parser
-- |   - 无需手写状态机，代码即文法
-- |   - PureScript 的类型系统保证组合的类型安全
module Music.Parser where

import Prelude
import Data.Array (filter, head)
import Data.Either (Either(..))
import Data.List (toUnfoldable)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.String (trim, split, Pattern(..), joinWith, drop, indexOf, length, toLower)
import Parsing (Parser, runParser)
import Parsing.Combinators (many, sepBy, choice, optionMaybe, try)
import Parsing.String (char, string, satisfy)
import Parsing.String.Basic (digit, space, skipSpaces)
import Music.AST

-- ==================== 词法分析器 (Lexer) ====================

-- | noteParser -- 解析单个音符或休止符
-- |
-- | 文法 (EBNF):
-- |   note = rest | pitched_note
-- |   rest = "r" ["/" duration]
-- |   pitched_note = pitch ["/" duration]
-- |
-- | 解析流程：
-- |   1. 跳过前置空白
-- |   2. 尝试匹配 "r" 前缀 → Rest，否则 → Note
-- |   3. 若为 Note，调用 pitchParser 解析音高
-- |   4. 可选地匹配 "/" 后跟时值数字 (默认 4 = 四分音符)
-- |
-- | try 组合子：
-- |   try 使 parser 在失败时不消耗输入，从而允许 choice 尝试下一个分支。
-- |   这里用于区分 "r" (休止符) 和以 r 开头的其他可能 token。
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

-- | pitchParser -- 解析音高 (音名 + 变音 + 八度)
-- |
-- | 文法:
-- |   pitch = letter [accidental] [octave]
-- |   letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
-- |   accidental = '#' | 'b'
-- |   octave = '3' | '4' | '5' | '6' | '7'
-- |
-- | satisfy 组合子：
-- |   接受一个谓词函数 Char -> Boolean，匹配满足条件的单个字符。
-- |   这里用于限定音名范围 A-G。
-- |
-- | optionMaybe 组合子：
-- |   将 parser 的结果包装为 Maybe，匹配失败时返回 Nothing 而非报错。
-- |   用于处理可选的变音记号和八度数字。
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
      '3' -> 3
      '4' -> 4
      '5' -> 5
      '6' -> 6
      '7' -> 7
      _   -> 4
  pure { letter, accidental: fromMaybe Natural accidental, octave }

-- | durationParser -- 解析时值数字
-- |
-- | 文法:
-- |   duration = '1' | '2' | '4' | '8'
-- |
-- | 返回整数，对应音符时值的分母：
-- |   1 = 全音符 (semibreve)
-- |   2 = 二分音符 (minim)
-- |   4 = 四分音符 (crotchet)
-- |   8 = 八分音符 (quaver)
-- | 非法数字默认回退到 4 (四分音符)。
durationParser :: Parser String Int
durationParser = do
  d <- digit
  pure $ case d of
    '1' -> 1
    '2' -> 2
    '4' -> 4
    '8' -> 8
    _   -> 4

-- ==================== 语法分析器 (Parser) ====================

-- | measureParser -- 解析一个小节内的所有音符
-- |
-- | 文法:
-- |   measure = note (spaces note)*
-- |
-- | sepBy 组合子：
-- |   noteParser `sepBy` skipSpaces
-- |   表示 "用空白分隔的零到多个 note"。
-- |   返回 List Note，通过 toUnfoldable 转为 Array Note。
-- |
-- | 过滤逻辑：
-- |   移除 "空白休止符" (noteType == Rest, pitch == Nothing, duration == 4)
-- |   这些是 parser 在连续空白间产生的虚假匹配。
measureParser :: Parser String Measure
measureParser = 
  map (\notes -> filter (\n -> not (n.noteType == Rest && n.pitch == Nothing && n.duration == 4)) (toUnfoldable notes))
    (noteParser `sepBy` skipSpaces)

-- | parseClef -- 将用户输入的谱号字符串映射为 VexFlow 标识符
-- |
-- | 支持的输入 (大小写不敏感):
-- |   "treble" / "g"          -> "treble"  (高音谱号)
-- |   "bass"   / "f"          -> "bass"    (低音谱号)
-- |   "alto"   / "c"          -> "alto"    (中音谱号)
-- |   "tenor"                 -> "tenor"   (次中音谱号)
-- |   "percussion" / "perc"   -> "percussion" (打击乐谱号)
-- |   其他                    -> "treble"  (默认)
-- |
-- | 返回值直接作为 Score.clef 字段，JS 端无需二次转换。
parseClef :: String -> String
parseClef s = case toLower (trim s) of
  "treble"     -> "treble"
  "g"          -> "treble"
  "bass"       -> "bass"
  "f"          -> "bass"
  "alto"       -> "alto"
  "c"          -> "alto"
  "tenor"      -> "tenor"
  "percussion" -> "percussion"
  "perc"       -> "percussion"
  _            -> "treble"

-- | parseScore -- 顶层入口：将完整文本解析为 Score AST
-- |
-- | 算法步骤：
-- |   1. 按换行符 "\n" 拆分输入，并 trim 每行
-- |   2. 逐行扫描元数据前缀 (title: / key: / time: / clef:)
-- |   3. 非元数据行拼接为一个音符字符串
-- |   4. 用 "|" 作为小节分隔符，调用 measureParser 解析每个小节
-- |   5. 过滤空小节，组装为 Score record
-- |
-- | runParser:
-- |   将 Parser Combinator 应用于输入字符串，返回 Either ParseError a。
-- |   Left 表示解析失败 (此处回退到空数组)，Right 表示成功。
parseScore :: String -> Score
parseScore input =
  let
    lines = split (Pattern "\n") (trim input)
    
    -- startsWith' : 判断一行是否以指定前缀开头
    -- 使用 indexOf 替代不可用的 startsWith，返回 Just 0 表示匹配
    startsWith' prefix l = indexOf (Pattern prefix) l == Just 0
    
    -- getMeta : 提取指定前缀的元数据值，若不存在则返回默认值
    -- head 取第一个匹配行（允许多行时只取首次出现）
    getMeta prefix defaultVal = 
      fromMaybe defaultVal $ head $ map (trim <<< drop (length prefix)) $ filter (startsWith' prefix) lines
    
    -- 提取各元数据字段
    title = head $ map (trim <<< drop 6) $ filter (startsWith' "title:") lines
    clef  = parseClef (getMeta "clef:" "treble")
    key   = getMeta "key:" "C"
    time  = getMeta "time:" "4/4"
    
    -- 过滤掉所有元数据行，剩余为音符行
    notesLines = filter (\l -> not (startsWith' "title:" l || startsWith' "key:" l || startsWith' "time:" l || startsWith' "clef:" l)) lines
    notesLine = joinWith " " notesLines
    
    -- 小节分隔符 parser: 匹配 "|" 及其两侧空白
    measureSeparator = skipSpaces *> string "|" <* skipSpaces
    
    -- 运行 parser combinator 解析所有小节
    -- sepBy measureParser measureSeparator: "用 | 分隔的多个小节"
    measures = case runParser notesLine (measureParser `sepBy` measureSeparator) of
      Right ms -> toUnfoldable ms
      Left _   -> []
  in
    { title, clef, key, time, measures: filter (not <<< eq []) measures }