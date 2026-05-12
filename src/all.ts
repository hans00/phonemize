import { useProcessor } from "./g2p";
import EnglishG2P from "./en-g2p";
import ChineseG2P from "./zh-g2p";
import JapaneseG2P from "./ja-g2p";
import KoreanG2P from "./ko-g2p";
import RussianG2P from "./ru-g2p";

useProcessor(new EnglishG2P());
useProcessor(new ChineseG2P());
useProcessor(new JapaneseG2P());
useProcessor(new KoreanG2P());
useProcessor(new RussianG2P());

export * from "./core";
