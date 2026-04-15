module Music.AST where

import Prelude
import Data.Generic.Rep (class Generic)
import Data.Show.Generic (genericShow)
import Data.Maybe (Maybe)

data Accidental = Sharp | Flat | Natural

derive instance eqAccidental :: Eq Accidental
derive instance genericAccidental :: Generic Accidental _
instance showAccidental :: Show Accidental where
  show = genericShow

type Pitch = { letter :: Char, accidental :: Accidental, octave :: Int }

type Duration = Int

data NoteType = Note | Rest

derive instance eqNoteType :: Eq NoteType
derive instance genericNoteType :: Generic NoteType _
instance showNoteType :: Show NoteType where
  show = genericShow

type Note = 
  { noteType :: NoteType
  , pitch :: Maybe Pitch
  , duration :: Duration
  }

type Measure = Array Note

type Score = 
  { title :: Maybe String
  , key :: String
  , time :: String
  , measures :: Array Measure
  }