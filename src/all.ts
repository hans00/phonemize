import { useG2P } from "./g2p";
import EnglishG2P from "./en-g2p";
import ChineseG2P from "./zh-g2p";
import JapaneseG2P from "./ja-g2p";
import KoreanG2P from "./ko-g2p";
import RussianG2P from "./ru-g2p";

useG2P(new EnglishG2P());
useG2P(new ChineseG2P());
useG2P(new JapaneseG2P());
useG2P(new KoreanG2P());
useG2P(new RussianG2P());

export * from "./core";
