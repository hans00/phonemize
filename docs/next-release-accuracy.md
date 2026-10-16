# Next-release accuracy plan

The release target remains strict accuracy **above 90%** on both fixed English
common-word populations. Passing the previous 70% checkpoint does not satisfy
this release target. References, filters, normalization and denominators stay
fixed; no runtime model, name lexicon or whole-word G2P/POS exceptions are added.

## Release requirements and current checkpoint

| Metric | Release requirement | Current |
|---|---:|---:|
| English common rules strict | >=6292/6990 | 5200/6990 (74.39%) |
| Common top-5000 slice rules strict | >=3256/3617 | 2794/3617 (77.25%) |
| Public CMU default segments | >=4739/5000 | 4742/5000 (94.84%) |
| Context default/automatic strict | >=87/108 | 80/108 |
| Homograph eval | >=1454/1615 | 1426/1615 |
| Issue #28 apostrophe-name handling | Class regression and packaged verification | Passed |

Remaining strict gaps: 1092 common words, 462 top-slice words, 7 context
occurrences and 28 homograph eval cases. These counts are release gaps, not a
claim that independent isolated fixes will transfer to full sentences.

## Adopted accumulated batch (2026-10-16)

General spelling, morphology and boundary fixes recover initial ed nuclei,
weak be/re+ew boundaries, Greek combining forms, weak ci before -ate families,
nonverbal -ly stems, nasal/stop -ation environments, -asm voicing, voiced
-sday and CHOICE+weak-al. Shared root recovery preserves inflections after
lexical eviction. Custom compound chunks use existing caller pronunciations;
exception re-pin diagnosis verifies actual causal regressions rather than
attributing every spelling overlap. Equivalent ph/f and hard c/k rules were
compressed with frozen prediction equality evidence. Five-module code count:
3395 (g2p 1149, syllabify 1715, postlex 484, morph-table 21, morph-parser 26).

This batch raises common strict from the previous committed 5120 to 5200/6990,
an 80-word / 1.14-point improvement, exceeding the ordinary 70-word threshold.
The immediately preceding uncommitted main snapshot had 5188 correct; the final
integration adds 12 relative to that snapshot. Neither comparison changes the
population or scoring contract. The historical full-dictionary lenient target
in eval-baseline.json remains unchanged.

| Deterministic metric | Frozen main before | Rebuilt after |
|---|---:|---:|
| Common strict / lenient, n=6990 | 5188 / 6322 | 5200 / 6325 |
| Top slice strict / lenient, n=3617 | 2787 / 3329 | 2794 / 3330 |
| Full rules strict / lenient, n=105067 | 61526 / 83307 | 61608 / 83337 |
| Runtime parity strict / lenient, n=100806 | 94771 / 100677 | 94771 / 100677 |
| Stress-aware headline / exact, n=90310 | 54176 / 44989 | 54235 / 45051 |
| CMU default / rules, n=5000 | 4742 / 3976 | 4742 / 3984 |
| Homograph eval, n=1615 | 1426 | 1426 |
| Context default-auto / default-known / rules-auto / rules-known, n=108 | 80 / 83 / 42 / 38 | 80 / 83 / 42 / 38 |

All 432 context prediction rows, every reading/class, balanced scores, fixed
88-case supported subset and reference/scorer contract were compared unchanged.
All 4838 tests across 172 suites and typecheck pass. The report-only evaluator
counts were compared explicitly; exit status alone was not used. CMU rules
still fails its legacy 90% floor (3984/5000), with an improvement over the frozen
before-run; that existing failure is not reported as a passing floor.

The real rebuilt tables match the independently evaluated isolated candidate.
Freshly extracted package CJS and ESM main/core/English entry points pass native
smoke tests, including own packaged table equality, issue #28 names, all retained
class controls and custom override behavior. No version bump, publish or remote
push is part of this checkpoint.

## Dictionary and caller-pronunciation contract

The user clarified on 2026-10-16 that pronunciations explicitly supported by a
standard authoritative dictionary can be corrected without another confirmation.
The pinned CMU entry `encase EH0 N K EY1 S` supports /ɛnˈkeɪs/; its old initial-
stress test was corrected to agree with both the reference and existing paired
regression. This test correction is not counted as a pronunciation gain.

Custom roots flow through productive morphology and custom-aware decomposition;
no per-word compatibility mapping is added to preserve an obsolete lexical-child
shadow. Direct explicit whole-word overrides remain highest priority. Lexical
whole-word lookup still applies where the engine uses that route. Build-time
entry removal can therefore expose productive inheritance. Tests cover edge to
edges/edging, royalty/loyalty to plurals, custom compound chunks and direct child
overrides. These caller-contract changes are documented separately from accuracy.

## Continue toward the release target

1. Diagnose TRAIN context and general spelling/morphological classes in batches;
   preserve full sentences, duplicate occurrences, POS readings and negative
   controls. Keep heldout eval for acceptance rather than repeated tuning.
2. Rank real dispatcher gains and losses, including unsplit alternatives,
   recursive stems, OOV forms and explicit custom pronunciations. Reject broad
   reductions that break correct ordinary words or names.
3. Freeze predictions and hashes before changes; measure frozen tables, rebuild,
   inspect re-pins and all changed runtime/rules predictions, then run every gate.
4. Accumulate qualifying gains under the normal commit minimum. Do not restore
   disabled gram miners, add word lists to G2P/POS, lower the historical target,
   or count normalization/reference maintenance as runtime improvement.

The evidence directory is
`/tmp/phonemize-next-release/pending-class-batch-2026-10-16/`.
`authorized-final/`, `authorized-final-exact-counts.json`,
`authorized-build.log`, `authorized-artifact.log` and the extracted package retain
the final verification. Earlier rejected prototypes and full chronological
research notes are preserved there in
`research-history-through-authorized-adoption.md`. They are diagnosis history,
not adopted behavior or release acceptance.
