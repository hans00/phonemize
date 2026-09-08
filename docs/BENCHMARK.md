# Phonemize — G2P Benchmark & Language Support

This document describes **how we measure pronunciation quality**, **which public
datasets we use**, and **the current per-language scores**. It is meant to be
fully reproducible — every number below can be regenerated with the commands
given here.

> **Honesty first.** These scores come from an **LLM-judged phonemic rubric**,
> not from human-verified gold transcriptions. That makes the evaluation cheap,
> multilingual, and tolerant of legitimate pronunciation variants — but it is
> **noisy (≈ ±2–3 % run-to-run)** and can occasionally misjudge a word. Treat
> the numbers as *indicative*, not exact. Where a result depended on a grader
> mistake, we say so.

---

## 1. Why not exact dictionary match?

The obvious way to score G2P is to compare output against a pronunciation
dictionary (e.g. CMUdict) and count exact matches. We deliberately **do not**
use that as the headline metric, because:

- **A word has many correct pronunciations.** Dialect (rhotic/non-rhotic),
  free variation (`ɪ`~`ə`, cot–caught), and notation choices (clear vs dark l,
  `dʒ` vs `ʤ`) all differ without being "wrong". Exact match punishes all of
  them.
- **The dictionary itself is not ground truth.** Our own audits found the
  source dict mis-stressing words, dropping final consonants, and listing only
  one of several valid variants. Optimising for dict-match would mean
  *reproducing those errors*.

So we score **phonemic validity** — "is this a correct pronunciation of the
word?" — judged against the phonemic system of the language.

---

## 2. Scoring method

`yarn test:ai-eval` (`scripts/eval-with-ai.ts`) does the following:

1. **Tokenise** each test passage. The default mode deduplicates words; use
   `--context` to retain every token occurrence in its original sentence.
2. **Phonemize** each word or token occurrence to IPA with the library (full
   system: rules + any lexicon).
3. **Judge** every word with an LLM (the [Codex CLI](https://github.com/openai/codex),
   model `gpt-5.5`, or the OpenAI API) against an explicit **phonemic rubric**:
   - `OK` — phonemically correct: the segments **and** the lexically
     contrastive suprasegmental (lexical **stress** for en/ru, **tone** for zh,
     **pitch accent** for ja) are valid for a standard or attested-variant
     pronunciation.
   - `MINOR` — right word, one sub-optimal choice short of changing identity.
   - `WRONG` — a phonemic error (wrong phoneme in a salient position, wrong
     primary stress/tone, inserted/deleted phoneme).
   - The rubric **ignores** purely allophonic detail (aspiration, flapping,
     clear/dark l, vowel length where non-contrastive, secondary stress) and
     **accepts any legitimate dialectal/free variant**.
4. **Score in code** (not by the model): `score = 100 · (OK + 0.5·MINOR) / N`,
   reported as **micro** (pooled over all words) and **macro** (mean of per-file
   scores).

The judge returns a per-word verdict list; the script parses it and computes the
number, so the score is deterministic given the verdicts.

Reproduce:

```bash
yarn test:ai-eval --provider codex            # all curated passages
yarn test:ai-eval --provider codex --lang en  # one language
yarn test:ai-eval --provider codex --context   # sentence-context occurrences
yarn test:ai-eval --provider openai           # OpenAI API instead of Codex CLI
```

---

## 3. Datasets (public & citable)

We evaluate on four kinds of data. Three of them are **independent of the data
the library is built from**, so they measure *generalisation*, not memorisation.

| Set | Source | Role |
|---|---|---|
| **Curated passages** (`scripts/eval-data/*.txt`) | hand-written, dense in hard phenomena (irregular spelling, morphology, homographs, polyphones, batchim, reduction) | targeted, discriminative |
| **Held-out WikiPron** (`scripts/eval-data-wikipron/`) | [**WikiPron**](https://github.com/CUNY-CL/wikipron) — Wiktionary pronunciations, the dataset behind the [SIGMORPHON G2P shared tasks](https://sigmorphon.github.io/sharedtasks/2020/task1/); CC-BY-SA | **generalisation** — words *not* in the training source |
| **Frequency-stratified** (`scripts/eval-data-freq/`, English) | [google-10000-english](https://github.com/first20hours/google-10000-english) | **representative real usage** |
| **Common-vocabulary coverage** | [5,000-word multilingual frequency lists](https://github.com/frekwencja/most-common-words-multilingual) | coverage gate; **not** pronunciation gold |

The English **training** lexicon is built from
[open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict); the
held-out WikiPron set explicitly removes any word present there, so it cannot be
inflated by training-data recall.

Build the held-out / frequency sets (downloads WikiPron / frequency lists; output
is git-ignored, Wiktionary CC-BY-SA):

```bash
yarn build-eval-set                                   # held-out WikiPron, all langs
FREQ=1 OUT=scripts/eval-data-freq yarn build-eval-set # frequency-stratified English
yarn test:ai-eval --provider codex --data-dir scripts/eval-data-wikipron
```

For the 80% corpus gate, place the five ranked frequency files (`en.txt`,
`zh-CN.txt`, `ja.txt`, `ko.txt`, `ru.txt`) in one directory and run:

```bash
FREQ_DIR=/path/to/frequency-files yarn test:common-coverage
FREQ_DIR=/path/to/frequency-files MIN_COVERAGE=80 yarn test:common-coverage
```

---

## 4. Results (latest measured: 2026-08-29)

> These are one-run LLM-rubric scores from `--context`; `n` is token
> occurrences, not unique word types. They are indicative, not gold accuracy.

### English

| Set | n | Score | What it tells you |
|---|---|---|---|
| Curated passages, context mode | 483 | **95.7 %** | common and targeted English sentence cases |
| English homographs | 106 | **90.6 %** | context/POS disambiguation; 10 wrong occurrences |
| English morphology | 74 | **94.6 %** | inflection and stress behavior |

The curated English corpus is not yet an 80%-coverage benchmark: its measured
top-5,000 frequency coverage is 69.6% by token occurrence. The scores above
should therefore be read as targeted smoke tests, not production-wide accuracy.

### Other languages (curated passages)

| Language | n | Score | Engine | Notes |
|---|---|---|---|---|
| **Japanese** | 6 | **100 %** | romaji rules | too small for a general estimate |
| **Chinese (Mandarin)** | 8 | **75 %** | [`pinyin-pro`](https://github.com/zh-lx/pinyin-pro) | `行长/行行` context remains wrong in the curated sentence |
| **Korean** | 25 | **88 %** | Hangul/romaja rules | jamo letter names and `많은` remain wrong |
| **Russian** | 36 | **52.8 %** | transliteration + **heuristic** stress | lexical stress is the dominant gap |

Non-English curated samples are small (`n` = 6–36), and their current top-5,000
coverage is only zh 50.0%, ja 37.7%, ko 20.0%, and ru 58.3%. Larger, held-out
figures can be produced per language with `yarn build-eval-set` + `--data-dir`.

---

## 5. Per-language support status

| Lang | Approach | Maturity |
|---|---|---|
| **English** (`en`, `en-GB`) | rule engine + mined exception lexicon + phonotactics | **Strong on tested cases; 80% corpus gate not met** |
| **Chinese** (`zh`) | `pinyin-pro` → IPA/Zhuyin, with tone sandhi | **Good** |
| **Japanese** (`ja`) | kana/romaji syllable rules | **Good** |
| **Korean** (`ko`) | Hangul → romaja → IPA rules | **Good** (one known phonology gap) |
| **Russian** (`ru`) | Cyrillic transliteration + **heuristic** stress & vowel reduction | **Approximate** |

---

## 6. Known limitations (so the scores are honest)

- **LLM judge variance.** ≈ ±2–3 % between runs; occasional misjudgements
  (we observed `documentation`, `predicted`, `一定` flagged as wrong while
  correct). A single run is not authoritative; trends across runs are.
- **Russian stress is heuristic, not looked up.** Russian lexical stress is
  unpredictable and we ship **no stress dictionary**, so the engine guesses
  (monosyllable → its vowel; otherwise penult) and applies vowel reduction from
  that guess. Correct for many words, wrong for the unpredictable rest
  (`привет`, `Москва` are end-stressed and come out mis-stressed). This caps
  Russian around 55–60 %.
- **Acronyms / initialisms** (`pdf`, `usa`, `bbc`) do not follow letter-to-sound
  rules and require dictionary entries; the rule engine does not invent them.
- **Held-out vs representative.** WikiPron random draws contain rare, foreign,
  and scientific words, so they are useful for generalisation but should not be
  presented as everyday-text accuracy. No fresh held-out score is claimed in
  this report.
- **The current corpus is under-covered.** The 80% common-vocabulary requirement
  is not satisfied by `scripts/eval-data`: top-5,000 token coverage is 69.6%
  for English and lower for the other four languages. Add a larger sentence
  corpus before publishing a cross-language headline score.
- **No single public source solves both requirements.** Frequency lists provide
  vocabulary strata, while WikiPron/ipa-dict provide word pronunciations. A
  sentence-level gold benchmark needs manually aligned phonetic transcriptions;
  the [g2pM CPP set](https://github.com/kakaobrain/g2pm) is a good open exception
  for Mandarin polyphone context, while [GlobalPhone](https://www.lrec-conf.org/proceedings/lrec2014/pdf/1212_Paper.pdf)
  is broader but has corpus access/licensing constraints.

## 7. Common English word segment gate (2026-09-08)

`yarn test:common-accuracy` adds a deterministic **90% segment-match gate** for
the public `toIPA` API in en-US mode. This is separate from the LLM rubric and
from the corpus-coverage percentage above.

- Corpus: the first **5,000 unique items**, in rank order, from
  [google-10000-english-usa](https://github.com/first20hours/google-10000-english).
  US spelling duplicates are removed before taking the first 5,000; no items
  are removed based on pronunciation coverage or prediction quality.
- Reference: all listed pronunciations in
  [CMUdict](https://github.com/cmusphinx/cmudict). Commit-pinned URLs and SHA-256
  checksums are stored in `scripts/common-accuracy-sources.json`; changed or
  incomplete inputs fail validation.
- Scoring: exact segment equality after removing stress marks, whitespace and
  non-contrastive vowel length, and normalizing clear/dark l and the g symbol.
  No vowel mergers or edit-distance allowance are applied. Any reference
  variant may match. **173 items lack a reference and count as not correct**;
  the denominator stays 5,000.
- Scope: isolated ranked items, including abbreviations and letter names,
  through preprocessing and the public API. This does **not** measure lexical
  stress, sentence-context disambiguation, or held-out generalization. CMUdict
  overlaps the ancestry of the runtime training lexicon, and valid dialectal
  variants absent from the reference can still count as mismatches.

| Mode | Correct / total | Segment accuracy | 90% gate |
|---|---:|---:|---|
| Default, before this improvement | 4,411 / 5,000 | 88.22% | Fail |
| Default, after this improvement | 4,522 / 5,000 | **90.44%** | **Pass** |
| `disableDict: true`, after improvement | 3,042 / 5,000 | 60.84% | Fail |

The default-mode comparison has 111 newly correct items and no previously
correct items becoming incorrect. Improvements retain dictionary-attested
initialisms and alphabet names in a separate whole-token table. Exception
mining now starts from an empty table and adds errors introduced by lexical
stem lookup until no further entries are needed. Rebuilding the final data
reproduced identical SHA-256 hashes for exceptions, initialisms and compound
parts. Generated English data grows by 124,959 bytes versus the initial local
snapshot; it remains external JSON for React Native/Hermes consumers.

```bash
yarn test:common-accuracy --download  # one-time pinned input download
yarn test:common-accuracy             # offline; exits 1 below 90%
yarn test:common-accuracy --rules      # separate disableDict measurement
```

Use `COMMON_BENCHMARK_DIR=/path/to/cache` to select an existing input cache.
The cache contains full per-item `default-report.json` / `rules-report.json`
reports, including missing references and mismatches. Existing legacy baselines
are unchanged; the whole-dictionary rule evaluation still falls below its
historical baseline, so passing this gate does not imply that gate passes.

## 8. Full English article gate (2026-09-08)

`yarn test:article-accuracy` evaluates three complete NASA Space Place articles
in en-US mode, using the public sentence pipeline with dictionaries enabled.
The frozen text, attribution URLs and SHA-256 checksums are in
`scripts/eval-data-articles/`. The cases cover sky color, hurricane formation,
and the complete GPS story transcript. Article prose, headings and captions
are retained; navigation, media download controls and related-resource lists
are excluded. This is a small educational-prose benchmark, not a claim about
all English articles or 80% vocabulary coverage.

Every spoken token occurrence is scored in the complete original article
context; repeated words are not deduplicated. English scoring labels come from
the actual expanded tokens, so number/abbreviation expansion cannot shift all
subsequent word labels. The original source is also supplied so incorrect
expansions can be penalized. Empty predictions remain eligible for scoring.

The existing phonemic rubric gives OK=1, MINOR=0.5 and WRONG=0, including
lexically contrastive primary stress and accepting legitimate pronunciation
variants. Each article must independently reach **80/100**. Missing verdicts
remain in the denominator and fail the gate regardless of score. Malformed or
duplicate verdicts, missing judge responses, empty cases and changed source
checksums also fail. Prompts, raw judge responses and complete per-occurrence
JSON results are saved in `scripts/.article-eval-cache/` by default.

```bash
yarn test:article-accuracy  # Codex judge; existing ChatGPT authentication
# Override the report location or judge model explicitly when needed:
yarn test:article-accuracy --report-dir /tmp/article-results --model gpt-5.5
```

This round adds general inflection rules: restored silent e must actually be
silent and cannot follow a doubled consonant; closed consonant-cluster stems
retain their pronunciation before -ed/-ing; final ow/o retains its vowel before
plural -s. Individual regression examples live in tests, not word-specific G2P
branches. Preprocessing also distinguishes ordinary words from time markers
and explicit abbreviation labels. The exception miner preserves equivalent
rule stress-boundary notation for redundant refinement entries, without
changing their segments or stressed vowel.

The common-word segment gate rose from **90.44% to 90.72% (4,536/5,000)**.
The separate `disableDict` result is **60.98% (3,049/5,000)**; it does not meet
90%. Whole-dictionary lenient rule accuracy rose from 75,109/105,124 (71.45%)
to 75,142/105,124 (71.48%), still below the historical 87.00% baseline.
That historical baseline is unchanged; passing the common-word and article
gates does not imply that the historical whole-dictionary gate passes.

Final Codex/gpt-5.5 results (full prompts, raw responses, per-occurrence IPA and
runtime checksums: `scripts/eval-results/en-articles.json`):

| Complete article | Before this round | Final | Occurrences | 80/100 gate |
|---|---:|---:|---:|---|
| [Why Is the Sky Blue?](https://spaceplace.nasa.gov/blue-sky/en/) | 97.5 | **99.0** | 609 | Pass |
| [How Does GPS Work?](https://spaceplace.nasa.gov/gps-pizza/en/) | 97.0 | **98.8** | 328 | Pass |
| [How Do Hurricanes Form?](https://spaceplace.nasa.gov/hurricanes/en/) | 94.3 | **97.2** | 583 | Pass |

The final pooled score is **98.26/100 over 1,520 occurrences**, with no missing
verdicts. The initial GPS output had 329 occurrences because `am` was incorrectly
expanded into two letters. The source articles were unchanged throughout.

These are **LLM rubric scores, not human gold transcriptions**. The judge is
stochastic: differences across runs can reflect judging variability as well as
changed IPA, so the before/after figures are not a controlled estimate of the
size of the improvement. Contextual homographs, acronym-vs-initialism readings,
and numbers with attached units remain known error categories. No claim is
made that all articles, or dictionary-disabled articles, score this highly.

Validation: 15 Jest suites / 331 tests pass; production and scorer TypeScript
checks pass; Rollup bundles successfully. Every final judged occurrence matches
the CJS bundle's output, and all 5,000 common-word predictions match between
source and bundle. Two full dictionary builds reproduced identical exception,
initialism and compound-part hashes. No expected IPA in existing tests was
changed during this article-improvement round.
