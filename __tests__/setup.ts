import { useProcessor } from '../src/index'
import EnglishG2P from '../src/en/g2p'
import ChineseG2P from '../src/zh/g2p'
import JapaneseG2P from '../src/ja/g2p'
import KoreanG2P from '../src/ko/g2p'
import RussianG2P from '../src/ru/g2p'

useProcessor(new EnglishG2P())
useProcessor(new ChineseG2P())
useProcessor(new JapaneseG2P())
useProcessor(new KoreanG2P())
useProcessor(new RussianG2P())
