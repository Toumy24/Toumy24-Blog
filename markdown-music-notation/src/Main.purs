-- | Main -- PureScript 编译入口 / JS FFI 桥接层
-- |
-- | 本模块是 spago bundle 的入口点，将 PureScript 的 parseScore 函数
-- | 暴露为 CommonJS 导出 module.exports.parseMusicBlock，
-- | 供 JavaScript 端通过 new Function('module','exports', code) 动态加载。
-- |
-- | unsafeToForeign:
-- |   将 PureScript 的 Score record 转为 JS 的 Foreign (即 any)，
-- |   因为 Score 内部全是 plain record / array / string / int，
-- |   序列化后自然是合法的 JS 对象，无需额外的 JSON encode 步骤。
module Main where

import Prelude
import Foreign (Foreign, unsafeToForeign)
import Music.Parser (parseScore)

-- | parseMusicBlock -- JS 端调用的唯一入口
-- |
-- | 签名: String -> Foreign
-- | JS 端等价于: (input: string) => ScoreObject
-- |
-- | 返回的对象结构:
-- |   { title: string | null,
-- |     clef: "treble" | "bass" | "alto" | "tenor" | "percussion",
-- |     key: string,
-- |     time: string,
-- |     measures: Array<Array<Note>> }
parseMusicBlock :: String -> Foreign
parseMusicBlock input = unsafeToForeign (parseScore input)