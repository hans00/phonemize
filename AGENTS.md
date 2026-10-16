# AGENTS.md

Shared guidance for Claude Code, Codex, Cursor and other coding agents. `CLAUDE.md` forwards here.
This file contains active policy. [Historical evidence](docs/AGENTS-history-2026-10-11.md) is archived;
read only the relevant section when investigating a past experiment, never the whole archive by default.
Metric definitions, limits and the evaluation audit are in [docs/BENCHMARK.md](docs/BENCHMARK.md#12-evaluation-audit-2026-10-11).

## Priorities and boundaries

- Improve general G2P rules efficiently in accumulated batches. Reuse diagnosis and candidate replay;
  do not dispatch one sub-agent per word or introduce a model merely to raise a score.
- Every pronunciation improvement must consider POS and full sentence context, including unaffected
  noun/adjective/verb controls. Stress-stripped isolated-word gains do not prove contextual correctness.
- Solve with rules, not new runtime datasets, trained models or name lexicons. Existing vouched misaki
  homograph supplementation is accepted; evaluation-only references must never enter runtime tables.
- No whole-word pronunciation maps or per-word exceptions in `src/<lang>/g2p.ts` or the POS tagger.
  User-reported words need an issue regression and a class fix. If no class fix passes every gate,
  use `src-data/en/custom.dict` and record the open class. Foreign proper names are usually coverage gaps.
- Preserve existing work. Do not change IPA expectations merely to make tests pass. Independently verify
  corrections against standard authoritative dictionaries; those documented readings need no further
  user confirmation. Ask only when the evidence is missing or conflicting. Reference/test corrections
  are not pronunciation gains. Keep non-obvious rule constraints; remove dead code and explanations.

## Learning and adoption loop

1. **Freeze before changing behavior.** Save rule predictions, runtime parity dumps, common-word reports,
   stress-aware results and context reports, plus source/data hashes. Keep references, populations,
   filters and scorer versions fixed throughout the comparison.
2. **Diagnose actual routes.** Use `yarn test:eval --cluster`, `yarn diagnose:routes`,
   `yarn diagnose:postlex` and `yarn trace <words>`. Postlex diagnosis measures rule removal through
   the real pipeline; `--all --include-long` covers the whole dictionary and records recursive stems.
   Diagnose context on the homograph/IPA **train** split; eval is acceptance, not repeated tuning data.
3. **Rank candidate classes by wins AND losses.** Simulate both repaired failures and broken correct
   words. `yarn learn:rules [--structural]` proposes offline conditional corrections with spelling-family
   folds and TRAIN-only selection. Its limited route coverage and small CV gains are not adoption evidence.
   Replay actual dispatch, including the unsplit alternative; matching a replica's string proves nothing.
4. **Fix the class and add paired regressions.** Primary locations: `src/en/syllabify.ts`
   (`PHONEME_RULES`, `SUFFIX_RULES`, stress), `postlex.ts`, `g2p.ts` morphology/compound dispatch,
   and `pos-tagger.ts`. Preserve first-match ordering and unchanged neighboring environments.
   Include stems, derivations, inflections, prefixes, OOV forms and both POS readings where relevant.
5. **Measure the frozen-table candidate, then rebuild.** Dump all rule-path words before/after;
   review every changed prediction and win/loss list. Run `yarn build-dict` before final adoption gates.
   Stem eviction can affect unrelated derivatives: inspect the dependency-aware re-pin summary and
   common-word runtime diff, especially if the re-pin count changes by an order of magnitude.
6. **Validate all gates below.** At least one pronunciation metric must improve; no other tracked
   accuracy metric may fall. Explicit paired controls must have zero regressions. Source/reference,
   normalization or table-convention changes are separate evidence, never counted as rule gains.
7. **Accumulate and commit only when qualified.** Check compression triggers first. Refresh the
   English-subset, runtime parity, stress-aware, homograph and context baselines in the qualifying improvement
   commit. Keep smaller validated gains uncommitted and preserve the historical full-dict target.

## Evaluation: what to measure and what passes

| Command | Measures | Adoption criterion |
|---|---|---|
| `yarn test`, `yarn typecheck` | Regression tests and source types | All pass; a TODO is still an unresolved requirement |
| `yarn test:eval` | Full-dict rule-path strict/lenient; stress stripped | Neither count decreases against frozen before-run |
| `yarn test:eval --subset common` | Non-foreign frequency-list English subset, including top-5000 slice | Strict/lenient counts nondecreasing on both slices; main commit metric is full-subset strict |
| `yarn test:parity --dump FILE` | Default pipeline vs dictionary, stress stripped | Strict nondecreasing against committed baseline and before-run; review runtime win/loss list |
| `yarn test:common-accuracy` | Public API segments vs pinned CMUdict, 5000 items | Default >=90% AND nondecreasing vs before-run; also measure `--rules` and require nondecrease |
| `node --require tsx/cjs scripts/evaluate-strict.ts` | Stress-aware en-US phonemic headline | Correct count nondecreasing vs before-run; report error buckets |
| `yarn test:homographs` | Nearest labelled reading in full sentences | Eval correct count nondecreasing vs baseline and before-run; ties/alignment failures count as wrong |
| `yarn test:ipa` | Exact/lenient IPA with primary stress; four default/rules x auto/known-POS cells | All cells, per-reading/per-class counts, balanced strict and fixed POS-supported subset nondecreasing; every explicit control preserved |

**Exit status is insufficient for report-only commands.** `test:eval`, `evaluate-strict.ts` and
`rule-diff compare` print results without rejecting score decreases. Compare exact counts manually
in the review evidence. CMU `--rules` currently misses its legacy 90% floor; record the existing failure
and compare nondecrease, never claim that floor passed. LLM article scores are stochastic diagnostics,
not a deterministic replacement for these gates. Use `node --require tsx/cjs scripts/<script>.ts`
with the same arguments when the `tsx` CLI's IPC is unavailable in the sandbox.

### Baselines and commit minimum

- Authoritative committed scores: `scripts/eval-common-baseline.json`, `parity-baseline.json`,
  `eval-strict-baseline.json`, `homograph-baseline.json`. `context-ipa-baseline.json` is the initial
  version-specific context baseline. Read the files and current checkout;
  historical narrative scores may be stale.
- `scripts/eval-baseline.json` is the retained **86.998% historical lenient target**, reached with
  subsequently removed gram tables. It is not today's no-regression floor and must not be lowered.
- Normal improvement commits require **>=1 absolute percentage point** of English-subset strict
  improvement over the previous committed baseline, with unchanged denominator and all other gates.
  For n=6990 this needs at least 70 extra correct words. The 2026-10-16 committed baseline
  has 5200/6990; the next ordinary batch therefore needs >=5270/6990.
- The completed isolated-word 70% strict /90% lenient checkpoint is unchanged. Long-term English-subset
  targets remain >=80% strict /90% lenient. Context has its own fixed baseline, not that isolated goal.
- POS-only gains can accumulate without meeting the isolated strict commit threshold. Do not invent
  score gains, reset a baseline, split tiny commits or treat evaluator maintenance as pronunciation gain.
  A user-requested checkpoint exception does not waive the rule for future commits.

### POS/context reference contract

- See [benchmark sections 10-12](docs/BENCHMARK.md#10-pos-sensitive-ipa-evaluation-design-2026-10-07).
  `context-ipa-v1` preserves original sentences, duplicate occurrences and UTF-8 spans. Gold IPA is
  independently source-checked, not produced by current predictions or runtime homograph tables.
- Strict requires one complete accepted reading-specific variant plus contrastive primary stress.
  Lenient permits one unprotected phone edit, preserving stress and every reading contrast.
  Missing output/stress, malformed IPA, ties, alignment failures and unsupported POS remain failures.
- Reading-POS, tense/morphology and sense are separate. `!V` is not a gold noun/adjective annotation.
  Known-POS runs override only the target POS, never expected IPA, tense or sense; other tokens must
  remain identical. Do not remap adjective gold into noun tags to hide an API limitation.
- Initial cohort: 103 original eval occurrences across ten lemmas +5 controls =108; 22 readings.
  Lexical POS associations are source-checked, not human token-UPOS annotations. Twenty sense cases
  have unknown POS and remain failures in known-POS cells; the fixed supported subset is 88 cases.
  This is a targeted diagnostic, not general-text or POS-tagging accuracy. Expand via independent
  annotation and an explicit new reference version; preserve the old benchmark for comparison.
- Run both context gates after rebuild, including paired reading regressions. Reports retain full IPA,
  phone/stress errors, coverage, hashes and all case win/losses. Review non-target prose changes too.
- Reference/cohort/scorer/adapter changes invalidate comparison. Initialize a new version explicitly,
  retain before/after evidence and re-score unchanged prediction snapshots. `--update-baseline` must
  refuse regressions under an unchanged contract. A new evaluator baseline is not a runtime improvement.
- The past `/ɹid/` expectation for “I read that book yesterday” was false and removed previously.
  Required `/ɹɛd/` remains a pending engine regression; the context scorer already penalizes it.

## Measurement traps

- `disableDict: true` still allows lexical STEM lookup through morphology. It is a rule-path diagnostic,
  not a data-free pipeline. Do not add whole-target homograph lookup only to this path to inflate it.
  Derived-word tests should pin the segment the rule owns when re-mining can change the stem.
- `postlex.ts` applies only to rules; `phonotactics.ts` also rewrites dictionary output. Measure changes
  on both routes. Do not merge them or bypass phonotactics on lexical hits for easy parity wins.
- Keep runtime `normalizeStrut`. Dictionary stressed schwa vs CMU STRUT is a notation disagreement;
  removing the adapter can raise dictionary parity while lowering real common-word correctness.
  Legacy scorers intentionally differ in normalization; do not silently redefine them.
- The active build runs base dictionaries, seeds, verified compound parts and gram-free exception mining.
  Stress/vowel gram miners are **disabled**; do not re-enable them to recover the old target.
  Existing ending-stress rule tables require >=20 supporting words, >=75% modal agreement and
  >=3 agreeing top-5000 words; a surname-dominated class is not English coverage.

## Rule compression

Count all five rule modules: `g2p.ts`, `syllabify.ts`, `postlex.ts`, `morph-table.ts`, `morph-parser.ts`.
Do not evade the trigger by relocating rule code. Count code with block-comment awareness; omit
blank lines, `//` comments and whole block comments. Last pass: **3245** code lines (2026-10-04).

Run compression when any trigger fires:

- `g2p.ts` exceeds 1150 code lines, or five-module total exceeds **3395** (+150 since last pass).
- A session adds >=3 `PHONEME_RULES`/`SUFFIX_RULES` entries.
- The same grapheme is a top hit in >=2 failure clusters.
- A new morphology handler duplicates existing base lookup/allomorph logic.

Merge equivalent adjacent rules, delete unreachable entries or consolidate repeated composition into
one suffix table. Respect specific-before-general order, documented constraints, and core silent-e/
vowel-reduction behavior. For a behavior-neutral refactor, require identical before/after
`scripts/snapshot-dump.ts` predictions plus tests/types. If output changes, use every adoption gate.
Keep compression separately reviewable within the accumulating batch; the +1-point commit minimum
still applies. Record the new five-module code count after each compression pass.

## Architecture and routine commands

- Shared pipeline: `src/g2p.ts` analyzes language/script and preprocesses runs, then `src/tokenizer.ts`
  tokenizes, dispatches G2P and formats output. Processors implement `LanguageProcessor` with BCP47
  dialect fallback. Preserve contextual boundaries and number/abbreviation expansion.
- Language code lives in `src/<lang>/`; registry/core/tokenizer/utils remain shared. Han routes to
  Japanese only with >=2 separate hiragana clusters; a decorative single kana stays Chinese.
- `src/index.ts` uses a global registry. Use `createPhonemizer({ processors })` for isolated instances.
  `phonemize/<lang>-g2p` exports the processor class as default; keep standalone entry points working.
- Edit sources in `src-data/`; `data/` is generated runtime JSON. en-GB postprocesses the AmE base;
  extend `src/en/gb.ts` or `src-data/en-gb/lexical.json`, not a duplicated dictionary.
- `yarn build-dict` rebuilds data; `yarn build` runs it via prebuild, then Rollup bundles all exports.
  Keep `data/**/*.json` external in dist: Hermes cannot compile the giant inlined dictionary literal.
- `yarn test -- <pattern>` selects Jest tests; `yarn test:coverage` adds coverage. `yarn test:ai-eval`
  is optional labelled diagnosis. Offline deterministic gates require their existing pinned/hash-checked
  caches; `test:common-accuracy --download` and `test:homographs --download` prepare them once.
