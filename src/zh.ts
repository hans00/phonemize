import { useProcessor } from "./g2p";
import EnglishG2P from "./en/g2p";
import ChineseG2P from "./zh/g2p";

useProcessor(new EnglishG2P());
useProcessor(new ChineseG2P());

export * from "./core";
