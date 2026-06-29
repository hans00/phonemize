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

1. **Tokenise** each test passage into unique words.
2. **Phonemize** each word to IPA with the library (full system: rules + any
   lexicon).
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
yarn test:ai-eval --provider openai           # OpenAI API instead of Codex CLI
```

---

## 3. Datasets (public & citable)

We evaluate on three kinds of data. Two of them are **independent of the data
the library is built from**, so they measure *generalisation*, not memorisation.

| Set | Source | Role |
|---|---|---|
| **Curated passages** (`scripts/eval-data/*.txt`) | hand-written, dense in hard phenomena (irregular spelling, morphology, homographs, polyphones, batchim, reduction) | targeted, discriminative |
| **Held-out WikiPron** (`scripts/eval-data-wikipron/`) | [**WikiPron**](https://github.com/CUNY-CL/wikipron) — Wiktionary pronunciations, the dataset behind the [SIGMORPHON G2P shared tasks](https://sigmorphon.github.io/sharedtasks/2020/task1/); CC-BY-SA | **generalisation** — words *not* in the training source |
| **Frequency-stratified** (`scripts/eval-data-freq/`, English) | [google-10000-english](https://github.com/first20hours/google-10000-english) | **representative real usage** |

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

---

## 4. Results (latest measured)

> Numbers are micro-scores from the most recent run. `n` = words judged.
> Small-`n` rows are illustrative; re-run for fresh figures (± a few %).

### English

| Set | n | Score | What it tells you |
|---|---|---|---|
| Curated passages | 367 | **~99 %** | quality on common, varied text |
| Frequency-stratified (real words) | 156 | **~95.5 %** | representative everyday usage |
| Held-out WikiPron (random) | 120 | **~50 %** | generalisation floor — a *random* Wiktionary draw is dominated by rare/foreign/scientific words English rules can't target |

The held-out floor is deliberately harsh; representative usage (95.5 %) is the
fairer real-world figure.

### Other languages (curated passages)

| Language | n | Score | Engine | Notes |
|---|---|---|---|---|
| **Japanese** | 6 | **100 %** | romaji rules | — |
| **Chinese (Mandarin)** | 8 | **~75 %** | [`pinyin-pro`](https://github.com/zh-lx/pinyin-pro) | small sample; the one flagged item (一-sandhi `一定→yí`) is arguably a grader miscall, so true quality is higher |
| **Korean** | 25 | **88 %** | Hangul/romaja rules | remaining gap: ㅎ-deletion (`많은→마는`); isolated-jamo names out of scope |
| **Russian** | 31 | **~58 %** | transliteration + **heuristic** stress | see limitation below |

Non-English curated samples are small (`n` = 6–31). Larger, held-out figures can
be produced per language with `yarn build-eval-set` + `--data-dir`.

---

## 5. Per-language support status

| Lang | Approach | Maturity |
|---|---|---|
| **English** (`en`, `en-GB`) | rule engine + mined exception lexicon + phonotactics | **Mature** — ~95 % representative |
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
- **Held-out vs representative.** The ~50 % held-out English figure reflects a
  random Wiktionary sample (rare/foreign-heavy), *not* typical text; the 95.5 %
  frequency-stratified figure is the representative one.
