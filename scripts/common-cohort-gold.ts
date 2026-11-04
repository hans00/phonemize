import { createHash } from "crypto";
import cohort = require("./common-cohort-v89.json");

const references = (cohort as unknown as { references: Record<string, string> }).references;
const acceptedVariants = (cohort as unknown as { acceptedVariants: Record<string, string[]> }).acceptedVariants;
const variantSources = (cohort as unknown as { variantSources: Record<string, string> }).variantSources;
const canonical = cohort.words.map(word => `${word}\t${references[word]}\t${(acceptedVariants[word] ?? []).join("\u001f")}\t${variantSources[word] ?? ""}\n`).join("");
const sha256 = createHash("sha256").update(canonical).digest("hex");
if (Object.keys(references).length !== cohort.n || sha256 !== cohort.referenceSha256) {
  throw new Error(`Frozen common references are inconsistent: ${sha256}`);
}
if (Object.keys(acceptedVariants).some(word => !Object.prototype.hasOwnProperty.call(references, word) || !acceptedVariants[word].length || !variantSources[word])) {
  throw new Error("Frozen common accepted variants have incomplete source metadata");
}

export function commonGold(word: string, fallback?: string): string | undefined {
  const key = word.toLowerCase();
  return Object.prototype.hasOwnProperty.call(references, key) ? references[key] : fallback;
}

export function commonGoldVariants(word: string, fallback?: string): string[] {
  const key = word.toLowerCase();
  const primary = Object.prototype.hasOwnProperty.call(references, key) ? references[key] : fallback;
  const variants = Object.prototype.hasOwnProperty.call(acceptedVariants, key) ? acceptedVariants[key] : [];
  return primary ? [primary, ...variants] : [];
}

export const commonReferenceContract = { version: cohort.referenceVersion, sha256: cohort.referenceSha256 } as const;
export { acceptedVariants as commonAcceptedVariants, references as commonReferences, variantSources as commonVariantSources };
