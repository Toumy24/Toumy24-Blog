module Main where

import Prelude
import Foreign (Foreign, unsafeToForeign)
import Music.Parser (parseScore)

parseMusicBlock :: String -> Foreign
parseMusicBlock input = unsafeToForeign (parseScore input)