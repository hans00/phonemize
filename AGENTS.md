# AGENTS.md

Project guidance for coding agents (Claude Code, Codex, Cursor, …) working in this repository. The Claude Code-specific entry point `CLAUDE.md` forwards here.

## Heuristic Learning Loop

This project uses Heuristic Learning: the G2P rules are the learnable policy; Claude is the learning agent. The loop runs across sessions using Claude's memory system for continuity.

### Running the loop

1. **Diagnose** — `yarn test:eval --cluster`: find top rule failure patterns
2. **Trace** — `yarn trace <word> [word...]`: see which rule fired for specific words, pre- and post-dictionary
3. **Fix** — edit `PHONEME_RULES`, `SUFFIX_RULES`, or `tryMorphologicalAnalysis` in `src/en-g2p.ts`
4. **Validate** — `yarn test` (zero regressions) then `yarn test:eval` (lenient accuracy ≥ baseline)
5. **Commit** — if both gates pass; update baseline with `yarn test:eval --update-baseline`

Check compression triggers (see Rule Compression section) before committing any fix.

### Reading cluster output

`--cluster` groups mismatch words by the rule that fired at the first IPA divergence point. Clusters dominated by foreign proper nouns (long words, unusual consonant clusters) signal a coverage gap that is out of scope for English rules — skip those and focus on clusters with recognisable common English words.

### Eval baseline

`scripts/eval-baseline.json` stores the last committed score. Each `yarn test:eval` run shows delta automatically. Update the baseline only after a confirmed improvement is committed.

## Commands

- `yarn build` — compiles dictionaries (via `prebuild` → `build-dict`) then rollup-bundles all entry points to `dist/`
- `yarn build-dict` — regenerates `data/**/*.json` from `src-data/` sources (run manually after editing `src-data/`)
- `yarn test` — Jest, picks up `__tests__/**/*.test.ts`. Single test: `yarn test -- en-rule-g2p`
- `yarn test:coverage` — Jest with nyc coverage
- `yarn typecheck` — `tsc -b` (no emit)
- `yarn test:eval` — `scripts/evaluate.ts`: Levenshtein distance of rule-based G2P vs. dictionary
- `yarn test:ai-eval` — `scripts/eval-with-ai.ts`: AI-scored eval over `scripts/eval-data/*.txt`. Flags: `--provider codex|openai`, `--model <name>`, `--lang <codes>`. Codex provider shells out to the `codex` CLI (no API key needed); openai provider needs `OPENAI_API_KEY`.

## Architecture

### Pipeline (`src/tokenizer.ts`)

`phonemize(text)` flow:

1. `analyzeText(text)` (`src/g2p.ts`) computes the document's primary language and whether Han chars should route to `ja` or `zh`.
2. `preProcessByScript()` splits text into script-based runs (CJK Han / kana / Hangul / Cyrillic / Latin), absorbing neutrals (digits, punct, whitespace) into adjacent runs, then runs each through its `LanguageProcessor.preProcess` (number / abbreviation / currency expansion). Pure-neutral runs fall back to the user's `language` option, then to the detected primary.
3. Optional `anyAscii` Latinization (preserves Han for G2P).
4. Regex tokenize → per-token G2P dispatch → format conversion (IPA / ARPABET / Zhuyin).

### Language registry (`src/g2p.ts`)

All language plugins implement `LanguageProcessor` (`id`, `supportedLanguages`, optional `preProcess(text)`, `predict(word, lang?, pos?)`, `addPronunciation(word, ipa)`). `LanguageRegistry` resolves a request via BCP 47 fallback: exact dialect (`en-GB`) beats parent (`en`), most-specific prefix wins among parents. Scripts that unambiguously identify a language (Han → zh, Hangul → ko, Cyrillic → ru, …) are routed by `detectLanguage()` / `analyzeText()` regardless of the user-supplied `language` option.

### CJK Han disambiguation (zh vs ja)

`analyzeText()` flips Han routing to Japanese when the text has **two or more separate hiragana clusters** — the structural signature of Japanese prose. Single isolated kana (Taiwan-style `植物の優`, `我推薦東京のラーメン`) stays on the Chinese path. The heuristic is empirically motivated by the dominance of decorative single-`の` borrowing in Taiwan Mandarin; see the comment block at `analyzeText` for full rationale and trade-offs.

### Single-instance vs. multi-instance

- `src/index.ts` exports the public API bound to a **global** registry. `src/all.ts` / `src/zh.ts` re-export the same surface but pre-register additional language processors as side effects of import.
- `createPhonemizer({ processors })` (`src/core.ts`) creates an isolated `Phonemizer` with its own `LanguageRegistry`. Use this whenever multiple language configurations must coexist (the test suite and `scripts/eval-with-ai.ts` use it).

### Build layout

Package entry points are declared in `package.json#exports` and rollup builds one bundle per entry (`index`, `core`, `zh`, `all`, `en-g2p`, `zh-g2p`, `ja-g2p`, `ko-g2p`, `ru-g2p`). Each `*-g2p` entry can be imported standalone so consumers only pay for the languages they need.

Rollup's `externalDataPlugin` (`rollup.config.mjs`) keeps `data/**/*.json` as separate files in `dist/` rather than inlining them — required because Hermes (React Native) can't bytecode-compile a 2.8 MB JS object literal. **Don't change this without considering RN consumers.**

### Dictionary sources

- `src-data/` — hand-edited sources (`en/custom.dict`, `en-gb/lexical.json`, `zh/dict.json5`, …)
- `data/` — generated, committed JSON consumed at runtime
- Run `yarn build-dict` after editing `src-data/`. `prebuild` does it automatically.

### English dialect handling (`src/en-gb.ts`)

en-GB is *not* a separate dictionary — it's a rule-based post-processor over the AmE base (non-rhotic conversion, NURSE split, SQUARE/NEAR/CURE diphthongs, word-level overrides). Adding `en-GB` pronunciations means extending the rules or `src-data/en-gb/lexical.json`, not duplicating the AmE dict.

### Text expansion (`src/expand-*.ts`)

Each language has its own expander module that `LanguageProcessor.preProcess` calls:

- `expand-en.ts` — numbers, abbreviations, currency, dates, times, ordinals, phone numbers.
- `expand-zh.ts` — positional Chinese cardinals with 零 fill, `年` digit-by-digit, `点/分` time, currency (¥/$), percent, decimal, `第N` ordinal.
- `expand-ja.ts` — positional hiragana, no rendaku (the ja-g2p syllable map lacks the palatal voiced rows).
- `expand-ko.ts` — Sino-Korean Hangul positional.
- `expand-ru.ts` — positional Cyrillic with feminine forms for тысяча and 1 / 2-4 / 5+ plural agreement on тысяча / миллион / процент / рубль / доллар.

## Conventions

From `.cursor/rules/`:

- **`*-g2p.ts` files are rule-based.** Don't add word lists or per-word special cases — that defeats the point of rule-based G2P. Adjust general rules instead. Debug a G2P module with `new EnglishG2P({ disableDict: true })` to see what the rules alone produce.
- **`pos-tagger.ts`** — keep the algorithm general, no per-word lookup tables.
- **Tests** — don't tweak tests to pass. If an expected IPA value looks wrong, confirm with the user before changing it.
- Don't leave dead comments or vestigial explanations in code.

## Rule Compression

Rules in `en-g2p.ts` grow by accumulation. Compression folds patches back into simpler, more general forms. Run a compression pass whenever a trigger fires.

### Triggers

| Trigger | Condition |
|---|---|
| **Line count** | `en-g2p.ts` exceeds 1150 lines |
| **Session growth** | A single session adds ≥ 3 entries to `PHONEME_RULES` or `SUFFIX_RULES` |
| **Cluster overlap** | `yarn test:eval --cluster` shows the same grapheme appearing as top-hit across ≥ 2 different clusters |
| **Parallel handlers** | `tryMorphologicalAnalysis` gains a new suffix handler that shares base-lookup logic with an existing one |

### Procedure

1. **Identify candidates** — scan `PHONEME_RULES` and `SUFFIX_RULES` for:
   - Adjacent entries producing the same IPA whose regexes differ only in one character or anchor → merge with character-class alternation
   - Entries made redundant by a more-specific rule above them (dead rules) → delete
   - Two morphological handlers that strip different suffixes then perform identical base-lookup + allomorph logic → unify into one handler with a suffix table

2. **Propose the consolidated rule** — express it in the simplest regex that covers all the cases, respecting the existing ordering invariant (more-specific before more-general).

3. **Validate** — both gates must pass before committing:
   - `yarn test` — zero regressions
   - `yarn test:eval` — lenient accuracy must not decrease

4. **Commit the compression separately** from any feature work so the diff is reviewable in isolation.

### What not to compress

- Rules that are adjacent in the array but serve different phonological environments where order is load-bearing.
- The `syllableToIPA` silent-e and vowel-reduction logic — already compact; changes there touch core phonology.
- Any rule whose regex has a comment explaining a non-obvious constraint — collapse only after understanding the constraint.

## Notes

- `phonemize/<lang>-g2p` subpath imports give consumers each language processor class as a default export; pair with `useProcessor(new ...)` or `createPhonemizer({ processors: [...] })`.
- The rule-based G2P was partially LLM-generated and the README explicitly warns it may misfire. Prefer `addPronunciation()` (or extending `src-data/`) over rule edits when fixing a single word.
