# Phonemize — G2P Benchmark & Language Support

This document describes **how we measure pronunciation quality**, **which public
datasets we use**, and **the current per-language scores**. It is meant to be
fully reproducible — every number below can be regenerated with the commands
given here.

Sections 1–9 retain historical measurements. Section 10 specifies the
POS-sensitive contract; section 11 describes its implemented first version.

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

## 9. Rule-path improvement rounds (2026-09-09 / 09-10)

Two bug reports against v2.0.x (#27 `wind`/`solutions`, #28 `Seann`) were
failures of the shipped *composition* — exception table, morphology,
fallbacks, rules — not of the rule tables the older `yarn test:eval` score
measures. Two gates were added to make that path visible:

- `yarn test:parity` (`scripts/evaluate-parity.ts`) scores the default
  `EnglishG2P` over every dictionary word and exits non-zero when strict
  parity drops. A rule change only reaches this number after
  `yarn build-dict` re-mines the exception table, so parity is judged after
  a rebuild, never inside a worktree.
- `yarn rule-diff` (`scripts/rule-diff.ts`) dumps the rules-only prediction
  for every dictionary word and reports the win/loss list between two dumps,
  split by strict, lenient, and top-5,000 frequency. A candidate rule is
  adopted only when strict wins exceed strict losses **and** it does not lose
  ground on the top-5,000 list.

Every rule below was adopted on that measured basis, in families rather than
per word: onset-conditioned long `u` (music/tune), `y` as a syllable nucleus
(system), tense vowels in two-syllable words with an inflection-shaped second
syllable (paper/taken), trisyllabic laxing (policy/comedy), the Greek/Latin
`th` split (author vs other), `s`-voicing frames (cause/easy), `/hw/`
(what/which), `n` before a velar across a prefix boundary (include), initial
`ex` + vowel → /ɡz/ (example), stress on two-syllable Latin prefixes
(contact/index), and word-final suffix reduction (balance/audience/figure).

| Metric | 2026-09-08 | 2026-09-10 |
|---|---:|---:|
| Runtime strict parity over the dictionary | 89.54% | **90.42%** |
| Top-5,000 segment accuracy (default) | 90.74% | **90.92%** |
| Top-5,000 segment accuracy (`--rules`) | 60.98% | **63.98%** |
| Whole-dictionary lenient rule accuracy | 71.48% | **72.99%** |
| `evaluate-strict` en-US phonemic headline | 43.85% | **46.85%** |
| Jest tests | 335 | **518** |

The historical 86.998% whole-dictionary lenient baseline is unchanged and
still not met. It was reached with mined stress/vowel n-gram tables that the
build pipeline no longer runs, because AI-judged evaluation showed they
scored dictionary match while hurting pronunciation quality. It is kept as
the target for the rule path to recover on its own.

The rule modules were then compressed back from 2,930 to 2,685 lines, gated
by `scripts/snapshot-dump.ts`: an empty diff over 1,297,074 predictions, so
both eval scores are frozen by construction.

## 10. POS-sensitive IPA evaluation design (2026-10-07)

Every future pronunciation improvement must be checked in sentence context.
The previous English-subset strict/lenient scores are isolated, stress-stripped
segment scores; they remain useful regression gates but cannot establish that
the correct POS-dependent reading was selected. The design below supplements
those metrics without changing their definitions, population or baselines.

### Existing evidence and immediate gate

Reuse `scripts/evaluate-homographs.ts` and its existing pinned
[WikipediaHomographData source](https://github.com/google-research-datasets/WikipediaHomographData/tree/8f008f021e88f8b71118a27ae655f1f3121162bc).
An offline run on 2026-10-07 reproduced 1415/1615 correct readings (87.6161%),
87.7490% macro by homograph, with 2 unaligned targets and 12 ties, all failures.
The existing command exits non-zero if micro accuracy falls below its baseline.

Its nearest-reading metric is useful for choosing senses, but is not IPA
validation. An audit of its actual scoring functions classified both stressless
`ɪnvaɪt` and truncated `ˈɪnvaɪ` as `invite_nou`. Evidence:
`/tmp/phonemize-pos-evaluation-design/scorer-audit.json`. Neither result should
pass the proposed context-strict IPA metric.

The source's [README](https://raw.githubusercontent.com/google-research-datasets/WikipediaHomographData/8f008f021e88f8b71118a27ae655f1f3121162bc/README.md)
explicitly says its reading descriptions and transcriptions are not authoritative.
Use its sentence reading labels as the existing benchmark reference, but do not
treat every `wordids.tsv` transcription or coarse category as verified IPA/POS gold.

Immediately require the existing offline homograph gate after rebuilding the
dictionary, plus paired sentence checks for affected readings. The first
implementation and frozen cohort are documented in section 11.

### Reference contract

Retain original sentences and each target occurrence, including duplicates,
case and punctuation. Reuse the source's pinned commit, content hash and
train/eval split. Add a small evaluation-only, independently reviewed annotation
manifest over existing cases; never import it into runtime dictionaries.

Each case records a stable ID, original UTF-8 byte span, target surface form,
reading ID, dialect (`en-US` initially), accepted reading-specific IPA variants,
provenance, split and phenomenon class. POS is a separate annotation using
`NOUN`, `VERB`, `ADJ`, etc.; morphology records features such as past tense or
participle. Sense is separate again. Combined source labels such as
`adjective-noun` do not establish the target's precise syntactic POS.

Review IPA against existing pinned CMUdict where attested, and documented
dictionary evidence where needed. CMUdict alone does not label POS: association
of each pronunciation with a reading requires review. Never copy the runtime
homograph table, current output, or the nearest-reading guess into gold. Keep
review status and evidence per variant. AI suggestions may assist annotation;
live AI judgments are not acceptance scores. Do not add runtime datasets/models.

Accepted variants belong to the SAME reading, POS/features, dialect and speech
scope. Accepting both noun and verb IPA indiscriminately would destroy the test.
Ambiguous or unreviewed cases stay visible in a separate inventory; they are
not silently removed from an existing scored population. Freeze the initial
reviewed IPA cohort before judging any candidate, report its coverage of the
original 1615 cases, and version subsequent additions as reference changes.

Use explicit classes, reviewed rather than inferred solely from source taxonomy:
POS/stress (`invite`, `record`); POS/segments (`use`/`uses`); noun/adjective
(`invalid`); morphology (`read` present/past); same-POS sense (`bass`, `bow`);
proper-name/case; neutral controls. POS alone cannot solve every class.
Do not equate the engine's legacy `N`/`V`/`!V` dispatch labels with full UPOS gold.

### Run matrix and fault diagnosis

Run the SAME sentence/target through four cells, using isolated processor
instances and the real tokenizer/public pipeline:

| Cell | Lexicon mode | Target POS source | Purpose |
|---|---|---|---|
| Default/context | shipped default | normal tagger | primary user-facing quality |
| Default/gold POS | shipped default | reviewed target POS | separate tagger from realization errors |
| Rules/context | `disableDict: true` | normal tagger | track fallback quality in context |
| Rules/gold POS | `disableDict: true` | reviewed target POS | diagnose rule realization conditioned on POS |

Gold-POS injection overrides only the target tag through a local evaluation
processor adapter; all other tokens keep normal behavior. Never pass reading ID
or expected IPA to prediction. Declare the UPOS-to-engine adapter and hash it.
If the current engine cannot represent a gold feature or POS, report unsupported
coverage and failures, rather than inventing a successful mapping. Oracle-POS
diagnostics cover reviewed POS-only cases; tense/sense diagnostics require an
explicit future feature interface and must not be misreported as POS accuracy.

Gold-POS success with automatic-context failure suggests a tagging error.
Failure in both cells suggests realization/lexical/interface issues; it does
not prove one particular cause. Tag accuracy is a diagnostic, not a substitute
for IPA accuracy. `disableDict` still permits existing independent stem evidence;
label it accordingly, and never enable whole-target homograph lookup to improve
its score.

Check target alignment against the frozen byte span and occurrence ID. Account
for byte-to-JavaScript-offset conversion and preprocessing expansion explicitly;
do not select the first matching word. Missing/ambiguous alignment or empty
prediction remains incorrect in the fixed denominator, with a recorded reason.

### Metrics and normalization

The primary score is **default/context strict IPA accuracy** over the frozen,
reviewed cohort. Report rules-mode scores separately. Every report also shows
the existing nearest-reading accuracy over all original cases for continuity.

| Metric | Pass condition |
|---|---|
| Context strict IPA | Entire phoneme sequence AND contrastive primary stress match one accepted variant of the gold reading |
| Context lenient IPA | Correct reading, contrastive primary stress and distinguishing phones preserved; at most one edit outside protected contrasts |
| Reading selection | Selected reading equals sentence reading label; ties/missing remain incorrect |
| Primary stress | Correct stressed nucleus where contrastive; missing/multiple invalid primary marks fail |
| Segments / phone error rate | Phoneme-level equality and edit distance against variants of the gold reading; diagnostic only |
| Balanced reading accuracy | Average per lemma-reading accuracy, preventing the common reading from hiding the rare one |

For lenient scoring, the reviewed reference defines protected contrasts between
readings (stress, voicing, vowel/suffix differences). Changes to a protected
contrast cannot consume the one-edit allowance. If no safe contrast annotation
exists, lenient falls back to strict, with coverage reported. Exact IPA of a
different reading is always incorrect. Nearest-reading alone cannot make IPA
pass. Lenient is a tolerance score, not a claim of fully valid pronunciation.

Use one versioned normalizer and phoneme parser for all new cells. Normalize
Unicode and declared notation differences (`ɫ/l`, `r/ɹ`, `g/ɡ`, affricate ligatures);
remove noncontrastive secondary stress/length only for the specified dialect.
Represent diphthongs and affricates as phones, not character edit distances.
Associate primary stress with its nucleus rather than its exact printed onset.
Require contrastive primary stress on polysyllables; isolated monosyllabic
stress-mark omission is allowed where it cannot distinguish readings.

Do not globally merge vowel pairs or erase primary stress. A stress-conditioned
STRUT/schwa notation conversion or weak-vowel variant must be explicitly justified
by the reference policy; it must not collapse a noun/verb contrast. Whole accepted
variants prevent mixing pieces of different pronunciations into a spurious match.
Malformed/unsupported IPA is a failure with a reason code, not silently cleaned.

Report exact counts/denominators, micro, macro by lemma and balanced reading
accuracy, plus POS-stress/POS-segment/morphology/sense/neutral slices. Unchanged
denominators and per-occurrence win/loss lists are required. Statistical intervals
are for generalization claims (paired by case, clustered by lemma), not a license
to excuse deterministic regression on the fixed set.

### Stability, adoption and implementation order

1. Preserve the original `wiki-homograph-v1` and all legacy baselines. Build the
   reviewed reference manifest and contrast annotations; freeze split, cohort,
   source/reference/normalizer hashes, dialect and runtime table hashes.
2. Extract/reuse the existing loader/alignment/reporting in the homograph script;
   add a separately versioned `context-ipa-v1` scorer and the four run cells.
   Capture its initial baseline without claiming pronunciation improvement.
   The implemented `--metric context-ipa` / `--mode rules` commands and
   initial version-specific baseline are documented in section 11.
3. Check the scorer with wrong stress, absent stress, truncated/garbage IPA,
   incorrect voicing, same-POS tense/sense, legitimate variants, duplicate targets,
   non-ASCII byte offsets and ties. Repeated offline runs must reproduce scores
   and per-case results. A normalizer/reference change creates a new version;
   it must not appear as a G2P gain.
4. Diagnose rules on train/development examples. Eval is the acceptance set:
   do not repeatedly tune to its failing sentences. Add paired neutral controls
   and test source plus bundled public APIs. Review changed non-target tokens in
   full prose, since tagging/stress/phonotactics changes can affect other words.
5. After a normal dictionary rebuild, require all existing gates and no decrease
   in context-strict micro, balanced reading accuracy, POS/stress and POS/segment
   slices in both default and rules modes; context-lenient must also not decrease.
   Report oracle results, coverage, failures and every win/loss. Zero regressions
   are required for the explicit paired controls. Use counts, not rounded scores.

Report metadata includes source/build commit (and dirty-source hashes), Node
version, source and generated table hashes, cohort/reference/adapter/normalizer
versions, counts and full case outputs. Keep reports offline and machine-readable;
do not make CI depend on dictionary websites or a stochastic judge.

The current +1 absolute English-subset strict percentage point commit threshold
remains unchanged and context gates supplement it. An improvement only to POS
may stay in an accumulating batch if it does not meet that threshold; do not
claim an old isolated-word increase or a baseline reset as a contextual gain.
New reference data serves evaluation only and never becomes a runtime word/IPA map.

One gold-integrity issue found during implementation: `__tests__/homographs.test.ts`
accepted `/ɹid/` in `I read that book yesterday`. That false expectation was
removed and the required `/ɹɛd/` is recorded as a pending engine regression.
The scorer penalizes incorrect past-tense readings; fixing the engine itself
still needs normal class-level and adoption evidence.

## 11. context-ipa-v1 implementation (2026-10-08)

`scripts/evaluate-context-ipa.ts` implements the four cells above; the pure parser,
phone distance and scoring live in `scripts/context-ipa.ts`. It reuses the pinned
homograph loader and the independent CMU phone alphabet, not runtime conversion.
The old `wiki-homograph-v1` score and its baseline are unchanged.

```bash
yarn test:ipa                              # all four cells, offline baseline gate
yarn test:ipa --split train                # diagnosis; never updates eval baseline
yarn test:ipa --mode default --pos auto    # shipped user-facing cell
yarn test:ipa --mode rules --pos gold      # conditional rule-path diagnostic
yarn test:ipa --out /tmp/context-ipa        # complete reports and baseline win/loss
yarn test:homographs --metric context-ipa  # equivalent new-metric entry point
```

Existing pinned inputs must be present: the CMUdict cache used by
`test:common-accuracy` and Wikipedia cache used by `test:homographs`. Their existing
`--download` commands prepare those inputs. `test:ipa` itself runs offline; its
optional `--download` forwards only to the Wikipedia loader. Initial baseline
capture is `yarn test:ipa --update-baseline`, restricted to eval/all four cells.
`--baseline FILE` supports isolated comparison checks; never reset an unchanged
contract's baseline to accept a regression.

The initial manifest `scripts/context-ipa-reference.json` contains 22 source-checked
reading associations: 20 across invite/record/use/uses/invalid/learned/read/bass/bow/permit,
plus cat/day neutral controls. CMUdict supplies attested ARPABET variants; noun
invite is independently attested by [Merriam-Webster](https://www.merriam-webster.com/dictionary/invite).
The exact CMU entries are verified against the existing pinned content checksum
on every run. All 103 original eval occurrences of those ten lemmas are retained.
Five explicit controls add two neutral cases and the three readings absent from
the original eval split (record verb, learned adjective, bass animal). Selection
was by phenomenon/label coverage, not prediction success. This is a targeted
108-case baseline, not an estimate over all 1615 homograph occurrences or general text.

| Cell | Strict | Lenient | Balanced strict by reading |
|---|---:|---:|---:|
| Default / automatic POS | 78/108 (72.22%) | 78/108 (72.22%) | 82.28% |
| Default / known reading POS | 80/108 (74.07%) | 80/108 (74.07%) | 77.27% |
| Rules / automatic POS | 42/108 (38.89%) | 42/108 (38.89%) | 45.45% |
| Rules / known reading POS | 38/108 (35.19%) | 38/108 (35.19%) | 40.91% |

These are INITIAL scores, not gains or revised versions of the isolated-word
73.25%/90.00%. All protected contrasts are preserved by lenient scoring; on the
current outputs the errors affect protected contrasts or exceed the allowance,
so strict and lenient happen to coincide.

The POS annotations are source-checked lexical reading associations, not a
human-reviewed token-UPOS corpus. Twenty original sense cases lack determinate
POS; they remain unsupported failures in the known-POS cells. The report separately
shows a reference-defined, fixed 88-case POS-supported subset in **every** cell
for comparable diagnostics; alignment failures cannot shrink that denominator.
Tense features are recorded but not injected into the current POS-only API.
Known adjective POS also exposes the engine's legacy noun-evidence dispatch
limitations; it must not be remapped into a noun merely to improve the score.

Reports retain the original sentence/span, target occurrence, predicted POS,
IPA, accepted reference phones/primary nucleus, reason code, family, coverage,
all input hashes, macro/balanced/phone error counts and baseline prediction deltas.
The local POS override is checked to leave every non-target token unchanged.
Unknown/malformed IPA, missing stress, ties, unsupported POS and failed alignment
remain failures. Missing source data, source checksum changes, changed scorer or
reference contracts and lower per-cell/per-class counts exit non-zero. Explicit
controls cannot regress even if their class total improves.
The 2026-10-11 gate audit additionally protects each reading and the fixed
POS-supported subset; see section 12. Scoring and the initial IPA predictions
remain unchanged.

`scripts/context-ipa-baseline.json` stores the initial contract, exact counts and
per-case IPA snapshots. Repeated offline reports must be identical. A baseline
from another contract is rejected before comparison, and partial-cell baseline
capture is rejected. Frozen-reference/scorer changes are new measurement versions,
not pronunciation improvements. The normal +1-point commit rule still applies.

Validation evidence is in `/tmp/phonemize-ipa-implementation/`: scorer and public
path tests, source/script typecheck, legacy-score replay, identical new-metric
replays, the Yarn/legacy-alias entry points, and negative CLI checks for score
regression, corpus/reference corruption, contract mismatch and partial capture.
Production G2P source, generated tables and all historical baselines are unchanged.

## 12. Evaluation audit (2026-10-11)

The current mechanisms discriminate different kinds of errors, but no single
headline is enough to adopt a rule. The isolated strict/lenient metrics remove
stress, and legacy lenient merges several vowels before character edit distance.
They cannot establish correct POS-dependent pronunciation. The Wikipedia metric
selects the nearest reading even for malformed/truncated transcriptions; use it
for broad reading coverage, paired with the phone/stress-aware IPA metric.

The context scorer was checked against every accepted reference variant and
every competing reading of the same lemma: correct variants pass strict, and
another reading's exact IPA fails both strict and lenient. Existing negative
checks cover missing/wrong primary stress, voicing, same-POS tense/sense,
truncation, malformed output, alignment, duplicate occurrences and ties.
An allowed unprotected phone edit passes only lenient. Thus equal current
strict/lenient counts do not mean the two criteria are identical.

One adoption defect was reproduced before repair: exchanging one correct noun
case for one correct verb case could leave strict, lenient, balanced accuracy
and the POS-stress family unchanged. The old gate passed despite losing a
reading. Reports and baselines now retain strict/lenient counts **per reading**;
every reading must be nondecreasing with a fixed denominator. The existing
88-case POS-supported subset is now also gated in all four cells, including its
reading/family counts, so improvements among unknown-POS sense cases cannot
conceal deterioration in supported cases. Explicit controls still cannot regress.

This is acceptance contract `per-reading-pos-subset-v2`, using unchanged
`context-ipa-v1` scoring and references. The prior uncommitted initial baseline
was preserved in `/tmp/phonemize-evaluation-audit/baseline-before.json`; the new
baseline was captured explicitly. All 432 stored IPA predictions, all per-case
scores, previous aggregate/class results and POS-supported results match exactly.
This is stricter evaluation maintenance, **zero pronunciation improvement**.
Scorer/driver fingerprints change, so the earlier contract is intentionally
incompatible; do not reset a future baseline to hide a regression.

### Stable improvement criteria

1. Save before-run outputs/hashes, keep source references and population fixed,
   and diagnose rules on train/development examples. Eval remains acceptance.
2. Rank real candidate classes by both fixes and breakages; replay actual runtime
   decisions. Small offline CV gains or an isolated-word gain are insufficient.
3. Measure with frozen tables, rebuild normally, then compare all adoption
   metrics and case win/loss lists. Tests/types must pass, accuracy must not
   decrease, and explicit paired reading controls must remain correct.
4. For context, require nondecreasing strict/lenient counts, balanced strict,
   per-family and per-reading counts in all four cells and the supported subset.
   For legacy metrics use the criteria table in [AGENTS.md](../AGENTS.md).
5. Accumulate validated changes to >=1 absolute percentage point on committed
   English-subset strict before an ordinary improvement commit. POS-only gains
   may wait in that batch; baseline/version changes do not satisfy this threshold.

`test:eval`, `evaluate-strict.ts` and `rule-diff compare` are **report-only**:
exit 0 does not enforce nondecrease. Compare their exact before/after counts in
review evidence. Runtime parity and homograph exits enforce selected baseline
scores, not every diagnostic or before-run score. CMU default enforces its 90%
floor, not nondecrease; its rules mode still misses that pre-existing floor.
An unchanged historical failure must be labelled explicitly, never called a
passing gate. The context command enforces the full declared versioned gates.

The 108-case context cohort is useful for targeted diagnosis, not a validated
general-text estimate. Twenty cases have unknown POS, and reading-level POS
associations are not human token-UPOS annotations. Tense/sense are not injected
by the known-POS adapter. Larger, independently annotated context coverage is
needed before claiming broad POS accuracy; add it as a new reference version
and retain the old fixed benchmark. Stochastic article judges remain diagnosis,
not acceptance evidence. Do not tune or expand the cohort based on predictions.

The active agent guide now contains policies and runnable criteria; its full
previous contents are preserved in [the historical archive](AGENTS-history-2026-10-11.md).
The archive's obsolete miner instructions are superseded: `build-pipeline.ts`
does not run stress/vowel gram miners. No production rules or data were changed
by this audit. Reproduction logs are under `/tmp/phonemize-evaluation-audit/`.
