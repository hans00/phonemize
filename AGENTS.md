# AGENTS.md

Project guidance for coding agents (Claude Code, Codex, Cursor, …) working in this repository. The Claude Code-specific entry point `CLAUDE.md` forwards here.

## Heuristic Learning Loop

This project uses Heuristic Learning: the G2P rules are the learnable policy; Claude is the learning agent. The loop runs across sessions using Claude's memory system for continuity.

### Running the loop

1. **Diagnose** — `yarn test:eval --cluster`: find top rule failure patterns
2. **Trace** — `yarn trace <word> [word...]`: see which rule fired for specific words, pre- and post-dictionary
3. **Fix** — edit `PHONEME_RULES`/`SUFFIX_RULES` (in `src/en/syllabify.ts`), the post-lexical tables (`src/en/postlex.ts`), or `tryMorphologicalAnalysis` (in `src/en/g2p.ts`)
4. **Validate** — `yarn test` (zero regressions), `yarn test:eval` (rules-only lenient accuracy does not decrease), `yarn test:parity` (runtime strict parity ≥ baseline). Measure a candidate rule as a win/loss list over the whole dict before adopting it (rules-only dump before/after; `yarn test:parity --dump` for the runtime path)
5. **Commit** — if all gates pass; update baselines with `yarn test:eval --update-baseline` / `yarn test:parity --update-baseline`

Check compression triggers (see Rule Compression section) before committing any fix.

### Reading cluster output

`--cluster` groups mismatch words by the rule that fired at the first IPA divergence point. Clusters dominated by foreign proper nouns (long words, unusual consonant clusters) signal a coverage gap that is out of scope for English rules — skip those and focus on clusters with recognisable common English words.

### Eval baselines

`scripts/eval-baseline.json` (rules-only, `yarn test:eval`) and `scripts/parity-baseline.json` (shipped pipeline, `yarn test:parity`) store the last committed scores; each run shows its delta automatically. Update a baseline only after a confirmed improvement is committed.

`yarn test:eval` measures the rule path alone (`disableDict: true`). `yarn test:parity` measures what users get — exceptions table + morphology + fallbacks + rules — over every dict word, and exits non-zero when strict parity drops. Both of the v2.0.x bug reports (#27 `wind`/`solutions`, #28 `Seann`) were composition failures that the rules-only score cannot see, so a change to the table miner, a lookup fallback or a morphology handler is judged by parity, not by `test:eval`.

The rules-only baseline (86.998% lenient, dated 2026-06-13) was reached with the mined stress/vowel gram tables that `build-pipeline.ts` no longer runs (they scored dictionary match but hurt real pronunciation quality). The rule path alone has scored 71–74% lenient since; the baseline is kept as the target to recover by rule improvements, so its delta is negative until then — the gate on a change is "no decrease", not "≥ baseline".

### Improvement goal (set 2026-09-09)

The runtime path on real text is what users report against, so the goal is measured there. Numbers on 2026-09-09 (`yarn test:parity`, `yarn test:common-accuracy`, `yarn test:eval`), before → after the first rule pass:

| Metric | Command | 2026-09-09 | Target |
|---|---|---|---|
| Runtime strict parity over dict | `yarn test:parity` | 89.54% → 90.52% | ≥ 92% |
| Top-5000 segment accuracy vs CMUdict | `yarn test:common-accuracy` | 90.74% → 91.20% | ≥ 93% |
| Rules-only lenient accuracy | `yarn test:eval` | 71.48% → 73.13% | ≥ 75%, then back to the 86.998% baseline by rules alone |
| Rules-only top-5000 accuracy | `yarn test:common-accuracy --rules` | 60.98% → 65.32% | ≥ 70% |
| evaluate-strict headline (en-US phonemic) | `tsx scripts/evaluate-strict.ts` | 43.85% → 47.27% | ≥ 50% |

Parallel worktree agents, one rule family each, merged sequentially, produced both passes: the first measured strict +1547/−308 on the rule path, the second (unstressed reduction, back vowels, tense i/e) a further +709/−179 with +68/−1 on the top-5000 list. A rule change is only visible to parity after `yarn build-dict` re-mines the table, so parity is judged after the rebuild, never in a worktree.

Diagnosis that fed the second pass: group the rules-only mismatches in `scripts/.common-accuracy-cache/rules-report.json` by their single-edit signature (normalise ɫ→l first, and drop the 36 closed-class function words, which are lexical by design). That ranks the remaining classes by how many common words each would fix.

The rules-only baseline is deliberately NOT lowered to today's number: the gap is the ground the rules must recover without the removed gram tables.

Rules of the goal:

- Every user-reported word gets a regression test in `__tests__/issue-<n>.test.ts` and a fix for its *class* (e.g. #28 → doubled-final-consonant name variants), never a per-word entry. If no class fix passes the gates, the word goes to `src-data/en/custom.dict` and the class is recorded here as open.
- Each loop session moves at least one metric up without moving any other down; both baselines are updated in the same commit as the improvement.
- Rules-only accuracy is a means, not the end: a rule fix that raises `test:eval` but lowers parity is rejected.

Open classes: none.

Compression (2026-09-10, first pass): it ran snapshot-gated (empty diff over 1.3M predictions) and took the three modules from 2930 to 2685 lines. Still 85 over the ceiling; what remains is comment carrying the dict ratio behind each rule, which the procedure says to keep. The opt-in `predictPrincipled` path is the one block that may be vestigial — retiring it is a behaviour decision, not a compression.

Found, not fixed (2026-09-10): `syllabify` splits `e|xist`, so two-syllable ex- words get initial stress; 3+-syllable penult stress is a coin flip on syllable heaviness, and no feature tried (heaviness, onset cluster, coda, openness) got a two-syllable `a-` prefix above 64%, so it needs suffix class or POS; no post-primary secondary-stress rule exists; `sch`+vowel → /sk/ and `og$` → /ɔɡ/ both lose on the name-heavy dict (school/scheme/blog are lexical); `-iver` has no orthographic discriminator between driver and river, so the v-exclusion in `iFire` stays; open `wa` (quality, water) has no majority in the dict.

Compression owed again (2026-09-10): the second pass took the three modules from 2685 to 2789 lines.

## Commands

- `yarn build` — compiles dictionaries (via `prebuild` → `build-dict`) then rollup-bundles all entry points to `dist/`
- `yarn build-dict` — regenerates `data/**/*.json` from `src-data/` sources (run manually after editing `src-data/`)
- `yarn test` — Jest, picks up `__tests__/**/*.test.ts`. Single test: `yarn test -- en-rule-g2p`
- `yarn test:coverage` — Jest with nyc coverage
- `yarn typecheck` — `tsc -b` (no emit)
- `yarn test:eval` — `scripts/evaluate.ts`: Levenshtein distance of rule-based G2P vs. dictionary
- `yarn rule-diff dump <out>` / `yarn rule-diff compare <before> <after>` — `scripts/rule-diff.ts`: rules-only per-word dump and win/loss report (strict, lenient, top-5000) between two dumps; the adoption test for a rule change
- `yarn test:parity` — `scripts/evaluate-parity.ts`: shipped pipeline (dict enabled) vs. dictionary; `--dump <file>` writes per-word output for diffing two states
- `yarn test:common-accuracy` — `scripts/evaluate-common-accuracy.ts`: top-5000 frequency words vs. CMUdict through the public API (`--rules` for rules-only). First run needs `--download` to fetch the pinned, hash-checked inputs into `scripts/.common-accuracy-cache/`
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

### Source layout (by language)

Language-specific modules live under `src/<lang>/` (`src/en/`, `src/zh/`, `src/ja/`, `src/ko/`, `src/ru/`) — e.g. `src/en/g2p.ts`, `src/en/syllabify.ts`, `src/zh/g2p.ts`, `src/<lang>/expand.ts`. Shared/cross-language code stays flat in `src/` (`g2p.ts` registry, `tokenizer.ts`, `core.ts`, `index.ts`, `all.ts`, `zh.ts`, `utils.ts`, `consts.ts`, `anyascii.ts`). The public `phonemize/<lang>-g2p` export names are unchanged — rollup maps each `<lang>-g2p` entry to `src/<lang>/g2p.ts`.

### English dialect handling (`src/en/gb.ts`)

en-GB is *not* a separate dictionary — it's a rule-based post-processor over the AmE base (non-rhotic conversion, NURSE split, SQUARE/NEAR/CURE diphthongs, word-level overrides). Adding `en-GB` pronunciations means extending the rules or `src-data/en-gb/lexical.json`, not duplicating the AmE dict.

### Text expansion (`src/expand-*.ts`)

Each language has its own expander module that `LanguageProcessor.preProcess` calls:

- `src/en/expand.ts` — numbers, abbreviations, currency, dates, times, ordinals, phone numbers.
- `src/zh/expand.ts` — positional Chinese cardinals with 零 fill, `年` digit-by-digit, `点/分` time, currency (¥/$), percent, decimal, `第N` ordinal.
- `src/ja/expand.ts` — positional hiragana, no rendaku (the ja G2P syllable map lacks the palatal voiced rows).
- `src/ko/expand.ts` — Sino-Korean Hangul positional.
- `src/ru/expand.ts` — positional Cyrillic with feminine forms for тысяча and 1 / 2-4 / 5+ plural agreement on тысяча / миллион / процент / рубль / доллар.

## Conventions

From `.cursor/rules/`:

- **`src/<lang>/g2p.ts` files are rule-based.** Don't add word lists or per-word special cases — that defeats the point of rule-based G2P. Adjust general rules instead. Debug a G2P module with `new EnglishG2P({ disableDict: true })` to see what the rules alone produce.
- **`src/en/pos-tagger.ts`** — keep the algorithm general, no per-word lookup tables.
- **Tests** — don't tweak tests to pass. If an expected IPA value looks wrong, confirm with the user before changing it.
- Don't leave dead comments or vestigial explanations in code.

## Rule Compression

Rules grow by accumulation. Compression folds patches back into simpler, more general forms. Run a compression pass whenever a trigger fires.

The English rule engine spans three modules (refactored 2026-06, snapshot-verified byte-identical):

- `src/en/g2p.ts` — dictionary/morphology/compound dispatch, `tryMorphologicalAnalysis`, `tryCompoundSplit`
- `src/en/syllabify.ts` — syllabification, stress, `PHONEME_RULES`/`SUFFIX_RULES` (first match wins; order is load-bearing)
- `src/en/postlex.ts` — rule-path-only post-lexical correction tables. NOT mergeable into `src/en/phonotactics.ts`, which also applies to dict output.

### Mined gram tables (2026-06)

`build-dict` also runs three miners that learn statistics from `data/en/dict.json` and emit runtime data (gitignored, regenerated each build):

- `scripts/mine-compound-parts.ts` → `compound-parts.json` — verified compound head/tail tables (both halves must verify; that requirement is the load-bearing filter)
- `scripts/mine-stress-grams.ts` → `stress-grams.json` — ending-gram × syllable-count → primary/secondary stress position from end
- `scripts/mine-vowel-grams.ts` → `vowel-grams.json` — ending/initial-gram → stressed/final/initial vowel + final coda

Adoption test everywhere: support ≥5, modal value ≥70%, net-fixes ≥3 vs the gram-free pipeline. Miners RESET their own table before importing the pipeline (re-mining against a live table un-adopts its own grams). Keys that depend on syllable count use the RUNTIME-visible count, not the dict's. New positions should follow the same recipe; 5-letter grams measured net-negative (don't re-add).

For provably score-neutral refactors, gate with `tsx scripts/snapshot-dump.ts` before/after: an empty diff over its 1.3M predictions freezes both eval scores by construction.

### Triggers

| Trigger | Condition |
|---|---|
| **Line count** | `src/en/g2p.ts` exceeds 1150 lines, or `src/en/g2p.ts` + `src/en/syllabify.ts` + `src/en/postlex.ts` together exceed 2600 |
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
