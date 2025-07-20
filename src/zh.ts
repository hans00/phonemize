/**
 * Preset for Chinese
 */

import ChineseG2P from "./zh-g2p";
import { useG2P } from "./g2p";

useG2P(new ChineseG2P());

export * from "./index";
