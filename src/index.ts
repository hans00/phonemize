import { useG2P } from "./g2p";
import EnglishG2P from "./en-g2p";

useG2P(new EnglishG2P());

export * from "./core";
