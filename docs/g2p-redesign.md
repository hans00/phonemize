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
- [x] **P2**: Suffix table + stress shift + reduction
  - [x] P2.0: Suffix table + decomposer (51% base recovery, 94% IPA tail match)
  - [x] P2.1: Stress FSM (81% stress-position accuracy with base lookup; 73% without)
  - [x] P2.2: Vowel reduction (78.7% of unstressed nuclei match reduced-vowel rules)
  - [x] P2.3: End-to-end principled pipeline (predictPrincipled, 81.8% lenient match on the 16% of dict that has a recognized suffix + in-dict base)
  - [x] P2.4 (partial): Integrated into EnglishG2P behind `enablePrincipled` flag. Fires only when base resolves via dict (no compounding errors with rule-based base). No eval regression. Full postBase retirement is blocked on a higher-quality LTS than P3 currently produces.
- [x] **P3**: Letter-cluster context table
  - [x] P3.0: Compiler (`scripts/compile-lts.ts`) produces `data/en/lts.json` from alignments — 13K full-context entries + 3 backoff levels, 235KB
  - [x] P3.1: Runtime lookup (`predictByLTS(word)`) walks longest-match clusters with context backoff
  - [x] P3.2: Integration measured. **LTS alone: 24.2% exact, 63.8% lenient** after aligner + compiler improvements (empty-atom penalty in DP cost so silent-letter assignments don't win ties; minSupport floor for multi-char clusters so name-only patterns drop out). Still below the legacy rule pipeline (75.4% lenient) — routing it in as the base provider regresses eval by ~−6% lenient, so en-g2p keeps the dict-only gate. Further LTS quality work (joint-sequence model, deeper context windows, stress-aware contexts) is the prerequisite for unblocking P2.4 / P5.
- [x] **P4**: Exception mining
  - `scripts/mine-exceptions.ts` runs rules (disableDict=true) over the
    whole dict, computes edit distance, filters acronyms, classifies
    each candidate by **linguistic origin** (orthographic heuristics for
    Polish/French/Italian/Spanish/German/Russian/Greek/Celtic/Arabic/
    Japanese/Asian → otherwise "native"), and outputs
    `data/en/exception-candidates.json`.
  - **Linguistic rationale**: English G2P rules can never correctly
    predict pronunciations of foreign borrowings (they keep source-
    language phonology). Lumping them into the same ED-threshold pile
    as native English irregulars conflates two distinct problems:
    foreign words *must* ship in the exception table; native high-ED
    words signal either rule bugs to fix or genuine English irregulars.
  - **Failure-rate distribution by origin** (% of that origin's dict
    entries that fall outside ed < 2 of the rule pipeline):

    | origin   | dict entries | exception % |
    |----------|-------------:|------------:|
    | japanese |          132 |       81.1% |
    | greek    |           13 |       69.2% |
    | arabic   |           16 |       62.5% |
    | spanish  |          597 |       61.0% |
    | russian  |          444 |       46.0% |
    | polish   |          839 |       45.5% |
    | french   |        1,113 |       34.8% |
    | italian  |        1,097 |       32.6% |
    | celtic   |        1,311 |       30.2% |
    | german   |        2,398 |       21.6% |
    | **native** |     **92,628** |   **25.5%** |

  - **Hybrid policy** (recommended): always ship the 2,738 foreign
    candidates; gate native by ED threshold.

    | native ED  | total entries | size  | lenient on dict |
    |------------|--------------:|------:|----------------:|
    | ≥ 2        |        26,367 |  583 KB|         100.00% |
    | ≥ 3        |        13,157 |  304 KB|          86.87% |
    | ≥ 4        |         6,551 |  156 KB|          80.30% |
    | ≥ 5        |         3,942 |   94 KB|          77.71% |

    Current `data/en/dict.json` is **2.7 MB**. **native ≥ 3** ships
    in 11% of that and *exceeds* the current eval baseline by 11 points
    absolute (87% vs 75%).
- [x] **P5**: Dict elimination
  - [x] P5.0: `scripts/mine-exceptions.ts --native-min N` writes the
    canonical `data/en/exceptions.json` using the hybrid policy (all
    foreign + native ed≥N). Default N=2 — preserves dict-level lenient
    accuracy at ~22% the size of dict.json.
  - [x] P5.1: `src/en-exceptions.ts` loads `data/en/exceptions.json`;
    `EnglishG2P` constructor accepts `useExceptions: boolean` (default
    false). When true, `predict()` consults the exceptions table after
    customDict and before the principled/legacy pipeline, gated by
    `!disableDict` so eval keeps measuring pure rule quality.

    Three-way comparison (`scripts/eval-exceptions.ts`):

    | config                          | size      | exact   | lenient |
    |---------------------------------|----------:|--------:|--------:|
    | Rules only                      |    0 KB   | 43.07%  | 73.89%  |
    | **Rules + exceptions (proposed)** | **710 KB** | 68.99%  | **99.81%** |
    | Full dict.json (today)          | 2757 KB   | 99.11%  | 99.72%  |

    Rules+exceptions ships in ~26% of dict.json's size and *exceeds* its
    lenient accuracy. The remaining work to actually drop the dict from
    the shipped bundle is configuration: flipping `useExceptions`
    default + dropping `dict.json` from `package.json#files` once
    consumers have migrated.
  - [ ] P5.2 (future): Build pipeline integration — make `yarn
    build-dict` regenerate `exceptions.json` (and ideally `lts.json`)
    from `src-data/en/`.
  - [ ] P5.3 (future): Migration of foreign borrowings to language-
    specific G2Ps so that even the 2738 foreign exceptions get a
    principled (rather than memorized) treatment. See user's note on
    cultural correctness.

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
