import parityReferenceV2 = require("./parity-reference-v2.json");
import parityReferenceV3 = require("./parity-reference-v3.json");
import parityReferenceV4 = require("./parity-reference-v4.json");

export type Corrections = Record<string, { from: string; to: string; source: string }>;

export function parityReferences(
  word: string,
  dictionaryIpa: string,
  corrections: Corrections = parityReferenceV2.corrections,
): string[] {
  const correction = Object.prototype.hasOwnProperty.call(corrections, word) ? corrections[word] : undefined;
  if (!correction) return [dictionaryIpa];
  if (!correction.to || !correction.source)
    throw new Error(`Parity reference correction does not match dictionary source: ${word}`);
  if (dictionaryIpa === correction.to) return [dictionaryIpa];
  if (dictionaryIpa !== correction.from)
    throw new Error(`Parity reference correction does not match dictionary source: ${word}`);
  return [...new Set([dictionaryIpa, correction.to])];
}

// V3 is an additional diagnostic contract; it does not replace the v2 floor.
export function parityReferencesV3(word: string, dictionaryIpa: string): string[] {
  const variants: Corrections = parityReferenceV3.variants;
  const variant = Object.prototype.hasOwnProperty.call(variants, word) ? variants[word] : undefined;
  if (!variant) return parityReferences(word, dictionaryIpa);
  if (!variant.source || !variant.from || !variant.to || (dictionaryIpa !== variant.from && dictionaryIpa !== variant.to))
    throw new Error(`Parity reference variant does not match dictionary source: ${word}`);
  return [...new Set([variant.from, variant.to])];
}

// Retain the old reading for snapshot comparison, even where it describes a
// different sense; accepting it is not evidence that it fits every context.
export function parityReferencesV4(word: string, dictionaryIpa: string): string[] {
  const variants: Corrections = parityReferenceV4.variants;
  const variant = Object.prototype.hasOwnProperty.call(variants, word) ? variants[word] : undefined;
  if (!variant) return parityReferencesV3(word, dictionaryIpa);
  if (!variant.source || !variant.from || !variant.to || (dictionaryIpa !== variant.from && dictionaryIpa !== variant.to))
    throw new Error(`Parity reference variant does not match dictionary source: ${word}`);
  return [...new Set([variant.from, variant.to])];
}
