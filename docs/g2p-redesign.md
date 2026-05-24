# English G2P Redesign Plan

## Goal

Replace the runtime dictionary dependency with a rule-based + compiled-table system. The dict becomes **build-time training data**, not a runtime artifact. Runtime stays purely deterministic — table lookups + rule application, no learning/inference.

This is a multi-session refactor. Phases are independently mergeable.

## Why

`src/en-g2p.ts` has grown to ~3650 lines with **532 `postBase.replace` calls** — each a one-off patch for a suffix family. This pattern doesn't scale and obscures the underlying linguistics. The dict ships at ~3MB across the package, defeating the lightweight cross-platform goal.

The core insight: most postBase patches are downstream symptoms of **wrong stress placement** + **wrong vowel reduction** in the core pipeline. Fix the pipeline; patches dissolve.

## Architecture

```
build time:                              ship:                runtime:
┌─────────────────┐                      ┌───────────────┐    ┌──────────────┐
│ src-data/en/    │── align → mine ────▶ │ compact       │───▶│ EnglishG2P   │
│   dict.json     │                      │ tables        │    │ pure rules + │
│   (training)    │                      │ + exceptions  │    │ table lookup │
└─────────────────┘                      │ (~hundreds KB)│    └──────────────┘
        │                                └───────────────┘
        │ validate
        ▼
┌─────────────────────────┐
│ src/en/                 │
│   suffixes.ts (table)   │
│   stress.ts   (FSM)     │
│   reduce.ts   (rules)   │
│   exceptions.ts (small) │
└─────────────────────────┘
```

## Math budget

All "math" is build-time only:

- **Aligner**: EM-style grapheme→phoneme alignment over dict
- **Statistics**: MLE over alignments to populate context tables
- **Exception mining**: run rules over dict, threshold deviations as exception candidates

Runtime: no matrices, no probabilities, no training. Just rules + lookup.

## Phases

### P1: Build-time aligner (additive, no runtime change)

**Deliverable**: `scripts/align.ts` that takes `data/en/dict.json` and produces grapheme→phoneme alignments for each entry.

**Output files**:
- `data/en/alignments.json` — compact alignment per word (build artifact)
- Report: top atoms by frequency, unaligned words, low-confidence alignments

**Algorithm**: DP over allowed (grapheme-cluster, phoneme-cluster) atoms. Initial seed by hand (common digraphs, vowel patterns); iterate by inspecting failures.

**Success criteria**: ≥95% of dict entries align with seed atoms. Unaligned set is small and analyzable.

### P2: Suffix + stress + reduction refactor

**Deliverable**: Replace ~60% of postBase rules with three principled modules:

- `src/en/suffixes.ts` — table of `(suffix, ipa, stressShift, reducesBase)`
- `src/en/stress.ts` — FSM: input syllables + suffix tag → stress positions
- `src/en/reduce.ts` — vowel reduction rules driven by stress

`predict()` becomes:
1. Decompose word: strip known affixes iteratively → base
2. Look up base (initially in dict, eventually in compiled table)
3. Apply suffix stress shift
4. Reduce unstressed vowels via rules
5. Phonological adjustments (small, principled set)

**Success criteria**: postBase shrinks to <100 entries (only true phonological adjustments). Eval baseline maintained or improved.

### P3: Letter-cluster context table (runtime integration)

**Deliverable**: Use P1 alignments to mine `(left_ctx, cluster, right_ctx) → IPA` table. Integrate into runtime as replacement for parts of `PHONEME_RULES` + `syllableToIPA`.

**Output files**:
- `data/en/lts.json` — compact context-keyed phoneme table

**Success criteria**: Coverage of all aligned dict entries via table + rules. Hand-written rules in `PHONEME_RULES` shrink significantly.

### P4: Exception mining

**Deliverable**: Run full pipeline (without dict) over dict entries; mine words where rule output deviates beyond threshold from dict ground truth.

**Output files**:
- `src/en/exceptions.ts` — curated list of truly irregular words (target: <2000 entries)

**Success criteria**: With exceptions + rules + tables, accuracy matches current rule+dict accuracy.

### P5: Dict elimination

**Deliverable**: Package no longer ships `data/en/dict.json`. Only ships compiled tables + exceptions.

**Success criteria**: 
- Package size drops significantly
- Lenient accuracy ≥ 75% (current baseline)
- All tests pass

## Status

- [x] Architecture agreed
- [x] **P1**: Aligner (98.14% coverage, 11K contexts, 430 atoms — see results below)
- [ ] **P2**: Suffix table + stress shift + reduction
  - [x] P2.0: Suffix table + decomposer (51% base recovery, 94% IPA tail match)
  - [ ] P2.1: Stress FSM
  - [ ] P2.2: Reduction rules
  - [ ] P2.3: Integration behind flag
  - [ ] P2.4: Default-on, retire postBase
- [ ] P3: Letter-cluster context table
- [ ] P4: Exception mining
- [ ] P5: Dict elimination

### P1 results

`scripts/align.ts` produces:
- `data/en/alignments.json` — per-word `g/p g/p ...` alignment (build artifact)
- `data/en/align-stats.json` — atom frequencies + per-context phoneme distributions

Both are gitignored (regenerable from dict).

**Coverage**: 98,992 / 100,865 alphabetic dict entries aligned (98.14% all / 98.39% ex-acronyms). Remaining 1.6% are foreign proper nouns + abbreviation expansions (out of scope).

**Context findings** (immediately useful for P2 design):

| context | n | dominant | breakdown |
|---|---|---|---|
| `c_o_n` | 1088 | ∅ 50% | ∅ 50% / ɑ 41% / oʊ 5% — "con-" prefix unstressed reduction |
| `e_d_$` | 3060 | d 89% | d 89% / t 11% — past-tense allomorph (voicing assimilation) |
| `n_e_$` | 1627 | ∅ 85% | ∅ 85% / i 13% — magic-e vs final-e |
| `l_l_$` | 1310 | l 60% | l 60% / əl 40% — vowel-final vs consonant-final |
| `a_n_$` | 3152 | ən 85% | ən 85% / n 15% — syllabic n in unstressed final |

These are exactly the rules P2 needs to encode (prefix reduction, allomorphy, syllabic consonants).

## Principles

- **Runtime = pure rules + table lookups.** Never inference at runtime.
- **Linguistic structure is human-designed.** Tables are machine-filled from human-designed schemas.
- **Each phase ships independently.** Tests + eval gates apply at every commit.
- **No regression in lenient accuracy** unless documented and accepted.
- **Compression triggers still apply** (see AGENTS.md).
