import * as BLOCK_MAP from "../data/anyascii.json";
import { resolveJson } from "./utils";

const blocks = resolveJson<Record<string, string[]>>(BLOCK_MAP);

export default function anyAscii(str: string): string {
  let result = '';
  for (const c of str) {
    const codePoint = c.codePointAt(0) as number;
    if (codePoint <= 0x7f) {
      result += c;
      continue;
    }
    const blockNum = codePoint >>> 8;
    const lo = codePoint & 0xff;
    const b = blocks[blockNum] ?? '';
    result += b[lo] ?? '';
  }
  return result;
}
