module Music.Parser where

import Prelude
import Data.Array (filter, head)
import Data.Either (Either(..))
import Data.List (toUnfoldable)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.String (trim, split, Pattern(..), joinWith, drop, indexOf, length)
import Parsing (Parser, runParser)
import Parsing.Combinators (many, sepBy, choice, optionMaybe, try)
import Parsing.String (char, string, satisfy)
import Parsing.String.Basic (digit, space, skipSpaces)
import Music.AST

-- ==================== Lexer ====================
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

durationParser :: Parser String Int
durationParser = do
  d <- digit
  pure $ case d of
    '1' -> 1
    '2' -> 2
    '4' -> 4
    '8' -> 8
    _   -> 4

-- ==================== 语法分析 ====================
measureParser :: Parser String Measure
measureParser = 
  map (\notes -> filter (\n -> not (n.noteType == Rest && n.pitch == Nothing && n.duration == 4)) (toUnfoldable notes))
    (noteParser `sepBy` skipSpaces)

parseScore :: String -> Score
parseScore input =
  let
    lines = split (Pattern "\n") (trim input)
    
    -- 用 indexOf 替代 startsWith
    startsWith' prefix l = indexOf (Pattern prefix) l == Just 0
    
    getMeta prefix defaultVal = 
      fromMaybe defaultVal $ head $ map (trim <<< drop (length prefix)) $ filter (startsWith' prefix) lines
    
    title = head $ map (trim <<< drop 6) $ filter (startsWith' "title:") lines
    key   = getMeta "key:" "C"
    time  = getMeta "time:" "4/4"
    
    notesLines = filter (\l -> not (startsWith' "title:" l || startsWith' "key:" l || startsWith' "time:" l)) lines
    notesLine = joinWith " " notesLines
    
    measureSeparator = skipSpaces *> string "|" <* skipSpaces
    measures = case runParser notesLine (measureParser `sepBy` measureSeparator) of
      Right ms -> toUnfoldable ms
      Left _   -> []
  in
    { title, key, time, measures: filter (not <<< eq []) measures }