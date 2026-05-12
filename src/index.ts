import { useProcessor } from "./g2p";
import EnglishG2P from "./en-g2p";

useProcessor(new EnglishG2P());

export * from "./core";
