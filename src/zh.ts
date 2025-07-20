import { useG2P } from "./g2p";
import EnglishG2P from "./en-g2p";
import ChineseG2P from "./zh-g2p";

useG2P(new EnglishG2P());
useG2P(new ChineseG2P());

export * from "./core";
