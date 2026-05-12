/**
 * Text expansion: numbers, abbreviations, currency, dates, etc.
 *
 * The concrete rules live in language-specific modules (e.g. `expand-en.ts`)
 * and are wired into each language's `LanguageProcessor.preProcess`.
 *
 * This file re-exports the English helpers so existing imports and the
 * tokenizer's whole-text expansion pass keep working unchanged. Phase 2
 * of the multi-language refactor will switch the tokenizer to per-script
 * dispatch through the language registry, at which point this re-export
 * becomes a thin compatibility shim.
 */

export {
  expandText,
  expandNumbers,
  expandAbbreviations,
} from "./expand-en";
