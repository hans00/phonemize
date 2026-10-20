# Next-release accuracy plan

The release target remains strict accuracy **above 90%** on both fixed English
common-word populations. Passing the previous 70% checkpoint does not satisfy
this release target. References, filters, normalization and denominators stay
fixed; no runtime model, name lexicon or whole-word G2P/POS exceptions are added.

## Release requirements and latest validated working tree

| Metric | Release requirement | Current |
|---|---:|---:|
| English common rules strict | >=6292/6990 | 5339/6990 (76.38%) |
| Common top-5000 slice rules strict | >=3256/3617 | 2877/3617 (79.54%) |
| Public CMU default segments | >=4739/5000 | 4750/5000 (95.00%); rules 4137/5000 (legacy 90% floor still fails) |
| Context default/automatic strict | >=87/108 | 87/108 |
| Homograph eval | >=1454/1615 | 1454/1615 |
| Issue #28 apostrophe-name handling | Class regression and packaged verification | Passed |

Remaining strict gaps: 953 common words and 379 top-slice words. The context
and homograph thresholds are now met. These counts are release gaps, not a
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

## Accumulating quantified-subject context batch (2026-10-17)

Bounded pre-verbal adverbs preserve a subject licensed by both/many/several/
these/those; these quantifiers can establish plural agreement without a list
of irregular nouns. Such marks a quantified object. An unmarked plural object
is admitted only for an explicitly quantified, morphologically plural subject.
This preserves bare names, past-time cues, nominal compounds and noun/adjective
controls. All fixed isolated, public API and EVAL context/H counts remain
unchanged. TRAIN homographs improve to 12880/14487 (+4) and default/auto
context to 731/918 (+1); every prior case/reading/class remains nondecreasing.
All seven prose changes are identical before/after rebuilding and were reviewed.
The exception table is byte/entry unchanged (54391 entries, 508 re-pins).
All 6043 tests and types pass; fresh CJS/ESM 81-member packages pass inherited
and new grammar controls. The legacy CMU rules-only floor remains unresolved.

A newly proposed invalid+plan control exposed an identical pre-existing failure
in both engines; no IPA reference was changed. The unaffected adjective control
uses the already-supported invalid+ISBN frame. General negative-adjective noun
heads remain an open class, separately recorded in the evidence. This POS-only
gain stays uncommitted; the next ordinary rule checkpoint remains 5340/6990.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-quantified-subject-batch/`.

### Accumulating vocalic log/logue batch (2026-10-17)

The existing spelling family now prefers its documented unmerged THOUGHT
variant, with silent-gue/que root restoration and doubled-inflection recovery.
Caller-owned roots remain authoritative. No word map or name lexicon was added.
Frozen tables exposed two default losses (prologue and tagalog); these were
retained as failed diagnostic evidence. The actual gram-free rebuild re-pins
both automatically, and both new preservation controls pass.

Rebuilt common strict is 5275/6990 (75.46%), lenient 6348; top-5000 strict
2836/3617 (78.41%), lenient 3341. Full strict/lenient is 61924/83477,
stress-aware headline/exact 54509/45290, parity unchanged at 94774/100677,
CMU default/rules 4745/4031. Homographs and all four context EVAL/TRAIN cells,
reading/class/balanced counts and supported POS subset are nondecreasing.
All 6049 tests and types pass. The existing CMU rules-only 90% floor still
fails; this is not reported as passing. Exceptions fall from 54391 to 54379,
with 507 re-pins versus 508. Five-module code count is 3395 (retained cap).

Every changed rule prediction and 26 non-target prose occurrences was reviewed.
Default catalog/dialogue changes preserve phones and primary stress; Zilog
remains an unvouched brand coverage gap, not a claimed pronunciation repair.
Fresh 81-member CJS/ESM packages pass inherited issue #28/context controls
and new family/caller-root checks. The batch stays uncommitted below the
5340 ordinary checkpoint. Remaining >90% strict gaps are 1017/420 words.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-vocalic-log-batch/`.

### Accumulating Greek bound -phony dispatch (2026-10-17)

The existing bound-suffix exclusion now includes Greek -phony, so symphony
does not borrow the unrelated free adjective phony. Standard AHD entries
independently confirm the suffix and symphony's weak vowel. Free phony,
phonies, symphonic, noun contexts and caller behavior remain covered.

Full rule strict/lenient improves to 61925/83478 (+1/+1); common and both
CMU cells, parity, stress-aware scores and all context/H cells do not fall.
All 6053 tests and types pass; fresh 81-member CJS/ESM packages pass.
Rebuild removes symphony, symphonies and symphony's exception entries and
automatically pins telephony, leaving 54377 exceptions. Frozen parity losses
remain documented failed diagnostics; rebuilt parity is unchanged.

Telephony's fixed runtime reference uses a full GOAT vowel, while AHD gives
a different vowel/stress pattern. No reference was edited, and this batch
does not claim to repair its default reading or the open -phony stress class.
Only the full-dictionary gain is claimed; common remains 5275/6990.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-bound-phony-probe/`.

### Accumulating participial context and neutral suffix guards (2026-10-17)

Bare plural subjects before participially modified plural objects establish a
finite predicate; determined more/most phrases before nominal heads establish
an attributive participle. Paired noun, past-tense, prefix/OOV and adjective
controls pass. The broader object prototype was rejected for six TRAIN losses.
The combined batch adds two TRAIN homograph wins (12882/14487) without losses;
EVAL and all isolated tracked counts remain unchanged. No IPA gold was edited.
Oxford independently confirms scholarly learned's two-syllable adjective,
while its acquired/conditioned sense remains a separate reading limitation.

The same batch consolidates gion/the into the existing final-only/non-initial
suffix sets. Two before/after checks, including current -phony/rebuilt tables,
each preserve all 1296352 predictions byte for byte. Full tests (6057) and
types pass. Five-module code count falls 3395 to 3393; g2p remains 1150, and
the retained total cap stays 3395. This is neutral compression, not score gain.
Actual rebuild leaves all data bytes unchanged. Both prose changes are the
source-supported construct verb and scholarly learned adjective. Fresh
81-member CJS/ESM packages pass inherited and new paired controls. These
smaller gains remain uncommitted; the ordinary checkpoint remains 5340/6990.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-participial-context-batch/`
and `/tmp/phonemize-next-release/after-c2dd9aa-neutral-suffix-guards/`.

### Accumulating Greek ea noun hiatus and root recovery (2026-10-17)

Greek ea before dental-rhotic noun tails retains both vowel nuclei. Reuse the
existing hiatus renderer and borrowed-root recovery, including neutral suffixes
and verified agent compounds; ordinary silent-re stems retain their guards.
An initial candidate was rejected before adoption because simulated eviction
broke correct theatreless/theatreful/theatregoer and altered anti- prefix
vowels. Final cold and caller-root controls preserve those readings.

Rebuilt common strict rises to 5277/6990 (+2), top slice 2838/3617 (+2),
full strict/lenient 61929/83478 (+4/+0), stress headline/exact 54511/45292
(+2/+2), CMU default/rules 4745/4033 (+0/+2). All parity, H/context EVAL
and TRAIN cells, reading/class/balanced and supported-POS counts are
nondecreasing. All 6062 tests and types pass. No fixed reference changed.
Default raw output is unchanged; 17 prose changes repair rules-only missing
schwa, preserving primary stress and alignment. Amphitheater remains a partial
rule repair; adjective internal-hiatus stress is a separate open class.
Actual rebuild leaves 54373 exceptions and 507 re-pins. Five-module code count
is 3393. Fresh 81-member CJS/ESM packages pass native, inherited issue #28,
context, cold-root, OOV and caller-compound controls. Smaller gains stay
uncommitted: ordinary checkpoint 5340/6990 still needs 63 additional words.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-thea-hiatus-probe/`.

### Accumulating grammatical s and imperative objects (2026-10-17)

Existing auxiliary and possessive-determiner categories voice final s after
voiced phones. Determiner/demonstrative inventories are identical in the same
order; existing tokens were regrouped, with no new lexical entry or IPA map.
Lexical/demonstrative codas and voiceless its remain unchanged. Independent
Oxford/Cambridge/AHD readings support has, his, is and was. A closed modified
plural object also licenses a sentence-initial imperative.

Rebuilt common/top strict rises to 5279/2840 (+2/+2); lenient remains
6348/3341. Full strict/lenient is 61931/83478, stress headline/exact
54513/45294, CMU default/rules 4746/4037 (+1/+4). Parity, H/context EVAL
and every tracked reading/class/supported subset remain nondecreasing;
TRAIN gains the independently diagnosed Invite imperative. All 6072 tests
and types pass. Existing CMU rules-only 90% floor still fails.

All 10332 changed prose occurrences were checked for exact alignment and
phone deltas against the source-supported class: auxiliary/possessive final
s-to-z, plus one Invite primary-stress repair. This is exhaustive delta
verification and class-level dictionary evidence, not human token-POS
annotation. Changes are identical before/after actual rebuilding, and all
runtime data bytes remain unchanged (54373 exceptions, 507 re-pins). Was
is absent from the fixed full-dictionary reference, so its separate explicit
probe does not add a scored item or alter a denominator.

Fresh 81-member CJS/ESM packages pass inherited and new API controls. The
five-module count is 3395, at the retained cap. This batch remains uncommitted;
5340 ordinary strict checkpoint still needs 61 additional common words.
Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-auxiliary-imperative-batch/`.


## Accumulated grammatical dentals and silent-GH plurals (2026-10-17, uncommitted)

The existing function-word category selects KIT dental voicing, including a
one-nucleus compound continuation. The rule owns only the root's first dental:
nonce withith retains its final theta, and bothith, lexical withington and
content-word noun/adjective/verb controls are preserved. Dental-final function
roots also retain their word route in uppercase after eviction; WHO/US/IT and
explicit initialisms keep their existing spelling routes. No word inventory,
pronunciation map, reference, filter, scorer or builder change was introduced.
Oxford lists both voiced and unvoiced with; this selects the fixed reference's
voiced variant. Within/without still have incorrect rule-path primary stress.

Existing vowel-root plural recovery now includes silent -igh/-eigh. Highs,
sighs, weighs and sleighs retain the root vowel and take the real voiced coda;
custom high/Leigh roots, lexical thighs, coughs/laughs and rights/lights preserve
their own allomorphs. These four repaired forms are absent from the fixed full
dictionary, so they are diagnostics, not extra benchmark examples or gains.
Outweighs loses its erroneous /g/ but retains a pre-existing primary-stress error.

Both frozen-table and actual rebuilt comparisons against the preceding 5279
snapshot give common/top strict 5282/2843 (+3/+3), lenient 6348/3341 unchanged;
full rules 61934/83478, stress-aware headline/exact 54514/45295, parity
94774/100677, and CMU default/rules 4746/4037. The legacy CMU rules 90% floor
still fails. H eval/train remains 1443/12883, and context eval remains
86/85/53/49; train remains 733/732/464/422. Every per-reading/class, balanced,
POS-supported and explicit control gate is preserved. All 6085 tests/297 suites
and types pass. Both modes preserve segmentation across 16084 original
sentences; the 2260 changed tokens are reviewed root-dental or silent-GH changes.

The build retains 54373 exception values and 507 re-pins. Exception JSON order
and candidate diagnostics change, but the runtime key/value map is identical.
Neutral C9 first merged adjacent wr/rh onsets: all 1296352 predictions and 48
complete traces are identical, with tests/types passing. It reduces code from
3395 to 3394; the final batch is 3395 (G1150/S1696/P499/T24/M26), retaining the
3395 cap. A fresh 81-member package passes CJS/MJS main/core/English entry-point
matrices, including cold roots, custom ownership, issue #28 and PASS-tee.

A broader content-TH/build-audit experiment was rejected despite aggregate gains:
it broke somethin' after thin eviction, and later changed the explicit PASS-tee
pronunciation hint into spelled letters. Its punctuation/STRUT builder changes
were never adopted. The accepted batch preserves the original builder and all
fixed reference/scorer hashes. Full local evidence is in
/tmp/phonemize-next-release/after-c2dd9aa-grammatical-dental-gh-batch.

This accumulates 12 common strict wins over committed 5270, below the ordinary
5340 checkpoint (58 more required). Committed baselines and the historical full
lenient target remain unchanged; no release target is claimed complete.

## Personal-subject manner frame (2026-10-17)

The existing modal/adverb helper now also recognizes a personal subject followed
by manner adverbs and a bare silent-e predicate. Copular/have frames and their
inversions remain excluded; zero-change past forms retain their tense route.
TRAIN gains four cases (combine, live twice, refuse), 12883 to 12887/14487,
with no losses. All 16084 full sentences in both modes show only these four
expected default-route token changes; other prose and alignment are unchanged.

Frozen and rebuilt acceptance scores remain at the table above, including all
context cells/readings/controls. All 6088 tests and types pass; the existing
CMU rules 90% floor still fails at 4037/5000. Rebuilding yields byte-identical
data, 54373 exceptions and 507 dependency re-pins. No mapping, reference or
scorer was added or changed. A neutral homograph trace-guard consolidation
preserves 1296352 predictions and 252 complete traces, reducing the five-module
count to 3390 (g2p 1145), below the retained 3395 cap.

Evidence: /tmp/phonemize-next-release/after-c2dd9aa-pronominal-manner-probe.
The common strict gain remains 12 since the 5270 committed baseline; the next
ordinary commit still requires at least 5340/6990 and every adoption gate.

The fresh 81-member tarball passes extracted CJS/MJS main/core/English tests,
including the new manner frame, copular/past controls and issue #28 brands.

## Plural-subject infinitive frame (2026-10-17)

Existing finite-object analysis now also accepts a silent-e bare predicate
with a plural subject and an immediate to-infinitive. No word inventory or
pronunciation mapping is added. TRAIN improves 12887 to 12891/14487 with
four refuse verb wins and zero losses; all context train cases are preserved.
Across 16084 sentences in both modes, only those four targets and the verb
coordinate in "the fascists coordinate to sow" change. No alignment or rules
mode token changes occur. The non-target correction is not a cohort gain.

Frozen and rebuilt acceptance scores remain unchanged from the current table.
All 6090 tests and types pass. The legacy CMU rules floor still fails at
4037/5000; default is 4746/5000. Rebuilt data are byte-identical, with 54373
exceptions and 507 re-pins. Five-module code remains 3390. Baselines and the
ordinary 5340/6990 commit minimum remain unchanged.

Evidence: /tmp/phonemize-next-release/after-c2dd9aa-plural-infinitive-probe.

Fresh 81-member package extraction passes CJS/MJS main/core/English tests,
including plural-infinitive, manner, tense, adjective and issue #28 controls.

## Clipped -ing and bounded initial theta (2026-10-17)

Written -in' now restores an attested unstressed -ing base, fronts its nasal
and continues through the shared phonotactic, STRUT and dialect pipeline.
Possessives, stressed single-syllable roots, custom pronunciations and issue
#28 lexical apostrophes retain their separate routes. The phonological process
and its unstressed constraint are documented by
[Yuan and Liberman](https://languagelog.ldc.upenn.edu/myl/ldc/g-dropping-submitted.pdf).

Initial single-coda th content rimes extend theta within the a/i/u spelling
class, reusing existing grammatical categories. Mid-e/o rimes remain ambiguous:
TRAIN prose exposed the historical pronoun Thon, whose voiced route is now an
explicit full-sentence control. [Collins](https://www.collinsdictionary.com/dictionary/english/thon)
and the [historical Webster entry reproduced by Merriam-Webster](https://www.merriam-webster.com/wordplay/third-person-gender-neutral-pronoun-thon)
support retaining grammatical voicing. No runtime word inventory was added.
Dental-vowel roots retain word readings in capitals after eviction; THC and
WHO keep their spelling controls.

Frozen and rebuilt common strict increases 5282 to 5283/6990; top slice
2843 to 2844/3617. Full strict/lenient increases 61934/83478 to 61971/83487;
stress headline/exact increases 54514/45295 to 54535/45309. Parity remains
94774/100677; CMU default remains 4746, rules increases 4037 to 4038/5000
and still misses the legacy 90% rules floor. Homograph and all context cells,
readings, supported subsets and explicit controls remain nondecreasing.
All 6105 tests and types pass. Five-module count is 3394 (g2p 1148).

The unchanged builder retires 18 theta-family entries: 54373 to 54355, no
new mappings, and 507 dependency re-pins. Full-dictionary owned replays have
zero strict/lenient losses. The 16084-sentence two-mode comparison has 15
frozen changes and two additional rebuilt changes in the unlabelled duplicated
spelling thinthin: only secondary stress changes, with phones and primary
stress retained. This is not counted as a pronunciation gain. Foreign
Thuam/thap and inherited hanging/swinging base issues remain coverage limits.
Thon, read tense, somethin', uppercase lexical forms and PASS-tee controls pass.

Evidence: /tmp/phonemize-next-release/after-c2dd9aa-clipped-ing-theta-probe.
The accumulated common strict gain is 13 from committed 5270; the ordinary
5340/6990 commit minimum and all release targets remain unchanged.

The freshly extracted 81-member package passes CJS/MJS main/core/English
checks, including clipped roots, full-capital dental words, Thon, tense,
THC/WHO, custom ownership and the earlier issue #28/brand controls.

## Quantified noun modifiers (2026-10-17)

The existing plural-quantifier frame now preserves bounded noun/adjective
modifiers before the subject head. Final-d predicates retain the conservative
tense boundary. TRAIN improves 12891 to 12896/14487, five verb wins and no
losses; context TRAIN cells improve 733/732/464/422 to 735/732/465/422.
All case, reading and supported-subset counts are nondecreasing.
The 16084-sentence two-mode comparison has exactly five default target changes
and one additional rules use-voicing correction, with no other token changes.

Frozen and rebuilt acceptance scores remain at the current table. All 6108
tests and types pass; rebuilt data are byte-identical, 54355 exceptions and
507 re-pins. Five-module code remains 3394. The broader bare-modifier probe
was rejected on TRAIN: Aust wins invite was misread, despite three wins.
It never reached eval acceptance or the main tree. No lexical/POS inventory,
reference, scorer or baseline was changed. The ordinary 5340 common strict
commit minimum still applies.

Evidence: /tmp/phonemize-next-release/after-c2dd9aa-quantified-noun-modifier-probe.

The fresh 81-member package passes extracted CJS/MJS main/core/English
verification, including quantified modifiers, nominal uses, adjective live,
read tense, dental capitals, clipping and earlier apostrophe/brand controls.

## Open i before a weak stop-initial foot (2026-10-17)

A shared spelling frame retains PRICE in a stressed open i before a stop and
a single-vowel foot ending in m/n/l, optionally plural s. It excludes soft c/g,
Greek hiatus and short high-vowel tails. [Oxford item](https://www.oxfordlearnersdictionaries.com/us/definition/english/item),
[Oxford idol](https://www.oxfordlearnersdictionaries.com/us/definition/english/idol),
and [Merriam-Webster](https://www.merriam-webster.com/dictionary/item) independently
support the repaired vowels. Tests preserve ibid/idiom/idiot/image/igloo,
custom roots, IBM spelling, noun/adjective/verb sentences and read tense.
The same frame preserves capital word routes and licensed roots through
existing -ize, agent and non- prefix handlers after lexical eviction.
Reitemize/unitemized retain their pre-existing prefix-boundary gaps.

Frozen and rebuilt common strict improves 5283 to 5285/6990; lenient 6348
to 6349. Top slice improves 2844/3341 to 2845/3342. Full strict/lenient
improves 61971/83487 to 61975/83489; stress headline/exact 54535/45309 to
54539/45312. Residual stress-only/vowel-only/structural buckets change
4994/15501/24506 to 4995/15503/24500: repaired structural cases leave
smaller vowel/secondary-stress discrepancies. CMU default stays 4746, rules
improves 4038 to 4039/5000 and still misses its legacy 90% floor. Parity,
homograph, all context cells/readings/supported subsets and controls do not fall.

All 6119 tests and types pass. Rebuilding retires 11 entries, 54355 to 54344,
with no additions, value changes or builder changes and 507 re-pins. Known
word strict/lenient replays have zero losses; itel loses only secondary
stress, retaining all phones and primary stress. Foreign names are not
individually verified gains; icon/ikon retain a weak second vowel on rules.
The 16084-sentence two-mode comparison changes only 11 rules tokens in
item/idol/icon, with unchanged positions and primary stress.

A separate neutral guard consolidation preserves 1296352 predictions and
420 complete traces, reducing code from 3394 to 3392 before this class.
The resulting five-module count is 3395 (g2p 1147), within the retained cap.
Evidence: /tmp/phonemize-next-release/after-c2dd9aa-open-i-stop-foot-probe and
/tmp/phonemize-next-release/after-c2dd9aa-neutral-decomposition-guard.
The accumulated common strict gain is 15 from committed 5270; another 55
are needed for the unchanged ordinary 5340/6990 commit minimum.

### 2026-10-17 單字母縮約與字母所有格

沿用 INITIALISMS 既有單字母資料，在帶有非空 clitic 的單字母詞幹上保留字母母音；不擴大裸字母或一般詞根的拼讀路徑。自訂詞幹與整字讀音仍優先，字母經既有 phonotactics、方言及句中單音節重音處理，A’s 不套用冠詞弱化。讀音依 Cambridge [I’m](https://dictionary.cambridge.org/us/dictionary/english/i-m)、[I’ve](https://dictionary.cambridge.org/dictionary/english/i-ve) 與 Oxford [A](https://www.oxfordlearnersdictionaries.com/definition/english/a_2) 複數核對。

固定表與重建後：全字典 strict 61975→61981、lenient 83489→83490／105067；常用字 5285／6349／6990、top-5000 2845／3342／3617 維持，這批不計為常用字進步。parity 94774／100677／100806、stress 54539／45312／90310、CMU default／rules 4746／4039／5000、homograph eval／train 1443／12896、context eval 86／85／53／49 與 train 735／732／465／422 全部維持；CMU rules 既有 90% 門檻仍未通過。

全字表實際路徑回放 default 無變化，rules 29 個已收錄詞與 4 個大小寫探針改變，沒有已正確詞的損失。W’s 保留 runtime STRUT 正規化；I’ll 保留既有 clitic 的 clear-l 表記，未改 scorer 或 gold。16084 句 × default／rules 僅 14 處 rules 變化，均為 I 縮約或 M/Z 字母所有格；其他詞與重音對照完整保留。原 builder 重建後 exceptions 54344→54317，僅移除 27 個已由規則正確處理的縮約／字母詞，無新增或讀音值變更；依賴 re-pin 仍 507。

先行中性壓縮：1296352 筆 snapshot 逐位元相同、644 個完整 trace 相同、6119 tests／types 通過，五模組 3395→3389；縮約修正後 3394（G1149／S1698／P497／M24／parser26），維持上限 3395。完整 6147 tests／304 suites 及 types 通過。基準、來源、cohort、scorer、builder 均未變；未達下一次一般提交的 5340／6990，繼續累積。

此批新打包的 81 個成員已安全解壓，CJS／ESM main、core、English 入口在 default／rules 路徑全部通過，包含單字母縮約、自訂讀音、方言、句中冠詞／字母與既有 issue #28 控制。

### 2026-10-17 受保護雙音節詞根與有限動詞的名詞修飾語

整字 dictionary 命中不應遮住 rules 路徑中的完整詞根，但全面略過整字會使 common strict -13、lenient -11，已拒絕。採用條件僅允許既有前綴加受規則保護的雙音節詞根；較長 bound fragments 保留原路徑，避免 comeuppance／communique／computalog 的假拆分。既有 root frame 補入開音節 i + r + 弱閉音節，讓 virus／viral／siren／spiral 的既有讀音能在構詞後保留。antivirus 的 anti /aɪ/ 變體由 [Collins](https://www.collinsdictionary.com/us/dictionary/english/antivirus) 獨立核對；[Cambridge anti-missile](https://dictionary.cambridge.org/dictionary/english/anti-missile?q=antimissile) 亦列出兩種前綴母音。

有限動詞句型允許有冠詞的單數主詞 + 三單述語 + e 結尾的名詞修飾語與名詞 head，排除 function words；原本已有的 “The department records are missing” 完整保留。TRAIN 的 uses silicone rubber strings 修正一個 voicing 對比；不加入詞目或品牌表。廣泛協調 has + named object 候選雖多對一筆 train，會誤判省略關係代名詞的 uses Alice described，已拒絕，不進 runtime。

固定表與重建後：full strict 61981→61982、lenient 83490→83492／105067；common strict 維持 5285，lenient 6349→6350／6990；top 維持 2845／3342／3617。stress headline／exact 54539／45312→54540／45313／90310；parity 94774／100677／100806、CMU 4746／4039／5000 維持（rules 既有 90% floor 未達）。homograph eval 維持 1443／1615，train 12896→12897／14487；context eval 維持 86／85／53／49，train 735／732／465／422→736／732／466／422。所有 reading、class、balanced、固定 supported subset 與明確 controls 不退步。

全字表 actual dispatch：default 僅 antisiren／nonviral 兩個無 gold 探針，rules 另有 antimissile（strict win）與 antivirus（lenient win），無已正確詞損失。16084 句 × 兩路徑僅三處改變：兩路徑的 uses，以及 rules 的 produces laminate flooring 恢復動詞重音；其餘詞完全保留。builder 未改，exceptions 54317→54315 僅移除 spiral／spiralling，re-pin 507→506，沒有新增或值變更。6167 tests／306 suites、types 與全部 gates 通過。

先行移除舊 morphology 所有格分支：public predict 已統一處理 clitic；1296352 snapshot 逐位元相同、784 complete traces 相同、6147 tests／types 通過。五模組 3394→3390；構詞修正後 3392（G1147／S1698／P497／M24／parser26），cap 3395 保留。常用字 strict 尚未增加，未達 5340 的下一次一般提交門檻，繼續累積。

此批新打包的 81 個成員經安全解壓後，CJS／ESM main、core、English 在 default／rules 路徑全部通過，涵蓋詞根、動詞／名詞配對、縮約及既有 issue #28 控制。

### 2026-10-17 有依據的詞頭 + wh 功能詞

沿用既有 indefinite 合成詞處理，允許 caller-owned／既有 compound head 接上 wh 功能詞；任意 wh 字串不進入此路徑。meanwhile 保留 while 的 PRICE。由 [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/meanwhile_1) 獨立核對，來源亦說明 mean（名詞）+ while；沒有新增讀音 mapping。

固定表與重建後：common strict 5285→5286／6990，lenient 維持 6350；top 維持 2845／3342／3617；full strict 61982→61983／105067，lenient 維持 83492；stress headline／exact 54540／45313→54541／45314／90310。parity 94774／100677／100806、CMU default／rules 4746／4039／5000、homograph eval／train 1443／12897、context eval 86／85／53／49 與 train 736／732／466／422 全部維持；rules CMU 90% floor 仍未通過。

完整字表 actual dispatch：rules 只有 meanwhile 一個已收錄詞的 strict win，default 沒有已收錄詞變化；兩路徑另有 somewhy 這個 OOV 探針，不加入評分人口或主張為字典增益。16084 原句 × 兩路徑僅 11 處 rules 的 meanwhile／Meanwhile 改變，主重音及其餘所有詞相同。原 builder 重建只移除 meanwhile 一筆，exceptions 54315→54314，re-pin 維持 506；沒有新增或值變更。6177 tests／307 suites、types 與全部固定 gates 通過。

somewhat 既有 default／rules 的主重音差異獨立保留為來源問題，本批不改來源或 scorer、不把它算成改進；新回歸只採用有獨立證據的預期，沒有為通過測試而固定錯誤讀音。五模組 3395（G1150／S1698／P497／M24／parser26），保留 cap 3395。新打包的 81 成員安全解壓後，CJS／ESM main、core、English 在 default／rules 全部通過，包含 cold-root 複數、自訂詞頭／詞尾、完整句及 issue #28 舊控制。

目前 strict 比 c2dd9aa 已多 16 筆，距一般提交所需 5340 尚差 54 筆；本批繼續累積，不重設 baseline。


### 2026-10-18 有依據的 -or 詞幹與相依詞

沿用既有 agent 合成路徑，恢復有依據的多音節 silent-e 動詞根；封閉首音節限制避免姓氏誤切，弱母音／palatal stem 保留整詞路徑。IPA 重音符號先移除再判斷弱 KIT 環境，不把 MEDIATOR 誤認為縮寫。共用已有 privative／compound composition，要求 -or 前還有母音音節，排除 cor／sor 短片段。沒有新增讀音 mapping、name lexicon 或 runtime dataset。

由 [Oxford survivor](https://www.oxfordlearnersdictionaries.com/definition/english/survivor)、[senator](https://www.oxfordlearnersdictionaries.com/us/definition/english/senator)、[locator](https://www.oxfordlearnersdictionaries.com/us/definition/english/locator) 與 MW narrator／vibrator 核對。radiator 的舊 short-a 是字典也接受的方言變體，本批改成固定參考的 long-a，不主張舊變體普遍錯誤。gladiator／mediator 只增加既有次重音，不算音段改善；mentorship 只修復主重音，strong-or 母音仍是既有缺口。

凍結表與重建後 common strict 5286→5290／6990，lenient 6350→6352；top strict／lenient 2845／3342→2846／3343／3617。full strict／lenient 61983／83492→61991／83496／105067；stress headline／exact 54541／45314→54547／45320／90310。parity 維持 94774／100677／100806；CMU default／rules 4746／4039→4746／4040／5000；rules 90% floor 仍未通過。homograph eval／train 維持 1443／12897，context eval 86／85／53／49、train 736／732／466／422，以及所有 reading／class／balanced／supported88／explicit controls 均無退步。

完整字表 actual dispatch：rules 14 筆變化（含 3 個不加入評分人口的 OOV 探針）；default 固定表 5 筆、重建後 6 筆，重建額外的 locator 只省略非對比次重音，音段及主重音相同。16084 原句 × 兩路徑只有 14 處有依據的詞根／主重音變化，其餘詞及重複位置保留。較寬的短根候選雖總分增加，重建卻破壞 Cormac／sorbus，已完整保存並拒用；修正後 exceptions 只移除 locator／vibrator，54314→54312，沒有新增／值變更，re-pin 維持 506。

6203 tests／308 suites、types、固定與重建 gates 通過。兩個中性 guard 合併以 1296352 筆預測、784 完整 traces 與 80164 撇號衍生 adversarial traces 完全相同驗證，五模組中性 3395→3387；加入本批後 3395（G1150／S1698／P497／M24／parser26），cap 3395 保留。strict 比 c2dd9aa 累積多 20 筆，距一般提交門檻 5340 尚差 50 筆；維持累積，不重設 baseline。

本批新打包 81 個成員經安全解壓後，CJS／ESM main、core、English 在 default／rules 全部通過，涵蓋 cold-root 大小寫、複數／衍生詞、自訂 ownership、弱母音與 Cormac／sorbus 反例，以及 issue #28 控制。


### 2026-10-18 被動 placement 的封閉名詞補語

在既有 to 分支辨識 BE +（既有 adverb 判斷）+ put to + 封閉補語，並保留後面仍帶受詞的不定詞。規則不包含 use 或其他目標 lemma。由 [Oxford use noun](https://www.oxfordlearnersdictionaries.com/definition/english/use_2) 獨立確認名詞 /juːs/ 與 put something to use 的搭配。

TRAIN homograph 12897→12898／14487，context TRAIN default／auto 736→737／918，其餘三格維持 732／466／422。EVAL homograph 1443／1615、context 86／85／53／49，以及各 reading／class／balanced／supported88／controls 均維持；隔離 common／top、full、parity、stress、CMU 亦全部維持。只有原句 “Because of segregation, his skills were never put to use.” 的名詞 use /z/→/s/；16084 原句 × 兩路徑其餘 token、位置與重複出現全部相同。沒有用 EVAL 反覆調整。

6219 tests／309 suites、types、固定及實際重建後 gates 通過；18 個生成資料檔完全相同，exceptions 54312、re-pin 506，五模組仍 3395。新增測試曾揭露 rules 路徑既有 singular record／部分 finite-object frame 的限制，已獨立記錄；本批不改其預期或聲稱解決，配對控制採用既有可支援的 records 名／動詞對照。POS 改善持續累積，常用字 strict 仍為 5290，未達 5340 一般提交門檻。

此批新打包 81 成員安全解壓後，CJS／ESM main、core、English 在 default／rules 全部通過，包含被動名詞補語、不定詞與既有 issue #28／詞根 ownership 控制。


### 2026-10-18 弱 pro- 動詞詞幹的 onset r

沿用 verbStem 查找，當拼字為 pro + 子音、繼承的讀音卻是主重音前 /pɝ/，恢復為 /pɹə/。caller stem／whole-token override 維持優先，強 pro、其他 r-colored 根不變，沒有目標整詞分支或 mapping。[Merriam-Webster proceed](https://www.merriam-webster.com/dictionary/proceed) 列出 GOAT 與弱 schwa 變體；本批保留固定參考採用的弱變體，修復 r 的位置，不把合法 GOAT 變體判錯。[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/proceed) 也列出詞形及相同的弱變體。

固定表與實際重建後：common strict／lenient 5290／6352→5291／6353／6990，top 維持 2846／3343／3617；full 61991／83496→61993／83498／105067；stress headline／exact 54547／45320→54549／45322／90310。parity 94774／100677／100806、CMU 4746／4040／5000、homograph eval／train 1443／12898、context eval 86／85／53／49 與 train 737／732／466／422，以及所有細分 gates／controls 都維持；rules CMU 的 90% floor 仍未通過。

完整字表 actual dispatch 只改變 rules 的 proceeded／proceeding，default 沒有變化；16084 原句 × 兩路徑只有 10 個相同詞形的 occurrences 修復 /pɹə/，名詞 proceeding 與過去式 proceeded 均保留主重音及上下文。原 builder 只移除這兩筆例外，54312→54310，沒有新增或值變更，re-pin 維持 506。裸 stem 的來源記號及其他 lookup ladders 留在獨立診斷，沒有聲稱一併修復，也沒有更改 reference／scorer。

6227 tests／310 suites、types、固定與重建 gates 全過。先合併既有 silent-e agent-prefix 的 guarded lookup，以 1296352 筆預測 byte-identical、896 完整 traces、80164 撇號衍生 traces、6203 tests／types 確認中性：3395→3393；加入詞幹修正後 3394（G1149／S1698／P497／M24／parser26），cap 3395 保留。strict 比 c2dd9aa 累積多 21 筆，距 5340 的一般提交門檻尚差 49 筆，繼續累積。

此批新打包 81 成員安全解壓後，CJS／ESM main、core、English 在 default／rules 全部通過，包含 cold inflections／plural、OOV 類別與 caller overrides、非 pro rhotic 控制及既有 issue #28／POS 控制。


### 2026-10-18 同主重音的弱 -ment 名詞複數

複數沿用既有 stem lookup，在 stem 的兩個既有讀音都為首音節主重音、名詞結尾 /mənt/、動詞結尾 /mɛnt/ 時保留其詞性讀音。由 [Oxford document noun](https://www.oxfordlearnersdictionaries.com/definition/english/document_1)／[verb](https://www.oxfordlearnersdictionaries.com/definition/english/document_2)，以及 MW implement、ornament、compliment、supplement 獨立核對所有符合條件的 stem。沒有加入整個複數 token 的 homograph lookup、讀音 mapping 或 dataset。

明確 N／未標記孤立形式採用名詞根，明確 V 採用動詞根；!V、ADJ 不改成 N。較寬的候選在 TRAIN 句中破壞 “a … report documents …” 的正確動詞，已保存並拒用。收斂後保留該原句的既有 rules 正確路徑；default 及人工刪除裸 stem 後的含糊 !V 仍是舊限制，不主張解決。segment／torment 舊 POS 關聯顛倒另存來源稽核，本批排除其重音對立，不改 reference 或將 !V 偷換成 noun annotation。

共享 privative stem recovery 也保留移除複數例外後的依存詞，nondocuments cold-root 回歸通過；[Oxford disfigurement](https://www.oxfordlearnersdictionaries.com/definition/english/disfigurement) 確認原句 disfigurements 的弱 -ment 修復。固定表與重建後 common strict 5291→5292／6990，lenient 維持 6353；top strict 2846→2847／3617，lenient 維持 3343。full 61993／83498→61994／83498／105067；stress headline／exact 54549／45322→54550／45323／90310；CMU default／rules 4746／4040→4746／4041／5000。parity 94774／100677／100806、H eval／train 1443／12898、context eval 86／85／53／49、train 737／732／466／422，以及每個 reading／class／balanced／supported88／control 均維持；rules CMU 90% floor 仍未通過。

全字表 actual dispatch：rules 只改 documents；重建後 default 只替 disappointments 增加非對比次重音。16084 原句 × 兩路徑只有 12 個名詞 documents／disfigurements occurrences 修復弱母音，原本正確的 report 動詞及其他所有 token／位置不變。builder 只移除 documents／disagreements／disappointments，exceptions 54310→54307，沒有新增／值變更，re-pin 維持 506。6246 tests／311 suites、types、固定與重建後全部 gates 通過；五模組 3395（G1150／S1698／P497／M24／parser26），cap 3395 保留。

暫存配額曾中斷 Jest 寫 transform cache；來源／資料 hash 未變，其餘 12 gates 完成。只清理可重建且 source map 位於本次 scratch 的 cache，保留中斷紀錄，重跑 6246 tests 通過。此 infrastructure failure 沒有當成規則退步或通過。strict 比 c2dd9aa 累積多 22 筆，距 5340 一般提交門檻尚差 48 筆，繼續累積。

此批新打包 81 成員經安全解壓，CJS／ESM main、core、English 在 default／rules 全部通過，涵蓋五類 stem 的冷啟動名／動詞複數、privative 相依、caller overrides、separate stress-shift 控制、原句 !V 動詞與既有 issue #28 回歸。


### 2026-10-18 帶 degree 修飾語的名詞片語

在有 determiner 的 adjective degree phrase 後辨識封閉名詞 head，保留 -ly／well 等動詞前副詞與後續 noun head 的不同結構。規則沒有 read 或任何目標 lemma；由 [Oxford noun read](https://www.oxfordlearnersdictionaries.com/definition/english/read_2) 獨立核對 /riːd/ 及 adjective + read 用法。

TRAIN homograph 12898→12899／14487，context TRAIN default／auto 737→738／918，其餘維持 732／466／422；所有逐 reading／class／balanced／supported88／controls 無退步。固定 EVAL H 1443／1615、context 86／85／53／49，common／top、full、stress、parity、CMU 全部維持。16084 原句 × 兩路徑只有 “a … really fast read” 的 default 名詞 /rɛd/→/rid/，其他 token、位置及重複出現不變。

Rules 的這組 nominal -ead 仍是既有缺口，沒有加入 whole-target homograph lookup，也沒有變更 gold 來讓它通過。新增測試獨立驗證 noun grammar，並在 default API 保護正確 /rid/；四格 rules／default acceptance 照常量測，既有 rules failure 不隱藏。6264 tests／312 suites、types、固定及重建 gates 全過；18 個生成資料檔完全相同，exceptions 54307、re-pin 506、五模組 3395 維持。常用字 strict 仍 5292，距一般提交門檻仍差 48 字，持續累積。

此批新打包 81 成員安全解壓後，CJS／ESM main、core、English 在 default／rules 全部通過；default 名詞 read、過去分詞對照，以及既有 rules／default 的 ownership、POS 與 issue #28 控制全部保留。


### 2026-10-18 不定限定詞與明確複數詞頭

沿用既有 quantified subject 的 bounded noun-modifier scan，some／any 只有在詞頭明確為複數時才授予 plural agreement。由 [Oxford some](https://www.oxfordlearnersdictionaries.com/definition/english/some_1)／[any](https://www.oxfordlearnersdictionaries.com/definition/english/any_1) 核對其數量用法；單數／mass 及 noun-compound「Some computer use cases …」不當作 plural finite predicate。沒有目標 lemma、讀音 mapping 或新資料表。

TRAIN H 12899→12901／14487；context TRAIN default／auto 738→739，rules／auto 466→467／918，其餘維持 732／422。兩句原文的 exploit 改為 verb stress、use 改為 /z/；16084 原句 × 兩路徑只有 3 個 occurrences 改變，其餘 token／位置／重複出現完全相同。EVAL H 1443／1615、context 86／85／53／49，以及其餘 common／top、full、stress、parity、CMU 指標與所有細分控制維持。

較寬的 other／universal／relational quantifier 候選留為未採用診斷：固定 TRAIN 把 “Other sources estimate upwards …” 標為 noun，與原句有限動詞用法不符。本批不改 reference／scorer，也不把來源修正算成讀音增益；先採用獨立的 some／any 類型，同時以 “Some sources estimate …” 的正確 verb 讀音證明程式沒有對 estimate 寫例外。[Oxford estimate verb](https://www.oxfordlearnersdictionaries.com/definition/english/estimate_1) 的中間 KIT 與 [MW](https://www.merriam-webster.com/dictionary/estimate) schwa 均是標準變體，新 native test 接受兩者、保護末尾 FACE 與主重音，不算弱母音記號的 score gain。

6276 tests／313 suites、types、固定與重建 gates 全過；18 個生成資料檔完全相同，exceptions 54307、re-pin 506、五模組 3395 維持。常用字 strict 仍 5292，距一般提交門檻仍差 48 字，持續累積。

套件驗證：本輪 Rollup、81 項安全解壓與 CJS/MJS 公開 API 回歸矩陣皆通過。


## Short KIT nasal foot before open -ow (2026-10-18)

`window` 的錯誤來自 win+dow 複合拆分。短 KIT 鼻音詞頭與未經雙角色讀音佐證的開音節 -ow 詞尾，改由整體拼字規則產生；直接傳回整體結果，避免全大寫形式再次走入縮寫拼讀。保留前綴、caller-owned chunks 與真正 MOUTH 複合詞。寬泛鼻音版本曾破壞 Bandow 與所有格，已拒絕並保存比較，沒有新增名稱表或單字例外。

採納前另將既有 weak-men root guard 合併，1,296,352 項快照與 1,022 項完整 trace 完全相同，6264 測試及型別通過；五模組 3395→3393，再加入本類規則後為 3395（g2p 1150），保留上限不變。

凍結與重建後結果一致：common strict 5292→5293/6990、top strict 2847→2848/3617；lenient 6353、3343 不變。全字典 strict 61994→61996/105067，lenient 83498 不變；stress-aware 54550/45323→54552/45325/90310；CMU rules 4041→4042/5000，default 4746 不變。Parity 94774/100677、H eval 1443/1615、TRAIN 12901/14487、context eval 86/85/53/49、TRAIN 739/732/467/422 全部保持，所有 reading/class/balanced/supported-POS 與明確控制不退步。6294 測試 /314 suites、型別通過；CMU rules 原有 90% floor 仍未達標。

全詞表兩種模式僅規則 window/lindow 及大小寫探針 Window/WINDOW 改變；lindow 僅作名稱覆蓋比較，不宣稱獨立證實的名稱修正。16084 完整句子 ×2 模式僅 10 個 window/Window 規則讀音改變，其他文字與位置保持。Oxford 與 Merriam-Webster window 支持 GOAT。重建僅移除 window、windowless、lindow 三筆例外，54307→54304；re-pins 維持 506。冷詞幹 inflections、衍生詞、自訂覆寫與 noun/adjective/verb、past/modal 成對控制皆保留。

證據：`/tmp/phonemize-next-release/after-c2dd9aa-short-i-open-ow-compound-probe/`。此輪累積 common strict 較 committed 5270 增加 23 字，距普通提交門檻 5340 尚差 47 字；未刷新基準、未提交，發行目標仍未完成。

套件驗證：此輪 Rollup、81 項安全解壓、CJS/MJS main/core/English 的 default/rules、大小寫與冷詞幹 window 控制全部通過；新 harness 起初取錯 private property，修正驗證程式後使用同一份套件重新通過，產品程式未因此更動。


## Shared-modal coordinated bare predicate (2026-10-18)

重用 bounded coordinated-past scan，傳回實際 VerbForm。共用 modal 後的並列 bare predicate，僅在後接量詞＋明確複數受詞＋to-infinitive 時繼承 base；原有 past 條件保持，BE/HAVE/perfect、noun coordination、past/modal 與其他 POS 控制不變。重用既有 object-quantifier 判斷，不新增目標詞或讀音 mapping。

TRAIN H 12901→12902/14487、context default/auto 739→740/918，其餘 732/467/422 不變。EVAL H 1443/1615、context 86/85/53/49、所有 reading/class/balanced/supported-POS 保持；common 5293/6353、top 2848/3343、全字典 61996/83498、stress 54552/45325、parity 94774/100677、CMU default/rules 4746/4042 均不變。凍結與重建後 6302 測試 /315 suites、型別通過；原有 CMU rules 90% floor 仍失敗。字典 18 檔 byte-identical，例外 54304、re-pins 506。

全詞表所有改變為零；16084 完整句子 ×2 模式僅 TRAIN 「Lastly, players can form guilds and invite other players to join.」的 default invite 改為動詞 final primary，其他文字及位置不變。Oxford invite verb/noun 獨立支持重音對立；default 原有 secondary mark 保留。

最初兩份 before comparison 在 parent build 寫入中途載入了暫時 runtime table，已整份拒絕並保存於 transient-parent-build-rejected；等待 parent 完成且 data 穩定後重新執行 owned/prose，以上數字只使用重跑結果。新 test 的初始 export 與 secondary-mark assertion 錯誤亦保存；沒有更動既有 gold/reference/scorer。

證據：`/tmp/phonemize-next-release/after-c2dd9aa-modal-coordination-probe/`。規則總數仍 3395，未刷新 baseline、未達 5340 提交門檻，未提交。

套件驗證：本輪 81 成員安全解壓，CJS/MJS main/core/English default/rules 的共用 modal、noun coordination、所有既有 issue #28 與其他類別矩陣全部通過。


## Stressed consonantal -ye roots and eviction-stable stems (2026-10-18)

尾端 silent e 不再被誤算為 stressed consonantal -ye 中 y 前面的母音，重用既有 PRICE 規則；弱讀的人名末尾 y 與裸 ye 保留原行為。寬泛版本破壞 edye/freddye/jessye/tevye，已拒絕並保存。相同拼字類別保留全大寫單字路徑，避免例外移除後 DYE 變成逐字母拼讀。冷 dyer 又暴露 root lookup 對 dye 表項的依賴，因此既有 wellKnown 根詞查找在同類型 lexical miss 時使用整體規則產生，不新增目標詞 homograph lookup、mapping 或名稱表。

Oxford bye/dye/rye 與 Merriam-Webster lye 獨立支持 PRICE；16 個 default/rules 原形、冷屈折、dyer/dyeable、redyed/redyeing、hyphen、nonce grye、自訂覆寫、noun/adjective/verb 與 past/modal 測試通過。新句子測試最初錯把單音節 citation stress 留在公開 API，修正新 assertion 以符合既有 API；原有參考與評分不變。裸 redye/nondye 的弱前綴詞界仍屬既有未解問題，不宣稱修正。

凍結與重建：common strict 5293→5294/6990，lenient 6353；top 2848/3343 不變。全字典 strict/lenient 61996/83498→62025/83508/105067；stress headline/exact 54552/45325→54579/45352/90310。Parity 94774/100677、CMU default/rules 4746/4042、H EVAL 1443/1615、TRAIN 12902/14487、context EVAL 86/85/53/49、TRAIN 740/732/467/422 與全部 reading/class/balanced/supported-POS 保持。6318 tests /316 suites、型別通過；CMU rules 原有 90% floor 仍未達標。

全詞表 raw rules 改變 31 個，加上 BYE/DYE/tie-dye/grye 探針為 35；default 僅 nonce grye 一項。16084 句 ×2 模式僅七個 rules 詞項（Skye/Tye/Bye/dye/Nye）改變，其餘文字與位置保持。名稱只作已釘選字典覆蓋比較，不宣稱獨立核實新名稱發音。重建移除 41 個本類及其衍生詞例外，54304→54263，沒有新增／修改例外，re-pins 維持 506；總規則 3395、g2p 1150。

證據：`/tmp/phonemize-next-release/after-c2dd9aa-terminal-y-silent-e-probe/`。累積較 committed 5270 增加 24 字，距 5340 普通提交門檻尚差 46 字，未更新 baseline、未提交；發行 strict90% 目標尚未完成。


### Rejected bare two-token subject broadening (2026-10-18)

「Women broadcasters invite women to …」「Compound therapies combine antibodies to …」的 TRAIN +2 H/+1 default context 曾由裸二詞主詞＋受詞不定詞候選修正，完整句子比較僅改變這兩個目標；但既有 `Stone offers produce boxes to deliver later.` noun-produce 控制被破壞。offers 的有限動詞與複數名詞外形相同，單靠這個框架無法辨認。因此整份候選拒絕、未採納、未修改 gold 或加入詞彙例外。證據保留於 `/tmp/phonemize-next-release/after-c2dd9aa-bare-plural-infinitive-object-probe/rejection.json`；這些 TRAIN 增益不計入工作目錄。

`-ye` 套件驗證完成：81 成員安全解壓，CJS/MJS main/core/English default/rules、冷 roots/agents/inflections、全大寫與 caller overrides，以及既有 issue #28／POS 控制全部通過。


## Assimilated c/qu boundary and neutral nominal plurals (2026-10-18)

Onsetless ac- + qu shares the velar boundary of an assimilated prefix, so the weak initial a reduces and two-slot roots retain primary. The quie hiatus family, acquisition secondary A, unrelated closed syllables/names and racquetball are protected; the broader q→c alias was rejected. Uppercase roots keep word readings after eviction. Oxford acquaint/acquit/acquire independently support the corrected weak prefix; acquire's inherited rhotic glide convention remains an open mismatch, not a normalization gain.

The first rebuilt candidate exposed four wrong acquaintances occurrences after acquaintance eviction. It was rejected, and a premature helper copy was restored to the qualified -ye tree. The scratch adoption helper now checks both complete gate sets and all change reviews before copying, with an unchanged-main-hash rejection check. The repaired class extends the existing singular recovery to neutral -ance/-ence plurals rather than adding a word exception. It also restores root stress in references/differences/residences/appurtenances/incidences and the missing nucleus in experiences; MW/Oxford support these readings and weak-vowel alternatives. acquaintanceship retains an inherited rules stress gap.

Frozen and rebuilt scores agree: full strict/lenient 62025/83508→62028/83510/105067; common 5294/6353→5294/6355/6990; top 2848/3343→2848/3344/3617. Stress headline/exact 54579/45352→54582/45355/90310. Parity 94774/100677, CMU default/rules 4746/4042, H EVAL 1443/1615 and TRAIN 12902/14487, context EVAL 86/85/53/49 and TRAIN 740/732/467/422, all readings/classes/balanced/supported-POS and controls remain intact. 6332 tests /317 suites and types pass; the existing CMU rules 90% floor remains unmet.

Raw dictionary rules change six words; expanded OOV/uppercase controls give 9 default and 18 rules changes, all reviewed. 16084 original sentences ×2 modes give 76 reviewed token improvements across 11 headwords, with identical positions and no acquaintance-plural regressions after rebuild. These broader sentence improvements are not counted as additional common strict gains. Seven acq-family exceptions are removed (54263→54256), with 506 re-pins unchanged. Five-module total stays 3395 (g2p 1150). No baseline refresh or ordinary commit: common strict remains 24 words above committed 5270, 46 short of 5340.

The Q v2 package was also freshly rolled up, packed, safely extracted (81 members), and checked through CJS and ESM main/core/English exports in default and rules modes; all package checks passed.

Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-cqu-assimilated-prefix-probe/`, including the rejected first rebuild and source checks.

## Inchoative -sce and guarded final-c recovery (2026-10-18)

The final -sce coda now renders /s/ through the existing suffix rule, while a final-only boundary preserves scene. The shared penult stress path covers longer -sce/-scent/-scence forms with e/i immediately before the suffix; two-slot descent/crescent and quie hiatus stay outside it. The existing plural-root recovery also owns cold convalesces. A separate suffix guard keeps uppercase -esce/-isce forms on the word route after dictionary eviction. Oxford and Merriam-Webster source checks support the class examples; PESCE is only an eviction control preserving its existing pinned reading.

After dictionary rebuild, `convalesce` and `pesce` leave the exception table (54244→54242); repins move 506→501. The full set of 109147 runtime dictionary words and paired probes was reviewed in both modes. Eight dictionary rule outputs change, with no parity change. Full strict/lenient move 62028/83510→62030/83513 (105067); stress-aware headline/exact move 54582/45355→54584/45357 (90310). Common strict stays 5294/6990 and top-5000 strict 2848/3617; lenient stays 6355/6990 and 3344/3617. CMU default/rules stay 4746/5000 and 4042/5000. Homograph eval remains 1443/1615; context remains default 86/85 and rules 53/49 across auto/known-POS cells. Every per-reading, per-class, balanced, supported-POS, train and explicit-control gate is nondecreasing. All 6344 tests in 318 suites and types pass; the existing rules-CMU 90% floor remains unmet.

The complete 16084-sentence ×2-mode comparison changes four token occurrences only: fasces loses an intrusive /k/ but keeps its unresolved Latin-plural vowel; reminiscent gains the suffix stress pattern while keeping its inherited prefix-vowel mismatch. Rebuilt token changes match the frozen review byte for byte. Coalesce, fluoresce, reminisce and Pisces remain partial/open cases; they are not counted as complete pronunciation fixes. Five-module source count is 3395 (g2p 1148, syllabify 1700, postlex 497, morph-table 24, morph-parser 26), at the retained cap. A freshly packed 81-member artifact passes CJS and ESM main/core/English in default and rules modes, including the new cold-root and inherited issue #28 controls.

No baseline was refreshed and no ordinary commit is made: common strict remains 46 words below the 5340 next-commit threshold. Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-inchoative-sce-probe/`.


## Terminal demonstrative noun after that (2026-10-18)

A sentence-final homograph after clause-level `that` can be a demonstrative noun phrase when `that` follows a finite verb. The POS fallback now checks for an existing noun reading and a verbal clause head; a noun antecedent continues to select the relative-clause verb reading. No word mapping or runtime data was added.

On the fixed context EVAL, default/auto rises 86→87/108; default/gold stays 85, rules/auto 53 and rules/gold 49. Every reading, class, balanced score, supported-POS subset and paired control is nondecreasing. Homograph EVAL rises 1443→1444/1615, with TRAIN unchanged at 12902/14487 and 740/732/467/422 across the four context cells. The sole changed occurrence across all 16084 homograph sentences in both default and rules modes is `record` in “Mawsynram currently holds that record”: default output changes from /ɹɪˈkɔɹd/ to /ˈɹɛkɝd/. Rules output and every other token, duplicate occurrence and position remain unchanged.

Frozen and rebuilt counts agree. Common strict/lenient remain 5294/6355 of 6990, and top-5000 remains 2848/3344 of 3617; full strict/lenient remain 62030/83513, parity 94774/100677, stress-aware 54584/45357, and CMU default/rules 4746/4042 of 5000. Rebuild leaves all 54242 exceptions unchanged and re-pins at 501. All 6349 tests and typecheck pass. The existing rules-CMU 90% floor remains unmet.

The rule and parity dumps are byte-identical. A behavior-neutral compression also reduces the five-module count from 3409 to 3394 lines (`g2p.ts` 1147, `syllabify.ts` 1700, `postlex.ts` 497, `morph-table.ts` 24, `morph-parser.ts` 26); all 1296352 snapshot predictions remain byte-identical across the compression. Fresh Rollup and an 81-member safely extracted package pass CJS/ESM main, core and English default/rules checks, including the target sentence and issue #28 controls.

The context EVAL threshold is met, but the next ordinary commit threshold is not: common strict remains 46 words below 5340 and 998 below the release target. No baseline was refreshed and no commit was made. Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-demonstrative-noun-boundary-probe/`.


### Rejected final -ire rhotic-vowel broadening (2026-10-18)

A train-fold candidate changed final stressed `/aɪɹ/` to `/aɪɝ/` for words ending in `-ire`. Oxford learner entries support an /aɪə(r)/ transcription in several example words, but that spelling condition is too broad for this fixed American reference: it improves some longer words while breaking correct short forms, surnames, and place names. The 84 changed rule predictions include strict wins such as acquire, desire, empire, and require, and losses such as aspire, vampire, spire, and Shropshire. No whole-word list or exception was added.

Against the frozen 62030/83513 full-dictionary rules score, the candidate fell to 62007/83511. Common strict and top-5000 strict each gained three (5297/6990 and 2851/3617), and CMU rules gained two, but the full strict and lenient regressions violate the adoption gate. Context and homograph EVAL counts were unchanged. The probe is rejected; its source, all 84 changed outputs, and gate reports are retained at `/tmp/phonemize-next-release/after-c2dd9aa-final-ire-rhotic-schwa-probe/`. No reference, baseline, or runtime source was changed by this experiment.


### Rule-derived monosyllabic -st plurals (2026-10-18)

When no lexical or compound stem is available, a monosyllabic stem ending in `-st` now reuses its existing rule pronunciation before plural `-s` is added. This keeps the root nucleus when the inflected spelling no longer matches the root's rime rule. Oxford lists `posts` as the inflection of /poʊst/ [post](https://www.oxfordlearnersdictionaries.com/us/definition/english/post_3); Cambridge independently gives US /hoʊst/ for [host](https://dictionary.cambridge.org/us/pronunciation/english/host). Paired controls preserve the existing `costs` and `mists` outputs, and caller-supplied roots still take priority.

Rebuild produces byte-identical English tables; exceptions remain 54242 with 501 re-pins. Only eight derived-word rows differ in the 1296352-row snapshot (`gests`, `ghosts`, `hosts`, `khosts`, `mosts`, `osts`, `posts`, `yosts`); dictionary and POS rows do not change. Common rules strict/lenient remain 5294/6355 of 6990 and top-5000 remains 2848/3344 of 3617. Full rules strict/lenient remain 62030/83513, runtime parity 94774/100677, stress-aware headline/exact 54584/45357, homograph EVAL/TRAIN 1444/1615 and 12902/14487, context EVAL 87/85/53/49 and TRAIN 740/732/467/422. Public CMU default/rules each improve by one, to 4747/4043 of 5000; default clears its 90% gate and the rules-only legacy 90% floor remains unmet. All readings, classes, balanced metrics, supported subset and controls remain nondecreasing. All 6353 tests and typecheck pass.

The -st plural fallback adds no word-specific mapping. Its code is folded into the existing stem-selection expression; after this neutral compression, all 1296352 predictions are unchanged from the uncompressed candidate and the five-module count is 3394 (g2p 1147, syllabify 1700, postlex 497, morph-table 24, morph-parser 26). No baseline was refreshed or commit made: common strict remains 46 below the 5340 ordinary commit threshold and 998 below the 90% release target. Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-sts-morph-probe/`.


### X-final roots in regular inflections (2026-10-18)

An x-final stem already spells /ks/ and cannot take a fabricated silent e. The shared inflection gate now excludes x-final roots from that restoration, so regular -ed/-ing and agent forms reuse the actual root. Oxford gives `fix` /fɪks/ with `fixed` /fɪkst/ and `mix` /mɪks/ with `mixed` /mɪkst/ ([fix](https://www.oxfordlearnersdictionaries.com/us/definition/english/fix_1), [mix](https://www.oxfordlearnersdictionaries.com/us/definition/english/mix_1)); Cambridge gives `taxed` /tækst/ ([taxed](https://dictionary.cambridge.org/us/dictionary/english/taxed)). Regressions cover default/rules, past and -ing forms, caller-owned roots, multi-syllable relaxed, and the boxed coda control.

After rebuilding, strict/lenient rules accuracy rises 62030/83513→62033/83515 of 105067; stress-aware headline/exact rises 54584/45357→54586/45359 of 90310. Public CMU default/rules each rise by two to 4749/4045 of 5000; default clears 90%, while the known rules-only 90% floor remains unmet. Common rules strict/lenient stay 5294/6355 of 6990, and top-5000 stays 2848/3344 of 3617. Parity stays 94774/100677; homograph EVAL/TRAIN 1444/1615 and 12902/14487; context EVAL 87/85/53/49 and TRAIN 740/732/467/422. All readings, classes, balanced scores, supported subset and explicit controls remain nondecreasing.

The rebuilt exception table removes only `indexer`, `unmixed`, and `untaxed`; re-pins remain 501. The complete 1296352-row snapshot has 578 reviewed changes: three rule outputs, one runtime `indexer` row with the same phones and primary stress but without secondary stress, and 574 derived forms. The derived changes are suffix forms of x-final roots; no gold references, POS readings, or sentence tokens change. All 6357 tests and typecheck pass. No word map or runtime dataset was added. Five-module count remains 3394. Baselines remain unchanged; common strict is 46 below the next ordinary commit threshold and 998 below the release target. Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-x-final-morph-probe/`.

### Rejected broad compound-plural fallback (2026-10-18)

Calling the general compound splitter for every plural stem improved full-dict
rules by 12 strict and 4 lenient, but changed 4,530 snapshot rows (4,444
derived forms), including false splits such as comedies, cowboys and pipelines.
Common strict and both top-slice counts were unchanged. The candidate is
rejected; the existing short-compound/particle guard stays. Snapshot evidence:
`/tmp/phonemize-next-release/before-three-dictionary-readings.jsonl` and
`after-compound-plural-probe.jsonl`.

A follow-up guard requiring the plural stem to be in the runtime dictionary
cannot work in the rules-only benchmark: `disableDict` leaves those stems
unattested there (`broadcast`, `forecast`, `cowboy`, `airway` all return false).
That guard was a no-op for the intended rule path and was removed without
changing predictions.

### Rejected broad final -ire rhoticization (2026-10-18)

The structural learner proposed changing final `/aɪɹ/` to `/aɪɝ/`: its common
top-5000 training slices showed 24 strict fixes and no strict breaks, but the
full training pool showed 8 breaks. This does not support a general `-ire`
rule. Cambridge US records `desire`, `empire`, `vampire` and `inquire` with
final `/aɪr/`, while `acquire` has `/aɪɚ/` ([desire](https://dictionary.cambridge.org/us/pronunciation/english/desire),
[empire](https://dictionary.cambridge.org/us/pronunciation/english/empire),
[vampire](https://dictionary.cambridge.org/us/pronunciation/english/vampire),
[inquire](https://dictionary.cambridge.org/us/pronunciation/english/inquire),
[acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)).
The apparent wins therefore mix dictionary transcription conventions and a
genuine narrower reading; no source rule or benchmark reference changed.

### Standalone letter names in the rules path (2026-10-18)

When rules-only G2P receives one letter as a whole token, it now reuses the
existing initialism table's letter name. This fixes entries such as `c`, `i`,
`x` and `y` without adding pronunciation mappings. The article `a` retains its
contextual weak form, and sentence controls confirm `A cat` /ə/ and `I` /aɪ/.

The full frozen snapshot has 44 reviewed rule-path changes, only standalone
letters and their hyphenated compounds; dictionary and POS-context rows are
byte-identical. After the complete data pipeline, generated JSON hashes are
unchanged, the exception table remains 54,239 entries and dependency-aware
re-pins remain 501. Common strict stays 5294/6990 and top strict 2848/3617;
full rules strict/lenient stay 62033/83515, parity 94774/100677, stress-aware
54586/45359, homograph EVAL 1444/1615 and context EVAL 87/85/53/49. Public
CMU default stays 4749/5000; rules-only rises 4045→4069/5000. All 6,399 tests,
typecheck, paired letter/article controls, and the byte-identical neutral
compression snapshot pass. Five-module count is 3395 (G2P 1148). Baselines
remain fixed; this does not advance the 6,990-word strict release threshold or
qualify for an ordinary commit.

Evidence: `/tmp/phonemize-next-release/after-c2dd9aa-single-letter-fallback/`.

### Rejected: blanket weak soft-c + i reduction (2026-10-18)

The family-fold learner's `c` + unstressed `i` → schwa candidate was not
adopted: pooled train examples were +60/−27, top-5000 examples +26/−18, and
the candidate passed 0/10 held-out fold filters. A real-pipeline probe also
changed thousands of snapshot rows and broke the established `tacit` /ɪ/
control. Removing the candidate restored the exact frozen snapshot hash. Keep
the existing narrower reductions; any future soft-c proposal needs a
phonologically motivated class that preserves both `-ciate`/`-cium` and
closed-rime controls.

Evidence: `/tmp/phonemize-rule-next-20261018/cv-common-report.json` and
`/tmp/phonemize-next-release/after-single-letter-ci-schwa-probe/`.

### Adopted checked vowel in final -cess (2026-10-18)

Rules-only G2P now retains checked /ɛ/ in a final `-cess` syllable after the
general weak-vowel pass. Paired controls keep `princes`, `accessible` and
`procession` on their existing routes. The frozen common set gains three strict
words (5294→5297/6990); the fixed top-5000 slice gains three (2848→2851/3617);
public CMU rules gains two (4069→4071/5000). Default CMU, runtime parity,
stress-aware, homograph and all four context-IPA cells do not regress. Full
rules strict/lenient after rebuild are 62037/83515 of 105067. No word mapping
or runtime data was added. The one-line return-path compression preserves all
1296352 predictions exactly. Full tests: 322 suites, 6405 passed; typecheck
passed.

The offline learner's 10 spelling-family folds produced 66 accepted proposals,
but none passed its held-out filter. Its strongest weak-c proposal remains
rejected (60 training wins/27 losses; 0/10 held-out folds). Do not revive it
without a narrower class and paired controls. Frozen snapshots, reports and
extracted package smoke tests are under
`/tmp/phonemize-next-release/after-weak-cess-e-20261018/`. The release strict
targets remain unmet by 995 common words and 405 top-slice words.

### Issue #28: O'Brien and O'Reilly Media (2026-10-18)

The linked report is specifically about `Brien` being right while `O'Brien`
was rendered with the wrong stress and vowel. The current pinned dictionary gives
`Brien` /ˈbɹaɪɪn/ and `O'Brien` /oʊˈbɹaɪɪn/; a sentence-level regression checks
that the full name remains one token and keeps that reading. `O'Reilly Media`
is covered as the user's related brand example: `O'Reilly` keeps its separately
attested /oʊˈɹaɪɫi/ reading and `Media` remains a separate token. The generic O'
fallback composes names from their root only when the complete name is absent;
no O'Brien or O'Reilly pronunciation mapping was added.

Issue: https://github.com/hans00/phonemize/issues/28#issuecomment-6155246927

### Assimilated suc- stress class (2026-10-18)

Rules-only stress now treats the assimilated `suc-` in `succeed`, `success`,
`succinct` and `succumb` as weak before `-ceed`, `-cess`, `-cinct` and `-cumb`.
The complete pre/post rules snapshot changes exactly those four rows; the
paired `succor`, `succulent`, `suck` and `sucrose` controls remain unchanged.
Common strict remains 5297/6990 and top-slice strict remains 2851/3617. Full
rules remain 62037/83515 strict/lenient; CMU rules improves 4071→4072/5000,
and the stress-aware headline improves 54588→54592/90310. Public default
4749/5000, parity 94774/100677, homographs 1444/1615, and all four context
cells (87/85/53/49) are unchanged. No mapping or runtime data was added.

The neutral compression pass is byte-identical across all 1296352 rules rows.
The rebuilt package passes CJS and ESM smoke checks for the four `suc-` words,
O'Brien and O'Reilly Media. All 323 test suites / 6410 tests and typecheck pass.
Five-module count remains at the 3395-line cap. Release strict gaps remain 995
common words and 405 top-slice words; baselines are unchanged.

Evidence: `/tmp/phonemize-next-release/after-suc-stress-20261018/`.

### Bounded bare-all and shared infinitive frames (2026-10-18)

The POS tagger now recognizes a plural bare `all` subject before a base predicate
with a closed pronoun object ("not all reject it"), and a shared infinitive
across `and`/`or` when the second conjunct has its own bounded object ("to choose
or reject God"). These general clause patterns correct two `reject` eval
occurrences without adding a word map. The homograph score rises from 1444 to
1446/1615. One remaining miss is a title-initialized proper-name context
("Reject False Icons"), which does not justify a capitalization exception.

Paired controls preserve noun `content` and the noun coordination in "to the
store or market." Common strict/lenient stay 5297/6355 of 6990, top-5000
strict/lenient stay 2851/3344 of 3617, public CMU default stays 4749/5000,
and all four context-IPA cells stay 87/85/53/49. Full tests pass (324 suites,
6414 tests), typecheck and `yarn test:ipa` pass. The isolated accuracy target
and ordinary-commit threshold remain unmet; no baselines were moved.

The required post-change data pipeline rebuilt the same 54,231 exceptions
with 501 dependency-aware re-pins; generated-table counts stayed unchanged.
Rollup and extracted npm-package CJS/ESM smokes pass for `O'Reilly`,
`not all reject it`, and the shared `to choose or reject God` frame. A fresh
10-fold structural learner run accepted 66 training proposals, but none passed
the held-out filter; its best broad vowel candidates remain rejected.

### Finite subject frames after locative and infinitive phrases (2026-10-18)

The POS tagger now carries singular subjects through bounded locative phrases
(`this gastropod lives in...`, `He currently lives in...`), plural subjects
through one intervening PP before a `to` infinitive (`elements ... combine to
form`), and an explicit shared subject across a `but`-coordinated `to` predicate
(`They manage ..., but refuse to ...`). Paired plural-noun and noun-reading
controls remain covered. The frozen homograph eval rises 1446→1454/1615: `lives`
is 10/10, `refuse` improves 5/10→8/10, and `combine` 6/10→7/10. No whole-word
mapping was added.

After the full data rebuild, the exception table remains 54,231 entries with
501 dependency-aware re-pins. The pre/post runtime snapshot is byte-identical
across 1,296,352 prediction rows; the new sentence contexts are evaluated separately
by the homograph and context gates. Full tests pass (325 suites, 6424 tests),
typecheck, extracted CJS/ESM package smokes and all four context-IPA cells pass.
Common strict/lenient remain 5297/6355 of 6990; top-slice strict/lenient remain
2851/3344 of 3617; public CMU default remains 4749/5000; runtime parity remains
94774/100806; stress-aware remains 54592/90310. Rules-only CMU remains 4072/5000,
the existing below-90% floor. Baselines are unchanged; common strict still needs
995 words and top-5000 strict 405 words to reach the user's 90% targets.

### Rejected: broad unstressed i centralization in -ical (2026-10-18)

Several common mismatch rows show CMU's schwa where the current rule emits /ɪ/
in `-ical`. A blanket `i`→schwa rule would align those references, but Cambridge
US gives /ɪ/ in both [chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical)
and [typical](https://dictionary.cambridge.org/us/pronunciation/english/typical).
That candidate would trade an attested standard vowel for benchmark agreement,
so it is rejected and no phoneme expectation or rule changed.

### Rejected: centralizing the regular past-tense -ed vowel (2026-10-18)

The common mismatch report exposed many rule-path `-ed` forms where the pinned
reference writes /ə/ but the current output has /ɪ/. Simulating /ɪd/→/əd/ after
the stem-final /t/ gives 47 strict wins and 42 losses in the 6,990-word subset
(21/15 in top-5000); after stem-final /d/ it gives 13/3 (7/3 in top-5000).
Across the full dictionary, these two environments together change 254 strict
failures into matches but break 552 currently correct words. This is not an
adoptable class. Cambridge US explicitly gives /ɪd/ for [added] and [united],
confirming that those proposed common-reference gains would conflict with a
standard American reading ([added](https://dictionary.cambridge.org/us/pronunciation/english/added),
[united](https://dictionary.cambridge.org/us/pronunciation/english/united)). No rule or reference was changed.

A fresh full-dictionary postlex ablation replayed 107,645 words across 174
rules. The only removal with a positive common strict delta was the existing
guarded -ett correction: +1 common strict (Bennett), but -32 full-dictionary
strict, with 43 full-dictionary strict losses versus 11 wins. It remains in
place rather than being broadened or removed for a one-word subset gain.
Reports: `/tmp/phonemize-postlex-oct18-full/results.json` and the current
`g2p-mismatches-common-report.txt`.

### Weak con- verb roots and outer un- composition (2026-10-18)

Rules-only stress now keeps weak /kən-/ and primary stress on the bound verb
root in `concern`, `confess`, `confirm`, `constrain`, `constrict` and `consult`. Cambridge US
records those readings with the weak prefix and root stress: [concern](https://dictionary.cambridge.org/pronunciation/english/concern),
[confess](https://dictionary.cambridge.org/us/pronunciation/english/confess),
[confirm](https://dictionary.cambridge.org/us/pronunciation/english/confirm),
[constrain](https://dictionary.cambridge.org/us/pronunciation/english/constrain),
[constrict](https://dictionary.cambridge.org/pronunciation/english/constrict),
[consult](https://dictionary.cambridge.org/pronunciation/english/consult).
The rule is limited to the two-syllable bound verb frame; noun controls such as
`concert`, `concept`, `conflict` and `contract` keep their original stress.
Derived forms preserve the frame when an outer `un-` prefix attaches, including
`unconfirmed`, `unconstrained` and `unconsulted`. No whole-word mapping was
added.

After the complete dictionary rebuild, the common rules strict score rises
5297→5300/6990 and top-5000 rises 2851→2853/3617. Full rules strict/lenient
is 62045/83516 of 105067; runtime parity remains 94774/100806 and 100677/100806.
The stress-aware phonemic headline is 54599/90310 (+98 vs baseline), exact IPA
45369; public CMU default is 4749/5000 and rules-only 4074/5000 (the legacy
rules-only 90% floor remains unmet). Homograph eval is 1454/1615, context IPA
is 87/85/53/49 across the four cells, and every gate is nondecreasing. The
rebuild produced 54223 exceptions and 501 dependency-aware re-pins (512 fixes,
5 retained net-positive regressions). Rollup, typecheck, 326 test suites /
6430 tests, and issue #28 apostrophe regressions pass. No baseline was moved;
the ordinary commit threshold (5340/6990 under the fixed 5270 committed
baseline) is still unmet, so this remains an accumulating batch.

The final generated-table replay differs from the pre-final-build snapshot only
in three synthetic `nonqualified` suffix probes; these are outside the fixed
evaluation population. A neutral compression pass brings the five-module count
from 3398 to 3395 (G2P 1148, syllabify 1700, postlex 497, morphology 24/26).
Its 1,296,352-row before/after snapshot is byte-identical, SHA-256
`fcbd3142fc58c8b1d5606e87861b4bf1992f7a734359ad04cfa462c34420e6d8`.
Fresh built CJS output reads `O'Brien`, `O'Reilly Media` and the six weak-
`con-` verbs correctly.

Both 10-fold learner passes were completed against the frozen common population:
the structural run accepted 64 training proposals and the general run accepted
48, but neither had a proposal pass the existing held-out filter. Their broad
weak-vowel and final-r candidates remain rejected.

Evidence: `/tmp/phonemize-next-release/con-prefix-bound-stress-20261018/`.

### Weak `-tual` roots before `-ly` (2026-10-18)

The `-ally` stem composer now falls back to the rule-derived stem when an
attested `-tual` root's dictionary rendering drops the spelled /u/, while the
rules preserve /tʃuə/. This repairs rules-only `actually` and also supports
`perceptually`; the remaining `-tually` controls (`eventually`, `factually`,
`habitually`, `virtually`) retain their dictionary readings. Cambridge US
gives /ˈæk.tʃu.əl/ and /ˈæk.tʃu.ə.li/ for [actual](https://dictionary.cambridge.org/us/pronunciation/english/actual)
and [actually](https://dictionary.cambridge.org/us/pronunciation/english/actually),
and /pɚˈsep.tʃu.əl/ and /pɚˈsep.tʃu.ə.li/ for [perceptual](https://dictionary.cambridge.org/pronunciation/english/perceptual)
and [perceptually](https://dictionary.cambridge.org/pronunciation/english/perceptually).
No word-specific mapping or reference edit was added.

The rebuilt 1,296,352-row snapshot differs from the pre-build candidate in 11
rows: the generated `actually` dictionary entry and ten morphology probes for
artificial `actually` suffix forms; no other real prediction changed. The
rebuild produced 54,222 exceptions with 501 dependency-aware re-pins. Common
strict rises 5300→5301/6990 and top-5000 2853→2854/3617;
lenient rises 6355→6356 and 3344→3345 respectively. Full-dictionary
strict/lenient is 62046/83517; runtime parity remains 94774/100806 strict and
100677/100806 lenient. Stress-aware phonemic accuracy rises by one to
54600/90310, exact IPA remains 45369. Public CMU default/rules-only is
4749/5000 and 4074/5000; the existing rules-only 90% gate remains unmet.
Homographs remain 1454/1615 and context IPA remains 87/85/53/49. The complete
Jest suite passes (327 suites, 6436 tests), as do typecheck, Rollup, and the
issue #28 apostrophe regressions. Baselines remain unchanged; the next normal
commit still needs 5340/6990. Evidence is in
`/tmp/phonemize-next-release/actually-tual-candidate.tsv` and
`/tmp/phonemize-next-release/actually-tual-after-rebuild.tsv`.

### Rejected common-subset rule candidates (2026-10-18)

The full 6,990-word route replay found no safe route bypass: removing morphology
falls from 5,301 to 4,666 strict matches, and bypassing the compound split falls
to 4,548. The 10-fold structural learner accepted 64 training proposals and
the distance learner accepted 39, but neither produced a held-out candidate.
The best broad final-`ire` change (unstressed /ɹ/ to /ɝ/) improved common strict
by only 3 (5 wins, 2 losses), top-5,000 by 4 (4 wins, 0 losses), and regressed
40 full-dictionary words (13 wins, 40 losses); it is rejected. Full postlex
removal replay likewise found no safe general removal. Reports:
`/tmp/phonemize-route-diagnosis-full-20261018/report.json`,
`/tmp/phonemize-rule-corrections-20261018-latest/cv-common-report.json`,
`/tmp/phonemize-rule-corrections-20261018-distance/cv-common-report.json`, and
`/tmp/phonemize-postlex-all-20261018.json/results.json`.

Common strict remains 5,301/6,990 (75.84%); top-5,000 remains 2,854/3,617
(78.91%). These diagnostics yielded no pronunciation gain and did not change
baselines. Continue by testing narrower spelling/morphology classes against
both their positive examples and neighboring controls.

The `-uction` cluster is not a safe /ʌ/→/ə/ rule candidate. The common
reference marks production, instruction, and junction with /ə/ in the stressed
root syllable, while Cambridge US independently records /ʌ/ for all three:
[production](https://dictionary.cambridge.org/pronunciation/english/production),
[instruction](https://dictionary.cambridge.org/pronunciation/english/instruction),
and [junction](https://dictionary.cambridge.org/pronunciation/english/junction).
The current rule-path /ʌ/ agrees with those authoritative readings; changing
the phoneme to gain frozen-table strict matches would reduce pronunciation
accuracy. No reference or runtime change was made for this cluster.

### Weak `-imate` vowel before final /meɪt/ (2026-10-18)

`src/en/postlex.ts` now reduces the weak /ɪ/ to /ə/ before final /meɪt/ in the
spelled `-imate` frame. The guard matches the consonant + /ɪ/ sequence, so the
/aɪ/ in `climate` is preserved. Cambridge US independently supports the
standard verb readings for [animate](https://dictionary.cambridge.org/us/dictionary/english/animate)
and [estimate](https://dictionary.cambridge.org/us/dictionary/english/estimate).
The regression covers both roots, regular past/progressive forms, the prefixed
`inanimate`, derived `intimation`, and the climate vowel-team control.

After rebuilding (54,220 exceptions; 501 dependency-aware re-pins), common
strict rose 5,301→5,302/6,990 and top-5,000 rose 2,854→2,855/3,617. Full-dict
rule strict rose 62,046→62,047/105,067; full-dict lenient stayed 83,517/105,067.
Public CMU accuracy stayed 4,749/5,000 default and rules-only rose
4,074→4,075/5,000 (the existing rules-only 90% floor still fails). Runtime
parity stayed 94,774/100,806 strict and 100,677/100,806 lenient; the
stress-aware headline stayed 54,600/90,310 while exact IPA rose by one to
45,371. Context default/auto remained 87/108, homographs remained 1,454/1,615.
All 328 Jest suites / 6,444 tests, typecheck, Rollup, and issue #28 apostrophe
tests passed. Baselines remain unchanged, and the current common score remains
below the ordinary 5,340/6,990 commit threshold. The rebuilt 1,296,352-row
snapshot is `/tmp/phonemize-imate-after-rebuild-20261018.tsv`; the compared
pre-candidate snapshot is `/tmp/phonemize-next-release/actually-tual-after-rebuild.tsv`.

### Continued common-rule screening and neutral compression (2026-10-18)

A fresh structural learner run on the frozen 6,990-word common population again
found no held-out-safe candidate: 58 training proposals were accepted across
the ten spelling-family folds, but 0/58 passed the held-out filter. Its strongest
candidate (`c` before an unstressed `i`: /ɪ/→/ə/) scored +60/-27 on training
words and still failed the held-out contract in every fold. No candidate was
adopted. Report:
`/tmp/phonemize-next-release/20261018-continued-structural/cv-common-report.json`.

The new `-imate` rule had put the five-module code count at 3,396. Folding a
wrapped existing postlex predicate into one line restores the 3,395 cap with no
behavior change: the before/after 1,296,352-row snapshots are byte-identical
(SHA-256 `e9a4eca8502323a32081e01b9170dd96e13fce8e04bd7f55733cfb2ff856b7bf`).
The final count is g2p 1,148, syllabify 1,700, postlex 497, morph-table 24 and
morph-parser 26. All 328 Jest suites / 6,444 tests, typecheck and `git diff
--check` pass. The common score remains 5,302/6,990 strict and 6,356/6,990
lenient; top-5,000 remains 2,855/3,617 strict and 3,345/3,617 lenient. Issue
#28's O'Brien/O'Reily/O'Reilly tests still pass, with no name-specific runtime
mapping. Baselines remain unchanged and no commit was made.

The general distance learner also accepted 29 proposals across the ten folds,
with 0 passing held-out filters. A fresh route replay confirms morphology and
compound dispatch remain essential: on 107,645 dictionary words, removing
morphology changes strict from 63,368 to 57,672, and using the unsplit route
changes it to 54,674. The 175-rule postlex ablation likewise has no safe broad
removal; removing the existing guarded `-ett` rule is +1 common strict but
-32 full-dictionary strict. Reports are
`/tmp/phonemize-next-release/20261018-continued-distance/cv-common-report.json`,
`/tmp/phonemize-next-release/20261018-current-routes/report.json`, and
`/tmp/phonemize-next-release/20261018-current-postlex/results.json`.

### Weak `<qui>` in the `-acquisition` morpheme (2026-10-18)

The rules-only path now reduces /kwɪ/ to /kwə/ inside the spelled
`acquisition` morpheme. Cambridge's US pronunciation entry gives
/ˌæk.wəˈzɪʃ.ən/ for [acquisition](https://dictionary.cambridge.org/us/pronunciation/english/acquisition),
while [inquisition](https://dictionary.cambridge.org/pronunciation/english/inquisition)
keeps /kwɪ/ and [acquisitive](https://dictionary.cambridge.org/pronunciation/english/acquisitive)
also keeps /kwɪ/. The guard follows the written morpheme; it adds no word
pronunciation table. Tests cover `acquisition`, its plural, OOV prefixed and
compound forms, plus acquire/acquisitive/inquisition/inquisitive controls and
the acquisition/inquisition contrast in a complete sentence. The existing
`-ition` hiatus expectations now assert the authoritative acquisition reading
on both rules and dictionary routes.

After the required dictionary and exception rebuild (54,218 exceptions; 501
dependency-aware re-pins), common strict rose 5,302→5,303/6,990, top-5,000
strict 2,855→2,856/3,617, and full-dictionary strict 62,047→62,048/105,067.
All lenient counts stayed unchanged. Public CMU accuracy remained 4,749/5,000
in default mode; rules-only rose 4,075→4,076/5,000 and remains below its legacy
90% floor. Runtime parity stayed 94,774/100,806 strict and 100,677/100,806
lenient. Stress-aware phonemic accuracy stayed 54,600/90,310 while exact IPA
rose 45,371→45,372. Context IPA remained 87/85/53/49 across its four cells,
and homographs remained 1,454/1,615.

The pre/post rebuild rule snapshot changes only nine generated morphology
probes built from artificial suffixes on `acquisition`; every changed row is
listed in `/tmp/phonemize-next-release/acquisition-rebuild-diff.tsv`. Common
and full snapshots show no other new changes. All 329 Jest suites / 6,453
tests, typecheck, Rollup and `git diff --check` pass. Baselines remain
unchanged. Common strict still needs 989 additional words to reach the stated
6,292 target, so this gain remains part of the uncommitted batch below the
normal 5,340-word commit gate.

### Initial independent `<h> + <ow>` MOUTH frame (2026-10-18)

The rules path now uses MOUTH for the initial independent `<h> + <ow>` frame.
Cambridge gives /haʊ/ for [how](https://dictionary.cambridge.org/pronunciation/english/how),
and Oxford gives /ˈhaʊərd/ for [Howard](https://www.oxfordlearnersdictionaries.com/us/definition/english/howard).
The spelling control keeps `<sh>` in show on GOAT; paired tests also preserve
`snow`, `throw` and `slow`, exercise `somehow`/`anyhow`/`however`, and check
`Howard`/`howitzer` plus a sentence containing both the target and a control.
No word-specific pronunciation entry was added.

After rebuilding dictionaries and the 54,191-entry exception table (501
dependency-aware re-pins), common strict rose 5,303→5,305/6,990 and top-5,000
strict rose 2,856→2,858/3,617; both lenient counts were unchanged. Full-dict
rule strict/lenient rose 62,048/83,517→62,079/83,521. Public CMU accuracy
remained 4,749/5,000 by default; rules-only rose 4,076→4,078/5,000 and remains
below its legacy 90% floor. Runtime parity stayed 94,774/100,806 strict and
100,677/100,806 lenient. Stress-aware phonemic/exact counts rose
54,600/45,372→54,622/45,392; context remained 87/85/53/49 across its four
cells and homographs remained 1,454/1,615. All 330 Jest suites / 6,463 tests,
typecheck, Rollup and `git diff --check` pass.

The pre-build and rebuilt 1,296,352-row snapshots and source/data hashes are
in `/tmp/phonemize-next-release/how-rime-prefreeze/`. The full-dictionary
snapshot review also found the rebuilt default output for `howtek` changed
from `ˈhaʊˌtɛk` to `ˈhaʊtɛk`, while its stress-stripped parity stayed exact;
the rules-only `howler` changed from `ˈhaʊəɫɝ` to the dictionary's
`ˈhaʊɫɝ`. Remaining rebuild differences are generated morphology probes on
`how`-initial words. Parity counts were unchanged. Baselines remain unchanged.
Common strict still needs 987 words to reach 6,292/6,990,
top-5,000 needs 398 to reach 3,256/3,617, and common strict remains 35 below
the ordinary 5,340 commit gate, so this validated gain stays uncommitted.

### Case-insensitive Irish `O'` surname prefix and contraction control (2026-10-18)

The existing productive `O'` surname composition depended on title case: an
unknown `O'Reily` was composed from its prefix and root, while `o'reily` fell
through to morphology and received a different reading. The recognizer now
normalizes case and apostrophe style before composing the prefix with the
root. It explicitly excludes `o'clock` from surname composition, leaving its
shipped dictionary reading intact. Possessives continue to attach after the
surname stem, and no surname pronunciation map was added. The regression
covers upper/lower case, ASCII/curly apostrophes,
possessives, the `O'Clock` control, and the existing O'Brien/O'Reilly Media
sentence and API cases.

On the frozen 1,296,352-row snapshot, the rebuilt candidate changes 704 rows:
120 rules outputs, six direct dictionary outputs after exception regeneration,
and 578 generated morphology probes. The reviewed list is
`/tmp/phonemize-next-release/quire-prefreeze/rebuild-diff.tsv`. The fixed full
dictionary rule score improves 62,079/83,521→62,139/83,592 (+60 strict,
+71 lenient); the only strict loss is lowercased `o'clair`, while 61 changed
words become exact. This is a full-dictionary gain; common remains
5,305/6,990 strict and top-5,000 remains 2,858/3,617. Common lenient scores,
public CMU default/rules (4,749/4,078 of 5,000), runtime parity
(94,774/100,806 strict; 100,677/100,806 lenient), stress-aware accuracy
(54,622/90,310 phonemic; 45,392 exact), context (87/85/53/49), and homograph
EVAL (1,454/1,615) do not decrease. Rebuild retained 501 dependency-aware
re-pins and produced 54,121 exceptions.

All 330 Jest suites / 6,463 tests, typecheck, Rollup, and `git diff --check`
pass. A neutral line-count compression returns the five rule modules to 3,395
code lines (g2p 1,148, syllabify 1,700, postlex 497, morph-table 24,
morph-parser 26); its post-compression 1,296,352-row snapshot is byte-identical.
Baselines are unchanged. Common strict still needs 987 words to reach
6,292/6,990 and 35 to reach the ordinary 5,340 commit threshold; this change
remains uncommitted.

### Word-initial consonantal `y` in short `-s` forms (2026-10-18)

The regular `-s` analysis treated the two-letter spelling `ye` as a vowel
stem because its short-stem guard excluded initial `y`. That made `yes` take
the voiced plural suffix (`ˈjɛz`) instead of its voiceless lexical reading
(`ˈjɛs`). The guard now admits only word-initial `y` as a consonant, while
keeping medial `y` protected so `types` and `bytes` retain their silent-e
stems. The paired test also retains `this`, `his`, `has`, `gas`, `photos`, and
`videos`. [Cambridge gives US `yes` as /jes/](https://dictionary.cambridge.org/us/pronunciation/english/yes).

The frozen 1,296,352-row snapshot changed eight morphology predictions in the
short initial-y class, with no dictionary or rule-table changes. The reviewed
before/after rows are in
`/tmp/phonemize-next-release/quire-prefreeze/yes-snapshot-diff.tsv`. After
rebuilding, the 5,000-word public API score is 4,750/5,000 (95.00%, +1) and
the rules-only API score is 4,079/5,000
(81.58%, +1). The full English-subset strict/lenient scores remain
5,305/6,990 and 6,356/6,990, and top-5,000 remain 2,858/3,617 and 3,345/3,617.
Runtime parity (94,774/100,806 strict; 100,677/100,806 lenient), stress-aware
accuracy (54,622/90,310 phonemic; 45,392 exact), context (87/85/53/49), and
homographs (1,454/1,615) are unchanged. The full Jest suite passes (330 suites,
6,481 tests) and typecheck passes. The ordinary +70 common-strict commit
threshold is still unmet, so baselines remain unchanged and this work stays
uncommitted.

A follow-up probe removed the global /ɪz/→/əz/ merger after sibilants. It
raised public CMU strict to 4,759/5,000 (+9), but reduced the fixed common
strict cohort to 5,238/6,990 (−67), top-5,000 strict to 2,822/3,617 (−36),
and runtime parity to 94,752/100,806 (−22). The probe was reverted; current
code retains the merger and the accepted `yes` correction above.

A separate `office` probe tried to account for its doubled consonant before
weak `-ice`. It restored the expected short vowel in `office`, but applied
the same spelling frame to `suffice` and changed its attested /aɪ/ to /ɪ/.
Cambridge confirms US /səˈfaɪs/ for [suffice](https://dictionary.cambridge.org/us/pronunciation/english/suffice).
The paired class therefore has no safe rule boundary in the current stress
analysis and was reverted. No pronunciation baseline or runtime table changed.

The follow-up structural learner replayed all 6,990 common words over ten
spelling-family folds. It accepted 58 fold-local candidates, but none passed
the existing safety filter in any fold; mean held-out strict accuracy stayed
74.04%. The leading `ire` candidate fixed 24 top-5,000 cases with no top-slice
breaks in aggregate, but its mean train fix rate was only 0.59, below the
required 0.75. The report is
`/tmp/phonemize-next-release/20261018-followup-structural/cv-common-report.json`;
no learner candidate was adopted.

Two manual follow-ups also failed paired review. Replacing weak `/ə/` with
`/ɪ/` across final `-lity` would move the fixed top-5,000 CMU slice from 9 to
6 exact matches among 17 affected words (five wins, eight losses), so the
suffix remains unchanged. A broader `-ire` rhotic-schwa candidate would
overfit CMU's `ER` transcription: Cambridge's US entries transcribe `entire`,
`desire`, and `admire` with final /r/, matching the existing `/aɪɹ/` output
([entire](https://dictionary.cambridge.org/pronunciation/english/entire),
[desire](https://dictionary.cambridge.org/pronunciation/english/desire),
[admire](https://dictionary.cambridge.org/us/pronunciation/english/admire)).
Both probes were rejected without changing pronunciation code or baselines.

A morphology probe co-selected rule-derived `/ɪdʒ/` stems for regular `-ages`
and preserved their `/ɪz/` plural syllable, avoiding mixed readings such as a
reduced dictionary stem with an independently selected plural. It improved
public rules-only CMU by one (4,079→4,080/5,000), but the fixed 6,990-word
strict score fell 5,305→5,297, top-5,000 strict fell 2,858→2,852, and common
lenient fell 6,356→6,352. The implementation was reverted; regenerated
reports confirm the original 5,305/6,990 and 2,858/3,617 counts. This class
is rejected under the no-regression gates.

### Rechecked weak `<ci>` schwa candidate (2026-10-19)

A fresh 10-fold run accepted 15 structural readings in at least one fold but
none passed its diagnostic filter. Its repeated `c` candidate would change
unstressed `<ci>` /ɪ/ to /ə/ (60 training fixes, 27 breaks; top-5,000 26/18).
This is not accepted as a class: Cambridge US records /ˈæs.ɪd/ for
[acid](https://dictionary.cambridge.org/us/pronunciation/english/acid) and
/ˌsɪn.sɪˈnæt̬.i/ for
[Cincinnati](https://dictionary.cambridge.org/us/pronunciation/english/cincinnati),
so the CMU schwa gains are not reliable evidence for a general reduction.
`civilian` does have a US /sə/ variant, but it cannot justify changing the
other same-spelling environments. The temporary consonant-context probe was
reverted; no pronunciation source, baseline, or runtime table changed.

### Current common-word route audit (2026-10-19)

Fresh route replay verifies 5,305/6,990 strict and 6,356/6,990 lenient. Removing
morphology drops strict to 4,670 and the unsplit route to 4,552, confirming that
the remaining gains need to come from refining productive routes rather than
disabling them. A large share of the simple weak-`ɪ`/schwa mismatches do not
support a pronunciation change: Cambridge US gives `/ɪ/` for
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[office](https://dictionary.cambridge.org/us/pronunciation/english/office),
and [added](https://dictionary.cambridge.org/pronunciation/english/added),
while the fixed dictionary renders those weak vowels as `/ə/`. These remain
strict-table disagreements; changing them would lower independently verified
US pronunciation quality. The route report and win/loss rows are in
`/tmp/phonemize-route-diagnosis/report.json`; the full postlex ablation is in
`/tmp/phonemize-postlex-diagnosis/results.json`.

The user clarified that `O'Reilly Media` is an example of a real brand, not a
misspelling to normalize. Keep its attested brand reading through ordinary
lexical lookup and sentence processing; do not add a brand-specific mapping.
The spelling-only `O'` surname rule remains casing- and apostrophe-tolerant,
but its rules-only `/eɪ/` reading for `O'Reilly` is not evidence for the brand
pronunciation. The existing issue regression checks both names in context.

### Rejected `-ation` medial-vowel merge (2026-10-19)

The current common mismatch rows suggest reducing medial KIT to schwa throughout
`-ation`, but source-checked controls reject that spelling-level rule.
Cambridge gives US schwa and UK KIT for
[destination](https://dictionary.cambridge.org/pronunciation/english/destination)
and US schwa for
[legislation](https://dictionary.cambridge.org/us/pronunciation/english/legislation),
while US
[syndication](https://dictionary.cambridge.org/us/dictionary/english/syndication)
uses schwa and UK KIT. The fixed CMU reference also gives KIT for syndication.
The current rules already render syndication with schwa, so its mismatch is a
reference/dialect disagreement. A diagnostic transformation replacing every
unstressed /ɪ/ before primary stress in this suffix family wins only 15 and
breaks 222 full-dictionary strict cases; the common slice wins 2 and breaks
25, while top-5000 loses 12 net. Root and derivative pairs such as
legislate/legislation/legislative/legislator/legislature also need distinct
stress and vowel frames. This suffix cluster does not define a safe class, so
no rule or reference was changed. The exact replay was a screening prototype,
not adoption evidence; it did not alter runtime predictions.

### Assimilated `ad-` before closed `-pt/-ft` roots (2026-10-19)

Cambridge US records root stress for [adopt](https://dictionary.cambridge.org/us/pronunciation/english/adopt),
[adapt](https://dictionary.cambridge.org/pronunciation/english/adapt),
[adept](https://dictionary.cambridge.org/us/pronunciation/english/adept), and
[adrift](https://dictionary.cambridge.org/pronunciation/english/adrift). The
rules-only path had shifted all four to initial stress. A structural stress
condition for the assimilated `a|d...pt/ft` shape now keeps the closed root
primary, including ordinary plural `-s`; paired controls retain adult,
address, and advent. No word map or reference change was added.

After `yarn build-dict`'s equivalent offline-safe pipeline completed, the
1,296,352-prediction snapshot changed 17 rows versus the frozen pre-candidate
snapshot: the four target roots, `adaptation` after dependency-aware exception
repinning, and 12 synthetic suffix probes. The four plural probes match the
frozen predictions after extending the condition. The rebuild produced 501
dependency-aware re-pins; the final exception table has 54,113 entries.

Final gates: English common strict/lenient **5,307/6,990** and
**6,358/6,990** (from 5,305/6,990 and 6,356/6,990); top-5,000 remains
2,858/3,617 strict and 3,345/3,617 lenient. Full rule-dictionary strict/lenient
is 62,144/105,067 and 83,595/105,067. Runtime parity remains 94,774/100,806
strict and 100,677/100,806 lenient; public CMU default remains 4,750/5,000,
rules-only 4,079/5,000 (its pre-existing 90% floor still fails). Stress-aware
phonemic is 54,627/90,310 (+126 against the committed baseline and +5 from the
frozen run); homographs remain 1,454/1,615; context cells remain 87/85/53/49.
Typecheck and all 331 Jest suites pass (6,490 tests). The ordinary +70 common
strict commit threshold remains unmet; keep the batch uncommitted and all
baselines unchanged.

### Rejected terminal `-ire` rhotic-vowel merge (2026-10-19)

The fresh 10-fold structural learner proposed changing final /ɹ/ to /ɝ/ after
`ire` in 9/10 folds, but it passed no fold's filter: mean support was 6.4
words and mean fix rate 0.59, below the 20-word and 0.75 requirements. The
pooled train-only evidence was +34/-8 strict, with +26/-0 among top-5,000
examples; these are screening counts, not held-out gains. Cambridge US
transcribes [hire](https://dictionary.cambridge.org/us/pronunciation/english/hire),
[empire](https://dictionary.cambridge.org/us/dictionary/english/empire),
[entire](https://dictionary.cambridge.org/us/dictionary/english/entire), and
[sapphire](https://dictionary.cambridge.org/us/pronunciation/english/sapphire)
with final /r/, while [acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)
uses /ɚ/. The spelling class would overwrite attested US variants to chase
CMU transcription differences, so no runtime rule or evaluation reference was
changed. Full fold evidence is in
`/tmp/phonemize-next-release/ad-prefix-final-learner/cv-common-report.json`.

Fresh non-structural strict and distance-objective runs on the current frozen
common population reach the same result: 47 and 30 accepted fold-candidates,
zero passing folds, and no held-out gain after the filter. The distance run's
five pooled readings include the same weak `-ire` candidate (9/10 accepted,
0/10 passed; train +34/-8, top-5,000 +26/-0); the others have mixed or
top-slice losses. Evidence:
`/tmp/phonemize-next-release/20261019-learner-current/cv-common-report.json`
and `/tmp/phonemize-next-release/20261019-distance-current/cv-common-report.json`.

### Stressed `pi-/pri-` roots before `-acy` (2026-10-19)

A structural spelling frame preserves PRICE in short primary-stressed `piC-acy`
and `priC-acy` forms, as in piracy, primacy, and privacy. Cambridge US gives
/aɪ/ in [privacy](https://dictionary.cambridge.org/us/pronunciation/english/privacy)
and [primacy](https://dictionary.cambridge.org/pronunciation/english/primacy);
its US [literacy](https://dictionary.cambridge.org/us/pronunciation/english/literacy)
entry keeps KIT in the neighboring `-acy` frame. The Cambridge Learner's entry
for [piracy](https://dictionary.cambridge.org/us/dictionary/learner-english/piracy)
also begins /paɪ/. The paired tests retain prison, literacy, accuracy, and the
plural forms privacies and piracies. No word-level pronunciation map or gold
reference changed.

The frozen 1,296,352-row snapshot's only direct rule changes are piracy,
primacy, and privacy. The rebuilt exception table changed 11 additional
synthetic morphology probes; review found those probes are invalid suffix
combinations, while real plurals remain unchanged. Rebuild repinned 501 entries
and produced 54,109 exceptions.

Final gates after rebuild: common strict/lenient **5,308/6,990** and
**6,358/6,990**; top-5,000 **2,859/3,617** strict and **3,345/3,617** lenient.
Full rule-dictionary strict/lenient is **62,147/105,067** and **83,595/105,067**.
Runtime parity remains 94,774/100,806 strict and 100,677/100,806 lenient.
Public CMU is 4,750/5,000 default and 4,080/5,000 rules-only (the latter's
legacy 90% floor still fails, but it increased by one). Stress-aware phonemic
is 54,630/90,310 (+129 against committed baseline); context cells remain
87/85/53/49 and homographs 1,454/1,615. Typecheck passes; all 332 Jest suites
pass (6,499 tests). The strict 90% release target remains unmet; baselines and
uncommitted accumulated changes stay intact.

### Stressed `any` and `many` roots (2026-10-19)

Cambridge US records the stressed vowel in [any](https://dictionary.cambridge.org/us/pronunciation/english/any)
and [many](https://dictionary.cambridge.org/us/dictionary/english/many) as /ɛ/.
The spelling frame applies only when the complete first syllable is stressed
`any` or `many`; it does not alter unstressed `a` in [company](https://dictionary.cambridge.org/us/pronunciation/english/company)
or [Germany](https://dictionary.cambridge.org/us/pronunciation/english/germany).
Tests also cover compounds such as anyhow, anywhere, and manyfold, plus controls
for Albany and Danny. No word-level pronunciation map or reference change was
added.

The frozen 1,296,352-row snapshot changed 34 outputs after rebuild: three direct
rule-path rows (`any`, `many`, `how-many`) and 31 morphology-generated probes.
The latter include malformed suffix combinations; review found legitimate
compound examples covered by tests and no additional direct lexical route
changes. Dependency-aware rebuilding repinned 502 entries and generated 54,100
exceptions. The five reported exception-miner regressions are
`caterings`, `fared`, `instituting`, `provance`, and `provence`; aggregate gates
below show no tracked metric regression.

Final gates: common strict/lenient **5,310/6,990** and **6,358/6,990**; top-5,000
**2,861/3,617** strict and **3,345/3,617** lenient. Full rule-dictionary
strict/lenient is **62,149/105,067** and **83,595/105,067**. Runtime parity
remains 94,774/100,806 strict and 100,677/100,806 lenient. Public CMU is
4,750/5,000 default and 4,082/5,000 rules-only (the latter's legacy 90% floor
still fails, but it increased by two). Stress-aware phonemic is 54,632/90,310
(+131 against committed baseline); context cells remain 87/85/53/49 and
homographs 1,454/1,615. Typecheck passes; all 333 Jest suites pass (6,509
tests). The English source modules remain at the 3,395-code-line compression
cap. The strict 90% release target remains unmet; baselines and uncommitted
accumulated changes stay intact. The fresh ten-fold common-word learner found
no candidate passing its legacy adoption filter in either ordinary or
structural mode, so no learner-proposed rule was added; the structural report
is at `/tmp/phonemize-rule-corrections/cv-common-report.json`.

The current mismatch report has 64 `-ted` and 15 `-ded` words ending in
productive past `-ed`. Many differ only because the fixed CMU gold uses schwa
where the rules emit /ɪ/. Cambridge US records /ɪd/ in
[wanted](https://dictionary.cambridge.org/us/pronunciation/english/wanted)
and [collected](https://dictionary.cambridge.org/pronunciation/english/collected),
matching the current engine. A blanket schwa rewrite would improve exact CMU
identity while making these common past forms less faithful to the checked
American dictionary; no such rewrite was adopted.

### Current metric refresh and postlex candidate rejection (2026-10-19)

Re-running the fixed common evaluator confirms 5,310/6,990 strict and
6,358/6,990 lenient; the top slice is 2,861/3,617 strict and 3,345/3,617
lenient. Public API CMU accuracy is 4,750/5,000 (95.00%). Fresh postlex
ablation found a one-word strict gain by removing the `-ett` KIT rule, affecting
only `Bennett` in the fixed testable populations. Collins's American entry
transcribes [Bennett](https://www.collinsdictionary.com/us/dictionary/english/bennett)
with /ɪ/, matching the current rule and contradicting this CMU gold row. The
score-only change was rejected; this is a reference discrepancy, not a
productive `-ett` rule gain. Repeated spell-out checks of
`-ical`, `-ing`, and `-dure` also found CMU disagreements with Cambridge or
Oxford American readings; no broad rule was changed to force those readings
into strict CMU identity. The direct ablation report is
`/tmp/phonemize-postlex-diagnosis/results.json`.

### Initial `coa` hiatus family (2026-10-19)

Cambridge US records the extra weak nucleus in
[coalition](https://dictionary.cambridge.org/us/pronunciation/english/coalition),
[coalesce](https://dictionary.cambridge.org/us/pronunciation/english/coalesce),
and [coalescence](https://dictionary.cambridge.org/us/pronunciation/english/coalescence).
The rule-path fix recognizes the initial `coa` spelling before `lesc` and
`lition`; it adds no pronunciation map. Tests pair these roots and inflections
with `coal`, `coaling`, `coauthor`, and `cooperate` controls.

The frozen 1,296,352-row prediction snapshot changes 10 outputs: three direct
rule-path forms (`coalition`, `coalition's`, `coalesce`) and seven synthetic
morphology probes. Full-dictionary rules improve from 62,149 to 62,152 strict
with lenient unchanged at 83,595. Common strict improves by one to 5,311/6,990;
common lenient stays 6,358/6,990 and top-slice strict/lenient stay
2,861/3,617 and 3,345/3,617. Runtime parity stays 94,774/100,806 strict and
100,677/100,806 lenient. Public CMU is 4,750/5,000 default and 4,082/5,000
rules-only (the legacy rules-only floor remains unmet, with no decrease).
Stress-aware phonemic is 54,634/90,310 (+133 to baseline); context remains
87/85/53/49 and homographs 1,454/1,615. All 334 Jest suites / 6,517 tests and
typecheck pass. Rollup and extracted CJS/ESM main/core/English checks pass for
the new rule readings and O'Reilly Media in a sentence. The five English
modules remain at the 3,395-line cap. No baseline was refreshed or commit made:
the ordinary +70 strict commit threshold and 90% release target remain unmet.
Evidence is under `/tmp/phonemize-next-release/dure-prefreeze/`.

### Rejected broad initial `re-u` hiatus split (2026-10-19)

A narrower trial composed `re-` only before a vouched `u`-initial root, so `Reuben` remained intact and `reunion` gained a root-aware reading. It changed eight rows in the frozen snapshot, but common strict and top-slice scores stayed flat; full-dictionary rules strict fell 62,152→62,150, stress-aware phonemic fell 54,634→54,632, and lenient rose only one. `reunite` also inherited a secondary stress from the CMU stem that Cambridge does not show. The morphology trial was removed under the nondecreasing-gates contract. Evidence is under `/tmp/phonemize-next-release/re-u-root-prefreeze/`.

### Refreshed common route audit (2026-10-19)

The current fixed evaluator confirms 5,311/6,990 strict and 6,358/6,990 lenient; disabling morphology drops these to 4,675 and 5,888, and the unsplit route gives 4,562 and 5,811. Thus the remaining work depends on preserving and tightening useful morphology, not removing it. Postlex ablation's only positive common strict delta is still the `-ett` rule on `Bennett`; Cambridge-backed US /ɪ/ evidence keeps that score-only CMU correction rejected. Fresh evidence: `/tmp/phonemize-route-diagnosis/report.json` and `/tmp/phonemize-postlex-diagnosis/results.json`.

### Re-screened sibilant plural `-es` vowel (2026-10-19)

Replacing final `/əz/` with `/ɪz/` repairs isolated CMU cases such as `searches`,
but it is not a safe general correction for this fixed cohort. A fresh output-only
screen across 6,990 common and 3,617 top-slice items found net losses in every
spelling-ending bin with at least two examples; for instance `-ches` was +0/-12
strict and `-ges` +3/-21. This agrees with the earlier full-table probe: public
CMU strict rose by 9 while common strict fell by 67 and top-slice strict by 36.
No rule or reference was changed. Reproducible grouped results and source hashes:
`/tmp/phonemize-next-release/20261019-sibilant-es-screen.json`.

### Common initial-vowel candidate audit (2026-10-19)

An output-only prefix scan found three common wins and no losses for changing
initial `/ɪ/` to `/ɛ/` after written `extr-` (`extract`, `extraction`,
`extreme`). This is a reference-driven false lead: Cambridge gives US
`/ɪkˈstriːm/` for [extreme](https://dictionary.cambridge.org/pronunciation/english/extreme),
and it distinguishes `/ˈekstrækt/` noun from `/ɪkˈstrækt/` verb for
[extract](https://dictionary.cambridge.org/us/dictionary/english/extract).
No general `extr-` change was adopted. The small `esta-` screen repairs
`estate`, whose US entry is /ɪˈsteɪt/, but the broader written frame also
contains roots and names with other readings; no rule was adopted from this
one-word family signal. Prefix-bin evidence is in
`/tmp/phonemize-next-release/20261019-initial-vowel-prefix-screen.json` and
`/tmp/phonemize-next-release/20261019-initial-e-vowel-screen.json`.

The isolated strong form of `are` is authoritatively /ɑr/ and the productive
`-are` rime is /ɛr/. A `custom.dict` entry would be a lexical override and does
not reach the rules-only evaluator; a whole-word rule exception is disallowed.
The trial mapping and its temporary test were removed without changing source
data or runtime output. The frozen full gate results and 1,296,352-row snapshot
for that check are under `/tmp/phonemize-next-release/are-strong-form-prefreeze/`.

### Final `-ilities` schwa screen (2026-10-19)

An output-only replay that changes `/ɪ/` to `/ə/` before final `/ti(z)/` in
spellings ending `-ility/-ilities` gives +3/-0 on the common subset (5,314/6,990)
and +2/-0 on its top-5000 slice. Across the full rules dictionary it changes
seven words: three source-reference wins (`disabilities`, `facilities`,
`liabilities`) and four losses (`instability`, `instabilities`, `sensibilities`,
`vulnerabilities`), for a net decrease of one. The class therefore fails the
all-metrics nondecrease gate. Cambridge US transcribes [facility](https://dictionary.cambridge.org/us/dictionary/english/facility)
with the reduced vowel and [liability](https://dictionary.cambridge.org/us/dictionary/english/liability)
with schwa in the same position, supporting those individual predictions but
not the class-wide transformation. No rule or reference was changed. Current
route clusters are in `/tmp/phonemize-next-release/20261019-common-cluster-fresh.log`.

### `ei` before `ther` variant (2026-10-19)

The rules-only `ei` default gave /eɪ/ for `either` and `neither`, while both
have an /aɪ/ American variant in [Cambridge US either](https://dictionary.cambridge.org/us/dictionary/english/either)
and [Cambridge US neither](https://dictionary.cambridge.org/us/dictionary/english/neither);
Cambridge lists no /eɪ/ variant. Added the contextual grapheme rule for `ei`
before the following `ther` syllable, without a whole-word map. Existing
dictionary-first readings remain intact. Paired regressions check rules and
default paths, complete sentences, and `weight`, `height`, `their` and `theory`
controls.

The frozen 1,296,352-row snapshot changes eight outputs: the four dictionary
words `either`, `neither`, `reither` and `seither`, plus four synthetic
morphology probes (`eighther`, `feither`, `keither`, `veither`). Every changed
dictionary row is a strict win; there are no tracked losses. Full rules improve
from 62,152 to 62,156 strict with lenient unchanged at 83,595. Common strict
improves 5,311→5,313/6,990 and top-slice strict 2,861→2,863/3,617; both lenient
counts remain unchanged. Runtime parity remains 94,774/100,806 strict and
100,677/100,806 lenient. Public CMU default stays 4,750/5,000; rules-only rises
4,082→4,084/5,000 (its existing 90% floor remains unmet). Stress-aware
phonemic and exact each improve by four to 54,638 and 45,406. Context remains
87/85/53/49 and homographs 1,454/1,615. Dictionary rebuild, 335 Jest suites /
6,522 tests, typecheck and `test:ipa` pass. The five-module code-line count is
unchanged. This is retained in the accumulating batch; it is below the ordinary
+70 common-strict commit threshold and no baseline was refreshed.

### Weak vowel in final `-imum` (2026-10-19)

Cambridge US gives schwa in [maximum](https://dictionary.cambridge.org/us/dictionary/english/maximum)
and [optimum](https://dictionary.cambridge.org/us/dictionary/english/optimum).
The rules path had /ɪ/ in the unstressed `i` syllable immediately before final
`mum`; the contextual correction reduces that vowel and leaves the already
reduced `minimum` path intact. Tests cover the three superlatives, their common
`-s` forms, `premium`, and full sentence contexts.

This changes only the rules-path outputs for `maximum` and `optimum` in the
1,296,352-row frozen snapshot. Both are strict wins; no tracked loss appears.
Combined with the `ei`-before-`ther` correction, full rules strict is
62,158/105,067 (+6 from freeze) and lenient remains 83,595. Common strict is
5,315/6,990 (+4) and top-slice strict 2,864/3,617 (+3); lenient counts remain
6,358 and 3,345. Runtime parity stays 94,774/100,806 strict and 100,677 lenient.
Public CMU default stays 4,750/5,000; rules-only reaches 4,085/5,000 (+3 from
freeze; its existing 90% floor remains unmet). Stress-aware phonemic remains
54,638 and exact improves to 45,408. Context is unchanged at 87/85/53/49,
homographs at 1,454/1,615. All 336 Jest suites / 6,527 tests, typecheck,
`test:ipa`, Rollup and CJS/ESM smoke checks pass. No baseline was refreshed;
the overall common strict target remains 977 words away.

### Negative-prefix past-tense /tɪd/ (2026-10-19)

Oxford's [*-ed* suffix entry](https://www.oxfordlearnersdictionaries.com/definition/english/ed_3)
gives the syllabic /ɪd/ allomorph after /t/ or /d/. Several un-/dis-/non-
morphology paths were instead returning schwa in their final /təd/; a narrowly
scoped `applyPostStress` rule restores /tɪd/ for that negative-prefix frame.
Paired tests cover un-, dis- and non- forms, unprefixed /t/-final past forms,
already-correct prefixed controls, and full sentences. A broader final-`-ted`
replacement was rejected: it made `coexisted` leave the one-edit lenient radius.

The frozen 1,296,352-row snapshot changes 44 outputs across the three accepted
rules: `ei` before `ther`, weak `-imum`, and negative-prefix `-ted`. All changed
dictionary rows improve strict or retain their status; the synthetic morphology
probes were reviewed. Against the original freeze, full rules strict/lenient
reach 62,174/83,597 (+22/+2); common strict is 5,317/6,990 (+6) with lenient
6,358 unchanged; top-slice strict is 2,865/3,617 (+4) with lenient 3,345
unchanged. Runtime parity remains 94,774/100,806 and 100,677/100,806. Public
CMU default remains 4,750/5,000; rules-only is 4,086/5,000. Stress-aware
phonemic is 54,638 and exact 45,413. Context stays 87/85/53/49 and homographs
1,454/1,615. The rebuilt tables are unchanged; all 337 Jest suites / 6,532
tests, typecheck, IPA gates, Rollup and CJS/ESM smoke checks pass. No baseline
was refreshed or commit made; common strict is still 975 words short of 90%.

### Reilly spelling-family check (2026-10-19)

The default dictionary and `O'Reilly Media` sentence route return the checked
`/aɪ/` reading. Rules-only `Reilly` and `O'Reilly` return `/eɪ/`. Cambridge US
records [Reilly](https://dictionary.cambridge.org/us/pronunciation/english/reilly)
as `/ˈraɪ.li/`, but the spelling is not a productive `ei...lly` vowel class:
the pinned dictionary has `mcneilly` with `/i/`, and the unapostrophized
`oreilly` entry has a separate reading. No generic rule was adopted because
the superficially shared spelling frame has conflicting name roots; this is
foreign proper-name coverage, not evidence for a broad `ei` correction. The
existing apostrophe/name regressions continue to cover the default dictionary
path and O'-prefix tokenization.

### Rejected final `-ire` rhotic-vowel rewrite (2026-10-19)

The refreshed 10-fold structural learner repeatedly proposed changing final
`-ire` /ɹ/ to /ɝ/ (accepted in 10/10 folds), but its own filter rejected it in
all folds: only 5–7 words were affected and the fix rate was 0.50–0.67, below
the required 20 examples and 75%. The apparent CMU strict wins are not a
general US pronunciation rule. Cambridge transcribes [acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)
US /əˈkwaɪɚ/, but [desire](https://dictionary.cambridge.org/us/pronunciation/english/desire),
[empire](https://dictionary.cambridge.org/us/pronunciation/english/empire),
[require](https://dictionary.cambridge.org/us/pronunciation/english/require),
[vampire](https://dictionary.cambridge.org/us/pronunciation/english/vampire),
and [fire](https://dictionary.cambridge.org/us/pronunciation/english/fire) with final /aɪr/.
No runtime rule was adopted. The pinned report is
`/tmp/phonemize-rule-corrections/cv-common-report.json`; the learner covered
5,098/6,990 common words and none of its 51 accepted fold-rules passed the
legacy diagnostic filter.

### Contextual `ough` rimes (2026-10-19)

Cambridge US gives /θruː/ for [through](https://dictionary.cambridge.org/us/pronunciation/english/through), /ðoʊ/ for [though](https://dictionary.cambridge.org/us/pronunciation/english/though), and /ɑːlˈðoʊ/ for [although](https://dictionary.cambridge.org/us/pronunciation/english/although). The rules path had treated these as the weak /ʌ/ `ough` class and then devoiced /ð/ in `although`. The candidate now recognizes the `through` and `though` morphemes and preserves voiced /ð/ in the latter. Paired tests cover both dictionary and rules paths, `although` sentence context, and the distinct `rough`, `tough` and `thought` rimes.

After rebuilding, the frozen 1,296,352-row snapshot has three direct dictionary-word wins (`through`, `though`, `although`) and no direct losses; changed synthetic forms were reviewed. Full rules strict/lenient reach 62,177/83,600 (+3/+3 from the prior freeze). Common strict/lenient remain 5,317/6,358 and top-slice 2,865/3,345. Runtime parity remains 94,774/100,806 strict and 100,677/100,806 lenient. Public CMU default remains 4,750/5,000; rules-only improves to 4,089/5,000. Stress-aware phonemic/exact are 54,638/45,413, context remains 87/85/53/49, and homographs 1,454/1,615. All 338 Jest suites / 6,536 tests, typecheck and rebuild pass. The strict common-word target is still unmet, and this small gain remains in the accumulating batch without a baseline refresh or commit.

The required neutral compression folds the secondary-mark condition into the existing post-stress initializer. It restores the five-module total to the retained 3,395-line cap (g2p 1,148, syllabify 1,700, postlex 497, morph-table 24, morph-parser 26); the pre/post snapshots are byte-identical (SHA-256 `ca4773781f75ba85b2d05fb6ee83dcbf7f8d4610f05aba079e2c3d6f9496c9ac`).

### Common-word structural candidate replay (2026-10-19)

A fresh 10-fold spelling-family replay covers the fixed 6,990-word population, with 5,097/6,990 (72.92%) in the pure rules-path scope. It accepted 62 training candidates and none passed the held-out filter. Applying all accepted candidates together lowers held-out strict from 3,783/5,097 to 3,763/5,097, so none were adopted. The leading `ire`→`ɝ` template has only five to seven affected words per fold and repeatedly breaks `vampire`; the learner rejects it for minimum support and fix-rate failures. Report: `/tmp/phonemize-rule-corrections/cv-common-report.json` (dictionary SHA-256 `bcc7bf270bfe939b9284696ad4fdd0bb774a172af3529c446e24ecbd7c4ef7d6`, frequency SHA-256 `981c776dc7e8996accb256e5fea9d241331b9602efe0c977285734890e1ae729`). These broad grapheme substitutions do not support a safe class change; the fixed common-word release target remains 5,317/6,990 strict, 975 correct words short of 90%.

Two common reduction candidates also failed replay. Changing final `-ical` /ɪkəl/ to /əkəl/ changes 28/90 strict wins/losses in the full dictionary, 10/27 in the common subset and 6/13 in top-5000. Replacing the syllabic `-ed` vowel /ɪ/ with /ə/ after written `t` or `d` changes 245/523 full-dictionary words, 60/46 common words and 28/19 top-slice words. Both fail the no-regression gate; the suffix forms also have legitimate pronunciation variation, so neither blanket change was adopted.

The `-ical` losses include pronunciations supported by Cambridge US: [medical](https://dictionary.cambridge.org/us/pronunciation/english/medical), [political](https://dictionary.cambridge.org/us/pronunciation/english/political) and [practical](https://dictionary.cambridge.org/us/pronunciation/english/practical) retain /ɪ/ before /kəl/. Their CMU gold entries instead use /ə/ in that position. The current rule readings match the independent dictionary, so optimizing this mismatch cluster with a blanket schwa substitution would move away from documented US pronunciations.

### Common-word route split (2026-10-19)

Replayed `trace()` on the exact benchmark population after its testability and foreign-origin filters. Of 6,990 words, the pure rules route covers 5,099 with 3,784 strict-correct (74.21%); morphology covers 1,584 with 1,264 correct (79.80%); compound dispatch covers 307 with 269 correct (87.62%). The largest remaining source is the pure rules path (1,315 errors), so the next class search prioritizes spelling/phonological context there. Morphology contributes 320 errors but remains net essential: the frozen route diagnosis measured 5,317 strict with morphology versus 4,680 when removed. No runtime or reference changes were made in this replay.

### Structural learner and initial `en-` replay (2026-10-19)

The structural spelling-family learner was rerun against the unchanged 6,990-word
population and current dictionary/frequency hashes. It proposed 62 fold-local
training readings across ten folds; none passed its held-out filter. The
highest-ranked `ire`→/ɝ/ candidate remains unsupported at this sample size and
breaks `vampire`. A separate first-syllable `en-` /ɛn/→/ɪn/ simulation yielded
two strict wins, 19 strict losses and one lenient-only change in the full
common subset; the top-5000 slice had zero strict wins, seven strict losses and
one lenient-only change. This is not a productive prefix rule and was discarded. The official evaluator
remains 5,317/6,990 strict and 2,865/3,617 top-5000 strict; no runtime code or
baseline changed.

### POS-sensitive `aff-` / `-fect` probe (2026-10-19)

The common-list `affect` miss is context-sensitive: the rules-only bare form is
`/ˈæfɛkt/`, while the pinned benchmark's default verb is `/əˈfɛkt/`. Cambridge
US confirms both the verb `/əˈfekt/` and the noun `/ˈæf.ekt/`
([entry](https://dictionary.cambridge.org/us/dictionary/english/affect)). The
existing POS tagger correctly distinguishes `may affect` as a verb and
`the affect` as a noun, but the rules-only fallback does not feed that POS
into stress assignment. A stress-only `af-` rewrite would therefore fail the
noun control; this needs a POS-aware morphological solution rather than a
bare prefix substitution. The default dictionary route already selects both
readings correctly, so no runtime change was made in this probe.

### Top-slice vowel mismatch source check (2026-10-19)

A frequency-ranked, same-length vowel comparison finds 136 top-5000 occurrences
where the rules path has /ɪ/ and pinned CMU has /ə/ (271 occurrences across
the full common subset). This is not one spelling class: the leading examples
include `America`/`American`, `image`, `article`, and `medical`. Cambridge US
documents /ɪ/ in [America](https://dictionary.cambridge.org/us/pronunciation/english/america),
[American](https://dictionary.cambridge.org/us/dictionary/english/american),
[image](https://dictionary.cambridge.org/us/pronunciation/english/image),
[article](https://dictionary.cambridge.org/us/pronunciation/english/article),
and [medical](https://dictionary.cambridge.org/us/dictionary/english/medical),
matching the rule outputs rather than CMU's schwa transcriptions. Together with
the separately replayed `-ical` and syllabic `-ed` losses, this rules out a
blanket weak-vowel substitution as a valid way to close the exact-CMU gap. No
reference or runtime changes were made; the next search needs distinct
phonological/morphological classes with source-checked readings.

### Weak initial /æ/ candidate replay (2026-10-19)

Simulated changing an initial predicted /æ/ to /ə/ whenever the primary stress
was later in the word. On the fixed population this loses 26 strict words in
the common subset and 14 in top-5000; the full 105,067-word testable dictionary
loses 150. It repairs `advance` and `Atlantic`, but breaks 28 common words,
including `admission`, `advantage`, `adventure`, `advice`, `advisor`, and
`activity`. Cambridge US itself records both weak /ə/ in [advance](https://dictionary.cambridge.org/us/pronunciation/english/advance)
and /æ/ in [advertise](https://dictionary.cambridge.org/us/dictionary/english/advertise),
so stress position and a written initial `a` do not define a reliable class.
The global reduction candidate was rejected; no source pronunciation or
runtime output changed.

### Productive `-tariat` stress frame (2026-10-19)

The rule path previously stressed the preceding syllable in `secretariat`,
`proletariat`, and `commentariat`, and assigned the final `-ariat` sequence
the wrong vowels. Cambridge US records the shared stressed `-ter-i-ət` frame
for [secretariat](https://dictionary.cambridge.org/us/pronunciation/english/secretariat),
[proletariat](https://dictionary.cambridge.org/us/pronunciation/english/proletariat),
and [commentariat](https://dictionary.cambridge.org/us/dictionary/english/commentariat).
The stress rule now selects the syllable immediately before `-riat` when the
syllabifier exposes the `-ta-riat` boundary. The separate `lariat` reading is
paired as a control and remains unchanged. This adds no word-specific mapping.

The frozen 1,296,352-row snapshot changed exactly those three rules-path
predictions; dictionary, morphology, and POS rows were unchanged. After
rebuilding via `node --require tsx/cjs scripts/build-dict.ts`, the 109,147-row
CMU table retained its pre-build SHA-256
`bcc7bf270bfe939b9284696ad4fdd0bb774a172af3529c446e24ecbd7c4ef7d6`. Full rules
strict stayed 62,177/105,067 and lenient rose 83,600→83,602. Common strict
stayed 5,317/6,990 and lenient rose 6,358→6,359; top-5000 stayed
2,865/3,617 strict and 3,345 lenient. Runtime parity stayed 94,774/100,806
strict and 100,677 lenient; public CMU default stayed 4,750/5,000, and
rules-only stayed 4,089/5,000. Stress-aware phonemic rose by one to 54,639;
context IPA remained 87/85/53/49 and homographs remained 1,454/1,615. The
apostrophe issue regressions and new suffix controls, typecheck, and all
post-rebuild no-regression gates passed. The rules-only CMU report still does
not meet its legacy 90% floor, but it did not regress. This is a small
lenient/stress-aware gain, not progress on the requested strict threshold:
common strict remains 975 words short of 90%, with no baseline refresh or
commit.

The five English rule modules total 3,394 code lines after this change, below
the retained 3,395-line cap; the `-tariat` condition was folded into the
existing stress-selection branch, so no compression pass was needed.

### Weak temporal `to-` compounds (2026-10-19)

The fixed frequency list ranks `today` 284th and `tonight` 3,609th. The rules
path stressed their first syllable and read `to` as /toʊ/; Cambridge US gives
/təˈdeɪ/ for [today](https://dictionary.cambridge.org/us/pronunciation/english/today)
and /təˈnaɪt/ for
[tonight](https://dictionary.cambridge.org/us/pronunciation/english/tonight).
Stress assignment now recognizes two-syllable `to` + `day`/`night`
compounds and their plural forms. `total`, `tonic`, `tomorrow`, and `holiday`
remain paired controls.

The final pre/post rebuild snapshot is byte-identical across 1,296,352 rows.
The first build exposed a lenient regression on `todays`; extending the same
boundary rule to plural `days`/`nights` restored that reading, and the second
build kept the corrected output. It reports 502 dependency-aware re-pins and
five existing net-check regressions (`caterings`, `fared`, `instituting`,
`provance`, `provence`). Final full-dictionary rules strict/lenient are
62,180/105,067 and 83,607/105,067; common is 5,319/6,990 strict and 6,361
lenient; top-5000 is 2,867/3,617 strict and 3,347 lenient. Public CMU is
4,750/5,000 default and 4,091/5,000 rules-only. Runtime parity remains
94,774/100,806 strict and 100,677 lenient. Stress-aware phonemic/exact are
54,641/45,415; context IPA and homographs remain 87/85/53/49 and 1,454/1,615.
The full test suite (340 suites / 6,548 tests), typecheck, Rollup and all
post-rebuild no-regression gates pass. The rules-only CMU command still reports
its existing sub-90% legacy floor, while its count is nondecreasing. The common
strict score is 49/70 words toward the ordinary commit threshold of 5,340/6,990
and 973 words short of the requested >90% target. No baseline refresh or
commit was made.

The five English rule modules total exactly 3,395 code lines, at the retained
cap; no compression trigger was crossed.

### Strong `to` and `-to` compounds (2026-10-19)

The rules path read standalone strong `to`, `into`, and `onto` with /oʊ/. The
rule now uses /u/ for a stressed standalone `to` syllable and for the final
`to` syllable after `in`, `on`, or `un`. Cambridge records US strong /tuː/ and
weak /tə/ for [to](https://dictionary.cambridge.org/us/pronunciation/english/to),
and /tuː/ for [into](https://dictionary.cambridge.org/pronunciation/english/into),
[onto](https://dictionary.cambridge.org/us/pronunciation/english/onto), and
[unto](https://dictionary.cambridge.org/pronunciation/english/unto). The
ordinary final `-to` controls `photo`, `pinto`, and `tonto` retain /oʊ/; the
sentence-level weak form in “I want to go” remains /tə/.

Actual rule replay changed four words, all strict wins and no losses (`to`,
`into`, `onto`, `unto`); three are in the fixed common subset. After the
dictionary rebuild, 1,296,352 snapshot rows had four changed derived forms
(`intoed`, `intoing`, `ontoed`, `ontoing`) from dependency-aware table
regeneration; all other rows matched. The rebuilt CMU table hash remains
`bcc7bf270bfe939b9284696ad4fdd0bb774a172af3529c446e24ecbd7c4ef7d6`, and
repinning remained 502 entries.

Post-build full rules strict/lenient are 62,183/105,067 and 83,610/105,067.
Common strict/lenient are 5,322/6,990 and 6,364; top-5000 strict/lenient are
2,869/3,617 and 3,349. Public CMU is 4,750/5,000 default and 4,094/5,000
rules-only; the latter remains below its legacy 90% floor but is nondecreasing.
Parity remains 94,774/100,806 strict and 100,677 lenient; stress-aware
phonemic/exact are 54,643/45,417; context IPA remains 87/85/53/49 and
homographs 1,454/1,615. All 341 Jest suites (6,555 tests), typecheck, Rollup,
and post-build gates pass. No baselines were refreshed.

The common strict count is now 52/70 words toward the ordinary commit gate
of 5,340/6,990, and 970 words short of strictly exceeding 90% (6,292/6,990).
The rejected stressed `-key` experiment gained `key` but broke `Keynes`,
`Keylon`, and `Rukeyser`, so it was removed. The TRAIN-only learner found no
candidate that passed its legacy diagnostic filter across spelling-family
folds. The five English rule modules remain at the 3,395-line cap.

### Strong `to`, consonant-only initialisms, and ordinal `nth` (2026-10-19)

The final stressed `to`-rime rule uses /u/ for strong standalone `to` and the
final syllable of `into`, `onto`, and `unto`, while weak sentence-level `to`
and ordinary `-to` controls retain their prior readings. Cambridge records
strong /tuː/ and weak /tə/ for [to](https://dictionary.cambridge.org/us/pronunciation/english/to),
and /tuː/ for [into](https://dictionary.cambridge.org/pronunciation/english/into),
[onto](https://dictionary.cambridge.org/us/pronunciation/english/onto), and
[unto](https://dictionary.cambridge.org/pronunciation/english/unto). Paired
tests cover `photo`, `pinto`, `tonto`, and “I want to go.”

An all-consonant spelling fallback now uses existing letter-name pronunciations
for otherwise unsupported sequences. It preserves hummed forms, `sh`, and
ordinal `-nth`; Greek `gm` controls remain on the phonological route. Tests cover
`pm`, `dvd`, `cd`, `pc`, and `tv`, along with `pgm` and `mgm` controls. On the
fixed CMU list, rules-only accuracy is 4,128/5,000 (82.56%), up from the prior
4,091 baseline; the legacy 90% rules-only floor still fails. The default public
API is 4,751/5,000 (95.02%), passing its 90% gate.

Cambridge US gives `nth` /ɛnθ/. That pronunciation is in
`src-data/en/custom.dict`; the exception miner now treats `th` as a digraph
when deciding whether an upstream word lost /t/. This also stops that rule from
discarding other `nt+h` spellings such as `anthem`. The rebuilt dictionary
retains the pinned CMU source hash and re-pin count of 502. `nth` returns
/ˈɛnθ/ on the shipped dictionary route; the rules-only /ˈnθ/ remains an open
class limitation rather than a whole-word runtime map.

The post-rebuild snapshot contains 1,296,352 predictions. Relative to the
immediately preceding initialism candidate, the retained Greek-`gm` controls
change seven rule/morph rows (`gm`, `gmbh`, `mgm`, `pgm`, `gms`, `gmbhs`,
`pgms`); full test, common, stress, and context metrics were then rerun. The
candidate's changed predictions were replayed through the actual default and
rules routes, and `issue-28.test.ts` continues to cover O'Brien and O'Reilly
Media without a brand-specific mapping.

After this batch, full-dictionary rules strict/lenient are 62,187/105,067 and
83,610/105,067. Common strict/lenient are 5,322/6,990 and 6,364; top-5000
strict/lenient are 2,869/3,617 and 3,349. Public CMU default/rules are
4,751/5,000 and 4,128/5,000. Runtime parity is 94,775/100,806 strict and
100,678/100,806 lenient. Stress-aware phonemic/exact are 54,645/45,417;
homographs are 1,454/1,615; context IPA remains 87/85/53/49. All 342 Jest
suites (6,569 tests), typecheck, Rollup, and the focused Greek/initialism tests
pass. Rollup retains its existing named/default export and external `pinyin-pro`
warnings. No baseline was refreshed or commit made.

Common strict gained three words this batch but remains 18 short of the next
ordinary commit gate (5,340/6,990) and 970 short of strictly exceeding 90%
(6,292/6,990). The `-key` trial remains rejected and the spelling-family learner
still has no candidate that passes its diagnostic filter. The next failure
clusters are dominated by lexical vowel/stress variation and names; no broad
class change has passed paired replay yet.

### Final `-ow` screen (2026-10-19)

Refreshed `evaluate-common-accuracy.ts --rules` against the pinned CMU snapshot
and traced `now`, `wow`, and neighboring `-ow` words through the actual rules
route. Replacing final /oʊ/ with /aʊ/ across the 13 monosyllabic `-ow` forms in
the fixed top-5,000 set would repair `now` and `wow`, but break ten correct
forms including `know`, `show`, `low`, `flow`, `snow`, `blow`, `slow`, `grow`,
and `throw`; `how` is unaffected because its existing MOUTH rule already
matches. The candidate is net-negative and the onset contrasts do not support
a broader spelling rule, so no runtime change was made. The refreshed rules
score remains 4,128/5,000; the common strict target and all existing baselines
remain unchanged.

The same refreshed CMU report contains 18 top-5,000 `wh` words. A trial
normalizing the existing /hw/ rule output to /w/ changes none of their strict
verdicts: every affected row accepts the /w/ variant, while words such as
`whole` already use /h/. The common `whilst` miss also has an independent
vowel error. This consonant substitution offers no score gain, so the existing
`who/whole/whom/whose` onset controls and general `wh` rule remain unchanged.

### Expanded structural learner screen (2026-10-19)

Added a research-only `--expanded` mode to the TRAIN-only family-fold learner
to test pairwise spelling/stress feature interactions through actual rule
replay. It did not produce an adoptable class: zero candidates passed the
legacy diagnostic filter in any of ten folds. Applying all selected candidates
also reduced held strict from 3,788/5,098 to 3,777/5,098, lenient from
4,561/5,098 to 4,547/5,098, and increased total edit distance from 2,230 to
2,264. No runtime rules or baselines changed.

The most repeated proposal changed unstressed /ɪ/ to /ə/ for a spelling
environment ending in `tin`. Although the fold-aggregate report showed strict
training wins, it had fewer than 20 affected cases per fold and a top-slice
distance regression. Cambridge records US `bulletin` and `Latin` with /ɪ/ in
the final syllable, while US `Martin` has /ə/ ([bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin),
[Latin](https://dictionary.cambridge.org/us/dictionary/english/latin),
[Martin](https://dictionary.cambridge.org/us/pronunciation/english/martin)).
The same local spelling therefore has real lexical variation; keep this
candidate rejected unless a narrower, independently supported class passes
full paired replay and all accuracy gates.

### Three-condition structural learner screen (2026-10-19)

Extended the offline learner with `--triples`, combining local spelling and
stress cues with syllable position/count, morphology class, prefix and syllable
weight. The fixed common population and family folds were unchanged; replay
covered the same 5,098/6,990 pure rules-path words. Across ten folds, 111
candidates were selected and none passed the existing filter. The selected
candidate bundle lowered held strict from 3,788 to 3,774/5,098, lenient from
4,561 to 4,552, and raised edit distance from 2,230 to 2,260. The most
consistent proposal was again unstressed `tin` /ɪ/→/ə/ (fold aggregate +55/−0
training strict), but it remained under the support threshold and conflicts
with Cambridge's /ɪ/ in `bulletin` and `Latin`. No runtime rule or baseline
changed; the 90% gaps remain 970 common and 387 top-slice words.

### Rejected weak `cen` before `tr` trial (2026-10-19)

Cambridge confirms schwa for the `cen` syllable in [concentrate](https://dictionary.cambridge.org/us/dictionary/english/concentrate)
and [concentrator](https://dictionary.cambridge.org/pronunciation/english/concentrator),
while their stressed control `concentric` retains /ɛ/. The broad trial
centralizing any unstressed `cen` before `tr` fixed `concentrate` in the common
rules slice (+1 strict, no lenient change), but its actual 1,296,352-row
snapshot also changed `centralia`, `centrality`, `centrella`, `centronics`,
`eccentricity` and derived forms. That trial reduced full-dictionary strict by
one and was removed. A narrower `con` + `tra` context avoided those unrelated
lexemes and, after rebuilding, raised common strict 5,322→5,323/6,990 and full
strict 62,187→62,188/105,067. However, stress-aware exact fell 45,417→45,416:
the derived forms `concentrated` and `concentrating` lost the secondary-stress
boundary. Under the no-regression gate this candidate was also removed. Source
and dictionary have been restored and rebuilt; final restored-source scores
are being rechecked. Trial snapshots are saved under
`/tmp/phonemize-next-release/concentr-cen-prefreeze/`; no baseline changed.

### Distance-objective learner and `-vey` screen (2026-10-19)

A second ten-fold family-held-out run optimized edit distance with structural
features. It accepted 36 fold-local rules, but none passed the existing
train-only diagnostic filter; held-out strict stayed at a 74.30% mean before
and after the passing-rule set. Its strongest repeated `ire`→/ɝ/ proposal
repairs some common spellings but breaks `vampire`, so it remains rejected.

An output-only `-vey` replay is also unsafe as a general ending rule: changing
final /vi/ to /veɪ/ affects 57 full-dictionary rows, with 6 strict wins and 34
losses. The fixed common subset has one win (`survey`) and one loss
(`Harvey`). Cambridge confirms /kənˈveɪ/ for [convey](https://dictionary.cambridge.org/us/pronunciation/english/convey),
/pɚˈveɪ/ for [purvey](https://dictionary.cambridge.org/us/dictionary/english/purvey),
and /ˈsɝˌveɪ/ for [survey](https://dictionary.cambridge.org/us/pronunciation/english/survey),
but that lexical class does not license the same change in surname endings.
No runtime rule or baseline changed. Final restored-source gates are
5,322/6,990 common strict, 2,869/3,617 top-slice strict, and 62,187/105,067
full-dictionary strict; no candidate passed the adoption screen.

### Assimilated `sub-` before four `p` roots (2026-10-19)

Treat `sup-` as a weak allomorph of `sub-` only before `port`, `pose`, `press`,
and `plant`. This fixes the direct rules predictions for `support`, `suppose`,
`suppress`, and `supplant`, while `supper`, `supple`, `supply`, `supine`, and
`super-` controls retain their earlier analyses. Cambridge US gives
/səˈpɔrt/, /səˈpoʊz/, /səˈpres/, and /səˈplænt/ for [support](https://dictionary.cambridge.org/pronunciation/english/support),
[suppose](https://dictionary.cambridge.org/pronunciation/english/suppose),
[suppress](https://dictionary.cambridge.org/pronunciation/english/suppress),
and [supplant](https://dictionary.cambridge.org/us/pronunciation/english/supplant).
`supposition` remains a control because its first syllable is strong.

The frozen 1,296,352-row prediction replay changed only those four `rule`
rows; dictionary and morphology rows were identical. After rebuilding, full
rules strict rose 62,187→62,188/105,067 and lenient stayed 83,610. Common
strict/lenient stayed 5,322/6,364 of 6,990, and top-5000 stayed 2,869/3,349
of 3,617. Stress-aware phonemic rose 54,645→54,647 and exact rose
45,417→45,420; vowel and structural error buckets each fell by one or two.
Runtime parity, homograph, and all four context-IPA cells stayed unchanged.
The public CMU default is currently 4,750/5,000 (95.00%), and rules-only is
4,128/5,000 (82.56%). A same-table replay with only this candidate removed
scored 4,748/5,000, so the default API improves by two and clears its 90%
gate; the legacy rules-only 90% floor remains unmet. Focused prefix/apostrophe
tests, the full Jest suite (343 suites, 6,580 tests), typecheck, Rollup, and
`git diff --check` pass. A fresh ten-fold structural learner screen accepted
62 fold-local rules but none passed the existing diagnostic filter; applying
only passing rules held-out mean strict unchanged at 74.30%, so none was
adopted. The next ordinary improvement commit still requires 5,340/6,990
common strict; strict 90% requires 6,292/6,990. No baseline was refreshed and
no commit was made.

The current 6,990-word dispatcher replay verified every unmodified prediction
before testing alternatives. Baseline strict/lenient is 5,322/6,364; disabling
morphology drops to 4,685/5,895 and forcing the unsplit route drops to
4,572/5,818. The largest unsplit alternative group (the compound fallback)
changes 292 words for 9 strict wins and 119 losses. Preserve morphology and
compound dispatch; continue repairing their classes and the larger pure-rules
population rather than bypassing routes.

### Preserve root `/s/` in the productive `re- + search` boundary (2026-10-19)

The general re-prefix voicing rule changed `research` to /z/, although
Cambridge lists US noun readings /ˈriːsɝtʃ/ and /rɪˈsɝtʃ/ and the verb
/ˈriːsɝtʃ/; each retains root-initial /s/ ([Cambridge pronunciation](https://dictionary.cambridge.org/pronunciation/english/research)).
The syllabifier now preserves /s/ at this prefix-root boundary. This is a
phonological boundary condition, not a stored whole-word IPA mapping. Tests
cover both routes, sentence context, the already-correct `researcher` and
`researching` forms, and voiced controls `result`, `reside`, `reserve`, and
`present`.

The frozen 1,296,352-row prediction replay changed the `research` and
`research's` rules rows plus synthetic possessive-derived rows; no dictionary
rows changed. Rebuild completed with 502 dependency-aware re-pins, unchanged
from before. Full rules strict/lenient moved 62,188→62,190 and remained
83,610/105,067 lenient. Common strict/lenient moved 5,322→5,323 and remained
6,364/6,990; top-5000 strict moved 2,869→2,870 and lenient remained
3,349/3,617. Rules-only CMU moved 4,128→4,129/5,000 (82.58%); public API
default stayed 4,750/5,000 (95.00%). Stress-aware headline/exact, parity,
homograph 1,454/1,615, and context-IPA 87/85/53/49 did not regress. All 344
Jest suites (6,585 tests), typecheck, Rollup, and `git diff --check` pass.
No baselines were refreshed and no commit was made. The strict 90% objective
still needs 969 more correct words in the 6,990 slice and 386 in top-5000;
the next ordinary commit threshold is 5,340/6,990, 17 above current.

### Structural learner and final `-ett` postlex screen (2026-10-19)

A fresh structural spelling-family run over the fixed 5,098-word pure-rules
population accepted 62 fold-local proposals, but none passed the train-only
diagnostic filter; held-out strict remained 74.32% before and after passing
rules. The strongest repeated `-ire` proposal was /ɹ/→/ɝ/: aggregate training
+36/−9 and top-5000 +27/−0, but it affects too few words for adoption and
`vampire` is an attested counterexample. No learner proposal was replayed into
runtime.

The full postlex ablation replay covered 107,645 words and 176 firing rules.
Removing the final `<ett>` KIT rule would repair only `Bennett` in the common
slice (+1 strict, no lenient change), while losing 32 strict and two lenient
matches over the full dictionary (11 strict wins versus 43 losses for keeping
the rule). The affected spellings do not form a safe suffix class, so the
existing rule was retained. Current route replay is 5,323/6,990 strict;
disabling morphology drops to 4,686 and forcing unsplit analysis drops to
4,573. Preserve those productive routes and continue searching for paired,
generalizable classes. No source behavior or baseline changed in this screen.

### Stressed open `a` in the `avi-` root (2026-10-19)

The rules-only route had lax `/æ/` in the stressed first syllable of `aviator`
and `aviary`. A narrow stressed-open-syllable condition before `vi` plus a
vowel now returns `/eɪ/` there; `avian` and `avionics` retain their existing
readings, as do the unstressed `aviate` forms and checked `avid` controls.
Cambridge's US entries support `/eɪ/` for [aviator](https://dictionary.cambridge.org/us/pronunciation/english/aviator)
and [aviary](https://dictionary.cambridge.org/us/pronunciation/english/aviary).
The rule adds no word mapping. The separate `aviation` discrepancy comes from
the bound `avi-` root colliding with the acronym reading of `avi`; this change
does not claim to repair it.

The frozen 1,296,352-row prediction snapshot changed only `aviary` and
`aviator` among dictionary rule rows; synthetic forms also inheriting those
roots changed. Rebuild completed with the same 502 dependency-aware re-pins.
Full rules strict and lenient rose 62,190→62,192 and 83,610→83,612 out of
105,067. Common and top-5000 scores stayed 5,323/6,990 and 2,870/3,617
strict. Runtime parity stayed 94,775/100,806; public CMU default stayed
4,750/5,000 (95.00%), while rules-only stayed 4,129/5,000 (82.58%).
Stress-aware phonemic was 54,649/90,310 (+148 vs committed baseline),
homographs 1,454/1,615, and context IPA stayed 87/85/53/49. Typecheck and all
345 Jest suites (6,595 tests) passed. A neutral suffix-rule compression now
preserves the source-key-specific `se` branch explicitly: the complete
1,296,352-row snapshot is byte-identical, the focused suffix tests pass, and
the five-module code count returns to the retained 3,395-line cap. No baseline
was refreshed and no commit was made. Common strict accuracy still needs 969
correct words to reach 90%; the top-5000 slice needs 386.

A top-5,000 CMU screen also rejected changing every final weak `/mənt/` to
`/mɛnt/`: only `comment` and `document` improve, while 30 already-correct
entries break. These are isolated stem readings, not evidence for changing the
productive `-ment` suffix.

### STRUT in the productive `front` root (2026-10-19)

The rules route used LOT in the stressed `front` root in `front`, `frontage`,
`effrontery`, and `frontier`. Cambridge's US entries support STRUT in each
case: [front](https://dictionary.cambridge.org/pronunciation/english/front),
[frontage](https://dictionary.cambridge.org/us/dictionary/english/frontage),
[effrontery](https://dictionary.cambridge.org/pronunciation/english/effrontery),
and [frontier](https://dictionary.cambridge.org/us/pronunciation/english/frontier).
A bounded spelling-family condition now selects STRUT for the productive free
and bound root; it does not add a word-by-word mapping. Regressions cover noun
and verb sentence contexts, inflections/compounds, and unchanged `frontz`,
`frontispiece`, company, and place-name controls. The uninflected root's stress
is still owned by the existing stress rules; this change corrects its vowel.

The 1,296,352-row frozen prediction replay changed 20 rows: seven dictionary
rule predictions within the root family and 13 synthetic derived forms. The
post-rebuild snapshot matches that frozen candidate byte-for-byte, and the
dependency-aware re-pin count remains 502. Full rules strict/lenient rose
62,192→62,196 and 83,612→83,614 out of 105,067. Common strict/lenient rose
5,323→5,324 and 6,364→6,365 out of 6,990; top-5000 strict/lenient rose
2,870→2,871 and remained 3,349/3,617. CMU default stayed 4,750/5,000 (95.00%)
and rules-only rose 4,129→4,130/5,000 (82.60%; its legacy 90% floor remains
unmet). Stress-aware headline/exact, runtime parity 94,775/100,806,
homographs 1,454/1,615, and context-IPA 87/85/53/49 did not regress. Focused
tests, the full Jest suite (346 suites, 6,603 tests), typecheck, Rollup, and
diff checks pass. No baseline was refreshed and no commit was made: common
strict is 16 short of the ordinary 5,340 threshold and 968 short of 90%; the
top-5000 slice is 385 short of 90%.

The feature puts the five-module code count two lines above the retained 3,395
compression point (3,397: g2p 1,148, syllabify 1,702, postlex 497,
morph-table 24, morph-parser 26). A candidate merge of the two adjacent open-a
rules reduced the count to 3,395 but failed the full prediction replay: the
single skip key could not preserve each rule's separate conditional guard and
changed many unrelated words. That candidate was discarded. The established
two-rule behavior remains; no unverified compression or baseline change was
kept.

A fresh ten-fold family-held-out ordinary learner screen accepted 48 fold-local
proposals, but none passed the existing train-only diagnostic filter. Mean
held-out strict stayed 74.34% before and after passing proposals. The strongest
repeated `ire` rhotic proposal remained unqualified (0/10 folds passed); no
learner output was applied to runtime.

### Reduced initial vowel in the `select` root (2026-10-19)

The rules-only route gave /ɪ/ in the unstressed first syllable of `select`,
`selection`, and `selective`. Cambridge's US entries give /sə/ for
[select](https://dictionary.cambridge.org/us/dictionary/english/select),
[selection](https://dictionary.cambridge.org/us/dictionary/english/selection),
[selective](https://dictionary.cambridge.org/us/dictionary/english/selective),
and [selector](https://dictionary.cambridge.org/us/dictionary/english/selector). A spelling-family condition now
reduces that first `se` only when it belongs to the productive `select` root;
it covers forms such as `selecting`, `selected`, `selectively`, and plural
`selectives` without changing adjacent `selecta`, `selectee`, or `self`.
Sentence tests exercise verb, noun, and adjective use.

The frozen 1,296,352-row replay changed three dictionary rule rows
(`select`, `selection`, `selective`). Rebuilding produced 502 dependency-aware
re-pins, unchanged from the previous build. Review of the full post-build diff
also found seven synthetic, non-English derivations built from `selection` or
`selective`; these are covered by the generated snapshot but fall outside the
fixed evaluation populations. `selectives` was added as a regression after
that replay exposed that derived plural route.

After rebuilding, full rules strict/lenient were 62,199/83,614 out of 105,067;
common strict/lenient were 5,327/6,365 out of 6,990 and top-5000 were
2,873/3,349 out of 3,617. CMU public default stayed 4,750/5,000 (95.00%) and
rules-only rose to 4,132/5,000 (82.64%; the legacy 90% floor remains unmet).
Runtime parity stayed 94,775/100,806; stress-aware headline/exact were
54,652/45,423; homographs stayed 1,454/1,615; context-IPA stayed 87/85/53/49.
All 347 Jest suites, typecheck, Rollup, and diff checks pass. No baseline was
refreshed or commit made: common strict remains 13 short of the 5,340 ordinary
commit threshold and 965 short of 90%; top-5000 remains 383 short of 90%.

The two accepted spelling-family fixes leave the five-module count at 3,398
code lines (g2p 1,148, syllabify 1,703, postlex 497, morph-table 24,
morph-parser 26), three above the retained compression point. The candidate
open-a rule merge was rejected because its full snapshot differed; no unsafe
compression was kept.

### Rejected weak open-`ci` reduction (2026-10-19)

A broad unstressed open-`ci` → /ə/ candidate changed 923 rows in the full
prediction snapshot, including proper names and ordinary words with /ɪ/; it was
discarded. Narrowing it to written `-cipal` changed only the rules-path forms
`municipality` and `principality`. Cambridge supports /sə/ in both, but the
fixed full-dictionary lenient count fell 83,614→83,613 because the changed
`principality` output crossed that scorer's one-phone tolerance. The candidate
therefore failed the no-regression gate and was removed; no baseline or runtime
table changed. The compression pass around the same syllabifier block remains
because its 1,296,352-row prediction snapshot is byte-identical.

### Weak initial `ci` in unstressed civil-root derivatives (2026-10-19)

Cambridge gives US /sə/ for [civilian](https://dictionary.cambridge.org/us/pronunciation/english/civilian)
and also lists /sə/ as an American-dictionary variant for
[civility](https://dictionary.cambridge.org/us/dictionary/english/civility).
The initial vowel now reduces only when the `ci` syllable is unstressed and the
following spelling continues the `civil-` root. Primary-stressed `civil` and
secondarily stressed `civilization` retain /ɪ/ ([civil](https://dictionary.cambridge.org/pronunciation/english/civil),
[civilization](https://dictionary.cambridge.org/us/pronunciation/english/civilization)).

The frozen 1,296,352-row replay changed eight predictions: `civilian` and
`civility` in the rules route, plus six malformed forms generated by the
snapshot suffix harness. No dictionary or POS rows changed. The fresh build
and post-build replay agree byte-for-byte. Full rules strict rose 62,199→62,201
while lenient remained 83,614/105,067. Common strict rose 5,327→5,328/6,990;
top-5000 stayed 2,873/3,617, with both lenient counts unchanged. CMU default
remained 4,750/5,000 and rules-only 4,132/5,000 (the existing legacy 90% rules
floor still fails). Runtime parity stayed 94,775/100,806 strict and
100,678/100,806 lenient; stress-aware headline stayed 54,652/90,310 while exact
rose to 45,425. Homographs stayed 1,454/1,615 and all context-IPA cells stayed
87/85/53/49. All 348 Jest suites / 6,616 tests, typecheck, Rollup, and extracted
CJS/ESM package smoke tests pass, including issue #28's `O'Reilly Media`
sentence. No baseline was refreshed or commit made. Common strict is 12 short
of the ordinary 5,340 commit threshold and 964 short of 90%; top-5000 is 383
short of 90%. The five-module code count is 3,394.

### Weak `ad-` and root stress before disyllabic `j` verbs (2026-10-19)

Cambridge records reduced `ad-` and root stress in [adjust](https://dictionary.cambridge.org/us/pronunciation/english/adjust),
[adjoin](https://dictionary.cambridge.org/us/dictionary/english/adjoin),
[adjourn](https://dictionary.cambridge.org/pronunciation/english/adjourn),
and [adjure](https://dictionary.cambridge.org/us/pronunciation/english/adjure).
The shared disyllabic spelling class now assigns stress to the `j…` root and
weakens the initial `ad`; the independently stressed noun [adjunct](https://dictionary.cambridge.org/us/pronunciation/english/adjunct)
and longer `adjective` stay as controls. No word mapping was added.

The frozen 1,296,352-row prediction replay changed three dictionary rules rows
(`adjust`, `adjoin`, `adjourn`) and three synthetic suffix-harness forms. The
post-rebuild dump is byte-identical to the frozen candidate. Combining the two
adjacent `/ə/` assignments preserved all predictions and returned the
five-module code count to the 3,395-line cap (g2p 1,148, syllabify 1,700,
postlex 497, morph-table 24, morph-parser 26).

Full rules strict/lenient rose 62,201→62,204 and stayed 83,614/105,067.
Common strict/lenient rose 5,328→5,329 and stayed 6,365/6,990; top-5000 stayed
2,873 strict and 3,349 lenient out of 3,617. CMU public default remained
4,750/5,000 (95.00%); rules-only remained 4,132/5,000 (82.64%, its existing
90% gate remains unmet). Runtime parity stayed 94,775/100,806 strict and
100,678/100,806 lenient. Stress-aware headline/exact rose to 54,655/45,427;
homographs stayed 1,454/1,615 and context-IPA stayed 87/85/53/49. All 349 Jest
suites / 6,621 tests, typecheck, Rollup, and extracted CJS/ESM package smokes
pass, including issue #28 and the new rules-only controls. No baseline was
refreshed or commit made: common strict is 11 short of the ordinary 5,340
commit threshold and 963 short of 90%; top-5000 is 383 short of 90%.

### Rejected three-slot `be-` CVCe stress expansion (2026-10-19)

An attempted extension of the existing weak-prefix rule covered spellings
such as `become`, `behave`, and `beside`, whose silent-e syllabification puts
`be-` into a three-slot form. The 1,296,352-row replay changed 11 scored rule
rows: common strict rose 5,329→5,330 and top-5000 rose 2,873→2,874, but full
dictionary lenient fell 83,614→83,613. Losses included the loanword `belote`
and surname readings `Beneke` and `Berube`; the class therefore failed the
global no-regression gate and was removed. The pre-candidate source hash and
all other gates remain at the accepted `ad- + j` batch state.

Two common-population, ten-fold structural learner screens followed. The
strict objective accepted 61 fold-local proposals and the distance objective
accepted 32, but none passed the train-only legacy filter; held-out strict
remained 74.44% before and after filtering. No learner proposal was applied.

### Weak `ni` in the US `univers-` family (2026-10-19)

Cambridge records US schwa in [universe](https://dictionary.cambridge.org/us/pronunciation/english/universe),
[university](https://dictionary.cambridge.org/pronunciation/english/university),
and [universality](https://dictionary.cambridge.org/pronunciation/english/universality).
The shared reduction rule now treats the unstressed `ni` syllable as weak only
inside the written `univers-` family and suppresses rhythmic secondary stress
on that same syllable. `unilateral` and `unison` retain /ɪ/ as paired controls;
no word mapping or runtime data was added.

The frozen 1,296,352-row prediction snapshot changed four dictionary rules
rows (`universe`, `university`, `universality`, and `university's`) plus the
snapshot suffix harness's malformed derivatives. The rebuilt post-build
snapshot is byte-identical. Full rules strict rose 62,204→62,208 while lenient
stayed 83,614/105,067. Common strict rose 5,329→5,331/6,990; top-5000 rose
2,873→2,875/3,617; both lenient counts stayed fixed. CMU public default stayed
4,750/5,000 and rules-only rose 4,132→4,134/5,000 (the existing legacy 90%
rules floor still fails). Runtime parity strict/lenient stayed
94,775/100,678 out of 100,806. Stress-aware headline stayed 54,655/90,310 and
exact rose 45,427→45,429. Homographs stayed 1,454/1,615 and every context-IPA
cell stayed 87/85/53/49. The extracted package passed CJS and ESM smoke tests
for issue #28 (`O'Reilly Media`), the new forms, and both controls. No baseline
was refreshed or commit made: common strict is 9 short of the ordinary
5,340-accuracy commit threshold and 961 short of 90%; top-5000 is 381 short of
90%. All 350 Jest suites / 6,625 tests, typecheck, Rollup, and diff checks pass.
Five-module rule code count remains at the retained 3,395-line cap.

The next common-word learner screen completed all ten spelling-family folds on
the same 6,990-word population: 47 fold-local candidates were accepted by its
greedy selector, but zero passed the legacy filter; held-out strict stayed at
74.48% before and after filtering. No proposal was adopted. This confirms the
offline learner currently offers no qualified next batch; candidate work must
come from independently evidenced classes and paired replay.

### CMU-only Bennett postlex candidate rejected (2026-10-19)

The real postlex ablation found one apparent common strict gain from removing
the existing final `-ett` vowel adjustment: `Bennett` would change from
/ˈbɛnɪt/ to the CMU reference /ˈbɛnət/. Cambridge gives US /ˈben.ɪt/ for
[Bennett](https://dictionary.cambridge.org/us/pronunciation/english/bennett),
so the shipped result matches the independently checked dictionary and the
CMU-only change was rejected. Cambridge also supports schwa in the final
syllable of [personality](https://dictionary.cambridge.org/pronunciation/english/personality),
[stability](https://dictionary.cambridge.org/us/pronunciation/english/stability),
and [facility](https://dictionary.cambridge.org/us/dictionary/english/facility);
no general final-`-ity` vowel change was made. This scorer conflict is retained
as a reference caveat, not counted as an accuracy gain.

### Choir spelling-root repair (2026-10-19)

Cambridge US gives `choir` /ˈkwaɪ.ɚ/. The rules route previously read it as
/ˈtʃwɑɹ/ by applying the general initial `ch` reading. A spelling-root rule
now restores `/kw/` and `/aɪɚ/` for `choir-`; paired `chair`, `choice`, and
`chord` controls retain their distinct readings. The rule also handles `choirs`,
`choirboy`, and `choirmaster`; no word mapping was added.

The frozen and rebuilt 1,296,352-row snapshots were compared on the same fresh
runtime tables. Five predictions changed: the `choir` rules row and four
synthetic suffix-harness derivatives; the dictionary and POS rows were
unchanged. Common strict rose 5,330→5,331/6,990, full rules strict rose
62,206→62,207/105,067, and top-5000 strict stayed 2,874/3,617. Lenient common
rose 6,364→6,365, full lenient rose 83,612→83,613. CMU default stayed
4,750/5,000; runtime parity stayed 94,775/100,806 strict and 100,678/100,806
lenient; stress-aware headline/exact are 54,656/45,430; context-IPA remains
87/85/53/49; homographs remain 1,454/1,615. All 351 Jest suites / 6,630 tests,
typecheck, and Rollup pass. The freshly packed and extracted npm tarball passes
CJS/ESM checks for choir, its neighboring controls, O'Brien, and O'Reilly.
Compared with the preceding stale generated tables, the fresh no-choir rebuild
also moves rules-only CMU 4,134→4,133 and top-5000 strict 2,875→2,874; a second
no-choir build reproduced those counts, so neither movement is caused by this
rule. No baseline was refreshed or commit made: common strict is 9 short of the ordinary 5,340 commit threshold
and 961 short of 90%; top-5000 is 382 short of 90%.

Evidence: `/tmp/phonemize-next-release/choir-root/`.

### Rejected universal past-tense `-ed` schwa rewrite (2026-10-19)

A screening simulation rewrote rule outputs ending in /tɪd/ or /dɪd/ to
/təd/ or /dəd/. It produced 60 strict wins and 47 regressions among 124
eligible words in the common population, before checking the full dictionary
or contextual gates. This is not a safe general suffix class: Cambridge US
explicitly gives /ɪd/ for [included](https://dictionary.cambridge.org/us/pronunciation/english/included)
and [collected](https://dictionary.cambridge.org/pronunciation/english/collected),
where the CMU references prefer schwa. The measured net gain therefore mixes
real errors with a reference convention difference; no rule or reference was
changed. A future reduction must be supported by a narrower spelling/stress
class and must preserve authoritative /ɪd/ controls.

### Rejected uniform three-slot `-ology` route (2026-10-19)

Routing every three-slot `-ology` form through the same second-slot stress
render changes seven common words in a screening simulation: it yields zero strict wins and
four strict regressions. The roots are not uniform: Cambridge US confirms the
weak first vowel in [astrology](https://dictionary.cambridge.org/us/pronunciation/english/astrology)
and [pathology](https://dictionary.cambridge.org/us/pronunciation/english/pathology),
but a tense /i/ in [ecology](https://dictionary.cambridge.org/us/pronunciation/english/ecology).
`physiology`, `psychology`, `sociology`, and `technology` already match the
current rule vowels. No shared suffix rewrite was adopted.

### Rejected CMU-driven `-ical` schwa change (2026-10-19)

Ten common-set `-ical` mismatches have CMU /ə/ where the rules produce /ɪ/.
Cambridge US confirms /ɪ/ in [chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical)
and [typical](https://dictionary.cambridge.org/us/pronunciation/english/typical),
so changing the shared suffix to match those CMU rows would reduce standard
pronunciation accuracy. No suffix rule or reference was changed; the ten strict
misses remain visible in the fixed CMU-based score.

### Refreshed common-set structural learner screen (2026-10-19)

Reran the TRAIN-only, spelling-family 10-fold structural learner on the fixed
6,990-word population after the current accumulated rule changes. It accepted
58 fold-local candidates; none passed the existing diagnostic filter. Held-out
strict stayed at a mean 74.50% before and after filter-passed candidates. The
leading `-ire` `/ɹ/`→`/ɝ/` candidate was accepted in all folds but affects only
about six words per fold and repeatedly breaks `vampire`; it is not a safe
general rule. No learner proposal was adopted. Full report:
`/tmp/phonemize-next-release/learner-20261019-current/cv-common-report.json`.

### Refreshed dispatcher and postlex ablations (2026-10-19)

Replayed all 6,990 common words through the actual routes. The current pipeline
scores 5,331 strict; bypassing morphology falls to 4,697, and the unsplit
alternative falls to 4,584. No single morphology handler removal has a
nonnegative strict delta. The 93-rule postlex ablation found one apparent
strict gain: removing the final `-ett` correction changes Bennett to the CMU
schwa reading, but Cambridge supports the retained `/ɪ/` pronunciation, so the
candidate remains rejected. The largest direct-rule failure buckets combine
initial-vowel mismatches across acronyms, names and unrelated roots; they do
not identify a safe shared replacement. No runtime rule or benchmark contract
changed. Reports: `/tmp/phonemize-next-release/routes-20261019/report.json`
and `/tmp/phonemize-next-release/postlex-20261019/results.json`.

### Short-root `-ation` fallback (2026-10-19)

Cambridge US gives [aviation](https://dictionary.cambridge.org/us/pronunciation/english/aviation)
the FACE vowel in its first syllable, matching the spelling family in `avian`
and `aviator`. The rule pipeline had reused the unrelated short headword `avi`
and produced /ɑ/ instead. When a short `-ation` stem has no lexical `-ate` verb,
the existing composition path now tries the rule-rendered `-an` form as the
bound root. The fallback is limited to lexical stems of three letters or fewer;
no word mapping was added. Paired `avi-` roots remain unchanged.

The frozen 1,296,352-row replay changed only the `aviation` and `aviation's`
rules rows; dictionary and POS rows were unchanged. The rebuilt candidate and
the behavior-neutral compression snapshot are byte-identical. Common strict
rose 5,331→5,332/6,990 and top-5000 strict 2,874→2,875/3,617; common lenient
rose 6,365→6,366. Full rules strict/lenient rose 62,207→62,209 and
83,613→83,615/105,067. Public CMU default stayed 4,750/5,000 while rules-only
rose 4,133→4,134; runtime parity stayed 94,775/100,806 strict and
100,678/100,806 lenient. Stress-aware headline/exact rose 54,656→54,657 and
45,430→45,431. Context IPA remained 87/85/53/49 and homographs remained
1,454/1,615. All 351 Jest suites / 6,631 tests, the focused avi-root tests,
typecheck, Rollup, and `git diff --check` pass. No baseline was refreshed or
commit made: common strict remains 960 words short of the >90% target and
381 short on the top-5000 slice. Five-module rule code count is 3,392.

### Initial `he` pronoun-rule boundary (2026-10-19)

The `^he$` phoneme rule supplies /hi/ for the standalone pronoun, but syllable
segmentation also exposes initial `he` before a closed `r`-onset syllable in
words such as `herald`, `heron`, and `heresy`. Cambridge US confirms the /ɛ/
vowel in [herald](https://dictionary.cambridge.org/us/pronunciation/english/herald),
[heron](https://dictionary.cambridge.org/pronunciation/english/heron), and
[heresy](https://dictionary.cambridge.org/pronunciation/english/heresy). The
rule now leaves those syllables to the ordinary vowel rules. Open `he·ra` and
`he·ro` controls and the `he` pronoun keep their existing readings.

The frozen 1,296,352-row replay changed 28 real rule-path predictions and 54
synthetic suffix-harness forms; no dictionary/POS output changed. Common strict
rose 5,332→5,333/6,990, common lenient 6,366→6,367, and top-5000 strict stayed
2,875/3,617 (lenient 3,350). Full rules strict/lenient rose 62,209→62,218 and
83,615→83,618/105,067. Runtime parity stayed 94,775/100,806 strict and
100,678/100,806 lenient; public CMU default stayed 4,750/5,000 and rules-only
stayed 4,134. Stress-aware headline/exact rose 54,657→54,666 and
45,431→45,437. Context IPA remained 87/85/53/49 and homographs remained
1,454/1,615. The changed rule rows yielded nine full-dictionary strict wins
and zero losses. No baseline was refreshed or commit made: common strict is
959 words short of the >90% target and the top-5000 slice is 381 short. The
five-module rule count is 3,393.

### Rejected common-set candidates (2026-10-19)

The rules-only common report marks `resources`, `searches`, `references`, and
other sibilant-final `-es` forms wrong when the output has schwa and CMU has
/ɪ/. The full dictionary's accepted weak-vowel convention is opposite overall
(359 schwa : 107 /ɪ/); no shared suffix change was made. Extending final `^al$`
to plural `-alls` fixed the call/fall/wall/ball frame, but the frozen rule-path
replay yielded only two strict wins and three losses (`allsbrook`,
`idaho-falls`, `qualls`). It was reverted. A fresh ten-fold common learner run
accepted 40 fold-local candidates and passed none through its existing filter;
the leading `-ire` change again breaks `vampire`. No candidate or baseline was
adopted. The rejected all-rime replay is retained at
`/tmp/phonemize-next-release/all-plural-candidate.tsv`; the fresh learner report
is at `/tmp/phonemize-next-release/learn-5333/cv-common-report.json`.

### Initial `she` pronoun-rule boundary (2026-10-19)

The anchored `^she$` pronoun rule also matches a syllabified initial `she` in
`shekel` and `shep-` frames. Cambridge US confirms /ɛ/ in
[shekel](https://dictionary.cambridge.org/us/pronunciation/english/shekel),
[shepherd](https://dictionary.cambridge.org/us/pronunciation/english/shepherd),
and [Shepard](https://dictionary.cambridge.org/pronunciation/english/shepard).
The rule now yields to ordinary vowel rules when that initial syllable is
followed by a `k` or `p` onset. Standalone `she` and the contrasting `Sheba`
control keep their existing readings. The rules-only path still renders the
`ph` in `shepherd` as /f/; the vowel correction makes that output closer but
does not make those spellings strict hits. The default lexical route remains
correct.

After rebuilding dictionaries (their English source hashes were unchanged),
the frozen 1,296,352-row snapshot showed 27 changed rule/morphology outputs:
seven full-dictionary strict wins, zero strict losses, and three lenient wins.
The common 6,990 strict score stayed 5,333 while lenient rose 6,367→6,368;
top-5000 strict/lenient stayed 2,875/3,350. Public CMU default/rules stayed
4,750/4,134. Full-dictionary rule strict/lenient rose 62,218→62,225 and
83,618→83,621. Runtime parity stayed 94,775/100,806 and 100,678/100,806;
stress-aware headline/exact rose 54,666→54,672 and 45,437→45,443. Context
remained 87/85/53/49 and homographs 1,454/1,615. All 353 Jest suites / 6,651
tests, typecheck, Rollup, and `git diff --check` passed. Since common strict did
not rise, no baseline was refreshed and no commit was made. The five-module
rule code count is 3,394.

### Rechecked structural common-word candidates (2026-10-19)

A fresh ten-fold spelling-family replay on the unchanged 6,990-word common
population covered 5,098 direct rule-path words. It accepted 51 fold-local
corrections, but none passed the train-only safety filter; held-out strict
accuracy averaged 74.52% before and after filter-passed changes. The strongest
repeated proposal changes final `-ire` /ɹ/ to /ɝ/: it fixes 36 training cases
and breaks nine, with `vampire` as an explicit counterexample. The other
recurrent proposals weaken unstressed /ɪ/ to schwa and break top-5000 or paired
vowel controls. No candidate was applied. The report is retained at
`/tmp/phonemize-next-release/learn-5333-structural-20261019/cv-common-report.json`;
common strict remains 5,333/6,990 and no baseline or runtime behavior changed.

### Trans- + -ation unstressed rhotic reduction (2026-10-19)

Rule-path morphology now reduces an unstressed rhotic /ɔr/ to /ɝ/ in the
`trans-` + rhotic-root + `-ation` frame. Cambridge US records /ɚ/ in
[transformation](https://dictionary.cambridge.org/us/pronunciation/english/transformation),
[transportation](https://dictionary.cambridge.org/us/pronunciation/english/transportation),
and the related [transformational](https://dictionary.cambridge.org/us/pronunciation/english/transformational).
The rule also carries through `retrans-` forms. It does not change the free
roots `transform`/`transport`, or neighboring `formation`, `deformation`,
`importation`, and `organization`.

The frozen 1,296,352-row replay changed exactly three rules outputs:
`transformation`, `transportation`, and `transportation's`; both scored
dictionary rows were strict wins and there were zero losses. The 6,990-word
subset and top-5000 slice remain 5,333 and 2,875 strict because both scored
headwords exceed the evaluator's 12-character limit. Public CMU rules-only
accuracy rose 4,134→4,135/5,000; default stayed 4,750/5,000. Full-dictionary
strict/lenient, runtime parity, stress-aware, homograph and context IPA metrics
were unchanged (context 87/85/53/49; homographs 1,454/1,615). Dictionary source
hashes were identical after rebuild. All 354 Jest suites / 6,664 tests,
typecheck, Rollup and `git diff --check` pass. The five-module code count is
3,395, at the retained cap. This is a validated accumulated gain, not a
qualifying common-strict batch: no baseline refresh or commit was made.

### Rejected common `en-` vowel reduction (2026-10-19)

Changing initial morphology-path /ɛn/ to /ɪn/ would match Cambridge's US
reading for `enlargement`, but the spelling alone is not a safe rule. In the
common slice it affects 23 morphology-path forms and yields one strict win
against 19 losses; the CMU controls include `enforcement`, `engagement`,
`enrollment`, and `enclosure`. The probe is retained at
`/tmp/phonemize-next-release/en-prefix-vowel-probe-20261019.json`; no runtime
or reference changes were made.

### Common strict false negatives checked against Cambridge (2026-10-19)

The current strict scorer compares rules-only output with one generated
dictionary reading. A small source check of prominent common failures found
several cases where Cambridge's US pronunciation supports the rules output
over that single reading: [personal](https://dictionary.cambridge.org/us/pronunciation/english/personal)
has /pɝsənəl/ (rules: /pɝsənəl/, target: /pɝsɪnəl/),
[medical](https://dictionary.cambridge.org/pronunciation/english/medical)
has /mɛdɪkəl/ (rules: /mɛdɪkəl/, target: /mɛdəkəl/), and
[government](https://dictionary.cambridge.org/us/pronunciation/english/government)
includes the /n/ before /m/ (rules: /ɡʌvɝnmənt/, target: /ɡʌvɝmənt/).
Cambridge also gives /rɪ/ in US [regardless](https://dictionary.cambridge.org/us/pronunciation/english/regardless),
matching the rules path /ɹɪˈɡɑɹdɫəs/ where the stored target begins /ɹə/.
Cambridge's US [new](https://dictionary.cambridge.org/pronunciation/english/new)
is /nuː/, matching the rules output while the stored target has /nju/; for
[dog](https://dictionary.cambridge.org/us/pronunciation/english/dog), it lists
both US /dɑːɡ/ and /dɔɡ/, matching the rules and stored readings respectively.
These are reference conflicts, not rule regressions or strict gains. Do not
force these pronunciations to match a single stored variant; resolving them
requires a versioned reference/accepted-variant contract, kept separate from
the rule-accuracy gate. This small audit does not estimate how many such cases
exist in the full common cohort.

### Rejected AmE `-dure` yod drop (2026-10-19)

Cambridge records US `during` /ˈdʊr.ɪŋ/, `endure` /ɪnˈdʊr/, and `durable`
/ˈdʊr.əbəl/ ([during](https://dictionary.cambridge.org/us/pronunciation/english/during),
[endure](https://dictionary.cambridge.org/us/pronunciation/english/endure),
[durable](https://dictionary.cambridge.org/us/pronunciation/english/durable)).
The current rules path inserts /j/ in the `dure` root. A candidate that removed
it after /d/ changed four rule-path outputs in the frozen 1,296,352-row replay:
`during`, `endure`, `endured`, and `enduring`. It produced zero strict wins,
three full-dictionary strict losses (`endure`, `endured`, `enduring`), and zero
common strict wins or losses; `during` still disagreed with the stored target.
The candidate was reverted. This is an authoritative AmE correction candidate,
but it requires a versioned accepted-reading/reference decision before its
current-baseline losses can be treated as gains.

### Rejected weak initial `re-` reduction (2026-10-19)

A source-independent replay changed /ɹi/ to /ɹɪ/ in any unstressed initial
`re-` syllable. On the unchanged cohort this moved common strict from
5,333/6,990 to 5,264/6,990 (15 wins, 84 losses), and top-5000 from
2,875/3,617 to 2,838/3,617 (7 wins, 44 losses). Stressed-prefix and hiatal
controls are mixed with weak-prefix words, so a broad spelling-conditioned
reduction is unsafe. No source or runtime changes were made. Full paired lists
are retained at `/tmp/phonemize-next-release/re-prefix-vowel-probe-20261019.json`.

### Rejected terminal `-ate` vowel reduction (2026-10-19)

The common mismatch cluster includes noun/adjective readings such as `climate`,
`senate`, and `ultimate`, whose final spelling `-ate` has /ət/. A replay that
reduced final rules-path /eɪt/ to /ət/ for `-ate` words changed 70 common words,
yielding four strict wins and 50 losses (common delta -46; top-5000 delta -20).
Restricting the replay to secondary-stressed or unstressed endings still lost
30 or 39 words. It also affected verbs such as `calculate`, `communicate`, and
`navigate`; spelling plus stress is insufficient to infer POS. No runtime
change was made. Paired replay data is at
`/tmp/phonemize-next-release/terminal-ate-probe-20261019.json`.

### Rejected AmE `-ireless` coda-R rewrite (2026-10-19)

Cambridge US has /ˈwaɪr.ləs/ for [wireless](https://dictionary.cambridge.org/us/pronunciation/english/wireless)
and /ˈtaɪr.ləs/ for [tireless](https://dictionary.cambridge.org/us/dictionary/english/tireless).
The CMU-derived target agrees for `tirelessly` but stores `/taɪɝləs/` for
`tireless`, and `wireless` expects `/waɪɹlɪs/`. A replay changing the root's
/aɪɝ/ to /aɪɹ/ before the suffixal /l/ changed four rows: one strict win
(`tirelessly`), two strict losses (`tireless`, `wireless's`), and no common
strict wins. `wireless` remained a strict miss, though its edit distance fell
from two to one. The class was rejected under the unchanged reference and
no-regression contract; full details are in
`/tmp/phonemize-next-release/ireless-probe-20261019.json`.

### Rebuilt adoption audit (2026-10-19)

After rebuilding from the pinned public pronunciation sources, the 1,296,352-row
pre/post snapshots were byte-identical. Current common strict is 5,333/6,990
and top-5,000 strict is 2,875/3,617; against the current committed 5,270/6,990
common baseline this is +63 words, short of the ordinary +70-word commit gate.
No baseline was refreshed and no commit was made. Full rules remain
62,225/105,067 strict and 83,621/105,067 lenient; parity remains
94,775/100,806 strict and 100,678/100,806 lenient. Stress-aware phonemic
correctness is 54,672 (+171) and exact IPA is 45,443 (+157); public CMU default
is 4,750/5,000 and rules-only is 4,135/5,000. Context has no per-reading,
per-class, or supported-POS regressions against its fixed baseline, with
default/auto strict at 87/108; homographs remain 1,454/1,615. All 354 Jest
suites / 6,664 tests, typecheck, Rollup, and `git diff --check` pass. The
rules-only CMU legacy 90% floor remains unmet and is compared for nondecrease.

### Rejected CMU-driven `-age` schwa rewrite (2026-10-19)

A common-set output screen replaced only the standalone IPA sequence /ɪdʒ/ with
/ədʒ/ in words spelled `-age`; this was screening evidence, not an actual
dispatch replay. Across the fixed common population it yielded 18 strict wins
and 18 losses; the top-5,000 slice had 11 wins and 9 losses, so the class fails
the no-regression gate. Cambridge US independently supports the current /ɪ/
in [message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[package](https://dictionary.cambridge.org/us/pronunciation/english/package),
and [village](https://dictionary.cambridge.org/us/pronunciation/english/village).
No runtime change was made; several apparent CMU wins in this cluster are
reference-notation conflicts rather than safe generalized pronunciation fixes.

### Suffix-and-IPA-window candidate screen (2026-10-19)

A second output-only scan found three apparent schwa candidates, but none is
ready for dispatch replay. Changing the final /ɪ/ before `-cted` to /ə/ screens
at +10/-2 overall and +5/-0 in top-5,000; Cambridge US supports the current
/ɪd/ in [collected](https://dictionary.cambridge.org/us/pronunciation/english/collected),
so the apparent wins include a source-notation conflict. Changing /ɪ/ to /ə/
in `-ican` screens at +5/-1 overall and +4/-0 in top-5,000, but Cambridge US
uses /ɪ/ in [American](https://dictionary.cambridge.org/us/pronunciation/english/american),
[African](https://dictionary.cambridge.org/us/pronunciation/english/african),
[Mexican](https://dictionary.cambridge.org/us/pronunciation/english/mexican),
and [Republican](https://dictionary.cambridge.org/pronunciation/english/republican).
Finally, changing /ɪb/ to /əb/ before `-ion` screens at +3/-0, while Cambridge
has /ɪ/ in [contribution](https://dictionary.cambridge.org/pronunciation/english/contribution)
and /ə/ in [exhibition](https://dictionary.cambridge.org/us/pronunciation/english/exhibition),
showing different root behavior. These are reference screens only: they do not
prove actual dispatch or sentence-context gains, and no runtime rule was added.

### Rejected structural terminal `-ire` rhotic-vowel candidate (2026-10-19)

The refreshed 10-fold spelling-family learner proposed changing final rules-path
`-ire` /ɹ/ to /ɝ/ in all folds. The pooled training evidence was +36/−9 strict
overall and +27/−0 in top-5,000, but average support was only 6.3 words and
fix precision 57%; none of the folds passed the train-only adoption diagnostic.
Replaying the learner's full selected-rule set on held-out families reduced
strict from 3,799/5,098 to 3,789/5,098 and lenient from 4,565 to 4,552.
Cambridge US marks
`acquire` with /aɪɚ/, but `desire`, `empire`, `require`, and `vampire` with /aɪr/;
the broad spelling change would erase those distinctions. No runtime change was
made. The complete report is `/tmp/phonemize-rule-corrections/cv-common-report.json`.

### Rejected broad initial `comf-` STRUT candidate (2026-10-19)

The rules-only route predicts `/kɑ/` in `comfort`, against the pinned target
`/kəm/`; its dictionary and public API routes already return the expected
`/kʌm/`. A broad initial `comf-` change is not a safe spelling class:
`comfed` and `comfinance` retain `/kɑm/` in the pinned reference, while
`comfy` also has an independent final-y error. The `comfrey` rules output
already agrees after the benchmark's schwa normalization. Restricting the
change to `comfort` would be a whole-word exception with no runtime benefit,
so no code change was made. Traces were captured with `yarn trace` and both
dictionary-enabled and rules-only `EnglishG2P` dispatch on 2026-10-19.

### Rejected broad unstressed `-ice` KIT-vowel candidate (2026-10-19)

The common-set rules route has four strict failures among words ending in
`-ice`: `alice`, `office`, `police`, and `sacrifice`. Only `office` is a
candidate for changing its final unstressed /ə/ to /ɪ/; `alice` and `police`
also need different stress/onset readings, and `sacrifice` has final PRICE
/aɪs/. The same broad change would break matching common predictions for
`notice`, `practice`, `justice`, and `service`, whose pinned targets use
schwa in that syllable. This was a spelling/output screen, not a dispatcher
replay, and provides no basis for adopting a broad class or changing targets.
No runtime change was made.

### Ranked common strict-error review (2026-10-19)

Replayed the pinned frequency list in rank order through `EnglishG2P` with
`disableDict: true`, preserving the 6,990-word non-foreign common population.
Among the top 500 ranks, the earliest failures include `are`, `from`, `have`,
`new`, `one`, `what`, `only`, `here`, `business`, `now`, `online`, `been`,
`email`, `message`, `company`, `said`, and `women`. They span function-word
forms, lexical vowel classes, compounds, and morphology rather than one shared
grapheme environment. The previously screened productive suffix groups
(`-ed`, `-age`, `-ate`, `-ion`) also mix authoritative readings or show paired
losses. No candidate from this rank screen is ready for adoption; continue
with independent source checks and actual dispatcher replay before changing
rules. The full reproducible acceptance report is still produced by
`node --require tsx/cjs scripts/evaluate.ts --subset common`.

### Rejected broad `-s` morphology bypass (2026-10-19)

The actual common-route ablation for the regular `sPlural` branch changes 97
rows, with 9 strict wins and 45 strict losses. The wins are spread across
`chemicals`, `dogs`, `florists`, `offices`, `proceeds`, `produces`, `repairs`,
`results`, and `tours`; they do not share an inflectional or phonological
environment. The pinned CMU API itself accepts alternate readings for `dogs`,
`results`, and `tours`, while Cambridge independently supports /ɪ/ in
[chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical)
and /ɔːr/ in [florist](https://dictionary.cambridge.org/us/pronunciation/english/florist),
showing that several strict wins come from route/reference variant conflicts.
No broad plural fallback was adopted; report:
`/tmp/phonemize-route-diagnosis/report.json`.

### Structural distance-objective replay (2026-10-19)

Re-ran the spelling-family 10-fold learner with `--structural
--objective distance` against the unchanged common cohort. Actual rule-path
coverage was 5,098/6,990; 23 fold-local corrections were accepted by the
greedy training loop, but none passed the TRAIN-only legacy filter. The
mean held-out strict rate stayed 74.52% before and after the passing-rule set
(empty). The leading recurring candidate was again final `-ire` /ɹ/→/ɝ/:
training +36/−9, top-5,000 +27/−0, only 57% mean fix precision and 6.3
affected words per fold. The other five candidate readings had at most
14/−12 pooled training changes and 46% mean fix precision or lower. No
correction was adopted; full report:
`/tmp/phonemize-next-release/learn-distance-20261019/cv-common-report.json`.

### Rejected `-cted` morphology-ablation gain (2026-10-19)

The full common-route diagnosis found a tempting counterfactual in
`tryMorphologicalAnalysis`'s regular-inflection branch: disabling that branch
for `-cted` rows changes 12 words, with 10 strict wins and 1 loss; five of
those wins and no losses are in top-5,000. This is not a pronunciation gain:
the alternative changes the inflection vowel from /ɪ/ to /ə/. Cambridge US
transcribes [collected](https://dictionary.cambridge.org/pronunciation/english/collected)
with /tɪd/, consistent with the regular /ɪd/ allomorph after /t/; it also
transcribes [added](https://dictionary.cambridge.org/us/pronunciation/english/added)
with /ɪd/ after /d/. The related `-ded` counterfactual is already mixed
(11 strict wins, 3 losses; top-5,000 +6/−3). These are reference-scoring
conflicts, not safe rule corrections. The evidence is the real-pipeline
branch-ablation report at `/tmp/phonemize-route-diagnosis/report.json`; no
runtime or target changes were made.

### Common-word suffix screen (2026-10-19)

Replayed the frozen 6,990-word common set through the actual rules-only route and
ranked suffixes by strict-error concentration. The strongest groups were `-ded`
(15/18 mismatches), `-nted` (10/11), `-cted` (11/13), and `-ing` with errors
across unrelated stems and stress frames. The `-ded/-cted` alternatives mostly
change the regular /ɪd/ inflection to reduced /əd/ and are already contradicted
by the collected/added dictionary checks above; `-nted` also contains varied
root stress and vowel behavior. The `-ing` examples include `going`'s clipped
reference form, `hanging`'s reference /ɡ/, and unrelated stem-vowel/stress
differences. The suffix counts do not establish a shared class with safe
paired controls, so no source rule was changed. Reproduction: the current `scripts/.common-accuracy-cache/frequency.txt`,
`data/en/dict.json`, and `EnglishG2P({ disableDict: true })`.
Extending the same ranked suffix scan to 6–9 letters found only `-rative`
with at least six errors and a 70% error ratio (6/6). Those failures split
across stress, root-vowel, and syllable-boundary differences; nearby
`alternative`, `conservative`, `native`, and `negative` already match. No
shared suffix correction is supported.

### Rejected initial `marri-` vowel change (2026-10-19)

The common rules path predicts `/æ/` for `marriage` and `Marriott`, while the
pinned references expect `/ɛ/`; Cambridge independently records those US
readings for [marriage](https://dictionary.cambridge.org/pronunciation/english/marriage)
and [Marriott](https://dictionary.cambridge.org/us/pronunciation/english/marriott).
The dictionary route already returns both readings correctly. A spelling-only
`marri-` rewrite also changes `marrin` and `marris`, whose pinned readings
retain `/æ/`, so the apparent two common wins carry two full-dictionary strict
losses. The actual traces show these words share the initial `a` rule but not a
safe word class. No runtime change was made. The candidate comparison was an
output-only screen, not a dispatcher replay; traces are reproducible with
`node --require tsx/cjs scripts/trace.ts marriage marriott marrin marris`.

### Rejected broad final `-ity` KIT rewrite (2026-10-19)

An output-only screen hypothetically changed final `/əti/` to `/ɪti/` in
predictions for words spelled `-ity`. Across the common cohort it produced 16
strict wins and 46 losses; top-5,000 produced 7 wins and 25 losses. The full
dictionary had 110 wins and 183 losses (net −73). The apparent wins also mix
source disagreements: Cambridge
US retains `/ə/` in [humanity](https://dictionary.cambridge.org/us/pronunciation/english/humanity)
and [authority](https://dictionary.cambridge.org/pronunciation/english/authority),
while [charity](https://dictionary.cambridge.org/us/pronunciation/english/charity)
has `/ə/` in that syllable too. The suffix does not license a uniform vowel
change, so no runtime change was made. This was a screen, not an actual
dispatcher replay.

### Lower-support family-held-out candidate audit (2026-10-19)

Re-ran the strict and structural learners with spelling-family 10-fold CV and
minimum support 2. Each run accepted 300 fold-local candidates and passed zero
through its TRAIN-only diagnostic. Held-out baseline strict was 3,799/5,098;
replaying all accepted rules reduced it to 3,795 (strict) and 3,785 (structural),
while the empty passing set stayed at baseline. High-ranked suggestions were
root-specific (`friend`/`friendship`, `key`/`Keith`) or repeated earlier
reference conflicts: schwa in `-age` despite Cambridge's /ɪ/ in
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
`/ɑ/→/ɔ/` in `cross` and `across` despite Cambridge US /ɑ/ in
[cross](https://dictionary.cambridge.org/us/pronunciation/english/cross) and
[across](https://dictionary.cambridge.org/pronunciation/english/across), and
weak-vowel reductions despite Cambridge /ɪ/ in [tremendous](https://dictionary.cambridge.org/us/pronunciation/english/tremendous),
noun [attribute](https://dictionary.cambridge.org/us/pronunciation/english/attribute),
and [contribution](https://dictionary.cambridge.org/pronunciation/english/contribution).
The inspected high-ranked proposals are not general classes with independently
supported paired controls, and none passed the TRAIN-only filter; no runtime
rule was adopted. Reports:
`/tmp/phonemize-next-release/learn-min2-20261020/cv-common-report.json` and
`/tmp/phonemize-next-release/learn-structural-min2-20261020/cv-common-report.json`.

### Rejected common `-ment` schwa repair (2026-10-20)

A fresh common-set route census grouped morphology-path failures and surfaced
`-ment` words including `cement`, `comment`, `document`, `government`, and
`investment`. They do not support a suffix-wide change: the current rules-only
`cement` already misses the correct stress and first vowel, while Cambridge US
records `/ˈkɑː.ment/` for [comment](https://dictionary.cambridge.org/us/pronunciation/english/comment),
`/ˈdɑː.kjə.mənt/` for noun [document](https://dictionary.cambridge.org/us/pronunciation/english/document),
and `/səˈment/` for [cement](https://dictionary.cambridge.org/us/pronunciation/english/cement).
The learner's apparent `-ment` /ɛ/ wins therefore include a CMU reference
disagreement, and stress/root-vowel failures in the same suffix family are
unrelated. No rule or reference was changed. Reproduce the current common
mismatch report with `node --require tsx/cjs scripts/evaluate.ts --subset common --cluster`;
the rules-only traces for the representative words are in the 2026-10-20 session
diagnostic.

### Prefix-aware exception re-pinning (2026-10-20)

After rebuilding the exception table, `unheralded` lost the rule-path reading
because the dependency scan bucketed evicted stems by the first three letters
of the derived word. That misses a root hidden behind a two-letter prefix.
The builder now derives candidate roots for privative-prefix + regular `-ed`
forms, then tests each candidate through the real pipeline and keeps it only
when it repairs an identified flip; the existing whole-dictionary net check
still rejects stems whose verified regressions outnumber their attributed
fixes. Cambridge records US `/ˌʌnˈher.əldɪd/` for
[unheralded](https://dictionary.cambridge.org/pronunciation/english/unheralded)
and `/ˈher.əld/` for [herald](https://dictionary.cambridge.org/us/pronunciation/english/herald);
Oxford US also records `/ʌnˈherəldɪd/` for
[unheralded](https://www.oxfordlearnersdictionaries.com/us/definition/english/unheralded).
The pinned CMU row and current rules output use `/ən/` for the prefix, so this
repair restores the independently sourced root vowel but does not resolve that
prefix-vowel reference disagreement or claim a complete dictionary-exact reading.

The new phase resolves six flips; after net checks the table has 507 re-pinned
entries, with 519 fixes and five tracked regressions across the complete
dictionary. Rules-only full-dictionary strict/lenient are 62,228/83,623
(+54/+26 versus the pre-change rebuilt table). Stress-aware phonemic accuracy
is 54,676/90,310 (+4 versus the previous run). Common strict/lenient remain
5,333/6,368 of 6,990; top-5,000 remains 2,875/3,350 of 3,617. Runtime parity
is 94,775/100,806; public CMU default is 4,750/5,000 and rules-only is
4,135/5,000. Context stays 87/85/53/49, and homographs stay 1,454/1,615.
The `unheralded` regression passes in both dictionary and rules-only modes.

### Rejected broad sibilant plural /ɪz/ restoration (2026-10-20)

The common mismatch report highlights plural/third-person `-es` outputs such
as `resources`, `searches`, `churches`, and `pages`, where post-stress
reduction often turns /ɪz/ into /əz/. Cambridge's grammar entry gives /ɪz/ as
the regular `-es` ending after /s/, /ʃ/, /tʃ/ and related sibilants, so a
phonological restoration was screened. Replacing final /əz/ with /ɪz/ for
every rules-path word spelled `-es` and ending in /ʃ/ or /tʃ/ changed 93 full
dictionary predictions: strict +5/−66, lenient +2/−1. On the fixed common
subset it was strict +0/−13 (top-5,000 +0/−5). The broad class therefore
conflicts with the pinned CMU convention and is rejected; this output-only
screen is not dispatcher-replay adoption evidence. No runtime rule or
benchmark reference changed. Source: Cambridge's [plural noun grammar
entry](https://dictionary.cambridge.org/grammar/british-grammar/nouns-form).

### Rules-only -mit stem carried into `-mitation` (2026-10-20)

The rules path had a conditional `limit` entry with `/ə/`, while its
independently predicted verb is `/ˈlɪmɪt/`. `limitation` inherits the noun
entry's weak vowel through `-ation` composition, but Oxford US records
`/ˌlɪmɪˈteɪʃən/` for [limitation](https://www.oxfordlearnersdictionaries.com/us/definition/english/limitation).
The suffix handler now carries the rules-vouched KIT only when the lexical
stem differs from the rules stem solely by that weak vowel before final `t`.
This preserves `imitation` and neighboring controls, and does not add a word
map. A frozen 1,296,352-prediction replay found exactly one change:
`limitation`, from `/ˌɫɪməˈteɪʃən/` to `/ˌɫɪmɪˈteɪʃən/`.

After the required dictionary, compound-part and exception rebuild, common
rules-only strict is 5,334/6,990 (+1); top-5,000 is unchanged at 2,875/3,617.
Lenient common scores are unchanged. Full-dictionary strict/lenient remain
62,229/83,623, stress-aware phonemic accuracy remains 54,676/90,310, parity
remains 94,775/100,806, context remains 87/85/53/49, homographs remain
1,454/1,615, and public CMU default remains 4,750/5,000. The separate rules
CMU diagnostic remains 4,135/5,000 and below its legacy floor. This is a
validated accumulated gain, not a release checkpoint: common strict remains
six words below the 5,340 ordinary-commit minimum and far below the 90% goal.

### Standalone AmE `are` rime (2026-10-20)

The existing `^are$` rime mapped every matching syllable to SQUARE `/ɛɹ/`,
including the bare function word `are`. Cambridge US records strong `/ɑːr/`
and weak `/ɚ/` for [are](https://dictionary.cambridge.org/us/pronunciation/english/are).
The syllable rule now selects `/ɑɹ/` only for a standalone, zero-onset `are`
form; `care`, `bare`, `share`, `prepare`, `compare`, and `square` retain their
onset-conditioned SQUARE reading. A frozen 1,296,352-prediction replay changed
exactly one row, rules-only `are`; the full before/after tables are at
`/tmp/phonemize-next-release/comfort-before-20261020.tsv` and
`/tmp/phonemize-next-release/are-after-rebuild-20261020.tsv`.

After the required dictionary and exception rebuild, common strict is
5,335/6,990 (+1), top-5,000 is 2,876/3,617 (+1), and lenient counts are
unchanged. Full-dictionary rules strict/lenient are 62,230/83,623 (+1/+0);
stress-aware phonemic/exact counts are 54,677/45,447 (+1/+1). Runtime parity
is unchanged at 94,775/100,806; public CMU default is 4,750/5,000 and rules is
4,136/5,000; context remains 87/85/53/49 and homographs remain 1,454/1,615.
All 355 Jest suites / 6,684 tests and typecheck pass. Five-module code count
remains 3,395 (g2p 1,145). This accumulated one-word gain is five words below
the ordinary 5,340 commit minimum and 957 words below the release common goal.

### Fresh candidate screens (2026-10-20)

The latest TRAIN-only structural learner replay used the fixed 6,990-word
population and ten spelling-family folds. It accepted 51 fold-local proposals,
but none passed the legacy candidate filter; mean held-out strict remained
74.54% before and after filtering. The most persistent proposal, weak `ire`
`/ɹ/` to `/ɝ/`, was accepted in all folds but passed none; it has only 6.3
affected words per fold on average and repeatedly trades gains for losses.
Full report: `/tmp/phonemize-rule-corrections/cv-common-report.json`.

The full postlex removal replay covered 107,645 words and all 176 active rules.
No removal both improves common strict and avoids a full-dictionary regression.
The only rule removal with a common strict gain was the `-ett` `/ɪt/` to `/ət/`
adjustment: it fixes `Bennett` (+1 common strict) but loses 32 full-dictionary
strict words, so it is rejected. Full win/loss evidence:
`/tmp/phonemize-postlex-diagnosis/results.json`. No runtime rule was changed.

### Shared `en/in + quire/quiry` family (2026-10-20)

Cambridge US supports /ɪnˈkwaɪr/ for [inquire](https://dictionary.cambridge.org/us/pronunciation/english/inquire),
and /ˈɪn.kwɚ.i/ or /ɪnˈkwaɪ.ri/ for [inquiry](https://dictionary.cambridge.org/us/pronunciation/english/inquiry);
the parallel [enquire](https://dictionary.cambridge.org/us/pronunciation/english/enquire)
and [enquiry](https://dictionary.cambridge.org/us/pronunciation/english/enquiry)
forms share that pattern. A general `-quiry` rime plus the productive en-/in-
prefix frame now predicts the family without whole-word mappings. Paired tests
retain acquire, require, query and quiet controls. The final frozen
1,296,352-row dump changed 27 rows from the post-are snapshot: two dictionary
rows, five rules rows and twenty synthetic morphology forms. The data rebuild
restored the non-target standalone `quiry` and `daiquiri` forms.

After dictionary, compound-part and exception rebuilding, common strict/lenient
is 5,337/6,370 of 6,990 (+2/+2 from 5,335/6,368), and top-5,000 is
2,877/3,351 of 3,617 (+1/+1). Full rules strict/lenient are 62,232/83,626;
runtime parity is 94,775/100,678; stress-aware phonemic/exact is
54,680/45,447 of 90,310; CMU default/rules is 4,750/4,137 of 5,000. Context
default-auto remains 87/108 (the fixed 88-case supported subset is 83 strict),
and homographs remain 1,454/1,615. The `-quiry` rules test, apostrophe issue
regressions, full 356-suite/6,702-test Jest run, typecheck, Rollup build,
`git diff --check` and extracted npm tarball CJS/ESM main/core/English smoke
tests passed; the package checks include O'Reilly Media and all four target
forms. Five-module count is 3,394. The ordinary commit
minimum is still 5,340 common strict, three words above the current score; the
90% release gaps are 955 common and 379 top-slice words. Do not refresh
baselines or commit this accumulating batch yet. Final frozen dumps and the
packed artifact are under `/tmp/phonemize-next-release/`. A fresh dispatcher
replay verified all 6,990 baseline predictions but found no bypass with net
strict gains; disabling morphology falls to 4,701 strict and the unsplit
alternative to 4,588. Full route fingerprints and win/loss rows are in
`/tmp/phonemize-next-release/quiry-next-routes/report.json`.

### Expanded TRAIN-only spelling search (2026-10-20)

Fresh 10-fold replays on the rebuilt 6,990-word population accepted 39 basic,
54 structural, and 92 expanded/triples proposals. None passed the existing
train-only filter; held-out strict stayed at 74.58% before and after the
accepted sets. The most promising expanded candidate changes unstressed `/ɪ/`
to schwa in a `t...in` spelling environment (pooled train +63/−0, top slice
+36/−0), but it conflates different established readings: Cambridge gives
final `/ɪ/` in [bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin)
and [Latin](https://dictionary.cambridge.org/pronunciation/english/latin),
while it gives `/ə/` in [satin](https://dictionary.cambridge.org/us/pronunciation/english/satin)
and US [Martin](https://dictionary.cambridge.org/us/pronunciation/english/martin).
The broader spelling cue therefore cannot be adopted as an accuracy gain.
All candidate-level win/loss and fold evidence remains in
`/tmp/phonemize-next-release/learn-common-next/`,
`learn-structural-next/`, and `learn-expanded-triples/`.

### Rejected extension of weak `be-` prefix stress (2026-10-20)

Adding `be` to the existing multi-syllable weak-prefix loop changes many names
that merely begin with those letters. The broad candidate changed 1,457 frozen
rows and lowered common strict/lenient from 5,337/6,370 to 5,336/6,368.
Restricting it to a syllabified `be` plus a three-slot silent-e form reduced
the diff to 81 rows and raised common/top-slice strict by one each, but still
lowered runtime parity from 94,775 to 94,772, full-dictionary lenient from
83,626 to 83,625, and changed non-prefix readings such as Beneke, Benites and
Berube. Both prototypes were reverted; current common and parity counts were
rerun and match the accepted `-quiry` candidate. Frozen experiments are
`/tmp/phonemize-next-release/be-prefix-candidate.tsv` and
`/tmp/phonemize-next-release/be-silent-e-exactprefix.tsv`.

### Rejected `-cent/-ent` stress-and-vowel generalization (2026-10-20)

The fresh common-word mismatch report contains five `-cent` failures and 32
`-ent` failures. `percent` rules-only predicts `/ˈpɝsənt/`, while Cambridge US
records `/pɚˈsent/` ([Cambridge pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/percent)).
The neighboring high-frequency controls do not support one suffix repair:
`recent` needs initial stress and schwa, `decent` needs initial stress and a
high vowel, `descent` needs final stress and `/ɛ/`, `accent` has initial stress
and `/ɛ/`, and `consent` already has final stress and `/ɛ/`. These are distinct
stress or vowel patterns despite the shared spelling. No runtime rule or
word-specific mapping was added; the captured route comparison is in
`/tmp/phonemize-next-release/percent-family-trace.log`.

### `-ity` common-score differences checked against Cambridge (2026-10-20)

The common mismatch report has 25 words ending in `-ity`, including charity,
facility, humanity, and nudity, where the CMU reference often uses `/ɪ/` for an
unstressed vowel that the rules emit as `/ə/`. Cambridge US records `/ə/` in
[charity](https://dictionary.cambridge.org/us/pronunciation/english/charity),
[facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
and [humanity](https://dictionary.cambridge.org/us/dictionary/english/humanity),
matching the rule output in those forms. Changing the general `-ity` vowel to
`/ɪ/` to match CMU would therefore count a reference-convention change as a
pronunciation gain and break the paired standard-dictionary evidence. No rule
or reference was changed; route traces are in
`/tmp/phonemize-next-release/ity-family-trace.log`.

### Rejected general final `-ire` schwa insertion (2026-10-20)

The expanded common-word learner repeatedly proposed changing final `/aɪɹ/`
to `/aɪɝ/`, fixing acquire, desire, empire and require. It also breaks
inquire and vampire in every family fold; full-fold affected sets are only
6–8 words with fix rates below 0.60. Cambridge confirms the variation is
lexical/POS-sensitive: US [acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)
has `/aɪɚ/`, while [spire](https://dictionary.cambridge.org/us/pronunciation/english/spire)
and verb [tire](https://dictionary.cambridge.org/us/pronunciation/english/tire)
have `/aɪr/`. Cambridge also records US
[inquire](https://dictionary.cambridge.org/us/pronunciation/english/inquire)
and [desire](https://dictionary.cambridge.org/us/pronunciation/english/desire)
with `/aɪr/`, while [require](https://dictionary.cambridge.org/us/pronunciation/english/require)
is `/aɪr/` too. Thus neither `<ire>` nor `<quire>` alone predicts which
accepted US reading has an unstressed rhotic vowel. The current rules-only
routes for acquire, require, and inquire also differ, so a blanket rime change
is unsound. No mapping was added. Fold win/loss evidence is in
`/tmp/phonemize-next-release/learn-expanded-triples/cv-common-report.json`.

### Common `-age` mismatches checked against Cambridge (2026-10-20)

The current mismatch report has 28 `-age` words, many marked wrong because the
rule route uses `/ɪdʒ/` while CMU uses `/ədʒ/`. Cambridge US confirms `/ɪdʒ/`
for [postage](https://dictionary.cambridge.org/us/pronunciation/english/postage),
[drainage](https://dictionary.cambridge.org/us/pronunciation/english/drainage),
[heritage](https://dictionary.cambridge.org/us/pronunciation/english/heritage),
[percentage](https://dictionary.cambridge.org/pronunciation/english/percentage),
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
[cottage](https://dictionary.cambridge.org/us/pronunciation/english/cottage),
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
and [village](https://dictionary.cambridge.org/us/pronunciation/english/village).
The shared ending alone therefore cannot justify changing the rule to schwa;
the mismatch group includes accepted pronunciations that the pinned CMU form
does not represent. No runtime rule or reference was changed.

### Rejected broad `-ical` schwa repair (2026-10-20)

The fresh common-word clusters show apparent `/ɪ/` → `/ə/` mismatches in
applicable, chemical, biblical, clinical, article and related forms. This is
not one pronunciation class: Cambridge US gives `/əˈplɪkəbəl/` for
[applicable](https://dictionary.cambridge.org/us/pronunciation/english/applicable)
and `/ˈkɛmɪkəl/` for
[chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical),
matching the rules output rather than the pinned CMU entry. The proposed
blanket reduction would turn valid standard readings into apparent score gains
by following one reference convention. No runtime rule or benchmark reference
was changed. Current mismatch and cluster reports are
`g2p-mismatches-common-report.txt` and
`/tmp/phonemize-next-release/current-clusters-20261020.log`.

### Rejected initial clear-L notation repair (2026-10-20)

`last` is a one-edit common mismatch because the rules output `/ɫ/` while the
CMU form writes `/l/`. This is notation/convention, not a newly discovered
word-boundary rule: the runtime intentionally normalizes every `/l/` to `/ɫ/`
to match the English dictionary representation. A prior onset-cluster clear-L
experiment diverged from the lexicon on about 5,400 words and was removed.
No runtime output or scorer was changed; current evidence is in
`g2p-mismatches-common-report.txt`, the `last` trace, and the final-dark-L
normalization in `src/en/g2p.ts`.

### Rejected unconditional `en-` weak-prefix stress (2026-10-20)

Adding `en` to the general weak-prefix list has no strict wins in the fixed
common subset and changes three previously-correct words into failures:
enable, engine and envelope. Common strict falls 5,337→5,334 and top-5,000
falls 2,877→2,875; full-dictionary strict and lenient totals happen to remain
flat, which would hide this target-slice regression. The candidate was removed
and the baseline common scores restored. Before/after reports and controls are
`/tmp/phonemize-next-release/en-prefix-baseline-mismatch-report.txt`,
`en-prefix-candidate-mismatch-report.txt`,
`en-prefix-candidate-trace.log`, and `en-prefix-candidate.log`.

### Full-length family-fold learner replay (2026-10-20)

Repeating the structural learner with `--include-long` expands its population
to 7,097 common testable entries and 5,123 actual rule-path entries. Across
ten spelling-family folds it accepted 46 train-selected proposals; none
passed the existing train-only filter, and held-out strict stayed at a 74.33%
mean. The persistent `<c>` + unstressed `/ɪ/` → `/ə/` proposal has pooled
train wins/losses of 50/24 and top-5,000 wins/losses of 25/16; its folds
repeatedly trade acid, explicit and medicine gains against appreciate,
associate and calcium regressions. No rule or baseline was changed. Complete
replay: `/tmp/phonemize-next-release/learn-full-20261020/` and
`learn-full-20261020.log`.

### Office-family Cambridge vs CMU route check (2026-10-20)

The public dictionary route already gives `office` /ˈɔfɪs/; the rules-only
route reduces its final `i` to /ə/. `offices` and `officer` also take
morphology routes whose CMU reference uses /ə/, while Cambridge US explicitly
records /ɪ/ in [office](https://dictionary.cambridge.org/pronunciation/english/office)
and [officer](https://dictionary.cambridge.org/us/pronunciation/english/officer).
The same spelling family includes `official` and `officious`, where the
existing stressed /ɪ/ behavior is already correct. A broad `-fice` rewrite
would therefore mix stress environments and would turn the fixed CMU comparison
into a regression even though the public `office` output is already correct.
No runtime rule or evaluation reference was changed; see
`/tmp/phonemize-next-release/office-family-current.log` for the route trace.

### Weak posttonic `<i>` in unprefixed `con-ti-n` frames (2026-10-20)

The rules now centralize the posttonic `<i>` in the unprefixed
`con·ti·nent` / `con·ti·nuity` frames. Cambridge US supports /ə/ in
[continental](https://dictionary.cambridge.org/us/pronunciation/english/continental)
and [continuity](https://dictionary.cambridge.org/us/pronunciation/english/continuity).
The condition requires the literal `con` syllable and next syllable `nen` or
`nuity`, so `continue`, `continuous`, `continuation` and `subcontinent` keep
their paired readings. The frozen rules snapshot changes only `continental`,
`continental's` and `continuity`; no word map was added.

After rebuilding the mined exception table, common strict is 5,339/6,990
(+2), common lenient 6,370, top-slice strict/lenient 2,877/3,351, and public
CMU default 4,750/5,000. Rules-only CMU is 4,137/5,000 and remains below its
legacy floor. Stress-aware is 54,680 phonemic / 45,449 exact, parity is
94,775/100,806 strict / 100,678 lenient, homographs are 1,454/1,615, and the
context cells remain 87/85/53/49. The strict gaps are 953 common and 379
top-slice words. These gains do not meet the ordinary 70-word commit minimum.

The rebuilt table also changes `discontinuity` relative to the old mined table.
The same output appears in fresh builds with and without this candidate, so it
comes from clearing stale mined entries rather than the new class; it remains
outside this rule's positive evidence. The complete pre/post-build prediction
comparison, including generated morphology rows, is in
`/tmp/phonemize-next-release/contin-tin-postbuild-final-20261020.tsv` and
`/tmp/phonemize-next-release/contin-tin-before-20261020.tsv`. The fresh
candidate and no-candidate exception tables are saved alongside them.

Paired rule tests preserve the listed neighboring forms. Full Jest passes
(357 suites / 6,708 tests), typecheck passes, the rebuilt Rollup output passes
CJS/ESM main/core/English smoke checks for issue #28 and both corrected words,
and the full strict evaluator was rerun. No baseline was refreshed or commit
made.

### Full-length common structural learner replay (2026-10-20)

The learner was rerun after the rebuilt candidate table on all 7,097 common
testable entries (5,123 actual rules-path entries), with ten spelling-family
folds. It accepted 44 candidates across folds; none passed its TRAIN-only
legacy filter, and held-out strict stayed at a 74.37% mean before and after.
The repeated weak-`c` candidate again trades 50 wins for 24 losses overall and
25 wins for 16 losses in top-5,000. The `-ire` rhotic-vowel candidate also
fails the filter in every fold. No additional rule was adopted. Full report:
`/tmp/phonemize-next-release/learn-postbuild-20261020/cv-common-report.json`.

### Rejected broad initial pretonic `<ar>` reduction (2026-10-20)

Cambridge US confirms `/əˈraʊnd/`, `/əˈreɪndʒ/` and `/əˈraɪz/` for
[around](https://dictionary.cambridge.org/us/pronunciation/english/around),
[arrange](https://dictionary.cambridge.org/us/pronunciation/english/arrange)
and [arise](https://dictionary.cambridge.org/pronunciation/english/arise),
while the current rule snapshot collapses the first nucleus to `/ɝ/` in these
frames. The class cannot be applied across initial `<ar>` words under the
unchanged strict reference contract: a frozen-output segment screening
transform replacing the initial `/ɝ/` with `/əɹ/` yields only 5 wins and 29
losses in the full dictionary, 2 wins and 7 losses in the common subset, and 1
win and 1 loss in top-5,000. The losses
include `arrive`, `arrange`, `arise`, and their derivatives because the pinned
dictionary uses `/ɝ/` there. No rule or reference was changed. The snapshot
screen is diagnostic only; complete route evidence is in
`/tmp/phonemize-next-release/route-audit-20261020/report.json`.

### Weak-`<ci>` candidate checked against Cambridge US (2026-10-20)

The full-fold learner repeatedly proposes changing unstressed `<ci>` /ɪ/ to
/ə/. Its apparent wins are not reliable pronunciation gains: Cambridge US
retains /ɪ/ in [acid](https://dictionary.cambridge.org/us/pronunciation/english/acid),
[Cincinnati](https://dictionary.cambridge.org/pronunciation/english/cincinnati)
and [explicit](https://dictionary.cambridge.org/pronunciation/english/explicit),
where the pinned CMU forms use schwa. In [medicine](https://dictionary.cambridge.org/pronunciation/english/medicine),
Cambridge US has /ˈmedɪsən/: centralizing the second `<i>` repairs only its
final syllable, while the current rules have already reduced the first medial
`<i>`. A broad `<ci>` rule would therefore preserve reference mismatches and
break standard US readings. It remains rejected; no source or evaluation table
was changed.

The other repeated weak-vowel candidates fail the same source check. The
learner's `/ə/` → `/ɪ/` proposal in `-nity` fixes CMU rows for `humanity` and
`maternity`, but Cambridge US gives `/hjuːˈmæn.ə.ti/` for
[humanity](https://dictionary.cambridge.org/us/pronunciation/english/humanity)
and `/məˈtɝː.nə.ti/` for
[maternity](https://dictionary.cambridge.org/us/pronunciation/english/maternity).
It also proposes breaking `community`, `opportunity` and `unity`, which retain
/ə/ in their Cambridge US pronunciations. No part of this weak-`nity` candidate
was adopted.

### Full-length distance-objective structural learner replay (2026-10-20)

The learner was replayed against the same 6,990-word common population with ten
spelling-family folds, optimizing edit distance rather than exact matches. It
accepted 25 fold-local candidates across nine readings, but none passed the
TRAIN-only legacy filter in any fold. Held-out strict averaged 74.62% both
before and after filtered candidates. The leading `-ire` rhotic-vowel proposal
traded 33 training fixes for 16 breaks overall; the other repeated vowel
changes also failed the filter. No runtime rule or baseline changed. Report:
`/tmp/phonemize-next-release/distance-structural-20261020/cv-common-report.json`.

High-frequency residual examples were checked before considering lexical
changes. Cambridge US lists both strong `/frʌm/` and weak `/frəm/` for
[from](https://dictionary.cambridge.org/us/pronunciation/english/from), so its
context-dependent reading cannot justify changing the isolated rule output.
[Email](https://dictionary.cambridge.org/pronunciation/english/email) is
`/ˈiː.meɪl/`; the rules-only mismatch is an initial `<e>` class question, while
the public dictionary route already supplies the pronunciation. Neither case
supports a broad new rule in this batch.

### Rejected weak `<i>` before final `-ce` candidate (2026-10-20)

A frozen 1,296,352-row prediction dump was used to test preserving weak `<i>`
in the syllable before final `ce`. Against the unchanged pinned reference, the
candidate had 1 strict win and 10 losses in the common set (top-5,000: 1 win,
7 losses), moving the rule score from 5,339/6,990 to 5,330/6,990. It was
reverted. This is a reference conflict worth tracking: Cambridge US gives
/ɪ/ in [office](https://dictionary.cambridge.org/pronunciation/english/office),
[practice](https://dictionary.cambridge.org/us/pronunciation/english/practice),
[notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[service](https://dictionary.cambridge.org/us/pronunciation/english/service)
and [justice](https://dictionary.cambridge.org/us/pronunciation/english/justice),
while the pinned rows give schwa in several of these. A benchmark correction
would require a separately versioned reference and rescore; the rule candidate
is not counted as a gain under the current contract. Before/after snapshots
and the exact affected-row comparison are in `/tmp/phonemize-next-release/`.

### Stressed `veh-` spelling class and release gates (2026-10-20)

The stressed `veh-` frame now keeps /i/ in `vehicle`, its plural and
possessive, while weak `veh-` in `vehicular` remains /ɪ/. Cambridge US lists
the three-syllable /ˈviː.ə.kəl/ reading and also /ˈviːɪkəl, -hɪkəl/; its
vehicular entry has /viˈhɪk.jə.lɚ/. The accepted `-hɪ-` vehicle variant is
therefore covered without a word map. Paired cases include even and evidence.

After the exception-table rebuild, common rule strict is 5,340/6,990
(76.39%, +70 vs the 2026-10-17 committed 5,270 baseline); the top-5,000 slice
is 2,878/3,617 (79.57%). Lenient counts are 6,370/6,990 and 3,351/3,617.
Full-dictionary rule strict/lenient is 62,237/105,067 and 83,628/105,067;
runtime parity is unchanged at 94,775/100,806 strict and 100,678/100,806
lenient. Stress-aware en-US phonemic is 54,683/90,310 (+182 vs baseline),
homographs are 1,454/1,615, and context IPA remains 87/108 in default/auto
and 85/108 in default/gold. Public CMU segment accuracy is 4,750/5,000
(default) and 4,138/5,000 (rules-only, +1 vs the prior 4,137); the rules-only
legacy 90% gate remains unmet. No gate regressed. The five baselines were
refreshed after manual comparison against the before-run counts.

Issue #28 coverage now also checks O'Brien and O'Reilly Media in complete
sentences, curly apostrophes, possessives, and unattested O'Reily spelling
without adding a pronunciation map. Full Jest passed before the neutral
compression pass (358 suites / 6,714 tests); typecheck passed, and the three
focused apostrophe/issue/vehicle suites passed after it.

The five English rule modules reached 3,399 effective code lines, four above
the retained 3,395 cap. A behavior-neutral pass grouped adjacent rows in the
stress-neutral morphology table and combined two declarations. The frozen
1,296,352-row dumps are byte-identical before and after at
`/tmp/phonemize-next-release/pre-compress-20261020.tsv` and
`/tmp/phonemize-next-release/post-compress-20261020.tsv`; the total is now
3,395. Direct Rollup succeeded. `yarn build` itself could not start its
`tsx`-based prebuild because the sandbox rejected the local IPC pipe with
`EPERM`; the dictionary had already been rebuilt through the documented
direct Node sequence before gates were rerun.
