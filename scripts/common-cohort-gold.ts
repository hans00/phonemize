import { createHash } from "crypto";
import cohort = require("./common-cohort.json");

const references = (cohort as unknown as { references: Record<string, string> }).references;
const canonical = cohort.words.map(word => `${word}\t${references[word]}\n`).join("");
const sha256 = createHash("sha256").update(canonical).digest("hex");
if (Object.keys(references).length !== cohort.n || sha256 !== cohort.referenceSha256) {
  throw new Error(`Frozen common references are inconsistent: ${sha256}`);
}

export function commonGold(word: string, fallback?: string): string | undefined {
  return references[word.toLowerCase()] ?? fallback;
}

export { references as commonReferences };
