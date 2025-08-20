import { useG2P } from '../src/index'
import EnglishG2P from '../src/en-g2p'
import ChineseG2P from '../src/zh-g2p'
import JapaneseG2P from '../src/ja-g2p'
import KoreanG2P from '../src/ko-g2p'
import RussianG2P from '../src/ru-g2p'

useG2P(new EnglishG2P())
useG2P(new ChineseG2P())
useG2P(new JapaneseG2P())
useG2P(new KoreanG2P())
useG2P(new RussianG2P())
