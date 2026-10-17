# Next-release accuracy plan

The release target remains strict accuracy **above 90%** on both fixed English
common-word populations. Passing the previous 70% checkpoint does not satisfy
this release target. References, filters, normalization and denominators stay
fixed; no runtime model, name lexicon or whole-word G2P/POS exceptions are added.

## Release requirements and latest validated working tree

| Metric | Release requirement | Current |
|---|---:|---:|
| English common rules strict | >=6292/6990 | 5270/6990 (75.39%) |
| Common top-5000 slice rules strict | >=3256/3617 | 2833/3617 (78.32%) |
| Public CMU default segments | >=4739/5000 | 4745/5000 (94.90%) |
| Context default/automatic strict | >=87/108 | 86/108 |
| Homograph eval | >=1454/1615 | 1443/1615 |
| Issue #28 apostrophe-name handling | Class regression and packaged verification | Passed |

Remaining strict gaps: 1022 common words, 423 top-slice words, 1 context
occurrence and 11 homograph eval cases. These counts are release gaps, not a
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

## Working batch after 5a0e6e3 (not committed)

A shared pretonic weak-vowel repair now also reduces /ju/ before the stressed
-ation environment after a stop; no target-word table is added. Cambridge
confirms /pjə/ in both UK and US computation, while compute retains /pju/.
See [computation](https://dictionary.cambridge.org/pronunciation/english/computation)
and [compute](https://dictionary.cambridge.org/pronunciation/english/compute).
Frozen full109147-input replay changes only rules computation, correcting it;
default output is identical. Rebuild removes only computation from exceptions
(54660->54659), with no additions or changed entries. All46 native/prose controls
pass;64 custom caller rows have zero ownership loss and direct overrides remain
first. Previously observed computate->computation inheritance is now accepted
under the user-selected generic caller contract, rather than preserved by pins.

Rebuilt common strict5200->5201/6990;fullstrict61608->61609/105067;stressheadline
54235->54236 and exact45051->45052/90310. Common lenient6325,top2794/3330,
full lenient83337,parity94771/100677,CMU4742/3984 and homograph1426 unchanged.
All432context rows/cells/readings/classes/fixed88 and contract identical.
4842tests/173suites and types pass. Rules CMU legacy90floor stillfails.
The separate broad unstressed -id candidate was rejected (rules36strictwins/
38losses;default36losses), without gold or dictionary-convention changes.

Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-weak-id/`, especially
`exact-counts.json`, `final/`, `pretonic-yod-complete.json`, controls and caller
reports. Keep this gain uncommitted;the next ordinary checkpoint still requires
5270/6990. Baselines and release targets stay fixed.

Final main-tree verification also passes all4842tests/173suites and types;
freshly extracted native CJS/ESM main/core/English smoke including computation,
prior class controls and issue28 passes. No commit,baseline refresh or publish.

### Reclaimed century and inter/intra batch

Neutral identity-consonant rule consolidation precedes the class changes:
1296352 dictionary/rules/derived/POS snapshot rows have identical bytes and
SHA256 af547ae6ea4f59f4316bacb23df33cf31141ea148b562df345652c1de21df6b4.
Specific cluster/rime rules retain priority; the consolidated single-character
identity rule uses the matched character. This is compression,not accuracy gain.

Weak noninitial unstressed open rhotic u now coalesces preceding t;primary/
secondary CURE and closed urC controls retain their old output. Inter/intra
reuse existing cial/tial root morphology, keeping supplied/custom root priority.
Frozen109147-input replay:default0changes,rules4strictwins/0losses,1lenientwin/
0losses. Real rebuild and full gates:common5201->5203/6990,lenient6325->6326;
top2794->2796/3617,lenient3330->3331;full61609->61613/105067,lenient83337->83338;
stress54236->54239,exact45052->45055/90310;CMUrules3984->3986/5000. DefaultCMU,
parity,homographs and all432context rows/cells/readings/classes/fixed88 unchanged.
4878tests/175suites and typesPASS;60customcases have zero ownership losses and
direct whole-word overrides remain first. Code3388=1150/1707/484/21/26.
RulesCMU90floor remainsFAIL. No baseline refresh or commit.

Evidence:`/tmp/phonemize-next-release/after-5a0e6e3-reclaimed/` includes the neutral
proof,snapshots,full replay,rebuild,exact-counts,final gates and caller rows.


## Accumulating repeated-prefix and lexical-POS batch

The ASCII uppercase gate uses an equivalent non-global regex. All 1,296,352
snapshot predictions are byte identical; every Unicode code point and mixed
surrogate controls preserve the original ASCII-only decision. This frees room
for composition without removing existing spelling constraints.

Repeated productive re- prefixes preserve the actual inner root and its stress,
including inflections, multiple prefixes and caller overrides. Both noun and
verb rerelease have final stress in Cambridge and Collins; the legacy noun gold
remains unchanged and is not used to invent an initial-stress exception. The
syllable-only prototype was rejected because it broke reregister.

Existing homograph POS fields can list multiple associations and their
complement. Source-checked learned keeps its original pronunciations and noun
association while adding Cambridge's educated adjective association. The
non-verb shortcut was rejected after 36 TRAIN verb regressions. No gold IPA,
reference population or runtime word-specific code was introduced.

After source rebuild: common 5203/6326 and top 2796/3331 unchanged; full
61613/83338; stress 54239/45055; parity 94771/100677; CMU default 4742,
rules 3986. Homographs improve 1426 to 1427/1615. Context default/known-POS
improves 83 to 84/108; other cells remain 80/42/38. Every context reading,
class, balanced metric, fixed supported subset and explicit control is preserved.
All 4894 tests in 177 suites and types pass. The existing CMU rules-only 90%
floor still fails. Sixty caller ownership comparisons and freshly extracted
CJS/ESM main/core/English packages pass. Five-module count is 3384 (G2P 1146).
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-repeated-prefix/.
This remains an accumulating batch; the next ordinary commit still needs 5270
common strict successes and release acceptance still needs the stated targets.


### Repeated-prefix audit correction

The initial repeated-prefix prototype was too broad: its fabricated silent-e
stems changed reregister and reregistration, and adding a secondary mark to
reregulate lowered full-IPA exact by one (45055 to 45054). Earlier prose claiming
all stress-aware counts were unchanged was incorrect. The prototype is
superseded, not adoption evidence. The replacement requires a vowel-team
silent-e root and preserves an existing secondary-stress pattern. Frozen
pre-experiment predictions and Cambridge/Collins reregister confirm the
register-initial stress control; experimental test expectations copied from
the broad prototype were corrected using that independent evidence. References
and committed baselines remain untouched. Combined acceptance is in progress.


## Qualified accumulating composition batch

The corrected narrow repeated-prefix rule, checked-a + mine reduction, nominal
subject/object clause evidence and source-checked noun read association are
combined. The -mine rule excludes vowel-team nuclei, preserving monoamine and
thiamine. A supplied examine root now owns an evicted examining child as already
authorized; an explicit child override remains first. The noun read association
uses the existing base variant and positive POS unions; the rule-only mode
continues to bypass whole-target homograph lookup.

Adjacent identity consonant clusters share one ordered rule. Both the earlier
and the final combined 1,296,352-row snapshots are byte-identical across this
compression; final proof SHA256 is
076f8dff6274fa7129a0d8b5a4f5f2d0474e84fa2a8c94080ebb732a5217c5e2.
Code count: 3381 total (G2P 1146, syllabify 1704, postlex 484, tables 21/26).

Exact comparisons against the freshly frozen corrected main tree: common
5203/6326 ->5204/6326; top2796/3331 unchanged; full61613/83338 ->61614/83341;
stress54239/45055 ->54241/45056; parity94771/100677 unchanged; CMU4742/3986
unchanged. Homographs1427 ->1428/1615; context80/84/42/38 ->81/84/42/38,
with every reading/class/control and supported-POS slice nondecreasing. No
reference or committed baseline changed. The legacy rules CMU90 floor fails.
All4933 tests/179 suites and types pass. All16084 distinct source sentences
were replayed in both modes: three finite uses and seven rules-only examine,
famine and jasmine occurrences change; token counts/spans remain identical.
Freshly extracted CJS/ESM main/core/English default/rules checks pass. Default
noun read is tested without adding forbidden whole-target rule-path lookup.
Source rebuild removes only examine and examining exceptions; no re-pin churn.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-cluster-compression/.
Common strict remains below the5270 ordinary commit minimum and the release
strict90 target; keep this qualified gain accumulating without baseline resets.


## Qualified weak -tune and finite-object batch

A short postrhotic weak -tune root coalesces/reduces in AmE; RP restores the
Cambridge full nucleus through a spelling/rime rule, without lexical mapping.
Controls preserve tune, Neptune, opportune/importune, caller roots, plurals,
possessives, new hyphenated prefix forms and full prose. Longer rules-only
misfortune/nonfortune remain route gaps; default misfortune is preserved.

A bounded third-person subject/object frame reuses noun/adjective morphology,
proper-subject syntax and existing adverbs. It requires clause evidence and
abstains for noun/object-relative controls. A bare-verb variant had no TRAIN
gain and was not selected. Final TRAIN adds7 strict cases without losses;
fixed eval adds1. No target-word pronunciation or POS exception was added.

After rebuild: common5205/6327, top2796/3331; full61616/83343;
stress54242/45057; parity94771/100677; CMU4742/3986; homographs1429/1615;
context82/84/42/38. Every count/reading/class/control and supported-POS slice is
nondecreasing. All4963 tests/181 suites and types pass; legacy rules-CMU90 still
fails. Two exceptions (fortune and its possessive) are evicted without additions.
The 16084-sentence two-mode replay changes15 token pronunciations: nine uses,
one finite coordinates and five rules-only fortune occurrences. Every change
was reviewed in its full sentence; token counts/spans are unchanged. Extracted
CJS/ESM main/core/English packages pass, including AmE/RP and default/rules.
Code count3386 (G1146/S1709/P484/T21/parser26). Source/reference baselines remain
fixed; common strict is five above5200 and still below5270 and release targets.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-finite-object/.


## Qualified finite-clause continuation

Finite third-person singular agreement also applies after bounded fronted
locative adjuncts and fronted object relatives. Dative addressees, explicit
mandatives, clause boundaries, duplicate occurrences and the existing
would-rather past-subjunctive control are preserved. Independent TRAIN adds2
strict cases without losses; the fixed eval adds1. No word exception or runtime
reference lookup was added.

One old regression fixture, She read books every day /rid/, was independently
false. Oxford read_1 and Collins conjugation require third-person present reads
/ri:dz/ and past read /red/. The fixture now requires /red/ under the user's
explicit dictionary authorization. Habitual wording no longer cancels finite
third-person agreement. I read every day and the base in explicit mandatives
retain /rid/. This fixture correction is separate evidence, not a score gain;
all fixed benchmark references, cohorts and baseline files remain unchanged.
Sources: https://www.oxfordlearnersdictionaries.com/definition/english/read_1
and https://www.collinsdictionary.com/us/conjugation/english/read.

All4976 tests/182 suites and types pass. Common5205/6327, top2796/3331,
full61616/83343, stress54242/45057, parity94771/100677 and CMU4742/3986 are
unchanged. Homographs1429->1430; context82/84/42/38->83/85/42/38. Every
reading/class/control and fixed supported-POS slice is preserved. The full
16084-sentence, two-mode replay changes only three read occurrences, all to
finite past /red/; other tokens/spans are identical. Extracted CJS/ESM main,
core and English default/rules pass. Legacy rules-CMU90 remains an existing
failure. Evidence: /tmp/phonemize-next-release/after-5a0e6e3-fronted-clause/.
No ordinary improvement commit is yet qualified; keep accumulating to5270.


## Combined subject/object and prefixed-infinitive batch (2026-10-16)

The bounded finite-object frame now supports balanced parenthetical objects and
comma-apposition subjects. Bare e-final predicates require a plural subject;
extra nominal modifiers require the apposition anchor. Closed-class words do
not count as capitalized nominal modifiers. Explicit adjective/object-noun and
zero-relative controls preserve appropriate, live, produce and records readings.

Written re- prefixes retain their governing infinitive to. The existing vouched
WOUND homograph variants now annotate only the base /wund/ reading; unannotated
past/participle routes remain unchanged. Optional empty form fields mean no
annotation. Derived verb and agent stems prefer source-vouched base variants,
with caller roots and direct child overrides preserving their ownership.
Oxford wound1_2 and Cambridge wound pronunciation independently support the
existing base reading. No new pronunciation, dataset or per-word G2P mapping is
introduced.

Compared with the frozen preceding main: common5205/6327 and top2796/3331 are
unchanged; full rules61616/83343->61618/83345; stress54242/45057->54244/45059;
parity94771/100677 and CMU4742/3986 unchanged; homographs1430->1432; context
83/85/42/38->85/85/42/38. Every context reading/class/control, balanced score
and fixed supported-POS slice is nondecreasing. All5004 tests/184 suites and
types pass. The two changed dictionary rule predictions are wounded/wounding;
their obsolete exception entries are removed after rebuild, with no default
prediction changes. The full16084-sentence replay changes15 token occurrences
across two modes; all changed words and spans were reviewed. Freshly extracted
CJS/ESM package main/core/English checks pass, including issue28, custom
ownership and paired contextual controls. Five-module code count3390 (G1150).

Main rebuild matches the qualified isolated source/data hashes (17files).
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-combined-prefix-aside/.
The remaining release gaps are1087 common,460 top-slice,2 context and22
homograph cases. No ordinary improvement commit is qualified yet; the next
threshold remains5270/6990. Weak-ical normalization and a demonstrative-that
heuristic were rejected or parked because they lacked nonregressing,
TRAIN-supported gains; no benchmark references or baselines were changed.


## Final velar codas and weak-prefixed roots (2026-10-16)

A rule-only final /ng+th/ coda uses the accepted intrusive velar stop, including
plural-s. Oxford Advanced American strength lists /strɛŋkθ/ first; American
Heritage explains this phonological transition and confirms accepted length
variants. Medial -th tails retain their source variants. The first rebuild
exposed plural inheritance after root eviction; the repaired class covers the
actual plural route rather than retaining a lexical shadow. Weak a- before a
checked, non-ing velar root takes root stress. Prefixed -eng verb inflections
restore silent e independently of optional -nges attestation; free roots and
surname agents retain their supplied routes. Cambridge/Oxford avenge verify
the existing /ndʒ/ stem. Native tests cover stems, plurals, inflections, OOV
hard-nasal controls, caller roots, direct children and sentence contrasts.

Compared with the frozen preceding main: common5205/6327->5208/6328;
top2796/3331->2799/3332; full61618/83345->61623/83348;
stress54244/45059->54249/45064; parity94771/100677 unchanged;
CMU4742/3986->4742/3987; homographs1432 and context85/85/42/38 unchanged,
including every reading/class/control and supported-POS slice. All5030
tests/187 suites and types pass. Seven full-dictionary rule predictions
change; five formerly necessary exceptions are evicted. Default prediction
dumps are unchanged. The full16084-sentence replay has197 rule-mode changes,
all reviewed as the final-coda insertion or weak-a root stress; no default
prose changes remain. Freshly extracted CJS/ESM package checks pass.

Five-module count3392 (G1150/S1710/P485/T21/parser26). Main rebuild
source/data hashes match the qualified candidate across19 files. Evidence:
/tmp/phonemize-next-release/after-5a0e6e3-coda-prefix/. No baseline or
scorer/reference changes, commit, version bump, publish or push. Ordinary
commit qualification still requires5270/6990; release gaps remain1084 common,
457 top-slice,2 context and22 homograph cases.
Sources: https://www.oxfordlearnersdictionaries.com/definition/american_english/strength
https://www.ahdictionary.com/word/search.html?q=strength
https://dictionary.cambridge.org/pronunciation/english/avenge
https://www.oxfordlearnersdictionaries.com/definition/english/avenge


## Narrow nasal-affricate weak vowel and neutral compression (2026-10-16)

Weak se before n+soft-g centralizes while stressed and secondary vowels,
other se+n environments and adjacent verbs remain unchanged. Broad se+n and
liquid extensions were rejected for regressions. A separate cid candidate,
despite aggregate gains and independent Merriam-Webster schwa support, failed
the existing possessive control and exposed plural inheritance loss; it was
rejected without changing that fixture, gold or adding a lexical workaround.

Common5210/6328 and top2800/3332 improve from5208/6328 and2799/3332;
full61626/83348, stress54249/45066 improve or retain61623/83348 and54249/45064.
Parity94771/100677, CMU4742/3987, homographs1432 and context85/85/42/38 stay
unchanged, including all per-reading/class/balanced/supported-POS/control gates.
All5038 tests/188 suites and types pass. Three dictionary rule predictions
change; messenger and the passenger possessive exception leave the table.
The16084-sentence replay changes only five rule-mode weak vowels and no
default prose; extracted CJS/ESM package checks pass.

Repeated vowel clusters triggered a separately reviewable neutral compression.
Only kg/mn silent-initial entries are merged after the final mn/mb guard; pn
retains its original contextual guard. The first pn-inclusive attempt changed
19 snapshots and was discarded. The repaired before/after SHA256 is identical
across1296352 predictions: b04da8ec962a1ec0ea904d3dfaf58b6870fd9a0a0ab096db951bec94fcf013e6.
Compression reduces five-module count3392->3391; the vowel class adds one,
leaving3392 (G1150/S1710/P485/T21/parser26). All5030 neutral-only tests and
types pass. Main rebuild matches the qualified source/data across19 files.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-weak-senger/ and
/tmp/phonemize-next-release/after-5a0e6e3-nasal-compression/.
The ordinary commit threshold remains5270 and the historical target is intact.


## Plural compound boundaries and complete agent roots (2026-10-16)

Productive plural heads now reuse existing vouched monosyllabic digraph roots
before complete polysyllabic compound tails. A competing s-initial tail keeps
its original boundary. Shared plural recovery also preserves evicted roots in
trees, sees, fees, bees and toes. Agent formation prefers a complete doubled
root before undoubling or inventing silent e; weak-el and explicit caller
pronunciations retain their ownership. Bound pos(e)/position(al) morphology
and a secondary-foot vowel rule repair proposition without changing propose,
position, proponent or primary-stressed propane.

Before/after gates: common 5210/6328 -> 5212/6330; top 2800/3332 -> 2800/3333;
full 61626/83348 -> 61637/83355; stress 54249/45066 -> 54259/45076;
CMU default/rules 4742/3987 -> 4744/3989. Parity 94771/100677,
homographs 1432 and context 85/85/42/38 stay unchanged, including every
reading, class, balanced score, supported-POS subset and explicit control.
All 5096 tests across 191 suites and typecheck pass. The CMU rules legacy
90% floor remains an existing failure. Counts were rechecked after the final
build completed. Freshly extracted CJS/ESM main/core/English checks pass.

All 117 changed tokens across 16084 full sentences in both modes were reviewed.
The groundskeeper rule prediction loses against the unchanged legacy /dsk/
reference, while independent Cambridge/Collins support the new /dzk/ reading;
that loss remains counted. Dewsbury's tail remains an existing coverage gap.
A newly explored placement-sense putting control exposed an existing put/putt
sense error in both before and after engines; its original correct diagnostic
is retained in the evidence directory, and this batch makes no claim to fix it.
No existing expectation or evaluation reference was changed.

Separately reviewable stem-dispatch compression preserves all 1296352 frozen
predictions and removes eight G2P code lines before the new classes. Combined
five-module count is 3393 (G1150/S1711/P485/T21/parser26). Rebuild retains
49 OOV plural dependency pins; re-pins are 484 and post-repin additions 16.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-agent-position-batch/ and
/tmp/phonemize-next-release/after-5a0e6e3-stem-compression/complete-proof.json.
Main rebuild source/data hashes match the isolated candidate across 15 files.
No baseline reset or commit; the ordinary threshold remains 5270/6990.


## Finite morphology, Greek clusters and boundary controls (2026-10-16)

Finite s forms reuse independently vouched sibilant/v-final verb stems,
including the existing live/lives contrast, while noun plurals retain their
citation readings. Inflected forms after prepositions, punctuation-separated
noun lists and be+adverb predicates no longer acquire false verb evidence.
A singular nominal subject in a finite subordinate clause preserves the verb
in “As polymerization proceeds, …”. The broader verb-stem candidate passed
aggregate metrics but failed complete prose review and was rejected.

The composed -ual boundary coalesces /ks/ without changing other onsets.
Greek sth+m loses the stop before m; the existing asm voicing class covers the
corresponding AmE reading and RP keeps voiceless s. Productive plurals retain
vowel-final roots after eviction, excluding truncated classical -us stems.
The prior rules-only asthma /æstmə/ fixture was independently incorrect:
Merriam-Webster documents AmE /æzmə/ and British /æsmə/. Only that incorrect
control was corrected; fixed evaluation references, populations and scorers
remain unchanged. The pre-existing default asthmatics lexical coverage gap
is retained as an open diagnostic, not counted as an improvement.

| Deterministic metric | Frozen previous working tree | Rebuilt candidate |
|---|---:|---:|
| Common strict / lenient | 5212 / 6330 | 5214 / 6331 |
| Top slice strict / lenient | 2800 / 3333 | 2801 / 3333 |
| Full rules strict / lenient | 61637 / 83355 | 61642 / 83357 |
| Stress headline / exact | 54259 / 45076 | 54263 / 45080 |
| Runtime parity strict / lenient | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules | 4744 / 3989 | 4744 / 3990 |
| Homograph eval | 1432 | 1433 |
| Context default-auto / known / rules-auto / known | 85 / 85 / 42 / 38 | 85 / 85 / 51 / 47 |

All context rows, reading/class/balanced/supported-POS counts and explicit
controls are preserved. All 5158 tests in 196 suites and types pass. CMU rules
still fails its existing 90% floor; its exact count improves. All 247 changed
tokens in 16084 complete sentences across both modes were reviewed, including
all 97 rules-mode uses occurrences. Extracted CJS/ESM main/core/English tests
cover class fixes, paired noun/verb readings, RP, root eviction, caller overrides
and issue #28. Rebuild retains 49 OOV plural pins, 484 re-pins and 16 post-repin
additions. No reference reset, new runtime dataset or whole-word mapping.

A separate neutral compression combines equivalent consonant clusters while
retaining earlier syllabic endings and hard-g output. It also removes two
one-use intermediate variables. All 1296352 snapshots are byte-identical,
SHA256 afd021f8ba35d5544d88eaa81d2d5c2c58172b627b19e681868be200d63d34ea;
all 5158 tests and types pass. Five-module count drops 3394 -> 3387
(G1148/S1706/P486/T21/parser26). An initial numbered-capture template was
rejected because this renderer supports literal identity, not $1 substitution.

Evidence: /tmp/phonemize-next-release/after-5a0e6e3-finite-sthm-plural/ and
/tmp/phonemize-next-release/after-5a0e6e3-rhotic-cluster-compression/.
Sources: https://dictionary.cambridge.org/pronunciation/english/sexual
https://www.merriam-webster.com/dictionary/asthma
https://www.merriam-webster.com/dictionary/isthmus
https://www.merriam-webster.com/dictionary/isthmian

Main rebuild matches the qualified source/data across 18 files. The actual
checkout reruns all gates with identical counts and all 5158 tests passing;
freshly extracted main-checkout CJS/ESM packages also pass the native checks.

No commit or baseline refresh: the ordinary threshold remains 5270/6990,
while this working tree has 5214. The historical full-dictionary target is intact.

## Vouched co- roots and assimilated closed FORCE roots (2026-10-16)

A separate prefix vowel now composes only with existing vouched longer
vowel-initial roots. Longer prefixes keep priority: counterman must never
be split as co + the unrelated vouched surname Unterman. Caller prefix,
root and explicit child pronunciations retain their established ownership.
Closed assimilated ad- + or roots receive final stress (accord/afford).
A primary final -ford keeps FORCE in both suffix rendering and postlex;
weak or medial -ford remains unchanged. No word/name table was added.

| Metric | Previous frozen working tree | Rebuilt working tree |
|---|---:|---:|
| Common strict / lenient | 5214 / 6331 | 5215 / 6332 |
| Top strict / lenient | 2801 / 3333 | 2801 / 3333 |
| Full strict / lenient | 61642 / 83357 | 61645 / 83357 |
| Stress headline / exact | 54263 / 45080 | 54264 / 45082 |
| Runtime parity strict / lenient | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules | 4744 / 3990 | 4744 / 3990 |
| Homograph eval | 1433 | 1433 |
| Context default-auto / known / rules-auto / known | 85 / 85 / 51 / 47 | 85 / 85 / 51 / 47 |

All context rows and subgroup gates are preserved. All 5169 tests in 197
suites and types pass. Rebuild retains 484 re-pins, 16 post-repin additions
and 49 OOV plural pins; final exceptions are 54632. All seven prose changes
across 16084 full sentences in two modes were reviewed; default prose has
zero changes. Extracted CJS/ESM main/core/English tests pass. Actual checkout
rebuild matches all 18 qualified source/data files and repeats all gates.
The Set iteration was changed to Array.from for the existing TypeScript
target; all 100806 dumped rule predictions are byte-identical.

The three full strict gains retain three lenient losses: Deford and its
possessive lose their formerly lenient surname match, and cooperated loses
the reference's contracted /kw/ reading. Those losses remain counted;
no surname exception or reference edit conceals them. Cooperative's weak
and strong endings are both vouched by Merriam-Webster; the old strong
reference remains valid and unchanged. Coeducation inherits its existing
root's yod limitation, not a claimed complete pronunciation repair.

Five-module code count: 3390 (G1150/S1707/P486/T21/parser26).
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-co-assimilated-or/.
Sources: https://dictionary.cambridge.org/pronunciation/english/accord
https://dictionary.cambridge.org/us/pronunciation/english/afford
https://www.merriam-webster.com/dictionary/cooperative

No commit or baseline refresh: ordinary threshold is still 5270/6990.

## Owned Greek clusters, -ution roots and finite named subjects (2026-10-16)

Greek cosm-/seism- voice their own s+m while native /sm/ neighbors retain
their literal clusters. The IPA guard follows the owned root, rather than
voicing every /sm/ in a word containing a Greek segment. Coalesced ss+yod
loses its redundant /s/ before /ʃu/. The existing -ecute root owns /ks/
in its -ution noun too; executive/examination/exemplary keep /ɡz/. A
generic /zm/ stress-boundary repair preserves seismology after eviction.
Clause-initial singular named subjects provide finite-past agreement
for existing form-annotated readings. Modals, plural names, mandatives,
vocatives and noun-read controls remain preserved. No name lexicon added.

| Metric | Previous frozen working tree | Rebuilt working tree |
|---|---:|---:|
| Common strict / lenient | 5215 / 6332 | 5217 / 6333 |
| Top strict / lenient | 2801 / 3333 | 2803 / 3333 |
| Full strict / lenient | 61645 / 83357 | 61652 / 83359 |
| Stress headline / exact | 54264 / 45082 | 54269 / 45087 |
| Runtime parity strict / lenient | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules | 4744 / 3990 | 4744 / 3993 |
| Homograph eval | 1433 | 1433 |
| Context default-auto / known / rules-auto / known | 85 / 85 / 51 / 47 | 85 / 85 / 51 / 47 |

All rows, reading/class/balanced/supported-POS gates and previous valid
controls are preserved. All 5204 tests in 199 suites and types pass. The
three old clear-s /cosmic, seismic/ assertions were independently wrong
and corrected using Cambridge, under the user's dictionary authorization;
benchmark references and accepted variants remain unchanged. Newly authored
record-noun/rules expectations exposed a pre-existing unsupported reading;
that diagnostic is retained outside the active native class tests, which use
the already validated reader noun and a full past-read sentence instead.

All 54 changed tokens across 16084 full sentences in two modes were reviewed,
including four default changes. Reissue and OnTheIssues only lose redundant
/s/ and retain their pre-existing root/boundary problems. The valid older
tissue /sju/ reference remains unchanged and its lenient loss stays counted.
Earlier broad ex-vowel and sm-voicing candidates were rejected; the former
introduced an additional wrong phone in exemplary, the latter broke native
prefix/compound boundaries and many correct names.

Rebuild retains 484 re-pins, 16 post-repin additions and 49 OOV plural pins;
final exceptions: 54624. Extracted CJS/ESM main/core/English tests pass.
Main rebuild matches all 18 qualified source/data files (using compressed
syllabify), repeats all gates, and passes extracted native package checks.

A separately verified neutral compression merges the gi+f/v emission and
identical spr/str clusters, retaining medial-gil and specific-cluster guards.
All 1296352 snapshot predictions are byte-identical, SHA256
3dff7d36732bfb8f3900fb70f03482e49fe3f47d767bf6a5b2a30a71d4dac7cb.
All 5204 tests and types pass after compression. Five-module count:
3393 -> 3390 (G1150/S1704/P489/T21/parser26). No code relocation.

Evidence: /tmp/phonemize-next-release/after-5a0e6e3-owned-greek-ex-yod/
and /tmp/phonemize-next-release/after-5a0e6e3-neutral-hard-gi/.
Sources: https://dictionary.cambridge.org/pronunciation/english/cosmic
https://dictionary.cambridge.org/pronunciation/english/seismic
https://dictionary.cambridge.org/pronunciation/english/issue
https://dictionary.cambridge.org/pronunciation/english/tissue
https://dictionary.cambridge.org/grammar/british-grammar/subject-verb-agreement

No commit or baseline refresh: 5217 is still below the 5270 ordinary batch
threshold and the strict-above-90 release goal remains unfinished.

## Relative-prefix boundaries, adjective metadata and final -scle (2026-10-16)

Relative infra-/supra- reuse independently vouched roots, retaining head
stress for -cture noun compounds and their neutral -al derivatives. This
repairs the rule-path segmentation of infrared and the head stress of
infrastructure/infrastructural. Oxford and Merriam-Webster independently
require the head stress; the first root-stressed candidate was superseded.
Some long-word lexical/reference stress remains inconsistent with those
sources and is recorded separately; no dictionary reference was rewritten.

Content's existing verb pronunciation also has its independently vouched
adjective association. Copular very/too/quite phrases provide adjective
evidence; emphatic the very + noun remains nominal. The -ly composer uses
the existing POS matcher, respecting N,ADJ/V,ADJ unions rather than literal
tag-string equality. Determined -ing modifiers supply noun evidence in
phrases such as an engrossing read; finite-object and inflected-s controls
remain unchanged. No new runtime pronunciation or whole-word code map.

Final -scle loses its velar while -scul- and initial scl- retain it. Plurals
protect the complete -scle root after exception eviction, including OOV
corpuscles. Muscular/musculature, caller literal clusters and duplicate
noun/verb muscle occurrences retain their contrasting consonants. Corpuscle
stem stress remains an existing open gap; only its owned ending is claimed.

| Metric | Previous frozen working tree | Rebuilt working tree |
|---|---:|---:|
| Common strict / lenient | 5217 / 6333 | 5218 / 6333 |
| Top strict / lenient | 2803 / 3333 | 2804 / 3333 |
| Full strict / lenient | 61652 / 83359 | 61653 / 83359 |
| Stress headline / exact | 54269 / 45087 | 54270 / 45087 |
| Runtime parity strict / lenient | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules | 4744 / 3993 | 4744 / 3995 |
| Homograph eval | 1433 | 1433 |
| Context default-auto / known / rules-auto / known | 85 / 85 / 51 / 47 | 85 / 85 / 51 / 47 |

All context rows/subgroups and previous valid controls remain preserved. All
5243 tests in 203 suites and types pass. All 22 prose changes across 16084
full sentences in two modes were reviewed, including three default changes.
The preliminary raw dictionary comparison contains three long-word strict
gains outside the legacy <=12-letter population: these are never presented
as a rise in its full-dictionary score. Source-backed POS API fixes likewise
receive no invented gain in the unchanged fixed context cohort.

Re-pins rise 484 -> 486; post-repin additions remain 16 and OOV plural pins 49;
final exceptions are 54623. The complete table diff removes only supranational,
with no new entries or pronunciation replacements. Extracted CJS/ESM main/core/English checks pass,
including root eviction, caller overrides, POS readings and issue #28.
Actual main rebuild matches all 18 qualified source/data files, repeats all
gates with identical counts, and passes its own freshly extracted package.

A separate neutral compression removes two single-use intermediates while
retaining French -re and short -ible constraints. All 1296352 snapshots are
byte-identical, SHA256
8ba699ec3c1740cfc5ada64c2bfbaadd76c24dd063fceb0a38e5c187271aacb8.
All 5233 tests and types pass on the compressed precursor. G2P drops
1151 -> 1149; final five-module total is 3390
(G1149/S1704/P490/T21/parser26).

Evidence: /tmp/phonemize-next-release/after-5a0e6e3-relative-scle-batch/,
/tmp/phonemize-next-release/after-5a0e6e3-relative-prefix-pos-batch/ and
/tmp/phonemize-next-release/after-5a0e6e3-stem-guard-compression/.
Sources: https://dictionary.cambridge.org/pronunciation/english/infrared
https://www.oxfordlearnersdictionaries.com/us/definition/english/infrastructure
https://www.merriam-webster.com/dictionary/infrastructure
https://dictionary.cambridge.org/dictionary/learner-english/content
https://dictionary.cambridge.org/grammar/british-grammar/very
https://dictionary.cambridge.org/us/dictionary/english/learnedly?topic=intelligence
https://dictionary.cambridge.org/us/pronunciation/english/muscle
https://www.collinsdictionary.com/us/dictionary/english-pronunciations/corpuscle

No commit or baseline refresh: common strict 5218 is below the ordinary
5270 threshold and the strict-above-90 release goal remains unfinished.


## Vouched assimilated negative adjectives (2026-10-17)

Extend the existing negative-prefix composer to il-/im-/ir- only when an
independently vouched adjectival root exists. Match the actual root IPA at the
boundary so caller-owned roots keep their consonants; preserve caller weak
vowels and the earlier irreligious/irresponsible controls. Opaque irritable,
immigrate and improvisational retain their earlier routes. Reuse the existing
stable-root renderer for closed OR + weak -al and the existing -ational class;
no runtime table, whole-word exception or trained model is added.

Frozen P70 -> rebuilt P71 counts: common 5218 -> 5219, lenient 6333 unchanged;
top slice 2804 -> 2805, lenient 3333 unchanged; full strict 61653 -> 61659,
lenient 83359 -> 83363; stress-aware phonemic 54270 -> 54280, exact full IPA
45087 -> 45104. CMU default 4744 unchanged; rules 3995 -> 3996 (the pre-existing
rules-only 90% floor still fails). Homographs 1433 and all four context cells
85/85/51/47, every reading/class, supported subset and paired controls remain
nondecreasing. All 5255 tests / 204 suites and types pass in candidate and main.

Review all 45 changed prose tokens over 16084 complete sentences in both modes:
14 default changes only add secondary prefix stress; rule changes recover
illegal/irrevocable and root stress. The practical weak-vowel choice follows
the frozen lexical reference; Oxford/MW retain KIT, so this is reference
alignment rather than proof that the older pronunciation was invalid.
[Merriam-Webster impious](https://www.merriam-webster.com/dictionary/impious)
explicitly accepts both initial-primary /ˈɪmpiəs/ and root-primary
/ˌɪmˈpaɪəs/. Keep both complete native expectations and leave evaluation gold
unchanged. [Oxford impractical](https://www.oxfordlearnersdictionaries.com/definition/english/impractical)
and [MW impractical](https://www.merriam-webster.com/dictionary/impractical)
record the reference difference.

Rebuild removes 16 now-recoverable exceptions and adds impracticable back,
restoring its pre-existing default weak vowel after the frozen-table loss.
No existing exception IPA is edited. Re-pins remain 486; final exceptions 54608.
Review all 22 rule-path and 11 default parity changes; parity strict/lenient
counts remain 94771/100677. Main rebuild is byte-identical to candidate across
all 56 source/data files. The single-use citation-phone temporary is inlined
without changing 1296352 predictions (SHA256
69f38e3243ceaa4a54904a20be4e7b598251bf1cc2382ff6156f0be74fbda611).
Five-module code count is 3391 (G1150/S1704/P490/T21/parser26).

Evidence: /tmp/phonemize-next-release/after-5a0e6e3-assimilated-negative-adjectives
and /tmp/phonemize-next-release/after-5a0e6e3-citation-phone-compression.
No commit or baseline refresh: 5219 is still below the ordinary 5270 threshold.

The main build is also packed and extracted independently: CJS and ESM main,
core and standalone English exports pass the new classes, caller overrides,
all retained earlier controls and issue #28 apostrophe names. Neither package
is published. P73 reduced-passive context work stays isolated: one TRAIN gain
with fixed eval unchanged, so it is not claimed as release progress.


## Split -iate boundaries and high-vowel + ci (2026-10-17)

Extend the existing open-e rule only where a consonant + i + a nucleus is
split from the remaining -ate/-ation/-ator tail. Coalesce high-vowel + ci in
that same family. Keep the /s/ of associate/association and closed -nciate;
keep the /ɛ/ in specialise/specialises/specialising. Broad alternatives were
rejected after complete-sentence replay exposed those non-target regressions,
even when aggregate gates passed. No word list, runtime mapping or gold change.

Qualified P78, measured against P71 with frozen populations: common
5219/6333 -> 5220/6334, top 2805/3333 -> 2806/3334, full
61659/83363 -> 61667/83365, stress-aware headline 54280 -> 54288,
full IPA 45104 -> 45111. CMU default 4744 unchanged, rules 3996 -> 3997;
its legacy 90% rule floor remains an existing failure. Parity 94771/100677,
homographs 1433 and every context cell/reading/class/supported subset remain
nondecreasing (85/85/51/47). All 5270 tests / 205 suites and types pass.

All 16 changed prose tokens across 16084 full sentences were reviewed. One
default cruciate improves to [MW's /ˈkruʃiˌeɪt/](https://www.merriam-webster.com/dictionary/cruciate).
Abbreviate/depreciate improve; immediate and collegiate recover their FLEECE
root vowel but retain earlier ending/stress failures, so do not count them as
complete word repairs. Rebuild removes 24 recoverable exceptions, adds none
and changes no stored IPA. Re-pins increase to 487 (P71: 486); no default parity
phones change, only two secondary-stress conventions. Five-module count:
3393 = G1150/S1705/P491/T21/parser26.

Candidate and actual main rebuild match across all 56 source/data files.
Both freshly extracted main/core/standalone-English CJS and ESM packages pass
new family checks, retained caller/neighbor controls and issue #28 names.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-split-iate-boundary.
No baseline refresh, commit or publication: 5220 remains below 5270 and the
strict-above-90 release goal is not complete.


## Vouched re- boundaries and preserved nested roots (2026-10-17)

Extend the existing prefix composer to independently vouched vowel-initial
closed roots and their regular derivations. Digraphs and doubled consonants
stay whole: reaches, reeck, reading, really, realm and repeated re-register
controls are unchanged. Reuse actual root dispatch and caller-owned prefix,
root and complete-child IPA. No new lexical table or whole-word rule mapping.

P84 initially passed aggregate gates but was rejected: reactive eviction
made OOV unreactive lose its root vowels. P87 adds actual nested re- recovery
and gives the outer prefix its initial secondary stress; unreactive now
matches the previous output exactly in both modes. Paired forced-eviction
checks cover nonreactive, unreactiveness, unreactivity and unrearmable too.
The unrelated uncoordinated reading is preserved.

Rebuilt P78 -> P87 counts: common 5220/6334 -> 5221/6334; top
2806/3334 -> 2807/3334; full 61667/83365 -> 61674/83367;
stress-aware headline 54288 -> 54295, full IPA 45111 -> 45112;
CMU default 4744 unchanged, rules 3997 -> 3998 (existing 90% floor failure).
Parity 94771/100677, homographs 1433 and all context rows/readings/classes,
balanced scores and the fixed supported subset stay nondecreasing:
85/85/51/47. All 5304 tests / 210 suites and types pass.

The batch also recognizes plural subjects with gerund/quantified objects,
reduced passive partitives and participial adverbs. Adams Extract is explicitly
preserved as a proper name. Fresh TRAIN comparison is 695 -> 698 automatic,
722 -> 726 known-POS, and 12770 -> 12774 homographs. Fixed eval remains flat;
these TRAIN gains are not claimed as release-goal or general-text accuracy.
All 106 changed tokens in 16084 complete sentences were reviewed: four default
syntax repairs; other default changes only add re- secondary stress; rule
changes recover full re- vowels. All five isolated parity changes are secondary
stress only. Six now-recoverable exceptions are removed, no stored IPA added
or edited, re-pins remain 487 and final exceptions are 54578.

Two neutral simplifications preserve 1296352 predictions each: stress-anchor
and weak-rime consolidation SHA256
a5a2decd57533f117d7c664e235148a895751c6f72ff3dc42e88d6869eb26d1c;
single-use competing-tail inline SHA256
21f4ba7ddaff0df5aefb5390c9f012608a06cc7d8fa530f347ef2c63dc4a747d.
The five-module count is 3392 (G1150/S1705/P490/T21/parser26).

Main rebuild matches candidate across all 56 source/data files, and actual
extracted CJS/ESM main/core/English packages pass the new nested roots,
caller controls, US/GB paths, sentence controls and retained issue #28 names.
Source checks: [MW react](https://www.merriam-webster.com/dictionary/react),
[MW reenter](https://www.merriam-webster.com/dictionary/reenter).
The new rule reenter uses source-vouched DRESS; the retained fixed lexical
reference has KIT, so do not claim a strict-word gain for that spelling.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-re-prefix-negative-recovery,
/after-5a0e6e3-stress-anchor-compression and
/after-5a0e6e3-competing-tail-compression (same parent evidence directory).
No commit or baseline refresh: 5221 remains below 5270 and the release goal.

## Tonic cie, dental ern and finite now frames (2026-10-17)

The accumulated, uncommitted batch now has 5223/6336 common strict/lenient
and 2809/3336 on the top slice. Tonic Latin -cie rimes preserve their vowel
and singular-rime spelling through plural recovery; competing -y stress and
vowel teams remain protected. Species is both singular and plural; specie
means money, so this spelling recovery does not assert a semantic derivation.
Dental -ern laxing repairs the MOUTH vowel before voiced dental/rhotic endings,
while mouth inflections and directional compounds retain their vowels.
Finite now frames preserve copular, determiner and hyphen boundaries.

Relative to the preceding fully validated snapshot, full rules improve from
61674/83367 to 61678/83372; stress-aware headline/exact from 54295/45112 to
54297/45113; CMU rules from 3998 to 4000/5000; homograph eval from 1433 to
1434/1615. Runtime parity remains 94771/100677, CMU default 4744/5000, and
all four context cells remain 85/85/51/47. Every previously correct context
row, reading/class, balanced score and supported-POS subset is preserved.
CMU rules still fails its legacy 90% floor.

All 5342 tests in 213 suites and types pass. Full-sentence replay covers
16084 original sentences in both modes, retaining occurrences and positions:
118 changed tokens were reviewed, with no new regression. Subspecies retains
its existing prefix-stress limitation; only its root vowel is repaired.
The neutral initialism-chain simplification preserved 1296352 predictions
byte-for-byte. Five-module code count is 3393: 1150/1705/491/21/26.

Independent candidate and main rebuilds match all 56 source/data files;
487 dependency re-pins and 54577 final exceptions remain. Freshly packed and
extracted CJS/ESM main/core/English entries pass the retained issue #28 and
class controls, including caller overrides and packaged-table equality.
5223 remains below the next ordinary 5270-word commit minimum: this batch
stays uncommitted and no release acceptance is claimed.

## Explicit passive-agent frames (2026-10-17)

A BE auxiliary, intervening adverbs and regular -ed form followed by a BY
agent now supply VBN evidence independently of the target lemma. This repairs
nine used-by occurrences in the complete 16084-sentence two-mode replay.
All other token predictions are unchanged. Default used-to habit/accustomed
controls remain correct; existing rules-mode used-to and attributive used-car
limitations remain open. Generic V versus VBN metadata matching is separate.
No fixed benchmark gain is claimed for this syntax-only addition.

All 5345 tests in 214 suites, types and unchanged fixed metric counts pass the
before/after checks; the CMU rules legacy 90% floor remains a recorded failure.
The candidate rebuild preserves all 18 data files byte-for-byte, and the main
rebuild matches all 56 source/data files. Fresh CJS/ESM main/core/English package
checks retain issue #28 and the previous class controls. This remains part of
the accumulating uncommitted batch, below the ordinary 5270-word threshold.

## Owned ify and weak ous roots (2026-10-17)

Actual -ify verb predictions now supply their vowel and stress to -ification
nouns, instead of pricing their truncated roots as independent words. Roots
with non-consonantal u retain their separate existing STRUT/CURE route.
Neutral -ous attaches only to vouched closed disyllabic roots with a weak
final nucleus; vowel teams, vowel-final roots and stress-shifting environments
stay on their existing paths. Caller-supplied root and complete-word IPA retain
ownership. Gamification still has an unresolved root-vowel error, and the weak
prefix vowel of overidentification remains separate; neither is claimed as a
complete repair.

Compared with the preceding validated main snapshot, rebuilt common counts
rise from 5223/6336 to 5227/6338, top slice from 2809/3336 to 2810/3337, full
rules from 61678/83372 to 61695/83376, and stress-aware headline/exact from
54297/45113 to 54312/45129. CMU rules rises from 4000 to 4003/5000; default
remains 4744. Runtime parity stays 94771/100677, homographs 1434/1615, and
all context cells 85/85/51/47, including every per-reading/class and supported
POS comparison. The CMU rules legacy 90% floor remains failed.

All 5358 tests in 216 suites and types pass on candidate and main. One older
unit fixture omitted independently documented secondary stress in acidification;
it was corrected against Merriam-Webster, separately from pronunciation gains.
No fixed evaluation reference, population, scorer or baseline was changed.
Codification's existing canonical long/short-vowel disagreement remains counted
as a loss under the fixed reference, despite both variants being documented.
Full-sentence replay reviewed all 40 changed occurrences in 16084 sentences
and both modes. Correct word controls have no new regression.

Two separate neutral compression checks each preserve 1296352 predictions
byte-for-byte (SHA256 e32b80c31d34f92065545bf86e2d04f3c203224cfa547d97109abdec59a1c258):
allocate only selected decompositions and share the six null-prototype lookup
copies. Their full tests and types pass. Neutral code count is 3376; the
behavior batch totals 3386 (1141/1705/491/23/26), below the retained 3395 cap.
Main rebuild matches all 56 source/data files; final exceptions are 54565.
Dependency re-pins rise from 487 to 493: cavern, hazard, marvel, odor, prosper
and treason are restored for their derived-word dependencies. Eighteen exact
nominals leave the exception table; no existing entry has its IPA edited.
Fresh extracted CJS/ESM main/core/English packages retain issue #28, caller
ownership and all class controls. The batch remains uncommitted below 5270.

Source checks: [acidification](https://www.merriam-webster.com/dictionary/acidification),
[codification](https://www.merriam-webster.com/dictionary/codify),
[diversification](https://www.merriam-webster.com/dictionary/diversification),
[identification](https://www.merriam-webster.com/dictionary/identification),
[gamification](https://www.merriam-webster.com/dictionary/gamification).

## Weak nasal voicing and inflections (2026-10-17)

The existing onset-s voicing class now includes weak ai+sin and oi+nasal
rimes, including plural -s. Borrowed ai+son environments and neighboring
voiceless rimes remain unchanged. The first rebuilt candidate exposed a real
raisin stem-eviction regression in raisins; extending the same rime through
its plural fixes the class rather than restoring a whole-word exception.
Possessives and caller-supplied roots are paired controls too.

Rebuilt common strict improves 5227 -> 5228/6990; lenient stays 6338, and
top slice stays 2810/3337. Full rules improve 61695/83376 -> 61697/83377;
stress-aware headline/exact 54312/45129 -> 54314/45131. Runtime parity stays
94771/100677, CMU default/rules 4744/4003, homographs 1434/1615 and all
context cells 85/85/51/47, including individual reading/class/POS gates.
The rules CMU legacy 90% floor remains failed.

All 5366 tests in 217 suites and types pass on completed candidate and main
rebuilds. The 56 source/data files match byte-for-byte. Full-sentence replay
reviews six changed poison occurrences in 16084 sentences and both modes;
other token predictions and alignment remain unchanged. Native CJS/ESM main,
core and English package checks retain issue #28, inflections, caller
ownership and all previous controls. Code count is 3387 (1141/1706/491/23/26).
Re-pins are 494 and final exceptions 54564. No baseline refresh or commit:
5228 remains below the ordinary 5270 minimum.


## Vouched -ish roots and finite verb object frames (2026-10-17)

The shared neutral suffix composer retains vouched complete -ish roots and
restores attested silent e without enabling compound fragments or rule fallback.
The suffix preserves hard c/g. Full-sentence controls cover noun, adjective,
verb and past-read readings. Finite object detection now handles bounded hyphenated
and participial modifiers, gerund object heads and quantified objects after a
determiner-backed subject; scanning the object head preserves nominal records
before were. Context-qualified plural verbs reuse existing vouched verb stems.

Frozen tables gain seven strict raw rule predictions without a loss. Rebuilding
raises common strict/lenient 5228/6338 -> 5229/6339, full rules
61697/83377 -> 61712/83384, and stress-aware headline/exact
54314/45131 -> 54330/45145. Top slice remains 2810/3337, runtime parity
94771/100677, CMU default/rules 4744/4003, homographs 1434/1615, and all
context cells 85/85/51/47. All per-reading/class, balanced and supported-POS
controls remain preserved. The CMU rules legacy 90% floor still fails.

Candidate and rebuilt main pass all 5377 tests in 219 suites and types.
Fresh extracted CJS/MJS main/core/English packages preserve issue #28,
caller-owned roots and paired syntax controls. All 56 source/data files match.
Review covers all 39 changed prose tokens across 16084 full sentences and both
modes. Luxembourgish improves root rime/hard g but retains the existing stress
limitation. A new book pin exposes the unchanged audio dictionary root in
audiobook; its LOT/THOUGHT convention differs from Merriam-Webster and is not
claimed as a canonical whole-word repair. No reference or scorer changed.

Re-pins increase 494 -> 502; ten exceptions are added, none removed or edited.
The roots bear, book, brown, dane, kade, rake, slave and white now support
evicted derivatives; brownson and crosswhite remain pinned to preserve their
existing output. The neutral initialism fallthrough refactor separately preserves
all 1296352 snapshot predictions and passes tests/types: neutral code count
3385. Final rule code count is 3395 (1148/1706/491/24/26). The retained cap
remains 3395. Baselines remain unchanged and 5229 is below the 5270 ordinary
commit minimum.


## Composed silent-e roots, micro-w and finite nominal objects (2026-10-17)

Co- before a vouched polysyllabic w root preserves its own vowel and the root
consonants; short ambiguous spellings remain whole. Micro- before a vouched
w root keeps compound stress and the weak linking vowel vouched by Oxford's
US microwave reading. Whole-target eviction exposed a microwavable regression;
restored silent-e lookup now also accepts an attested head-stressed morphological
root. Weak-prefix alternatives remain excluded to preserve interminable.
The general recovery also repairs magnetizable without adding a word map.

Nominal object syntax extends only with existing subject evidence. A broader
plural-subject guess was rejected because preceding finite s verbs could be
mistaken for nouns, breaking appropriate/duplicate/expatriate controls. The
accepted class repairs clause-initial Contractors extract and Warlocks combine.
Documents selects the finite verb reading; its full-u variant is independently
vouched by Oxford, without changing any lexical entry. An existing exh rule now
also drops h after a full ex prefix before weak i; exhibition's remaining weak
vowel mismatch is still counted.

Rebuilt common strict/lenient improves 5229/6339 -> 5230/6341, top slice
2810/3337 -> 2810/3338, full rules 61712/83384 -> 61714/83386, and
stress-aware headline/exact 54330/45145 -> 54333/45147. Homograph eval
1434 -> 1435/1615 follows TRAIN-only syntax selection (12781 -> 12782/14487,
zero new TRAIN failures). Parity stays 94771/100677, CMU default/rules
4744/4003, and context 85/85/51/47, preserving every reading, class, balanced
and supported-POS count. CMU rules still misses its legacy 90% floor.

Candidate and rebuilt main pass 5395 tests in 223 suites and types. All 56
source/data files match; fresh extracted CJS/MJS main/core/English packages
preserve prior controls, silent-e children and apostrophe names, including both
O'Reily and O'Reilly spellings. Every one of 17 changed prose occurrences across
16084 sentences and both modes was reviewed. Raw Microware remains a counted
proper-name lenient loss; its shipped lexical output is preserved. The miner
removes coworker, microwave and microwaving, adds no exceptions and edits no IPA.
Re-pins stay 502; exceptions total 54571.

The neutral shared stem selection separately preserves all 1296352 predictions
(SHA256 ee6a403e75a55822c2fbdad1a109a4ca6383b055639ce427e6936ad96e575e75)
and passes full tests/types. Neutral count is 3393; final count is 3395
(1148/1706/491/24/26), retaining the existing cap. Baselines and the 5270 commit
minimum remain unchanged.


## Weak stian root recovery (2026-10-17)

The existing stion suffix rule also handles unstressed stian after a single
non-u vowel. Stressed Christianna/Christianne and u-root fustian/Faustian/Proustian
retain hiatus. Borrowed-root recovery preserves the same stian root through
plural, negative-prefix and -ize composition after lexical eviction. The
splitter rejects the interacting st+ian boundary instead of combining Christ
with the independent name Ian. A broader -ian rejection was discarded after
it changed Belarusian's sibilant; other -ian boundaries retain their old route.

Frozen raw rules improve three strict and four lenient words with no loss.
Rebuilding improves common strict 5230 -> 5231/6990 and top strict
2810 -> 2811/3617; lenient stays 6341/3338. Full rules 61714/83386 ->
61717/83390, stress-aware headline/exact 54333/45147 -> 54338/45149,
and CMU rules 4003 -> 4004. CMU default stays 4744, parity 94771/100677,
homographs 1435/1615 and all context cells 85/85/51/47, preserving every
individual context row, reading, class, balanced and supported-POS count.
The legacy CMU rules 90% floor remains an existing failure.

Candidate and rebuilt main pass 5401 tests in 224 suites and types. All 56
source/data files match. Fresh extracted CJS/MJS main/core/English packages
preserve previous controls, derivatives and issue #28. All 32 changed prose
occurrences across 16084 sentences and two modes are affricate improvements
(30 Christian and two Sebastian tokens). Six exceptions leave the table:
christian, christianize, christianized, christianization, christianson and
mcchristian. None are added or edited; re-pins remain 502 and exceptions 54565.
Christianity's strong hiatus and the pre-existing default Faustian lexical CH
remain open; neither was hidden with a changed reference or a false fixture.

The separately reviewed decomposition rejection consolidation is byte-identical
on all 1296352 predictions under its frozen P131 snapshot and passes tests/types.
On the current source its neutral count is 3394, with the one stian guard
bringing the final count to 3395 (1147/1707/491/24/26). The retained cap,
committed baselines and ordinary 5270 strict commit minimum are unchanged.


## Vouched ng grades and finite sentence frames (2026-10-17)

Opposite comparative/superlative forms witness the productive ng-grade root,
provided an independent lexical base exists. This excludes the accidental
conger/congest pair. Caller-supplied base phones retain priority. Merriam-Webster
accepts both stronger variants with and without /ɡ/; the unchanged canonical
reference still records the one raw strict loss rather than treating it as a win.

Number expansion now exposes its existing cardinal vocabulary to the finite-frame
classifier. Bounded nominal-label and stacked object-modifier scans repair Line
2/6 uses and Ukraine uses five-digit numeric postal codes, preserving noun uses,
records, permits and Strong/High/Sustained winds controls. Written re- boundaries
retain preceding tense context; noun re-use of remains protected. Quoted nominal
passives and a bounded clause-initial when frame recover past read from an
explicit past matrix. Conservative regular-past rimes preserve need/embed/shred/
bobsled controls; present, future, indirect when and quoted targets remain intact.

Candidate and independently rebuilt main pass 5420 tests in 228 suites and types.
Common strict improves 5231 -> 5233/6990, top strict 2811 -> 2812/3617; lenient
stays 6341/3338. Full rules improves 61717/83390 -> 61721/83391; stress-aware
phonemic/full IPA improves 54338/45149 -> 54342/45151. Runtime parity remains
94771/100677 with zero isolated changes. CMU default remains 4744/5000; rules
4004 -> 4005/5000 still fails its legacy 90% floor. Homograph eval remains
1435/1615; all four context cells remain 85/85/51/47, including every reading,
class, balanced result and the fixed 88-case supported subset.

TRAIN context improves 700/727/433/398 -> 704/730/436/398, and homograph TRAIN
12782 -> 12786/14487. Duplicate occurrences are compared as a multiset, with
zero newly failing occurrences. All 65 full-prose token changes across 16084
sentences in both routes are reviewed: 58 grade changes, six uses changes and
one past read repair. Rebuilding removes only strong, adds/edits no exception,
and yields 501 re-pins and 54564 exceptions. Fresh main rollup, packed archive
extraction and CJS/MJS main/core/English tests pass, including issue #28.

Neutral POS-association and verb-reading selection preserves 1296352 predictions
byte-for-byte and passes tests/types. Its five-module count is 3393; the two
ng-grade lines return the adopted total to 3395 (1147/1707/491/24/26).
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-grade-context-tense-batch.
The common and context release goals remain unmet; baselines and commits stay
unchanged.


## Paired nominal roots, trochaic -ese and finite frames (2026-10-17)

Existing lexical -ist/-ism counterparts recover missing roots while preserving
independent stems and weak-vowel variants. Trochaic weak-final-a roots support
productive -ese without changing polysyllabic Veronese/Genovese controls. Modal
adverb frames require finite evidence for ambiguous modals; bounded asides,
acronym subjects, cardinals and proper-name objects preserve noun/adjective
controls and past read. No new runtime lexicon or whole-word mapping is added.

Candidate and independently rebuilt main pass 5446 tests in 232 suites and
typecheck. Common strict/lenient improves 5233/6341 -> 5234/6342; top slice
2812/3338 -> 2813/3338. Full rules improves 61721/83391 -> 61744/83411 and
stress-aware headline/exact 54342/45151 -> 54373/45171. Runtime parity stays
94771/100677, with only two secondary-stress changes. CMU default remains
4744/5000; rules improves 4005 -> 4006 and still fails its legacy 90% floor.
Homograph eval improves 1435 -> 1436/1615. Context remains 85/85/51/47, with
every reading, class, balanced score and supported-POS subset preserved.

All 106 changed full-prose occurrences in both modes were reviewed. Rebuilding
adds only counterterrorist through dependency-aware re-pinning, with no removed
or edited exception; re-pins remain 501, exceptions 54565. All 56 source/data
files match the independent candidate. Fresh extracted CJS/MJS main/core/English
packages pass, including issue #28 and custom ownership controls.

Neutral lookup/guard compression and paired-suffix capture preserve 1296352
predictions byte-for-byte. The last neutral count is 3393; two -ese lines restore
the retained 3395 cap (1147/1707/491/24/26). Broader weak-cid/gid and weak-it
proposals were rejected for breaking existing pronunciation controls; reference
expectations remain unchanged. Evidence:
/tmp/phonemize-next-release/after-5a0e6e3-qualified-trochaic-context-batch.
The ordinary 5270 common-strict commit threshold and release goals remain unmet;
committed baselines stay unchanged.


## Vouched roots and finite context (2026-10-17)

Matching existing compound-head/tail readings vouch for ind roots after lexical
eviction. Agents retain verb/caller ownership, and plural noun minds/blinds
retain PRICE in sentences. Single-nucleus proto tails preserve the combining
head; plurals keep singular composition and Greek hiatus stays on its prior
route. Inverted modal subjects remain finite evidence. Shared-subject regular
past drives POS and inflection together, with bounded object/subject evidence.
Direct-rule monosyllabic -use voicing preserves noun contrasts, logical quote/
re- boundaries and caller-owned recursive roots. No runtime dataset or word map
is added; to-infinitive ambiguity remains outside this finite voicing change.

Candidate and independently rebuilt main pass 5533 tests in 237 suites and
types. Common strict/lenient improves 5234/6342 -> 5235/6343; top slice
2813/3338 -> 2814/3339. Full rules improves 61744/83411 -> 61747/83412 and
stress-aware phonemic/exact 54373/45171 -> 54376/45174. Runtime parity stays
94771/100677, with zero isolated default changes. CMU default stays 4744/5000;
rules improves 4006 -> 4007, still below its legacy 90% floor. Homograph eval
stays 1436/1615. Context improves 85/85/51/47 -> 85/85/53/49; every prior
correct row, reading/class, balanced score and fixed 88-case subset is preserved.

TRAIN context improves 709/730/440/398 -> 710/732/457/422; homograph TRAIN
12803 -> 12804/14487. Occurrence-preserving comparisons show zero new failures.
All 73 changed prose occurrences across 16084 sentences in two modes are
reviewed: ten minds, two protonymph, one past read, 54 verbal use and six
protocol. Cambridge supports protocol and Collins supports protonymph.
Rebuilding removes protocol, blinder, blinder's, minder, winder and blind, adds
or edits no exception, and yields 500 re-pins and 54559 exceptions. All 56
source/data files match the independent candidate. Fresh extracted main/core/
English CJS/MJS packages pass, including issue #28 and owned-root controls.

Neutral nucleus matching, shared root lookup and doubled-root cleanup each
preserve 1296352 predictions byte-for-byte under their frozen inputs. The
matcher also agrees on 271453 adversarial strings. Final five-module count is
3392 (1144/1707/491/24/26), below the retained 3395 cap. The rejected full-
possessive lookup would have moved today's stress incorrectly; neither its
canonical match nor rejected weak-vowel proposals are counted as improvements.
Evidence: /tmp/phonemize-next-release/after-5a0e6e3-root-context-rebuild-batch.
Release goals and the ordinary 5270 common-strict commit minimum remain unmet;
committed baselines stay unchanged.


## 2026-10-17: paired grades, weak boundaries and relative clauses

The validated working tree now adds paired -ild comparative/superlative recovery,
Greek -iarch codas, stressed open a before tri+a/o/u hiatus, labial w/sw+ear,
and intact ough before vowel-initial inflections. The existing -ng grade
composition is shared with the new -ild class. Combining -meter after a
consonant-cluster -o head follows the whole-word stress route; caller-owned
meter tails retain the compound route. The ordinary -ie ending, ungraded
KIT roots, real g+h boundaries, native starch/search codas, neighboring
NEAR rimes, unit compounds and custom target/stem priorities remain covered.

Two bounded POS frames recognize a proper object followed by a role/preposition
and an object-relative clause with a named subject. They preserve analyses
as a noun, proper-name noun modifiers in questions, and records followed by
relative clauses. The broader early-finite-frame prototype was rejected because
it misread nominal analyses. The original lexical-hit meter assertion is
unchanged and now has an explicit lexical fixture; a separate eviction fixture
checks caller priority after re-mining. No reference pronunciation was changed.

| Deterministic metric | Previous validated F | Rebuilt main |
|---|---:|---:|
| Common strict / lenient, n=6990 | 5235 / 6343 | 5236 / 6343 |
| Top slice strict / lenient, n=3617 | 2814 / 3339 | 2815 / 3339 |
| Full rules strict / lenient, n=105067 | 61747 / 83412 | 61767 / 83430 |
| Runtime parity strict / lenient, n=100806 | 94771 / 100677 | 94771 / 100677 |
| Stress-aware headline / exact, n=90310 | 54376 / 45174 | 54390 / 45183 |
| CMU default / rules, n=5000 | 4744 / 4007 | 4744 / 4008 |
| Homograph eval, n=1615 | 1436 | 1436 |
| Context default-auto / default-known / rules-auto / rules-known, n=108 | 85 / 85 / 53 / 49 | 85 / 85 / 53 / 49 |

Frozen complete dictionary replay has 20 strict repairs, 18 lenient repairs and
zero losses on the rule path; default isolated output is unchanged before
re-mining. Rebuild removes only 19 now-derivable exceptions, adds or edits none,
and keeps 500 dependency re-pins (54540 final exceptions). Four default runtime
changes omit optional secondary marks in the matriarch/patriarch families;
phones and primary stress are unchanged. These are notation differences, not
additional pronunciation wins. The rebuilt prose review preserves all 128
frozen changes and adds only the same secondary-mark difference in two
matriarchies occurrences. Reviewed root repairs include 101 expatriate and
15 wear rule-path occurrences; no new pronunciation failure was accepted.

TRAIN context strict is 712/732/459/422 of 918, versus 710/732/457/422;
homograph TRAIN rises from 12804 to 12806 of 14487, with two repaired uses
occurrences and zero new failures, compared with duplicate-preserving counters.
Eval cells, prior-correct rows, per-reading/per-class counts, balanced scores,
fixed 88-case POS-supported subsets and all reference/scorer contracts are
nondecreasing. These train gains do not replace the unchanged eval counts.

Neutral ean dispatch and final-only rime-guard consolidation have separate
1296352-prediction equality proofs. The final neutral count is 3393
(G1148/S1704/P491/table24/parser26), below the retained 3395 cap. All 5681 tests
in 244 suites and types pass. Main rebuild matches all 56 candidate source/data
files byte for byte. Freshly packed and extracted CJS/MJS main/core/English
entry points pass accumulated controls, caller overrides and issue #28
apostrophe-name segmentation. CMU rules still exits 1 at its legacy 90% floor;
4008/5000 is a nondecreasing result, not a floor pass.

Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-relative-object-gap-probe`
for frozen/rebuilt metrics and prose/train reviews;
`/tmp/phonemize-next-release/after-5a0e6e3-neutral-final-rime-guards`
for the final neutral proof, main gates, source/data parity and extracted package.
The ordinary threshold remains 5270/6990 against committed 5200/6990: 34 more
strict common repairs are needed. Baselines, package version and historical
full-dictionary target remain unchanged; the accumulated batch is uncommitted.


## 2026-10-17 weak shion and vocalic velar ush: qualified working tree

Weak noninitial -shion now shares the existing weak-suffix route, including
n-onset derivatives. Strong/initial/secondary shion keeps its previous hiatus.
Velar ush before a vowel retains FOOT under primary or secondary stress;
consonantal continuations and neighboring gush/hush/crush/percussion stay apart.
Complete spelling-family roots remain available after eviction, preserving
noncushy/noncushion/nonfashion/nonparishioner and caller-supplied priorities.
No runtime names or whole-word pronunciation mappings were added.

Frozen complete replay has seven strict and two lenient repairs with zero
losses; default isolated output is unchanged before rebuilding. Nine raw
rule-path outputs change; two foreign-name predictions remain incorrect and
are not counted as repairs. Rebuild removes ten exceptions, adds/edits none,
and keeps 500 dependency re-pins (54530 final entries). The only default
runtime change drops optional secondary stress in oldfashioned; phones and
primary stress stay identical. This is not a pronunciation gain. Both frozen
and rebuilt prose reviews cover 16084 sentences in both modes and contain
only six rule-path fashion repairs, with all token alignments preserved.

| Metric | Before | Qualified main |
|---|---:|---:|
| Common strict / lenient, n=6990 | 5236 / 6343 | 5237 / 6343 |
| Top slice strict / lenient, n=3617 | 2815 / 3339 | 2816 / 3339 |
| Full rule strict / lenient, n=105067 | 61767 / 83430 | 61774 / 83432 |
| Stress headline / exact, n=90310 | 54390 / 45183 | 54396 / 45188 |
| Default parity strict / lenient, n=100806 | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules, n=5000 | 4744 / 4008 | 4744 / 4009 |
| Homograph eval, n=1615 | 1436 | 1436 |
| Context strict default-auto/gold, rules-auto/gold, n=108 | 85/85/53/49 | 85/85/53/49 |

All context per-reading, per-class, balanced, supported-POS and prior-correct
controls are nondecreasing under the same reference/scorer contract. All 5770
tests in 245 suites and types pass. CMU rules retains its known legacy 90%
floor failure; its nondecreasing count passes the adoption criterion.
Hard-ck consolidation has an independent 1296352-prediction equality proof
and tests/types; neutral count 3392, final count 3395
(G1148/S1706/P491/table24/parser26), retained cap unchanged. Main rebuild
matches all 56 candidate source/data files byte for byte. An independently
packed/extracted 81-entry artifact passes CJS/MJS main/core/English checks,
including issue #28, the new roots and caller overrides.

Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-weak-shion-class`
(frozen-v2, rebuilt-v2, main-final, exact counts, prose diffs, table parity,
package proof and artifact checks); neutral proof:
`/tmp/phonemize-next-release/after-5a0e6e3-neutral-hard-ck`.
Ordinary commit threshold remains 5270/6990 against committed 5200/6990:
33 more strict common repairs are needed. All improvements remain uncommitted;
baselines, package version and historical full-dictionary target are unchanged.


## 2026-10-17 bounded weak ile, meter and nominal base forms: qualified working tree

American weak -ile extends the existing weak-bile reduction, preserving
strong/secondary syllables and neighboring silent-e families. Complete
spelling-family roots remain owned after eviction, including nonfragile,
nondocile, nonsterile and nonhostile. Bound a+meter joins the measured compound
guard, fixing parameter while preserving productive nanometer, pentameter,
inflections, prefixes and caller overrides. American weak readings were checked
against [Merriam-Webster fragile](https://www.merriam-webster.com/dictionary/fragile),
[missile](https://www.merriam-webster.com/dictionary/missile) and
[hostile](https://www.merriam-webster.com/dictionary/hostile); strong variants
remain valid variants, not newly redefined errors.

Context selection now uses an existing annotated shared base/noun form before
a nominal head when POS is unspecified non-verb and no tense was inferred.
It preserves the reported !V tag, past/participle clues, known-POS cells and
custom overrides. No adjective gold was remapped to noun, no target-word test
or new runtime lexical table was added. TRAIN selected the class: five read
repairs, zero new failures, 717/732/459/422 of 918 context strict and
12811/14487 homograph TRAIN (before 12806), compared with duplicate counters.
The frozen eval is acceptance, not the selection set: read access supplies one
additional correct occurrence in default/automatic context and homograph eval.

| Metric | Before qualified S | Qualified main |
|---|---:|---:|
| Common strict / lenient, n=6990 | 5237 / 6343 | 5239 / 6344 |
| Top slice strict / lenient, n=3617 | 2816 / 3339 | 2817 / 3340 |
| Full rule strict / lenient, n=105067 | 61774 / 83432 | 61788 / 83433 |
| Stress headline / exact, n=90310 | 54396 / 45188 | 54397 / 45201 |
| Default parity strict / lenient, n=100806 | 94771 / 100677 | 94771 / 100677 |
| CMU default / rules, n=5000 | 4744 / 4009 | 4744 / 4010 |
| Homograph eval, n=1615 | 1436 | 1437 |
| Context strict default-auto/gold, rules-auto/gold, n=108 | 85/85/53/49 | 86/85/53/49 |

Frozen complete replay has 14 strict repairs, one lenient repair and zero
losses; default isolated output is unchanged. Four additional changed outputs
remain incorrect and are not counted as repairs. Rebuild removes exactly
14 exceptions, adds/edits none, and keeps 500 dependency re-pins (54516 final
entries). Default parity has zero changed predictions. Frozen and rebuilt
prose diffs are identical across 16084 sentences in both modes: 19 weak-ile
changes (motile remains a partial non-repair), six parameter repairs and six
default read repairs. All alignments, prior-correct context rows, per-reading,
per-class, balanced and fixed supported-POS counts are nondecreasing.

All 5867 tests in 248 suites and types pass. The five-module count stays 3395
(G1148/S1706/P491/table24/parser26), retained cap unchanged. Independent main
rebuild matches 56 source/data files byte for byte. The freshly packed and
safely extracted 81-entry artifact passes CJS/MJS main/core/English controls,
including new roots, sentence readings, issue #28 and caller priorities.
CMU rules retains its legacy 90% floor failure; 4010/5000 is the nondecreasing
adoption result. The unresolved HAVE + bare nominal compound ambiguity
(e.g. has read access) remains unchanged, not a claimed repair.

The proposed weak-ed change was rejected, including its one common-word gain:
first it regressed CMU founded, then rebuilding broke the unguarded root and
unfolded suffix boundary. All ed runtime behavior is restored to qualified S;
none of those proposed gains is included above. A paired Latin-prefix borrowing
probe was also rejected (rules +3/-4 strict; default -2), because shared spelling
alone does not preserve root consonants, nasal boundaries or vowels.
The offline structural learner has 0/18 candidate readings passing its legacy
filter, and unfiltered held-out strict falls 3731 -> 3713 of 5128, lenient
4559 -> 4549. Its 5128/7097 route coverage is limited; no proposal was adopted
and these diagnostics are not release pronunciation gains.

Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-ile-meter-nominal-batch`
for frozen/rebuilt/main gates, unchanged prose, train reviews, table/source parity
and extracted artifact. Related diagnosis is retained under
`after-5a0e6e3-ile-meter-coronal-batch` (rejected ed versions),
`after-5a0e6e3-nominal-base-form-probe`,
`after-5a0e6e3-paired-latin-prefix-probe`, and
`after-5a0e6e3-weak-shion-class/structural-learning` in the same evidence root.
Ordinary commit threshold remains 5270/6990 against committed 5200/6990:
31 more strict common repairs are needed. Baselines, package version and
historical full-dictionary target are unchanged; all improvements remain
uncommitted and release targets remain open.


## Clause boundaries and finite proper subjects (2026-10-17)

The article-following heuristic now respects a preceding clause boundary while
preserving real subordinate predicates, coordinated verbs and existing title-case
name frames. Finite proper subjects can license a closed pronoun object or a
quantified attributive object. These are shared syntactic conditions; no word
pronunciations, name lists or runtime datasets were added.

Frozen-table and rebuilt acceptance both pass all thirteen checks, including
5904 tests in 250 suites and types. Homograph eval rises from 1437 to 1443/1615
with six repairs and no newly wrong cases. TRAIN homographs rise from 12811 to
12860/14487 with 49 repairs and no losses. TRAIN context cells are
721/732/461/422; the fixed eval cells remain 86/85/53/49. All isolated metrics,
CMU default/rules, parity and stress-aware counts remain unchanged. The known
CMU rules legacy floor still fails; its correct count remains 4010/5000.

All 17 rebuilt data files are identical to the preceding batch. Only the POS
tagger and two regression files were integrated. Main source/data bytes match
the fully qualified candidate; the same full gate suite was not redundantly run
again after copying identical inputs. Fresh main Rollup, pack, safe extraction
and CJS/MJS main/core/English artifact regressions pass, including both increase
occurrences in the original quantified-PP sentence and issue #28 names.
Frozen and rebuilt full-sentence replays are identical: 68 changed outputs
across 16084 original sentences on both routes. Non-target predicates were
reviewed, and a preliminary regression of the first increase occurrence was
fixed before adoption. Five rule-module code lines remain 3395.

English common strict remains 5239/6990, 31 below the next ordinary commit
minimum of 5270. No baseline, version or release was changed.
Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-proper-subject-object-frames`.


## Greek voicing and lateral-u able composition (2026-10-17)

The shared Greek voicing rule covers bounded vocalic -ism derivatives and
u+s before Greek -ic/-eum. The -ck/-ch rimes stay outside the latter class.
The existing /zm/ onset repair now also handles a primary mark before the
cluster, preserving prismatic/charismatic after lexical eviction. Weak lateral
u contracts before -able; arguable and issuable keep their prior allomorphs.
Explicit caller-supplied dropped-e roots now retain priority even after a
vowel-final spelling fragment. No runtime dataset or word/name map was added.

Frozen-table and rebuilt gates pass: 5912 tests in 252 suites and types;
common strict 5239 -> 5242/6990 and top strict 2817 -> 2820/3617;
full strict/lenient 61788/83433 -> 61805/83435; stress headline/exact
54397/45201 -> 54411/45213. Parity stays 94771/100677; CMU default stays
4744/5000 and rules rises 4010 -> 4013/5000 (its legacy 90% floor still fails).
Homographs stay 1443/1615 and context cells 86/85/53/49, including every
reading/slice and supported-POS gate. TRAIN homograph failures, including
duplicates, and all context TRAIN controls remain preserved.

Rebuild removes 17 exception entries with no additions or edits. Dependency
repins rise from 500 to 513; all runtime differences were reviewed. The initial
candidate changed Allmusic's main stress after music eviction. Shared Greek
nominal-root recovery now preserves its existing compound route, without a
brand exception. Frozen prose has 159 changes, rebuilt prose 162 across
16084 original sentences x both routes; the only extra three changes are
noncontrastive initial secondary marks on charismatic. No existing primary
stress or reading control regresses. The five-module code count stays 3395.

Main source/data byte-match the qualified rebuilt candidate. Fresh main Rollup,
pack, safe extraction and CJS/MJS main/core/English regressions pass, including
new root-eviction/custom controls and issue #28 names. Full gates were run on
the identical candidate inputs; they were not redundantly rerun after copying.
The ordinary commit minimum remains 5270, leaving 28 more common strict wins.
No baseline or version changed and nothing was published.
Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-greek-voicing-lateral-able-batch`.
Pronunciation source checks: [Merriam-Webster charisma](https://www.merriam-webster.com/dictionary/charisma),
[prismatic](https://www.merriam-webster.com/dictionary/prismatic),
[music](https://www.merriam-webster.com/dictionary/music) and
[valuable](https://www.merriam-webster.com/dictionary/valuable).


## Silent-ette noun roots and indefinite object syntax (2026-10-17)

Bisyllabic silent -ette noun roots now retain their boundary in plurals and
transparent prefixes; weak ou before -lette takes the French /u/ reading.
Short remnants and longer roots that changed an unrelated name's main stress
were excluded before adoption. Existing indefinite object syntax also recognizes
other/certain/few, with no target-word pronunciation or name map.

All thirteen frozen and rebuilt checks pass: 5924 tests in 254 suites and types.
Full strict/lenient rises 61805/83435 -> 61809/83439. Common strict remains
5242/6990 and top strict 2820/3617; stress remains 54411/45213, parity
94771/100677, CMU default/rules 4744/4013, homographs 1443/1615 and the four
context cells 86/85/53/49. The known CMU rules legacy floor still fails.
TRAIN homographs improve 12860 -> 12863/14487, three repairs and no newly wrong
cases with duplicates preserved; TRAIN context is 722/732/461/422 and every
reading/slice/supported-POS control is preserved.

Frozen and rebuilt full-sentence replays are identical: seven changed outputs
across 16084 original sentences x both routes, all reviewed. Rebuild removes six
exceptions without additions or edits; repins fall 513 -> 512. Three default
word differences only omit optional secondary marks. Existing rouletted and
rouletting fallback errors remain open and are not counted as repaired.

A separately reviewable neutral merge of adjacent weak-i reductions produced
1296352 byte-identical predictions and passed all 5912 predecessor tests/types.
It reduces the five-module count 3395 -> 3393; the new OU condition brings this
batch to 3394 (G1148/S1705/P491/T24/parser26). The retained 3395 cap is unchanged.
Main source/data byte-match the qualified rebuilt candidate. Fresh main Rollup,
pack, safe extraction and CJS/MJS main/core/English checks pass, including issue
#28 names, new prefix/plural controls and indefinite object contexts. No repeated
full gate run was needed after copying identical source/data inputs.

The release gaps and ordinary 5270 commit minimum are unchanged; 28 more common
strict wins are still required. No baseline, version or release changed.
The separate Latin ea-hiatus experiment was rejected after rebuild: relative to
this batch's predecessor it lowered full exact IPA by one and made the previously
correct unrealistically lose a nucleus. Its 5244 candidate score is not adopted.
Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-owned-french-ette-batch`;
neutral proof: `/tmp/phonemize-next-release/after-5a0e6e3-neutral-weak-i-reduction`.
Sources: [Merriam-Webster roulette](https://www.merriam-webster.com/dictionary/roulette),
[cassette](https://www.merriam-webster.com/dictionary/cassette).


## Coronal stems, quette and ulative batch (2026-10-17)

The shared productive stem path now applies the AmE yod allomorph to
monosyllabic coronal free-u/CURE roots. Caller-supplied roots and targets retain
priority. Conservative RP spelling frames preserve the contrasting yod; dude
and duvet remain paired controls. The existing compound recovery can reuse a
witnessed plural head under a privative prefix, preserving nonnewspaper even
when its parent lexical entry is removed.

French final quette shares the existing silent-u velar handling, with banquet
and baguette controls. Latin ulative endings retain their root stress and weak
la linker; alternative, combative, cumulus, speculate and speculator remain
controls. These are spelling/morphology classes, with no runtime word maps or
new runtime reference tables. Authoritative readings were checked against
[Cambridge speculative](https://dictionary.cambridge.org/pronunciation/english/speculative),
[Collins cumulative](https://www.collinsdictionary.com/dictionary/english/cumulative),
and Cambridge newly, durable and dues. Existing mixed weak-vowel variants remain
unrepaired where the class does not resolve them; etiquette is not claimed fixed.

Frozen and rebuilt comparisons agree: full strict/lenient 61809/83439 ->
61834/83443; common strict 5242 -> 5247/6990; top strict 2820 -> 2823/3617.
Common lenient remains 6344 and top lenient 3340. Stress headline/exact improve
54411/45213 -> 54425/45223; parity remains 94771/100677; CMU default/rules are
4744/4016 (rules +3, existing legacy 90% floor still fails). Homograph eval
remains 1443 and TRAIN 12863, with no new failure occurrences. Context remains
86/85/53/49, TRAIN 722/732/461/422, with all previous correct rows and every
per-reading, class, balanced and fixed supported-POS gate preserved.

All 5940 tests in 258 suites and types pass. Rebuild removes 16 exceptions,
adds/edits none, and keeps 54477 exceptions with 500 dependency re-pins versus
512 before. Only cumulatively changes raw runtime parity, by dropping optional
secondary stress. Full original prose comparison covers 16084 sentences in
both modes; frozen and rebuilt produce the same 84 changed occurrences,
covering news/newspaper/newly/durable yod, briquettes and regulative. Alignment
and unaffected target readings are preserved. Main sources/data match the
qualified candidate byte for byte (56 files). Five-module count is 3395,
including g2p 1149; the existing cap remains unchanged.

Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-coronal-stems-quette-batch`.
A prematurely started reader suite was interrupted and archived as invalid;
acceptance uses only the complete fresh suite after the dictionary build exited
successfully. No baselines/version/commit/publication changes. Ordinary commit
minimum remains 5270, leaving 23 common strict wins.

Fresh main Rollup output was packed, safely extracted (81 entries), and checked
through CJS and MJS main/core/standalone English entry points. The new US/RP,
ulative and quette forms, inherited classes, sentence controls and issue #28
straight/curly apostrophe names pass in the extracted artifact.


## Root boundaries, weak nsw and equivalent compression (2026-10-17)

The doubled-r ow root frame retains initial root stress rather than treating
its first vowel as an assimilated prefix; aglow, arrive, array and arrange
are unchanged controls. Weak rhotic nsw loses its medial w, while the un- +
sw boundary is protected (unswerving, unswervingly, swerve and swear). Root
ownership preserves derived forms after parent eviction, with supplied roots
and targets retaining priority. Readings were checked against
[Collins arrow](https://www.collinsdictionary.com/us/dictionary/english/arrow),
[Cambridge answer](https://dictionary.cambridge.org/pronunciation/english/answer)
and [Collins unswerving](https://www.collinsdictionary.com/us/dictionary/english-pronunciations/unswerving).
The unguarded nsw prototype was rejected after it corrupted unswerving.

Three adjacent Greek silent-p rules share one capture rule with the same
position guard. Neutral before/after snapshots on the rebuilt root-boundary
candidate are byte-identical across 1296352 default/rule/derived/POS predictions;
5943 tests pass. This neutral pass reduces five-module code from 3395 to 3393.
The weak-nsw addition brings the adopted batch to 3394 (g2p 1149, syllabify
1703, postlex 492, morph-table 24, morph-parser 26). The cap remains 3395.

Frozen and rebuilt comparisons pass all gates: 5946 tests in 260 suites and
types; full strict/lenient 61834/83443 -> 61838/83446; common strict/lenient
5247/6344 -> 5249/6345; top strict/lenient 2823/3340 -> 2824/3340. Stress
headline/exact 54425/45223 -> 54427/45225. CMU default/rules are 4744/4017
(rules +1, existing legacy floor still fails). Homograph eval/TRAIN and all
context cells, prior correct occurrences, reading/class/balanced/supported-POS
slices are unchanged. Original prose compares 16084 sentences in both modes;
frozen and rebuilt have the same 17 changes, in arrow, answer and narrower.

Rebuild removes 7 exceptions, adds/edits none; 54470 remain, with 500 re-pins.
Raw runtime changes only unanswerable/unanswered: optional secondary stress
and its prefix vowel differ after eviction; parity rises 94771 -> 94773,
lenient remains 100677. This is reported separately from the isolated rule
wins, with no scorer/normalization change. Main sources/data match all 56
qualified candidate files. Evidence is under
`/tmp/phonemize-next-release/after-5a0e6e3-rrow-nsw-compressed-batch` and
`after-5a0e6e3-neutral-greek-on-rrow`. No baseline/version/commit/publication
changes; the ordinary 5270 commit minimum still needs 21 more correct words.

The fresh main artifact was packed and extracted (81 safe entries). CJS/MJS
main/core/standalone English checks pass, including the new root and weak-nsw
forms, US/RP contrasts, all inherited controls and issue #28 apostrophe names.


## Sium hiatus and medial ves scope (2026-10-17)

Intervocalic single-s before the genuine -ium hiatus voices; the open a before
-sium keeps FACE. Potassium's doubled consonant stays checked and voiceless,
with calcium/stadium and caller-supplied forms as controls. Productive root
ownership preserves gymnasiums and nonmagnesium after lexical eviction.
[Cambridge gymnasium](https://dictionary.cambridge.org/pronunciation/english/gymnasium)
and [Collins magnesium](https://www.collinsdictionary.com/us/dictionary/english-pronunciations/magnesium)
support the readings. Elysium still has a separate stress/vowel error and is
not claimed fully repaired.

The plural -ves suffix no longer consumes the vowel of medial ves. Vocalic
plural-root compounds retain the existing allomorph: eavesdrop and ArchivesThe
are explicit controls alongside loaves/selves/wolves. The terminal-only version
was rejected for damaging eavesdrop; a digraph-only guard was refined after
full prose revealed an inserted vowel in the original concatenated ArchivesThe.
Neither original sentence nor evaluator was changed. Cold vessel/vessels and
nonvessel plus supplied-root/target tests pass.

All frozen/rebuilt checks pass: 5952 tests in 262 suites and types. Full strict/
lenient 61838/83446 -> 61847/83449; common strict 5249 -> 5251, lenient 6345;
top remains 2824/3340. Stress headline/exact 54427/45225 -> 54434/45232.
Parity 94773/100677, CMU 4744/4017, homographs 1443 (TRAIN 12863), context
86/85/53/49 (TRAIN 722/732/461/422) remain unchanged, with all prior correct
occurrences and every context slice preserved. Legacy CMU rules floor remains
unmet. The final 16084-sentence/two-mode prose replay has the same 19 changes
before/after rebuild, in sium/vessel families and two original vessles typos;
the typo is not claimed to be a spelling correction.

Rebuild removes 10 exceptions, adds/edits none; 54460 remain with 500 re-pins.
All runtime parity strings are identical. Main sources/data match the qualified
candidate in all 56 files. Five-module count is 3395 (g2p 1149, syllabify 1703,
postlex 493, morph-table 24, morph-parser 26). Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-sium-final-ves-batch`.
No baseline/version/commit/publication changes. Ordinary commit minimum 5270
still needs 19 additional common strict words.

Fresh main Rollup output was packed and safely extracted (81 entries).
CJS/MJS main/core/standalone English checks pass, including sium, vessel,
eavesdrop/ArchivesThe controls, inherited classes and issue #28 names.


## Owned compounds and weak acy/imacy roots (2026-10-17)

Before guessing an -ed stem ending in an unlicensed stop-r coda, the shared
inflection path can reuse an already verified complete compound. The existing
prefix recovery filter admits these owned compound roots too; it no longer
loses the root after the parent lexical entry disappears. Cold inbred,
thoroughbred, plurals, nominalization, privative prefixes and supplied forms
are tested. The noun citation and compound stress convention is preserved;
no new adjective/verb contrastive pronunciation table is introduced.
[Merriam-Webster inbred](https://www.merriam-webster.com/dictionary/inbred)
records the noun citation separately from adjective/verb uses, and
[Merriam-Webster thoroughbred](https://www.merriam-webster.com/dictionary/thoroughbred)
supports initial compound stress. The existing centred reading is a preservation
control, not a claimed repair.

Weak c/d/n-acy and imacy keep the preceding root beat, and the thematic i
before macy reduces. Root ownership preserves plurals and prefixes after
parent eviction. [Cambridge advocacy](https://dictionary.cambridge.org/us/pronunciation/english/advocacy)
and [Cambridge intimacy](https://dictionary.cambridge.org/us/pronunciation/english/intimacy)
provide independent readings. Other weak-i variants in delicacy/intricacy/
obstinacy remain separate errors; only their corrected root stress is claimed.

All thirteen frozen/rebuilt checks pass: 5961 tests in 265 suites and types.
Full strict/lenient 61847/83449 -> 61851/83452; common strict 5251 -> 5252,
lenient 6345; top unchanged 2824/3340. Stress headline/exact 54434/45232 ->
54440/45235. Parity 94773/100677, CMU 4744/4017, homographs 1443 (TRAIN 12863)
and context 86/85/53/49 (TRAIN 722/732/461/422) are unchanged. Every prior
correct context occurrence, reading/class, balanced and fixed supported-POS
slice is preserved. The existing CMU rules 90% floor still fails.

Frozen/rebuilt prose has the same 13 changes across 16084 original sentences
in both modes: advocacy, intimacy/animacy, indeterminacy, delicacy and a
Thoroughbred occurrence. Non-target prose was reviewed; references, sentences
and scorers are unchanged. Rebuild removes only advocacy, intimacy and inbred,
adds/edits none, leaving 54457 exceptions. Main sources/data match all 56
qualified candidate files. Five-module code remains 3395. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-owned-compound-acy-imacy-batch`.
The earlier acy-only candidate was accumulated before this single combined
rebuild. No baseline/version/commit/publication changes; ordinary minimum 5270
still needs 18 more common strict words.

Fresh main Rollup output was packed, safely extracted (81 entries), and checked
through CJS/MJS main/core/standalone English. The new noun/compound forms,
inherited controls and issue #28 straight/curly apostrophe names pass.

## Primary coronal yod and phonetic plural allomorphs (2026-10-17)

Inherited polysyllabic stems drop initial primary-stressed coronal yod in US
inflections; RP keeps the independently supported dut-/tun- frames. Internal
weak yod and caller-owned stems are preserved. Plural es uses the final stem
phone and preserves complete ue stems. Independently vouched bare voiceless-s
roots outrank coincidental silent-e name entries; custom and vouched e-stems
retain priority. This corrects duties, hues, gases/buses and sentence values,
argues and plaques without a word map or runtime reference additions.

Neutral guards/nasal-rule compression first proved 1296352 identical
predictions, 5961 tests and types. The combined batch passes all frozen and
rebuilt checks: 5969 tests/267 suites, types; common5252/6345 ->5254/6346;
top2824/3340 ->2825/3341; full61851/83452 ->61871/83462; stress54440/45235
->54455/45250; CMU4744/4017 ->4745/4019. Parity94773/100677, homographs1443
and every context cell, reading, supported subset and prior correct train/eval
occurrence are preserved. CMU rules retains its existing 90% floor failure.

All 247 changed prose tokens across 16084 original sentences in both modes
were reviewed. Six rebuild-only changes include improved bowling/bowled and
name-rule outputs. Foreign names remain coverage gaps; rule-only does still
has its pre-existing incorrect nucleus. Rebuild removes duties/gases/jaques
and re-pins seven existing entries, leaving54461 exceptions; no source
reference edits. Five-module code3395; main matches56 candidate files.
Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-primary-yod-phonetic-es-batch`.
Ordinary commit threshold5270 still needs16; no baseline/version/commit/publish.

Fresh main Rollup output was packed, safely extracted (81 entries) and checked
through CJS/MJS main/core/English, including new plural/yod controls, inherited
controls and issue #28 names. Both format matrices pass.

## Shared nasal codas after y and silent ceipt p (2026-10-17)

The y vowel rule leaves the following nasal spelling to the shared coda
rules, preserving silent mn and velar ng. Complete ymn/ceipt rimes retain
their rules under inflections after eviction. The existing cei rule consumes
unpronounced p before t; ordinary captain/script/adept clusters remain.
Cambridge independently supports [hymn](https://dictionary.cambridge.org/us/pronunciation/english/hymn)
and [receipt](https://dictionary.cambridge.org/pronunciation/english/receipt).
Cold noun/verb/adjective sentences, stems, inflections and caller overrides
pass. Broader mn ownership was rejected because it fabricated a Bremn root
and broke Bremner. No whole-word mapping or expectation changes.

Frozen and rebuilt gates pass:5975 tests/269 suites and types; common5254
->5255, top2825->2826, lenient6346/3341 unchanged; full61871/83462->61874/83462;
stress54455/45250->54460/45255; CMU4745/4019->4745/4020. Parity94773/100677,
homographs1443 and every train/eval context occurrence, reading, balanced and
supported subset are preserved. CMU rules still misses its legacy90% floor.
Rebuild removes only hymn/hymnal/lyng/syngman/receipt, adds or edits none,
leaving54456 exceptions. Frozen/rebuilt prose has the same5 corrected hymn
occurrences, including8QHymn, across16084 original sentences in both modes.
Main matches56 candidate files; code3395. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-y-coda-ceipt-probe`.
Ordinary5270 threshold still needs15. No baseline/version/commit/publication.

Fresh main CJS/MJS main/core/English artifacts pass after Rollup, packing and
safe extraction81 entries. New cold nasal/ceipt forms, prior controls and
issue #28 apostrophe names pass.

## Infinitival objects and voiceless th boundaries (2026-10-17)

A bounded noun object followed by a to-infinitive now provides finite-verb
evidence when subject agreement is explicit. Bare plural subjects require
a clause start and existing nominal/adjectival morphology in a modifier;
that evidence is confined to this stronger infinitival-object frame.
Broader capitalized-modifier inference was rejected because it broke the
existing noun control “Stone offers produce boxes for delivery.” Both that
case and the added “...boxes to deliver later” remain nouns. TRAIN improves
12863->12865 with no new failed occurrences. New runtime lexicons or target
word/POS mappings are not used.

The existing voiceless-th boundary rule covers east compounds and inflections.
[Cambridge](https://dictionary.cambridge.org/pronunciation/english/southeast)
independently confirms θ; isolated directional primary stress remains open.
The alternate compound-head expansion was rejected: short name fragments
were accepted and secondary stress changed without fixing primary stress.

Frozen/rebuilt checks pass:5981 tests/271 suites and types; common5255->5256,
lenient6346 and top2826/3341 unchanged; full61874/83462->61877/83462; stress
54460/45255->54461/45255. Parity94773/100677, CMU4745/4020, homographs1443
and eval context86/85/53/49 are unchanged. TRAIN context724/732/463/422
improves from722/732/461/422; all prior correct rows/readings/slices/balanced
and supported cells are preserved. CMU rules retains its legacy90% failure.

All27 rebuilt prose changes were reviewed across16084 original sentences
in both modes. Six default verb readings improve; two rebuild-only
southeastern occurrences lose optional secondary stress, retaining primary
and phones. Other changes preserve the θ boundary. Rebuild removes only
southeastern and its possessive, adds/edits none, leaving54454 exceptions;
re-pins506. Main matches56 candidate source/data files; code3395. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-bare-subject-th-boundary-batch`.
Ordinary5270 threshold still needs14; no baseline/version/commit/publication.

Fresh main Rollup/pack/extraction81-entry CJS/MJS main/core/English matrices
pass, including new directional forms, prior controls and issue #28 names.

## Closed ab-rhotic roots and prefixed solv voicing (2026-10-17)

Closed rhotic stop roots retain the root beat after ab-. Prefix-s voicing
recognizes sor+b across the syllable boundary without changing ser/sert;
stressed prefixed solv voices s while free solvent and weak solute/solution
remain unchanged. Shared Latin silent-e recovery excludes bare solve,
avoiding a false dis+solve parse. Cold stems, inflections, derivations,
unseen forms, sentence noun/adjective/verb controls and caller roots pass.

The first rebuild exposed unscored bioabsorbable losing its root vowel/z.
That version was not retained: the main was restored while class ownership
was repaired. Existing decomposition and prefix recovery now retain owned
ab-roots after combining-o and re- heads. Generic borrowed-root expansion
was rejected for splitting interior and changing other prose. The narrowed
ab-root scope preserves all neighboring controls. Bioabsorbable and its
inflections now keep the root phones and primary after eviction; prefix
secondary marks retain the existing dictionary convention.

Two separately evidenced neutral compressions precede adoption: compound
guards and adjacent same-output shion suffixes, each1296352 identical
predictions,5981 tests/271 suites and types. Combined neutral code3393; final
code3395 (G1150/S1701/P494/T24/M26), with unchanged cap.

All frozen/rebuilt checks pass:5989 tests/273 suites and types. Full strict/
lenient61877/83462->61882/83464; stress54461/45255->54466/45260. Common
5256/6346, top2826/3341, parity94773/100677, CMU4745/4020, homographs1443
(TRAIN12865) and context86/85/53/49 (TRAIN724/732/463/422) are unchanged;
every prior correct reading/occurrence, balanced and supported slice survives.
The existing CMU rules90% floor still fails. These gains are not common-word
progress and do not qualify an ordinary commit.

The same5 prose changes occur before and after rebuild across16084 original
sentences in both modes: bioabsorbable, dissolve and absorb. Rebuild removes
8 entries, adds/edits none, leaving54446 exceptions; re-pins506. Main matches
all56 qualified source/data files. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-rhotic-ab-sorb-solv-batch`.
The ordinary5270 threshold still needs14; no baseline/version/commit/publish.

Fresh main Rollup/pack/safe-extraction81-entry CJS/MJS main/core/English
matrices pass, including bioabsorbable after eviction, solv voicing, inherited
controls and issue #28 names.


### Qualified base-form/eality/sury/context batch (2026-10-17)

Existing base/past homograph metadata now preserves the base vowel before -s;
strong -eality retains its two nuclei and primary on a, while weak -ealistic
remains separate. Unstressed ea+sury shares the existing sure suffix output,
preserving nursery, accessory, Esarey and strong sure. Cold roots, derivations,
inflections, caller-owned roots and full-sentence controls pass. Bounded negative
adjective/acronym and adjective-modified patient noun frames improve TRAIN by
three occurrences; object complements and inverted questions stay adjectives.
No runtime dataset or whole-word mapping was added.

Neutral stress-branch/onset compression has1296352 byte-identical predictions,
5989 tests/273 suites and types before behavior changes; final five-module code
is3390 (G1150/S1696/P494/T24/M26), cap3395 retained. An unused patch backup was
moved out of the isolated source tree; no imported source or prediction changed.

All frozen/rebuilt gates pass:6001 tests/277 suites and types. Common strict
5256->5259, lenient6346 unchanged; top2826->2827, lenient3341 unchanged.
Full61882/83464->61886/83464; stress54466/45260->54469/45261;
parity94773/100677->94774/100677; CMU4745/4020->4745/4021.
Homographs1443 eval/12868 TRAIN; context86/85/53/49 eval and727/732/463/422
TRAIN. Every previous correct occurrence/reading/slice and supported cohort is
preserved. The existing CMU rules90% floor remains failing.

Rebuild removes only seven repaired entries, adds/edits none, leaving54439.
Across16084 original sentences in both modes, all44 rebuilt changes are reviewed:
invalid readings, reads base vowel, Treasury fricative, and reality/realities
phones or removal of old citation secondary marks. Main matches56 source/data
files. Fresh Rollup,81-entry safe package extraction and CJS/MJS main/core/English
matrices pass, including mixed present/past read, repeated invalid readings,
caller ownership and issue28 names. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-base-form-eality-sury-pos-batch`.
Ordinary5270 threshold still needs11; release90% targets remain unmet. No baseline,
version, commit or publication changes.


### Qualified singleton-eat/labial-past batch (2026-10-17)

A coronal fricative+approximant onset licenses DRESS in singleton eat before a
vocalic continuation or plural boundary. Original spelling, before consonant
deduplication, preserves Sweatt/Threatt, and unrelated compound/name continuations
retain their previous reading. The labial+t past frame also shortens ea in dreamt
and leapt. Sweet/sweeter, treat, dream/dreamed and leap retain FLEECE; lexical
leaped keeps the pinned dictionary's accepted short variant. Native cold-root,
sentence noun/adjective/verb and caller-owner tests pass. A separate cold replay
also checks nonthreatening, unthreatened, threatless, sweatshop/proof/iness and
unseen gleapt. Broad ea+t shortening was rejected for surname regressions.

Frozen/rebuilt6004 tests/278 suites and types pass. Full61886/83464->61893/83464;
common5259/6346->5260/6346; top2827/3341->2828/3341;
stress54469/45261->54475/45267; parity94774/100677 unchanged;
CMU4745/4021->4745/4022. Homographs1443 eval/12868 TRAIN and context
86/85/53/49 eval,727/732/463/422 TRAIN are unchanged; every prior correct
occurrence/reading/supported slice survives. Existing CMU rules90% floor fails.

All6 prose changes are identical before/after rebuild over16084 original
sentences in both modes, only threat/threaten rule vowels. Rebuild removes10
entries, adds/edits none;54429 exceptions and506 re-pins. Main matches56 qualified
source/data files. Code3392 (G1150/S1698/P494/T24/M26), caps unchanged. Fresh
Rollup,81-entry safe package extraction and CJS/MJS main/core/English default/rules
matrices pass, retaining issue28 and all inherited controls. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-coronal-eat-labial-past-batch`.
Ordinary5270 threshold still needs10; release targets and baselines stay fixed.
No commit, version or publication change.


### Qualified of-subject/quoted-object context batch (2026-10-17)

A bounded determined of-phrase retains its singular subject head, including
agreement across plural inner modifiers. Opening quote tokens no longer hide
the object phrase. The existing finite bare-plural-object condition now admits
regular third-person -s as well as -es while retaining agreement and later
finite-predicate controls. Repeated noun/verb uses in one sentence and paired
noun controls pass. A subsequent broader unmarked-noun-object prototype was
rejected for two winds noun regressions; adding -ing subject modifiers alone
produced no TRAIN gain and was not adopted.

This is TRAIN-only progress: homographs12868->12869; context
727/732/463/422->728/732/464/422. Both original-prose changes are the same uses
occurrence in default/rules routes. Fixed eval, isolated common5260/6990,
all other accuracy metrics and every previously correct reading/occurrence/
supported slice are unchanged. No claim of eval or common-word gain is made.
All6007 tests/279 suites and types pass before/after rebuild; data tables are
byte-identical,54429 exceptions,506 re-pins, code3392. Main matches56 source/data
files. Fresh Rollup/81-entry safe pack extraction and CJS/MJS main/core/English
checks pass, including the original quoted object, repeated noun/verb uses,
issue28, caller roots and inherited controls. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-of-subject-quoted-object-batch`.
No baseline/version/commit/publication changes; ordinary threshold remains5270.


### Qualified open-prefix lect/assimilated ow batch (2026-10-17)

Open one-vowel prefixes retain the lect/flect/glect root primary. Closed col-
stays out: a broader candidate repaired verb collect but would regress its
already-correct noun in rules-only contexts. Elect/neglect and their cold
inflections, derivations, prefixes, an unseen form and caller roots pass.
The existing re- dispatch also recovers independently owned vowel-initial lect
roots without generalizing to unrelated borrowed roots. Reelect's bare hiatus
is repaired; the pre-existing missing prefix vowel in reelected/reelecting is
not claimed fixed.

A stressed ow after assimilated a+C keeps MOUTH at a word/ance boundary;
weak arrow/follow and internal arrowsmith environments retain GOAT. Ow roots
and their ance nouns retain ownership through plural restoration. Cold allowance,
allowances, disallowances, elective/elector/neglectful and API noun/adjective/verb
controls pass. No runtime dataset or word pronunciation map was introduced.

Before behavior changes, adjacent ind/ild and old/olt rules were merged using
captured consonants:1296352 byte-identical predictions,6004 tests/278 suites,
types and56 source/data hashes. Neutral code3390; final3393
(G1150/S1699/P494/T24/M26), caps unchanged.

Frozen/rebuilt6013 tests/281 suites and types pass. Full61893/83464->61898/83464;
common5260/6346->5262/6346; top2828/3341->2829/3341;
stress54475/45267->54480/45270; CMU4745/4023, parity94774/100677,
homographs1443 eval/12869 TRAIN and context86/85/53/49 eval,
728/732/464/422 TRAIN preserve all previous correct cases/readings/slices.
CMU rules90% remains an existing failure. Both stages have the same43 reviewed
prose changes over16084 sentences, only allow/elect/neglect/select rule readings.
Rebuild removes13 repaired entries, adds/edits none;54416 exceptions,506 re-pins.
The three runtime changes only add/remove citation secondary marks; no runtime
phone gain is claimed. Main matches56 qualified source/data files. Fresh Rollup,
81-entry safe pack extraction and CJS/MJS main/core/English matrices pass,
including collect noun/verb controls, derived allowances, issue28 and inherited
regressions. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-open-lect-ow-batch`.
Ordinary5270 threshold still needs8; release targets/baselines remain fixed.
No version, commit or publication changes.


### Qualified relative-noun/cardinal-object context batch (2026-10-17)

A determined nominal head is retained before a finite relative clause.
Demonstrative objects such as record that speech / that gifted presenter stay
verbs. A determined plural subject supplies finite evidence before a cardinal
object; bare s-final names stay outside this evidence, preserving past read
for James/Daggs. Standard although-conjunction and until-preposition categories
complete these frames without lexical target rules.

TRAIN homographs12869->12875; context728/732/464/422->730/732/464/422,
preserving every previous correct occurrence/reading/slice. Fixed eval and
isolated metrics are unchanged (common5262/6990, top2829/3617, H1443,
context86/85/53/49); no eval or common gain is claimed. All6015 tests/282 suites
and types pass frozen/rebuilt. The same7 default-route prose readings improve
in both stages across16084 original sentences: combine, entrance, subject,
read, record, sow and syndicate. Exception keys/values are identical (54416),
although serialized order changed; re-pins506. Main matches56 qualified source/
data files. Fresh Rollup,81-entry safe extraction and CJS/MJS main/core/English
matrices pass, including relative-vs-demonstrative controls, numerical text,
explicit past time, names, issue28 and all inherited checks. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-relative-noun-cardinal-batch`.
No baseline/version/commit/publication changes; ordinary threshold remains5270.

## Nasal-x PRICE hiatus batch (2026-10-17)

The nasal-x rule voices before PRICE hiatus while preserving anxious, lynx and
neighboring verb controls. Frozen and rebuilt comparisons improve common strict
to 5263/6990 and lenient to 6347/6990; full rule-path strict/lenient become
61899/83465, and stress-aware headline/exact become 54481/45271. Other tracked
counts and every contextual reading/control remain unchanged. Rebuilding removes
only anxiety/anxieties exceptions; dependency re-pins remain 506. All 6018 tests
and types pass. The existing CMU rules-only 90% floor still fails at 4023/5000.
Freshly packed 81-member artifacts pass CJS and ESM main/core/English default and
rules checks, including issue #28 and anxiety/anxious controls. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-nx-price-hiatus-batch/`.
The next ordinary improvement commit still requires 5270/6990 (7 more correct).

## Degree, deverbal and vowel batch (2026-10-17)

Shared stem recovery now covers monosyllabic doubled -est, vouched verb readings
before productive -able/-ance/-ment, posttonic i before d/n-ue, noninitial
stressed ne-mic, and English eau before weak t-y/i/eous. Retaining supplied
secondary stress when phones and primary stress agree preserves upgradeable.
A prepositional demonstrative phrase closes as a noun before a following
preposition; TRAIN gains one interchange noun occurrence without reading losses.
The independent source correction restores interchange V /n/ already present
in vouched Misaki and confirmed by Cambridge; the noun entry remains unchanged.
It is separate source evidence and contributes no claimed rule-score gain.

Frozen and rebuilt comparisons both reach common 5265/6347, top 2830/3341,
full 61911/83474, stress-aware 54495/45281, parity 94774/100677, and CMU
default/rules 4745/4025. Homograph EVAL remains 1443/1615; TRAIN is 12876/14487.
Context EVAL remains 86/85/53/49 and TRAIN 730/732/464/422, with every prior
correct occurrence, reading, class and supported subset preserved. All 6030
tests and types pass; the legacy CMU rules-only 90% floor remains unresolved.
Review retains the exportable weak-vowel strict loss alongside net full-dict
gains; beautiful/beautify and retinue still have unrelated weak-vowel/yod errors.

Rebuild removes 18 exceptions and adds discountable to preserve its dictionary
reading; 54397 exceptions and 507 dependency re-pins remain. All 67 prose changes
were reviewed, including four rebuild-only secondary-stress changes. Two neutral
compressions have identical 1296352-prediction snapshots; the prefix-s merge also
preserves 32 complete traces. Neutral count is 3386 and final count is 3391
(G1150/S1696/P495/T24/M26), below the unchanged cap. Fresh 81-member packages
pass CJS/ESM main/core/English default/rules, issue #28 and new class controls.
Evidence: `/tmp/phonemize-next-release/after-5a0e6e3-degree-deverbal-vowels-batch/`.
The next ordinary commit still needs 5270/6990 (5 additional correct words).

## Open-e, bound-sequent and liquid-ance batch (2026-10-17)

Stressed open e remains FLEECE before single s-ity, closed-prefix -sequent
retains prefix stress and weak e, and open a/i lengthens before a liquid
cluster plus weak -ance. Neighboring necessity/density/intensity,
sequence/frequent, fragment/balance and noun/adjective/verb sentence controls
remain intact, including caller roots and OOV forms. The changed lafrance
rule reading remains a pre-existing foreign-name failure, with no claimed gain.
Frozen/rebuilt results agree: common 5268/6348, top 2831/3341, full
61915/83476, stress-aware 54499/45284, parity 94774/100677 and CMU
4745/4026. Context/H counts and every prior reading/control are unchanged.
All 6035 tests and types pass; the legacy rules-only CMU floor still fails.
Rebuilding removes four exceptions (obesity, consequent, fragrance/fragrances),
adds none, and retains 507 dependency re-pins. All 22 prose changes agree
before/after rebuilding and occur only on the rule path. Five-module count:
3394 (G1150/S1699/P495/T24/M26). Freshly extracted 81-member CJS/ESM
packages pass inherited and new controls. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-open-e-sequent-liquid-batch/`.
The ordinary commit threshold remains 5270/6990 (2 more correct words).

## Qualified 5270-word checkpoint (2026-10-17)

Greek them+vowel retains theta while them/themselves/they retain their voiced
article/pronoun route. Stressed open e before a neutral cret/cretory tail
retains FLEECE. Cold tests cover secret/secretory after secret eviction,
inflections, caller roots, OOV forms, secretary/decrepit and full sentences.
The initial cret-only candidate was rejected when prose exposed a secretory
regression. The adopted class preserves its phones and primary stress; only
the secondary-stress onset moves during rebuilding.

Frozen and rebuilt results agree: common 5270/6348, top 2833/3341, full
61918/83477, stress-aware headline/exact 54501/45286, parity 94774/100677,
CMU default/rules 4745/4028. Stress-aware error buckets are 4990 stress-only,
15499 vowel-only and 24535 structural over 90310 scored words. Homograph
EVAL is 1443/1615 and TRAIN 12876/14487. Context EVAL is 86/85/53/49;
TRAIN is 730/732/464/422. Every prior reading, class, balanced score, fixed
supported subset and explicit control remains nondecreasing. All 6038 tests
in 287 suites and types pass. The existing CMU rules-only 90% floor remains
unmet. Source phone correction evidence is separate from rule gains; gold
references, populations, normalizers, adapters and scorer versions are unchanged.

Rebuild removes secret/secret's exceptions, adds none, and retains 54391
exceptions with 508 dependency re-pins. All 33 prose changes were reviewed;
the two rebuild-only changes move secretory's secondary-stress onset without
changing phones or primary stress. Five-module count remains 3394. Fresh
81-member packages pass CJS/ESM main/core/English default/rules checks, all
inherited controls and issue #28 apostrophe spellings and possessives. The
original GitHub comment was re-read through the API and confirms the Brien vs
O'Brien report. Evidence:
`/tmp/phonemize-next-release/after-5a0e6e3-greek-them-cretory-batch/`.

This accumulates 70 additional strict common words over the 5200-word committed
baseline, satisfying the ordinary +1-point checkpoint. The English-subset,
parity, stress-aware, homograph and context baselines are refreshed together;
the historical 86.998% full-dict target is unchanged. The next ordinary batch
requires 5340/6990. The release still requires 6292/6990, 3256/3617,
87/108 context and 1454/1615 homographs; this checkpoint is not release completion.
