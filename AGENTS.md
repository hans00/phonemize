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
| Runtime strict parity over dict | `yarn test:parity` | 89.54% → 93.37% → **93.38%** | ≥ 92% **met**; next ≥ 94% |
| Top-5000 segment accuracy vs CMUdict | `yarn test:common-accuracy` | 90.74% → 93.06% → **93.08%** | ≥ 93% **met**; next ≥ 94% |
| Rules-only lenient accuracy | `yarn test:eval` | 71.48% → 74.64% → 74.65% → 74.76% → 74.79% → 74.88% → 74.94% → 75.12% → 75.25% → 75.27% → 75.35% → 75.40% → 75.50% → 75.53% → 75.54% → 75.56% → 75.57% → 75.59% → 75.61% | checkpoint **≥ 80%**; long-term ≥ 90% (set 2026-09-26) |
| Rules-only strict accuracy | `yarn test:eval` | 48.50% (2026-09-26) → 49.11% → 52.94% (ʌ/ə scoring fix, same code) → 53.20% → 53.30% → 53.37% → 53.42% → 53.45% → 53.54% → 53.55% → 53.56% → 53.57% → 53.62% → 53.63% → 53.65% → 53.67% | checkpoint **≥ 55%**; long-term ≥ 60% (set 2026-09-26) |
| Rules-only top-5000 accuracy | `yarn test:common-accuracy --rules` | 60.98% → 67.58% → 67.62% → 67.74% → 67.78% → 67.86% → 67.88% → 67.92% → 68.08% → 68.14% → 68.18% → 68.22% → 68.26% → 68.40% → 68.42% | ≥ 70% |
| evaluate-strict headline (en-US phonemic) | `tsx scripts/evaluate-strict.ts` | 43.85% → 49.02% → 49.24% → 49.40% → 49.42% → 49.61% → 49.64% → 49.90% → 50.04% → 50.35% → 50.42% → 50.44% → 50.58% → 50.60% → 50.68% → 50.69% → 50.71% | ≥ 50% **met**; next ≥ 52% |
| Heteronym reading in context (added 2026-09-26) | `yarn test:homographs` | 64.33% → 80.43% → 84.33% → 85.39% → 86.01% (scorer fix, same code) → 86.63% → **87.06%** | ≥ 87% **met** (train 86.53%); next ≥ 89% |

The heteronym row is the one metric that sees context. Parity and top-5000 score a word in isolation, so a wrong reading of *read*, *bow* or *minute* in a sentence is invisible to them. Reference: Google's WikipediaHomographData (Gorman et al. 2018, Apache-2.0, pinned commit + content hash in `scripts/homograph-sources.json`), 162 homographs × ~100 Wikipedia sentences, three-annotator reading labels. Each output is mapped to the nearest labelled reading, so transcription conventions never decide the score. Primary stress outweighs reduced-vowel quality there, and a tie between readings counts as wrong (12 on eval after unstressed ə~u was made a half-cost pair: the source writes the noun *document* as /ˈdɑːˌkjuːmənt/, which tied the correct /ˈdɑkjəmənt/ with the verb). Diagnose on `--split train` and gate on eval, so rules are never tuned on the gated split. The first number sits 20 points **below** always picking the most frequent reading: `homographs.json` splits readings by V / !V only, and the word-level failures are noun/adjective readings taking the verb form (affiliate, moderate, fragment, conjugate, document), senses that POS cannot separate (bass, bow, tear), and proper nouns (Polish, Nestlé, Bologna). Beating the floor needs sense, not just POS. A 2026-09-26 side experiment (since removed) found that TypeSafe's Jev can't judge pronunciation at all: IPA, ARPABET, respelling and per-dimension stress/vowel/consonant questions all scored near chance. Asked to pick a sense gloss, though, it got 28/28 hand-written heteronym sentences. It is an external API, so it can serve only as a labelling source, not a runtime option.

First heteronym pass (2026-09-26, 64.33 → 80.43 eval, 63.35 → 80.31 train). Most of the gain came from the POS tagger, whose V/!V call on in-table homographs was 64%, **below always answering !V (68%)**. Rules measured below a coin flip were removed: next word looks like a noun → V (27%), next word is "to" → V (26%), and a bare verb suffix -s/-ate/-ize/-er/-en → V (25–28%). After a form of be/have the V reading was right 12% of the time, so that context now tags !V (a participle or predicate adjective follows). "to" + word is now V (infinitive, 88%) instead of a preposition context, and "not" + word is V (84%). `EnglishG2P.tagWord` also dropped an empty `prev`, so a sentence-initial word read its NEXT word as its previous one. Separately, ten upstream `homographs.en` entries had the noun reading under V or a wrong transcription (analyses, articulate, diagnoses, exploit, fragment, frequent, misuse, mouth, precipitate, predicate); they are overridden in `src-data/en/homographs-custom.txt`. Measure tagger changes on the train split only.

Second heteronym pass (2026-09-26, eval 80.43 → 84.33, train 80.31 → 83.70). Words missing from the table now come from misaki's POS-keyed US lexicon (hexgrad/misaki, Apache-2.0), via `scripts/import-misaki-homographs.ts` → `src-data/en/homographs-misaki.txt`. It is a whole-lexicon import, not the benchmark's word list, and build-dict merges it UNDER upstream and custom, so it only fills gaps. misaki's readings are not trusted alone. A split is kept only when pinned CMUdict attests one reading and the other is attested too, or differs only by a regular noun/verb alternation: a stress shift (where the de-stressed vowel may reduce) or word-final -ate /ət/~/eɪt/. That took 582 raw splits down to 263 and dropped misaki errors that otherwise shipped: houses with /s/, augmented as /ˈɔɡməntɪd/, a doubled l in illegitimate. A NOUN split that differs only by voicing is also dropped, because English voices the verb (use, house) and a voiced "noun" is another lexeme (closer, "one who closes"). That filter must also require the segments to differ. A first version compared the readings after devoicing only, which also matched pure stress shifts and silently dropped 61 of them (transform, overthrow, overflow, restart).

`{DEFAULT, NOUN}` splits are stored as N / !N, and the tagger now emits N on real noun evidence: a preceding article/possessive, a preposition, or a following be/have/modal (subject position, 79%). Without evidence a word keeps misaki's DEFAULT. Mapping them onto V/!V had given "consists" its rare noun reading /ˈkɑnsɪsts/ in running text, because the tagger's no-evidence default is !V. N is still "not V", so upstream V/!V entries behave as before. Emitting N also woke upstream's lone N entry (closer); it is neutralised in `homographs-custom.txt`. Demonstratives are not noun evidence (these consist of …), and a pre-verbal adverb (also, often, never …) is V (76%); an -ly adverb is not (55%).

`arpabetToIpa` (utils) put the stress mark after the previous vowel, which gave table entries like ɪˈmpækt and kəˈnsɪsts. It now uses the maximal licit onset (ɪmˈpækt, kənˈsɪsts), and that also changes custom.dict entries and ARPAbet passed to `addPronunciation`. The benchmark's non-target words (~250k tokens) are the check for words outside the 162: diff them old vs new and read every segmental change in context before adopting an import.

Third heteronym pass (2026-09-26, eval 84.33 → 85.39, train 83.70 → 84.92). A relative pronoun (that/which/who) + word is V (77%). Three upstream entries also had their readings on the wrong side. learned and blessed carried the adjective /-ɪd/ under V, so "he learned" took it; they are now N pairs, with the adjective only on noun evidence. dogged gets the verb under V, like crooked/jagged/ragged upstream. wound had /wund/ under V; /waʊnd/ is only ever the verb (past of wind), so it is now V. lead is now an N pair with /lid/ as the no-evidence default (lead vocals, lead to), and the metal stays after a determiner (the lead pipe). Measured on the non-target prose diff: each of these was a net win, and the misses left are "that + noun" (that impact injuries, that subject) and the metal without a determiner (chemical and lead isotopic).

Fourth heteronym pass (2026-09-26, eval 86.63 → 87.06, train 86.13 → 86.53). Two more kinds of noun evidence. A possessive before the word is N (82%: Hammond's postulate). A word ending in an attributive-adjective suffix before it is N (political intrigue, parallel postulate), limited to -ical/-ial/-ous/-ful/-less/-ible/-able/-ular/-ic/-al. -ent/-ant/-ive/-ary were measured and dropped: they end too many nouns (government, agent, detective, library), and as subjects those turned the following verb into a noun ("the government uses" → /jusəz/). The wide set scored +0.06 more on train but cost more regressions in the prose diff. Also measured and rejected: a capitalized name + an -s word as a V cue. It lifted V/!V on the table words but lowered the full pipeline, because "Bronze Age axes" is a noun. The known misses left: possessive + lead takes the metal (Herring's lead grew), and -al/-ic nouns as subjects (the canal consists of).

Open: a determiner before an adjective–noun pair is read as noun evidence, so "an invalid argument" gets the noun /ˈɪnvəlɪd/ (invalid 20% on eval). Separating ADJ from N needs the next word, and "next word is a noun" was measured at 27% as a V cue, so it has to be re-measured as an ADJ cue, not reused. Also open: senses POS cannot split (bass, bow, tear as nouns), and proper nouns. Measured 2026-09-26: 438 of the 1952 remaining train errors are the target capitalized mid-sentence, and 331 of those are five names (bologna, Polish, Ravel, Nestlé, Celtic). Adding those five by hand would only teach to the test. A capitalonym mechanism (a Titlecase word mid-sentence takes its proper-noun reading) needs a source of name readings. misaki has only 34 Titlecase entries that differ from lowercase, and most are notation noise, so the source does not exist yet. The tokenizer now cuts POS context at . ! ?, which the mechanism would need to tell sentence-initial capitals apart.

Parallel worktree agents, one rule family each, merged sequentially, produced both passes: the first measured strict +1547/−308 on the rule path, the second (unstressed reduction, back vowels, tense i/e) a further +709/−179 with +68/−1 on the top-5000 list. A rule change is only visible to parity after `yarn build-dict` re-mines the table, so parity is judged after the rebuild, never in a worktree.

The fourth pass also took primary stress: `com-` over a lax root keeps its stress, the long-prefix loop yields to the penult fallback at 4+ syllables, a final vowel before /ŋ/ is exempt from reduction (English has no /əŋ/), -ance/-ence at four slots splits on the second syllable's coda, and an undoubled `-er` stem with final stress falls through to the rules (reference, conference). It also added `FINAL_GRAM_STRESS`, a seven-entry word-final gram table consulted before `isSyllableHeavy` — which scores 10587/21827, barely over always-penult. That table is the mechanism this project removed once before for scoring dictionary match while hurting pronunciation, so it carries a third adoption test the old miners lacked: a gram needs ≥20 dict words, ≥75% modal agreement, **and ≥3 agreeing top-5000 words**. The guard held — top-5000 default accuracy rose with it. Without that third test, 114 four-letter grams qualify and they are all surname endings (`nger`, `rman`, `gton`, `wicz`, `oski`, `moto`).

The fourth pass audited `src/en/phonotactics.ts` rule by rule — that file rewrites the output of BOTH paths, and nothing in it had ever been measured. Four rules were narrowed (the -ed allomorph was building impossible /Cɹd/ codas; silent-h deletion ate the licit borrowed /hl hr hm hn/ onsets; unstressed /ɪɹ/ coalescence ate the /aɪ eɪ ɔɪ/ offglide; syllabic-l epenthesis fired inside an /ɹl/ coda and before /lj lw/), and `addInitialSecondary` moved to `applyPostStress` so it no longer marks lexical output. A structural fact came out of it worth keeping: `data/en/exceptions.json` stores raw dict IPA, so any phonotactics rule applied to a table hit can only be a no-op or a corruption — 4467 of 53,759 entries were leaving the pass different from the entry they were read from, now 2526.

The third pass (alternating secondary stress, `s`-voicing depth, unstressed rhotics) added strict +964/−102 on the rule path and found a shipped bug: `deRhoticBeforeStress` in phonotactics rewrote /ɝ/ to /ə/+/ɹ/ before a stressed vowel on BOTH paths, against a lexicon that spells that position /ɝ/ 1659:101. Removing it moved runtime parity +1.38 on its own. The lesson generalises: a phonotactics rule applies to dictionary output too, so it needs the same win/loss evidence as a rule-path rule, and none of that file's rules were measured that way.

A rules-only prediction is NOT independent of the mined table: with `disableDict: true` the morphology handlers still look their stems up in it, so a test that pins a full IPA string for a derived word can move when `build-dict` re-mines. Pin the segment the rule owns instead.

Diagnosis that fed the second pass: group the rules-only mismatches in `scripts/.common-accuracy-cache/rules-report.json` by their single-edit signature (normalise ɫ→l first, and drop the 36 closed-class function words, which are lexical by design). That ranks the remaining classes by how many common words each would fix.

The rules-only baseline is deliberately NOT lowered to today's number: the gap is the ground the rules must recover without the removed gram tables.

Rules of the goal:

- Every user-reported word gets a regression test in `__tests__/issue-<n>.test.ts` and a fix for its *class* (e.g. #28 → doubled-final-consonant name variants), never a per-word entry. If no class fix passes the gates, the word goes to `src-data/en/custom.dict` and the class is recorded here as open.
- Each loop session moves at least one metric up without moving any other down; both baselines are updated in the same commit as the improvement.
- Rules-only accuracy is a means, not the end: a rule fix that raises `test:eval` but lowers parity is rejected.
- Foreign-origin words (set 2026-09-26): many are naturalised enough that English rules cannot fully reach them. Write a rule when a pure rule works without hurting the metrics (orthographic classes such as -ino/-ano penult stress are rules, like -ford/-stein/-bury in SUFFIX_RULES). Otherwise put the word in a dictionary file (`src-data/en/custom.dict`). **Never a whole-word → pronunciation mapping table in code.**
- Strict scoring neutralises /ʌ/ vs /ə/ (2026-09-26, same code 49.11 → 52.94). The metric is "exact after stress removal", and in American references STRUT is the stressed form of schwa: CMUdict has one AH phone for both (AH1/AH0 in `cmudict.phones`), and Merriam-Webster writes both \ə\ ("\ˈə\ in stressed syllables as in humdrum, abut (IPA [ʌ])", Guide to Pronunciation). ipa-dict writes ə under stress, so /ʌ/ output was a stress mismatch scored as a vowel error. Output is unchanged, and `normalizeStrut` stays. `test:parity`'s strict still separates them; the same argument applies there, but that gate's baseline history is kept as-is until it is changed deliberately.
- Solve with rules, not data (set 2026-09-26). The misaki homograph import (~300 entries, `src-data/en/homographs-misaki.txt`) is the accepted order of magnitude for a vouched data supplement. Do not add datasets, trained models or name lexicons to raise a score. That rules out WikiPron capitalonyms (CC BY-SA as well) and a trained POS tagger. Where a rule can replace imported entries, prefer the rule. Measured once, rejected: an -ate rule (noun evidence + 3+ syllables + dict /-ˌeɪt/ → /-ət/) cannot replace the 39 -ate data entries. Which reading an -ate word takes WITHOUT context is lexical (laminate, conjugate, postulate, affiliate default to the noun; isolate, animate, associate to the verb), so the rule recovered 0.23 of the 1.73 points the entries carry, and it adds nothing with them present.

Open classes: heteronym ADJ-vs-N after a determiner (invalid) and sense-only heteronyms (bass, bow) — see the heteronym passes above.

Compression (2026-09-10, first pass): it ran snapshot-gated (empty diff over 1.3M predictions) and took the three modules from 2930 to 2685 lines. Still 85 over the ceiling; what remains is comment carrying the dict ratio behind each rule, which the procedure says to keep. The opt-in `predictPrincipled` path is the one block that may be vestigial — retiring it is a behaviour decision, not a compression.

Found, not fixed (2026-09-10): `syllabify` splits `e|xist`, so two-syllable ex- words get initial stress; 3+-syllable penult stress is a coin flip on syllable heaviness, and no feature tried (heaviness, onset cluster, coda, openness) got a two-syllable `a-` prefix above 64%, so it needs suffix class or POS; no post-primary secondary-stress rule exists; `sch`+vowel → /sk/ and `og$` → /ɔɡ/ both lose on the name-heavy dict (school/scheme/blog are lexical); `-iver` has no orthographic discriminator between driver and river, so the v-exclusion in `iFire` stays; open `wa` (quality, water) has no majority in the dict.

Next, measured and waiting (2026-09-10): `assignStress`'s prefix rules put the primary on the wrong syllable for property/process/proper/expert/reference/conference/advertise (they return index 1, the dict wants 0) and for yesterday/percent/internet — no vowel rule can reach those. The same is true of most of the remaining `a` errors: of 1475 æ→ə positions, 788 sit where the rules stress syllable 0 and the dict reduces it (abet, abort, abash), and 1519 of the 1949 ə→æ positions are dict-stressed. Of that, the `oi` gap (avoid) and the magic-e rime (alone, amaze) are now fixed — the magic-e case never reached the two-syllable branch at all, because the syllabifier gives the silent e its own syllable, so the rule had to move to the 3+ branch. The r-controlled half is CLOSED as disproved: a closed r-rime after `a-` is 11 final : 11 initial and a word-final `-Vr` is 8 : 23, so there is no rule there.

A stressed open `a` behaves like `o` and `y` under trisyllabic laxing, not the opposite: at three syllables it is tense only 11% of the time against 31% at two, and the frames that win at two invert at three. radio, agency, canadian, favorite, native and capable are lexical minorities that no general rule reaches.

Do NOT extend the last-syllable prefix guard to an `n` coda for format/impact/content: measured on the genuinely-unstressed subset, final `a` with an `n` coda is 1809 ə : 190 æ and final `e` with `nt` is 324 ə : 40 ɛ. Those three are stress errors, not guard omissions.

Line-count trigger (2026-09-10): it now counts code lines, not total lines. Measured at 2789 total the split was 2002 code / 706 comment / 165 blank, i.e. the ceiling was being tripped by the measured-ratio comment this loop requires on every rule, not by code growth. Counting code keeps the trigger honest in both directions: it still fires on real accumulation, and it stops rewarding the deletion of the evidence behind a rule.

A sixth, smaller pass (2026-09-22) closed a real dead-code bug: `syllabify()` always attaches word-initial `x` to the FIRST syllable (`exist` → `["e","xist"]`, never `["ex","ist"]`), so the `"ex"` entry already sitting in `PREFIXES_2SYL` could only ever fire for ex+consonant words (export, expect — 25:17 final), never ex+vowel, where the prefix is hidden inside `syllables[0]`. `assignStress` now aliases `firstSyl` to `"ex"` when it is `"e"` immediately followed by `x`, without touching `syllabify()` itself (worked around it, the same way the pre-existing `a-` prefix special-case does). True 2-syllable ex+vowel words: 11:5 final in the dict — matching a stale, never-actually-verified comment that had been sitting next to the dead entry. Same pass fixed two related bugs found while chasing it: /ɡz/ (not a licit onset) was landing the stress mark on the wrong side of the cluster in 112/112 dict entries containing it, and `exh-` before a reduced vowel (exhibit, exhaust) wasn't voicing to /ɡz/ the way `ex` + a full vowel already did. `exit` is the one measured regression — no orthographic signal separates it from exist/exert, and it is the minority side of the split.

Rules-only pass (2026-09-26). An unstressed vowel before a word-final silent-e -ce, and its -ces/-ced/-cing inflections, now reduces to /ə/ (palace, notice, practice, service, furnace): 26 strict wins : 6 losses, and 4 top-5000 wins. After a two-syllable compounding prefix (inter/over/under/counter/super) the -Vce is a free root and keeps its vowel (interface, interlace); `syllableToIPA` gained a `head` argument for that test. -se was measured and left out, because -ise/-ose/-use are the stressed or secondary suffixes (advertise, franchise, diffuse). Two knock-ons had to be fixed before the gates held, and both are worth remembering. First, once a base form becomes rule-exact it leaves the exception table, so its inflections (services, notices) fall through to the rules, and the rule has to cover them too. Second, trisyllabic laxing counted the inflection -es/-ed/-ing toward depth, so notices laxed to /ˈnɑtəsəz/; the depth is now counted on the base. Rejected: reducing unstressed final -ain (captain, mountain, certain) scored 14 : 22 strict. The losses are domain/maintain/abstain, whose stress the rules already put on the wrong syllable, and reduction turns that stress error into a two-edit miss.

The -ation morphology handler built abdication from abdicate + /ʃən/ and kept the stem's primary (ˈæbdəˌkeɪʃən). -ation, like -ization, takes the primary on its own /eɪ/ and demotes the stem's, so it now does (ˌæbdəˈkeɪʃən, the onset from utils' licit-onset set). 316 dict words have penult stress and were read otherwise; evaluate-strict 49.05 → 49.24. Note that `test:eval`, `rule-diff` and parity all compare stress-stripped, so a pure stress fix scores 0 : 0 there: judge stress changes on `evaluate-strict` (and the homograph benchmark), not on the segment metrics.

-ity and -ial take the primary on the syllable right before them (activity, abnormality, accessibility; editorial, adversarial). The syllabifier keeps consonant + ity/ial as one final slot, so `assignStress` returns length - 2. -ial needs 3+ slots, because at two the <i> is itself stressed (denial, trial). -iety is a different frame. -ity: 59 strict wins : 11, lenient +84. The losses are an open pretonic first syllable reduced too far (docility, hostility, humidity keep a full vowel in the dict), which is its own frame, not a stress error. -ial words also had to skip the generic -al morphology (adversari + -al kept the stem's stress), except over a one-syllable stem (trial): 20 : 0. Pattern worth reusing: when a suffix shifts stress, check whether a morphology handler builds the word first and keeps the stem's stress. -ation had the same bug.

The same slot rule covers -ental/-antal (accidental, environmental) and the Greek -graphy/-nomy/-sophy/-scopy/-pathy/-gamy/-cracy endings (photography, philosophy, democracy): 12 : 1 and 12 : 1 strict. -ential needed its -cial/-tial morphology handler to skip a 3+-syllable -en/-an stem (confiden+tial kept the stem's stress). The 2-syllable stems essential/potential still come out initial-stressed from that handler, but routing them to the rules mangles essential, so they stay open. Found, not fixed: fundamental goes through compound decomposition as fund+amen+tal, and geo-/bio- are one syllable slot, so -graphy stresses the wrong vowel inside it (geography, biography).

-ate puts the primary two syllables before its own /eɪt/ (abdicate, accelerate, anticipate, and the adjectives accurate, delicate). The syllabifier writes it as C+a · te, so that is slot length - 4, or length - 3 when the C+a slot is a hiatus holding two syllables (appre·cia·te, gra·dua·te); fewer than four slots is left alone (debate, rotate). It scored 131 strict wins : 12 and fixed demonstrate/generate/indicate/operate/separate. The losses are prefix + two-syllable -ate (relocate, dislocate, underrate, overestimate), which want the base's stress.

It also exposed a shipped rule-path bug. The primary mark's position was computed on the syllable strings BEFORE applyPostLexical and then inserted into the string AFTER it. Any post-lexical edit ahead of the mark (degeminating ac·com, bə|ɹeɪ → bɝeɪ) shifted it into the stressed vowel (əkɑmədeˈɪʃən). The mark is now anchored on the untouched tail of the word. An onset consonant the pass absorbed into a vowel is dropped from the anchor, but one it merely rewrote is not (chord, gehrig). An ɪɹ/əɹ pair stays ahead of the mark so it can still coalesce to ɝ, which is the convention applyPostStress's onset pass keeps. Stress-position exact matches: 219 wins : 0. Rules-only strict segments: 340 : 0, mostly Mc- names whose later passes key on the mark. Known cost: collaboration now comes from the whole-word path (collaborate is rule-exact and left the table), which has no secondary on co·LLA, because secondaryStressIndices skips two open slots in a row. Its rhotic test now pins only the /ɝˈeɪ/ segment.

The word-initial closed-syllable frame that keeps a full vowel before the stress (initialClosedA/E) now covers <o> too (bom·bastic, cog·nition, dog·matic), minus the com-/con-/cor-/col-/ob- prefixes that reduce (community, objective): 87 strict wins : 14. Measured and rejected: dropping secondaryStressIndices' two-open-slots exclusion gives collaboration/examination their co·LLA beat but costs -ification/-ization and the Greek -o- linker, 41 : 59 lenient.

First foreign-name rule class (2026-09-26): Italian endings -ino/-ano/-ini/-oni/-elli/-etti/-ello/-etto/-ucci/-acci. Stress goes on the penult at 3+ slots (`ITALIAN_ENDING` in syllabify). That stressed vowel takes its Italian value (a /ɑ/, i /i/, e /ɛ/), and so do two-syllable -ino/-ano names, but not an English two-syllable -ini (mini). The other unstressed e/o/u stay full (lo·ZA·no /loʊ/) after the English reduction has run; <a> and <i> are anglicised in the dict and do reduce. Stress without the vowel quality was net negative on lenient (84 : 169), because the English rules give a stressed a /æ/. Stress plus stressed vowel scored 164 : 43 strict; the full-vowel pass added 178 : 36 (e/o/u; adding i or a won more strict but lost more). lozano/molano's vowel test expected initial stress, against ipa-dict and CMUdict (both penult); with the user's approval it now expects ɫoʊˈzɑnoʊ / moʊˈɫɑnoʊ. Open in this class: the -iano hiatus (juliano, gagliano) puts the mark on the i of the "ia" slot.

-ia stresses the syllable before it (india, malaria, cafeteria). An open a/e/o there is tense (al·BA·nia /eɪ/, ME·dia /i/, mon·GO·lia /oʊ/), as Latin lengthening before a hiatus predicts: 86 strict : 19, lenient +83. <u> is left out because furia/luria keep /ʊ/, and a/o alone scored lower. -ator stresses like its -ate verb (generator, administrator) and keeps /eɪ/ on the <a> even under the secondary that alternating stress gives it. Stress alone turned that <a> into /æ/ (0 : 5); with the vowel it is 35 : 0.

Germanic compound surname elements -berger/-inger/-erman(n)/-heimer/-meyer/-meier/-hofer/-felder keep initial stress at 3+ slots (aldinger, bamberger, oppenheimer), as English words sharing them do: 73 strict : 5, headline +0.31. -ington was measured in the set and taken out on the user's call. It is an English place-name element, not a Germanic one, and American usage varies there (ellington heard as ɛˈɫɪŋtən, although ipa-dict and CMUdict both write ˈɛɫɪŋtən). The remaining losses are first-element laxing (fry·berger, cry·derman get /ɪ/).

The agent noun of a Greek -y noun (-log/-graph/-nom/-soph + -ist/-er) is now read from the -y form in morphology, swapping its final /i/ (biology → biologist, photography → photographer, economy → economist): 29 strict : 1. The loss is misnomer, whose "misnomy" is not a word. German -auer is /aʊɝ/ (bauer, neubauer): 43 : 0, one PHONEME_RULES entry.

-ola joined the Italian endings (dicola, spinola, buccola): 28 strict : 8, lenient +58. The losses are Greek/older loans with antepenult stress (gondola, parabola, pergola). At two syllables the Italian vowel is withheld from -ini and -ola (mini, nola) but kept for the rest (gino, gucci). -ara was measured and dropped: barbara, ankara and clara are English/anglicised (0 : 1 on the top-5000). -era is not tried, because camera and opera are antepenult.

The -ia rule now covers the whole Latin hiatus family through one `LATIN_HIATUS_ENDING` shared by assignStress and the tensing rule: -ia/-ian (with plural -s), -ious and -eous (canadian, various, spontaneous). The old -ia pattern matched only a bare final a, so these fell to the heaviness fallback. When the suffix syllable has an r onset, the lengthened vowel is the r-coloured SQUARE/NEAR one (bar·BAR·ian /ɛ/, al·GER·ian /ɪ/). Result: 119 strict : 19, top-5000 8 : 0. The losses are e+r names that the dict writes with tense i (valeria, tiberia against siberia), plus -cious/-tious words (judicious) whose newly unstressed first vowel reduces further than the dict does.

Word-final -ine took the magic-e /aɪ/ whenever the next slot was bare "ne", stressed or not. When the rules leave it unstressed and the gram before -ine is a measured not-/aɪn/ one, the syllable now falls through to /ɪ/. The grams: `FRENCH_INE_GRAM`, cine/chine/sine/zine/rmine/rtine/stine, and a vowel + rine/tine. The measured not-aɪn : aɪn ratios are in the comment; -line/-mine/-dine/-ntine/-vine/-pine are majority /aɪn/ or split and are left alone. The result is 4 strict : 2 and lenient 25 : 1. The first version used a regex lookbehind, which Hermes (React Native) may not support; it was rewritten as an equivalent plain pattern, since the regex is only used with .test().

-ive landed stress one syllable late. The syllabifier gives the silent e its own slot (ac·ti·ve), and assignStress' gram/heaviness fallback counted that slot, the problem secondaryStressIndices already corrects with SILENT_E_SLOT. The fallback now merges a final consonant+i · ve pair before counting (not -cei-ve, whose digraph already stresses right). -sive/-cive/-xive keep the penult even when it is light (elusive, pervasive). A compound on the free word "motive" keeps its own stress (automotive). Result: 21 strict : 1, top-5000 1 : 0 (negative). Left open: first-syllable -ative words (cumulative, speculative) lose the 41 : 18 majority to antepenult, and syllabification pulls the s of -gest- into the onset (digestive).

The syllabifier keeps a two-vowel hiatus in one slot (geo·graphy, bio·graphy, prio·rity), so a slot-level stress put the mark on the first vowel. When the stressed slot is a genuine hiatus (`isHiatusSlot`), the mark now moves to its second nucleus (`hiatusMarkOffset`, on the post-lexical string). Excluded: vowel digraphs and doubled letters; eo before r; ae/oe, which a later pass elides; g/qu + vowel (gu·ar·dian); and a combining form with an onset before /oʊ/, which keeps its own stress (biome). Stress-position exact 65 : 0 and strict segments 44 : 0. The one lenient loss is inferiority: the corrected mark lets unstressed ɪɹ coalesce to ɝ before it, where the dict keeps ɪɹ. Rejected: making a hiatus penult "heavy" so assignStress picks it (curiosity, juliano), −10 net on the headline.

Indefinite pronouns and adverbs are read as determiner (any/every/some/no) + free noun (one/body/thing/where/how/way/time/place), each part from the lexicon or rules, with a secondary on the second. That is a closed grammatical class, not a word list: 8 strict : 1, top-5000 7 : 0 (anyone, anything, someone, something, somewhere, nobody, anywhere). Measured and rejected: unstressed -ard → /ɝd/ (22 : 20 lenient; -art and -hard keep /ɑɹ/ in German names).

### Two traps in the measurement itself

**Ranking error classes by single-edit signature overstates the opportunity.** The diagnosis recipe above counts the words a flip would fix but not the already-exact words it would break. Measured properly, the biggest-looking class in the benchmark — unstressed /ɪ/ where the dict has /ə/ — is not winnable by more ɪ/ə rules: `-ed` after t/d would fix 225 and break 473, final `-in` would fix 51 and break 1018, `-ical` would fix 0 and break 94. The dict is genuinely split on all of them and the rules already sit on the majority. Always simulate a candidate flip in both directions before briefing work on a class.

**A rules-only score is not independent of the mined table**, and the two interact in a way that can hide a regression: the morphology handlers look their stems up in the table even under `disableDict`, so improving a rule can evict a stem and change an unrelated derived word. That is why `scripts/mine-exceptions.ts` now evicts only on an exact stress-stripped match; the earlier canon-based test collapsed i/ɪ, ɑ/ɔ, ə/ʌ, ɛ/eɪ and æ/eɪ, so better rules quietly shipped the collapsed reading. Restoring the strict test was worth +1.11 parity and +0.80 on the top-5000 benchmark by itself.

### The STRUT convention, and why parity has a ceiling

`normalizeStrut` in `src/en/phonotactics.ts` promotes a stressed /ə/ to /ʌ/. Removing it measures **+2823/−55 on the dictionary path and takes `yarn test:parity` to 95.10%** — the single largest parity number available anywhere in this codebase. Do not take it.

The promotion is an adapter between two references that disagree. `data/en/dict.json` is built from open-dict-data ipa-dict `en_US`, which writes STRUT as /ə/ even under stress: **zero /ʌ/ in 100,871 entries**. CMUdict, which `yarn test:common-accuracy` scores against, maps AH1/AH2 to /ʌ/ and AH0 to /ə/, and so does every mainstream American IPA transcription — *cut* is /kʌt/, not /kət/. Deleting the promotion would raise parity by making the output match a source with a known transcription quirk, while dropping top-5000 segment accuracy from 92.26% to 89.62% and shipping less standard pronunciations. 136 of the remaining top-5000 mismatches differ from CMUdict by ə/ʌ alone.

So parity is capped by that convention gap, and a parity number above roughly 93% should be read as suspicion that something re-adopted the base lexicon's convention rather than as progress. The same reasoning rejects skipping `applyPhonotactics` on verbatim lexical hits: it would remove ~2500 table rewrites at a stroke, but at the cost of freezing ipa-dict's conventions into shipped output and making dictionary words and rule-derived words disagree with each other.

## Commands

- `yarn build` — compiles dictionaries (via `prebuild` → `build-dict`) then rollup-bundles all entry points to `dist/`
- `yarn build-dict` — regenerates `data/**/*.json` from `src-data/` sources (run manually after editing `src-data/`)
- `yarn test` — Jest, picks up `__tests__/**/*.test.ts`. Single test: `yarn test -- en-rule-g2p`
- `yarn test:coverage` — Jest with nyc coverage
- `yarn typecheck` — `tsc -b` (no emit)
- `yarn test:eval` — `scripts/evaluate.ts`: Levenshtein distance of rule-based G2P vs. dictionary
- `yarn rule-diff dump <out>` / `yarn rule-diff compare <before> <after>` — `scripts/rule-diff.ts`: rules-only per-word dump and win/loss report (strict, lenient, top-5000) between two dumps; the adoption test for a rule change
- `yarn test:parity` — `scripts/evaluate-parity.ts`: shipped pipeline (dict enabled) vs. dictionary; `--dump <file>` writes per-word output for diffing two states
- `yarn test:homographs` — `scripts/evaluate-homographs.ts`: heteronym reading in context against WikipediaHomographData (shipped pipeline). `--split train` to diagnose, `--update-baseline` after a confirmed improvement; exits non-zero when eval accuracy drops. First run needs `--download`
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
| **Line count** | `src/en/g2p.ts` exceeds 1150 lines, or the three rule modules (`src/en/g2p.ts` + `src/en/syllabify.ts` + `src/en/postlex.ts`) together exceed 2600 lines **of code** — comment and blank lines don't count |
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
