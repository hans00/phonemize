# Next-release accuracy plan

The release target remains strict accuracy **above 90%** on both fixed English
common-word populations. Passing the previous 70% checkpoint does not satisfy
this release target. Filters, normalization and cohort denominators stay fixed;
no runtime model, name lexicon or whole-word G2P/POS code exceptions are added.
Independently verified source-reference corrections are reported separately.

## Release requirements and latest measured working tree (2026-10-23; last successful rebuild)

| Metric | Release requirement | Current |
|---|---:|---:|
| English common rules strict | >=6292/6990 | 5550/6990 (79.40%) |
| Common top-5000 slice rules strict | >=3256/3617 | 2997/3617 (82.86%) |
| Public CMU default segments | >=4739/5000 | 4748/5000 (94.96%); rules 4220/5000 (84.40%, legacy 90% floor still fails) |
| Context default/automatic strict | >=87/108 | 88/108 |
| Homograph eval | >=1454/1615 | 1455/1615 |
| Issue #28 apostrophe-name handling | Class regression and packaged verification | Passed; O’Reilly Media checked |

Remaining strict gaps: 742 common words and 259 top-slice words. The context
and homograph thresholds are now met. These counts are release gaps, not a
claim that independent isolated fixes will transfer to full sentences. The
2026-10-23 initialism-table fallback adds 95 full-dictionary strict matches
and 19 common strict matches against its frozen pre-change predictions, with
zero full-dictionary strict losses. It preserves POS/sentence handling by
using registered entries only on the rules path; the paired spoken `sr` onset
control remains rule-derived. This gains no new runtime pronunciation list:
the build's existing, separately vouched initialism table is reused. The
public CMU rules score remains below its legacy 90% floor but improves over
the frozen pre-change score. No baseline was refreshed.

The preceding integration snapshot measured full-dictionary rules at
62,876/105,071 strict and 83,877/105,071 lenient; runtime parity was
94,805/100,810 strict and 100,704/100,810 lenient. Public default CMU
accuracy was 4,749/5,000. Its Rollup build passed package CJS and ESM issue-28 smoke checks for
O'Brien, O'Reilly Media and possessives; the regression test also covers apostrophe
variants and the illustrative O'Reily spelling. These counts do not imply
that isolated-word gains will transfer to full sentences. The
latest behavior changes include the `-rry`/`-riage`, `-cialty`, Greek
`-terion/-teria`, rhotic `-urrent/-urrant`, weak initial `celebr-`, temporal
`now` rime, and doubled-z inflection classes below; their
snapshots, rebuilds, metric gates and paired controls passed. The `current`
dictionary row was separately corrected to Cambridge US /ˈkɝː.ənt/; gains
from that source/reference correction are not counted as rule gains.
The latest rebuild and complete acceptance run are recorded below; the release
target remains unmet. On 2026-10-23, the source normalizer corrected eight
authoritatively verified `-nted/-nting` reference rows, two in the common
cohort. This moves the displayed common score from 5,492 to 5,494 but is not a
G2P rule gain; the prior fixed-reference common score is 5,492. No baseline was
refreshed.

The 2026-10-23 Cambridge US review corrected the source vowel reference
from /ə/ to /ɪ/ in *biblical, chemical, clinical, hypothetical, medical,
numerical, practical, radical,* and *typical*. Cambridge US retains /ə/ in
*political*, which remains the negative control. The same review corrected
*American* and *African* from /ə/ to /ɪ/ using Cambridge US. These two source
corrections add two common strict matches; they are not G2P rule gains. *Mexican*
and *Republican* corrections were rolled back because they reduced the fixed
public CMU score by two; the difference between Cambridge US and pinned CMU
remains an open source conflict. Common strict is 5,525/6,990. Post-build
scores are 62,876/105,071 full strict, 94,805/100,810 parity strict,
54,867/90,313 stress-aware, and 4,749/5,000 public CMU default (4,213/5,000
rules). Homograph remains 1,455/1,615 and default context remains 88/108.
The train-only family learner selected 9 non-structural and 29 structural
candidate rules across folds, but none passed the existing adoption filter;
the structural candidates reduced pooled held-out strict from 3,867 to 3,861.
No candidate rule was adopted or baseline refreshed. Full Jest passes 422
suites/7,306 tests and typecheck passes.

The 2026-10-23 rebuilt candidate `-ally` derivation uses the rule-derived
`personal` root when available. This repairs *personally* without a word map:
common strict rises 5,549→5,550 and top-slice strict 2,996→2,997, with no
strict losses in the frozen rule-path replay. The fixed 6,990-word target still
needs 742 additional strict matches, so this small gain remains uncommitted and
no baseline is refreshed. Rebuilding the mined dictionary completed with 532
dependency-aware re-pins (535 resolved, 5 net-positive regressions retained).
The train-only 10-fold learner found 5 distinct spellings but zero candidates
passed the adoption filter; applying all selected candidates would reduce
pooled held-out strict from 3,875 to 3,863. No learner candidate was adopted.
Current gates: full-dictionary strict/lenient 62,908/83,889 (105,078 words),
runtime parity 94,808/100,817 strict and 100,711/100,817 lenient, stress-aware
54,884/90,320, public CMU default/rules 4,748/5,000 and 4,220/5,000,
homographs 1,455/1,615, and context default/auto 88/108. The context
default/gold 85/108 cell equals its saved baseline; all four IPA cells and the
fixed POS-supported subsets pass their saved gates. Typecheck and all 435 Jest
suites / 7,467 tests passed before the final added brand regression; that
focused suite is rerun separately. No baseline was refreshed.

Cambridge US records the weak vowel in both *personal* and *personally*,
supporting the derived reading rather than the exception-table root reading
([personal](https://dictionary.cambridge.org/pronunciation/english/personal),
[personally](https://dictionary.cambridge.org/pronunciation/english/personally)).

The clarified brand is **O’Reilly Media**. The existing dictionary route reads
straight and curly apostrophes alike in the full sentence `O’Reilly Media`;
the issue regression now pins that behavior alongside *Seann* and its common
doubled-consonant controls. Cambridge records the surname *Reilly* as
/ˈraɪ.li/ in US English, consistent with the brand reading. The rules-only
fallback still reads this surname spelling differently, so this test documents
the currently supported lexicon-backed name rather than claiming a general
name-rule improvement. [Cambridge pronunciation entry](https://dictionary.cambridge.org/pronunciation/english/reilly).

The full-population structural learner was rerun with long words enabled over
7,104 common-testable words and 5,087 pure-rule-path words, grouped into ten
spelling-family folds. Its 31 locally selected candidates produced seven
distinct readings, but none passed the existing paired-loss filter; applying
all accepted candidates reduced mean held-out strict from 76.29% to 76.06%
(3,881 to 3,869 strict matches across 5,087 held-out predictions). Repeated
proposals such as unstressed `/ɪ/→/ə/` at a syllable slot mixed real gains with
errors in *affiliate, analyze, college,* and *Halifax*. The simple grapheme
learner likewise had zero passing rules. This evidence rules out widening a
phoneme-wide stress adjustment. Next investigations will rank actual
high-frequency morphology families and source-verified variants, replay them
through runtime dispatch, and require full-dictionary plus context controls
before adding any class rule; no runtime code or baseline changed in this
diagnostic turn.
The frozen replay is `/tmp/phonemize-after-ical-reference.snapshot.tsv`
(SHA-256 `1f680ca8eaa08f22385093d4db6d5aa574b8759a88a4181a080ce5648d11a869`);
fold reports are under `/tmp/phonemize-rule-learn-20261023/` and
`/tmp/phonemize-rule-learn-structural-20261023/`. Full route and postlex
diagnostics are under `/tmp/phonemize-route-diagnosis/` and
`/tmp/phonemize-postlex-diagnosis/`.

The active five-module source count after the latest neutral compression is 3406
(g2p 1161, syllabify 1702, postlex 497, morph-table 20, morph-parser 26), still
above the retained 3395 cap and the 1150-line G2P trigger. A further syntax-only
compression pass saved 25 code lines; its full 1,296,407-prediction snapshot is
byte-identical to the post-rebuild reference (SHA-256
`bb7afdf7688b0a3e87b0ccaeb13eb14055a1580db9a878574c908deda3d61e40`). Typecheck
and all 426 Jest suites / 7,340 tests pass. The remaining 11-line G2P overage
was left intact rather than trading readable control flow for line-count-only
compression; adoption and baseline refresh remain pending until the retained
compression triggers and accuracy gaps are resolved.

The latest common-cluster replay still shows mixed initial-vowel errors rather
than one transferable spelling class. Full-route ablation found no strict
improvement from removing an existing morphology route; its sole lenient win
was `maturation`. Full postlex ablation also rejected an apparent `-itive`
adjustment: removing the short-`ɪ` reduction loses 6 strict words overall and
3 in common, with no common lenient gain. No rule was adopted from these
diagnostics; win/loss reports are in `/dev/shm/phonemize-current-routes-20261023`
and `/dev/shm/phonemize-current-postlex-20261023`.

Premise tested on 2026-10-23: the remaining strict errors are dominated by a
few simple local grapheme/phoneme environments that spelling-family learning
can turn into transferable rules. The current top 20 direct-rule clusters sum
to 874 rows, but the largest cluster has 179 and their example words mix
acronyms, names, morphology and unrelated vowel/stress frames. A fresh
10-fold family-grouped learner accepted 8 candidates in at least one fold;
none passed its train-only diagnostic, and replaying all accepted candidates
reduced pooled held strict from 3,874/5,065 to 3,869/5,065. This contradicts
the premise for the current local-rule learner. The next diagnostic therefore
checks how dictionary-attested abbreviations enter the existing initialism
path, while retaining the same fixed accuracy cohorts and gates. The report is
`/dev/shm/phonemize-premise-probe-20261023/cv-common-report.json`.

Re-running both family-fold learners on the current post-son/ton tree yielded
4 distinct accepted non-structural readings and 6 structural readings across
10 folds; none met the legacy train-only diagnostic. The best structural
candidate changed unstressed /ɪ/ by syllable slot, but fixed words at only
24% and introduced 10 top-5000 breaks. Applying every accepted candidate
reduced held-out strict from 3,872/5,065 to 3,867/5,065, so no learned rule
was adopted. Current-fold reports are in
`/dev/shm/phonemize-next-learner-20261023` and
`/dev/shm/phonemize-next-learner-structural-20261023`.
Manual review of the repeated posttonic-/ɪ/ candidates also found source
conflicts: Cambridge US has /ɪ/ in *cabin, orbit, robin, cubic,* and *exhibit*,
while the pinned CMU/reference rows use schwa in the first three. Thus the
learner's broad centralization would move several valid readings toward one
reference while breaking *cubic* and *exhibit* controls; it was not adopted.
The initial `ex-` errors in *exercise, expert,* and *expertise* are separately
attested by Cambridge, but *exert* keeps /ɪɡz/, so there is no supported shared
initial-`ex` rewrite yet.
A trial merge of adjacent same-output phoneme rules was reverted because
runtime guards inspect exact regex source strings; the restored 1296352-row
snapshot is byte-identical (SHA256
`0ffceb833a8cda973335839f9c4806de57ed3073d27c2c188422d176bae78787`). A
safe compression pass remains required before adoption.

The expanded family learner's `t` → schwa candidate before unstressed `in`
was rejected: its apparent common-word gains mix incompatible words, and
Valentine's /aɪ/ became worse. Cambridge US supports more than one pattern in
bulletin and platinum, and schwa in satin and the noun martin; Latin is /ɪ/ in
Cambridge US but /ə/ in the pinned CMU reference. A temporary Latin correction
lowered public CMU default from 4,749/5,000 to 4,748/5,000, so it was withdrawn
under the fixed-reference no-regression contract. No pronunciation rule or
benchmark expectation was changed. The user clarified that O'Reilly Media is
the brand example and O'Reily is illustrative; the existing apostrophe class
regression remains the intended coverage.

The distance-objective spelling-family learner also completed ten folds: 32
candidate readings were accepted for diagnosis, none passed the existing
filter, and held-out strict stayed at 76.45%. Fixed-common trace clusters are
led by initial /ɪ/ (179 errors), initial /æ/ (130), and /ɪ/ or /ɛ/ for the
grapheme `e` (71 and 68). These are first-divergence trace labels, not valid
spelling classes by themselves; names, homographs and reference variants are
mixed in. The next pass should split those clusters by stress, syllable slot,
and lexical route before proposing any vowel rule.

The 2026-10-23 `discl-` review confirmed Cambridge US disclosure
/dɪˈskloʊʒɚ/ and applied the same onset/stress placement to *disclaim, disclaimer,
disclose, disclosed, disclosing,* and *disclosure*. This is a spelling-class
normalization in the G2P pipeline, with no per-word mapping. The existing
`discr-` forms remain outside the condition. Focused tests passed for rules and
default paths; the full suite passes 426 suites / 7,349 tests. Typecheck passes.
The frozen 1,296,407-row replay changed 6 dictionary entries, 7 direct rule
entries, and 54 generated suffix probes; all changed spellings begin `discl-`,
and the adjacent `discr-` controls are unchanged.
The final gates report common strict 5,532/6,990 and top-slice 2,992/3,617;
full-dictionary strict/lenient 62,881/105,071 and 83,880/105,071; runtime
parity 94,805/100,811 strict and 100,705/100,811 lenient; stress-aware 54,877
/90,314 (+92 against baseline); default context 88/108; homographs 1,455/1,615;
and public CMU default 4,749/5,000. The rules-only CMU score is 4,214/5,000,
nondecreasing versus its 4,213 pre-change result, while retaining the known
legacy floor failure. The >90% common-word release targets and source compression
triggers remain unmet; no baselines were refreshed.

The fixed public CMU 5,000-item error report counted 13 mismatches ending in `-ity`.
It does not support a shared `/ə/ → /ɪ/` rule: current outputs for
[facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[celebrity](https://dictionary.cambridge.org/us/dictionary/english/celebrity),
[identity](https://dictionary.cambridge.org/us/dictionary/english/identity),
and [diversity](https://dictionary.cambridge.org/us/dictionary/english/diversity)
match Cambridge US, while the fixed CMU variants disagree on the posttonic
vowel. No rule or reference was changed; keep the fixed benchmark intact and
prioritize the next class only where paired source-backed controls support it.
An exact frozen-cohort replay of spelling-final `/əti/ → /ɪti/` confirms this
is not a safe repair: common strict falls 5,532→5,500 and top-slice strict
2,992→2,975. A broad written-`-ent` `/ənt/ → /ɛnt/` replay likewise falls
5,532→5,447 and 2,992→2,940. Neither candidate was adopted.

This turn's verified source-reference corrections and KIT-/age/-plural rule
add seven common strict matches and four top-slice strict matches against the
frozen pre-turn counts (5,484 and 2,966). The reference corrections are not
reported as G2P rule gains. The common cohort is a pinned manifest, so added
plural references cannot move either denominator. The authoritative 2026-10-22
common baseline is 5,459/6,990, making the next ordinary commit minimum 5,529;
the current 5,525 remains 4 words short, so this batch stays uncommitted and
no baseline is refreshed.

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
was rendered with the wrong stress and vowel. The original regression accepted
the IPA-Dict /oʊˈbɹaɪɪn/ row, but Cambridge US independently gives
/oʊˈbraɪən/ for the surname; the old expected reading was incorrect and is
superseded by the 2026-10-23 source correction below. The `O'Reilly Media`
example remains covered: `O'Reilly` is /oʊˈɹaɪɫi/, agreeing with Cambridge US
[/oʊˈraɪ.li/](https://dictionary.cambridge.org/us/pronunciation/english/o-reilly),
and `Media` remains a separate token. `O'Reily` was an illustrative similar
spelling, not the publisher's name or an alternative brand spelling.


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

A second suffix-level replay tested the apparent final `-ity` vowel class:
rewrite only final rule-path `/əti/` to `/ɪti/` for spellings ending in
`-ity`. On the exact evaluator populations (105,065 full, 6,990 common,
3,617 top-5,000), it produced 86 strict wins against 165 losses overall,
13/45 in the common cohort, and 7/24 in top-5,000; the class is rejected.
A parallel `-ical` replay changed `/ɪkəl/` to `/əkəl/`: it produced 28/89
full-dictionary wins/losses, 10/27 common, and 6/13 top-5,000. That suffix
also contains mixed readings and is rejected. No source or runtime change was
made. Frozen predictions for both replays are in
`/tmp/phonemize-aging-class-20261022/`.

The parity-population difference is now identified: compared with the frozen
100,806-word 2026-10-21 dump, today's 100,804-word population omits
`bennetts`, `evened`, and `evens`, while adding `acquirers`. The former three
still receive the same pronunciations through the current default pipeline
(`/ˈbɛnɪts/`, `/ˈivənd/`, `/ˈivənz/`); `acquirers` is present after the
independently verified `acquirer` reference correction. This is a population
membership change, so the current raw parity score cannot qualify against the
unchanged baseline denominator. The word-level comparison is reproducible with
`/tmp/phonemize-goal-20261021-parity.tsv` and
`/tmp/phonemize-final-parity.tsv`.

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

### Cambridge correction of IPA-Dict `investment` (2026-10-23)

The pinned IPA-Dict row for `investment` omits /t/ after /s/, while the
rules-path prediction contains it. Cambridge US gives /ɪnˈvest.mənt/ for
`investment` and /ɪnˈvest/ for `invest` ([investment](https://dictionary.cambridge.org/us/pronunciation/english/investment),
[invest](https://dictionary.cambridge.org/us/pronunciation/english/invest));
the suffix is transparently /-mənt/. Correct the source reference in
`src-data/en/custom.dict` and preserve its denominator row. This is an
authoritative reference correction, not a pronunciation-rule gain. Paired
tests retain `invest`, `investment` and unrelated `-ment` controls.

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

A follow-up tested mapping the weak final `fi` in `-fice` from /ə/ to /ɪ/.
It fixed rules-only `office`, but also changed the already-wrong rules readings
of `suffice` and `sacrifice`; the suffix stress assignment needs a broader
class diagnosis before those can serve as unaffected controls. Cambridge
supports /ˈɑː.fɪs/ for [office](https://dictionary.cambridge.org/us/pronunciation/english/office),
and [Cambridge grammar](https://dictionary.cambridge.org/us/grammar/british-grammar/possessives)
states possessive `’s` follows the same pronunciation rule as plural endings,
yielding /ɪz/ after final /s/. Correcting the CMU `office's`
reference alone exposed the unresolved rules error and lowered full-dictionary
strict from 62,254 to 62,253. The source and generated dictionary were restored
to their frozen hashes; no pronunciation rule, reference, or baseline change
was retained. Candidate replay: `/tmp/phonemize-fice-scan.cjs`.

### Common `-age` failures are CMU-vs-Cambridge vowel disagreements

The current common strict mismatch report has 27 non-foreign `-age` failures,
many where rules predict final /ɪdʒ/ and CMU expects /ədʒ/ (damage, cottage,
luggage, village). Cambridge US explicitly gives /ɪ/ in [damage], [cottage],
[luggage] and [village], so replacing the spelling-class output with schwa
would reduce pronunciation correctness to chase the pinned reference. This
cluster is not an adoption candidate unless the reference contract is
independently re-versioned; no source rule or score was changed.

[damage]: https://dictionary.cambridge.org/us/pronunciation/english/damage
[cottage]: https://dictionary.cambridge.org/us/pronunciation/english/cottage
[luggage]: https://dictionary.cambridge.org/us/pronunciation/english/luggage
[village]: https://dictionary.cambridge.org/us/pronunciation/english/village

A source-overlay trial then added Cambridge US readings for those four roots,
plus `message`, `package`, and `passage`. The rebuilt tables changed 93
snapshot rows, mostly derived forms. Common strict moved 5,373/6,990 to
5,375/6,989, with five derived-word regressions; `cottages` was trimmed after
the root correction, so the fixed denominator was lost. Runtime parity also
fell 94,778/100,805 → 94,777/100,804, and public CMU rules fell 4,168→4,166.
The seven overlays were removed and the full build restored the prior source,
dictionary, and exception hashes. This remains source evidence, not an adopted
rule gain; any future reference revision must preserve the fixed cohort and
pass every no-regression gate.

[message]: https://dictionary.cambridge.org/us/pronunciation/english/message
[package]: https://dictionary.cambridge.org/us/pronunciation/english/package
[passage]: https://dictionary.cambridge.org/us/pronunciation/english/passage

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


### Rejected blanket final `-ire` rhotic-vowel change (2026-10-21)

The structural learner repeatedly proposed changing final `/aɪɹ/` to
`/aɪɝ/`; one fold's replay fixes *acquire, desire, empire,* and *require* but
breaks *inquire* and *vampire*. Cambridge US confirms the class is not uniform:
[acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)
has `/əˈkwaɪɚ/`, while [desire](https://dictionary.cambridge.org/us/pronunciation/english/desire),
[empire](https://dictionary.cambridge.org/us/pronunciation/english/empire),
[inquire](https://dictionary.cambridge.org/us/pronunciation/english/inquire),
[require](https://dictionary.cambridge.org/pronunciation/english/require),
[retire](https://dictionary.cambridge.org/pronunciation/english/retire), and
[vampire](https://dictionary.cambridge.org/us/pronunciation/english/vampire)
use `/aɪr/`. This spelling class is therefore source-contradicted; no runtime
change was made.

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

### Common-set learner replay after the 2026-10-20 batch

The current route audit verified all 6,990 common predictions and compared
actual dispatch with morphology disabled and with the unsplit alternative.
The structural learner then replayed ten spelling-family folds over 5,099
rule-path words. It accepted 49 fold-local corrections; zero passed its
TRAIN-only filter, and mean held-out strict remained 74.64% before and after
filtered candidates. No candidate was adopted.

The apparent `-ire` change (`/ɹ/` → `/ɝ/`) looked strongest in the top-5,000
slice (25 fixes, no reference breaks), but each fold affected only 6–8 words,
below the 20-word support floor, and overall common training traded 33 fixes
for 16 breaks. Cambridge US agrees with the existing `/aɪr/` for [desire],
[empire] and [vampire]; its [acquire] entry gives `/əˈkwaɪɚ/`, which reflects
a transcription distinction rather than evidence for a general `-ire` vowel
rule. The separate `<c>`-before-weak-`i` proposal would repair Cincinnati,
explicit and medicine reference rows, but also breaks appreciate and associate;
it fails the filter in every fold and conflicts with Cambridge US readings
already recorded above. This replay added no runtime candidate or baseline
change.

The postlexical ablation audit replayed 107,645 words, including long forms and
recursive stems. It found no postlex rule whose removal improves both all-word
and common strict without a paired loss. Removing the conditional -ett
reduction could gain one common strict match but loses 32 full-dictionary
strict matches; the `/nð$/` rule has no common-set effect and removing it costs
one full-dictionary lenient match. No postlex change was made. Full results:
`/tmp/phonemize-next-release/postlex-20261020/results.json`.

### Follow-up: `every-` root split (2026-10-20)

Cambridge US confirms /ˈev.ri/ for [every](https://dictionary.cambridge.org/pronunciation/english/every), [everyone](https://dictionary.cambridge.org/pronunciation/english/everyone), [everybody](https://dictionary.cambridge.org/pronunciation/english/everybody), [everything](https://dictionary.cambridge.org/pronunciation/english/everything), [everywhere](https://dictionary.cambridge.org/pronunciation/english/everywhere) and [everyday](https://dictionary.cambridge.org/pronunciation/english/everyday). The isolated rules path split `every` as `e · very` and reduced the second syllable's `er` to /ɝ/. A narrow root-boundary rule now retains /ɹ/; `very`, `verywell`, `several`, `cleverly`, `delivery`, `reverie` and `everydayness` are paired controls. Tests also cover everyone, everybody, everything, everywhere, everyplace, everyday and possessive everywhere's.

The morphological compounds first reused the dictionary's old `every` stem,
so the rule alone fixed `every` but did not carry through every compound. The
existing custom overlay now supplies one source-checked stem reading,
`EH1 V R IY0`, which lets the existing general composition handler carry the
pronunciation to the compounds. After the full dictionary/exception rebuild,
common rules strict is 5,345/6,990 (+5), top-5,000 is 2,882/3,617 (+4), and
lenient counts are unchanged. Full rules strict/lenient is 62,250/83,628;
runtime parity is 94,775/100,806 and 100,678/100,806. Stress-aware phonemic is
54,690 (+7), homographs remain 1,454/1,615, context remains 87/85/53/49, and
public CMU default/rules are 4,750/5,000 and 4,142/5,000. The rules-only CMU
legacy 90% floor still fails. The rebuild made 508 dependency-aware re-pins
(520 resolved, 5 retained net-positive regressions). The isolated `every`
change is independently backed by Cambridge; it is recorded as a lexical stem
correction, not a broad -ery spelling rule.

The behavior-neutral syllabifier compression reduces the five-module count
from 3,395 to 3,394. Before/after dumps contain 1,296,352 predictions and are
byte-identical (SHA-256 `9fefd3b0b50b95b65ac138c288d66c470d2b5fcab3d7961bd6eeb90f1bb2f07d`).
Full Jest passed 359 suites / 6,729 tests, typecheck passed, and Rollup built
all packages. The follow-up default API and sentence-context regressions pass
as part of the focused 17-case `en-every-root` suite. The release remains an
accumulating batch: the next ordinary commit still needs +70 common strict
words from the committed 5,340 baseline (65 more beyond this candidate); the
90% release targets remain unmet (947 common words and 374 top-5,000 words
short).

### Follow-up: `compan-` STRUT (2026-10-20)

Cambridge US lists /ˈkʌm.pə.ni/ for [company](https://dictionary.cambridge.org/us/pronunciation/english/company) and /əˈkʌm.pə.ni/ for [accompany](https://dictionary.cambridge.org/pronunciation/english/accompany). The rule path previously gave LOT /ɑ/ in their `com` syllable. A constrained `compan-` root frame now selects STRUT /ʌ/; the existing weak-vowel reduction keeps `companion` at /kəmˈpæn.jən/. Paired controls cover companies, accompanied, accompanying, companionship, Germany, compare, community, communal and companionable. The frozen 1,296,352-row route dump changed in five predictions, all company/accompany forms; no neighboring control changed.

After rebuilding dictionaries and exceptions, common rules strict is 5,346/6,990 (+1 from the prior candidate; +6 vs committed baseline), top-5,000 is 2,883/3,617 (+1), and lenient counts remain 6,370/6,990 and 3,351/3,617. Full rules strict/lenient is 62,253/105,067 and 83,629/105,067 (+3/+1); runtime parity remains 94,775/100,806 and 100,678/100,806. Stress-aware phonemic is 54,692 (+2), homographs remain 1,454/1,615, and context remains 87/85/53/49 across default/rules x auto/gold POS. Public CMU default/rules are 4,750/5,000 and 4,143/5,000; the rules-only legacy 90% floor remains unmet. Every tracked metric is nondecreasing against the pre-candidate run. Full Jest passed 360 suites / 6,744 tests, typecheck passed, and direct Rollup succeeded. The ordinary commit threshold remains 5,410 common strict words, so this accumulating batch is not yet ready to commit.

The follow-up `accompanist` check confirmed Cambridge US /əˈkʌm.pə.nɪst/, but its `-ist` morphology handler composes the whole form through a separate route; the underlying `ac·com·pa·nist` syllable render already has /ʌ/. A proposed general y-stem + -ist composition replayed 42 dictionary forms and produced only 4 strict wins against 13 losses, so it was rejected; extending the `compan-` syllable frame also did not change this dispatched morphology output. The attempted paired test was removed and no suffix-handler change was adopted. Fresh common structural learning accepted 41 fold-local candidates across ten spelling-family folds, with zero passing the training filter; mean held-out strict remained 74.68%. Route ablation confirms morphology is strongly positive overall (5,346/6,990 vs 4,709 without morphology), so no broad dispatch bypass is viable. These results leave `accompanist` as a separate narrow morphology diagnosis, not a mapping candidate.

### Expanded triple-feature learner and unstressed `-tin` source check (2026-10-20)

The expanded, triple-feature learner replayed the 7,097-word common population
with ten spelling-family folds. It accepted 99 fold-local candidates, but none
passed the TRAIN-only selection filter; mean held-out strict stayed 74.42%.
Its leading weak-vowel proposal affected only a handful of `-tin` forms per
fold and did not generalize to held-out families. Cambridge US supports schwa
in [bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin),
[Martin](https://dictionary.cambridge.org/pronunciation/english/martin),
[platinum](https://dictionary.cambridge.org/us/pronunciation/english/platinum)
and [satin](https://dictionary.cambridge.org/pronunciation/english/satin),
but retains /ɪ/ in [Latin](https://dictionary.cambridge.org/pronunciation/english/latin).
This small mixed set is not a general spelling rule, so no source rule or
reference was changed. Full fold report:
`/tmp/phonemize-next-release/learn-expanded-triples-20261021/cv-common-report.json`.

### Follow-up: secondary-stressed `bio-` (2026-10-20)

Cambridge US gives /ˌbaɪ.oʊ.məˈtɪr.i.əl/ for [biomaterial](https://dictionary.cambridge.org/us/pronunciation/english/biomaterial) and /ˌbaɪ.oʊ.dɪˈvɝ.sə.ti/ for [biodiversity](https://dictionary.cambridge.org/us/pronunciation/english/biodiversity). The rules path used /ɑ/ for the `o` in their secondary-stressed `bio` syllable. A context-limited spelling rule now retains /oʊ/ only in secondary-stressed `bio`; biology, biography, biological, biomedical, biopic and the already-correct biochemistry path are paired controls. `biomaterials` continues through morphology with /oʊ/.

The before/after all-route snapshot contains 1,296,352 predictions. Source changes corrected two dictionary words (biomaterial and biodiversity) and changed twelve generated morphology forms; post-rebuild review found the additional `biomateriales` synthetic suffix form, whose pronunciation change is an exception-table re-pin effect. Full diff: `/tmp/phonemize-next-release/bio-secondary-20261020/`. The behavior-neutral morphology-table compression was byte-identical to the prior snapshot; the five-module count remains at the 3,395 cap.

After rebuilding dictionaries and exceptions (508 dependency-aware re-pins; 520 resolved, 5 retained net-positive regressions), common strict remains 5,346/6,990 and lenient improves to 6,371/6,990; top-5,000 remains 2,883/3,617 strict and 3,351/3,617 lenient. Full rules strict/lenient improves to 62,254/105,067 and 83,631/105,067. Runtime parity remains 94,775/100,806 and 100,678/100,806; stress-aware phonemic improves to 54,693/90,310. Homographs remain 1,454/1,615, context remains 87/85/53/49, and public CMU default/rules remain 4,750/5,000 and 4,143/5,000. Full Jest passed 361 suites / 6,753 tests, typecheck passed, and Rollup succeeded. No baseline was refreshed; common strict is still 64 below the 5,410 commit floor and 946 below the 90% release target.

### Rejected unbounded initial `e` + root rule (2026-10-20)

A rules-only replay tested changing the initial vowel to /i/ whenever the
syllabifier produced exactly `e` plus one syllable. In the 6,990-word common
set this yields 3 strict wins (`email`, `ebay`, `event`) and 19 strict losses;
the top-5,000 slice has 3 wins and 14 losses. Cambridge confirms /iː/ for
[email](https://dictionary.cambridge.org/pronunciation/english/email) but /ɪ/
for [event](https://dictionary.cambridge.org/us/pronunciation/english/event),
so `event` is a false benchmark win as well as a false-positive boundary: it
is not the letter-name prefix found in `e-mail`/`e-book`. The pattern therefore
cannot safely recover the fused `e-` compounds without a lexical boundary
signal. No source rule or baseline changed. Reproduction:
`/tmp/phonemize-next-release/e-prefix-20261020/scan.cjs` and `report.txt`.

### Rejected broad unstressed `re-` KIT-vowel candidate (2026-10-20)

A second rules-only replay changed initial /i/ to /ɪ/ when the first
syllabifier slot was `re` and primary stress fell later. This nets 7 strict
wins against 44 losses in top-5,000 and 15 against 83 across the full common
set. Cambridge US supports /rɪ-/ for [review](https://dictionary.cambridge.org/us/pronunciation/english/review),
[result](https://dictionary.cambridge.org/pronunciation/english/result),
[repeat](https://dictionary.cambridge.org/pronunciation/english/repeat), and
[reveal](https://dictionary.cambridge.org/pronunciation/english/reveal), but
other `re-` words keep /ri-/ in the pinned cohort. The spelling and stress
frame alone cannot distinguish them; no source change was adopted. Reproduce
with `/tmp/phonemize-next-release/re-prefix-20261020-scan.cjs` and
`re-prefix-20261020-report.txt`.

### Current common-set dispatch replay (2026-10-20)

Instrumented dispatch was checked against the unmodified predictor for all
6,990 common test words. The fresh 2026-10-20 report has strict/lenient
5,348/6,371; the top-5,000 slice is 2,884/3,617 strict. Removing morphology
falls to 4,709/5,902, and disabling both morphology and compounds falls to
4,595/5,825. No route-removal alternative improves aggregate strict accuracy,
so the next search remains targeted at correcting individual morphological
classes with paired stem and inflection controls, not bypassing the existing
dispatch. Full changed-word evidence and source hashes:
`/tmp/phonemize-next-release/routes-current-20261020/report.json`.

The user clarified that `O'Reilly Media` is a real technical-book publisher and
an example of a brand. `O'Reily` is only an illustrative spelling pattern,
not a second brand or a request for a brand-specific reading. Existing issue
regressions exercise O'Reilly in sentences, with straight and curly
apostrophes and possessives; pronunciation still comes from ordinary
dictionary lookup and no brand-specific mapping is needed. A temporary
`advance` custom-dictionary probe was removed after confirming it did not
change the actual rules route. A simulated broad initial unstressed `/æd/` to
`/əd/` rewrite produced 11 common strict wins against 28 losses (1/10 in the
top slice), so it was rejected. No source pronunciation or baseline changed.
The source dictionary and generated tables were rebuilt without that probe;
common strict remains 5,346/6,990, parity 94,775/100,806, and stress-aware
phonemic 54,693/90,310. Full Jest passed 361 suites / 6,756 tests and
typecheck passed. The focused apostrophe/issue regressions were rerun after the
clean rebuild.

### Structural distance learner and final `-ine` / `-ire` checks (2026-10-21)

The spelling-family structural learner was rerun with the distance objective on
the same 6,990-word common population. It accepted 20 fold-local proposals, but
none passed the existing TRAIN-only selection filter. Replaying all accepted
proposals reduced held-out strict from 3,807/5,098 to 3,799/5,098, confirming
they are not adoption candidates. Full report:
`/tmp/phonemize-next-release/learn-distance-20261021/cv-common-report.json`.

A simulated final `-ine` `/ɪn/` to `/in/` change fixes three common references
(`Christine`, `magazine`, `vaccine`) and breaks three (`examine`, `Maine`,
`Ukraine`); other final-`-ine` cases include `/aɪn/`, `/ən/`, and `/un/`
readings. Cambridge US confirms `/iːn/` for
[vaccine](https://dictionary.cambridge.org/us/pronunciation/english/vaccine),
[magazine](https://dictionary.cambridge.org/pronunciation/english/magazine),
and [routine](https://dictionary.cambridge.org/us/pronunciation/english/routine),
but routine also needs unrelated vowel and stress repairs, so this is not a
safe spelling-only class. The learner's final `-ire` proposal also failed its
filter: Cambridge US gives `/aɪɚ/` for
[acquire](https://dictionary.cambridge.org/us/pronunciation/english/acquire)
but `/aɪr/` for
[desire](https://dictionary.cambridge.org/us/pronunciation/english/desire)
and [empire](https://dictionary.cambridge.org/us/pronunciation/english/empire).
No rule, reference, or baseline changed.

### CMU `-age` strict misses are dialect/reference conflicts (2026-10-21)

The common mismatch report repeatedly flags rule-path `/ɪdʒ/` against CMU's
`/ədʒ/` for endings such as `message`, `damage`, `package`, and `coverage`.
Cambridge US independently gives `/ɪdʒ/` in
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
[package](https://dictionary.cambridge.org/us/pronunciation/english/package),
and [coverage](https://dictionary.cambridge.org/us/pronunciation/english/coverage).
The current rules are correct for those readings; this spelling cluster is a
CMU strict-score conflict, not evidence for changing the pronunciation rule.
No reference or source rule changed.

The route-ablation report also identifies a large `-ed` benchmark conflict.
Removing regular-inflection morphology creates a favorable CMU strict reading
for some forms (`cited`, `collected`, `wanted`) but produces 208 strict losses
for 38 wins across all changed common words. Cambridge US marks the suffix
`/ɪd/` in [collected](https://dictionary.cambridge.org/pronunciation/english/collected)
and [wanted](https://dictionary.cambridge.org/us/pronunciation/english/wanted),
matching the current rule output; replacing it with CMU's schwa convention
would worsen these standard readings. Preserve the morphology handler and keep
these mismatches out of the pronunciation-gain tally.

### Rejected candidate: multisyllabic final `-zine` (2026-10-21)

Merriam-Webster supports /iːn/ in [benzine](https://www.merriam-webster.com/dictionary/benzine)
and [hydrazine](https://www.merriam-webster.com/dictionary/hydrazine); Cambridge
US supports /iːn/ in [magazine](https://dictionary.cambridge.org/pronunciation/english/magazine).
A rule for the multisyllabic `zi|ne` split, with standalone `zine` and unrelated
`-ine` controls, improved a frozen-table replay by five full-dictionary strict
words and one common/top-5000 strict word, with no lenient change.

The required rebuild evicted `magazine` as an exact rule entry. Its dictionary
entry also supplies a lexical stem for `magaziner` and related derived forms;
eviction caused three full-dictionary lenient regressions. The existing
dependency miner checks contrastive primary stress when preserving stems,
whereas this release's strict scorer strips stress, so its current dependency
contract did not retain the root. A trial that removed the stress check caused
stress-aware accuracy to fall by 24 words. Both the rule and that trial were
reverted; no baseline was refreshed. This candidate is not adopted until a
dependency fix can preserve all accuracy gates. No authoritative source was
found for `methazine`, so that rare form is not an independently verified gain.

### Adopted final multisyllabic `-zine` rime with strict stem retention (2026-10-21)

The source-backed segmental rule is now retained for multisyllabic final
`zi|ne`: Merriam-Webster gives /iːn/ in [benzine](https://www.merriam-webster.com/dictionary/benzine)
and [hydrazine](https://www.merriam-webster.com/dictionary/hydrazine), and
Cambridge US gives /iːn/ in [magazine](https://dictionary.cambridge.org/us/pronunciation/english/magazine).
Standalone [zine](https://dictionary.cambridge.org/us/dictionary/english/zine)
keeps its /aɪn/ rime; paired controls also cover unrelated `-ine` spellings.
The class only changes the final vowel. Cambridge's final stress in *magazine*
differs from the pinned CMU stress, so this counts as a segmental correction,
not a stress improvement. `methazine` is affected by the spelling rule but is
not counted as a source-verified gain.

The exception miner now has a secondary stem-attribution pass for stress-stripped
strict wins whose primary stress remains mismatched. It preserves those stems
only when removing any one would not regress a previously stress-correct word.
This retains `magazine` for regular derived forms without a whole-word runtime
map. The rebuilt exception table contains 525 dependency re-pins, 17 above the
previous 508; the safety pass reports 520 rescued dictionary words and five
net-positive residual stress regressions. All fixed accuracy gates below held.

The frozen 1,296,352-row snapshot changed 177 predictions (6 dictionary, 31
rules, 140 generated morphology rows). Among changed rules/morphology forms
with pinned dictionary gold, paired scoring found 24 strict and 13 lenient wins,
with zero losses. Rebuilt evaluation versus the preceding working tree is:
common strict/lenient 5,348/6,371→5,350/6,372; top-5,000 strict/lenient
2,884/3,351→2,886/3,352; full-dictionary strict/lenient +19/+9; stress-aware
phonemic/exact +4/+2. Runtime parity remained 94,775/100,806 strict and
100,678/100,806 lenient; public CMU default stayed 4,750/5,000, rules-only
rose 4,144→4,146; context stayed 87/108 and homographs 1,454/1,615. All 364
Jest suites / 6,777 tests, typecheck and `git diff --check` passed. Snapshot
and baseline hashes are recorded under
`/tmp/phonemize-next-release/zine-class-20261021/`.

The full `yarn build-dict` pipeline could not refresh its upstream base sources:
`raw.githubusercontent.com` returned DNS `EAI_AGAIN`. Its base English dictionary
and compound-parts hashes matched the frozen inputs, so the exception miner was
rerun directly over those unchanged sources. Retry the complete pipeline once
GitHub DNS is available before release packaging or commit qualification. This
two-word common gain remains below the ordinary 70-word commit threshold and
stays uncommitted.

### Bound `patho-` allomorph before `-ology` (2026-10-20)

Cambridge US lists `/pəˈθɑːlədʒi/` (also `/pæ-/`) for
[pathology](https://dictionary.cambridge.org/us/pronunciation/english/pathology)
and `/pəˈθɑːlədʒɪst/` for
[pathologist](https://dictionary.cambridge.org/pronunciation/english/pathologist).
The generic `-ology` morphology route had composed the stressed standalone
`patho` root, producing `/ˌpæˈθɑːlədʒi/`. It now uses the weak `/pəθo-/`
allomorph only in that bound `-ology` environment. Paired controls retain `/pæθ/`
in [pathogenesis](https://dictionary.cambridge.org/us/pronunciation/english/pathogenesis)
and [pathological](https://dictionary.cambridge.org/us/pronunciation/english/pathological),
and the rule-only regression covers `pathology` and `pathologies`.

After rebuilding generated data, common strict rose 5,346→5,347/6,990, the
full-dictionary rule strict count rose by one, and stress-aware correct rose by
one. All other tracked counts held: top-5000 2,883/3,617; runtime parity
94,775/100,806; CMU public API 4,750/5,000 (rules-only 4,143); context
87/108; homographs 1,454/1,615. The rebuilt snapshot had three changes: the
intended `pathology` correction and two synthetic nonword suffix forms. The
subsequent morphology-block compaction produced a byte-identical 1,296,352-row
snapshot; parity dumps were identical. Focused tests, the full Jest suite
(362 suites / 6,761 tests), and typecheck passed. This one-word gain is kept in
the accumulating batch; it does not meet the 70-word commit threshold, so no
baseline was refreshed.

The follow-up common-set `--cluster` report shows the largest initial-vowel
clusters are mixed proper names, acronyms and ordinary words, so they do not
license a broad vowel rewrite. Current 10-fold strict rule learning accepted
28 fold-local proposals and passed 0 through the existing train-only filter;
the most repeated `ire` and unstressed `i→ə` candidates still carry paired
losses. Route diagnosis also confirms the major morphology routes protect many
more common strict readings than they lose, and postlex ablation yields no
class-wide removal candidate. A structural strict-learning pass accepted 41
fold-local proposals, also with 0 passing; replaying all proposals lowered
held-out strict from 3,807/5,098 to 3,794/5,098. The recurring `-ire` candidate
changes final /ɹ/ to /ɝ/, but Cambridge US transcribes [empire] as `/ˈem.paɪr/`,
so the CMU-driven correction conflicts with an independently attested US
reading. These are diagnostics only; no additional rule or baseline changed.

A rule-path experiment that pluralized any suffix stem accepted by the
compound splitter changed 4,553 snapshot rows. It gained 12 full-dictionary
strict and four lenient matches, but common strict stayed 5,347/6,990 and the
public CMU default rose 10 while runtime parity fell 1 strict / 2 lenient; the
candidate was rejected. Narrowing it to verified compound `-cast` stems changed
only 11 derived/OOV forms (including `broadcasts`, `podcasts`, and
`forecasts`) but moved no tracked accuracy count, so that branch was also
removed. Cambridge US attests `/kæst/` in [podcast](https://dictionary.cambridge.org/us/pronunciation/english/podcast)
and [broadcast](https://dictionary.cambridge.org/us/dictionary/english/broadcast);
the `forecasts` CMU reference omits /t/, which explains why a correct `/kæsts/`
does not improve that fixed reference score.

### Fresh common strict scan (2026-10-20)

The pinned-population evaluator was rerun against the current rebuilt tables:
common strict/lenient is 5,347/6,371 of 6,990, and top-5,000 is 2,883/3,351
of 3,617. The ordinary ten-fold strict learner accepted 28 fold-local
proposals, but none passed the TRAIN-only filter; filtered held-out strict
remains 74.68% on average. Its broadest repeat, final `-ire` (`ɹ` to `ɝ`),
has only 7.6 affected words per fold on average and fails every fold's filter.
No rule or baseline changed. Full diagnostics are in
`/tmp/phonemize-next-release/common-fresh-20261020.log` and
`/tmp/phonemize-next-release/learn-strict-fresh-20261020.log`.

A structural distance-objective rerun accepted 20 fold-local proposals, but
none passed the same train-only filter. Replaying every proposal lowered the
unchanged held-out sample from 3,807 to 3,799 strict and 4,568 to 4,566
lenient, while mean edit distance worsened from 2,197 to 2,209. No candidate
was adopted; evidence is in
`/tmp/phonemize-next-release/learn-distance-20261020/cv-common-report.json`.

### Rejected broad compound `-land` reduction (2026-10-20)

The fresh mismatch report flags `highland`, `iceland`, `oakland` and
`portland`: the compound route assigns secondary stress to `land` and keeps
/lænd/, while Cambridge gives weak /lənd/ in
[Highland](https://dictionary.cambridge.org/dictionary/english/highland),
[Iceland](https://dictionary.cambridge.org/pronunciation/english/iceland) and
[Portland](https://dictionary.cambridge.org/us/pronunciation/english/portland).
The related [Finland](https://dictionary.cambridge.org/us/pronunciation/english/finland)
and [Queensland](https://dictionary.cambridge.org/pronunciation/english/queensland)
rules routes already produce the Cambridge /lənd/ reading, though fixed CMU
expects /lænd/ there. A blanket
secondary-stress removal would also change ordinary lexical compounds:
Cambridge gives /lænd/ in
[homeland](https://dictionary.cambridge.org/us/pronunciation/english/homeland),
[mainland](https://dictionary.cambridge.org/us/dictionary/english/mainland)
and [wonderland](https://dictionary.cambridge.org/us/dictionary/english/wonderland).
Replacing final `/ɫænd/` with `/ɫənd/` in frozen rules-only outputs across the
common population simulates four strict wins and four losses (net zero), with
`land`, `Thailand`, `mainland` and `homeland` among the CMU regressions. This
output-level scan is only a candidate screen; the spelling alone does not
distinguish geographic bound `-land` from the stressed noun compound, so this
is not a safe generalized rule. Reproduction is in
`/tmp/phonemize-next-release/land-scan.cjs` and
`/tmp/phonemize-next-release/land-scan-20261020.json`. No source change or
reference change was made.

### Weak-vowel inheritance in regular `-icals` plurals (2026-10-20)

`chemicals` was a common strict error on the rules-only route: its lexical
`chemical` stem supplied weak /ə/, while the spelling rules give /ɪ/. Cambridge
US independently records /ˈkem.ɪ.kəl/ for [*chemical*](https://dictionary.cambridge.org/pronunciation/english/chemical),
and the same distinction appears in its US readings of [*radical*](https://dictionary.cambridge.org/us/pronunciation/english/radical),
[*cervical*](https://dictionary.cambridge.org/pronunciation/english/cervical)
and [*hierarchical*](https://dictionary.cambridge.org/pronunciation/english/hierarchical).
A narrowly structural plural fallback adjusts only the final weak /ə/ to /ɪ/
when the lexical and rule readings otherwise agree; it preserves the lexical
stress pattern and adds no word map. An exact replay on the pinned 6,990 / 3,617
common populations found one change, `chemicals`, which is a strict win in both
slices and no losses. The full morphology snapshot records 34 additional
derived -icals forms; controls preserve `biologicals`, `cyclicals`,
`evangelicals` and `agrochemicals`, and a stress-paired hierarchical control
retains its secondary stress. The frozen before snapshots and replay script are in
`/tmp/phonemize-next-release/ical-plurals-batch-20261020/`. This single gain is
not an adoption qualification or release target; all post-build gates remain
required, and it does not meet the 70-word ordinary commit threshold.

The stem-preserving implementation passed all gates after a fresh rebuild.
The frozen 1,296,352-row snapshot changed 36 rows (two rules-only rows and 34
derived forms); paired snapshot scoring gives full-dict strict 62,255→62,256,
common strict 5,347→5,348, and top-5,000 strict 2,883→2,884, with all three
lenient counts unchanged. Runtime parity stayed 94,775/100,806, default CMU
accuracy stayed 4,750/5,000, rules-mode CMU accuracy rose 4,143→4,144, the
stress-aware headline stayed 54,694, context stayed 87/108, and homographs
stayed 1,454/1,615. Rebuild re-pinned 508 entries, matching the prior build's
count. The 6,990-word common strict score is still 13.49 points short of the
requested >90% goal; this is only one validated increment in the open batch.

The latest rebuilt checkout has since reached 5,348/6,990 common strict and
2,884/3,617 top-5,000 strict. A second structural strict learner run across
the same 10 spelling-family folds accepted 41 proposals, but none passed the
TRAIN-only filter; filtered held-out strict stayed at a 74.68% mean. The
largest repeated candidate changes final `-ire` /ɹ/ to /ɝ/ and has independent
US dictionary counterevidence (for example *empire*), so it remains rejected.
The broad suffix error scan also found `-ed` mismatches, but the affected
forms mix morphological, stress and dictionary-notation differences; the
previous blanket /ɪd/ to /əd/ replay already reduced common strict. No new
pronunciation rule or baseline was changed in this diagnostic pass. Details:
`/tmp/phonemize-next-release/learn-strict-20261020/cv-common-report.json`
and `/tmp/phonemize-suffix-errors-top10.cjs`. Issue #28's apostrophe and
O'Reilly Media brand regression file passes all 24 tests, including straight
and curly apostrophes, possessives and complete-sentence tokenization.

An adjacent `-ically` extension was measured and rejected: its lexical
reference endings differ across *chemically*, *radically*, *numerically* and
*typically*, and the candidate did not improve common strict. It remains out of
the rule until a narrower evidence-backed class preserves those contrasts.

### Current route and postlex replay (2026-10-20)

The instrumented dispatch replay verified all 6,990 predictions against the
unmodified predictor: removing morphology lowers strict/lenient to 4,709/5,902,
and removing compound dispatch as well lowers them to 4,595/5,825. Full
postlex ablation replayed 107,645 words across 176 rules. Its only rule removal
with positive common strict delta is the final `-ett` rewrite: removing it fixes
`Bennett` in the common slice but loses 32 full-dictionary strict words (11
wins, 43 losses overall), mostly surname readings with mixed `/ɪt/` and `/ət/`.
Neither broad route removal nor this proper-name-heavy ablation is safe to
adopt. Reports are in `/tmp/phonemize-next-release/route-accuracy-goal-20261020/`
and `/tmp/phonemize-next-release/postlex-accuracy-goal-20261020/`.

The accumulated source crossed the 3,395-line compression trigger, so I
coalesced sequential declarations and compacted the new `-icals` check without
changing behavior. The five-module count is now 3,391. Before/after dumps are
byte-identical at 1,296,352 predictions; all 363 Jest suites / 6,768 tests and
typecheck pass. Evidence is in
`/tmp/phonemize-next-release/ical-plurals-batch-20261020/`.

### Rejected plural dictionary correction (2026-10-20)

Cambridge records `/t/` in the US noun readings of [project](https://dictionary.cambridge.org/us/pronunciation/english/project)
and [impact](https://dictionary.cambridge.org/us/pronunciation/english/impact),
and the rules correctly preserve it in `projects` and `impacts`. A temporary
custom-dictionary correction exposed that the generated dictionary trimmer
then evicted those two words, changing the runtime-parity population from
100,806 to 100,804 and failing its fixed-baseline gate. The correction was
reverted and the generated tables rebuilt; no source or score change is retained.

### Rejected global dark-L normalization screen (2026-10-20)

A full rules-path simulation replaced every output `/ɫ/` with `/l/` to test
whether the strict mismatch count was mostly a notation artifact. It reduced
full-dictionary strict from 62,256/105,067 to 40,281 and common strict from
5,348/6,990 to 3,742/6,990. The change breaks large numbers of entries whose
stored readings explicitly use dark L, so this is not a safe phoneme-class
repair and was not adopted. Reproduction: `/tmp/phonemize-l-dark-l-screen.cjs`.

### Rejected final `-ease` s-voicing class (2026-10-20)

Traces show the rules-only `/se/` ending predicts /s/ in *please*, *ease*,
*tease*, *appease* and *disease*, while the standard US pronunciations use
/z/ ([please](https://dictionary.cambridge.org/us/pronunciation/english/please),
[ease](https://dictionary.cambridge.org/us/pronunciation/english/ease),
[tease](https://dictionary.cambridge.org/us/pronunciation/english/tease),
[appease](https://dictionary.cambridge.org/us/pronunciation/english/appease),
[disease](https://dictionary.cambridge.org/us/pronunciation/english/disease)).
The same spelling ending remains /s/ in *cease*, *crease*, *grease* and
*lease* ([cease](https://dictionary.cambridge.org/pronunciation/english/cease),
[crease](https://dictionary.cambridge.org/dictionary/english/crease),
[grease](https://dictionary.cambridge.org/us/pronunciation/english/grease),
[lease](https://dictionary.cambridge.org/us/pronunciation/english/lease));
*increase*, *decrease* and *release* also retain the unvoiced sibilant.
The suffix spelling alone cannot predict voicing, so no class rule was added.
Adding these words to `custom.dict` would not affect the rule-evaluation
population's direct rule path (`disableDict: true`), and the ordinary dictionary
route already supplies the attested readings; no exception entries were kept.

### Rejected `auto-` vowel reduction (2026-10-20)

The compound route predicts `/ɔtoʊ/` in *automotive* and *autograph*, while
Cambridge US gives `/ɑtə/`; *automobile* also needs `/ɑtəmoʊ/`. But Cambridge
records the combining form `auto-` as `/ɑtoʊ-/`, and the related stress patterns
are not uniform: *autocratic* has `/ɑtə/`, while *autocracy* has `/ɑtɑ/`.
The shared spelling is not enough to license a blanket `/oʊ/` to `/ə/` rule;
the relevant vowel depends on the lexical stress and formation. The rule-only
traces for *auto*, *autonomy* and *autobiography* further show distinct routes.
No pronunciation rule or per-word mapping was added. Sources: Cambridge US
[auto / auto-](https://dictionary.cambridge.org/us/pronunciation/english/auto),
[automotive](https://dictionary.cambridge.org/us/pronunciation/english/automotive),
[automobile](https://dictionary.cambridge.org/pronunciation/english/automobile),
[autograph](https://dictionary.cambridge.org/us/pronunciation/english/autograph),
[autocratic](https://dictionary.cambridge.org/pronunciation/english/autocratic),
and [autocracy](https://dictionary.cambridge.org/us/pronunciation/english/autocracy).

### Rejected three-feature strict learner batch (2026-10-20)

The ten-fold spelling-family run with structural triples accepted 86 candidates,
but none passed the TRAIN-only win/loss filter. Mean held-out strict stayed
74.68% before and after filtering. The strongest-looking top-5,000 candidate
centralized unstressed `/ɪ/` before final `t...in` (+14 / -0), but the spelling
class is not uniform: Cambridge US has `/ɪ/` in *bulletin* and *Latin*, `/ə/`
in *satin*, and a reduced vowel or elision in *platinum*. It is not a class
repair. The full report, including frozen hashes, is
`/tmp/phonemize-next-release/triples-strict-20261020/cv-common-report.json`;
no runtime rule or baseline changed.

### Rejected broad `-age` stem-vowel inheritance before `-ing` (2026-10-20)

An exact dispatcher census found three common morphology-route strict misses
where lexical `/ə/` in the stored `-age` stem propagates into the derived form:
*imaging*, *messaging* and *packaging* (predicted `/ə/`, fixed reference
`/ɪ/`). Cambridge US independently supports `/ɪ/` in
[image](https://dictionary.cambridge.org/us/pronunciation/english/image) and
[imaging](https://dictionary.cambridge.org/pronunciation/english/imaging),
[message](https://dictionary.cambridge.org/us/pronunciation/english/message)
and [messaging](https://dictionary.cambridge.org/us/pronunciation/english/messaging),
and [package](https://dictionary.cambridge.org/pronunciation/english/package),
[packaging](https://dictionary.cambridge.org/us/pronunciation/english/packaging)
and [packaged](https://dictionary.cambridge.org/us/pronunciation/english/packaged).
But Cambridge US supports `/ə/` for [manage](https://dictionary.cambridge.org/us/pronunciation/english/manage)
and its regular participle *managing*. Cambridge US also supports `/ɪ/` in
[discouraging](https://dictionary.cambridge.org/pronunciation/english/discouraging),
while the fixed reference uses `/ə/` there. No general spelling/morphology
condition separates these root readings, so changing how all `-age` stems
compose would trade a small group of fixed-reference wins against other forms
and source conventions. No source rule, dictionary entry or baseline changed.
Current common route totals remain 1,292 rules, 312 morphology and 38 compound
strict errors; the three target forms are included in the morphology count.

A frozen in-memory trial changed the `image`, `message`, `package` and `damage`
stem entries to their Cambridge US `/ɪ/` readings, then replayed the existing
dispatcher against the original CMU-derived gold. This fixes *imaging*,
*messaging* and *packaging*, but changes five common correct forms to misses:
*damaged*, *damages*, *images*, *messages* and *packages*. Common strict falls
5,348→5,346 and top-5,000 falls 2,884→2,882; full-dictionary strict holds at
62,256 with six wins and six losses. The trial failed the fixed common gates,
so no custom-dictionary entries or source rules were changed. Per-word replay:
`/tmp/phonemize-next-release/age-root-fix-20261020/before/age-root-candidate-replay.json`.

A narrower 2026-10-21 in-memory rule trial changed only regular `-ing` forms
whose lexical and spelling-rule stems differed solely by `/ə/` versus `/ɪ/`
before `/dʒ/`. The frozen 1,296,341-row snapshot changed six predictions:
`damaging`, `imaging`, `messaging`, `packaging`, and `savaging` became CMU
matches, while `managing` stopped matching its pinned US reading. Cambridge US
supports the `/ɪ/` targets but gives `/ə/` for `managing`, so the sibling is a
real pronunciation control failure. Common strict rose 5,365→5,367/6,990 and
top-5,000 rose 2,898→2,899/3,617; rules-only CMU rose by one and default CMU
stayed 4,753/5,000. Since no spelling condition separates `managing`, the
narrow rule was also rejected and removed. Frozen inputs and the replay are in
`/tmp/phonemize-age-ing-before/`.

### `-ution` CMU mismatch cluster checked against Cambridge US (2026-10-20)

A frequency-ranked suffix screen found five strict misses among ten common
`-ution` words. This is not a blanket reduction opportunity: the current
rules-only `/ɪ/` in [contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution)
and [distribution](https://dictionary.cambridge.org/us/pronunciation/english/distribution)
matches Cambridge US, while the pinned CMU entries use `/ə/`. Cambridge US
also supports the current rules-only `/ə/` in [institution](https://dictionary.cambridge.org/us/pronunciation/english/institution)
and the `/ə/` in [constitution](https://dictionary.cambridge.org/us/pronunciation/english/constitution),
though CMU uses `/ɪ/` in *institution*. These source contrasts disqualify
suffix-wide vowel changes as accuracy gains. No runtime rule, dictionary entry
or benchmark reference changed; the candidate screen was read-only.

### Rejected blanket common `-ect` repair (2026-10-20)

The frequency-ranked top-5,000 contains 16 `-ect` forms, nine with rules-path
strict misses. The final `-ect` spelling does not identify one vowel or stress
pattern: Cambridge US distinguishes noun and verb *subject* and *affect*, and
records /əˈfekt/ for *effect*, /ɪnˈfekt/ for *infect*, and /ˈdiːfekt/ versus
/dɪˈfekt/ for noun/verb *defect*. The pinned CMU readings also disagree with
Cambridge on *effect* and noun *subject*, while the current rules route chooses
different defaults for several homographs. A general ending rewrite would mix
POS selection and source conventions with spelling-to-sound errors. No `-ect`
rule was adopted. Sources: Cambridge US [effect](https://dictionary.cambridge.org/us/pronunciation/english/effect),
[subject](https://dictionary.cambridge.org/us/pronunciation/english/subject),
[affect](https://dictionary.cambridge.org/pronunciation/english/affect),
[infect](https://dictionary.cambridge.org/pronunciation/english/infect),
and [defect](https://dictionary.cambridge.org/pronunciation/english/defect).


### Rechecked rule candidates and route ownership (2026-10-21)

The updated structural strict learner replayed the actual rules dispatcher over
the fixed 6,990 common-word population, with ten spelling-family folds and
TRAIN-only selection. It accepted 48 fold-local proposals; none passed the
TRAIN-only win/loss filter. Applying all proposals reduced held-out strict from
3,807 to 3,796 / 5,097 and lenient from 4,567 to 4,554, so none were adopted.
The highest-ranked repeated proposal changes unstressed `/ɪ/` to `/ə/` in a
`c...i` grapheme environment; its aggregate TRAIN replay has 54 strict wins and
27 losses, which is not a safe class. The final `-ire` `/ɹ/` to `/ɝ/` candidate
also remains rejected under the documented dictionary counterevidence.

Full route replay verified all 107,645 dictionary predictions. Removing
morphology reduced strict/lenient from 63,608/85,536 to 57,891/80,603; the
unsplit alternative scored 54,899/79,001. Its only positive common strict
delta was one word (`transmittal`), paired with a common lenient loss
(`referral`); this route change therefore fails the no-regression gate. Full
postlex ablation also found no safe common-word rule removal. The detailed
reports and frozen hashes are in
`/tmp/phonemize-next-release/learn-current-20261021/`,
`/tmp/phonemize-next-release/routes-all-20261021/`, and
`/tmp/phonemize-next-release/postlex-current-20261021/`.

No pronunciation rule or baseline changed during this diagnostic pass. The
current 5,350/6,990 strict score is 10 words above the 10/20 committed baseline
and 60 words below the next ordinary 5,410-word commit threshold; it remains
942 words below the release threshold. Issue #28's clarified
O'Reilly Media brand example and the illustrative `O'Reily` spelling remain
covered by the paired apostrophe regressions; both focused suites pass all 33
tests.


### Standard-reading audit of frequent CMU mismatches (2026-10-21)

A source check of high-ranked failures confirms that several strict misses are
reference disagreements rather than rule defects. Rules-only `actual`
`/ˈæktʃuəl/`, `Michigan` `/ˈmɪʃɪɡən/`, and `mortgage` `/ˈmɔɹɡɪdʒ/` match
Cambridge US, while the pinned CMU readings differ; `added` rules-only
`/ˈædɪd/` also matches Cambridge US. See Cambridge US
[actual](https://dictionary.cambridge.org/us/pronunciation/english/actual),
[Michigan](https://dictionary.cambridge.org/us/pronunciation/english/michigan),
[mortgage](https://dictionary.cambridge.org/us/pronunciation/english/mortgage),
and [added](https://dictionary.cambridge.org/us/pronunciation/english/added).
These are not rule regressions to repair toward CMU.

`referral` is a genuine rules-path miss: its rules-only output is
`/ɹəˈfɝəɫ/`, while both pinned CMU and Cambridge US use `/ɹɪˈfɝəɫ/`.
Cambridge US also gives `/ɹɪˈfɝ/` for [refer](https://dictionary.cambridge.org/us/pronunciation/english/refer)
and `/pɹɪˈfɝ/` for [prefer](https://dictionary.cambridge.org/us/pronunciation/english/prefer),
whereas the runtime lexical stems carry CMU's reduced-vowel readings. Changing
those roots would change public dictionary output and the CMU common-API score;
a suffix-specific code exception would violate the general-rule policy. No
change was made. This leaves a source-backed open class for a future solution
that preserves both public API and rules-only gates.


### Rejected initial open-e reduction candidate (2026-10-21)

Cambridge US verifies `/ɪ/` in [estate](https://dictionary.cambridge.org/us/pronunciation/english/estate),
[escape](https://dictionary.cambridge.org/pronunciation/english/escape),
[evade](https://dictionary.cambridge.org/pronunciation/english/evade), and
[elude](https://dictionary.cambridge.org/us/pronunciation/english/elude).
A broad initial open-e `/ɛ/`→`/ɪ/` rule would repair the rules-path outputs for
*escape* and *estate*, but the paired replay regresses seven other common words:
*eligible, enable, estimate, everywhere, evidence, execute,* and *existence*.
The fixed common strict score falls 5,350→5,345/6,990 and lenient falls
6,372→6,371; top-slice strict falls 2,886→2,883/3,617 and lenient falls
3,352→3,351. This spelling condition was rejected without source changes.
The in-memory replay and exact win/loss list are in
`/tmp/phonemize-next-release/weak-initial-e-20261021/candidate-sim.json`;
its before snapshot is the frozen 1,296,352-row file recorded in that directory.


### Rejected low-support structural candidates (2026-10-21)

Lowering the structural learner's minimum support from five to two produced
300 fold-local proposals (67 distinct classes) across the ten spelling-family
folds; none passed its TRAIN-only win/loss filter. The highest repeated
`-age` proposal changed `/ɪ/` to `/ə/` in *dosage, message, passage,* and
*usage* to match pinned CMU readings. Cambridge US explicitly gives `/ɪ/` in
all four, so these are reference disagreements and the proposed correction
would move away from the independently checked US readings. Other high-ranked
proposals were similarly narrow (for example, *keith/key* and *across/cross*)
or had material training losses; none was adopted. The fixed common subset
remains 5,350/6,990 strict and 6,372/6,990 lenient, with 2,886/3,617 and
3,352/3,617 respectively on the top-5,000 slice. Reports:
`/tmp/phonemize-next-release/learn-min2-20261021/cv-common-report.json` and
the report-only `g2p-mismatches-common-report.txt` generated by
`yarn test:eval --subset common --cluster`. Cambridge US sources:
[dosage](https://dictionary.cambridge.org/us/pronunciation/english/dosage),
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[passage](https://dictionary.cambridge.org/us/pronunciation/english/passage),
and [usage](https://dictionary.cambridge.org/us/pronunciation/english/usage).


### Rejected blanket regular `-ed` reduction (2026-10-21)

An output-level screen changed final `/ɪd/` to `/əd/` for every common word
spelled `-ed` whose rules-path output ended in `/ɪd/` (144 eligible words).
It lowered full common strict from 5,350 to 5,344 / 6,990; top-5,000 stayed
2,886 / 3,617. The apparent CMU wins such as *added, created,* and
*estimated* are offset by losses including *applied, associated,* and
*reported*. Cambridge US uses final `/ɪ/` for words in adjacent reduced-vowel
clusters such as [artist](https://dictionary.cambridge.org/us/pronunciation/english/artist)
and [medical](https://dictionary.cambridge.org/us/pronunciation/english/medical),
and schwa for [charity](https://dictionary.cambridge.org/us/pronunciation/english/charity),
showing why the suffix spelling alone cannot select the vowel. This was a
read-only post-output candidate screen, not an actual dispatcher replay; no
rule or baseline changed.


### Rejected blanket `-ment` vowel change (2026-10-21)

A read-only dispatcher replay changed `/mənt/` to `/mɛnt/` for common words
spelled `-ment` whenever the current output ended in that sequence. It changed
66 outputs, fixing only *comment* and *document* against the pinned readings,
while reducing common strict from 5,350 to 5,296 / 6,990 and top-5,000 from
2,886 to 2,853 / 3,617. Cambridge US confirms `/mɛnt/` for *comment* and for
verb *document*, but `/mənt/` for noun *document*; the noun/verb distinction
also makes POS and sentence context material. See [comment](https://dictionary.cambridge.org/us/pronunciation/english/comment)
and [document](https://dictionary.cambridge.org/us/pronunciation/english/document).
The broad spelling class was rejected without source changes.


### Rejected blanket final `-ent` vowel change (2026-10-21)

A second read-only output screen changed final `/ənt/` to `/ɛnt/` in every
common word spelled `-ent` with that output. It lowered full common strict
from 5,350 to 5,267 / 6,990 and top-5,000 from 2,886 to 2,836 / 3,617.
Although it fixed *accent, comment, content, document, frequent,* and
*percent* against the pinned entries, it broke many more correct readings.
The source audit confirms the surface class also hides lexical and POS
differences: Cambridge gives `/mɛnt/` for *comment*, and distinguishes noun
`/mənt/` from verb `/ment/` in *document*. See [comment](https://dictionary.cambridge.org/us/pronunciation/english/comment)
and [document](https://dictionary.cambridge.org/us/pronunciation/english/document).
No source rule was changed.


### Bound `guarant-` /ɛr/ rime (2026-10-21)

The learner's spelling-family replay proposed changing the first <a> in the
stressed `guar` syllable before `ran` from `/æ/` to `/ɛ/`. Cambridge US supports
the vowel in [guarantee](https://dictionary.cambridge.org/us/pronunciation/english/guarantee),
[guaranty](https://dictionary.cambridge.org/us/pronunciation/english/guaranty),
and [guarantor](https://dictionary.cambridge.org/us/dictionary/english/guarantor).
The rule is limited to stressed or secondarily stressed syllables; the
unstressed `guarantor` rules path remains unchanged. Paired controls
[guard](https://dictionary.cambridge.org/us/pronunciation/english/guard) and
[guardian](https://dictionary.cambridge.org/us/pronunciation/english/guardian)
retain `/ɑɹ/`.

Frozen full rules-path snapshots changed only the `guarant-` spelling family.
Against the exact 105,067-word full-dictionary evaluator population, strict
rose 62,275→62,280 and lenient held at 83,640; the common subset rose
5,350→5,352 / 6,990 and its top slice 2,886→2,888 / 3,617. Public CMU rules
rose 4,143→4,148 / 5,000, while the default API stayed 4,750 / 5,000. The
stress-aware headline rose 54,698→54,700 / 90,310; context stayed 87/108,
homographs 1,454/1,615, and parity stayed unchanged. Typecheck and all 365
Jest suites / 6,782 tests pass. This small gain remains in the accumulating
working batch; it does not meet the 70-word ordinary commit threshold.

The next ten-fold structural learner pass proposed 48 fold-local corrections;
none passed the required TRAIN win/loss filter, so no additional class was
adopted. Its most repeatable candidate (`c`-conditioned unstressed `/ɪ/` to
`/ə/`) accumulated 54 strict wins against 27 losses on TRAIN and 27 wins
against 18 losses in top-5,000, so it remains rejected. Report:
`/tmp/phonemize-rule-corrections/cv-common-report.json`.


### Rejected blanket secondary-stressed `-mate` reduction (2026-10-21)

A post-output replay changed final secondary-stressed `/meɪt/` to `/mət/` in
words ending in `-mate`. It fixed *ultimate* but broke *approximate* and
*estimate* against the fixed English-subset reference, taking strict from
5,352 to 5,351 / 6,990. The fixed CMU rules slice did not gain a strict match
under replay. Cambridge US supports `/mət/` in
[climate](https://dictionary.cambridge.org/us/pronunciation/english/climate),
[ultimate](https://dictionary.cambridge.org/pronunciation/english/ultimate),
and adjective [intimate](https://dictionary.cambridge.org/pronunciation/english/intimate),
but gives `/meɪt/` for the verb *estimate* and `/mət/` for its noun. Since spelling
and secondary stress alone do not distinguish the required reading, no runtime
change was made.


### Fresh `-ire` class replay and retained apostrophe coverage (2026-10-21)

A separate ten-fold distance-objective learner pass proposed 21 fold-local
corrections; none passed the required TRAIN filter. Its recurring final
`-ire` `/ɹ/`→`/ɝ/` candidate improves some pinned entries, but also breaks
*inquire* and *vampire*. Cambridge US directly distinguishes the latter two:
[inquire](https://dictionary.cambridge.org/pronunciation/english/inquire)
ends in `/aɪr/`, as does [vampire](https://dictionary.cambridge.org/us/pronunciation/english/vampire).
No spelling-wide rule was adopted. Full-fold report:
`/tmp/phonemize-rule-corrections/distance-20261021/cv-common-report.json`.

The unchanged common rules score remains 5,352/6,990 strict (76.57%) and
6,372/6,990 lenient; top-5,000 remains 2,888/3,617 strict and 3,352/3,617
lenient. Default public CMU accuracy is 4,750/5,000; rules-only is 4,148/5,000.
Runtime parity is 94,775/100,806 strict and 100,678/100,806 lenient, the
stress-aware headline is 54,700/90,310, context IPA is 87/108 in default/auto,
and homographs are 1,454/1,615. The focused issue #28 suite passes all 24
tests, including O'Reilly Media, its possessive, curly apostrophes, and the
illustrative O'Reily form. No pronunciation source or baseline changed.

Frozen prediction and parity dumps and source/data/baseline hashes are in
`/tmp/phonemize-next-release/i-ce-weak-vowel-20261021/`; this directory records
the before-state for the next candidate replay.

A read-only morphology-output screen also tested `/zəz/`→`/zɪz/` after voiced
sibilants. Replaying against the fixed release dictionary lowered common strict
from 5,352 to 5,346 / 6,990 (one win, seven losses) and top-5,000 from 2,888
to 2,886 / 3,617 (zero wins, two losses). Similar `/tʃəz/` and `/dʒəz/`
screens introduced 12 and 21 common strict regressions respectively. The
CMU top-5,000 reference accepts some alternate `/ɪz/` readings, but those do
not improve the fixed release metric and cannot justify a source change. The
official scorer does not merge `/ɫ/` with `/l/`; using its exact normalization
corrects an earlier quick-screen count of 18 `/dʒəz/` regressions to 21.

The fresh failure clustering still concentrates on initial `i` (194 words),
initial `a` (136), and initial `e` (172 across three outputs); direct samples
are mostly names, places, abbreviations, and loans with different readings.
A broad initial `ir` `/ɪɹ/`→`/aɪɹ/` screen fixed *Irish* but broke
*irrigation*, leaving the common strict count unchanged. These results do not
support a shared spelling rule; neither source nor baselines changed.

### Rejected final `-ed` schwa after `/d/` (2026-10-21)

A fixed-reference replay changed final `/ɪd/` to `/əd/` in rules-only forms
spelled `-ed` whose stem ended in `/d/`. It would raise common strict by 10
(13 wins, 3 losses) and top-5,000 strict by 4 (7 wins, 3 losses), but it is
not a pronunciation improvement: Cambridge US records `/ɪd/` in [added](https://dictionary.cambridge.org/us/pronunciation/english/added),
[needed](https://dictionary.cambridge.org/us/pronunciation/english/needed),
and [decided](https://dictionary.cambridge.org/us/pronunciation/english/decided),
including forms the fixed replay counts as wins for schwa. This follows the
regular English `/ɪd/` past-tense allomorph after `/d/`; the fixed reference's
weak-vowel spellings are not a basis for changing the rule. No source or
baseline changed.

### Rejected weak-prefix replay for the `-fer` family (2026-10-21)

The rules-only morphology route inherits `/ə/` in forms such as *referral* and
*referring*, although Cambridge US records `/ɪ/` in [referral](https://dictionary.cambridge.org/pronunciation/english/referral)
and [refer](https://dictionary.cambridge.org/us/pronunciation/english/refer).
A read-only class replay changed the initial `/rə, prə, də/` to `/rɪ, prɪ,
dɪ/` for the `refer-/prefer-/defer-` family. It fixes *referral* and
*referring* but breaks *referred* and *preferred* under the pinned CMU
reference, producing zero common strict net gain and two top-5,000 regressions.
Cambridge US also supports `/ɪ/` in [preferred](https://dictionary.cambridge.org/us/pronunciation/english/preferred),
so these two losses expose another reference disagreement rather than a
phonetic counterexample. Still, the unchanged-contract rules-mode and top-slice
gates reject this class; no rule, reference or baseline changed. Replay is
recorded at `/tmp/phonemize-fer-family-20261021.json`.

A follow-up restricted the same vowel substitution to `-fer` forms ending in
`-al` or `-ing`; it changes only *referral* and *referring* in the common list
(+2 strict, no losses; top-5,000 unchanged). That suffix boundary excludes
*referred* and *preferred* despite their shared weak-prefix environment, so it
does not establish a productive phonological condition. Do not add this
benchmark-shaped restriction as a runtime rule; the open class remains the
whole `refer-/prefer-/defer-` family pending a source-supported distinction.

### `financial` root-vowel diagnosis (2026-10-21)

The common-list rules-only miss for *financial* is `/fɪˈnænʃəl/` against the
fixed `/faɪˈnænʃəl/`. Cambridge records `/faɪ-/` as a US reading and also
records `/fə-/`; its [finance](https://dictionary.cambridge.org/us/pronunciation/english/finance)
entry has `/faɪ-/` in both US and UK. The live dictionary therefore confirms
the root-family relationship but also shows the fixed reference is narrower
than all accepted US readings.

Trace shows the default *financial* is an exception-table hit; the rules-only
route syllabifies it `fi · nan · cial`, assigning `/ɪ/` to the first `i`.
The generic `-ial` handler deliberately remains outside the stress-neutral
morphology table, and the generated dictionary has only three `-ancial`
spellings: *financial* and its two compounds. The finance family itself has
different rule-only routes (`finance` `/fɪnəns/`, `financing`
`/ˈfaɪˌnænsɪŋ/`, `financial` `/fɪˈnænʃəl/`), so extending a single spelling
rule across it risks replacing one lexical stem behavior with another. No
multi-word productive class with paired controls was evidenced, and no
whole-word map was added. This remains an open common-list error; no score or
baseline changed.

### Rejected long `ad·ja-` reduction extension (2026-10-21)

Cambridge US confirms weak `/əˈdʒeɪ-/` in [adjacent](https://dictionary.cambridge.org/us/pronunciation/english/adjacent)
and [adjacency](https://dictionary.cambridge.org/pronunciation/english/adjacency),
while [adjective](https://dictionary.cambridge.org/us/pronunciation/english/adjective)
has stressed `/ˈædʒ-/`. I replayed an extension of the existing unstressed
`ad-` reduction to longer initial `ad·ja-` syllable sequences, preserving its
original *adjoin* condition. It produced no strict gain in the fixed 6,990-word
common subset (5,352/6,990 remained unchanged), and *adjacent* still had a
second-vowel error (`/æ/` vs Cambridge `/eɪ/`). The first probe accidentally
narrowed the original *adjoin* guard and lost one strict case; that probe was
discarded and the pre-existing guard restored. No source change or baseline
change remains from this candidate.

### `comparison` morphology diagnosis (2026-10-21)

The rules-only route gives *comparison* `/ˈkɑmpɝɪsən/`, while the pinned
reference is `/kəmˈpɛɹəsən/`. Cambridge independently gives US
`/kəmˈperɪsən/` for [comparison](https://dictionary.cambridge.org/us/pronunciation/english/comparison)
and `/kəmˈper/` for [compare](https://dictionary.cambridge.org/us/pronunciation/english/compare);
its related [comparative](https://dictionary.cambridge.org/pronunciation/english/comparative)
has a different vowel (`/kəmˈperətɪv/`). The trace confirms that compare and
its inflections already take the correct bound `com-` stress, but the less
productive `comparison` formation is split `com · pa · ri · son` and falls
through to unrelated open-syllable defaults. A `-ison` composition rule would
need to reconstruct this specific `compare` stem, and the tested neighboring
compare forms do not establish a productive suffix class. No source change or
word map was made; this remains a high-frequency class candidate without a
safe generalization.

### Common strict error spot-check against Cambridge (2026-10-21)

The current common report flags several high-rank rule predictions that
Cambridge accepts. For example, rules produce `/prəˈdʌkʃən/` for *production*,
`/ɪˈdɪʃən/` for *edition*, and `/dɪˈrɛkʃən/` for *direction*. Cambridge gives
those same forms for [production](https://dictionary.cambridge.org/pronunciation/english/production)
and [edition](https://dictionary.cambridge.org/pronunciation/english/edition),
and lists both `/dɪ-/` and `/daɪ-/` US variants for
[direction](https://dictionary.cambridge.org/us/pronunciation/english/direction).
These remain misses against the pinned single-reading CMU subset, but changing
the rules to chase those rows would move away from independently attested US
pronunciations. No reference or scoring contract changed.

### Rejected global `-lity` vowel change (2026-10-21)

A real-pipeline replay changed the final `-lity` rule from `/ləti/` to
`/lɪti/`. It changed 140 rule-path dictionary predictions and reduced common
strict from 5,352 to 5,344 / 6,990, and top-5,000 from 2,888 to 2,886 / 3,617.
The fixed subset had 4 wins and 12 losses overall (3 wins, 5 losses in the top
slice). Cambridge US explicitly gives `/ə/` in [ability](https://dictionary.cambridge.org/us/pronunciation/english/ability),
[facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[liability](https://dictionary.cambridge.org/us/pronunciation/english/liability),
and [stability](https://dictionary.cambridge.org/us/pronunciation/english/stability),
so the change would make several standard readings less accurate. The candidate
was removed and the common score returned to 5,352 / 6,990. Before/after actual
rule-route dumps and their comparison are at
`/tmp/phonemize-next-release/lity-20261021/` and
`/tmp/phonemize-next-release/i-ce-weak-vowel-20261021/pre.tsv`.

### `-gine` family check (2026-10-21)

The common rule-path error *imagine* is `/ˈɪməˌdʒaɪn/` against the pinned
`/ˌɪˈmædʒən/`. Cambridge US gives `/ɪˈmædʒɪn/` for
[imagine](https://dictionary.cambridge.org/pronunciation/english/imagine),
so both the route stress/vowels and the pinned final schwa differ from that
independent source. A spelling census of final `-gine` roots in the shipped
dictionary is mixed: *engine* and *imagine* have `/ən/` in the pinned table,
while *aborigine*, *aubergine*, *Georgine*, and *peragine* have `/ɪdʒəni/`,
`/dʒin/`, `/dʒin/`, and `/dʒini/`; Cambridge also records `/ɪ/` in
[engine](https://dictionary.cambridge.org/us/pronunciation/english/engine)
and `/iː/` in [hygiene](https://dictionary.cambridge.org/us/pronunciation/english/hygiene).
The same spelling therefore does not justify one generic final-vowel rule, and
the `imagine` family lacks a second independent stem to support a productive
class fix. No one-word rule or reference change was made.

### Post-rebuild gate refresh (2026-10-21)

The complete `yarn build-dict` pipeline was rerun against its upstream sources;
the final exception table contains 54,005 entries after 525 dependency-aware
re-pins (520 resolved, five retained net-positive regressions). The rebuilt
candidate remains at 5,352/6,990 common strict and 2,888/3,617 top-5,000 strict;
lenient counts are 6,372/6,990 and 3,352/3,617. These exceed the committed
5,340 common strict baseline but remain below the 5,410 ordinary commit floor
and the 90% release targets.

Post-build runtime parity is unchanged at 94,775/100,806 strict and
100,678/100,806 lenient. Public `toIPA` CMU accuracy remains 4,750/5,000
(90% gate passes); rules-only remains 4,148/5,000, unchanged from its known
below-90% result. Stress-aware phonemic accuracy is 54,700/90,310 (+17 vs
baseline). Homographs remain 1,454/1,615. Context IPA remains 87/108 strict
in default/automatic-POS, 85/108 in default/gold-POS, 53/108 in rules/automatic,
and 49/108 in rules/gold-POS. Typecheck and the full Jest suite pass (365
suites, 6,782 tests), including all 24 issue #28 apostrophe regressions.
No baseline was refreshed and no commit was made because the ordinary strict
commit threshold has not been reached.

The high-frequency `business` mismatch was also source-checked: Cambridge US
gives /ˈbɪz.nɪs/ ([entry](https://dictionary.cambridge.org/pronunciation/english/business)),
while the candidate rule output places the unstressed vowel before /n/. The
suffix is not uniform (`happiness` retains its stem vowel), so no broad
`-iness` rule was adopted.

### Fresh route and postlex ablations (2026-10-21)

The mandated common failure clustering again ranks individual initial-vowel
spellings, names, and irregular forms rather than one uniform vowel rule. The
actual-dispatch route replay verified all 6,990 predictions: disabling
morphology drops strict/lenient to 4,712/5,902, and bypassing both morphology
and compound splitting drops them to 4,598/5,825. The largest apparently
reversible route subset is the regular-inflection handler, but bypassing it
trades 38 strict matches for 208 losses; most of the wins are CMU's `/əd/`
rendering of past-tense `-ed`, whereas standard US speech uses the productive
`/ɪd/` allomorph after `/t,d/`. It is not safe to remove or broadly rewrite
that path to optimize this exact-string reference.

The full postlex ablation replay covered 107,645 words (including long forms)
and 176 fired rules. No single removal improves both full-dictionary and
common strict, so no postlex change was adopted. Route win/loss details are in
`/tmp/phonemize-next-release/route-diagnosis-20261022/report.json`; postlex
details are in `/tmp/phonemize-next-release/postlex-20261022/results.json`.

### Fresh family-held-out learner replay (2026-10-21)

The expanded structural learner completed ten spelling-family folds over the
fixed 6,990-word population. Across 96 fold-local accepted candidates, zero
passed the training-only win/loss filter; held-out strict stayed 74.73% before
and after filtered candidates. The best repeated single-grapheme proposal
changed unstressed `/ɪ/` to `/ə/` in a final `<tin>` environment, but its scope
is not phonetic: Cambridge US gives `/ɪ/` in [Latin](https://dictionary.cambridge.org/pronunciation/english/latin),
[bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin),
and [credit](https://dictionary.cambridge.org/us/pronunciation/english/credit),
while the candidate's apparent CMU wins are schwa-rendering differences.
Another proposed weak-`<i>` change before `<c>` breaks *appreciate* and
*calcium*. No candidate was adopted. Full report:
`/tmp/phonemize-next-release/learner-20261022/cv-common-report.json`.

The subsequent `be-` silent-e replay was also rejected. Requiring a verified
monosyllabic compound root improved common/top-5,000 strict by one each
(5,353/6,990 and 2,889/3,617), but changed *Benites* on the shipped dictionary
route and lowered runtime parity from 94,775 to 94,774 strict. The extra
spelling restriction still admitted the false split; source and focused tests
were removed, and common/parity returned to their frozen before-state. Snapshot
and row-level diff: `/tmp/phonemize-next-release/i-ce-weak-vowel-20261021/`.

### Woman/women plural-vowel rule (2026-10-21)

The spelling-conditioned `<wo>` rime now selects /ʊ/ before the `<man>`
morpheme and /ɪ/ before `<men>`, matching Merriam-Webster's woman/women
pronunciations. Regressions cover womanly, womanhood, chairwoman/chairwomen,
fireman/firemen, possessives, sentence context and shipped dictionary readings.
This rule does not alter the default dictionary route. Cambridge US independently
records /wʊmən/ and /wɪmɪn/.

After the real dictionary rebuild, common rules strict/lenient improved from
5,352/6,372 to 5,354/6,373 out of 6,990; the top-5,000 slice improved from
2,888/3,352 to 2,890/3,353 out of 3,617. Full rules, stress-aware and CMU
rules-only counts also increased. Runtime parity remained 94,775/100,806 strict
and 100,678 lenient; CMU default remained 4,750/5,000; homographs remained
1,454/1,615; context cells remained 87/85/53/49. The normal commit threshold
is still unmet, so no baseline was refreshed and this remains in the working
batch. Focused regressions, all 6,796 tests across 366 suites, typecheck and
`git diff --check` pass.

The release gaps are now 936 common words and 364 top-slice words. The source
rule snapshot changes only woman, women and their possessives; the full rebuilt
data delta also includes generated table re-pins. Evidence:
`/tmp/phonemize-next-release/i-ce-weak-vowel-20261021/`.

### Fresh structural learner audit after woman/women (2026-10-21)

Reran the fixed ten-family-fold structural learner against the current checkout:
5,097/6,990 words were in its direct rule-rendering scope. Of 48 fold-local
greedy candidates, none passed the train-only legacy win/loss filter; applying
all accepted candidates lowered held-out strict from 3,811/5,097 to 3,800/5,097.
Filtered held-out strict was unchanged. Before the separately replayed `-ire`
candidate, fixed-population scores were 5,354/6,990 strict and 6,373 lenient;
top-5,000 was 2,890/3,617 strict and 3,353 lenient. Public CMU was 4,750/5,000
default and 4,150/5,000
rules-only (the latter remains below its legacy floor).

The top repeated `<ci>` proposal (`ɪ` to `ə`) repairs forms such as *acid*,
*Francis* and *medicine*, but breaks *appreciate* and *calcium*; it is not one
sound spelling class. The learner's broad `<ire>` proposal was rejected: it
also changes secondary-stressed controls such as *vampire*, and its isolated
rule hook scores *inquire* on a route the production dispatcher does not use.
After full route replay, a narrower primary-stressed final `<ire>` rule was
retained for forms such as *acquire*, *admire*, *desire* and their regular
inflections; a general morphology/postlexical repair keeps the stem /ɹ/ in
`-ire + -er` forms such as *acquirer*. Merriam-Webster records optional schwa in [acquire](https://www.merriam-webster.com/dictionary/acquire),
[desire](https://www.merriam-webster.com/dictionary/desire),
[require](https://www.merriam-webster.com/dictionary/require) and
[entire](https://www.merriam-webster.com/dictionary/entire); the rule leaves
secondary-stressed *empire* and *vampire* unchanged. After the complete
dictionary rebuild, common strict rose to 5,356/6,990 and top-slice strict to
2,892/3,617; full-dictionary strict rose by 1 and lenient by 1. Runtime
parity, default CMU, homograph and all context cells held or improved; the
rules-only CMU result rose by 1 and remains below its legacy floor. Existing
`-ire + -ing` and en/in + quire tests pass. The 90% common strict target is
still 935 words away; this is an accumulating gain, not a release-ready
checkpoint.

Separately, the generated IPA-Dict reference had `acquirer` as /aɪɝɝ/. The
source now applies the same general `-ire + -er` normalization used by runtime,
following Merriam-Webster's /ə-ˈkwī(-ə)r-ər/. That changes the full-dictionary
denominator from 105,067 to 105,068 and restores strict parity; this reference
correction is reported separately and is not counted as a rule gain.

Evidence: `/tmp/phonemize-rule-corrections/cv-common-report.json`, the current
`g2p-mismatches-common-report.txt`, and `/tmp/phonemize-next-release/ire-rhotic-20261021/`.
No evaluation baseline changed.

### Rejected `-cted` weak-vowel replay (2026-10-21)

An output-level replay changed final `/ɪd/` to `/əd/` only in spellings ending
`-cted`. Against the fixed common references it scored 5,364/6,990 strict
(+8) and 2,897/3,617 top-5,000 (+5), but it still breaks *suspected* and
*unexpected*. More importantly, the candidate is wrong for standard US
pronunciation: Cambridge records `/tɪd/` in [collected](https://dictionary.cambridge.org/pronunciation/english/collected),
[expected](https://dictionary.cambridge.org/pronunciation/english/expected),
[suspected](https://dictionary.cambridge.org/pronunciation/english/suspected),
and [unexpected](https://dictionary.cambridge.org/us/pronunciation/english/unexpected).
The apparent strict gains expose a disagreement in the pinned IPA-Dict rows,
not a pronunciation improvement, so no source rule or reference was changed.
The replay and every changed row are preserved at
`/tmp/phonemize-next-release/cted-replay-20261021/`.

### Introductory `-ductory` stress class (2026-10-21)

The generic adjectival `-ductory` stress rule now assigns primary stress to the
`-duct` root, matching standard US /ˌɪntrəˈdʌktəri/ in
[Cambridge's introductory entry](https://dictionary.cambridge.org/pronunciation/english/introductory).
This fixes `introductory` without a whole-word mapping; controls include
`introductorily`, `introduction`, `laboratory`, `satisfactory` and `territory`.
The frozen 1,296,363-row prediction snapshot changes exactly one row, the
rules-only `introductory` prediction. The generated base dictionary hash and
exception table hash are unchanged.

After rebuilding, common strict rose from 5,356 to 5,357/6,990; common lenient
remained 6,374. Top-slice strict/lenient remained 2,892/3,354. Full rules
strict rose by one with lenient unchanged; stress-aware correct rose by one.
Runtime parity remained 94,776/100,807 strict and 100,679 lenient; CMU default
remained 4,750/5,000, rules-only rose by one to 4,151/5,000 (still below its
legacy 90% floor), homographs stayed 1,454/1,615, and all context cells stayed
87/85/53/49. All 6,802 tests across 367 suites and typecheck pass. Build-time
dependency re-pinning was 523 entries (521 resolved; five net-positive
regressions retained), with no order-of-magnitude change. No baseline was
refreshed; the ordinary commit threshold remains 5,413/6,990, so this small
gain stays in the accumulated working batch.

Evidence: `/tmp/phonemize-next-release/ductory-20261021/`.

### Post-change structural learner and route audit (2026-10-21)

Reran the ten-fold family-held-out structural learner after the `-ductory`
change on the same 6,990-word population. It accepted 33 fold-local proposals,
but none passed the train-only win/loss filter; filtered held-out strict stayed
74.83%. The most repeated `<c>` before unstressed `<i>` schwa proposal had 46
training fixes and 23 breaks across folds and still failed the filter. The
other repeated unstressed schwa proposals also had losses and no accepted
filter passes, so none is safe to promote from this replay.

The full-dictionary actual-route audit verified all 107,646 predictions,
including long entries. The current full rule baseline is 63,619/107,646
strict and 85,539 lenient; removing morphology or bypassing compounds loses
more strict matches than it gains. No dispatcher change was adopted. Reports:
`/tmp/phonemize-next-release/ductory-20261021/learner/cv-common-report.json`
and `/tmp/phonemize-next-release/ductory-20261021/routes/report.json`.

### Rejected `-cket` lax-vowel replay and learner variants (2026-10-21)

Cambridge US marks the final vowel as /ɪ/ in [bracket](https://dictionary.cambridge.org/pronunciation/english/bracket),
[packet](https://dictionary.cambridge.org/pronunciation/english/packet),
[pocket](https://dictionary.cambridge.org/pronunciation/english/pocket),
[racket](https://dictionary.cambridge.org/pronunciation/english/racket),
[jacket](https://dictionary.cambridge.org/pronunciation/english/jacket),
[ticket](https://dictionary.cambridge.org/us/pronunciation/english/ticket),
and [socket](https://dictionary.cambridge.org/us/pronunciation/english/socket).
The rules path currently reduces this `<e>` to /ə/. A broad `-cket` output
replay would fix `bracket` against the pinned table but break seven other
common entries; common strict falls 5,357→5,351/6,990 and top-slice strict
falls 2,892→2,888/3,617. This class is therefore not adopted under the fixed
benchmark no-regression gate; the Cambridge readings and pinned IPA-Dict rows
disagree on the terminal vowel.

Three further ten-fold family-held-out learner runs—structural strict,
unstructured strict and structural distance objective—accepted 33, 20 and 12
fold-local proposals respectively, but none passed the train-only win/loss
filter. Filtered held-out strict remained 74.83% in all three runs. Their
reports are under `/tmp/phonemize-next-release/ductory-20261021/learner/`,
`learner-general/` and `learner-distance/`.

An independent suffix-conditioned, single-phone replay found apparently
positive strict deltas for `-ded` (+10 common, +4 top-5,000), `-nded` (+6,
+4), `-cted` (+8, +5) and `-ican` (+4, +4). These are not pronunciation
gains: Cambridge records /ɪd/ in [added](https://dictionary.cambridge.org/us/pronunciation/english/added),
[handed](https://dictionary.cambridge.org/us/pronunciation/english/handed)
and [extended](https://dictionary.cambridge.org/pronunciation/english/extended),
and /ɪ/ in [American](https://dictionary.cambridge.org/us/pronunciation/english/american),
[African](https://dictionary.cambridge.org/us/pronunciation/english/african)
and [Mexican](https://dictionary.cambridge.org/pronunciation/english/mexican),
where these candidate transforms replace it with /ə/. The apparent gains are
fixed-reference disagreements, so no runtime or scoring change was made.
Complete frozen common predictions used by this suffix sweep are at
`/tmp/phonemize-next-release/ductory-20261021/common-preds.json`.

### Behavior-neutral rule compression (2026-10-21)

The five rule modules reached 3,401 comment/blank-excluded code lines, six
above the retained 3,395 cap. Adjacent hiatus, suffix and stress guards plus
postlex checks with identical control flow were combined; a tempting same-IPA
`s`/`x` rule merge was reverted after the snapshot exposed different internal
matching behavior. The final 3,395-line result has a byte-identical
1,296,363-row snapshot (SHA256
`90e864faf732c76e2b949b554091fe237273ed0572b72244ee8ed9dec5c62aa6`). All
6,802 tests across 367 suites, typecheck and `git diff --check` pass. No
pronunciation metric or baseline changed. Frozen evidence:
`/tmp/phonemize-next-release/compression-20261021/`.

### Internal Spanish-loan `<jua>` frame (2026-10-21)

Added a position- and syllable-conditioned `<jua>` → /wɑ/ rule for an internal
open-vowel + `<jua>` followed by `<na>`. Cambridge's US entries give /ˌmer.əˈwɑː.nə/
for [marijuana](https://dictionary.cambridge.org/us/pronunciation/english/marijuana)
and /ˌtiː.əˈwɑː.nə/ for [Tijuana](https://dictionary.cambridge.org/us/dictionary/english/tijuana?topic=city-names-and-their-inhabitants).
Collins also records a US /tiˈwɑnə/ variant for [Tijuana](https://www.collinsdictionary.com/us/dictionary/english/tijuana).
The regression checks marijuana, Tijuana and a contrastive set of initial
`<jua>`/`<ju>` forms; no whole-word pronunciation map was added. The frozen
1,296,363-row snapshot changes seven rows: two direct rules entries and five
generated Tijuana forms. Those out-of-vocabulary morphology probes are not
counted in the common-word benchmark; their generated stress remains open for
future morphology review.

After the dictionary rebuild, common strict stayed 5,357/6,990 and top-slice
strict stayed 2,892/3,617; common lenient rose by one to 6,375 and top-slice
lenient stayed 3,354. Full-dictionary strict/lenient rose by one/two over the
frozen before-run. Runtime parity remained 94,776/100,807 strict and 100,679
lenient; public CMU default stayed 4,750/5,000 and rules-only stayed 4,151;
stress-aware results were 54,711/90,311 phonemic and 45,478 exact; homographs
stayed 1,454/1,615; context cells stayed 87/85/53/49. The denominator change
in the stress-aware report is retained as a limitation against the prior
baseline. All 6,812 tests across 368 suites and typecheck pass; CJS and ESM
package smokes preserve the issue #28 O'Reilly Media reading. No baseline was
refreshed because common strict did not improve. Evidence and snapshots are
under `/tmp/phonemize-next-release/`; the scoped snapshot SHA256 is
`aae23a01658ffe875f208978ece7341973a999824b8eaf7446dcf772a47b8145`.

### Postlex and actual-route ablation replay (2026-10-21)

Replayed all 107,646 testable dictionary words through the instrumented
pipeline and postlex table. Neither removing morphology nor bypassing compound
and decomposition dispatch has a net-positive common strict result; the
full-route baseline verified at 63,620 strict / 85,541 lenient. No wholesale
route bypass is eligible for promotion.

Postlex ablation found no single removal that preserves both full-dictionary
and common strict counts. Removing rule 171 (`/ət(s?)$/`) fixes only Bennett
in the common slice (+1 common strict) while losing 32 full-dictionary strict
matches; removing rule 53 (`/sʃ(?=u)/g`) loses one common strict and two full
strict. No postlex table change was made. Reports:
`/tmp/phonemize-routes-active-20261021/report.json` and
`/tmp/phonemize-postlex-active-20261021/results.json`.

### High-frequency `-inger` and `<ngu>` follow-up (2026-10-21)

The frequency-ranked common mismatch report exposed `finger` at rank 4,903:
the rules path emits /ˈfɪŋɝ/ while the pinned row expects /ˈfɪŋɡɝ/. Cambridge
US independently confirms /ŋɡ/ in [finger](https://dictionary.cambridge.org/pronunciation/english/finger)
and [linger](https://dictionary.cambridge.org/us/pronunciation/english/linger).
The same spelling tail does not define one safe pronunciation class:
[singer](https://dictionary.cambridge.org/pronunciation/english/singer)
and [hanger](https://dictionary.cambridge.org/us/pronunciation/english/hanger)
have /ŋ/ without /ɡ/, while *ginger* has a different soft-g reading. The
existing `-inger` postlex rule intentionally collapses the suffix in true
`-ing + -er` forms; deciding when that boundary is real needs morphological
evidence the spelling-only rule path does not currently retain. No broader
rewrite or per-word runtime exception was adopted.

The earlier apparent `<ngu>` candidate was also rejected after checking the
actual trace: the rules path already emits /ˈɫæŋɡwɪdʒ/ for *language*, so its
pinned /ɡ/ omission is a reference disagreement. A fresh ten-fold,
spelling-family-held-out common-word learner run accepted 20 fold-local
proposals, but none passed its train-only win/loss filter; held-out strict
remained 74.83%. The current common evaluation remains 5,357/6,990 strict and
2,892/3,617 top-slice strict. No source behavior or baseline changed. Evidence:
`/tmp/phonemize-rule-corrections/cv-common-report.json` and
`g2p-mismatches-common-report.txt`.

### `<velop>` inflections and corrected `even` reference (2026-10-21)

The issue #28 clarification identifies O'Reilly Media as the brand example;
O'Reily was illustrative spelling, not a separate brand. Existing apostrophe
class regressions retain both spellings, possessives, sentence tokenization,
and straight/curly apostrophes without brand-specific runtime mappings.

Cambridge US and Merriam-Webster attest /ˈiːvən/ for *even*, so the custom
reference now corrects IPA-Dict's short-vowel form. A general `<velop>`
inflection route uses the attested bare root for `develop(ed|ing)` and
`envelop(ed|ing)`, fixing the silent-e over-restoration; paired controls cover
`envelope`, `development`, `hoped`, and `hopping`. Cambridge also confirms the
changed `undeveloped` prediction. No whole-word code map was added.

The frozen common strict count is 5,358/6,990 (+1 source/reference correction;
not a rule gain), with top-5,000 at 2,893/3,617. Public CMU accuracy is
4,751/5,000; rules-only is 4,153/5,000 (the established legacy 90% floor still
fails). Context remains 87/85/53/49 and homographs 1,454/1,615. The corrected
root causes dictionary trimming to remove `evened` and `evens`, both now
verified through rules and public routes. That shifts runtime parity from
94,776/100,807 to 94,774/100,805 and stress-aware phonemic count from
54,711/90,311 to 54,709/90,309. Those two counts therefore do not meet the
frozen-population no-regression gates; this batch is not qualified for a
baseline refresh or commit. Keep the source correction and candidate evidence
separate until evaluation can compare an unchanged population. Evidence and
snapshots are under `/tmp/phonemize-even-sourcecheck-20261021/`; final snapshot
SHA256 is `2c2c54f21e9e9fd65e7d045bf7857e80562d71c502f7f8fa730d274229f114b5`.

All 370 Jest suites / 6,824 tests, typecheck, Rollup, context IPA gate, and
`git diff --check` pass. After adding the `undeveloped` paired case, the four
focused `<velop>`, `even`, apostrophe, and issue #28 suites pass all 41 tests.
The common target remains far below 90%; no baselines were refreshed.

### Checked short `<i>` before a final `-ce` slot (2026-10-21)

The syllabifier assigns silent-e `<e>` to a separate final `-ce` syllable in
`office`, `notice`, `practice`, `justice`, `service`, and `apprentice`. Its
open-`i` rule therefore incorrectly treated the preceding checked vowel as
magic-e `/aɪ/`, and the generic `-ce` reduction then centralized it. A
stress-aware spelling-frame guard now keeps unstressed checked `<i>` as `/ɪ/`
and leaves stressed contrasts out. Cambridge US confirms `/ɪ/` in
[office](https://dictionary.cambridge.org/us/pronunciation/english/office),
[notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[practice](https://dictionary.cambridge.org/pronunciation/english/practice),
[justice](https://dictionary.cambridge.org/pronunciation/english/justice),
[service](https://dictionary.cambridge.org/pronunciation/english/service),
and [apprentice](https://dictionary.cambridge.org/pronunciation/english/apprentice).
Regression cases cover these roots and regular `-s/-ed/-ing` forms, while
`malice`, `sacrifice`, and `suffice` guard adjacent spellings/stress routes.

This remains an evidence-backed candidate, not a qualifying improvement.
Against the frozen before-run on the unchanged 6,990 / 3,617 cohorts, strict
fell from 5,358 to 5,349 and from 2,893 to 2,887; lenient stayed 6,375 and
3,354. The full-dictionary rules strict count was unchanged (59,936), with
13 exact wins and 13 losses across changed predictions. Runtime parity is
94,748/100,805, below its committed baseline, while context remains 87/85/53/49
and homographs 1,454/1,615. Public CMU default is 4,748/5,000; rules-only is
4,151/5,000, still below its legacy floor. Do not refresh baselines or count
the standards-based reference disagreements as accuracy gains. The complete
suite passes (371 suites, 6,838 tests), as do typecheck, direct Rollup, and
diff-check. `build-dict` could not run because it fetches IPA-Dict and
homograph source files, and network DNS is unavailable in this environment.
The before snapshots remain under
`/tmp/phonemize-reference-audit-20261021/before/`; current predictions are in
`checked-i-ce-after.tsv`.

### Root stress for initial weak `es-` families (2026-10-21)

The common mismatch trace showed *estate* (frequency rank 450), *escape*
(rank 4,430), and *establish* with a syllabic initial `e` incorrectly carrying
primary stress. Cambridge US records /ɪˈsteɪt/, /ɪˈskeɪp/, and /ɪˈstæblɪʃ/.
A morphology-root stress rule now covers the `estate`, `escape`, and
`establish` families and their regular forms; controls retain the initial-stress
frames of *escalate*, *estimate*, *escapade*, and *escapee*. The full frozen
rule dump changed five dictionary predictions: five strict wins, zero losses.
The hyphenated phrase *real-estate* also needs its independently attested
primary/secondary pattern; its pinned CMUdict form is now recorded in
`src-data/en/custom.dict` so the standalone root rule cannot define phrase
stress.

Against the immediately preceding frozen candidate, full-dictionary rules
strict/lenient moved from 62,293/83,664 to 62,297/83,665. Common strict moved
from 5,349/6,990 to 5,352; Top-5,000 moved from 2,887/3,617 to 2,890, with
lenient +1 on each. Public CMU default stayed 4,748/5,000 and rules-only rose
4,151→4,154. Runtime parity stayed 94,748/100,805; stress-aware phonemic
count rose 54,710→54,713; context stayed 87/85/53/49 and homographs stayed
1,454/1,615. The earlier checked-`i` candidate still leaves the combined
common score six below its frozen 5,358 before-run, so no baseline refresh or
commit is eligible. The 90% strict targets remain unmet.

The new focused tests pass (25 tests), and the full suite passes (372 suites,
6,850 tests), typecheck, direct Rollup, and `git diff --check`. The generated
dictionary could not be rebuilt because the build fetches upstream files and
network DNS remains unavailable. Therefore the new `real-estate` source entry
and final acceptance gates still require a rebuild when the source network is
available. Current before/after dumps and gates are under
`/tmp/phonemize-next-release-next-20261021/`.

After that candidate, a behavior-neutral compression pass reduces the five
English rule modules to 3,392 code lines (`g2p` 1,142, `syllabify` 1,708,
`postlex` 496, `morph-table` 20, `morph-parser` 26), below the retained 3,395
cap. The complete 1,296,341-row rule snapshot before and after compression is
byte-identical (SHA-256
`649fe8cf1853cba9d713e942ffd1d9282d8de0cdfc3b5ba5e3b4412ff99aabe3`). All 372
Jest suites / 6,850 tests, typecheck, and `git diff --check` pass after the
compression. Current common strict/top counts are 5,352/6,990 and 2,890/3,617;
the full-dictionary rules count is 62,297/105,066. Runtime parity remains
94,748/100,805, below its committed baseline; no baseline was refreshed.

The next screening pass did not yield another safe rule class. The structural
learner replayed actual `predict()` dispatch over 5,098/6,990 common words,
using ten spelling-family folds; 39 candidates were selected in training, but
none passed the legacy support/fix-rate/top-slice filter, and the pooled held
score fell from 3,814 to 3,803. Full-dictionary postlex removal diagnosis
replayed 107,644 words; candidate rule removals such as the all-sibilant
`-es` weak-vowel rewrite have mixed common/dictionary wins and losses, so they
are not adopted without a paired class that preserves both populations.
Reports are at `/tmp/phonemize-learn-rules-20261021/` and
`/tmp/phonemize-postlex-20261021/`. The next batch remains open; the saved
candidate outputs and current fixed gates are the comparison point.

Direct Rollup after compression also succeeds. Packaged CJS and ESM entry
smokes preserve the CMU-supported O'Brien / O'Reilly readings, keep O'Reilly
Media as two sentence tokens with the expected Media reading, retain the
possessive, and reproduce issue #28's Seann/Sean behavior. A fresh
`build-dict` later succeeded and synchronized source-only custom entries.

### Vouched be- roots and common irregular source entries (2026-10-21)

A three-slot weak `be-` form now shifts stress to the silent-e root only when
the existing exception table independently supplies that root's pronunciation.
This avoids treating surname fragments admitted only by compound-part mining
as lexical roots (`Benites` remains unchanged). The final rule snapshot changes
four rule-route words (`become`, `behave`, `belove`, `Bethune`), with 3 full-dict
strict wins, no full-dict losses, and one rules-only prediction already aligned
with the table. Common strict rose 5,352→5,353/6,990 and Top-5,000
2,890→2,891/3,617; CMU rules rose 4,154→4,155/5,000. The full rule count is
62,300/105,066. The 1,296,341-row snapshot before and after the follow-up code
compression is byte-identical (SHA-256
`05e267ac66e70f436f03f311792a34b4a4a2bd19ddb020d839db9dc8c439032e`); the five
English rule modules total 3,394 code lines, below the 3,395 cap.

The frequency-ranked CMU report also identified lexical exceptions such as
`said` /sed/ and `now` /naʊ/. I briefly staged them in `custom.dict`, then
removed them after confirming that the rules-only evaluator does not load that
overlay and the default dictionary already has the readings. They produced no
eligible improvement and remain open as rule-path exceptions; no scores count
them. The 2026-10-21 `build-dict` run subsequently completed and synchronized
the retained custom entries into generated runtime data.

Current gates after the rule candidate: public CMU default 4,751/5,000 (pass),
rules 4,155/5,000 (legacy 90% floor still fails), runtime parity 94,774/100,805
(unchanged from this before-run, still below committed baseline), stress-aware
54,716/90,309, context 87/85/53/49, and homographs 1,454/1,615. All 373 Jest
suites / 6,866 tests and typecheck pass. No baseline was refreshed; the
next-release target remains open.

### Rejected checked-`i` final-`-ce` inflection follow-up (2026-10-21)

Cambridge US confirms /ɪ/ in [notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[practice](https://dictionary.cambridge.org/pronunciation/english/practice),
[practiced](https://dictionary.cambridge.org/pronunciation/english/practiced),
[service](https://dictionary.cambridge.org/us/pronunciation/english/service),
[servicing](https://dictionary.cambridge.org/pronunciation/english/servicing),
[apprentice](https://dictionary.cambridge.org/us/pronunciation/english/apprentice),
and [jaundice](https://dictionary.cambridge.org/pronunciation/english/jaundice).
A temporary rule tried to carry that checked vowel through regular `-s`, `-ed`
and `-ing` forms when a mined stem's /ə/ differed from its rule reading. The
same frozen dictionary replay changed 54 predictions and yielded four strict
wins but nine strict losses, including cited `notice`/`practice` forms where
the pinned IPA-Dict readings differ from Cambridge. Under the unchanged
benchmark adoption gate, the candidate was removed; references and baselines
were not edited. This remains a documented source-versus-reference
disagreement, not a pronunciation gain. The regenerated table currently scores
62,306/105,066 full rules strict, 5,357/6,990 common strict, and 2,894/3,617
top-slice strict. Public CMU default/rules are 4,751/5,000 and 4,155/5,000;
context remains 87/85/53/49, homographs 1,454/1,615, and parity is
94,774/100,805, still below its committed baseline. Focused issue #28 tests,
typecheck and `git diff --check` pass; full Jest passed immediately before
removing the rejected candidate. It now passes after removal as well: 372
suites / 6,852 tests. Direct Rollup and packaged CJS/ESM issue #28 smokes pass.
No baseline was refreshed.

The post-rebuild route replay again verified all 6,990 common words and showed
no morphology or unsplit alternative with a safe strict gain. Postlex ablation
replayed 107,644 forms; removing the only common strict positive, conditional
`-ett` reduction, loses 32 full-dictionary strict matches. A fresh ten-fold
structural learner replay accepted 43 fold-local candidates but none passed the
legacy filter; held-out strict stayed 74.81% before and after filtered rules.
Reports are in `/tmp/phonemize-route-diagnosis/report.json`,
`/tmp/phonemize-postlex-20261021-rebuilt/results.json`, and
`/tmp/phonemize-rule-corrections/cv-common-report.json`. No candidate passed
the adoption gates, so the 90% release target remains open.

The post-rebuild common failure-cluster report is dominated by single-vowel
differences, so the top-ranked misses were checked through actual dispatch.
At rank 411, `article` takes the rules-only `/ɪ/` path while the pinned table
expects `/ə/`; Cambridge US records `/ɪ/` for that syllable. At rank 437,
`credit` likewise differs in the weak vowel, but Cambridge gives `/ɪ/` for the
noun and `/ə/` for the verb, which the isolated-word cohort cannot resolve
without POS. These are source/POS contract differences, not evidence for a
general vowel rewrite; no rule was changed. [Cambridge: article](https://dictionary.cambridge.org/us/pronunciation/english/article),
[credit](https://dictionary.cambridge.org/pronunciation/english/credit).

### Initial `what` root vowel (2026-10-21)

The existing w-final-onset short-`a` rule gave the grammatical root `what` the
LOT vowel (`/ɑ/`). A narrow spelling-frame condition now gives `wh-at` the
STRUT vowel (`/ʌ/`) in the root and its regular contractions, while retaining
the prior `/ɑ/` route for neighboring `wham`, `whack`, `whale`, `wharf`, and
the surname `Whatley`. Cambridge's US entry lists `/hwʌt/` among the accepted
American pronunciations of *what* ([Cambridge Dictionary](https://dictionary.cambridge.org/us/dictionary/english/what)).

The rebuilt rule replay changes eight rows versus the frozen pre-candidate
snapshot: three common-cohort strict wins (`what`, `what's`, `what're`), no
strict losses, and five other rule/morph rows outside that cohort. `Whatley`
remains unchanged. The real rebuilt gates report common strict 5,358/6,990
(76.65%) and top slice 2,895/3,617 (80.04%), one additional success in each
population; full rules strict is 62,309/105,066 and stress-aware phonemic
correct is 54,717/90,309. Public CMU default is 4,751/5,000, rules-only
4,159/5,000 (its legacy 90% floor still fails); context is 87/85/53/49 across
the four cells, and homographs are 1,454/1,615. Runtime parity remains
94,774/100,805, below its committed baseline. No baseline was refreshed.

The focused what-root and soever suites pass (42 tests), as do typecheck, all
373 Jest suites / 6,854 tests, direct Rollup, packaged CJS/ESM smoke for `what`
and `O'Reilly Media`, and `git diff --check`. Five English rule modules total
3,395 code lines, exactly at (not above) the retained compression trigger.
The issue #28 apostrophe behavior remains covered by generic rules and package
smokes; no company-specific pronunciation map was added. Evidence and final
snapshot are under `/tmp/phonemize-what-root-20261021/`.

This is an accumulating validated gain, not release acceptance: common strict
still needs 934 more correct words and the top slice 361 more to exceed 90%.
A fresh post-candidate, ten-fold structural learner pass selected 43 TRAIN
corrections and none passed the existing filter. Applying them all lowered
held-out strict from 3,815 to 3,791/5,098; the filtered set is empty and leaves
the held-out score unchanged. No learner proposal was adopted. The report is
`/tmp/phonemize-learn-rules-post-what-20261021/cv-common-report.json`; continue
screening actual spelling classes with paired controls and full-pipeline replay.

Manual authoritative-dictionary screening rejects the learner's strongest
local candidate (`c` before unstressed `i`, changing `/ɪ/` to `/ə/`): the
rules-only `/ɪ/` readings of [acid](https://dictionary.cambridge.org/us/pronunciation/english/acid)
and [explicit](https://dictionary.cambridge.org/pronunciation/english/explicit)
match Cambridge US, so matching the current IPA-Dict entries would make them
less accurate. The common mismatch report also has dense final `-ed` and
`-ated` clusters, but that is not enough evidence for a uniform change.
Preserve current predictions and references while screening for a class whose
gains are independently attested and survive paired full-pipeline replay.

### Fresh rebuilt gates and route replay (2026-10-21)

After restoring the source overlay to its pre-screening entries, `build-dict`
recreated the prior frozen English dictionary (`data/en/dict.json` SHA-256
`b98822901aea458a0ca57eb6a785092477ad3ba678b41ab182cc54108efc0e28`). Seed
and compound data were regenerated; dependency-aware re-pin retained 523
entries and rebuilt `exceptions.json` to 53,977 entries. The fixed common
cohort remains 5,358/6,990 strict and 6,376 lenient; the fixed top slice is
2,895/3,617 strict and 3,355 lenient. Full-dictionary rules are
62,310/105,066 strict and 83,667 lenient. No baseline was refreshed.

Current acceptance gates: public CMU default 4,751/5,000 and rules-only
4,159/5,000; stress-aware phonemic 54,717/90,309; context default/auto
87/108, default/gold-POS 85/108, rules/auto 53/108, rules/gold-POS 49/108;
homographs 1,454/1,615. Runtime parity is 94,774/100,805, one below the
committed strict baseline. Re-pinning restores CMU default from 4,749 to 4,751
and parity from 94,769 to 94,774. The public default CMU floor, context target
and homograph target pass; common-word release targets and parity against the
committed baseline do not.

Replayed `diagnose-routes` against all 6,990 common words after rebuild. Neither
the morphology-disabled nor unsplit alternative produces a safe net gain;
the largest paired alternatives have substantially more strict losses than
wins. `diagnose-postlex --all --include-long` replayed 107,644 words: no rule
removal improves both full-dictionary and common strict counts. Removing the
conditional `-ett` reduction gains one common strict match but loses 32 full
strict matches, so it remains. Reports: `/tmp/phonemize-route-diagnosis/report.json`
and `/tmp/phonemize-postlex-diagnosis/results.json`.

A temporary `-it` silent-e guard was also rejected after full snapshot replay:
the spelling shape includes genuine dropped-e verbs (`bite`, `cite`, `invite`)
alongside checked-vowel roots (`edit`, `credit`, `audit`), so the guard changed
both classes and lowered common strict from 5,358 to 5,357. The code and its
temporary test were removed; the candidate snapshot is retained at
`/tmp/phonemize-it-inflection-after.tsv` for future diagnosis.

The complete Jest suite passes (373 suites / 6,854 tests), as do typecheck and
`git diff --check`. The `yarn build` wrapper cannot start tsx's IPC pipe in
this sandbox (`EPERM`), so each build-pipeline step was run directly with
`node --require tsx/cjs`; direct Rollup then succeeded. CJS and ESM dist
smokes verify `O'Brien`, `O'Reilly Media` and `Media` in the issue #28 sentence.
Rollup still emits its existing mixed-export and
external `pinyin-pro` warnings.

### Re-pinned common-word learner and e-prefix replay (2026-10-21)

The 10-fold structural learner was rerun against the rebuilt exception table
and unchanged 6,990/3,617 populations. It selected 43 fold-local corrections;
none passed the train-only legacy filter. Applying every selected correction
reduced pooled held-out strict from 3,815 to 3,791/5,098, while the filtered
set left it unchanged at 3,815/5,098. The strongest `/ɪ/→/ə/` proposals match
several IPA-Dict rows but conflict with checked Cambridge US readings (see the
acid/explicit screening above). Report:
`/tmp/phonemize-learn-rules-after-repin-20261021/cv-common-report.json`.

A generic unhyphenated `e` + known compound-tail split was simulated over the
fixed common cohort. It changed eight words: three strict wins (`email`,
`ebay`, `event`) and four strict losses (`estate`, `equal`, `earn`, `escape`),
with one additional non-scoring change. The spelling alone cannot distinguish
electronic `e-` compounds from ordinary roots, so this rule was not adopted.

Cambridge US records weak `/əˈr/` starts in [arise](https://dictionary.cambridge.org/pronunciation/english/arise),
[around](https://dictionary.cambridge.org/us/pronunciation/english/around),
[arrest](https://dictionary.cambridge.org/us/pronunciation/english/arrest),
and [arrange](https://dictionary.cambridge.org/us/pronunciation/english/arrange),
while the pinned IPA-Dict uses rhotic-schwa notation for this frame. A
compound-tail replay would fix `around` against its pinned row, but change four
already exact common rows (`array`, `arrival`, `arise`, `arrange`); its net
strict effect is therefore negative. No broad rule or reference edit was
adopted.

### Cambridge word corrections and `-ocus` inflections (2026-10-21)

The user clarified that the brand example is **O'Reilly Media**; `O'Reily` was
only illustrative. Existing issue #28 regressions cover the actual brand,
straight/curly apostrophes, possessives, contextual tokens, and the Seann/Sean
behavior. No brand-specific runtime map was added.

Added a general no-dropped-e spelling guard for `-ocus` inflections. It fixes
`focused`, `focusing`, `refocused`, `refocusing`, and `refocuses` in both
dictionary and rules modes. Cambridge US records [focus as /ˈfoʊ.kəs/ and
focused as /ˈfoʊ.kəst/](https://dictionary.cambridge.org/us/pronunciation/english/focused).
Paired controls `accused`, `accusing`, `refused`, `used`, and `using` remain
unchanged. The targeted tests pass 38/38, including issue #28.

The fixed common strict counts remain 5,358/6,990 and 2,895/3,617, so this
candidate does not advance the 90% subset target. Public CMU accuracy improves
from 4,751 to 4,752/5,000 in both default and rules-only mode; the stress-aware
phonemic count rises from 54,717 to 54,718/90,309. Full-dictionary strict is
unchanged at 62,310/105,066; lenient is 83,671. Context remains 87/108,
85/108, 53/108, and 49/108; homographs remain 1,454/1,615. The CMU rules-only
result remains below its legacy 90% floor and is accepted only for
nondecreasing comparison.

Cambridge US confirms [eventual as /ɪˈven.tʃu.əl/](https://dictionary.cambridge.org/us/dictionary/english/eventual)
and [eventually as /ɪˈven.tʃu.ə.li/](https://dictionary.cambridge.org/us/pronunciation/english/eventually).
Their prior pinned entries had a different onset/segment sequence, so those
two source readings were corrected in `src-data/en/custom.dict`; the stale
`eventually` test expectation was corrected from Cambridge evidence. This is
a source/reference correction, not a generalized rule gain. It raises full
lenient by four but not common strict. It also leaves the sole runtime-parity
strict loss at `eventual`: the corrected runtime has coda /ɫ/, while the
custom CMU transcription emits light /l/. Current parity is 94,773/100,805,
one below the committed 94,774 baseline; no baseline was refreshed. This
parity conflict keeps the batch below the full adoption gate.

An exploratory Cambridge correction for `genuine` was removed: although the
base-word source reading was independently confirmed, it changed the derived
`genuinely` rules path and reduced full-dictionary strict by one without a
paired rules fix. It is not part of the retained candidate.

Final validation: 374 Jest suites / 6,862 tests pass; typecheck and direct
Rollup pass; `git diff --check` passes. The `yarn build` wrapper still cannot
open tsx's sandbox IPC pipe (`EPERM`), so the prescribed build-pipeline steps
were run directly with `node --require tsx/cjs`; Rollup succeeded with the
existing mixed-export and external `pinyin-pro` warnings. No baseline was
updated. The 90% target remains open: the common subset needs 934 additional
strict matches and its top-5,000 slice needs 361. Snapshots and reports are in
`/tmp/phonemize-next-release/` and the latest `/tmp/phonemize-final-accuracy-parity.tsv`.
Final frozen data hashes: `data/en/dict.json`
`bd6f1702c774e9f0322a58e387bd66170423c6e37d2579f979dad8efcdffc5d9`,
`data/en/exceptions.json`
`26921efbccd4df7316d3dea964606560710cbefe9b47f54d7c6d8bef1fa3a1da`,
`data/en/homographs.json`
`0f6372b64b571c0c8a157810b30d8e9d4fbf03abad40ad012332222a2b12e611`, and
`src-data/en/custom.dict`
`24670ee434ad35fcd48e4048cc03dc52758b67cdd52ec4b7129d7fc77fa0f1c1`.

### Current-hash common learner rerun (2026-10-21)

The 10-fold structural strict learner was rerun against the rebuilt dictionary
(`data/en/dict.json` SHA-256 above), the fixed 6,990/3,617 common populations,
and the unchanged frequency/baseline inputs. It accepted 43 train-only
corrections and passed zero through the train-only regression filter; filtered
held-out strict stayed 74.83% (3,815/5,098), while applying all accepted
corrections fell to 74.36% (3,791/5,098). The leading repeated `/ɪ/` to `/ə/`
candidate before `<c>` has 51 fixes and 24 breaks in pooled training, with
Cambridge-backed counterexamples such as *acid* and *explicit*. No candidate
was adopted. Full report and the frozen 1,296,341-row source/rule/morph/POS
snapshot are under `/tmp/phonemize-next-release/continuation-20261021/`; the
fixed frequency and baseline SHA-256 values are respectively
`981c776dc7e8996accb256e5fea9d241331b9602efe0c977285734890e1ae729` and
`ce64d1fe7370d949198a5bb24fff83dd228414b53795ca37a8b02fbb659615ed`.
The rebuilt common strict gates remain 5,358/6,990 and 2,895/3,617; all other
release gates and no-regression checks remain required.

### Common suffix denominator scan: final `-ate` (2026-10-21)

A fresh scan over every fixed common-cohort word (not just the mismatch file)
found 19 strict mismatches among 73 `-ate` spellings. The tempting reduction
`/eɪ/` to `/ə/` is not a safe suffix rule: Cambridge US confirms `/ət/` in
[climate](https://dictionary.cambridge.org/us/pronunciation/english/climate)
and [pirate](https://dictionary.cambridge.org/us/pronunciation/english/pirate),
while paired `-ate` controls such as *create*, *locate*, *template*, and
*private* retain different vowels according to stress and morphology.
[Candidate](https://dictionary.cambridge.org/us/pronunciation/english/candidate)
also lists both `/dət/` and `/deɪt/`; the fixed one-reading strict scorer marks
one of those accepted forms wrong. Other errors in the `-ate` group concern
root vowels or stress, so the suffix count does not support one shared sound
change. No rule or expectation was changed; a future attempt needs a
POS/morpheme-conditioned class and full contextual controls.

An optimistic route-output simulation reduced final `/eɪt/` to `/ət/` only
when no corresponding `<base>ation` entry or verified compound split existed.
It changed 254 full-dictionary predictions, with 30 strict wins and 97 losses;
the fixed common cohort had 4 wins and 13 losses (top slice 4/7). That simple
morphology signal cannot distinguish lexicalized nouns such as *climate* and
*pirate* from verbs such as *translate* or compound heads such as *template*.
This was an offline screen, not a source-rule replay, and was rejected before
implementation.

### Initial `<wol.f>` rime correction (2026-10-21)

The rules-only path predicted *wolf* as `/wɑlf/`; Cambridge US gives
`/wʊlf/`. Collins US gives `/ˈwʊlfrəm/` for *wolfram*, supporting the same
root vowel in a transparent compound. A grapheme/syllable condition now selects
/ʊ/ for initial `<wolf>` roots, including *wolfish*, *wolfman*, *wolfram*,
and possessives. It does not alter the established neighboring controls
*wold*, *golf*, *wool*, *wood*, and *woman*. No whole-word map or runtime name
entry was added.

The frozen 1,296,341-row snapshot changed 45 predictions across rules and
morphology routes. Of 19 changed dictionary words, 15 gained strict matches,
zero lost strict matches, and the remaining four were already strict misses;
lenient had one additional win and zero losses. Only *wolf* intersects the
fixed non-foreign common cohort, moving full-subset strict from 5,358 to
5,359/6,990; the top-5,000 slice is unchanged at 2,895/3,617. Full-dictionary
rules strict/lenient rose from 62,310/83,671 to 62,325/83,675. Dictionary,
exceptions, homographs, and custom-dictionary SHA-256 values are unchanged
from the frozen build. The byte-identical compression pass returned the five
rule modules to the 3,395-line cap; its output snapshot is identical to the
pre-compression candidate (`after-wolf.tsv` and `after-compression.tsv` under
`/tmp/phonemize-next-release/continuation-20261021/`).

Post-build gates: public CMU default 4,752/5,000 (pass), rules-only 4,160/5,000
(unchanged legacy floor failure); stress-aware phonemic 54,728/90,309 (+45);
homographs 1,454/1,615 (unchanged); context IPA remains 87/108, 85/108, 53/108,
and 49/108; all other reported counts match the before-run or improve. Runtime
parity remains at 94,773/100,805, one below the committed 94,774 baseline due
to the previously documented `eventual` notation conflict; the frozen
snapshot confirms this rule changed no default dictionary-route prediction.
The full suite passes (375 suites / 6,873 tests), as do typecheck, Rollup,
focused issue #28/O'Reilly tests (39 tests), and `git diff --check`. No
baselines were refreshed; the 90% common strict target remains open.

### Follow-up route diagnostics (2026-10-21)

The common failure clusters remain dominated by name/place spellings and
context-sensitive short words. Route ablation confirms current morphology is
net helpful on the fixed common set: removing morphology drops strict/lenient
from 5,359/6,377 to 4,716/5,907; the unsplit route drops them to 4,602/5,830.
Full postlex removal had no safe common-wide candidate: removing the
`/sʃ/ → /ʃ/` rule fixes *tissue* leniently but breaks *issue* strictly, while
the `<ett>` KIT rule helps only *Bennett* among common words and is embedded in
a wider spelling class with mixed full-dictionary results. Neither was
changed. The route and postlex win/loss reports are under
`/tmp/phonemize-route-diagnosis/` and `/tmp/phonemize-postlex-diagnosis/`.

### Expanded common-rule learner screen (2026-10-21)

The family-held-out learner was rerun with `--expanded --triples`, retaining
actual runtime replay and TRAIN-only selection. Across 10 folds it accepted
110 candidates and passed zero through the existing filter; applying all
accepted candidates reduced held-out strict from 3,816/5,098 to 3,800/5,098
and lenient from 4,572 to 4,551. The report is under
`/tmp/phonemize-next-release/continuation-20261021/learner-expanded/`.

Its largest top-5,000 candidate changes an unstressed `/ɪ/` after `t` to `/ə/`
before `ic` in a penultimate syllable. Although the pooled TRAIN count is
29 fixes and zero breaks in the top slice, held-out evidence is mixed and the
candidate misses support/fix-rate thresholds. More importantly, authoritative
Cambridge US readings agree with the current `/ɪ/` output for
[*article*](https://dictionary.cambridge.org/us/dictionary/english/article),
[*notice*](https://dictionary.cambridge.org/us/pronunciation/english/notice),
and [*practice*](https://dictionary.cambridge.org/us/pronunciation/english/practice);
Cambridge also gives `/ɪ/` for [*erotica*](https://dictionary.cambridge.org/us/pronunciation/english/erotica),
which this broad spelling condition would change. The apparent strict gains
therefore include a reference-variant conflict and are not evidence for
changing the general `<ti.c>` class. No source pronunciation or expectation
was changed.

### Final-`<ow>` class probe (2026-10-21)

The common mismatch cluster also points to final `<ow>` words such as *now*
and *cow*. Cambridge US confirms MOUTH in [*now*](https://dictionary.cambridge.org/us/pronunciation/english/now)
and [*cow*](https://dictionary.cambridge.org/us/pronunciation/english/cow),
while [*know*](https://dictionary.cambridge.org/us/pronunciation/english/know)
and [*snow*](https://dictionary.cambridge.org/us/pronunciation/english/snow)
have GOAT. The current rules already preserve the broader control families,
including *mow*, *tow*, *show*, and *slow*. No simple onset-wide `<ow>` rule
can safely cover these contrasts, so no candidate was adopted from this
cluster without a broader spelling-family explanation.

### Initial-`<w>ow` rule replay (2026-10-21)

Cambridge US gives MOUTH for [*wow*](https://dictionary.cambridge.org/pronunciation/english/wow)
and [*wowed*](https://dictionary.cambridge.org/us/dictionary/english/wowed).
The rules path had GOAT for *wow* and *wowie*, while the morphology route
already preserved MOUTH in *wowed*, *wowing*, and *wows*. A spelling-frame
condition for initial `<w>ow` now changes the rules-path forms without adding a
word map. The paired regression keeps GOAT for *mow*, *tow*, *low*, *know*,
*snow*, *show*, *slow*, and their tested forms. The full snapshot changed only
seven rule/morph predictions: *wow*, *wow's*, *wowie*, and four derived forms;
the earlier broader replay also exposed unwanted changes in *powwow* and
*Karwowski*, so the condition is limited to the initial syllable.

After dictionary rebuild, full-dictionary rules strict/lenient is
62,328/83,675 (+3/+0); common strict/lenient is 5,360/6,377 (+1/+0) of 6,990,
and top-5,000 is 2,896/3,356 (+1/+0) of 3,617. CMU rules-only is 4,161/5,000
(+1; its legacy 90% floor still fails); default public API remains 4,752/5,000.
Stress-aware phonemic is 54,730/90,309 (+47). Homographs remain 1,454/1,615;
context IPA remains 87/108, 85/108, 53/108, and 49/108. Runtime parity remains
94,773/100,805, one below the committed baseline. Dictionary, homograph, and
custom dictionary hashes match the frozen inputs. The new paired tests, all
376 Jest suites / 6,890 tests, typecheck, and Rollup pass. `yarn build` still
hits the sandbox's tsx IPC `EPERM`; the required dictionary rebuild succeeded
through direct Node execution and Rollup passed directly. No baseline was
refreshed; the 90% common strict target and +1-point commit threshold remain
open.

The follow-up structural learner screen (`learn-rule-corrections.ts
--structural`) accepted 43 fold-local candidates but none passed the existing
held-out win/loss filter; mean held-out strict stayed 74.87% before and after
filtering. No further candidate from that screen was adopted. Its report is at
`/tmp/phonemize-rule-corrections/cv-common-report.json`.

A fresh actual-route ablation confirms morphology is essential to the common
score: removing it lowers strict/lenient from 5,360/6,377 to 4,717/5,907;
forcing the unsplit route lowers them further to 4,603/5,830. The largest
current trace cluster remains initial `i` (200) and `a` (136), with examples
dominated by names and acronyms. One ordinary-word error, *disease*, predicts
`dɪˈsiz` in the rule/morphology path against Cambridge US
[`dɪˈziːz`](https://dictionary.cambridge.org/us/pronunciation/english/disease).
The nearby [*disagree*](https://dictionary.cambridge.org/us/pronunciation/english/disagree)
and [*disengage*](https://dictionary.cambridge.org/us/pronunciation/english/disengage)
retain `/s/`, so voicing every `dis-` before a vowel is a regression; narrowing
it to `dis-ease` would be a single-root exception. No unsafe rule was adopted.

The all-dictionary postlex replay covered 107,644 words and 176 rules. No
rule-removal candidate improves both the common set and full dictionary. The
only common strict win without a common loss is removing the `<ett>` schwa rule
for *Bennett*; across the full dictionary the same removal fixes 11 and breaks
43. That is an isolated name/reference conflict, not a generalizable class.
Full win/loss evidence is in `/tmp/phonemize-postlex-all-20261021/results.json`.

A surface-alignment screen of the common mismatch report found 240 single-phone
`/ə/`-gold versus `/ɪ/`-rule differences. Cambridge US explicitly supports
the current `/ɪ/` for [*acid*](https://dictionary.cambridge.org/us/pronunciation/english/acid),
[*added*](https://dictionary.cambridge.org/pronunciation/english/added),
[*artist*](https://dictionary.cambridge.org/us/pronunciation/english/artist),
and [*article*](https://dictionary.cambridge.org/us/pronunciation/english/article).
This is a major CMU-versus-dictionary convention cluster, not a safe blanket
weak-vowel correction; candidates must be narrowed to independently supported
spelling families before changing the rule path.

### Narrow `con|cen|tr` weak-vowel replay (2026-10-21)

Cambridge US gives schwa in [*concentrate*](https://dictionary.cambridge.org/us/dictionary/english/concentrate)
and [*concentrator*](https://dictionary.cambridge.org/us/pronunciation/english/concentrator),
while *concentric* has stressed `/ɛ/`. The rule now limits schwa to an
unstressed `cen` syllable after `con` and before a `tr` syllable. Against the
frozen 1,296,341-row route snapshot, only `rule/concentrate` changed; default,
morphology and POS predictions were identical. The prior broader replay's
collateral words and derived-form stress loss are not present in this narrow
candidate. The rules-only common score is 5,361/6,990 strict (+1), 6,377
lenient (unchanged); top-5,000 remains 2,896/3,617 strict and 3,356 lenient.
Full-dictionary rules strict is 62,329/105,066 (+1), lenient 83,675. Stress-aware
phonemic and full-IPA exact counts are unchanged at 54,730 and 45,503; the
stress-only error bucket rises by one while the vowel-only bucket falls by one.
Public CMU default/rules are 4,752/5,000 and 4,161/5,000, respectively. Context
remains 87/108, 85/108, 53/108 and 49/108; homographs remain 1,454/1,615.
Runtime parity remains 94,773/100,805, one below its committed baseline because
of the existing `eventual` notation conflict. The dictionary rebuild retained
the frozen English dictionary and homograph hashes. All 377 Jest suites / 6,901
tests, typecheck, Rollup and `git diff --check` pass. Five rule modules total
3,394 code lines. No baseline was refreshed; the 90% strict goal remains open
by 931 common words and 360 top-slice words, and this batch remains below the
ordinary +70-word commit threshold.

### Silent-s PRICE `isle` spelling family (2026-10-21)

The common failure cluster includes *island* (`/ˈɪsɫənd/`) and *isle*
(`/ˈaɪsɫə/`) on the rules path. Cambridge US confirms [*island*]
(https://dictionary.cambridge.org/us/pronunciation/english/island) and
[*isle*](https://dictionary.cambridge.org/us/pronunciation/english/isle) have
initial PRICE with silent `s`; [*islet*](https://dictionary.cambridge.org/us/pronunciation/english/islet)
shares the root, while *Iceland* preserves `/s/`. A bounded orthographic
`isl + e/et/and` root rule fixes `isle`, `islet`, `island`, and the regular
`island` compounds without touching *Islam* or *Iceland*. The 1,296,341-row
snapshot changed 10 rows, all on the root/compound route or synthetic suffix
replays; scored full-dictionary changes were `island`, `island's`, `isle`, and
`islet` (strict +3/−0, lenient +4/−0). Common strict/lenient is 5,363/6,379 of
6,990; top-5,000 is 2,897/3,357 of 3,617. CMU public default/rules is
4,752/5,000 and 4,162/5,000. Full rules are 62,332/83,679 strict/lenient;
stress-aware headline/full IPA exact are 54,733/45,505. Context stays
87/108, 85/108, 53/108, and 49/108; homographs stay 1,454/1,615. Runtime parity
is unchanged at 94,773/100,805, one below its committed baseline. The rebuilt
dictionary hashes are unchanged. All 378 suites / 6,911 tests, typecheck,
Rollup, and `git diff --check` pass. Rule-module code remains at the 3,395-line
cap. No baseline was refreshed; common/top 90% strict remain 929/359 words
away, and the batch is below the ordinary +70-common-word commit threshold.

### Dark-L normalization counterfactual (2026-10-21)

The current strict mismatch inventory contains light/dark lateral notation
differences, so a frozen-snapshot counterfactual replaced every `/ɫ/` with
`/l/` only in rules predictions while leaving the pinned references and scorer
unchanged. On the fixed common cohort strict fell from 5,363 to 3,754/6,990;
top-5,000 fell from 2,897 to 2,083/3,617. Lenient was unchanged; strict had
1,611 losses against two wins in the full cohort. The emitted dark-l convention
matches the current pinned table broadly; global light-l rewriting is not a
valid accuracy shortcut. No source, reference, or baseline changed.

### Rejected broad syllabic `-es` KIT conversion (2026-10-21)

The common mismatch set includes plural/3sg forms whose final syllabic `-es`
is emitted as `/əz/` while a pinned CMU variant uses `/ɪz/`. Cambridge US
confirms `/ɪz/` in *natural resources* and `/ɪ/` in the base *service*,
*notice*, *practice*, and *office*. However, changing every final `/əz/` to
`/ɪz/` in the fixed top-5,000 report would turn 16 mismatches into matches and
18 matches into mismatches. The current phonotactic rule reflects its wider
dictionary tally (359 `/əz/` vs 107 `/ɪz/` syllabic `-es` readings), so the
surface pattern does not identify the correct vowel reliably. No broad
allomorph or reference change was adopted; a future candidate must separate a
productive morphological class with paired controls before replaying the
acceptance gates. Cambridge sources: [natural resources](https://dictionary.cambridge.org/pronunciation/english/natural-resources),
[service](https://dictionary.cambridge.org/us/pronunciation/english/service),
[notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[practice](https://dictionary.cambridge.org/pronunciation/english/practice),
and [office](https://dictionary.cambridge.org/pronunciation/english/office).

### Rejected final `/ɪdʒ/` to `/ədʒ/` conversion (2026-10-21)

A frozen rules-route replay replaced a word-final `/ɪdʒ/` sequence with
`/ədʒ/` wherever it occurred, then compared unchanged predictions and golds
with the normal stress-stripped strict scorer. Of 339 testable dictionary
rows affected, the full cohort had 49 wins and 179 losses. The common cohort
had 20 wins and 22 losses; the fixed top-5,000 slice had 12 wins and 12
losses. Words such as *damage*, *image*, *message*, *package*, *usage*, and
*village* favored schwa, while *advantage*, *college*, *footage*, *garbage*,
and *vintage* already had the correct `/ɪ/`. The suffix alone therefore does
not identify a safe pronunciation class. No source rule, table, reference, or
baseline changed.

### Rejected generic hard-G recovery before final `-in` (2026-10-21)

The common rule trace marks *login* and *plugin* with soft `/dʒ/`, while
Cambridge US gives hard `/ɡ/` for [*login*](https://dictionary.cambridge.org/pronunciation/english/login).
Simply changing every `-gin` after an independently listed `g`-final root
would also affect 11 dictionary entries that are not transparent `root + in`
compounds, including surname/place readings such as *Bogin*, *Cragin*, *Elgin*,
*Magin*, and *Ragin*. In the 13-word whole-dictionary route screen, a final
`/dʒ/`→`/ɡ/` substitution produced 3 strict wins and 5 strict losses; several
other affected words remained mismatches because their root vowels also
differed. *Begin* is a required hard-G control for the spelling, but it does
not establish a productive `-gin` rule ([Cambridge US](https://dictionary.cambridge.org/pronunciation/english/begin)).
No spelling-wide code change was adopted; the remaining *login/plugin* errors
need a productive compound boundary signal that does not classify unrelated
names as compounds.

### CMU yod conflict in high-frequency `new`/`knew` (2026-10-21)

The rules path emits `/nu/` for *new*, *knew*, and *renew*, while the pinned
CMU row for *new* and *knew* carries `/nju/`. Cambridge explicitly gives US
`/nuː/` and UK `/njuː/` for [*new*](https://dictionary.cambridge.org/pronunciation/english/new)
and [*knew*](https://dictionary.cambridge.org/us/dictionary/english/knew);
its US entry for [*renew*](https://dictionary.cambridge.org/us/dictionary/english/renew)
also has `/nuː/`. These are correct US rule outputs that strict CMU scoring
counts as errors, so adding a yod to the rules or changing the pinned gold to
manufacture a gain would be inappropriate. Keep the source distinction visible
when analyzing the remaining common-word strict gap.

### Monosyllabic `-uth` long-U rime (2026-10-21)

The rules path used STRUT in stressed, monosyllabic `-uth` forms such as
*truth* and *Ruth*. A narrow syllable rule now gives `/u/` to the stressed
single-syllable `-uth`/`-uths` rime, including productive plural stems; it
does not apply to multisyllabic *bismuth*, the `/aʊ/` `-outh` set (*south*,
*mouth*), or `ou` in *uncouth*. Cambridge US gives `/truːθ/` for
[*truth*](https://dictionary.cambridge.org/us/pronunciation/english/truth),
and its [*Ruth* pronunciation](https://dictionary.cambridge.org/pronunciation/english/ruth)
is `/ruːθ/`. Tests pair both targets with *youth*, *sleuth*, *tooth*,
*uncouth*, *bismuth*, `truths`, `ruths`, `truthful`, `untruth`, possessive
`Ruth's`, and full-sentence controls.

The frozen common cohort rose from 5,363 to 5,365 strict (6,990 items), and
the top-5,000 slice from 2,897 to 2,898 strict (3,617 items). Full-dictionary
rules strict rose 62,332→62,347 and lenient 83,679→83,680. Public CMU rules
accuracy rose 4,162→4,163/5,000; default stayed 4,752/5,000. Stress-aware
headline/full-IPA exact rose 54,733→54,746 and 45,505→45,517. Default context
remains 87/108, homographs 1,454/1,615, and runtime parity 94,773/100,805;
the latter retains its previously documented one-word baseline shortfall.
The rebuild re-pinned 525 entries (523 resolved, five retained net-positive
regressions); common/top counts did not move beyond the rule wins. Five
default parity rows changed only secondary-stress placement, leaving their
segments and primary stress unchanged; the concentration regression checks
now enforce those stable properties because Cambridge US marks no secondary
stress for the cited forms. All 379 Jest suites / 6,926 tests, typecheck,
Rollup, and `git diff --check` pass. No baseline was refreshed: the common
strict score is 927 words below the requested 6,292/6,990 threshold and the
top slice is 358 below 3,256/3,617. The batch remains below the ordinary
70-word commit minimum relative to the current committed baseline.

### Structural candidate replay after the `-uth` batch (2026-10-21)

The TRAIN-only structural learner was rerun on the fixed 6,990-word common
cohort with spelling-family folds and actual pipeline replay. It selected 43
fold-local corrections, but none passed the legacy training filter in any
fold; held-out strict remained 74.97% on average before and after filtering.
Its leading proposal changed unstressed `/ɪ/` to `/ə/` after `c` before `i`
and appeared in 9/10 accepted-fold sets, but passed the filter in 0/10 folds.
This is not adoption evidence. In the frozen error report, apparent
`-age` and `-ist` clusters also reflect pinned-reference transcription
differences: Cambridge US gives `/ɪ/` in *package* and *artist*, matching the
current output where the pinned IPA rows use `/ə/`. No rule, reference,
baseline, or runtime data changed in this replay.

### Full-dictionary postlex ablation after the `-uth` batch (2026-10-21)

The required `--all --include-long` postlex diagnostic replayed 107,644 words
through the real pipeline and tested removal of all 176 postlex rules. No
single-rule removal improved the tracked full-dictionary and common strict
and lenient counts together. The only removal with a common strict gain was
the guarded `-ett` `/ɪt/` rule: it gains one common word but loses 32 strict
words across the full dictionary, so it was retained. No postlex rule was
changed.

The top-ranked common mismatches also contain individually irregular words
whose pinned readings agree with current authoritative US entries, such as
*now* `/naʊ/`, strong *have* `/hæv/`, *from* `/frʌm/` or weak `/frəm/`, and
*said* `/sɛd/`, while the spelling rules emit a different reading. These are
valid word-level reading gaps, not a supported suffix/onset class; adding a
spelling-wide rule from them would overfit. Cambridge sources: [now](https://dictionary.cambridge.org/us/pronunciation/english/now), [have](https://dictionary.cambridge.org/us/pronunciation/english/have), [from](https://dictionary.cambridge.org/us/pronunciation/english/from), and [said](https://dictionary.cambridge.org/us/pronunciation/english/said).

### Structural distance-objective replay (2026-10-21)

The same frozen common cohort and spelling-family folds were replayed with
the learner's partial-distance objective. It accepted 18 fold-local rules,
but again none passed the train-only adoption filter. Held-out strict stayed
at 74.97% before and after filtering. Its leading candidate changed the
unstressed output after `m` in a few words: it repeatedly repairs *image* and
*climate* but breaks *estimate* and *approximate*. Those words do not support
one productive environment, and the proposal fails the minimum-support and
fix-rate requirements. No source rule or baseline changed.

### Orthographic splits for final syllabic `-es` (2026-10-21)

To check whether spellings could rescue the rejected global `/əz/`→`/ɪz/`
change, the full rules-only dictionary and fixed common cohort were replayed
by final letter groups. Replacing the final vowel only for `-ches`, `-shes`,
`-sses`, `-ses`, `-xes`, `-zes`, `-ges`, or `-ces` did not improve strict in
any cohort. Full/common/top-5000 strict deltas were respectively
`-38/-12/-5`, `-29/-1/0`, `-32/-9/-5`, `-85/-27/-15`, `-7/-2/-2`,
`-13/-1/-1`, `-40/-18/-9`, and `-65/-27/-15`. The orthographic endings do
not separate the dictionary's competing vowel conventions; no allomorph
change was made.

### Neutral rule-module compression (2026-10-21)

After the repeated-grapheme cluster trigger, grouped the adjacent syllabifier
initialization declarations without changing their values or order. The
complete snapshot remained byte-identical across 1,296,341 dict, rule,
morphology, and POS predictions. All 379 Jest suites / 6,926 tests and
typecheck pass. The five rule modules now total 3,394 code lines
(`g2p` 1,144, `syllabify` 1,708, `postlex` 496, `morph-table` 20,
`morph-parser` 26), one below the retained cap. A separate attempted adjacent
`/z/` rule merge was rejected because the full snapshot exposed its syllable-
position guard; that merge was reverted.

### Regular-inflection route ablation after compression (2026-10-21)

The current common-cohort route replay verified all 6,990 baseline
predictions. Removing the regular-inflection dispatcher branch at
`tryMorphologicalAnalysis:L1612` changed 321 predictions: 38 strict wins and
208 strict losses (lenient +6/-162). A large share of its apparent wins are
CMU `/ə/` versus rule `/ɪ/` in the syllabic `-ed` ending; Cambridge US
explicitly gives `/ɪd/` for [*wanted*](https://dictionary.cambridge.org/us/pronunciation/english/wanted)
and [*coated*](https://dictionary.cambridge.org/us/pronunciation/english/coated).
The remaining changes combine unrelated stem-vowel and stress differences.
This ablation does not support a general inflection or suffix change, and no
rule or reference was changed.

### Rebuild and packaged release-gate refresh (2026-10-21)

Rebuilt the generated tables from the pinned upstream sources, then ran Rollup.
The dependency-aware exception miner re-pinned 525 entries (523 resolved, five
retained net-positive regressions). The rebuilt common rules scores are
unchanged at 5,365/6,990 and 2,898/3,617; default/rules CMU accuracy is
4,752/5,000 and 4,163/5,000. Context cells remain 87/108, 85/108, 53/108,
49/108; homograph eval remains 1,454/1,615; stress-aware headline/exact remain
54,746/45,517. Runtime parity remains 94,773/100,805, equal to the frozen
pre-rebuild run and still one strict word below its committed baseline. All
379 Jest suites / 6,926 tests, typecheck, Rollup, and `git diff --check` pass.

An extracted npm tarball also passes CJS and ESM package checks for O'Brien,
O'Reilly Media, and the complete sentence `O'Reilly Media published the book.`
The pronunciation stays `/oʊˈɹaɪɫi/` and `Media` remains a separate token. No
baseline was refreshed and no release was published; the 90% rules targets
remain unmet.

### Lexical velar `-ed` syllables (2026-10-21)

The postlexical regular-past rule was collapsing dictionary readings of
*crooked*, *naked*, *wicked*, *ragged*, *rugged*, and *legged* to `/kt/` or
`/gd/`, although Cambridge US gives the lexical syllable `/kɪd/` or `/ɡɪd/`
for these adjective readings ([*crooked*](https://dictionary.cambridge.org/us/pronunciation/english/crooked),
[*naked*](https://dictionary.cambridge.org/us/pronunciation/english/naked),
[*wicked*](https://dictionary.cambridge.org/us/pronunciation/english/wicked),
[*ragged*](https://dictionary.cambridge.org/pronunciation/english/ragged),
[*rugged*](https://dictionary.cambridge.org/us/pronunciation/english/rugged),
[*legged*](https://dictionary.cambridge.org/us/dictionary/english/legged)).
The general postlexical correction now keeps a syllabic ending only when the
complete word has a matching lexical dictionary reading and the supplied POS
is not verbal. Verb-tagged readings still use the regular past allomorph, and
OOV inflections such as `bryked` continue through the productive rule. This
avoids a spelling-only exception or a per-word map.

The frozen 1,296,341-prediction snapshot changes only those six lexical words
and their six possessives; the earlier OOV changes (`bryked`, `dyked`,
`lynked`, `trygged`, `wyked`) are absent. Common rules strict remains
5,365/6,990 and top-5000 2,898/3,617. Public CMU default rises from
4,752 to 4,753/5,000; rules-only remains 4,163/5,000. Runtime parity rises
from 94,773 to 94,778/100,805. Full rules strict/lenient remain
62,347/83,680; stress-aware remains 54,746/45,517; context remains
87/85/53/49; homographs remain 1,454/1,615. The combined gains do not meet
the 70-word common strict commit minimum, and the 90% targets remain open.

Validation: all 379 Jest suites / 6,929 tests, typecheck, the common/full
rules evaluators, default and rules CMU checks, stress-aware, context,
homograph, and parity gates pass their unchanged-contract comparisons. No
baseline was refreshed. Direct Rollup succeeded with its existing mixed-export
and external `pinyin-pro` warnings. A freshly extracted npm tarball passes CJS
and ESM checks for the lexical readings and O'Reilly Media. The five rule
modules total 3,395 code lines, at the retained cap.

### Rejected final `-land` reduction (2026-10-21)

A candidate that reduced secondary-stressed `/ˌlænd/` to `/lənd/` for words
spelled `-land` would repair four common-cohort mismatches (`highland`,
`Iceland`, `Oakland`, `Portland`) but break three currently correct controls
(`Thailand`, `mainland`, `homeland`), for only one net strict gain and three
paired regressions. Cambridge US supports `/lənd/` in [*Highlands*](https://dictionary.cambridge.org/pronunciation/english/highlands),
[*Iceland*](https://dictionary.cambridge.org/pronunciation/english/iceland),
[*Portland*](https://dictionary.cambridge.org/us/pronunciation/english/portland),
[*Finland*](https://dictionary.cambridge.org/pronunciation/english/finland),
and [*Cleveland*](https://dictionary.cambridge.org/dictionary/english/cleveland),
but the spelling class does not separate the correct reference forms in the
fixed cohort. The experiment changed no source or expectations and was
rejected under the zero-control-regression gate.

### Current structural learner and `-ative` replay (2026-10-21)

Reran the 10-fold, spelling-family-held-out structural learner against the
current generated dictionary, fixed 6,990-word frequency population, and
current runtime. All 43 fold-selected corrections failed the train-only
legacy filter. Applying all selected corrections reduced pooled held-out
strict from 3,822 to 3,798/5,098; the filtered set is empty. No proposal was
adopted. A separate `-ative` composition simulation that reused the matching
`-ate` stem plus `/ɪv/` found no strict common-word wins and three regressions
among eleven tested forms (`alternative`, `negative`, `relative`), because
stress and stem allomorphy do not transfer uniformly. This class was also
rejected. The current fixed common scores remain 5,365/6,990 and 2,898/3,617;
the next search remains focused on productive root/morphology contexts with
paired unchanged controls.

A final `-age` `/ɪ/→/ə/` simulation had 18 strict wins and 18 losses over the
46 common words in that spelling class, so the net gain was zero. Cambridge US
explicitly records `/ɪdʒ/` for [*message*](https://dictionary.cambridge.org/us/pronunciation/english/message),
[*package*](https://dictionary.cambridge.org/pronunciation/english/package),
and [*passage*](https://dictionary.cambridge.org/us/pronunciation/english/passage),
whose pinned reference entries use schwa. The apparent strict wins therefore
include reference-convention disagreements rather than established rule
errors; neither the rule nor the references were changed.

### Initial `ex-` vowel replay (2026-10-21)

Changing initial rule-path `/ɪk/` to `/ɛk/` across the 47 common `ex-` words
where the pattern occurs yields 7 strict wins and 34 losses. The wins include
stressed noun readings (`export`, `excerpt`, `extract`), while unchanged
controls such as `expect`, `except`, `expense`, `experience`, and `exchange`
require the current weak `/ɪ/`. This prefix spelling alone cannot identify
the intended vowel or citation POS; no blanket `ex-` rule was adopted.

### Weak stem `/ɪ/` before `-ation` replay (2026-10-21)

Tested centralizing a weak root `/ɪ/` immediately before a secondary-stressed
syllable when a supplied `-ate` root composes into `-ation`. Across the
full-dictionary set this changes 21 forms: 4 strict wins and 11 losses. The
common cohort changes four forms (one win, two losses); top-5000 changes six
(two wins, three losses). Although it repairs `legislation` and
`consolidation`, it breaks forms such as `administration` and
`liquidation`. The root environment does not determine the derived weak vowel,
so this class was rejected without changing the rule or gold readings.

### Final `-ower` rime replay (2026-10-21)

Changing rule-path final `/oʊɝ/` to `/aʊɝ/` for `-ower` spellings repairs
`flower`, `tower`, and `shower` in the fixed common cohort, but breaks the
correct `lower`. Across the full testable non-foreign dictionary it repairs
12 and breaks 23 words, including agent nouns such as `blower`, `grower`, and
`mower`. The spelling does not distinguish the `/aʊ/` lexical rime from
productive `-er` forms with `/oʊ/`; accepting the common +2 net would violate
the zero-regression control gate. No source rule or reference was changed.

The spelling-family 10-fold learner was also rerun with its partial-distance
objective over the same 5,098 rule-path words. It accepted 18 fold-local
corrections, but none passed the train-only adoption filter. Applying all 18
reduced pooled held-out strict from 3,822 to 3,813/5,098 (74.97% to 74.79%);
the filtered set is empty. The leading `/eɪ/→/ə/` proposal after `m` had
10 train fixes and 9 breaks and still failed its filter in all five folds
where selected. No learner proposal was adopted.

### `-ated` past-tense vowel replay (2026-10-21)

Replacing final rule-path `/tɪd/` with `/təd/` for spellings ending `-ated`
would repair 17 and break 25 common-cohort words; the top-5000 slice changes
six to correct and eight to incorrect, and the full testable non-foreign
dictionary changes 72 to correct and 292 to incorrect. The largest apparent
wins (`heated`, `created`, `coated`) retain the productive `/ɪd/` past-tense
allomorph supported by Cambridge US, which explicitly gives `/ˈhiːtɪd/` for
[*heated*](https://dictionary.cambridge.org/us/pronunciation/english/heated).
This is not a safe suffix correction, and matching CMU's schwa in these cases
would trade away an independently attested reading. No rule or gold reading
was changed.

### Common-cohort error route split (2026-10-21)

Reclassified the current 1,625 common strict mismatches through `trace()` on
the same rules-only runtime. There are 1,276 direct-rule, 310 morphology, and
39 compound-route failures. The spelling-family learner's 5,098-word scope
therefore excludes 1,892 common cases, including 349 current errors; after
the learner produced no accepted corrections, the remaining useful search
surface is stem selection and composition on those excluded routes. The
largest morphology ending is `-ed` (95 errors); representative pairs include
`presented`, `embedded`, `expected`, `recorded`, and `heated`. Many `-ed`
differences are vowel-reduction/reference conventions rather than verified
stem bugs, so future candidates must be isolated by root reading and checked
against POS and context controls before adoption.

### `-ening` schwa deletion probe and refreshed common gates (2026-10-21)

A screen of generated dictionary entries routed through morphology found nine
`-ening` outputs where deleting the weak vowel before /nɪŋ/ would change the
result. It repairs `evening` against the pinned reference and Cambridge US
(/ˈiːv.nɪŋ/), but breaks `softening`, `clendening`, and `glendening`;
`opening` is covered by the runtime exception table and was outside this
rules-only dictionary screen. Cambridge also gives `busyness` with an intervening /i/,
unlike `business`, so neither a general `-ening` nor an `-iness` deletion is
licensed. The screen is diagnostic only; no rule, reference, or runtime map
changed. Sources: [Cambridge *evening*](https://dictionary.cambridge.org/us/pronunciation/english/evening),
[*business*](https://dictionary.cambridge.org/us/pronunciation/english/business),
and [*busyness*](https://dictionary.cambridge.org/us/pronunciation/english/busyness).

The refreshed rules-only common strict report is 5,365/6,990 (76.75%) and
2,898/3,617 (80.12%) on top-5000. Public API CMU segment accuracy remains
4,753/5,000 (95.06%) and passes its 90% gate; rules-only is 4,163/5,000
(83.26%), below its documented legacy floor and required only to avoid a
decrease. `yarn test:eval --subset common --cluster` completed. The `tsx`
CLI could not create its sandbox IPC socket, so both common-accuracy modes
were rerun successfully with `node --require tsx/cjs`. No baseline was
refreshed and this evidence does not qualify as a pronunciation-gain commit.

### Rejected broad `environ-` stem rewrite (2026-10-21)

A full snapshot was frozen at `/tmp/phonemize-environ-before-20261021/` before
screening. A rule-only IPA reanalysis of the current `/ɛnvɝən/` stem to
`/ɪnˈvaɪɹən/` would fix `environment` and `environmental` in the common set
(+2 strict, no common losses) and also align `environments`/derived forms
already correct through morphology. However, Cambridge US distinguishes the
bare verb *environ* (/enˈvaɪrən/) from *environment* and *environmental*
(/ɪnˈvaɪrən/, /ɪnˌvaɪrənˈmentəl/); *environs* also has a noun reading with
/ɪn/. A spelling-only root rewrite would erase this suffix/POS distinction,
and the only safe implementation found would be a narrowly gated lexical
family exception rather than a productive grapheme rule. No source behavior
or reference changed. Sources: [Cambridge *environ*](https://dictionary.cambridge.org/pronunciation/english/environ),
[*environmental*](https://dictionary.cambridge.org/us/pronunciation/english/environmental),
and [*environs*](https://dictionary.cambridge.org/us/dictionary/english/environs).

### Suffix-conditioned `environment-` stem allomorph (2026-10-21)

The bare `environ` verb and `environs` were kept outside the broad rewrite.
Added a spelling-conditioned surface rule for `environment-` derivatives only:
when the current output still has `/ɛnvɝən/`, emit the attested weak initial
`/ɪn/` plus PRICE `/aɪɹ/`, carrying the existing stress level onto the stem.
Cambridge US independently supports `/ɪnˈvaɪɹənmənt/` for *environment* and
`/ɪnˌvaɪɹənˈmɛntəl/` for *environmental*. The paired tests preserve bare
*environ*, noun/verb *environs*, the hyphenated *environment-friendly* control,
and already-correct *environmentally*.

Frozen `/tmp/phonemize-environ-before-20261021/snapshot.tsv` contains 1,296,341
predictions. After the rule and full dictionary rebuild, exactly nine rows
changed: three dictionary-word rules and six morphology-derived spellings;
no default-dictionary or POS snapshot rows changed. The six morphology rows
are also recorded in the full snapshot for future derived-form review. The
rebuilt exception table has 53,930 entries with 526 dependency-aware re-pins;
its five net-positive stem regressions are `caterings`, `fared`,
`instituting`, `provance`, and `provence`.

Post-rebuild common rules strict/lenient is 5,366/6,380 of 6,990, with
2,899/3,358 of 3,617 on top-5000. Full-dictionary rules strict/lenient is
62,348/83,681 of 105,066 (+1/+1 versus the frozen snapshot). Public CMU
default/rules is 4,753/4,165 of 5,000 (default unchanged, rules +2); runtime
parity remains 94,778/100,805 and 100,681 lenient. Stress-aware phonemic/exact
is 54,747/45,518 of 90,309. Context remains 87/85/53/49 across default/rules
and auto/gold POS; homographs remain 1,454/1,615. All 379 Jest suites / 6,935
tests, typecheck, Rollup and extracted npm-package CJS/ESM smokes pass; the
packed artifact correctly phonemizes O'Reilly Media and the two changed forms.

No baseline was refreshed: the main strict gain is one word, leaving the batch
47 words below the 5,413 ordinary commit threshold and 926 below release
target. No user work was staged or committed. Sources: [Cambridge
*environment*](https://dictionary.cambridge.org/us/pronunciation/english/environment)
and [*environmental*](https://dictionary.cambridge.org/us/pronunciation/english/environmental).

### Follow-up candidate screen (2026-10-21)

Replayed the current 6,990-word common set through route and postlex diagnostics,
then ran both spelling-family-folded rule learners (structural and grapheme
only). Neither learner produced a candidate passing its train-only legacy
filter; held-out strict stayed 74.97% before and after. The most repeated
proposal changes unstressed /ɪ/ to /ə/ after `c` before `i` (train +51/-24,
top-5000 +25/-16 across fold acceptances), so it was rejected. It conflicts
with authoritative US pronunciations such as Cambridge's /ˈæs.ɪd/ for
[acid](https://dictionary.cambridge.org/us/pronunciation/english/acid) and
/ˈmed.ɪ.sən/ for [medicine](https://dictionary.cambridge.org/us/pronunciation/english/medicine),
and the actual paired replay also breaks words including `appreciate`,
`associate`, and `calcium`. No rule, expectation, or baseline changed. Current
runtime checks remain CMU default 4,753/5,000, context default/auto 87/108, and
homographs 1,454/1,615; the unresolved work is the two strict common-word
targets, not a reason to relax their frozen reference contract.

The required full postlex replay (`--all --include-long`) exposed one apparent
common-word win from removing the guarded geminate `-ett` rule: `Bennett` would
match the current IPA-Dict `/ə/` reference, but removal loses 32 full-dictionary
strict cases and two lenient cases. Cambridge US gives Bennett `/ˈben.ɪt/`,
which supports the shipped `/ɪ/` output, so neither the rule nor its reference
was changed. This remains a recorded source disagreement, not a pronunciation
gain: [Cambridge Bennett](https://dictionary.cambridge.org/pronunciation/english/bennett).

### Morphology-route `-nded` replay (2026-10-21)

Replayed the apparent weak-vowel discrepancy after morphology composition, in
`applyPostStress` where the `-ed` forms actually pass. Converting `/ndɪd/` to
`/ndəd/` for every `-nded` spelling raises common strict from 5,366 to 5,372
and full-dictionary strict from 62,348 to 62,356, but lowers full-dictionary
lenient from 83,681 to 83,680. The spelling also includes controls such as
`comprehended` and `heavyhanded`; this blanket environment therefore fails the
no-regression gate. The apparent wins partly reflect IPA-Dict's weak-vowel
notation: Merriam-Webster records `ended` as `/ˈen-dəd/`, while productive
past-tense `/ɪd/` remains a standard reading. The trial was removed; no source,
reference, or baseline changed.

### Rule-derived `-ility` plural vowel inheritance (2026-10-21)

The `-ies` morphology path can pick an exception-table stem whose weak
`/ɪ/` disagrees with the ordinary rule rendering of the singular in `-ility`.
For `disabilities`, `facilities`, and `liabilities`, the rule-derived bases
end in `/ləti/`, while the plural path was returning `/lɪtiz/`. The plural now
inherits the rule stem only when its phone sequence differs from the selected
stem solely at that weak vowel. Cambridge US independently records schwa in
the corresponding singular suffixes for [disability](https://dictionary.cambridge.org/dictionary/learner-english/disability),
[facility](https://dictionary.cambridge.org/pronunciation/english/facility),
[liability](https://dictionary.cambridge.org/pronunciation/english/liability),
and [vulnerability](https://dictionary.cambridge.org/pronunciation/english/vulnerability).
The root comparison preserves the `/ɪ/` in `instabilities` and other patterns
whose ordinary rule stem does not have the weak schwa.

The frozen pre-change snapshot recorded 1,296,341 predictions. This rule
changes four valid `rule` outputs: three common strict wins
(`disabilities`, `facilities`, `liabilities`) and `vulnerabilities`, whose
IPA-Dict form uses `/ɪ/` although Cambridge US supports the rule's schwa
variant. It leaves dictionary, POS, and valid derived-form predictions alone.
Eight additional snapshot differences after `build-dict` are artificial
double-inflections such as `facilitiesed`; they arise from the regenerated
exception table and are outside the English word population.

After the required rebuild (526 dependency re-pins: 524 resolved, five
retained net-positive regressions), common rules strict/lenient is
5,369/6,380 of 6,990; top-5000 is 2,901/3,358 of 3,617. Full testable-dict
rules strict rises from 62,348 to 62,351 while lenient remains 83,681.
CMU default/rules remains 4,753/4,165 of 5,000; stress-aware phonemic/exact
is 54,747/45,520 of 90,309; context remains 87/85/53/49; homographs remain
1,454/1,615; runtime parity remains 94,778/100,805 strict and 100,681 lenient.
All 380 Jest suites / 6,944 tests, typecheck, Rollup, and extracted npm-package
CJS/ESM checks pass, including O'Reilly Media. No baseline was refreshed: the
three-word strict gain remains below the 70-word qualifying commit minimum and
the 90% release targets remain open.

### Explicit verb POS in homographic -s inflections (2026-10-21)

When a caller supplies POS `V`, the regular `-s` path previously selected a
vouched verb reading only for a finite-object frame or roots ending in /s z v/.
That missed homographic stems such as `combine`, `console`, and `produce`, even
though their V readings are independently labelled in the existing homograph
table. The branch now selects that reading for any V-labelled stem when POS is
explicit. Cambridge US distinguishes the verb/noun stress in [combine](https://dictionary.cambridge.org/us/pronunciation/english/combine),
[console](https://dictionary.cambridge.org/us/pronunciation/english/console),
and [produce](https://dictionary.cambridge.org/us/pronunciation/english/produce).

An explicit-V snapshot over 13,301 dictionary `-s` forms changed 28 outputs;
each changed stem has an existing V-labelled homograph entry. Paired tests cover
`combines`, `consoles`, and `produces` as verbs, with noun readings for `combines`
and `consoles` retained in sentence context. After `build-dict`, common and
top-5,000 strict remained 5,369/6,990 and 2,901/3,617; full-dictionary strict /
lenient remained 62,351/83,681; runtime parity remained 94,778/100,805 strict
and 100,681 lenient; CMU default/rules remained 4,753/4,165; stress-aware
phonemic/exact remained 54,747/45,520; context remained 87/85/53/49; and
homographs remained 1,454/1,615. The default context cohort does not contain
these inflected targets, so this is a paired POS/context correction and not a
gain on the isolated common-word target. All 381 Jest suites / 6,946 tests,
typecheck, `test:ipa`, and Rollup pass. No baseline was refreshed.

### `-tory` dictionary/rules route check (2026-10-21)

Checked whether plural `territories` needed another `-ies` morphology correction.
The default output is already `/ˈtɛɹəˌtɔɹiz/`, matching the Cambridge US
schwa in [territory](https://dictionary.cambridge.org/us/pronunciation/english/territory).
The singular dictionary route still returns `/ˈtɛɹɪˌtɔɹi/`, while the rules
route returns `/ˈtɛɹəˌtɔɹi/`. The proposed plural rewrite therefore added no
common strict gain: the common evaluation remains 5,369/6,990 strict and
6,380/6,990 lenient (top-5,000: 2,901/3,617 strict, 3,358/3,617 lenient).
No runtime mapping or reference change was made; a general `-tory` correction
needs paired checks for roots with different vowel and stress patterns.

The refreshed spelling-family CV learner accepted 23 fold-local candidates,
but none passed its legacy filter in any fold; held-out strict stayed 74.97%
before and after filtering. The full postlex replay covered 107,644 words and
176 rules; its tempting `-ət(s?)` removal gives one common strict win but loses
32 full-dictionary strict cases and two lenient cases, so it remains rejected.

### Rejected CMU-driven weak-vowel suffix rewrites (2026-10-21)

An output-only replay on the fixed 6,990/3,617 cohorts tested common suffix
substitutions before touching runtime rules. Replacing final `/ɪkəl/` with
`/əkəl/` for `-ical` words scored 10 wins and 27 losses (top-5,000: +6/−13);
changing `-ity` `/əti/` to `/ɪti/` scored +12/−45; and changing `-age`
`/ɪdʒ/` to `/ədʒ/` scored +18/−18 (top-5,000: +11/−9). These screens do not
support a safe broad rule. Cambridge US independently supports the existing
`/ɪ/` in [message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[dosage](https://dictionary.cambridge.org/us/pronunciation/english/dosage),
and [usage](https://dictionary.cambridge.org/us/pronunciation/english/usage),
while the pinned CMU-derived IPA-Dict labels these examples with `/ə/`. That
mismatch makes the apparent `-age` strict wins unsuitable as pronunciation
improvements. No rules, gold readings, or baselines changed.

### Rejected `re-` + `union` prefix composition (2026-10-21)

A narrower replay of the earlier `re-u` trial allowed the existing prefix
composer to recognize `re-` plus the attested root `union`. The resulting rules
reading for `reunion` was `/ˌɹiˈjunjən/`, consistent with Cambridge US
[reunion](https://dictionary.cambridge.org/pronunciation/english/reunion) and
[union](https://dictionary.cambridge.org/us/pronunciation/english/union), while
controls such as `reunite` and `Reuben` stayed unchanged. However, fixed
CMU-derived rules strict remained 5,369/6,990 and 2,901/3,617; full-dictionary
strict and lenient remained 62,351 and 83,681. The extra `/j/` differs from the
pinned `reunion` reading, so this pronunciation correction does not advance the
strict gates and was removed. Existing prefix-context tests pass.

### Common strict error-route refresh (2026-10-21)

A fresh `trace()` pass over the 6,990-word common cohort places 1,276 strict
errors on the pure-rules route, 306 on morphology, and 39 on compound dispatch.
The largest spelling-ending bins include `-age` (27), `-ion` (26), `-ent` (24),
`-ity` (21), `-tion` (20), `-son` (18), `-ate` (17), and `-ian`/`-ine` (16
each). These bins mix different stress/POS readings and source variants; they
are screening leads, not adoption classes.

A broad output-only change from final `/eɪt/` to `/ət/` on every `-ate` spelling
fails decisively: full-dictionary strict falls 62,351→61,998, common strict
falls 5,369→5,321, and top-5,000 falls 2,901→2,880. The useful-looking gains
(`climate`, `senate`, `ultimate`) do not offset verb losses such as `create`,
`estimate`, `communicate`, and `operate`. No runtime rule changed.

### `-rry` stem carry-through before `-age` (2026-10-21)

The rules path previously reset the root vowel when y-final `-rry` stems
spelled the derivative with `-riage`: `marry` was `/ˈmɛɹi/`, but `marriage`
became `/ˈmæɹɪdʒ/`. A conditional stem composition now carries the attested or
rule-rendered `-rry` root into `-riage`; it accepts an unstressed `re-` stem
such as `remarry`, while secondary-stressed `intermarry`, `miscarriage`, and
other spellings such as `triage` retain their established routes. Cambridge
records US `marriage` `/ˈmer.ɪdʒ/` and an alternate US `carriage`
`/ˈkær.ɪdʒ/`, supporting these root vowels in
[marriage](https://dictionary.cambridge.org/us/dictionary/english/marriage)
and [carriage](https://dictionary.cambridge.org/us/pronunciation/english/carriage).

After `build-dict`, the 1,296,341-row prediction snapshot changed six rows:
the intended `marriage` and `remarriage` rules outputs and four generated
`-es`/`-ing` probes under the newly recovered stems. The full rule-path strict
count rose by two to 62,353/105,066; lenient stayed at 83,681. Common strict
rose to 5,370/6,990 and top-5,000 to 2,902/3,617; both lenient counts stayed
at 6,380 and 3,358.
Runtime parity stayed 94,778/100,805 strict and 100,681 lenient. The
stress-aware phonemic/exact counts rose to 54,749/45,522. Default context
remains 87/108 (known-POS 85/108); homographs remain 1,454/1,615; public API
CMU accuracy remains 4,753/5,000, while rules mode rises to 4,166/5,000 and
continues to miss its legacy 90% floor. All 382 Jest suites / 6,948 tests,
typecheck, Rollup and `git diff --check` pass. The behavior-neutral compression
snapshot is byte-identical at 3,395 five-module code lines. The spelling-family
learner accepted 24 ordinary and 47 structural candidates across its folds;
none passed its held-out legacy filter, leaving held-out strict at 74.99%.
No baseline was refreshed; the current common strict gain is below the
ordinary +70-word commit minimum, and both 90% strict release targets remain
unmet.

### `-cialty` stem carry-through (2026-10-21)

Rules-only `specialty` was being syllabified as `spe·cialty`, yielding
`/ˈspisiəlti/`; its plural inherited `/eɪ/` from that wrong route. Cambridge's
US reading is `/ˈspeʃ.əl.ti/`, so a generic `-cial + -ty` composition now
reuses the independently generated `-cial` stem for `specialty` and
`specialties`. The surrounding `special`, `specially`, `spatial`, `racial`,
and `official` controls retain their former rules readings. The runtime change
is spelling-class logic in morphology; it adds no word mapping.

After `build-dict`, only those two rows change in the frozen rule snapshot.
Full-dictionary strict/lenient rose to 62,354/83,682; the common cohort rose
to 5,371/6,990 strict and 6,381/6,990 lenient; top-5,000 remained 2,902/3,617
strict and 3,358/3,617 lenient. Runtime parity remained 94,778/100,805 strict
and 100,681 lenient. Stress-aware phonemic/exact rose to 54,750/45,523. CMU
public API remained 4,753/5,000 in default mode; rules mode rose to 4,167/5,000
and still misses its legacy 90% floor. Context remains 87/85/53/49 and
homographs 1,454/1,615. The rebuild re-pinned 526 entries (524 fixes, five
known unrelated regressions); the final exception table has 53,926 entries.

All 383 Jest suites / 6,956 tests, typecheck, Rollup, and `git diff --check`
pass. A behavior-neutral compression reduced the five-module source count by
one line to 3,394; all 1,296,341 frozen predictions are byte-identical across
that compression. The focused class test passes 7/7 and issue #28 remains in
the full passing suite. No baseline was refreshed: strict common accuracy is
still 921 words below 90%, and top-5,000 is 354 words below 90%.

### Greek `criterion` root PRICE (2026-10-21)

The spelling-class rule previously read the initial `cri` as `/krɪ/` in
`criterion` and `criteria`; both common-cohort entries therefore missed by
one segment. The Greek `-terion/-teria` root now keeps PRICE in that initial
slot, including transparent `criterial` and `criterium` forms. It does not
apply to unrelated `cri` spellings such as `crime`, `critical`, `cricket`, or
`cried`. Cambridge US gives `/kraɪˈtɪr.i.ən/` for
[criterion](https://dictionary.cambridge.org/us/pronunciation/english/criterion)
and `/kraɪˈtɪr.i.əm/` for
[criterium](https://dictionary.cambridge.org/pronunciation/english/criterium).

The frozen full prediction dump changed two dictionary rule rows (`criterion`
and `criteria`). Dictionary rebuilding then evicted those newly rule-exact
entries, changing only their dependent generated morphology probes in
addition to those two rows; paired tests cover the canonical forms, transparent
derivatives, and neighboring `cri` words. After rebuilding, full-dictionary
strict/lenient rose to 62,356/83,682. Common strict rose to 5,373/6,990 and
top-5,000 to 2,903/3,617; both lenient slices stayed 6,381 and 3,358.
Runtime parity stayed 94,778/100,805 strict and 100,681 lenient. Stress-aware
phonemic/exact rose to 54,752/45,525. Public API default/rules scored
4,753/5,000 and 4,168/5,000; context and homographs stayed 87/85/53/49 and
1,454/1,615. The rebuild re-pinned 526 entries (524 fixes, five unrelated
known regressions) and left 53,924 exceptions.

All 384 Jest suites / 6,964 tests, typecheck, `test:ipa`, Rollup, and
`git diff --check` pass; issue #28 remains covered by the full suite. No
baseline was refreshed: the common strict target remains 919 words away and
top-5,000 remains 353 away.

A separate attempt to correct the shipped `specialty` table entry to
Cambridge's `/ɛ/` was reverted: the generated dictionary records plain `/l/`,
while the default pipeline produces dark `/ɫ/`, lowering runtime parity strict
from 94,778 to 94,777. The source override therefore remains open behind the
no-regression gate; the validated `-cialty` rules fix remains. The five-module
code count is back at the 3,395-line cap.

### `-ine` common-error screening (2026-10-21)

The current common mismatch list has sixteen words ending in `-ine`, but they
do not share one pronunciation or stress pattern: it includes `imagine`,
`routine`, `marine`, `gasoline`, `medicine`, and `vaccine`. Cambridge US gives
/ruːˈtiːn/ for [routine](https://dictionary.cambridge.org/us/pronunciation/english/routine)
and /vækˈsiːn/ for [vaccine](https://dictionary.cambridge.org/us/pronunciation/english/vaccine),
while the rules path currently returns `/ˈɹaʊtɪn/` and `/ˈvæksɪn/`.
These are independently verified rule-path misses, but the shared spelling
ending alone does not justify a general rewrite: it would conflate distinct
vowels, syllabification, and stress. No runtime change or accuracy gain is
claimed; any follow-up must identify a narrower productive morphology and
replay its full controls.

### Rejected learned and postlex candidates (2026-10-21)

Fresh family-folded spelling-rule learning over the fixed 6,990-word common
population accepted 22 local and 44 structural candidates across ten folds;
none passed the existing TRAIN-only filter in any fold. Held-out strict stayed
at 75.04% before and after. The strongest local candidate changed unstressed
`/ɪ/` to `/ə/` after `c`, but had 45 training fixes against 21 breaks and
23 top-5,000 fixes against 14 breaks. Adding syllable structure did not remove
the losses. Reports are in
`/tmp/phonemize-next-release/learn-rules-current-2/` and
`/tmp/phonemize-next-release/learn-rules-structural-current/`.

The required full-dictionary postlex removal replay covered 107,644 words and
176 rules. Its only rule removal with a positive common strict delta was the
final `-ett` `/ɪt/` adjustment: removing it fixes common `Bennett`, but the
full dictionary loses 32 strict and two lenient cases across 66 changed words.
The unrelated surname controls make that removal fail the no-regression gate.
No postlex rule was changed. The complete win/loss report is in
`/tmp/phonemize-next-release/postlex-after-current-learner/results.json`.

### `-ity` strict-error source check (2026-10-21)

The 24 common errors ending in `-ity` are not evidence for changing the
productive suffix vowel. The rules path gives `/ə/` in this unstressed slot
for `charity`, `facility`, `stability`, and `personality`; Cambridge US likewise
transcribes `/ə/` in [charity](https://dictionary.cambridge.org/us/pronunciation/english/charity),
[facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[stability](https://dictionary.cambridge.org/us/pronunciation/english/stability),
and [personality](https://dictionary.cambridge.org/pronunciation/english/personality).
The pinned CMU-derived common reference instead records `/ɪ/` for these cases.
This is a strict-reference disagreement, not a pronunciation gain; keep the
runtime suffix rule and frozen scorer unchanged. `celebrity` has a separate
initial-vowel difference (`/ɪ/` from rules vs Cambridge `/ə/`) that should be
screened independently rather than bundled into an `-ity` rewrite.

### Plural subjects across PPs and bare compound objects (2026-10-21)

The POS tagger now recovers a nearby plural subject across a bounded, unpunctuated
prepositional phrase and recognizes a bounded two-content-word bare object before
a following preposition. This resolves three train-only verb readings of `permit`
in frames such as “states with low population densities commonly permit bicycle
use on interstate freeways.” Compared with the frozen train report, default/auto
improves 739 to 742/918 with exactly three wins and no losses; default/gold and
both rules cells are unchanged. Paired noun controls and the punctuation-sensitive
“papers in Israel, Haaretz uses …” control remain covered in
`__tests__/en-finite-modified-objects.test.ts`.

After `yarn build-dict`, all fixed adoption metrics are nondecreasing: full-dict
strict/lenient remain 62,356/83,682; common strict remains 5,373/6,990
(top-5,000 2,903/3,617); parity 94,778/100,805,
CMU default 4,753/5,000 and rules-only 4,168/5,000, stress-aware phonemic/exact
54,752/45,525, context eval 87/85/53/49 across its four cells, and homographs
1,454/1,615. The default/auto context eval remains at its fixed 87/108 gate.
The isolated prediction and parity dumps are byte-identical to the frozen
pre-candidate files. All 384 Jest suites / 6,966 tests, typecheck, Rollup, and
the focused apostrophe regression suite pass; it continues to cover O'Reilly Media
and the illustrative O'Reily spelling. No baseline was refreshed: common strict
is 5,373/6,990, only 33 words above the current 5,340 baseline and below the
5,410 ordinary-commit threshold. The POS/context gain itself does not change
isolated-word accuracy. The strict 90% target remains 919 words away. A separate
behavior-neutral one-line guard compression brings the five rule modules to
3,394 code lines; its 1,296,341-row prediction dump is byte-identical
(SHA-256 `bf2e2bf1c829bff1a03b32ac5fc72395fab308890d2214de681c9e4807da4df3`).

The refreshed common-error cluster report still groups 197 failures under
word-initial `i` and 135 under word-initial `a`; these are route labels, not
shared pronunciation classes. A suffix scan found 31 `-tion` mismatches with
different vowel, stress, and segment errors. No broad spelling change is
supported by those aggregates; the next strict-accuracy pass needs narrower
morphological families with paired unchanged controls.

The same family-folded learner was rerun with long words enabled, first with
local spelling features and then with structural features. Coverage increased
to 5,120/7,097 pure-rules cases (72.14%); neither run passed a candidate in any
of ten folds. The strongest local candidate (`c` before unstressed `i`,
`/ɪ/→/ə/`) had 51 training fixes against 24 breaks and 25 top-5,000 fixes
against 16 breaks. Adding structural features still produced zero passing
candidates; the strongest positional candidate had 41/30 fixes/breaks and
20/12 top-5,000 fixes/breaks. These routes mix distinct vowel environments,
so no runtime rule was added. Reports:
`/tmp/phonemize-next-release/learner-include-long-current/cv/cv-common-report.json`
and `/tmp/phonemize-next-release/learner-structural-include-long-current/cv/cv-common-report.json`.

### Rejected `-cted` schwa rewrite (2026-10-21)

A full-6,990 screening of a proposed final `/ɪd/→/əd/` rewrite on `-cted`
found 10 strict reference matches and 2 breaks (5 wins / 0 breaks in the
top-5,000 slice). However, Cambridge US independently gives `/kəˈlek.tɪd/`
for [collected](https://dictionary.cambridge.org/pronunciation/english/collected)
and `/ɪkˈspek.tɪd/` for
[expected](https://dictionary.cambridge.org/pronunciation/english/expected),
matching the current rule output's suffix. Thus the apparent gain comes from
the pinned CMU-derived transcription difference, not an English pronunciation
error; retain `/ɪd/` and the frozen reference. The exact 13-word win/loss replay
and input hashes are in `/tmp/phonemize-next-release/cted-reference-screen-20261021.json`.

### Rejected weak `-can` schwa rewrite (2026-10-21)

A position-based `/ɪ/→/ə/` proposal for words ending in `-can` yields 5 strict
reference matches and 1 break (4 wins / 0 breaks in the top-5,000 slice).
Cambridge US instead records `/ɪ/` in [African](https://dictionary.cambridge.org/us/pronunciation/english/african),
[American](https://dictionary.cambridge.org/us/pronunciation/english/american),
[Mexican](https://dictionary.cambridge.org/pronunciation/english/mexican), and
[Republican](https://dictionary.cambridge.org/pronunciation/english/republican),
matching the current output on four of the five apparent wins. The aggregate is
again driven by CMU transcription differences and is too small and heterogeneous
to justify a general rule. Exact rows and input hashes:
`/tmp/phonemize-next-release/can-reference-screen-20261021.json`.

### Apostrophe issue and O'Reilly Media verification (2026-10-21)

The issue's real brand example is O'Reilly Media; O'Reily was only an
illustrative spelling. Cambridge's US entry gives O'Reilly /oʊˈraɪli/, and
O'Reilly Media's own naming guide confirms the brand form “O'Reilly.” The
existing lexical-apostrophe regression returns `/oʊˈɹaɪɫi/` for O'Reilly and
`/oʊˈɹaɪɫiz/` for its possessive in sentence context with straight, left-curly,
and right-curly apostrophes. It also covers O'Reily as an unattested Irish-O
surname composition and keeps `o'clock` on its contraction path. All 24 focused
tests passed on 2026-10-21; this is issue coverage, not a common-word accuracy
gain. Sources: [Cambridge O'Reilly pronunciation](https://dictionary.cambridge.org/pronunciation/english/o-reilly)
and [O'Reilly Media naming guide](https://www.oreilly.com/about/logos/).

### Rhotic `-urrent/-urrant` continuation (2026-10-21)

The rule path had emitted a second `/ɹ/` in the unstressed continuation after
`ur` in `current`, `currant`, and related `-current` forms. Cambridge US
supports `/ˈkɝː.ənt/` for [current](https://dictionary.cambridge.org/pronunciation/english/current),
`/ˈkɝː.ənt/` for [currant](https://dictionary.cambridge.org/pronunciation/english/currant),
and `/kənˈkɝː.ənt/` for [concurrent](https://dictionary.cambridge.org/pronunciation/english/concurrent).
The generalized unstressed `-ence/-ency/-ent/-ant` continuation suppresses
only the duplicate written `r`; paired controls retain `currency`, `curriculum`,
`burrito`, `surreal`, `overrun`, and `overreach`. Its direct common-rule replay
had no strict changes, one lenient regression on `current` against the old
source row, and six strict wins in the full dictionary. Separately, the
Cambridge-verified `current` entry in `src-data/en/custom.dict` corrects the
source pronunciation; that reference correction is not a rule gain. Rebuilt
common rules report 5,375/6,990 strict and 6,382 lenient, top slice 2,905/3,617
strict and 3,359 lenient. The class tests and full test suite pass. Frozen
snapshots and changed-word rows are under
`/tmp/phonemize-next-release/urrent-candidate-20261021/` and
`/tmp/phonemize-next-release/urrent-final-20261021/`.

### Weak initial `ce-` in the celebr- family (2026-10-21)

The unstressed first syllable of `celebrity` and `celebratory` was producing
/sɪ/ in the rules path. Cambridge US gives `/səˈleb.rə.t̬i/` for
[celebrity](https://dictionary.cambridge.org/us/pronunciation/english/celebrity)
and `/ˈsel.ə.brəˌtɔːr.i/` for
[celebratory](https://dictionary.cambridge.org/us/pronunciation/english/celebratory).
The correction is limited to weak initial `<ce>` in the `celebr-` root family;
stressed `celebrate`, `celebrant`, and `celibate`, plus the distinct
`celestial` frame, retain their paired outputs. The 1,296,341-row snapshot has
10 changed predictions, including seven generated morphology probes. Rebuilt
common strict remains 5,375/6,990 and top strict 2,905/3,617; lenient improves
by one in each slice (6,383 and 3,360). Full-dictionary rules strict/lenient
improves to 62,365/83,687. This is an accumulating gain, not enough for a
baseline refresh or commit. A broader `celer-` condition was rejected because
it also rewrote synthetic `celery` morphology probes; `celerity` remains an
independent open root rather than widening this class. Evidence is under
`/tmp/phonemize-next-release/celebr-frozen-20261021/` and
`/tmp/phonemize-next-release/celebr-candidate-20261021/`.
The four-line addition was folded into the existing weak-vowel guard to stay
within the retained 3,395-line five-module cap; the post-compression 1,296,341-row
snapshot is byte-identical to the rebuilt candidate. After compression, all
386 Jest suites / 6,991 tests, typecheck, Rollup, and `git diff --check` pass.
Parity stays 94,778/100,805 strict and 100,681 lenient; stress-aware phonemic
accuracy is 54,754/90,309; context remains 87/85/53/49 and homographs
1,454/1,615. Public CMU default remains 4,753/5,000 and rules-only 4,170/5,000.

### Temporal `now` MOUTH rime (2026-10-21)

The rules path treated final `<ow>` in the temporal root `now` as GOAT. Cambridge
US records `/naʊ/` for [now](https://dictionary.cambridge.org/pronunciation/english/now)
and `/ˈnaʊ.ə.deɪz/` for
[nowadays](https://dictionary.cambridge.org/us/pronunciation/english/nowadays).
The shared rule now covers the standalone root and its `nowadays` compound;
`know`, `snow`, `nowhere`, `nowaday`, and surname spellings keep their earlier
routes. The frozen snapshot changed exactly three outputs: `now`, `now's`, and
`nowadays`, with zero losses. After rebuilding, common strict rises by one to
5,376/6,990 and top-5,000 by one to 2,906/3,617; lenient, context, homograph,
stress-aware, and runtime parity counts do not fall. Rules-only public API rises
to 4,171/5,000, while default stays 4,753/5,000. All 387 Jest suites / 6,994
tests, typecheck, Rollup, and `git diff --check` pass. This remains below the
ordinary +70 strict-word commit threshold; no baseline was refreshed or commit
made. Frozen and rebuilt evidence is under
`/tmp/phonemize-next-release/now-frozen-20261021/` and
`/tmp/phonemize-next-release/now-candidate-20261021/`.

### Rejected broader `ou` and syllabic `-es` changes (2026-10-21)

The current rules correctly distinguish `ou` classes including `/aʊ/` in
`out/cloud`, `/ʌ/` in `trouble/country`, and `/u/` in `soup/group`. Several
common rule-path misses (`routine`, `rouge`, `gourmet`, `boulevard`, `cuisine`,
`Louise`) are French loans with different vowel, stress, or syllabification
patterns; they do not establish one spelling-class repair. No `ou` rule change
was adopted.

An initial suffix scan also surfaced reference mismatches in plural and
third-person `-es` forms (`references`, `releases`, `searches`, `resources`,
`colleges`, and others): the runtime applies its existing `/əz/` allomorph,
while the pinned CMU-derived rows frequently encode `/ɪz/`. The current
phonotactics rule is backed by the full dictionary's 359:107 preference for
`/əz/` over `/ɪz/`; singular dictionary entries also do not attest the full
plural realization. The scan is therefore insufficient evidence to change
this class, and no pronunciation rule or reference table was altered.

### `-age` CMU mismatch screen (2026-10-21)

The high-ranked common errors `message`, `image`, `package`, and `storage`
looked like possible `/ɪdʒ/` to `/ədʒ/` gains against CMU, but Cambridge US
independently records `/ɪdʒ/` for
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[image](https://dictionary.cambridge.org/us/pronunciation/english/image),
[package](https://dictionary.cambridge.org/pronunciation/english/package), and
[storage](https://dictionary.cambridge.org/us/pronunciation/english/storage).
Those are reference differences, not a pronunciation class to rewrite. No
suffix rule or expected IPA was changed.

### Particle-before-object POS frame (2026-10-21)

The automatic tagger missed the verb in “Firecats invite back coaches …” because
its direct object follows the verb particle. The bounded finite-object frame now
skips a recognized verb particle before checking for an object. Cambridge gives
the US verb `invite` /ɪnˈvaɪt/ and noun /ˈɪn.vaɪt/, matching the checked
reading-specific reference. The paired sentence “The invite came by email”
retains the noun reading; existing noun, adjective, and finite-verb controls
remain unchanged.

After rebuilding, default/automatic context strict improves 87→88/108, with the
`invite_vrb` reading 7→8/9. The other three context cells, every other reading,
class and fixed subset are unchanged. Homograph evaluation improves 1454→1455/1615.
Common rules remain 5376/6990 strict and 6383 lenient; the top-5000 slice remains
2906/3617 strict and 3360 lenient. Public default remains 4753/5000; rules-only
is 4171/5000. Full-dictionary counts remain 62367 strict / 83687 lenient,
runtime parity 94778/100805 strict / 100681 lenient, and stress-aware phonemic
accuracy 54755/90309. All 1,296,341 snapshot rows match the prior post-`now`
snapshot both before and after rebuilding. All 387 test suites / 6,996 tests,
typecheck, direct Rollup, and `git diff --check` pass. The regular `yarn build`
wrapper could not start its `tsx` prebuild under the sandbox (`listen EPERM`);
the pinned dictionary build and Rollup bundle were run directly and passed.

Evidence: `/tmp/phonemize-next-release/particle-object-frame-20261021/`.
Source: [Cambridge US pronunciation of invite](https://dictionary.cambridge.org/us/pronunciation/english/invite).
This POS-only gain accumulates toward release acceptance; isolated-word gains
remain below the ordinary +70 strict-word commit threshold, so baselines were
not refreshed.

### Rejected negative-adjective head lookahead (2026-10-21)

The source-checked `invalid` adjective in “an invalid nomen nudum” suggested
using any following nominal head to select an attributive adjective. The broad
condition also changed the established “The invalid employer spoke” noun
control. Since the two readings cannot be distinguished by this local frame
alone, the candidate and its test were removed rather than adding a word map or
changing the existing control. Cambridge records separate
[adjective and noun pronunciations](https://dictionary.cambridge.org/us/pronunciation/english/invalid).

### Lower-support learner and `parent`-rime screen (2026-10-21)

The family-folded structural learner was rerun on the fixed 7,097-word common
population with minimum support lowered from five to three. Its pure-rules
coverage is 5,120/7,097 (72.14%). Across ten spelling-family folds it accepted
286 proposals, but none passed the existing training filter; applying all
accepted proposals lowers held-out strict from 3,832 to 3,783/5,120 and lenient
from 4,582 to 4,555. Lower support therefore did not uncover a safe general
letter rule. Report: `/tmp/phonemize-next-release/learner-minsupport3-20261021/`.

The leading narrow `/æ/→/ɛ/` proposal conflated `parent`, `comparative`, and
`para`, while also breaking `Paris`. A family-folded replay of the more specific
stressed `<pa>` before `<rent>` frame changed only `parent` and its possessive;
it yields one strict win in each common population and two full-dictionary wins.
Cambridge US confirms the /ɛr/ vowel in
[parent](https://dictionary.cambridge.org/us/pronunciation/english/parent),
but this evidence supports only a narrow root exception, so it was not added
under the no-per-word-map rule. A route-tagged common-error scan partitions all
1,614 strict common misses into 1,270 direct-rule, 305 morphology, and 39
compound-path cases. Within morphology-path misses, the largest short endings
are `-ed` (95), `-es` (34), `-al` (28), and `-ing` (25); these counts
are route diagnostics, not adoptable classes, and mix distinct phoneme/stress
errors with source-vs-reference variants. Next strict-accuracy work should
diagnose those morphology families against paired controls rather than lower
the scorer or widen local spelling substitutions.

### Morphology and initial-`i` mismatch audit (2026-10-21)

A direct replay of the 305 common morphology-path strict misses confirms that
their shared suffix counts do not identify a shared phonological error:
`-ed` mixes stem-vowel differences with reference `/əd/` vs `/ɪd/` conventions,
while `-es`, `-al`, and `-ing` each combine unrelated lexical, stress, and
vowel errors. No generalized suffix edit was supported by this scan.

The largest direct-rule cluster remains the initial `<i>` route (197 cases in
the fresh common report), with examples such as `Missouri`, `Michael`,
`Niagara`, and `Antigua`. This is a mixed lexical population, not evidence for
a general initial-`<i>` change; such a change would damage ordinary controls.
Keep both groups as diagnosis populations, not candidate mappings. The full
regression suite and `yarn typecheck` pass on this accumulated worktree; this
audit produced no runtime change or new accuracy claim.

### Three-way learner lower-support replay (2026-10-21)

A separate `--structural --triples --min-support 3` family-folded run accepted
300 fold-local proposals across 10 folds; none passed the existing TRAIN-only
adoption filter. Applying all accepted rules reduced held-out strict from
3,832/5,120 (74.84%) to 3,792/5,120 (74.06%), while filtered-only replay was
unchanged. The leading apparent gains again include reference-vowel
disagreements such as `article` and `notice`; no runtime or reference change
was made. Full report:
`/tmp/phonemize-next-release/learner-triples-20261021/cv-common-report.json`.

### High-frequency `one` spelling family screen (2026-10-21)

The current rule path misses three frequent forms for distinct reasons:
`one` predicts `/oʊn/` vs Cambridge US `/wʌn/`, `once` predicts `/ɑns/` vs
`/wʌns/`, and `only` predicts `/ɑnli/` vs `/oʊnli/`. The shared `<on>` or
`<one>` spelling does not support one vowel/onset rule: `only` has a different
vowel from the numeral, while `stone`, `phone`, `gone`, and the valid
`someone`/`anyone`/`everyone` morphology are controls for broad `<one>` edits.
Cambridge confirms the distinct readings for [one](https://dictionary.cambridge.org/pronunciation/english/one),
[once](https://dictionary.cambridge.org/pronunciation/english/once), and
[only](https://dictionary.cambridge.org/pronunciation/english/only).
These are not adopted as separate spelling exceptions; no paired class fix
was established.

### Compound-route common miss replay (2026-10-21)

A fresh replay of the fixed common cohort finds 39 strict misses on the
compound route. They include a repeated `-land` geography pattern, already
rejected because its spellings cannot separate geographic weak `/lənd/` from
stressed or lexicalized `/lænd/`; the remaining forms (`bargain`, `breakfast`,
`necklace`, `surface`, `automotive`, `webpage`, and others) mix name/brand,
lexicalized compound, dialect-vowel, and syllabification errors. Removing
compound dispatch globally is not a viable fix: the frozen route ablation
reduces common strict by 763 words. This screen found no shared candidate to
replay beyond the previously rejected `-land` class; no runtime behavior
changed.

The related initial-letter-name `<e>` hypothesis was also screened: changing
initial `/ɛ, ɪ/` to `/i/` when the remaining spelling is itself attested in the
dictionary produces three reference wins (`ebay`, `email`, `event`) but breaks
12 common forms, including `ebony`, `echo`, `every`, `escape`, and `estate`
(top-5,000: +3/-9). Cambridge confirms `/iː/` for [email](https://dictionary.cambridge.org/pronunciation/english/email),
but `/ɪ/` for [event](https://dictionary.cambridge.org/us/pronunciation/english/event),
so at least one of the three apparent wins is a reference disagreement. The
component-attestation condition does not identify electronic `e-` compounds
and was rejected without changing runtime behavior.

### `-pital` weak-vowel replay (2026-10-21)

The morphology-path `/ə/` in `hospital` suggested retaining `/ɪ/` across the
`-pital` spelling. On the fixed common cohort this changes only `hospital`
and `capital`: it fixes the former against the pinned reference and breaks the
latter, for zero strict gain (top-5,000: +1/-1). The spelling family does not
justify changing the current composition rule or its reference; no runtime
change was made.

### Rejected single-`l` `all-` compound expansion (2026-10-21)

The common rules miss *almost* as `/æɫ/` where its lexical compound reading is
`/ɔɫ/`. A replay expanded initial `<al>` to `<all>` and asked the existing
compound splitter to handle the tail. It changed 32 full-dictionary
predictions: strict fell 62,367→62,362 (−5), while lenient rose by four.
The fixed common slice fell 5,376→5,375 strict, and top-5000 stayed 2,906/3,617.
It repairs *almost* but misparses unrelated `al-` words including *alarm* and
*alpine* as `all-` compounds. The spelling contraction is not a general enough
signal for compound dispatch, so the candidate was rejected without changing
runtime rules, references, or baselines. Current independent release gates
remain public CMU default 4,753/5,000, context default/auto 88/108, and
homographs 1,455/1,615.

### `language` dictionary velar-stop correction (2026-10-21)

The existing `custom.dict` override for *language* omitted /ɡ/, making the
default runtime output /ˈlæŋwɪdʒ/ even though Cambridge US records
/ˈlæŋ.ɡwɪdʒ/. The rules route already supplies /ɡ/; this corrects the shipped
lexical reading and its source reference rather than introducing a new rule.
The override now includes ARPAbet `G`. [Cambridge US pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/language)
also explicitly lists /ŋ/, /ɡ/, and /w/ in sequence.

After the complete data pipeline and dependency-aware re-pin, the full
before/after prediction dump changed 21 rows: *language*, *languages*, and
their derived forms, plus synthetic probe forms under *celebratory* and *now*.
The latter are generated probe forms rather than members of the scored common
cohort. Fixed common rules strict stayed 5,376/6,990 and top-5,000 stayed
2,906/3,617; lenient rose by one in each slice (6,384/6,990 and 3,361/3,617).
Default public CMU accuracy rose 4,753→4,754/5,000. Runtime parity remained
94,778/100,805; context remained 88/108 and homographs 1,455/1,615. The
stress-aware headline rose by one, while exact IPA stayed 45,529; treat that as
a lexical-source/re-pin effect, not a new spelling-rule gain. No baselines were
refreshed. The focused paired test, typecheck, and all 388 suites / 6,999 tests
pass. Evidence: `/tmp/phonemize-next-release/language-velar-20261021/`.

### Apostrophe clarification and fresh distance-objective replay (2026-10-21)

The user clarified that `O'Reilly Media` is the brand example; `O'Reily` was
only an illustrative similar spelling. Existing issue #28 coverage already
tests O'Reilly Media in sentences, as a possessive, and with straight and curly
apostrophes. The focused apostrophe and paired `language` regressions pass
(27 tests). No brand-specific runtime mapping is needed.

A fresh family-folded `--structural --objective distance` learner run on the
current 5,096-word direct pure-rules scope accepted 15 fold-local candidates;
none passed the TRAIN-only adoption filter. Replaying all candidates reduced
held-out strict from 3,826/5,096 to 3,822/5,096 and raised phone distance errors
from 2,162 to 2,169. Filtered candidates leave held-out unchanged. This is
diagnostic evidence only; no rule, reference, or baseline changed. Full report:
`/tmp/phonemize-next-release/learner-distance-current-after-language/cv-common-report.json`.

The fresh `node --require tsx/cjs scripts/evaluate.ts --subset common --cluster`
run reproduces 5,376/6,990 strict and 2,906/3,617 top-5,000 strict. Its leading
clusters remain heterogeneous initial-vowel routes: 197 initial `<i>` cases
(including *Missouri*, *Michael*, *Niagara* and *Antigua*), 135 initial `<a>`
cases, and 73 initial `<e>` cases. They mix names, acronyms, and ordinary
words, so cluster size alone does not support changing a general vowel rule.
The fresh full-dictionary postlex ablation also finds no safe common class:
removing the narrow `-ett` schwa adjustment gains the single common word
*Bennett* against the pinned primary CMU reading but loses 32 strict words
overall, while *Bennett* itself has a second CMU pronunciation variant. This
does not establish a spelling-class correction; no source or runtime edit was
made from the diagnostic.

### Current release-gate recheck and lower-support screen (2026-10-21)

The fixed common evaluation remains 5,376/6,990 strict and 2,906/3,617
top-5,000 strict. Independent gates currently pass their requested floors:
public default CMU 4,754/5,000, default context 88/108, and homographs
1,455/1,615. Public CMU rules mode is 4,171/5,000, unchanged from the last
recorded run and still below its legacy 90% floor. The rules/auto context cell
is 53/108; the user-requested context floor is the default/auto cell.

An exploratory family-fold run with structural features and minimum support 2
was stopped after the first three folds because all 30 selected rules in each
fold failed the TRAIN-only legacy adoption filter. This partial run is not a
cross-validation result and supplied no candidate for replay or adoption.

A targeted replay of the `-erages` spelling also found no general fix: the
fixed common cohort contains *beverages*, while *averages* is a contrasting
verb/noun form with different stress. Reconstructing both from the singular
would either leave *beverages* wrong or break *averages*; no word exception or
runtime change was made.

### Rule-path `-idential` replay (2026-10-21)

Added a class rule for `<ident> + ial`: it predicts the `-ident` base through
the spelling rules, retains that base's vowel pattern, and shifts its primary
stress to `-ential`. Cambridge US supports `/ɪ/` in *presidential* and
`/ə/` in *confidential*; its Academic Content pronunciation also supports
the `/ɪ/` variant of *residential*. The rule-path result for *presidential*
therefore keeps `/ɪ/`; it is not counted as a gain against the pinned
ipa-dict gold, which uses `/ə/` there. See [Cambridge presidential](https://dictionary.cambridge.org/pronunciation/english/presidential),
[confidential](https://dictionary.cambridge.org/pronunciation/english/confidential),
and [residential](https://dictionary.cambridge.org/pronunciation/english/residential).

Against the frozen rule snapshot, *confidential* and *residential* are strict
wins and no scored dictionary word regresses. Full-dictionary rule accuracy is
62,369/105,066 strict and 83,689/105,066 lenient, from 62,367 and 83,688.
The fixed common cohort moves from 5,376/6,990 to 5,378/6,990 strict and from
6,384 to 6,385 lenient; top-5,000 strict moves from 2,906/3,617 to 2,907/3,617.
Public CMU rules mode is 4,172/5,000 (one above the frozen 4,171, still below
its known legacy 90% floor); default CMU remains 4,754/5,000. Runtime parity,
context IPA (88/108 default/auto), and homographs (1,455/1,615) are unchanged.

The complete snapshot changes only seven rule-path forms: strict wins
*confidential* and *residential*; *presidential* and *presidential's* remain
IPA-dict mismatches but take the Cambridge-aligned `/ɪ/`; plus
*non-residential*, *nonresidential*, and *vice-presidential*. The
post-compression snapshot is byte-identical to its pre-compression candidate.
`yarn build-dict` regenerated the same data files; the dictionary hash remains
`e04de89a06c5a2164f6a3715e5953a54c64c71d329b1bd2f41e7a5596301c813`. All 389
Jest suites (7,007 tests), typecheck, and Rollup build pass. The five rule
modules are at the retained 3,395-line cap after a behavior-neutral
compression. This is a small accumulated gain, below the 70-word commit
threshold; no baseline was reset.

A follow-up common-failure screen found the same source-variant problem in
`-ical`: current rule readings of *chemical* and *radical* use `/ɪ/`, which
Cambridge records, while the pinned ipa-dict gold uses `/ə/`. No rule or gold
change was made because this is not a verified pronunciation gain. See
[Cambridge chemical](https://dictionary.cambridge.org/pronunciation/english/chemical)
and [radical](https://dictionary.cambridge.org/us/pronunciation/english/radical).

### Final `-ate` replay (2026-10-21)

A fresh common-failure scan surfaced a plausible short-vowel adjustment for
some unstressed final `<a>` in `-ate` words: the rules path returns
`/ˈklaɪmeɪt/` and `/ˈsɛneɪt/` for *climate* and *senate*, while Cambridge US
records `/ˈklaɪmət/` and `/ˈsenət/`. But replacing final `/eɪt/` with `/ət/`
for all `-ate` words changes 684 testable dictionary predictions: strict
`+32/-385` overall, `+4/-52` in common, and `+4/-25` in top-5,000. Restricting
it to 3+ syllables without secondary stress still changes 104 words and
regresses strict `51` overall, `9` common, and `4` top-5,000. Control losses
include *donate*, *locate*, *translate*, and *template*. Cambridge also gives
separate adjective/noun and verb pronunciations for *intimate*, showing that
POS matters within this spelling class. The candidate was rejected; no
runtime rule or reference changed. See [Cambridge climate](https://dictionary.cambridge.org/us/pronunciation/english/climate),
[senate](https://dictionary.cambridge.org/us/pronunciation/english/senate),
and [intimate](https://dictionary.cambridge.org/pronunciation/english/intimate).

### Common-error IPA-Dict/CMU consensus check (2026-10-21)

Cross-checked all 1,614 current strict errors in the fixed 6,990-word common
cohort against every pinned CMUdict variant, after removing stress/length,
normalizing /ɫ/ to /l/, and treating /ʌ/ and /ə/ as equivalent for this
diagnostic. IPA-Dict and CMUdict support the same gold reading in 1,612 cases.
In one case, *around*, CMUdict supports the current rules reading /ɝˈaʊnd/
while IPA-Dict gives /əˈɹaʊnd/; Cambridge US independently supports the latter.
The other outlier is *Chicago*, where neither CMUdict's /ʃəkɑɡoʊ/ nor the rules
output matches IPA-Dict's /ʃɪˈkɑˌɡoʊ/. This check found broad reference
agreement but no justified general rule by itself.

The *around* mismatch prompted a check of all dictionary `arou-` forms. The
rules and IPA-Dict agree on rhotic /ɝ/ for *arouse*, *arousal*, *aroused*, and
*arousing*, while Cambridge gives /əˈraʊz/ for *arouse* and /ə/ plus /r/ for
*around*. This is not evidence for changing the whole `arou-` spelling class;
no runtime or reference change was made. See [Cambridge around](https://dictionary.cambridge.org/us/pronunciation/english/around)
and [arouse](https://dictionary.cambridge.org/pronunciation/english/arouse).

### Fresh route and structural-candidate replay (2026-10-21)

The current frozen common result is 5,378/6,990 strict and 2,907/3,617 on the
top-5,000 slice. Fresh `diagnose:routes` confirms morphology is essential to
the current result: disabling morphology falls to 4,727/6,990; bypassing both
morphology and compound splitting falls to 4,613/6,990. The largest individual
morphology ablations are net losses, so they do not identify a removable
general rule.

The 10-fold, family-grouped `learn:rules --structural` replay accepted 50
fold-local candidates representing 15 distinct readings; none passed the
TRAIN-only adoption filter. Mean held-out strict stayed 75.12% before and
after filter-passed candidates. Its most recurrent proposal changes
unstressed `/ɪ/` to `/ə/` after `<c>`; although it repairs examples such as
*acid* and *explicit* against IPA-Dict, Cambridge US gives `/ˈæsɪd/` for
*acid* and `/ɪ/` in *explicit*. The proposal also breaks paired forms and
top-5,000 words, so it is not an evidence-backed pronunciation improvement.
No source rule or baseline changed. [Cambridge acid](https://dictionary.cambridge.org/pronunciation/english/acid)
and [explicit](https://dictionary.cambridge.org/pronunciation/english/explicit).

The current independent gates were rerun on this checkout: public default CMU
is 4,754/5,000, context default/auto is 88/108, and homograph eval is
1,455/1,615. Public CMU rules mode is 4,172/5,000, one above its last recorded
run but below the legacy 90% floor. No baselines were refreshed because no
pronunciation class passed adoption.

### Compound-route win/loss follow-up (2026-10-21)

The route dump's nine common wins from bypassing compound splitting do not
form a single class. Cambridge confirms rule-path wins for *acrobat*
(`/ˈæk.rə.bæt/`), *automotive* (`/ˌɑː.t̬əˈmoʊ.t̬ɪv/`), and *necklace*
(`/ˈnek.ləs/`), but their spellings and morphology do not supply one general
dispatch condition. The four `-land` wins (*Highland*, *Iceland*, *Oakland*,
*Portland*) also resist a blanket vowel reduction: replaying `/lænd/` → `/lənd/`
on every matching rule-path item changes 106 full-dictionary words (+52/-47),
9 common words (+4/-4), and 4 top-5,000 words (+1/-2); *homeland*, *mainland*,
and *Thailand* are paired full-vowel controls. No rule was adopted. See
[Cambridge acrobat](https://dictionary.cambridge.org/us/pronunciation/english/acrobat),
[automotive](https://dictionary.cambridge.org/us/pronunciation/english/automotive),
and [necklace](https://dictionary.cambridge.org/us/pronunciation/english/necklace).

A broad structural replay bypassed compound splitting for every form ending
in the letters `-ace` (including words whose actual split tail is `-place`).
It changed 35 full-dictionary predictions (+2/-23), 7 common predictions
(+2/-5), and 3 top-5,000 predictions (+1/-2): it repaired *surface* and
*necklace* but broke real compounds such as *aerospace*, *fireplace*,
*marketplace*, *myspace*, and *workplace*. This broad suffix guard is not safe;
the two repairs need a narrower structural signal. No component table or
runtime split rule changed.

A narrower full replay bypassing compound splitting for `-face` and
`-lace` except `-place` changes eight full-dictionary predictions: two gains
(*surface*, *necklace*) and six losses. Common strict rises by two (no losses)
and top-5,000 rises by one (no losses), but full-dictionary strict regresses,
so it fails the required gate. Separating the suffixes does not reveal a
general class: `-face` is +1/-3 (*surface* vs *boldface*, *scarface*,
*typeface*), while `-lace` excluding `-place` is +1/-3 (*necklace* vs
*Lovelace*, *shoelace*, *shoelaces*). The spelling alone cannot distinguish
the lexicalized outcomes from productive compounds; no route change was made.

### High-frequency `-ed` and `-age` source-variant replay (2026-10-21)

The fixed common mismatch set contains 96 rule errors ending in `-ed` and 27
ending in `-age`. The pinned CMUdict has an IPA-Dict-matching variant for 90
of those `-ed` cases and 25 of those `-age` cases; many also list the current
rules reading. This is a transcription/variant concentration, not grounds for
replacing the rule vowel wholesale. For example, Cambridge US gives /ɪ/ in
*collected*, *damage*, *message*, and *package*, matching the current rule
outputs rather than the IPA-Dict schwa spellings.

An explicit end-of-word replay changing `/ɪd/` to `/əd/` for every rules-path
`-ed` form changes 1,042 full-dictionary predictions (+245/-621), 144 common
words (+60/-66), and 64 top-5,000 words (+28/-28). The corresponding
`-age` `/ɪdʒ/` to `/ədʒ/` replay changes 226 full-dictionary predictions
(+45/-104), 45 common words (+18/-19), and 27 top-5,000 words (+11/-10).
Both fail the no-regression gate; no source rule or reference changed. See
[Cambridge collected](https://dictionary.cambridge.org/pronunciation/english/collected),
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
[message](https://dictionary.cambridge.org/us/pronunciation/english/message),
and [package](https://dictionary.cambridge.org/us/pronunciation/english/package).

The same cluster was replayed against the exact fixed populations rather than
inferred from suffix frequency alone. Converting final `/ɪd/` to `/əd/` only
on spellings ending `-ed` is net `-6` common strict (`+60/-66`) and neutral
on top-5,000 (`+28/-28`); converting `/ɪdʒ/` to `/ədʒ/` only on `-age` is net
`-1` common (`+18/-19`) and net `+1` top-5,000 (`+11/-10`), while losing
59 strict words over the full testable dictionary. Neither meets the shared
no-regression contract, so the existing `-ed` and `-age` outputs remain.

### Low-support structural learner replay (2026-10-21)

Completed the full family-grouped 10-fold `learn:rules --structural
--min-support 2 --max-rules 30` run on the frozen 6,990-word common
population. Each fold selected 30 rules from roughly 6.7k-7.3k candidates;
across folds, 300 fold-local candidates represented 69 distinct readings.
Zero of the 300 passed the learner's TRAIN-only legacy adoption filter in
their fold. Mean held-out strict remained 75.12% before and after the
filter-passed candidates (zero). Lowering candidate support therefore did
not reveal an adoptable class; no rule, runtime data, or baseline changed.
The complete diagnostic report is `/tmp/phonemize-rule-corrections/cv-common-report.json`.

The leading recurrent proposal was a structural `t` candidate for unstressed
`/ɪ/` → `/ə/` in an `i` left-letter context (accepted in 5/10 folds, passed
adoption in 0/10, aggregate train wins/losses +63/-45). It repairs examples
such as *citizen*, *credit* and *digit*, but breaks *audit*, *British* and
*exhibit*. A three-syllable `m` candidate for `/eɪ/` → `/ə/` was accepted in
8/10 folds and passed in 0/10 (+24/-7). Even a low-support `tr` candidate
accepted in all 10 folds (+27/-0) failed the filter because its affected
population was too small. These are search leads only, not source-verified
pronunciation classes; applying them would violate the existing evidence and
paired-regression gates.

### Highest-frequency mismatch source audit (2026-10-21)

Sorted the 1,614 strict common errors by the pinned frequency-list order. The
first entries include *from* (#21), *have* (#26), *one* (#45), *here* (#70),
*business* (#71), and *said* (#186). Source checks separate real engine errors
from scoring/variant disagreements: Cambridge US lists strong `/frʌm/` and
weak `/frəm/` for *from*, and `/hɪr/` for *here*, matching the engine's
`/frɑm/` after STRUT normalization and `/hɪɹ/` respectively. It lists `/hæv/`
for *have* and `/sɛd/` for *said*, confirming those predictions are wrong.
Cambridge syllabifies *business* as `/ˈbɪz.nɪs/`, unlike IPA-Dict's
`/ˈbɪznəs/`; this is not a justified syllable-reduction rule. See [from](https://dictionary.cambridge.org/us/pronunciation/english/from),
[have](https://dictionary.cambridge.org/us/pronunciation/english/have),
[said](https://dictionary.cambridge.org/pronunciation/english/said),
[here](https://dictionary.cambridge.org/pronunciation/english/here), and
[business](https://dictionary.cambridge.org/pronunciation/english/business),
and [one](https://dictionary.cambridge.org/pronunciation/english/one).

In this sample, *have*, *said*, and *one* are confirmed engine errors, but
their pronunciations are irregular spelling/morphology cases: *have* within
final `-ave`, *said* as the irregular past of *say*, and *one* itself. A
general transformation for either spelling family risks changing productive
words such as *save/gave* or *paid/laid*; no broad rule was replayed or adopted
from these examples. No whole-word mapping or reference change was introduced.
The gap remains 914 common and 349 top-slice strict words; frequency ranking
guides future investigation, but does not relax the 90% release gate.

### High-frequency `-ity` reference-variant probe (2026-10-21)

The frozen mismatch report has 24 strict errors ending in `-ity`. A source
probe of three common members—*facility*, *celebrity*, and *humanity*—finds
Cambridge US `/fəˈsɪl.ə.t̬i/`, `/səˈleb.rə.t̬i/`, and `/hjuːˈmæn.ə.t̬i/`,
which support the engine's reduced `/ə/` nuclei and conflict with the pinned
IPA-Dict `/ɪ/` readings in those positions. This is not evidence to broaden
the `-ity` rule or change the fixed gold set: the current evaluator remains
the release contract, while source/reference corrections must be independently
versioned and never counted as pronunciation gains. [Cambridge facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[celebrity](https://dictionary.cambridge.org/us/pronunciation/english/celebrity),
and [humanity](https://dictionary.cambridge.org/us/pronunciation/english/humanity).

### Unstressed-`/æ/` reduction replay (2026-10-21)

Tested a broad rules-output rewrite of unmarked `/æ/` to `/ə/` both across
all syllables and only at the first vowel, using the fixed dictionary golds.
Across all unstressed positions it changes 1,645 full-dictionary words
(+119/-578), 86 common words (+5/-51), and 36 top-5,000 words (+3/-26).
Restricting it to the first vowel still changes 1,070 full-dictionary words
(+67/-429), 55 common words (+2/-42), and 26 top-5,000 words (+2/-22).
The broad weak-vowel hypothesis therefore fails every relevant no-regression
check; initial `a` mixes reduced prefixes with ordinary `/æ/` roots. No source
rule was changed. The replay is diagnostic and does not establish a supported
phonological class.

### `-nded` replay and refreshed failure-cluster scan (2026-10-21)

Replayed the `/ndɪd/` → `/ndəd/` hypothesis on the current rules-only path.
Full-dictionary strict rises 62,369→62,377 (+18/-10 changed correct words),
but lenient falls 83,689→83,688. The common subset rises 5,378→5,384 strict
(+6/-0), and top-5,000 rises 2,907→2,911 (+4/-0); the full-dictionary
lenient regression still fails the required gate. *Wounded* is one of the
strict losses, and Cambridge US explicitly gives it `/ˈwuːn.dɪd/`; Cambridge
also gives the productive `-handed` ending `/hæn.dɪd/`. Merriam-Webster records
a weak-vowel reading for *ended*. This is real word-specific variation, not a
general `-nded` spelling rule, so the candidate was rejected and no
expectations or runtime rules changed. See [Cambridge
wounded](https://dictionary.cambridge.org/pronunciation/english/wounded) and
[Cambridge -handed](https://dictionary.cambridge.org/us/pronunciation/english/handed),
and [Merriam-Webster end](https://www.merriam-webster.com/dictionary/end).

The fresh `test:eval --subset common --cluster` result remains 5,378/6,990
strict and 2,907/3,617 top-5,000 strict (76.94% and 80.37%). The leading direct
rule-trace clusters are initial `<i>` → `/ɪ/` (196 cases), `<a>` → `/æ/` (135),
and initial `<e>` → `/ɪ/` (73), but their examples are heavily mixed with
initialisms, foreign names, and lexicalized forms. The cluster report is a
diagnostic grouping by first differing phone, not evidence for a shared
pronunciation class. No new class passed source review in this scan; the common
strict gap to the fixed 6,292-word target remains 914 words and the
top-5,000 gap remains 349.

### `-cted` weak-vowel candidate replay (2026-10-21)

The refreshed common mismatch suffix scan found 62 errors in `-ted`, including
11 in `-cted`. Rewriting only final `/tɪd/` to `/təd/` for spellings ending
`-cted` changes 54 full-dictionary predictions: strict improves by two (24
wins, 22 losses), and lenient is flat at 83,689. Common strict improves by
eight (10 wins, two losses), and top-5,000 by five (five wins, no losses).
Despite passing the aggregate score floors, this is not a verified pronunciation
gain: Cambridge US lists `/kəˈlek.tɪd/` for *collected* and `/prəˈdʒek.tɪd/`
for *projected*, matching the current `/ɪd/` reading. The candidate therefore
overfits IPA-Dict's weak-vowel transcription in at least these standard US
readings; no postlex rule, expectation or baseline changed. Sources: [Cambridge
collected](https://dictionary.cambridge.org/pronunciation/english/collected)
and [projected](https://dictionary.cambridge.org/us/pronunciation/english/projected).

The independent release checks were also refreshed on this worktree: default
public CMU accuracy is 4,754/5,000 (95.08%), default/auto context is 88/108,
and homograph eval is 1,455/1,615. These pass their current thresholds; the
unmet requirement remains the rules-only 90% common-word target.

### Unstressed `pro-` morphology replay (2026-10-21)

The frequency-ranked error list suggests that some `pro-` forms have an
inconsistent first vowel across direct-rule and morphology routes. Replacing
initial `/pɝ/` with `/prə/` only on morphology-path words spelled with `pro-`
changes four full-dictionary items: one strict win (*proceeds*) and three
losses (*productions'*, *productively*, *promotional*), for net strict and
lenient `-2`. In the common slice it changes two items with one win and one
loss, net zero; top-5,000 is unchanged. The route-wide correction therefore
fails the all-dictionary no-regression gate. Source checks also confirm that
the direct-rule `/prə/` in *production* and *promotion* is the standard US
reading, despite IPA-Dict's `/pɝ/` variants. This looks primarily like a
reference-variant cluster, not a missing `pro-` spelling rule; no rule or gold
reading changed. Sources: [Cambridge production](https://dictionary.cambridge.org/pronunciation/english/production)
and [promotion](https://dictionary.cambridge.org/pronunciation/english/promotion).

The same top-frequency scan confirms standard US `/boʊθ/` and `/ʃæl/` for
*both* and *shall*, where current rules return `/bɑθ/` and `/ʃɔɫ/`. Each has
spelling-family controls with different vowels: Cambridge US gives `/ɑ/` in
*cloth*, *moth*, and *broth*, but `/oʊ/` in *both*. It also gives `/æ/` in
*shall* and *shalt*, while the general `<all>` rule produces `/ɔl/`. These
splits identify lexical gaps, not a safe broad grapheme rule. See [Cambridge
both](https://dictionary.cambridge.org/pronunciation/english/both),
[shall](https://dictionary.cambridge.org/us/pronunciation/english/shall),
[shalt](https://dictionary.cambridge.org/pronunciation/english/shalt),
[cloth](https://dictionary.cambridge.org/pronunciation/english/cloth),
[moth](https://dictionary.cambridge.org/us/dictionary/english/moth), and
[broth](https://dictionary.cambridge.org/pronunciation/english/broth).

### High-frequency irregular-family route audit (2026-10-21)

Rechecked the most frequent strict errors against the actual `disableDict`
route and their productive controls. `have` is wrong as a standalone rule
form (`/heɪv/` vs gold `/hæv/`), while `has`, `had`, and `having` already have
the expected vowels. `say` and `saying` are right, but the irregular
inflections `says` and `said` are wrong. `one`, `once`, and `only` are wrong;
`ones`, `oneself`, and the `anyone`/`someone`/`everyone` compounds already
recover the `/wʌn/` morpheme through morphology. Cambridge independently
confirms `/hæv/`, `/sɛd/`, `/sɛz/`, `/wʌn/`, and `/wʌns/` for *have*, *said*,
*says*, *one*, and *once* respectively. Sources: [have](https://dictionary.cambridge.org/pronunciation/english/have),
[said](https://dictionary.cambridge.org/pronunciation/english/said),
[says](https://dictionary.cambridge.org/pronunciation/english/says),
[one](https://dictionary.cambridge.org/pronunciation/english/one), and
[once](https://dictionary.cambridge.org/pronunciation/english/once).

These paired forms rule out a single `-ave`, `-ay`, or `<one>` grapheme
rewrite: the productive bases and most derivatives already have their correct
phones, while the errors are lexical allomorphs. A spelling-specific code map
would violate the active rule policy, and `src-data/en/custom.dict` entries
would not change the direct `disableDict` readings measured by this gate (only
recursive morphology can consult lexicon stems). No pronunciation or reference
changed. The current frozen scores remain 5,378/6,990 common strict and
2,907/3,617 top-5,000 strict; the evidence points the next search toward
unexplained productive classes rather than these isolated irregular forms.

### Narrow `-ded` weak-vowel replay (2026-10-21)

A suffix-conditioned replay tested changing predicted final `/ɪd/` to `/əd/`
only for spellings ending `-ded`. It appears positive against the pinned IPA
reference on the fixed cohorts: common strict `+13/-3` and top-5,000 `+7/-3`.
The same transformation over the full testable dictionary is `+56/-77`, so
the spelling class is not a no-regression pronunciation rule. More decisively,
Cambridge US explicitly gives `/ɪd/` in *added* and *needed*, both common
cohort cases where the transform would replace the authoritative reading with
`/əd/` ([added](https://dictionary.cambridge.org/pronunciation/english/added),
[needed](https://dictionary.cambridge.org/us/pronunciation/english/needed)).
The apparent common gain therefore includes a reference transcription
convention mismatch and is not adopted. No source, prediction, baseline, or
test expectation changed.

### `-ryan` name-rime rule and release gate refresh (2026-10-22)

The verified `-ryan/-ryant` rime rule in `src/en/postlex.ts` changes only the
shared `/ɹjæn/` sequence when the spelling has that ending; it does not add
whole-word pronunciations. Oxford gives Ryan `/ˈraɪən/`, and Cambridge gives
Bryan `/ˈbraɪ.ən/` and Bryant `/ˈbraɪ.ənt/` ([Ryan](https://www.oxfordlearnersdictionaries.com/us/definition/english/ryan),
[Bryan](https://dictionary.cambridge.org/us/pronunciation/english/bryan),
[Bryant](https://dictionary.cambridge.org/us/pronunciation/english/bryant)).
Paired regressions cover the three names, possessives, O'Bryan, and Kenyan,
Ryans, and Bryanism controls. The frozen full-rule snapshot changes nine forms
and no default/POS predictions. On the fixed populations, rules-only common
strict rises 5,378→5,381/6,990 and top-5,000 rises 2,907→2,908/3,617; full
strict/lenient rises 62,369/83,689→62,377/83,698. Runtime parity remains
94,778/100,805 strict and 100,681/100,805 lenient. Stress-aware phonemic count
is 54,762, four above the immediate before-run. The rule, apostrophe, and
phonotactics suites pass (63 tests), and typecheck passes.

The current rules-only common strict score is still 911 words short of the
explicit 6,292/6,990 90% release gate. Default CMU accuracy is 4,754/5,000;
rules mode is 4,173/5,000 and remains below its known legacy 90% floor. Context
is 88/108 default/auto and homographs are 1,455/1,615. The final dictionary
rebuild completed using the standard four build steps. `data/en/dict.json`
reproduced its pre-run SHA-256; the dependency-aware exception table rebuilt to
53,906 entries with 526 re-pins. A post-build 1,296,341-row snapshot differs
from the frozen pre-build candidate in 31 morphology rows: 30 are synthetic
suffixes on Ryan/Bryan/Bryant, and one is the synthetic `confidentiallyer`.
Rule, dictionary, and POS rows are unchanged. All release accuracy gates were
rerun against this generated state: common remains 5,381/6,990 and 2,908/3,617;
full strict/lenient is 62,377/83,698; parity 94,778/100,805 and 100,681/100,805;
default/rules CMU is 4,754/5,000 and 4,173/5,000; strict-aware is 54,762;
context is 88/85/53/49 across its four cells; homographs is 1,455/1,615. The
90% common rules target remains 911 words away. The committed common baseline
is 5,340/6,990, so this batch's +41 strict words is short of the 5,410 ordinary
commit floor. No baselines were refreshed.

Post-build validation passed all 390 Jest suites / 7,015 tests, `yarn typecheck`,
and Rollup bundling. Rollup emitted its existing named/default-export and
external `pinyin-pro` warnings but completed successfully.

A fresh 10-fold structural rule learner run over 5,093 in-scope common items
accepted 50 fold-local candidates, but none passed the TRAIN-only repair-versus-
break filter. Replaying all accepted candidates lowered held-out strict from
3,829 to 3,808/5,093; the filtered set therefore made no change. No candidate
was adopted.

### Rejected `-ireless` rule-path correction (2026-10-22)

The rules-only common miss for *wireless* suggests changing `/aɪɝləs/` toward
the pinned `/aɪɹlɪs/`. Cambridge US instead gives `/ˈwaɪr.ləs/` for
[wireless](https://dictionary.cambridge.org/us/pronunciation/english/wireless)
and `/ˈtaɪr.ləs/` for
[tireless](https://dictionary.cambridge.org/dictionary/english/tireless).
The rules-only *tireless* already matches the pinned reference, so rewriting
the `-ireless` family would break that paired control; changing only
*wireless* would be a word exception driven by the scorer. No rule or
reference changed.

### Verified compound `-line` plural recovery (2026-10-22)

Regular plurals of transparent compounds ending in *line* could bypass the
existing compound stem route: rules-only *guidelines* was syllabified as
`gui·de·li·nes` instead of retaining the verified *guide + line* boundary.
The plural fallback now retries a verified compound stem only when the plural
is spelled `-lines` and its left component has the final-`e` spelling frame.
This covers forms such as *guidelines*, *sidelines*, *lifelines*, and
*pipelines* without a word map. Cambridge confirms the standard US readings
for [guideline](https://dictionary.cambridge.org/pronunciation/english/guideline),
[sideline](https://dictionary.cambridge.org/pronunciation/english/sideline),
[lifeline](https://dictionary.cambridge.org/pronunciation/english/lifeline),
[pipeline](https://dictionary.cambridge.org/pronunciation/english/pipeline),
[baseline](https://dictionary.cambridge.org/pronunciation/english/baseline),
and [timeline](https://dictionary.cambridge.org/us/pronunciation/english/timeline).
Paired regressions retain the singular and *headline(s)* controls in both
dictionary modes.

After the four-step dictionary rebuild, the frozen 1,296,341-row prediction
snapshot differs in 23 reviewed rows, all `-line` compound plurals or derived
forms; the before/after snapshots are byte-identical across the subsequent
compression pass. Re-pin count remains 526, `dict.json` and `exceptions.json`
hashes are unchanged, and the final exception table remains 53,906 entries.
The full-dictionary rule score rises 62,377→62,378/105,066 strict and
83,698→83,699 lenient. Public CMU accuracy rises 4,754→4,755/5,000 default and
4,173→4,174 rules; *guidelines* is the only changed row in each fixed CMU
report. Common-subset strict/lenient remains 5,381/6,388 of 6,990 and
2,908/3,362 of 3,617; runtime parity remains 94,778/100,805 strict and
100,681/100,805 lenient. Stress-aware correctness is 54,762, homographs
1,455/1,615, and context cells remain 88/85/53/49; the fixed supported-POS
default/auto cohort is 84/88. All 391 Jest suites / 7,017 tests and typecheck
pass. Five-module source count is exactly 3,395.

This is a measured incremental gain, not a qualifying commit batch: common
strict remains 911 words below the 90% target and 29 below the ordinary
5,410/6,990 commit floor. No baseline was refreshed.

### Rejected broad sibilant `-es` vowel shift (2026-10-22)

A rules-report scan found several common `-es` forms with `/əz/` where the
pinned CMU reference expects `/ɪz/`, including *resources*, *references*, and
*forces*. A broad simulated shift of final `/əz/` to `/ɪz/` for the existing
sibilant-`-es` spelling frame repairs 11 words but breaks 12, including
*services*, *messages*, *sources*, and *businesses*. The unchanged 5,000-word
rules cohort therefore rejects the class; no pronunciation rule or baseline
changed. Frozen inputs and reports are under
`/tmp/phonemize-sibilant-es-20261022/before/`.

### Rejected `-tribution` schwa correction (2026-10-22)

The CMU common report marks rules-only *distribution* and *contribution* wrong
for `/ɪ/` in the unstressed syllable before stressed `-bution`, where its
references use `/ə/`. Cambridge US independently gives `/ɪ/` for both
[distribution](https://dictionary.cambridge.org/us/pronunciation/english/distribution)
and [contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
and also confirms `/ɪ/` in [distribute](https://dictionary.cambridge.org/us/dictionary/english/distribute)
and [contribute](https://dictionary.cambridge.org/us/dictionary/english/contribute).
The existing rules therefore match the checked US dictionary on this vowel;
changing it to satisfy the narrower CMU forms would be a reference-shaped
regression. No rule or baseline changed.

### Rejected broad `-ment` correction and custom-entry fallback (2026-10-22)

A simulated final `/ə/`→`/ɛ/` shift across rules-path `-ment` outputs repairs
2 of 5,000 CMU cases but breaks 31, including *payment*, *moment*,
*government*, and *agreement*. Cambridge confirms the short-vowel root in
[comment](https://dictionary.cambridge.org/us/pronunciation/english/comment),
but the normal dictionary path already returns `/ˈkɑmɛnt/`; a `custom.dict`
entry is bypassed by the `disableDict` rules evaluation and cannot improve its
target. The temporary overlay and test were removed after this route check.
The before-run snapshot, reports, baselines, and source/data hashes are saved
under `/tmp/phonemize-comment-root-20261022/before/`.

### Rejected broad letter-name `e-` compound split (2026-10-22)

The rules-only common replay supports an `e` + independently attested
monosyllabic compound-root hypothesis for *email* and *ebay*: both current
`/ɛ/` onsets are wrong, and the proposed `/i/` onset repairs both with no
losses in the fixed 5,000-word cohort. Cambridge US confirms `/iː/` for
[email](https://dictionary.cambridge.org/us/pronunciation/english/email),
and the UK Intellectual Property Office describes the eBay mark as “EE-BAY”.
The hypothesis was screened against all 19 dictionary words whose remainder
appears in both existing compound-part tables. Its dictionary-wide playback
repairs 4 but breaks 6 entries (including several surnames), a net loss of 2
strict cases before any other gate; the broad rule is therefore rejected.
No runtime source or baseline changed. Candidate rows are saved in
`/tmp/phonemize-e-prefix-20261022/candidate-screen.json`; the reused frozen
inputs are under `/tmp/phonemize-comment-root-20261022/before/`.

### Open high-frequency `one`/`once` root errors (2026-10-22)

The rules-only common cohort still misses *one* (`/oʊn/` vs `/wʌn/`) and
*once* (`/ɑns/` vs `/wʌns/`). Cambridge independently confirms US `/wʌn/` for
[one](https://dictionary.cambridge.org/pronunciation/english/one) and
`/wʌns/` for [once](https://dictionary.cambridge.org/pronunciation/english/once).
Related compounds and the plural *ones* already retain `/wʌn/` through their
existing morphology routes, while the bare numeral and the adverb *once* do
not share a productive spelling alternation that can safely cover other
`-one` words such as *stone* and *phone*. No word-specific runtime guard was
added; the pair remains open pending a class rule with paired controls.

### Rejected broad plural `-alls` correction (2026-10-22)

A conditional `<all>` rule before final `s` changes *calls*, *falls*, *walls*,
and *balls* from `/æ/` to `/ɔ/`, taking the frozen rules-only CMU score from
4,174/5,000 to 4,178/5,000. Playback of the full dictionary changes three
entries: one strict win (*valls*) and no losses. However, the candidate's
`/ɔ/` is not a safe standard-US class: Cambridge gives `/ɑː/` for US *call*,
*wall*, and *balls* (while its homographic *falls* entry gives `/ɔː/`). The
CMU gain therefore appears to encode mixed lexical/variety readings rather
than a productive plural rule. The candidate was removed; no source, generated
data, or baseline changed. The frozen rules dump is
`/tmp/phonemize-comment-root-20261022/alls-before.tsv`; the candidate changed
only *valls* (`/ˈvæɫz/`→`/ˈvɔɫz/`), the only strict win against the runtime
dictionary, with no losses. The common-score result is preserved in
`/tmp/phonemize-comment-root-20261022/common-cache/rules-report.json`.
Sources: Cambridge US [call](https://dictionary.cambridge.org/us/pronunciation/english/call),
[wall](https://dictionary.cambridge.org/pronunciation/english/wall),
[balls](https://dictionary.cambridge.org/us/pronunciation/english/balls), and
[falls](https://dictionary.cambridge.org/pronunciation/english/falls).

### Structural correction learner CV replay (2026-10-22)

The structural learner replayed actual `disableDict` predictions across 10
spelling-family folds on the fixed 6,990-word common population (5,093 words
in scope). It accepted 50 candidates across folds, covering 15 distinct
conditional readings; none passed the TRAIN-only legacy filter. Applying all
accepted candidates lowered held-out strict from 3,829/5,093 to 3,808/5,093
(mean 75.18% to 74.77%). The most recurrent pattern, unstressed `/ɪ/` to
schwa in several left/right contexts, had top-5,000 wins paired with losses and
still failed support/fix-rate/distance checks. No candidate was promoted.
The report, fold assignments and scope record are in
`/tmp/phonemize-rule-corrections-20261022/`.

The non-structural conditional learner was also replayed over 10 spelling-
family folds. It accepted 24 candidates and passed none through its train-only
filter; the eight distinct learned readings had paired wins and losses in the
held-out evidence. Filter-passed held-out strict therefore remained unchanged
at a mean 75.22%. Full report: `/tmp/phonemize-rule-corrections-plain-20261022/`.

### `friend` spelling-family vowel (2026-10-22)

Cambridge US gives /ɛ/ in *friendship* and *friendly*, while *fiend* retains
/iː/. A conditional rule under the existing `^ie` vowel family now changes the
`friend` root and its productive derivations from /i/ to /ɛ/. A weak-syllable
guard keeps the same vowel in compounds such as *boyfriends*. Paired controls
*fiend, field, piece, chief,* and *believe* remain unchanged. The rebuilt full
snapshot has identical dictionary predictions and 5 rules-route changes:
four strict wins and no losses against the dictionary. Morphology expands this
to derived forms without affecting unrelated routes.

Post-build gates: common rules strict 5,383/6,990 (+2 vs the frozen before-run;
top-5,000 2,909/3,617, +1); default CMU 4,755/5,000 (above 90%); rules CMU
4,175/5,000 (nondecreasing, still below 90%); context default/auto 88/108
(baseline 87), default/gold 85/108, rules/auto 53/108 and rules/gold 49/108
(the latter three unchanged). The supported-POS default/auto cell rises from
83/88 to 84/88; all remaining supported-POS cells stay fixed. One `invite`
noun/verb context case changes. Homographs are
1,455/1,615; stress-aware full set 54,765/90,309 (+82); runtime parity
94,778/100,805 (unchanged). Typecheck and all 392 Jest suites / 7,029 tests pass for this final candidate. The normal +70-word strict commit threshold is
not met, so no baseline is refreshed and this batch remains uncommitted.

A full-dictionary postlex ablation (107,644 words, 177 rules) was also
completed. One rule removal would recover the common-word *Bennett* error, but
that same `<ett>` spelling class causes 43 strict losses dictionary-wide, so
no broad exception was adopted. The O'Reilly Media brand clarification remains
covered by the existing issue #28 tests; this candidate adds no brand-specific
mapping. Cambridge sources:
[friendship](https://dictionary.cambridge.org/us/pronunciation/english/friendship),
[friendly](https://dictionary.cambridge.org/us/pronunciation/english/friendly),
and [fiend](https://dictionary.cambridge.org/pronunciation/english/fiend).

### Rejected broad weak `-ical` vowel reduction (2026-10-22)

Six frequent rules-only mismatches suggested changing the final unstressed
`/ɪ/` in `-ical` to `/ə/` (*chemical, clinical, medical, political,
practical, typical*). Replaying that spelling-wide transform over the frozen
rebuilt snapshot gains 31 and loses 118 strict dictionary cases overall; even
the fixed common cohort loses 30 cases for 10 wins (top-5,000: 13 losses,
6 wins). Controls including *logical, musical, physical,* and *critical*
confirm that the ending does not have one predictable vowel. No runtime rule
was adopted. Full candidate rows were derived from
`/tmp/phonemize-comment-root-20261022/final-friend-rebuild.tsv`.

After the current reference corrections, a narrower replay on matching
`-ical` outputs still fails: 10 strict wins and 27 losses in the fixed common
cohort (top-5,000: 6 wins, 13 losses); across 158 matching testable dictionary
words it yields 28 wins and 89 losses. This confirms the earlier rejection on
the current frozen population.

### Rejected broad final `-se` voicing (2026-10-22)

Voicing the final `/s/` in every rules-path word spelled `-se` would repair
*please, ease,* and *phase*, but replaying against the frozen dictionary
produces 50 strict wins and 293 losses overall. The fixed common cohort loses
37 cases for 5 wins (top-5,000: 24 losses, 3 wins); *base, case, house, use,*
and *release* are representative controls. The ending is not a safe class, so
no runtime change was made. The replay used
`/tmp/phonemize-comment-root-20261022/final-friend-rebuild.tsv`.

### Narrow final `-plicit` vowel and stress rule (2026-10-22; rebuild pending)

The wider weak closed soft-c+i candidate was rejected after it produced
dictionary-wide losses. Restricting the vowel and stress repair to final
`-plicit` changes three frozen rules-path words (*complicit, explicit,* and
*implicit*): 3 strict wins and 0 losses against the dictionary, with no
runtime-dictionary changes. The common rules score is 5384/6990, one above the
pre-candidate run; the top-5000 slice is unchanged at 2909/3617. Paired
`-plicity` controls (*duplicity, simplicity, multiplicity*) remain unchanged.
Full Jest (393 suites / 7,035 tests), typecheck, CMU, parity, context, and
homograph checks passed with no measured gate regression. Context remains
88/108, homographs 1455/1615, runtime parity 94778/100805, default CMU
4755/5000, and rules CMU 4175/5000. The phonemic headline is 54766/90309
(+83 against baseline).

The required post-candidate dictionary rebuild could not run here: the `tsx`
launcher is blocked from creating its IPC socket, and direct execution cannot
resolve `raw.githubusercontent.com` to fetch a build input. Generated data and
baselines were not changed. This candidate remains uncommitted pending a
successful rebuild and full post-build gates; current strict gaps are therefore
pre-rebuild measurements.

The 2026-10-22 route and postlex diagnostics were also refreshed. On the fixed
common cohort, morphology removal drops strict from 5384 to 4734, confirming
that the existing morphology path is net helpful. Removing postlex rules had
no adoptable common-word correction. The updated 10-fold structural learner
accepted 47 candidates and passed none through its train-only filter; its
highest recurring weak-`/ɪ/` candidates still had paired top-5000 wins and
losses. The direct error clusters remain dominated by broad vowel defaults
whose examples include names/loanwords as well as ordinary words, so none was
promoted without a better spelling or morphological boundary. Reports:
`/tmp/phonemize-routes-current-20261022/`,
`/tmp/phonemize-postlex-current-20261022/`, and
`/tmp/phonemize-rules-current-20261022/`.

### Rejected static `of` / `from` overlays (2026-10-22)

The common-frequency errors for `of` and `from` suggested Cambridge US weak
readings `/əv/` and `/frəm/`. A runtime simulation of AH0 custom-dictionary
overrides gained four strict common words (both are in the top-5000) with no
common losses. It was rejected because that AH0 variant mismatches both
words' pinned CMU segment readings, while using AH1 to retain CMU's `/ʌ/`
segments adds primary stress in ordinary sentences such as “A cup of tea” and
“A book from the library.” Cambridge documents strong and weak variants for
both function words, so a static lexical override cannot preserve the context
contract. No custom-dictionary or generated-data change remains. See
[Cambridge *of*](https://dictionary.cambridge.org/us/pronunciation/english/of)
and [Cambridge *from*](https://dictionary.cambridge.org/us/pronunciation/english/from).

### IPA-Dict syllabic `-ed` reference correction (2026-10-22; gates pending)

IPA-Dict contains a cluster of spellings ending in `-ted` or `-ded` whose
selected reference uses `/əd/`, including forms where its variant selection
also drops the root-final `/t/` or `/d/` (*counted, granted, printed*). The
Cambridge rule for regular `-ed` after `/t/` or `/d/` is `/ɪd/`; its US
entries independently show this for *added, needed, granted,* and *printed*.
The build now corrects only selected `/əd/` readings in that spelling class,
restores a missing spelled root stop, and preserves compound `-headed` words
whose dictionary readings are lexicalized (including *lightheaded*).

Replaying the fixed rule-path snapshot against the corrected reference changes
251 full-dictionary strict comparisons from wrong to right and none from right
to wrong. Within the fixed common cohort, 63 comparisons change to right with
no losses (30 of those are in the top-5,000 slice). These are reference
corrections, not G2P gains. The full pipeline rebuilt the generated tables;
the no-regression gates below still determine adoption. No baseline is refreshed.
Cambridge sources: [regular `-ed` pronunciation](https://dictionary.cambridge.org/us/grammar/british-grammar/simple-past),
[*added*](https://dictionary.cambridge.org/us/pronunciation/english/added),
[*needed*](https://dictionary.cambridge.org/us/pronunciation/english/needed),
[*granted*](https://dictionary.cambridge.org/us/pronunciation/english/granted),
and [*printed*](https://dictionary.cambridge.org/pronunciation/english/printed).

The full build pipeline (dictionary, compound parts, then exceptions) now
finishes with stable common denominators: rules strict 5,447/6,990 and
2,939/3,617 top-5,000; the corrected references account for +63 and +30 of
those comparisons, respectively. Runtime parity is 94,786/100,805, context is
88/108, homographs are 1,455/1,615, and the stress-aware headline is
54,776/90,309 (+93 vs baseline). Public CMU accuracy is 4,745/5,000 default
and 4,175/5,000 rules; the default is ten below the frozen before-run 4,755,
despite remaining above 90%. This violates the no-regression gate, so the
candidate is not qualified and no baselines are refreshed. The updated
10-fold learner also accepted 47 rule candidates and passed none through the
train-only filter; its most recurrent weak-vowel proposals all lose top-5,000
controls. Full Jest passes (394 suites / 7,051 tests), typecheck passes, and
`git diff --check` is clean. The `added`/`ended` and sentence-level `implicit`
test expectations now match Cambridge's `/ɪd/` suffix and primary-stress
entries: [regular `-ed`](https://dictionary.cambridge.org/us/grammar/british-grammar/simple-past),
[*implicit*](https://dictionary.cambridge.org/pronunciation/english/implicit).

### Rejected expanded structural learner candidates (2026-10-22)

The expanded 10-fold learner added triple feature contexts to the spelling,
syllable, and stress features, keeping spelling families grouped in each fold.
Across 5,093 rules-path words it accepted 103 candidates at least once, but
none passed the existing train-only adoption filter. Replaying all accepted
rules reduced held strict from 3,832/5,093 to 3,810/5,093; the filtered set
therefore made no held-out change. The strongest recurring suggestion to
centralize `<i>` before `-ic` repaired cases such as *article* and *political*
but broke *erotica* and *Vatican*. It also fell below the minimum support and
fix-rate requirements, so no production rule or baseline change was made.
The variation is supported by Cambridge US entries: *article*, *erotica*, and
*Vatican* retain /ɪ/ in this position, while *political* has weak /ə/.
Evidence: `/tmp/phonemize-rule-corrections-triples/cv-common-report.json`;
[article](https://dictionary.cambridge.org/us/pronunciation/english/article),
[erotica](https://dictionary.cambridge.org/pronunciation/english/erotica),
[Vatican](https://dictionary.cambridge.org/us/pronunciation/english/vatican),
and [political](https://dictionary.cambridge.org/pronunciation/english/political).

### Rejected weak final `-tin` reduction (2026-10-22)

A distance-objective run of the expanded 10-fold, family-grouped learner
accepted 84 candidates and passed none through the train-only filter. Applying
all accepted candidates reduced held strict from 3,832 to 3,817/5,093 and
increased edit distance, so the broader candidate set is not adoptable.

The strongest individual condition was an unstressed final syllable spelled
`-tin`, with /ɪ/ changed to /ə/. On the fixed common cohort this simulated
four strict wins and no losses (5,451/6,990; top-5,000 2,942/3,617), improving
only *bulletin, Latin, Martin,* and *satin*. It fails the full-dictionary gate:
across 105,066 testable dictionary words it produces 13 strict wins and 55
losses (62,646 to 62,604 correct), plus four lenient losses. Narrowing by
written endings does not fix the conflict: `-atin` has four strict wins and
three losses, while `-etin` has one win and one loss; the other tested `-tin`
vowel endings add losses without strict wins. No source or runtime rule was
changed. Replays:
`/tmp/phonemize-rule-corrections-distance-triples/cv-common-report.json` and
the fixed common/full-dictionary simulation from this run.

### Rejected weak final `-age` reduction (2026-10-22)

Changing the final weak vowel in rules-path words ending in `-age` from /ɪ/ to
/ə/ simulated 18 strict wins and 10 losses on the fixed common cohort
(5,455/6,990); top-5,000 had 11 wins and 5 losses (2,945/3,617). The full
dictionary gate rejects it: strict fell from 62,646 to 62,610/105,066 and
lenient from 81,969 to 81,960, with edit distance increasing. Cambridge US
entries explicitly support /ɪ/ in *cottage, damage, message,* and *package*,
so weak `-age` has lexical variation that the suffix alone cannot resolve.
No runtime rule or reference change was made.

The compression trigger was also met at 3,400 code lines across the five
modules. Merging adjacent regex declarations reduced the count to 3,395. The
1,296,341-row before/after prediction snapshots are byte-identical; typecheck
and all 394 Jest suites / 7,051 tests pass. The neutral compression is recorded
in `AGENTS.md`; no pronunciation baseline changed.

### Fresh common-error scan and rejected `-ically` repair (2026-10-22)

The current frozen rules-path run remains 5,447/6,990 strict (2,939/3,617
top-5,000), with 1,543 strict mismatches; 893 are one-phone differences.
Direct rule traces are led by initial-letter clusters, but their samples are
mostly spelling-inaccessible names, foreign forms, and abbreviations, so they
do not justify a broad grapheme rewrite.

A suffix simulation inserted schwa before final dark L in predictions ending
`-ically` (`kɫi` → `kəɫi`). Across 85 matching full-dictionary words it gained
26 strict cases and lost 49. The fixed common cohort was a tie at 2 wins and 2
losses; top-5,000 lost one and gained none. The full-dictionary gate rejects
this candidate, so no runtime rule was changed. The suffix remains a possible
diagnostic axis only when a narrower conditioning environment can be found.

The required all-word route ablation replayed 107,644 words and confirmed
that removing morphology drops strict from 63,984 to 57,880; the unsplit
alternative drops it further to 54,873. Of 126 individual handler bypasses,
only one had a positive strict balance, and it changed just *transmittal* and
*referral*: the strict win is paired with a lenient loss. No handler removal
or route bypass is adoptable. Full recursive-stem evidence is at
`/tmp/phonemize-routes-next-release-20261022/report.json`.

### Rejected `-on` as a single failure class (2026-10-22)

The fresh fixed-common mismatch report contains 87 words ending in `-on`:
35 bare-`-on` rules-path cases, 20 rules-path `-tion` cases, 11 morphology-path
`-tion` cases, 3 `-sion`, 2 `-ion`, and 16 other endings. Their errors mix
stress (*upon, phenomenon*), internal-vowel differences (*comparison,
promotion*), stem/affix joins (*arbitration, distribution*), and names
(*Avon, Tucson, Yukon*). The count is a triage bucket, not one spelling rule;
no `-on` rewrite was simulated or adopted. Future mining should group by
recovered stem and derivational family instead of final letters.

Within those cases, the 31 written `-tion` mismatches are also mixed: 20
reach the direct spelling rules and 11 reach morphology, with 26 of 31 at
distance one. Their discrepancies include opposite weak-vowel directions
(*arbitration/civilization* versus *destination/legislation*), stress and
rhotic differences (*production/promotion*), and unrelated stem vowels
(*definition, jurisdiction, tuition*). This split does not support a blanket
`-tion` vowel or stress rule. No phoneme transform was adopted; any follow-up
needs to condition on an independently recoverable stem family.

One candidate stem-family transform was tested against the whole dictionary:
in predictions ending in `-ication`, change the schwa immediately before
stressed `/keɪʃən/` to `/ɪ/`. It changes 33 words and yields only 3 strict
wins against 25 losses overall; the fixed common slice has 1 win and 7 losses,
and top-5,000 has 0 wins and 3 losses. The failure is lexicalized stem
alternation: *syndicate* has `/də/` while *syndication* has `/dɪ/`, but
*indicate/indication* runs the opposite direction. This candidate is rejected;
it did not change sources or runtime rules.

### Collins-supported Bennett reference correction (2026-10-22)

Collins US gives surname *Bennett* as `/ˈbɛnɪt/` ([entry](https://www.collinsdictionary.com/us/dictionary/english/bennett)). The broad final `-ett` rule predicts `/ˈbɛnət/` for this spelling, and replay showed that changing the general rule would break many other words. Added only the source-data pronunciation to `src-data/en/custom.dict`; runtime rule code and name lexicons were not changed. This is a narrowly scoped dictionary correction, not evidence for a general `-ett` class fix.

On the same 6,990-word common cohort, rules-path strict changed from 5,447 to 5,448; lenient stayed 6,395. The top-5,000 slice stayed 2,939/3,617 strict and 3,366 lenient. The default CMU API remained 4,745/5,000, rules-only 4,175/5,000; context remained 88/108 default-auto and 85/108 default-gold; homographs remained 1,455/1,615. None of those baselines was refreshed.

Rebuilding the exception tables allowed the corrected base to derive *Bennett's*, *Bennetts*, and related morphology forms. As a result, `data/en/dict.json` no longer includes `bennetts`: the raw runtime parity and stress-aware report denominators each shrank by one (100,805→100,804 and 90,309→90,308), so those raw headline counts are not directly comparable. The before snapshot recorded `/ˈbɛnɪts/` for `bennetts`; the rebuilt runtime predicts the same `/ˈbɛnɪts/`. This preserves that word on the prior population and avoids treating the denominator change as a score gain or loss. The complete before/after snapshots and reports are under `/tmp/phonemize-bennett-correction-20261022/`.

The focused issue #28 apostrophe suite passed all 24 tests, and `yarn typecheck` plus `git diff --check` passed. The issue's O'Reilly Media behavior remains exercised independently; it did not require a brand-specific runtime mapping.

### Updated family-fold search after Bennett correction (2026-10-22)

Re-ran `learn-rule-corrections.ts --objective distance` against the corrected dictionary and unchanged 6,990-word common cohort. Across ten spelling-family folds, 12 candidate readings were accepted in individual folds, but none passed the tool's legacy filter diagnostic. Applying all accepted candidates reduced held-out strict from 75.26% to 75.10%; the filtered set made no change because no proposal passed. The recurring candidates were a weak `eɪ→ə` change before `m`, and `ə→ɪ` before `it`, but each had mixed wins and losses. No spelling rule was adopted. Report: `/tmp/phonemize-rule-corrections-bennett-20261022/cv-common-report.json`.

### Current accumulated-batch gate audit (2026-10-22)

Current rules-path scores are 5,448/6,990 strict (77.94%) and 6,395 lenient; top-5,000 is 2,939/3,617 strict (81.26%) and 3,366 lenient. That is +108 strict words over the committed 10/20 common baseline, above the ordinary +70 threshold, but still 844 below the requested 90% strict target. Full-dictionary rules are 62,647/105,065 strict and 83,721 lenient. Public CMU API is 4,745/5,000 default and 4,175/5,000 rules-only; default meets the 4,739 floor, while rules-only remains below its legacy 90% floor and unchanged from the preceding frozen run. Context remains 88/108 default-auto and 85/108 default-gold; homographs are 1,455/1,615. Stress-aware phonemic correctness is 54,775/90,308 (+92 against its committed baseline).

The current parity run is 94,785/100,804 strict and 100,691/100,804 lenient, but its generated population is two words smaller than the committed 100,806-word denominator. One deletion is `bennetts`, now derived from the corrected base; its before/after prediction is unchanged at `/ˈbɛnɪts/`. Because the full denominator has not yet been restored, the accumulated batch is not ready for a qualifying commit or baseline refresh despite the percentage delta. All 394 Jest suites / 7,051 tests, `yarn typecheck`, and `test:ipa` passed in this audit. The only command failure was the known `tsx` IPC restriction when invoking the homograph script via Yarn; the equivalent direct `node --require tsx/cjs` run completed and reported 1,455/1,615.

### Cambridge-supported `financ-` root (2026-10-22)

Cambridge US lists PRICE in *finance* and PRICE or schwa variants in *financial*, with no KIT onset ([finance](https://dictionary.cambridge.org/us/dictionary/english/finance), [financial pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/financial)). Added a spelling-family rule for the English `finance` / `financial` root after weak-vowel reduction, without a word map. Paired controls retain *finances*, *financially*, Spanish *financiera/financiero*, and *financo*. The frozen 1,296,330-row snapshot changed four outputs: `finance`, `financial`, `financial's`, and `non-financial`; the post-compression snapshot is byte-identical to the pre-compression candidate. Five-module code count is 3,395. Evidence is under `/tmp/phonemize-financ-class-20261022/`.

Against the immediately preceding frozen candidate, common rules strict rose from 5,448 to 5,450/6,990 and lenient from 6,395 to 6,396; top-5,000 strict rose from 2,939 to 2,941/3,617 and lenient from 3,366 to 3,367. Full-dictionary strict rose from 62,647 to 62,650/105,065 and lenient from 83,721 to 83,722. Public CMU API remains 4,745/5,000 by default; rules-only is 4,176/5,000, one above the preceding run but below its legacy 90% floor. Stress-aware phonemic accuracy is 54,777/90,308 (+94 vs committed baseline). Context remains 88/85/53/49 across its four cells, and homographs remain 1,455/1,615. Runtime parity remains 94,785/100,804 strict and 100,691 lenient; its two-entry population mismatch remains unresolved, so no baselines were refreshed.

The fresh ten-fold family search accepted 12 fold-level candidates; none passed its TRAIN-only legacy filter. Applying all accepted candidates reduced held-out strict from 75.30% to 75.14%; the filtered result remained 75.30%. The structural search accepted 21 candidates, none passed, and applying all reduced held-out strict to 75.10%. Removing each of 177 postlex rules in an all-dictionary replay found no rule with positive common strict or lenient balance. No additional candidate was taken from those searches. All 395 Jest suites / 7,058 tests and typecheck pass; `test:ipa` and `git diff --check` pass. The `yarn build-dict` wrapper hit the sandbox's `tsx` IPC restriction; the direct build script first hit blocked DNS, then succeeded with approved network access.

### Top-5,000 residual spelling-class screen (2026-10-22)

After the `financ-` gain, top-5,000 strict is 2,941/3,617, leaving 315 correct cases to reach 90%; 676 items currently fail. A fresh suffix ranking found 37 `-on`, 18 `-ion`, 17 `-age`, and 17 `-tion` mismatches, among other smaller groups. These are triage counts, not shared pronunciations: the earlier full replays rejected blanket `-on`, `-tion`, and `-age` transforms for mixed stress, vowels, morphology, and dictionary-supported variants. The current family-fold and all-rule postlex ablations likewise provide no passing class candidate, so no broad final-letter rule was added. Full frequency-ranked suffix counts: `/tmp/phonemize-financ-class-20261022/top5000-suffix-scan.json`; postlex replay: `/tmp/phonemize-next-release/postlex-financ-20261022/results.json`; family-fold reports: `/tmp/phonemize-next-release/learner-financ-20261022/` and `/tmp/phonemize-next-release/learner-structural-financ-20261022/`.

### Rejected blanket weak vowel in spelled `-land` (2026-10-22)

A frozen rules-path trial changed every final `/ɫænd/` to `/ɫənd/` across the
English dictionary. It affected 113 predictions: strict dictionary matches
rose 46 and fell 47 (net -1). On the top-5,000 list it had one strict win and
three losses; the controls `land`, `planned`, and `Thailand` retain `/ænd/`,
while `Portland` was the lone strict win. Cambridge confirms the mixed classes
in [land](https://dictionary.cambridge.org/us/pronunciation/english/land),
[Thailand](https://dictionary.cambridge.org/us/pronunciation/english/thailand),
and [Iceland](https://dictionary.cambridge.org/us/pronunciation/english/iceland).
The independent CMU replay was net-positive by ten, but the full-dictionary
strict regression violates the project gate, so no suffix rule was adopted.
The temporary replay changed no source or reference. The other matching words
and win/loss rows are summarized in `/tmp/phonemize-next-release/land-trial-2026-10-22.json`.

The fresh structural learner report at
`/tmp/phonemize-next-release/learn-2026-10-22/cv-common-report.json` also
selected 46 candidates across ten spelling-family folds, with none passing
the train-only legacy filter. Applying all selected candidates reduced
held-out strict from 3,835 to 3,810/5,092. No learned candidate was adopted.


### Rejected weak `i` after soft `c` before a consonant (2026-10-22)

A rule-only replay changed 160 dictionary predictions by reducing unstressed
`/ɪ/` after soft `c` to schwa when another consonant followed in the spelling.
It fixed five common strict cases and none of those five were common losses,
but across the full dictionary it produced 25 strict wins against 45 losses
and reduced lenient correct cases by 14. It misreads attested forms such as
*tacit, pacifist, narcissism, rancid,* and *incidentally*. The spelling
environment does not resolve the lexical variation, so the temporary rule was
removed. No pronunciation or reference change was retained.

### No blanket `-quent` correction (2026-10-22)

Rules-only replay showed mixed `quent` outcomes, so no shared vowel rewrite
was simulated for adoption. Cambridge distinguishes adjective /ˈfriːkwənt/
from verb /friːˈkwent/ for *frequent*; the rules path keeps the adjective
reading for *frequent* and uses the verb reading in *frequented*. A spelling-
only `e` rewrite would collapse that part-of-speech distinction and risk
changing the correct inflected verb. See [Cambridge US frequent]
(https://dictionary.cambridge.org/us/dictionary/english/frequent) and
[frequented](https://dictionary.cambridge.org/dictionary/english/frequented).
This is an evaluator/reference ambiguity, not a pronunciation gain; no runtime
or gold change was made.

### Weak vowel in dropped-e `-aging` inflections (2026-10-22)

For rule-derived present participles ending in `-aging`, change only a final
`/ədʒɪŋ/` to `/ɪdʒɪŋ/`. The guard excludes the `-naging` family, preserving
Cambridge US *manage* /ˈmænədʒ/ and its *managing* schwa. Cambridge US confirms
the KIT vowel in *damaging, imaging, messaging, packaging, salvaging,* and
*savaging*; Oxford gives US *mortgaging* /ˈmɔːrɡɪdʒɪŋ/. The rule transforms
the already-composed inflection, so *mortgaging* retains the silent `<t>` from
its correct stem. No whole-word mapping or runtime lexicon entry was added.

Frozen full snapshot changed exactly seven rules-path predictions, all strict
wins against the unchanged dictionary reference: *damaging, imaging,
messaging, mortgaging, packaging, salvaging,* and *savaging*. There were no
strict losses; *managing, staging, engaging,* and *aging* remain unchanged.
The evidence is under `/tmp/phonemize-aging-class-20261022/`; the before and
after snapshots each contain 1,296,330 predictions and the rebuild left
`data/en/dict.json` byte-identical.

After rebuild, full-dictionary strict is 62,657/105,065 (+7) and lenient is
83,722 (unchanged). Common strict is 5,453/6,990 (+3) and top-5,000 strict is
2,943/3,617 (+2); common and top-5,000 lenient counts are unchanged at 6,396
and 3,367. Public CMU API remains 4,745/5,000 by default and rises from
4,176 to 4,178/5,000 in rules mode; rules mode remains below its legacy 90%
floor. Runtime parity is unchanged at 94,785/100,804 strict. Stress-aware
phonemic accuracy, context IPA (88/85/53/49), and homographs (1,455/1,615)
are unchanged. All 396 Jest suites / 7,080 tests, typecheck, and `test:ipa`
pass. Five-module rule-code count remains 3,395.

References: [Cambridge US damaging](https://dictionary.cambridge.org/us/dictionary/english/damaging),
[imaging](https://dictionary.cambridge.org/us/dictionary/english/imaging),
[messaging](https://dictionary.cambridge.org/us/dictionary/english/messaging),
[packaging](https://dictionary.cambridge.org/us/dictionary/english/packaging),
[salvaging](https://dictionary.cambridge.org/us/dictionary/english/salvaging),
[savaging](https://dictionary.cambridge.org/us/dictionary/english/savaging),
[manage pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/manage),
and [Oxford US mortgage verb](https://www.oxfordlearnersdictionaries.com/us/definition/english/mortgage_2).

### Residual common-word search after `-aging` (2026-10-22)

The refreshed 6,990-word report has 1,537 strict mismatches. The largest
three-letter endings are `-ion` (36), `-ent` (30), `-age` (27), `-ity` (24),
and `-ing` (22). These buckets are not shared sound classes: the 22 `-ing`
failures alone mix vowel, stress, consonant, proper-name, and lexicalized-root
differences. Generic and structural family-fold learning accepted 21 and 47
training proposals respectively, but none passed the legacy fold filters;
filtered held-out strict remained 75.30% in both. Route ablation and removal
of each postlex rule also exposed no passing shared rule. No further candidate
was added. Reports: `/tmp/phonemize-rule-corrections/cv-common-report.json`,
`/tmp/phonemize-route-diagnosis/report.json`, and
`/tmp/phonemize-postlex-diagnosis/results.json`.

### Rejected blanket `pre-` KIT-to-FLEECE change (2026-10-22)

A rules-path replay that changes initial `/pɹɪ/` to `/pɹi/` repaired two
common-set strict cases, *preceding* and *presenting*, with no common-set
losses: 5,453 to 5,455/6,990. Top-5,000 remained 2,943/3,617. This does not
support a general `pre-` spelling rule: Cambridge gives US FLEECE but UK KIT
for *preceding*, while *presenting* retains KIT in both Cambridge dialects.
Other `pre-` words in the same cohort require `/ɛ/`, `/ə/`, or other prefix
vowels. No runtime change was adopted. See [Cambridge preceding](https://dictionary.cambridge.org/us/dictionary/english/preceding)
and [presenting](https://dictionary.cambridge.org/us/dictionary/english/presenting).

### Rejected weak `-ticle` correction after dictionary check (2026-10-22)

A replay of unstressed `/ɪ/` → `/ə/` in rule-path words ending `-ticle`
would change *article, cuticle,* and *particle* to match the pinned IPA-Dict
golds, with no losses among the four dictionary entries ending in `-ticle`;
*testicle* remains unchanged because its vowel is secondary-stressed. This is
not a qualified pronunciation gain: Cambridge US records `/ɪ/` for *article*
and *cuticle*, and `/ə/` for *particle* (UK `/ɪ/`). The fixed gold therefore
mixes competing standard readings. No rule or reference was changed; this
needs a separately versioned source decision rather than a spelling rule. See
[Cambridge article](https://dictionary.cambridge.org/us/pronunciation/english/article),
[cuticle](https://dictionary.cambridge.org/us/dictionary/english/cuticle),
[particle](https://dictionary.cambridge.org/us/pronunciation/english/particle),
and [testicle](https://dictionary.cambridge.org/us/pronunciation/english/testicle).

### Rejected missing schwa in rules-path `-ically` outputs (2026-10-22)

Inserting `/ə/` before final `/ɫi/` only when a rules-path word is spelled
`-ically` and currently ends `/ɪkɫi/` changed 85 full-dictionary predictions:
26 strict wins and 49 losses, lowering full strict from 62,657 to 62,634 out
of 105,065. The fixed common cohort had two wins and two losses, with no net
change; top-5,000 had no wins and one loss (2,943 to 2,942/3,617). The suffix
does not predict whether IPA-Dict includes this schwa. No runtime change was
adopted. Full win/loss rows: `/tmp/phonemize-ically-l-20261022/replay.json`.

### Rejected apparent `-dical` gain after US dictionary verification (2026-10-22)

A narrower `/ɪkəɫ/` → `/əkəɫ/` rewrite for spellings ending `-dical` would
raise the fixed common cohort by two and top-5,000 by one (full dictionary:
3 strict wins, 1 loss). The common wins are *medical* and *radical*, but
Cambridge US explicitly gives both a KIT vowel; the score gain would move
away from those standard readings. No rule or gold was changed. Candidate
rows: `/tmp/phonemize-dical-probe-20261022/replay.json`. See
[Cambridge medical](https://dictionary.cambridge.org/us/pronunciation/english/medical),
[radical](https://dictionary.cambridge.org/us/pronunciation/english/radical),
and [biomedical](https://dictionary.cambridge.org/us/pronunciation/english/biomedical).

### Custom-dictionary exception probe does not reach the rules gate (2026-10-22)

Temporarily overlaid seven Cambridge-verified common lexical forms
(*have, both, said, been, one, only,* and *business*) in
`src-data/en/custom.dict`. Rebuild loaded 44 entries and produced a full
1,296,330-row default/rules/morph/POS snapshot byte-identical to the frozen
37-entry state; `disableDict` bypasses direct dictionary lookup, so these
lexical overrides cannot improve the fixed rules-only metric. The temporary
entries were removed and rebuild restored `data/en/dict.json` to its frozen
SHA256. This route is not a score-improvement mechanism; future candidates
must change actual rules-path predictions.

### Rejected dark-lateral normalization before final `i` (2026-10-22)

A rules-output replay replacing final `/ɫi/` with `/li/` changed 2,840 words
and reduced full strict from 62,657 to 60,524/105,065 (1 win, 2,134 losses).
The common cohort lost 158 net cases (1 win, 159 losses); top-5,000 lost 64
net (1 win, 65 losses). Restricting the same rewrite to spellings ending
`-ly` also regressed: common 1 win/148 losses and top-5,000 1 win/63 losses.
The reference uses dark-l notation for many ordinary `-ly` outputs, so a broad
allophonic rewrite is not compatible with the fixed contract. No rule or
normalizer changed.

### Structural TRAIN candidate search (2026-10-22)

The frozen `learn:rules --structural` run used 5,093/6,990 common words on the
rules-only path (72.86% coverage), grouped 4,660 spelling families into ten
folds, and selected only on each fold's TRAIN portion. It accepted 47 fold
rules and pooled 15 distinct readings, but none passed the existing fix/break
filter in any fold; the mean held-out strict score therefore stayed 75.30%.
The strongest pooled candidates still traded TRAIN fixes for breaks and often
lost top-5,000 cases. No candidate was promoted or replayed as a runtime rule.
The full report is `/tmp/phonemize-next-release-structural-20261022/cv-common-report.json`.

An accompanying -ing probe rejected a blanket -cede root-vowel repair. Cambridge
US distinguishes [*preceding*](https://dictionary.cambridge.org/pronunciation/english/preceding)
/priːˈsiːdɪŋ/ from [*receding*](https://dictionary.cambridge.org/us/dictionary/english/receding)
/rɪˈsiːdɪŋ/; their shared spelling shape does not license one vowel rule. The
current `preceding` miss remains open pending a more discriminating general
class.

### Retained-e `-age` plurals (2026-10-22)

The plural fallback's general silent-e guard capped recovered stems at three
syllable slots, which excluded rule-exact four-slot `-age` roots. The fallback
now carries these retained-e roots into plural `-s`; other endings retain the
original cap. This changes the rules path for *averages*, *beverages*, and
*porterages*: it inherits the attested root stress instead of resyllabifying
the whole plural. Cambridge US confirms first-syllable stress in [average](https://dictionary.cambridge.org/us/pronunciation/english/average)
and [beverage](https://dictionary.cambridge.org/us/pronunciation/english/beverage); Cambridge records initial stress for [porterage](https://dictionary.cambridge.org/us/pronunciation/english/porterage).

On the fixed dictionary, the isolated candidate changed only those three
rules predictions: no strict wins or losses, one full-dictionary lenient win
(*porterages*), and no common-cohort change. After rebuild, the full rules
lenient count is 83,723/105,065, up one from the frozen 83,722; strict remains
62,657. Common strict/lenient remain 5,453/6,396 and top-5,000 remains
2,943/3,367. The complete 1,296,330-row runtime snapshot and parity report are
in `/tmp/phonemize-age-plural-20261022/`. Regenerating previously stale runtime
tables also refreshed the `financ-` entries; those stress-mark changes are
separate from the plural rule and are not counted as accuracy gains.

Other final gates stayed nondecreasing: parity 94,785/100,804 strict and
100,691 lenient; stress-aware 54,778/90,308 (+1 from the frozen before-run);
public CMU default 4,745/5,000 and rules-only 4,178/5,000; context
88/108, 85/108, 53/108, 49/108; homographs 1,455/1,615. The default CMU
90% floor passes; the existing rules-only floor still fails. The full run
passed all 397 test suites (7,087 tests); after adding three base-root
assertions, the expanded age and finance focused suites passed 17/17, and
typecheck passed. Paired tests cover the stems, plural forms, neighboring
plural controls, and noun/adjective/verb sentence contexts.
This is a retained sub-threshold improvement; the normal +70 common strict
commit minimum is not met, so no baseline was changed and the existing batch
remains uncommitted.

The rebuilt `financ-` test also stopped requiring secondary stress on the
initial syllable of *financially*. Cambridge's US entry marks primary stress
on `/næn/` and no secondary stress on `/faɪ/` ([Cambridge financially](https://dictionary.cambridge.org/us/pronunciation/english/financially)).
This test correction follows the source reading and is not a pronunciation
gain.

### Rejected blanket weak `-age` vowel rewrite (2026-10-22)

Replayed `/ɪdʒ/` → `/ədʒ/` on every rules-path output whose spelling ends in
`-age`. Among affected words, strict wins/losses were 45/104 in the full
dictionary, 18/19 in the fixed common subset, and 11/10 in top-5,000; the
common strict score therefore regresses by one despite a one-word top-slice
gain. This is also not a uniform US pronunciation class: Cambridge gives
`/ɪ/` for [message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[package](https://dictionary.cambridge.org/us/pronunciation/english/package),
[damage](https://dictionary.cambridge.org/us/dictionary/english/damage),
[coverage](https://dictionary.cambridge.org/pronunciation/english/coverage),
and [drainage](https://dictionary.cambridge.org/us/pronunciation/english/drainage),
but `/ə/` for [manage](https://dictionary.cambridge.org/us/pronunciation/english/manage).
No rule or reference was changed.

### Rejected apparent `-tice` and `-sis` vowel gains (2026-10-22)

An exact-population suffix replay suggested `/ɪ/` → `/ə/` in `-tice` words
(four common wins, none lost; three top-5,000 wins) and in a small `-sis`
group (five common wins, none lost). The apparent gains conflict with
Cambridge US: [justice](https://dictionary.cambridge.org/us/pronunciation/english/justice),
[notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[practice](https://dictionary.cambridge.org/us/pronunciation/english/practice),
and [hypothesis](https://dictionary.cambridge.org/us/pronunciation/english/hypothesis)
all retain `/ɪ/` in those endings. These are reference disagreements, not
pronunciation errors; no rule or reference was changed. Replay used the
official evaluator's stress stripping, `/ʌ/` normalization, and fixed
6,990/3,617 populations.

### Rejected general AmE yod deletion before `/ʊɹ/` (2026-10-22)

The common-word route audit flagged *during* (`/djʊɹɪŋ/` versus gold
`/dɝɪŋ/`). Replaying `/djʊɹ/` → `/dʊɹ/` on the actual pipeline changes only
four testable dictionary words: it produces no strict wins against the pinned
CMU-derived references and leaves the common and top-5,000 scores unchanged.
Cambridge US independently gives `/dʊr/` in [during](https://dictionary.cambridge.org/pronunciation/english/during),
[endure](https://dictionary.cambridge.org/us/pronunciation/english/endure),
and [enduring](https://dictionary.cambridge.org/pronunciation/english/enduring),
so the three benchmark losses may be valid AmE variants rather than incorrect
outputs. This is source evidence for a future reference-contract review, not
an accuracy gain under the frozen benchmark; no yod rule or reference was
changed.

### Rejected structural distance-learning batch (2026-10-22)

The spelling-family-folded `learn-rule-corrections.ts --structural
--objective distance` run covered 5,092/6,990 common words. It accepted 20
TRAIN-selected candidates across ten folds; none passed the existing
fix/break filter. Replaying all accepted candidates reduced held-out strict
from 3,835 to 3,824/5,092 and lenient from 4,576 to 4,572, while aggregate
edit distance also worsened. No candidate was promoted. Report:
`/tmp/phonemize-next-release-distance-20261022/cv-common-report.json`.

### Rejected blanket `-ital` weak-vowel retention (2026-10-22)

The `/ə/` prediction in *hospital* suggested retaining `/ɪ/` before `-ital`.
Replaying that change through the actual rules pipeline altered 12 of 17
dictionary spellings ending in `-ital`. On the fixed common cohort it fixes
*hospital* but breaks *capital*, for zero net strict gain (top-5,000: +1/−1).
The class is mixed in authoritative US pronunciations: Cambridge gives `/ɪ/`
for [hospital](https://dictionary.cambridge.org/us/pronunciation/english/hospital),
but `/ə/` for [capital](https://dictionary.cambridge.org/pronunciation/english/capital),
[digital](https://dictionary.cambridge.org/us/pronunciation/english/digital),
and [genital](https://dictionary.cambridge.org/us/pronunciation/english/genital).
No spelling-wide rule or word mapping was added.

### Rejected three-feature weak-`i` learner batch (2026-10-22)

The TRAIN-only `learn-rule-corrections.ts --structural --expanded --triples`
screen examined 5,092/6,990 in-scope rules predictions across ten spelling-
family folds. It accepted 102 candidates; none passed the fixed affected-word,
fix-rate, and top-5,000 loss filter. Replaying all accepted candidates reduced
held-out strict from 3,835 to 3,812/5,092 and lenient from 4,576 to 4,563;
edit distance also worsened. The most tempting `t` → `/ə/` candidate had
TRAIN top-5,000 +36/−0 but only ten affected cases per fold and 6/2 held-out
fixes/breaks pooled across folds. Its apparent wins mix `/ə/` words such as
[particle](https://dictionary.cambridge.org/us/pronunciation/english/particle)
with Cambridge's `/ɪ/` reading of [article](https://dictionary.cambridge.org/us/pronunciation/english/article)
and [testicle](https://dictionary.cambridge.org/us/pronunciation/english/testicle);
the broad class is not a pronunciation rule. No rule or reference changed.
Report: `/tmp/phonemize-next-release-triples-20261022/cv-common-report.json`.

### Rejected `-ically` schwa insertion under the frozen CMU gate (2026-10-22)

On the actual pipeline, inserting `/ə/` before final `/ɫi/` in `-ically`
words produces two common strict fixes (*dramatically*, *physically*) and two
regressions (*basically*, *specifically*) against the pinned CMU strings. The
common strict net is zero and top-5,000 is 0/1 (one loss).
Cambridge US marks `/kəli/` in [basically](https://dictionary.cambridge.org/us/pronunciation/english/basically),
[dramatically](https://dictionary.cambridge.org/us/pronunciation/english/dramatically),
[physically](https://dictionary.cambridge.org/us/pronunciation/english/physically),
[specifically](https://dictionary.cambridge.org/us/pronunciation/english/specifically),
and [periodically](https://dictionary.cambridge.org/pronunciation/english/periodically).
This supports the schwa as a standard AmE pronunciation, but the present
single-reading benchmark cannot accept that variant without a separately
versioned reference audit; no runtime rule or baseline changed.

### Restore the regular sibilant suffix on doubled-z stems (2026-10-22)

Rules-only morphology treated `quizzes` and `whizzes` as if the stem ended in
an extra schwa, yielding `/əz/` instead of composing the root's final `/z/`
with the regular `/ɪz/` suffix. A general doubled-`z` inflection path now
predicts the stem and applies the existing sibilant allomorph; post-phonotactic
schwa reduction preserves `/ɪ/` for this spelling class. Cambridge confirms
the root *quiz* `/kwɪz/`, and Oxford gives *buzzes* `/ˈbʌzɪz/` ([Cambridge quiz](https://dictionary.cambridge.org/pronunciation/english/quiz), [Oxford buzz](https://www.oxfordlearnersdictionaries.com/definition/english/buzz_1)).

Paired tests cover six doubled-z roots, their plural/third-person forms, noun
and verb POS, sentence tokenization, and six neighboring `-es` controls. The
only changed predictions among the frozen dictionary parity rows were
`quizzes` and `whizzes`; both now agree with the pinned CMU `/ɪz/` reading.
On the fixed 6,990/3,617 populations, strict is 5,454/6,990 (+1) and
2,943/3,617 (unchanged); lenient remains 6,396/6,990 and 3,367/3,617.
Parity is 94,787/100,804 strict (+2) and 100,691 lenient (unchanged).
Stress-aware phonemic is 54,778/90,308 (unchanged), public CMU is 4,745/5,000
default and 4,178/5,000 rules-only (both unchanged), context remains
88/108, 85/108, 53/108, 49/108, and homographs remain 1,455/1,615. The rebuilt
exception table re-pinned 528 dependency-affected entries and retained five
net-positive regressions already reported by the builder. All 398 test suites
(7,103 tests), typecheck, and diff check passed. This is below the normal
70-word common-strict commit minimum; no baseline was changed and the existing
worktree batch remains uncommitted.

The follow-up default learner screen accepted 21 candidates across ten
spelling-family folds, but none passed its legacy fix/break filter; pooled
held-out strict therefore remained at a 75.31% mean. Route diagnosis confirms
morphology is contributing substantial coverage (removing it falls to
4,703/6,990 strict; the unsplit alternative is 4,590/6,990), so the next
search should focus on conditional morphology and stem evidence rather than
bypassing the route. Report: `/tmp/phonemize-zzes-20261022/learn/cv-common-report.json`.

### Longer common-word candidate screen (2026-10-22)

Repeated the family-held-out rule search with `--include-long` to check whether
the default 12-character cutoff hid transferable rules. The diagnostic scope
was 7,097 common testable words (107 more than the fixed 6,990-word acceptance
population), with 5,116 rule-path cases. Across ten spelling-family folds, 20
rules were selected and none passed the existing train-only fix/break filter;
applying only passing rules therefore left held-out strict unchanged at a
75.08% mean. The recurring unstressed `/ɪ/` to `/ə/` candidate fixed `credit`,
`edit`, and `Medicare`, but broke `media`, `median`, and `medium`; it is not a
safe general rule. No runtime or reference changed. Report:
`/tmp/phonemize-long-families-20261022/cv-common-report.json`.

Issue #28's apostrophe regressions remain in
`__tests__/en-apostrophe-words.test.ts`: they cover O'Reilly Media, curly and
straight apostrophes, and possessive forms without a brand-specific runtime
map. The user's clarification that O'Reily was illustrative does not change
that class-level coverage.

### Rejected blanket `-ogs` plural stem retention (2026-10-22)

Preserving the rule-path stem before final plural/third-person `-s` improved
the fixed common and top-5,000 strict counts by one each (5,455/6,990 and
2,944/3,617), but reduced both public CMU measurements by one: default
4,744/5,000 and rules-only 4,177/5,000. The loss was `blogs`, whose pinned
CMU reading is `/blɔɡz/`, while the shared stem rule selected `/ɑ/`; the
unmodified runtime reading remains correct. Since all tracked metrics must be
nondecreasing, the candidate was removed. The paired trial test was removed
with it; no dictionary, baseline, or runtime change resulted. Frozen replay
reports are under `/tmp/phonemize-ogs-20261022/`.

### Low-support family-fold screen (2026-10-22)

Repeated the deterministic common-word learner with `min-support=2` and
100-rule capacity to test whether the prior support threshold hid smaller
spelling families. Across 10 spelling-family folds, 716 candidates were
selected and 142 distinct readings appeared in at least one fold; none passed
the unchanged train-only filter. Applying all selected candidates reduced
held-out strict from a 75.31% mean to 74.14%; applying only filter-passed
candidates left it at 75.31%. The low-support candidates overfit small lexical
clusters such as *key/Keith* and `-age` words with mixed readings
(*damage, image*), so no runtime change was made. Report:
`/tmp/phonemize-learner-ms2-strict-single-20261022/cv-common-report.json`.

### Rejected weak-vowel `-cket` plural override and structural candidates (2026-10-22)

A two-syllable `-ckets` rule temporarily improved four full-dictionary plural
rows against the pinned IPA-Dict table, but it also changed the OOV forms
`lockets` and `wickets`. Cambridge gives US /ɪ/ in the bases
[locket](https://dictionary.cambridge.org/us/pronunciation/english/locket),
[wicket](https://dictionary.cambridge.org/us/pronunciation/english/wicket),
[bracket](https://dictionary.cambridge.org/us/pronunciation/english/bracket),
and [thicket](https://dictionary.cambridge.org/us/pronunciation/english/thicket);
there was no independent authoritative support for generalizing the plural
schwa. The rule and its trial tests were removed. This candidate did not change
either fixed common-word strict count.

A fresh structural TRAIN-only screen selected 46 rules across ten
spelling-family folds; none passed the unchanged affected-word, fix-rate, and
top-5,000 loss filter. Applying all selected rules reduced held-out strict
from 3,835 to 3,810/5,092 and lenient from 4,576 to 4,558. No rule or
reference changed. Report: `/tmp/phonemize-rule-corrections/cv-common-report.json`.

### Common-word `here` reference conflict (2026-10-22)

The rules-only output for `here` is `/ˈhɪɹ/`, matching Cambridge US
[/hɪr/](https://dictionary.cambridge.org/us/pronunciation/english/here),
while the pinned IPA-Dict row is `/ˈhiɹ/` and the CMU row is `HH IY1 R`.
The shipped dictionary therefore returns `/ˈhiɹ/` to preserve the public CMU
gate, while the rules evaluator counts its Cambridge-supported output as
wrong. No prediction or reference was changed: switching the shipped reading
to `/ɪ/` would lose a CMU match under the unchanged single-reading contract.
Treat this as a source-variant conflict, not a rule gain; a future reference
audit would need a versioned accepted-variant contract and unchanged-snapshot
re-scoring.

### Behavior-neutral rule-module compression (2026-10-22)

The five-module count had reached 3,400 code lines (G2P 1,151), crossing both
the retained 3,395 total and 1,150 G2P triggers. Merged equivalent stress
branches and repeated morphology guards, and consolidated related stress
conditions without changing their tests or return values. A first attempt to
merge adjacent phoneme regexes was reverted: downstream handling keys on
`pattern.source`, and that edit caused 743 test failures. The final refactor
preserves those regex identities.

The final count is 3,394 lines (G2P 1,150, syllabify 1,702, postlex 496,
morph-table 20, morph-parser 26). The 1,296,330-row `snapshot-dump.ts` output
is byte-identical to the pre-refactor snapshot (SHA-256
`ca92e454629cf939300f5e452ba92789f45f3897cb391672abbeb950123b8330`). The
focused regression set passed 72/72, the full suite passed 7,103/7,103 across
398 suites, typecheck and `git diff --check` passed. This is neutral
compression: accuracy baselines and runtime data were not changed.

### Audited `-tribution` and `-ical` mismatch families (2026-10-22)

The fixed common reference marks `contribution` and `distribution` with /ə/ in
the unstressed vowel before /bju/, while current rules predict /ɪ/. Cambridge
US lists /trɪˈbjuː/ in both
[contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution)
and [distribution](https://dictionary.cambridge.org/us/pronunciation/english/distribution).
Changing both to `/ə/` to match the fixed reference would move them away from
this authoritative AmE reading, so no rule was adopted.

The common `-ical` cluster is mixed as well. Cambridge gives /ˈmedɪkəl/ and
/ˈklɪnɪkəl/ for [medical](https://dictionary.cambridge.org/us/dictionary/english/medical)
and [clinical](https://dictionary.cambridge.org/us/dictionary/english/clinical),
supporting the current `/ɪ/` predictions even though the fixed reference has
/ə/. A separate check found the same `/ɪ/` in Cambridge US for
[chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical),
[hypothetical](https://dictionary.cambridge.org/us/pronunciation/english/hypothetical),
[numerical](https://dictionary.cambridge.org/us/pronunciation/english/numerical),
[biblical](https://dictionary.cambridge.org/pronunciation/english/biblical),
[practical](https://dictionary.cambridge.org/us/dictionary/english/practical),
[radical](https://dictionary.cambridge.org/us/pronunciation/english/radical),
and [typical](https://dictionary.cambridge.org/us/dictionary/english/typical),
where the fixed references also have `/ə/`. For
[political](https://dictionary.cambridge.org/us/pronunciation/english/political),
Cambridge US gives /pəˈlɪtəkəl/, supporting the fixed reference's `/ə/` rather
than the current `/ɪ/`. This confirms that spelling suffix alone does not
license one vowel across the family. These source conflicts did not change
predictions, references, or scores.

### Weak final vowel in the bound `-medicine` root (2026-10-22)

The rules path retained `/ɪ/` in the final unstressed `-cine` slot of
*medicine* and compounds ending in the root. A narrow root-aware rule now
reduces that final `/ɪ/` to `/ə/` only for unstressed `ci` + final `ne` in
spellings ending `medicine`; it leaves *medicinal*, *vaccine*, *plasticine*,
and other `-cine` roots unchanged. Cambridge US confirms `/sən/` in
[medicine](https://dictionary.cambridge.org/us/pronunciation/english/medicine)
and [telemedicine](https://dictionary.cambridge.org/pronunciation/english/telemedicine),
while [medicinal](https://dictionary.cambridge.org/pronunciation/english/medicinal)
retains its distinct `/sɪn/` sequence.

The frozen 1,296,330-row comparison changed exactly four rules outputs:
*medicine*, *medicine's*, *telemedicine*, and *genemedicine*. The first,
second, and fourth now match the pinned reference; *telemedicine* remains a
strict mismatch because the reference differs in the earlier root vowels, but
its final vowel now matches the authoritative US pronunciation. There were
three full-dictionary strict wins and no losses, and no lenient-count change.
After `build-dict`, common strict rose 5,454→5,455/6,990 and top-5,000 rose
2,943→2,944/3,617; lenient counts were unchanged. Public CMU rules rose
4,178→4,179/5,000; default remained 4,745/5,000. Runtime parity remained
94,787/100,804 strict and 100,691 lenient; context and homograph gates also
remained unchanged at 88/85/53/49 and 1,455/1,615. The five-module count is
3,395 (G2P 1,150, syllabify 1,703, postlex 496, morph-table 20,
morph-parser 26), at the retained cap. Frozen snapshots and exact trial rows are
under `/tmp/phonemize-next-release/medicine-*`. This is an accumulating gain, not
the 90% release target; no baseline was refreshed or commit made.

### Frozen common-word re-screen after `-medicine` (2026-10-22)

The rebuilt common set is 5,455/6,990 strict (78.04%) and the top-5,000 slice is
2,944/3,617 (81.39%); lenient remains 6,396 and 3,367 respectively. A fresh
10-fold spelling-family structural search accepted 40 fold-local corrections,
but none passed the existing held-out filter in any fold. The top recurring
proposals were unstressed `ɪ→ə` before `l` or after `d`; their cross-fold losses
prevented adoption. This search is diagnostic only and does not justify a broad
rule.

Current mismatch clusters also fail a quick uniform-suffix screen: the common
reference marks many `-age` endings with schwa, while Cambridge US gives /ɪ/
for both [package](https://dictionary.cambridge.org/pronunciation/english/package)
and [courage](https://dictionary.cambridge.org/us/pronunciation/english/courage),
so broad schwa insertion would move those standard readings away from the source.
The `-ion` and `-ity` clusters mix stress movement, root vowels, and reductions.
No shared suffix correction was applied. The
authoritative US entries for [one](https://dictionary.cambridge.org/us/dictionary/english/one)
and [once](https://dictionary.cambridge.org/us/dictionary/english/once) support
/wʌn/ and /wʌns/, but the rules-only errors are confined to those exact free
forms; existing compounds and contrasting `-one` words make a spelling-only
exception unsafe, so no whole-word rule was added.

The user's clarification confirms that *O'Reily* was illustrative and the
company is *O'Reilly Media*. Issue #28 remains covered by the existing
apostrophe regression suite for the brand, sentence tokenization, possessive,
and straight/curly apostrophes; no brand-specific mapping is needed.

### Two-syllable `-rect` stress and direct-root batch (2026-10-22)

The rules assigned initial stress to the two-syllable `direct` and `erect`,
while standard US dictionary readings place primary stress on the second
syllable. A shared `-rect(s)` stress condition now covers these roots and
regular `-s` forms; it also preserves the already-correct second-syllable
reading of `correct`. It leaves three-syllable `indirect` and `redirect` on
their existing routes. The test set checks those paired roots, inflections,
and both noun and verb uses of `direct` in sentence context.

Against a same-build 1,296,330-row snapshot with the previous stress condition,
the candidate changed 18 rows: the two roots, `directs`/`erects`, and their
tested regular derivations. It introduced no changes to `indirect`, `redirect`,
or the explicit `discrete` control. The full before/after snapshots are
`/tmp/phonemize-next-release/rect-stress-rebuilt-baseline-20261022.tsv` and
`/tmp/phonemize-next-release/rect-stress-final-20261022.tsv`; a separate
pre-build candidate comparison showed ten rows also changed when the generated
exception tables were rebuilt, so those build effects were excluded from the
rule delta.

After rebuilding, the stress-aware headline was 54,784/90,308 and exact IPA was
45,780, both +2 from the same-build previous-rule run. The full-dictionary
stress-stripped result was 62,668/105,065 strict and 83,725 lenient; common
strict/lenient remained 5,459/6,397 of 6,990, and top-5,000 remained
2,947/3,368 of 3,617. Runtime parity was 94,787/100,804 strict and
100,691/100,804 lenient. Public CMU default stayed 4,745/5,000; rules stayed
4,179/5,000, unchanged from the prior run and still below its legacy 90% floor.
Context IPA stayed 88/85/53/49 for default-auto/default-known/rules-auto/
rules-known, and homographs stayed 1,455/1,615. All 400 test suites (7,129
tests) and typecheck passed. These accumulated measurements are still below
the 90% common strict target; baselines were not refreshed.

This rule took the five-module count to 3,396, so the neutral compression
trigger applied. Merged the adjacent predicates that share the same
`length - 2` stress result. The 1,296,330-row candidate and compressed snapshots
are byte-identical (SHA-256
`67c9ffc6ce9ef8bc375496b9831db9580244a9696d7d9e51b4c8160df1df8e0a`). The
five-module count is back at 3,395: G2P 1,150, syllabify 1,703, postlex 496,
morph-table 20, morph-parser 26. The direct-root, primary-stress, and weak-root
tests passed 128/128; typecheck and `git diff --check` passed.

### Strict-target stress counterfactual screen (2026-10-22)

The current common target remains 5,459/6,990; reaching 6,292 requires 833
additional strict wins, and the top-5,000 slice needs 309. The latest
10-fold structural learner again accepted 40 candidates but none passed its
fixed held-out filter. A separate real-pipeline stress intervention over the
6,990 common set found one tempting two-syllable final-`o` group with four
strict wins and one loss: *demo*, *expo*, *promo*, and *retro* improve, while
*Reno* loses because shifting stress also changes its first vowel. On the full
dictionary the same group also breaks *repo*. This is evidence that stress
and vowel quality need to be diagnosed together; a blanket `-o` stress rule
was rejected. The other inspected two-syllable final-`a` group had no common
strict wins. Full counterfactual rows and input hashes are in
`/tmp/phonemize-stress-diagnosis-20261022/` and
`/tmp/phonemize-stress-all-20261022/`.

The isolated common scorer calls `predict(word)` without POS or sentence
context. Cambridge distinguishes citation and weak forms for function words:
US [*of*](https://dictionary.cambridge.org/pronunciation/english/of) has weak
/əv/ and strong /ɑv/, while [*from*](https://dictionary.cambridge.org/us/pronunciation/english/from)
has weak /frəm/ and strong /frʌm/. These examples explain some fixed-reference
misses but do not license changing the scorer or replacing sentence context
with guessed weak forms. The target and denominator remain unchanged.

### Fresh common report and dispatcher ablations (2026-10-22)

`node --require tsx/cjs scripts/evaluate.ts --subset common --cluster` reproduced
5,459/6,990 strict and 2,947/3,617 top-5,000 strict. Replaying all 91 active
postlex rules against the real common-word pipeline found no removal with a
positive strict balance. The all-word morphology/compound route replay verified
107,643 outputs: removing morphology reduced strict from 64,006 to 57,893, and
the unsplit alternative to 54,886. Its per-handler bypasses also had no
strict-positive, non-regressing candidate; the only positive strict balance
was `transmittal` (+1) paired with a lenient loss and a changed `referral`
output. These ablations do not justify removing or bypassing a production
route. The next candidate must add a supported spelling/morphology class and
show wins and losses in the actual dispatcher, followed by all fixed gates.
Evidence: `/tmp/phonemize-postlex-diagnosis/results.json` and
`/tmp/phonemize-route-diagnosis/report.json`.

### Rejected final `-oth` long-vowel generalization (2026-10-22)

A final-rime counterfactual changed `/ɑθ/` or `/ɔθ/` to `/oʊθ/` for words
ending in `-oth`. It fixes the common word *both* and three more IPA-Dict
rows, but across the full dictionary it yields four strict wins and 15 strict
losses; the common cohort gets one win and no losses. The top-5,000 slice gets
only the single *both* win. Cambridge US independently gives `/boʊθ/` for
[*both*](https://dictionary.cambridge.org/pronunciation/english/both), but
`/slɑθ/` for [*sloth*](https://dictionary.cambridge.org/pronunciation/english/sloth)
and `/klɑθ/` for [*cloth*](https://dictionary.cambridge.org/pronunciation/english/cloth),
so the written ending does not determine the vowel. The full-dictionary strict
regressions fail the adoption gate; no runtime rule or reference was changed.

### Regular doubled-L `-all` plurals and release-gate refresh (2026-10-22)

The `-s` inflection route left the short `/æ/` in doubled-L `-all` stems even
though the existing pre-L rule assigns `/ɔ/` to the stem: `calls`, `balls`,
`falls`, `walls`, `halls`, `malls`, `smalls`, and `stalls` therefore disagreed
with their singular vowel. Extend that existing general rime condition to the
exact `alls` frame. The regression also pins `call/called/calling`, the
non-doubled-L `pal/pals` route, and complete sentence tokenization. No word map
or runtime name list was added. Cambridge's US entries independently support
the `/ɔ/` stem vowel in [call](https://dictionary.cambridge.org/us/dictionary/english/call)
and [falls](https://dictionary.cambridge.org/us/dictionary/english/falls).

The frozen 1,296,330-row prediction dump changed only this spelling family:
the `-alls` forms, their regular derivatives and two compounds ending in
*Falls*. The rebuilt output introduced no additional changes; the neutral
one-line compression snapshot is byte-identical. Full evidence is under
`/tmp/phonemize-all-s-final-plural-20261022/`. The full dictionary strict score
rose from 62,668 to 62,669/105,065; common strict remained 5,459/6,990 and
top-5,000 remained 2,947/3,617. Public CMU accuracy rose from 4,745 to
4,749/5,000 in default mode and from 4,179 to 4,183/5,000 in rules mode.
Stress-aware phonemic accuracy is 54,785/90,308; runtime parity is
94,787/100,804 strict and 100,691 lenient. Context IPA is 88/85/53/49 across
default-auto/default-known/rules-auto/rules-known; homographs are 1,455/1,615.
All tracked metrics are nondecreasing against their immediate before-run.

The accumulated English-subset strict score is now 119 words (+1.70 points)
above the 5,340/6,990 committed baseline, meeting the +70-word qualifying
improvement threshold. After all gates passed, refreshed the common, parity,
stress-aware, context-IPA and homograph baselines. The explicit 90% common
strict target is still open. The focused apostrophe suite continues to verify
O'Reilly Media, its possessive, sentence context, and straight/curly
apostrophes; no brand-specific pronunciation mapping is needed. The full Jest
run passed 401 suites / 7,139 tests, typecheck passed, and the five English
rule modules remain at 3,395 code lines.

### Rejected weak second-syllable `-ate` reduction (2026-10-22)

Cambridge US supports `/ˈklaɪmət/` for [climate](https://dictionary.cambridge.org/us/pronunciation/english/climate)
and `/ˈsenət/` for [senate](https://dictionary.cambridge.org/us/pronunciation/english/senate).
A trial converted an unstressed, single-onset second-syllable open `a` before
final `-te` to schwa, while preserving secondary-stressed controls such as
`candidate`, `estimate`, `navigate`, and `delicate`. Although the two intended
words improved, the full common set fell from 5,459 to 5,450/6,990 strict and
from 6,397 to 6,388 lenient; top-5,000 fell from 2,947 to 2,945 strict and
3,368 to 3,366 lenient. The frozen 1,296,330-row snapshot changed 617 words,
including verbs and `-ation` derivatives that share the syllable frame. The
class is rejected and its runtime edit and trial tests were removed. Evidence
is under `/tmp/phonemize-final-ate-20261022/`.

### Common-word mismatch route triage (2026-10-22)

A fresh trace-cluster pass still places the largest direct common-word mismatch
buckets at the broad initial-vowel rules: `i` (187), `a` (135), `e`→`ɪ` (72),
and `e`→`ɛ` (70). Their examples mix foreign names, abbreviations, citation
stress and genuinely different word families; no single grapheme change is
supported by that aggregation. Whole-dictionary vowel diagnosis reports 4,099
`ʌ`→`ə` substitutions, but the fixed scorer deliberately normalizes that pair,
so changing it cannot improve strict common accuracy. Structural counts also
mix foreign names and pronunciation-reference conventions. No source rule or
reference was changed from these summaries; candidate adoption still requires
actual-pipeline win/loss replay and every fixed gate.

### Stress-class replay: final `-a` names and `-ure` controls (2026-10-22)

A full-dictionary real-pipeline stress screen surfaced two apparent classes.
Moving all two-slot final-`a` words to initial stress changes 38 entries and
scores strict +9/-0, but lenient +14/-4; only one changed word is in the fixed
common cohort, and the gains are mostly personal-name spellings. A narrower
shape (`be|de|re|pre` plus one consonant and final `a`) scores +8/-0 on the
changed full-dictionary rows, but still has no common strict gain and lacks an
independent dictionary basis for a productive class. It was not adopted.
Moving two-slot words with initial `u` and final `-ure` to second-slot stress
repairs `furniture` against the pinned source but breaks the standard primary
stress in `culture`, `future`, `sculpture`, and `structure`; it is not a
pronunciation improvement. Exact snapshots and all win/loss rows are under
`/tmp/phonemize-stress-all-followup-20261022/results.json`.

### Follow-up candidate audit: family cross-validation and postlex routes (2026-10-22)

The temporary weak-final-`a` stress candidate was removed: its wins were mainly
personal-name spellings and it had no authoritative basis as a productive
English class. The frozen common rules scores remain 5,459/6,990 strict and
6,397/6,990 lenient; top-5,000 remains 2,947/3,617 strict and 3,368/3,617
lenient.

Replayed the train-only learner with spelling-family folds for grapheme and
structural features, plus a distance objective. None of 15, 40, or 11 accepted
fold candidates passed the existing train-only filter in any fold. Applying
all structural candidates anyway lowered held-out strict from 3,840 to 3,815.
Full-dictionary postlex ablation found no rule whose removal gains common
strict with zero strict losses. The only morphology route with a strict win
and no strict loss was `transmittal` (+1), paired with a lenient loss and a
changed `referral`; it remains rejected. Reports are under
`/tmp/phonemize-learn-rules-20261022/`,
`/tmp/phonemize-learn-rules-structural-20261022/`,
`/tmp/phonemize-learn-rules-distance-20261022/`,
`/tmp/phonemize-postlex-all-20261022/`, and
`/tmp/phonemize-routes-all-20261022/`.

Authoritative Cambridge US entries confirm `/ˈkem.ɪ.kəl/` for
[*chemical*](https://dictionary.cambridge.org/pronunciation/english/chemical)
and `/ˈdʊr.ɪŋ/` for
[*during*](https://dictionary.cambridge.org/us/pronunciation/english/during),
while the pinned CMU-derived source uses different reduced-vowel/yod variants.
These are reference-convention disagreements, not adopted rule gains; no gold,
runtime table, or baseline was changed. Issue #28's O'Brien/O'Reilly Media
suite still passes all 24 tests, and typecheck passes.

### Frozen common-error replay and issue clarification (2026-10-22)

Re-ran `node --require tsx/cjs scripts/evaluate.ts --subset common --cluster`:
the unchanged cohort remains 5,459/6,990 strict and 6,397/6,990 lenient; the
top-5,000 slice remains 2,947/3,617 strict and 3,368/3,617 lenient. The direct
trace cluster report is only a localization aid: its largest groups are
single-letter `i`, `a`, and `e` choices and contain many names, loanwords, and
source-convention disagreements, so their counts are not candidate-class
evidence. The held-out family replay and paired-loss screens above remain the
adoption evidence; this pass identified no new suffix or morphology class to
advance.

The user clarified that **O'Reilly Media** is the real brand example and
`O'Reily` was illustrative only. The focused issue #28 suite passes 24/24,
covering the brand in sentences and possessives with straight and curly
apostrophes, and `yarn typecheck` passes. GitHub issue retrieval was unavailable
in this run; the clarification and existing regression are sufficient to
retain the issue behavior without adding a brand-specific rule.

### Rejected sibilant plural-vowel change (2026-10-22)

A trial changed the existing final `-es` postlex repair from `/əz/` to `/ɪz/`.
The fixed common metrics remained 5,459/6,990 strict and 2,947/3,617 top-slice
strict. In the 1,296,330-row frozen replay it changed only 100 synthetic
morphology outputs, including doubly inflected forms such as `classesly` and
`boxesness`; it changed no `dict` or `rules` rows. The candidate therefore
does not address the release gap and was reverted. Trial snapshot:
`/tmp/phonemize-es-allomorph-trial-20261022.tsv`.

### Rejected closed-first-syllable final-`-o` stress generalization (2026-10-22)

A fresh real-pipeline stress counterfactual rechecked all 6,990 common words
(5,081 allowed stress interventions). The only apparently non-regressing
strict candidate touching a non-name cohort was penultimate stress for two-slot
final-`-o` words with a closed first slot: it fixes *expo* (+1 strict) but also
changes *undo* and *unto* without fixing them. The shape therefore does not
encode the stress rule: Cambridge US gives *expo* /ˈekspoʊ/ and *undo*
/ʌnˈduː/. A narrower `expo` branch would be a whole-word exception, so neither
candidate was adopted. Full counterfactual rows and hashes are in
`/tmp/phonemize-stress-diagnosis-followup-20261022/results.json`; sources:
[Cambridge expo](https://dictionary.cambridge.org/pronunciation/english/expo)
and [Cambridge undo](https://dictionary.cambridge.org/us/pronunciation/english/undo).

### Frozen release-gate recheck (2026-10-22)

Re-ran the common, public-CMU, context-IPA, homograph, and runtime-parity gates
on the current worktree. Results match their committed baselines: common
5,459/6,990 strict and 2,947/3,617 top-slice strict; public CMU default
4,749/5,000 and rules 4,183/5,000; context default-auto/default-gold/rules-
auto/rules-gold 88/85/53/49 of 108; homographs 1,455/1,615; parity
94,787/100,804 strict and 100,691 lenient. The release's default-context,
homograph, and default-CMU targets pass; the rules-only CMU 90% legacy floor
and both requested common strict targets remain open. The current table above
is refreshed from these runs. The sibilant and stress trials remain reverted.

As a diagnostic only, compared the same fixed common words against every
variant in the pinned CMUdict source. Rules output matches an additional CMU
variant for 192/6,990 words and 117/3,617 top-slice words; this would yield
5,651 and 3,064 strict matches under that alternate-reference rule, still well
below 90%. The fixed IPA-Dict gold, denominator, and release gates were not
changed. The per-word list, source hashes, and scoring recipe are in
`/tmp/phonemize-common-cmudict-alt-diagnostic-20261022.json` (SHA256
`69f1de521891318566fa773343d977f798f896d45626347d4adbb4032a25c4f1`).

### Vowel-reduction and `legis-` class audit (2026-10-22)

On the same frozen 6,990-word cohort, 175 strict misses differ by exactly one
`ɪ`→`ə` phone after the existing stress/STRUT normalization; 66 already match
another pronunciation variant in pinned CMUdict. This is a diagnostic, not a
gold change or score adjustment. The 109 remaining rows do not form a safe
single spelling rule: common suffix counts peak at `-age` (18), `-ical` (10),
`-tion` (8), and `-ist` (7), and each combines different roots and stress
patterns. The complete list, frozen-input hashes, and recipe are in
`/tmp/phonemize-common-single-i-to-schwa-20261022.json` (SHA256
`c7afe4a1e13f7eec874187b445882f2a7c307139cc93043138498f36f987264e`).
This is especially clear for `-age`: Cambridge US gives /ɪdʒ/ in
[*package*](https://dictionary.cambridge.org/pronunciation/english/package),
[*cottage*](https://dictionary.cambridge.org/us/pronunciation/english/cottage),
[*image*](https://dictionary.cambridge.org/us/pronunciation/english/image),
and [*village*](https://dictionary.cambridge.org/us/pronunciation/english/village),
while the fixed IPA-Dict gold uses /ədʒ/ for these rows. That difference is
source-reference evidence and explicitly does not authorize a blanket schwa
reduction in runtime.

The `legis-` family is not a uniform correction class either. Cambridge US
records schwa in [*legislation*](https://dictionary.cambridge.org/us/pronunciation/english/legislation),
[*legislator*](https://dictionary.cambridge.org/pronunciation/english/legislator),
and [*legislature*](https://dictionary.cambridge.org/pronunciation/english/legislature),
but the fixed cohort has *legislate* and *legislating* matching its `ɪ` gold,
and other derived rows split in both directions. A broad root-based schwa
rewrite would therefore need more morphology-specific conditions than the
evidence supports. No pronunciation rule, dictionary expectation, or baseline
was changed in this audit.

### Secondary `re-` before selected `-ution` stems (2026-10-22)

Added one conditional spelling/stress class: secondary-stressed `re-` changes
from `/i/` to `/ɛ/` before `-solution`, `-volution`, `-stitution`, and
`-tribution` families. Cambridge US records `/ɛ/` for
[*resolution*](https://dictionary.cambridge.org/us/pronunciation/english/resolution),
[*revolution*](https://dictionary.cambridge.org/us/pronunciation/english/revolution),
[*restitution*](https://dictionary.cambridge.org/dictionary/english/restitution),
and [*retribution*](https://dictionary.cambridge.org/pronunciation/english/retribution).
The paired controls `reconstitution`, `reconstruct`, `redistribution`,
`resolve`, and `revolve` keep their existing readings. The regression covers
plural, adjective, and verb derivations without adding word-specific runtime
entries.

On the unchanged 6,990-word non-foreign cohort, strict rose from 5,459 to
5,461 (78.13%); lenient stayed 6,397. The top-5,000 eligible slice rose from
2,947 to 2,949 strict, with lenient unchanged at 3,368. The 90% strict target
remains open. Public CMU default is 4,749/5,000; rules-only is 4,185/5,000
(up two from 4,183, below its legacy 90% floor). Runtime parity stayed
94,787/100,804 strict and 100,691 lenient; context stayed 88/85/53/49 of 108;
homographs stayed 1,455/1,615. Full tests (402 suites, 7,140 tests) and
typecheck pass. The 10-fold structural learner found 14 accepted readings,
but none passed its train-only legacy filter; no other candidate was adopted.

The frozen full-pipeline replay changed six rule-path entries before rebuild.
After dictionary/exception rebuild, 42 morphology-path replay entries also
changed, mostly generated suffix combinations; these are retained in the
snapshot for review. Frozen snapshots and the learner report are under
`/tmp/phonemize-post-re-ution-candidate-20261022.tsv`,
`/tmp/phonemize-post-re-ution-rebuilt-20261022.tsv`, and
`/tmp/phonemize-learn-structural-after-re-ution-20261022/`.

### Authoritative replay of high-ranked conditional candidates (2026-10-22)

The family-held-out learner's structural candidate `tr`, slot three from the
end, unstressed `/ɪ/→/ə/` had 27 training fixes/0 breaks and 18 top-slice
fixes/0 breaks when pooled across folds. Dictionary review rejects it as a
pronunciation rule: Cambridge US records `/ɪ/` for *attribute* (both noun and
verb), *contribution*, and *tremendous*, exactly the current G2P output; the
CMU-derived source's schwa is not an adequate basis to change those standard
readings. *Intrinsic* supplies a stressed `/ɪ/` contrast. Sources:
[attribute](https://dictionary.cambridge.org/us/pronunciation/english/attribute),
[contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
[tremendous](https://dictionary.cambridge.org/us/pronunciation/english/tremendous),
[intrinsic](https://dictionary.cambridge.org/us/pronunciation/english/intrinsic).

A separate `m` between written `i` letters `/ɪ/→/ə/` proposal repairs *similar*
and *limit* against fixed gold, but Cambridge US gives `/ə/` in *similar* and
`/ɪ/` in *limit*. The spelling context therefore fails as a class even though
the first word is a real standard-backed miss; no whole-word exception was
added. Sources: [similar](https://dictionary.cambridge.org/us/pronunciation/english/similar),
[limit](https://dictionary.cambridge.org/us/pronunciation/english/limit).
Both candidates were rejected before runtime replay because their learned
targets conflict with standard US evidence. In that earlier pass, the common
gate remained 5,459/6,990 strict and 2,947/3,617 top-slice strict on the then-
unchanged runtime. The later secondary-`re-` candidate and its measurements
are recorded above.

### Post-candidate search and `institution` reference check (2026-10-22)

After the secondary-`re-` change, reran family-held-out structural learning
with both strict and distance objectives. Strict accepted 40 fold-level
readings and distance accepted 20; none passed the train-only paired-loss
filter. Applying all structural strict candidates reduced held-out strict
from 3,842/5,092 to 3,817/5,092. The distance search likewise yielded no
deployable class. Route diagnosis on the full fixed cohort confirms removing
morphology drops strict from 5,461 to 4,711; no morphology bypass is a viable
shortcut. Reports are under
`/tmp/phonemize-learn-structural-after-re-ution-20261022/`,
`/tmp/phonemize-learn-distance-after-re-ution-20261022/`, and
`/tmp/phonemize-routes-after-re-ution-20261022/`.

The common strict miss *institution* looks like a candidate for preserving
`/ɪ/` in `-stitution`, but Cambridge US explicitly gives `/ə/` in
[*institution*](https://dictionary.cambridge.org/pronunciation/english/institution),
[*institute*](https://dictionary.cambridge.org/us/pronunciation/english/institute),
[*constitution*](https://dictionary.cambridge.org/us/pronunciation/english/constitution),
and [*substitution*](https://dictionary.cambridge.org/us/pronunciation/english/substitution).
The current rules-only `/ə/` is therefore standard-backed; the pinned
IPA-Dict-derived expectation `/ɪ/` for *institution* is a reference mismatch,
not a pronunciation gain. No rule or expectation was changed. The candidate
search remains focused on other independently verified classes. Added a
rules-only regression for these Cambridge US readings in
`__tests__/en-bound-ary-and-ute.test.ts`; the focused suite (9 tests),
typecheck, and `git diff --check` pass.

### Expanded structural candidate screen (2026-10-22)

Ran the previously unused `--expanded` local/stress interaction templates on
the full 6,990-word cohort with ten spelling-family folds. The 54 fold-level
distance candidates produced 12 distinct readings, but none passed the
train-only paired-loss filter. One frequent proposal changes weak `/ɪ/` after
`t` to `/ə/` before `ic` in a penultimate slot; its apparent fixes include
*notice*, but Cambridge US gives `/ɪ/` in
[*notice*](https://dictionary.cambridge.org/us/pronunciation/english/notice).
Cambridge US does list `/ə/` for the weak `ti` in
[*political*](https://dictionary.cambridge.org/pronunciation/english/political),
but also lists `/ɪ/` in *notice* and its other controls, so that spelling
interaction is not a class rule.

A second proposal changes unstressed `tin` from `/tɪn/` to `/tən/` and appears
to repair *satin*, but the same candidate affects *bulletin* and *Latin*;
Cambridge US gives `/tɪn/` for both
([bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin),
[Latin](https://dictionary.cambridge.org/us/dictionary/english/latin)).
It also conflicts with Cambridge's reduced US *satin* and elided-vowel US
*platinum*. Neither proposal was adopted. The expanded report is at
`/tmp/phonemize-learn-expanded-after-re-ution-20261022/`; common rules strict
remains 5,461/6,990 and top-slice strict 2,949/3,617.

### Triple-context distance candidate screen (2026-10-22)

Ran the distance learner with expanded features and triple-context templates
across the same ten spelling-family folds. It accepted 84 fold-level readings
(21 distinct candidates), but none passed the train-only paired-loss filter.
Applying all accepted candidates reduced held-out strict from 3,842/5,092 to
3,825/5,092 and held-out lenient from 4,577/5,092 to 4,574/5,092, while edit
distance worsened from 2,131 to 2,152. The most frequent proposal changes
unstressed `t` `/ɪ/→/ə/` before `ic` in a penultimate slot; it breaks
*erotica* and *Vatican*, in addition to conflicting with the Cambridge US
reading of *notice* recorded above. No candidate was adopted. Full replay,
fold decisions and examples are in
`/tmp/phonemize-learn-triples-after-re-ution-20261022/cv-common-report.json`.
The runtime remains at 5,461/6,990 common strict and 2,949/3,617 top-slice
strict.

### Rejected `re- + u-` and `-ical` reductions (2026-10-22)

The direct-trace cluster suggested broad `/ɪ/→/ə/` repair for some `-ical`
words. Cambridge US instead records `/ɪ/` in
[*practical*](https://dictionary.cambridge.org/us/pronunciation/english/practical),
[*medical*](https://dictionary.cambridge.org/pronunciation/english/medical),
and [*typical*](https://dictionary.cambridge.org/us/pronunciation/english/typical).
Those pinned-reference disagreements do not justify a suffix rewrite.

The other apparent class was a syllable boundary in `re- + u-` words. On the
rules-only route, *reunion* currently produces `/ˈɹunjən/` against fixed gold
`/ɹiˈunjən/`. Cambridge US gives `/ˌriːˈjuː.njən/` for *reunion* and
`/ˌriː.juːˈnaɪt/` for *reunite*, so a general boundary could model the family;
however its necessary yod changes *reunion* away from the frozen reference and
does not repair any other member in either fixed common cohort. The candidate
therefore provides no qualifying gate gain and was not implemented. The
1,296,330-row pre-change snapshot is
`/tmp/phonemize-pre-reu-boundary-20261022.tsv`; metric gates and Cambridge
references were checked before deciding (SHA256
`6789513bb19db799d8c0ec848abc22c197b2733dce93701699f28f858c48b532`). No
reference, source table, runtime rule, or baseline was changed.

The high-ranked prefix candidates also do not support forcing the source's
schwa reading into the rules. Cambridge US gives initial `/ɪ/` in
[*reduction*](https://dictionary.cambridge.org/us/pronunciation/english/reduction),
[*regression*](https://dictionary.cambridge.org/us/pronunciation/english/regression),
and [*reflection*](https://dictionary.cambridge.org/us/pronunciation/english/reflection),
where the pinned rows use `/ə/` and the existing rules emit `/i/`. A blanket
rewrite to `/ə/` would move toward the benchmark string but away from these
authoritative readings; changing it to `/ɪ/` also earns no exact common strict
gain under the frozen scorer. The prefix class was not changed.

### Continued batch: `destination` stem alternation (2026-10-22)

The rules-only `destination` path used `/ɪ/` in the demoted root, unlike
standard US *destination* and *predestination*. The `/ɪ/→/ə/` alternation is
also supported by the free verb *destine*; paired rules-only controls retain
*destiny*, *destined* and unrelated `-ation` roots. The implementation handles
the `-stin + -ation` spelling class, with tests for plural, `pre-` composition
and controls. References: [destination](https://dictionary.cambridge.org/pronunciation/english/destination),
[destine](https://dictionary.cambridge.org/pronunciation/english/destine),
[predestination](https://dictionary.cambridge.org/pronunciation/english/predestination).

After the source rebuild, common rules strict improves by one, from 5,461 to
5,462/6,990, and top-slice strict from 2,949 to 2,950/3,617. Lenient scores
remain 6,397 and 3,368. Full strict is 62,674/105,065; runtime parity is
94,787/100,804; stress-aware headline/exact is 54,788/45,784; CMU default is
4,749/5,000 and rules-only 4,185/5,000; context remains 88/108 and homographs
1,455/1,615. No tracked metric fell. The 1,296,330-row snapshot changed only
the intended `destination` prediction before rebuilding; the three additional
post-build differences are synthetic `destination` suffix forms. Neutral
compression in the same accumulated work preserved byte-identical predictions;
the five-module code count is at the retained cap of 3,395.

The `variation` mismatch is independently confirmed by Cambridge US: *vary* is
/ˈver.i/ and *variation* is /ˌver.iˈeɪ.ʃən/. A trial that restored a y-final
stem from `-iation` repaired it, but rules-only controls showed that the same
spelling test misroutes *radiation* and *remediation*, whose roots are
*radiate* and *remediate*. Since spelling alone did not distinguish those
derivations without losses, the trial and its test were removed. No word map
or reference change was added. See [vary](https://dictionary.cambridge.org/us/pronunciation/english/vary),
[variation](https://dictionary.cambridge.org/dictionary/english/variation),
[radiation](https://dictionary.cambridge.org/pronunciation/english/radiation),
[remediation](https://dictionary.cambridge.org/pronunciation/english/remediation).

The follow-up ten-fold structural learner accepted 40 candidates, but none
passed its train-only paired-loss filter. Applying all accepted candidates
reduced held-out strict from 3,842/5,092 to 3,817/5,092, so none was replayed
as a runtime rule. A source audit also confirms that several apparent
`-ication` misses are scorer/reference dialect differences: Cambridge US uses
schwa in [syndication](https://dictionary.cambridge.org/us/dictionary/english/syndication),
[dedication](https://dictionary.cambridge.org/us/dictionary/english/dedication)
and [indication](https://dictionary.cambridge.org/us/dictionary/english/indication),
matching the current rules. For *negotiation*, Cambridge has both US `/nə/`
and `/nɪ/` transcriptions; the current `/nə/` is a documented standard
variant ([Cambridge US](https://dictionary.cambridge.org/us/dictionary/english/negotiation)).

The user's clarification identifies the actual brand as O'Reilly Media;
`O'Reily` was only an illustrative similar spelling. Existing Issue #28 tests
exercise “O'Reilly Media sells technical books” and brand possessives across
straight and curly apostrophes. No brand-specific mapping was added.

### Continued batch: `compare` → `comparison` (2026-10-22)

Rules-only *comparison* was re-syllabified as `/ˈkɑmpɝɪsən/` even though the
independently predicted verb *compare* is `/kəmˈpɛɹ/`. Reconstructing the
attested `-pare` stem for the productive `-parison` derivation yields
`/kəmˈpɛɹəsən/`, matching the pinned common reference. Cambridge's American
Dictionary lists the schwa variant, while its pronunciation page also records
a US `/ɪ/` variant for the second vowel; both preserve the same `compare`
root and stress pattern ([American Dictionary](https://dictionary.cambridge.org/us/dictionary/english/comparison),
[pronunciation page](https://dictionary.cambridge.org/us/pronunciation/english/comparison)).
Cambridge also supports the base [*compare*](https://dictionary.cambridge.org/pronunciation/english/compare)
and [*comparative*](https://dictionary.cambridge.org/pronunciation/english/comparative).
The entire current dictionary has one `-parison` item; paired rule tests cover
the plural and preserve `compare`, its inflections, `comparative`, `prison` and
`decision`.

After dictionary rebuild the common strict/lenient counts rose from
5,462/6,397 to 5,463/6,398 of 6,990, and top-slice strict/lenient rose from
2,950/3,368 to 2,951/3,369 of 3,617. Full strict/lenient rose from
62,674/83,727 to 62,675/83,728; stress-aware headline/exact rose from
54,788/45,784 to 54,789/45,785; CMU rules-only rose from 4,185 to 4,186/5,000.
Parity stayed 94,787/100,804, CMU default 4,749/5,000, context 88/108, and
homographs 1,455/1,615. The prebuild snapshot changed only `rule comparison`;
three postbuild differences are synthetic `comparison` + `-ed/-ing/-er`
forms, outside the evaluated lexical populations. The comparison-neutral
compression preserved identical 1,296,330-row snapshots. Dependency-aware
re-pinning remained 528 entries with the same five net-positive regression
words retained. All 404 test suites and 7,146 tests, typecheck and Rollup pass.
The accumulated common strict score is still 829 words below the release
threshold; no baseline was refreshed and this batch remains uncommitted.

### Authoritative review of the common `-ity` weak-vowel cluster (2026-10-22)

The exact one-phone common-miss grouping contains 15 `-ity` words where the
rule output has `/ə/` and the pinned IPA-Dict target has `/ɪ/` (including
`celebrity`, `charity`, `identity` and `stability`). This does not support
changing the productive `-ity` rule: Cambridge US independently transcribes
the medial vowel with schwa in [celebrity](https://dictionary.cambridge.org/us/dictionary/english/celebrity),
[charity](https://dictionary.cambridge.org/us/pronunciation/english/charity),
[identity](https://dictionary.cambridge.org/us/pronunciation/english/identity),
and [stability](https://dictionary.cambridge.org/us/pronunciation/english/stability),
matching the current rules-only predictions. The apparent gains would optimize
the fixed reference string against supported standard-US pronunciations.
The same issue appears in the common `-tribution` misses: the fixed IPA-Dict
rows use /trə/ in both `contribution` and `distribution`, while Cambridge US
gives /trɪ/ in [contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
/trɪb/ in the base verb [contribute](https://dictionary.cambridge.org/us/pronunciation/english/contribute),
and /strɪb/ in [distribution](https://dictionary.cambridge.org/us/pronunciation/english/distribution).
The current rules-only /ɪ/ agrees with those documented US forms, so changing
it would optimize the scorer's string over an authoritative reading. No source,
expectation, scorer or baseline changed; this is reference-variant diagnosis,
not an accuracy gain. I also replayed a direct `-lity` suffix substitution
(`/ləti/` → `/lɪti/`) through the real rule pipeline: it changed 21 common
predictions, fixing 4 strict cases and breaking 14 (net -10/6,990); in the
top-5,000 slice it fixed 3 and broke 7 (net -4/3,617). The standalone
`facility`, `disability`, `personality` and `stability` wins were outweighed by
paired `quality`/`utility`, plural, and other `-lity` losses. The candidate was
reverted; the source hash and common/parity scores returned to the frozen
pre-trial values. Evidence snapshots and hashes are under `/tmp/phonemize-*lity*20261022*`.

### Continued batch: Greek `phase` / `phrase` final voicing (2026-10-22)

Cambridge US records final `/z/` in [phase](https://dictionary.cambridge.org/us/pronunciation/english/phase),
[phrase](https://dictionary.cambridge.org/us/dictionary/english/phrase),
[paraphrase](https://dictionary.cambridge.org/pronunciation/english/paraphrase),
and [rephrase](https://dictionary.cambridge.org/us/pronunciation/english/rephrase);
[metaphase](https://dictionary.cambridge.org/dictionary/english/metaphase) confirms the
same root in a bound compound. The paired homographic controls *case*, *base*,
and *chase* retain `/s/`. The spelling rule voices the isolated `pha` root and
the `phra` root in prefixed forms. A full 1,296,330-row rule snapshot changed
exactly three predictions: `phase`, `phrase`, and `rephrase`; `paraphrase` was
already correct. An initial broader condition also changed synthetic
`alphased`/`alphasing`; those are now protected by the narrower root-boundary
test and their original `/s/` outputs have paired regressions.

After the full dictionary pipeline, common strict/lenient rose to
5,465/6,398 of 6,990 and top-slice to 2,952/3,369 of 3,617. Full-dictionary
strict/lenient rose to 62,677/83,729; stress-aware headline/exact rose to
54,791/45,787; rules-only CMU rose to 4,187/5,000. Runtime parity remained
94,787/100,804 strict and 100,691 lenient, CMU default remained 4,749/5,000,
context remained 88/108 auto and 85/108 gold, and homographs remained
1,455/1,615. Dictionary rebuild re-pinned 528 entries and retained the same
five net-positive regression words. All 405 Jest suites / 7,155 tests,
typecheck, and Rollup passed; Rollup retained its existing external `pinyin-pro`
and mixed-export warnings. The five English rule modules total 3,393 code
lines (below the 3,395 cap). This adds two common strict words toward the
6,292 release target; the remaining gaps are 826 common words and 303 in the
top-5,000 slice. No baseline was refreshed because this batch is below the
70-word commit threshold. Snapshots and hashes are under `/tmp/phonemize-*phrasal*20261022*`.

### Continued batch: assimilated weak `aff-` roots (2026-10-22)

The spelling `af·f` closes an initial syllable and the general stress rules
therefore gave initial `/æ/` in the verbs *affect*, *afflict*, and *affirm*.
Cambridge US records `/əˈfɛkt/`, `/əˈflɪkt/`, and `/əˈfɝm/` for those roots
([affect](https://dictionary.cambridge.org/us/pronunciation/english/affect),
[afflict](https://dictionary.cambridge.org/us/pronunciation/english/afflict),
[affirm](https://dictionary.cambridge.org/us/pronunciation/english/affirm)).
The shared `ad-` assimilation leaves a weak `af-` prefix before `fect`,
`flict`, and `firm`; the rule also carries that stress to regular third-person
forms. *Affix* remains outside the class because Cambridge records distinct
verb `/əˈfɪks/` and noun `/ˈæfɪks/`; `affect`'s dictionary noun reading is also
preserved by POS. The frozen rule snapshot changed exactly three rows
(*affect*, *afflict*, *affirm*), with no paired-control or other prediction
changes.

After dictionary rebuild, common strict/lenient was 5,466/6,398 of 6,990 and
top-slice 2,953/3,369 of 3,617. Full strict/lenient was 62,681/83,729;
stress-aware headline/exact was 54,795/45,791; rules-only CMU was 4,188/5,000.
Runtime parity stayed 94,787/100,804 strict and 100,691 lenient, CMU default
stayed 4,749/5,000, context stayed 88/108 auto and 85/108 gold, and
homographs stayed 1,455/1,615. Re-pinning remained 528 entries and retained
the same five net-positive regressions. All 406 Jest suites / 7,165 tests,
typecheck, and Rollup passed; its existing mixed-export and external
`pinyin-pro` warnings remain. The five English rule modules total 3,395 code
lines, at the current cap. This contributes one common strict word in addition
to the preceding `phase`/`phrase` gains; 826 common words and 303 top-slice
words remain below the release goal. Baselines were not refreshed, since the
current standalone batch is below the 70-word minimum. Evidence is under
`/tmp/phonemize-after-aff-prefix-20261022.tsv` and
`/tmp/phonemize-parity-after-aff-final-20261022.tsv`.

### Rejected plural compound-split expansion (2026-10-22)

The rebuilt rules route *paraphrases* through whole-word syllabification even
though singular *paraphrase* is recovered as a verified compound. I tested
reusing unrestricted compound splitting for every plural stem, then narrowed
the fallback to e-final stems. The unrestricted form changed 4,502 full
snapshot rows and the narrower form changed 1,170, including false splits
such as *comedies* and many synthetic derived forms. The narrower candidate
did improve *paraphrases*, but common strict/lenient stayed 5,466/6,398 and
full-dictionary strict/lenient fell by one each (62,680/83,726). Existing
plural-compound and homograph controls passed, but that did not offset the
observed regressions. Both candidates were reverted; the verified `-line`
plural path remains unchanged. Before/after snapshots are
`/tmp/phonemize-before-plural-compound-split-20261022.tsv`,
`/tmp/phonemize-after-plural-compound-split-20261022.tsv`, and
`/tmp/phonemize-after-e-stem-compound-plural-20261022.tsv`. No dictionary,
reference, or baseline was changed.

### `accredited` weak-root vowel review (2026-10-22)

The remaining one-phone common miss *accredited* is rules-only
`/əˌkɹɛdətɪd/` against pinned `/əˈkɹɛdɪtɪd/`. Cambridge US confirms `/ɪ/` in
[accredited](https://dictionary.cambridge.org/us/pronunciation/english/accredited)
and the base [credit](https://dictionary.cambridge.org/us/pronunciation/english/credit),
but gives `/ə/` in the corresponding weak root of
[accreditation](https://dictionary.cambridge.org/us/pronunciation/english/accreditation).
The rules-only free form *accredit* also has incorrect stress, so changing all
unstressed `-it` vowels would not model this derivation and could damage
neighboring suffix classes. No runtime change was made; the unresolved task is
to identify a productive assimilated-prefix/stress frame that handles
`accredit + -ed/-ing` while preserving `-ation` and unrelated `-it` controls.

### Continued batch: assimilated `ad-` + `credit` inflections (2026-10-22)

I added a general inflection path for assimilated `ad-` before a doubled
consonant when the recovered root is directly vouched in the existing
dictionary, multisyllabic, and `-it`-final. It predicts the root on the rules
path rather than adding an `accredited` map. Cambridge US gives `/ɪ/` in
[accredit](https://dictionary.cambridge.org/us/pronunciation/english/accredit),
[accredited](https://dictionary.cambridge.org/us/pronunciation/english/accredited),
and [accrediting](https://dictionary.cambridge.org/us/dictionary/english/accrediting),
while [accreditation](https://dictionary.cambridge.org/us/pronunciation/english/accreditation)
has the independently reduced `/ə/` in its unstressed root. The paired
`accreditation`, `acclimated`, `acclimating`, `acceded`, `accessed`, and
`acclaimed` rule controls are unchanged.

The frozen 1,296,330-row prediction snapshot changed exactly two rules-only
rows: *accredited* and *accrediting*. Under the fixed gold, *accredited* is a
strict win and *accrediting* is a strict loss; Cambridge supports the
candidate's `/ɪ/` for both. Common strict therefore rose by one to
5,467/6,990, common lenient stayed 6,398, and top-5,000 stayed 2,953/3,617.
Full strict/lenient stayed 62,681/83,729; stress-aware headline/exact rose to
54,797/45,792; CMU rules stayed 4,188/5,000. Runtime parity stayed
94,787/100,804 strict and 100,691 lenient, CMU default stayed 4,749/5,000,
context stayed 88/108 and 85/108, and homographs stayed 1,455/1,615. After
rebuild, dependency-aware re-pinning remained 528 entries with the same five
net-positive regression words; the packaged dictionary still supplies its
existing `/ə/` variant for *accrediting*, while the public output for
*accredited* remains correct. No source reference or baseline was changed.

All 407 Jest suites / 7,168 tests, typecheck, and Rollup passed. Extracted CJS
and ESM smoke tests return the expected O'Reilly Media and *accredited*
readings; their `accrediting` output follows the retained dictionary entry.
The five-module rule count remains at the 3,395-line cap. The one-word common
strict gain is below the 70-word commit threshold, so baselines remain
unchanged. Before/after snapshots and source hashes are under
`/tmp/phonemize-adroot-*20261022*`.

### Continued batch: assimilated `ex-` in *effect* (2026-10-22)

Rules-only *effect* inherited initial stress and `/ɛ/` from the closed spelling
slot (`/ˈɛfɛkt/`), while *effects*, *effected*, *effecting*, and *effective*
already keep the root stress and short front vowel. The general two-syllable
`ef` + `fect` frame now assigns root stress, without a whole-word entry;
*effort* and *efface* remain first-stressed controls. Cambridge records UK
`/ɪˈfekt/` and US `/əˈfekt/` for *effect*; the rule's `/ɪˈfɛkt/` follows the
independently pinned CMU/IPA-Dict variant. The existing dictionary still owns
the public noun and verb readings.

The frozen 1,296,330-row snapshot changed exactly one prediction, the
rules-only *effect* row. Against the same rebuilt tables, the current batch
adds 11 common strict wins over `ae356b6`, with no common strict losses; the
specific *effect* addition raises the current common result by one to
5,468/6,990 and the top slice by one to 2,954/3,617. Rebuilt full strict is
62,682/105,065 and lenient 83,729; stress-aware headline/exact are 54,798 and
45,793; CMU rules are 4,189/5,000 (the known legacy 90% failure), while CMU
default remains 4,749/5,000. Runtime parity remains 94,787/100,804 strict and
100,691 lenient; context remains 88/108 default-auto and 85/108 default-gold;
homographs remain 1,455/1,615. All 408 Jest suites / 7,170 tests and typecheck
pass. Baselines stay fixed: the common strict gain is still below the
70-word commit minimum. The O'Reilly Media issue regression remains covered by
`__tests__/en-apostrophe-words.test.ts`.

Evidence: `/tmp/phonemize-eff-ef-fect-before-20261022.tsv`,
`/tmp/phonemize-eff-ef-fect-after-20261022.tsv`,
`/tmp/phonemize-current-rebuilt-20261022.tsv`, and
`/tmp/phonemize-head-rebuilt-20261022.tsv`.

### Continued diagnosis: route and postlex ablations (2026-10-22)

The fixed common report remains 5,468/6,990 strict and 6,398/6,990 lenient.
Route removal lowers strict to 4,715 without morphology and 4,602 on the
unsplit path, so neither fallback is a useful replacement. The full postlex
diagnostic replayed 107,643 dictionary words and found 177 active rules; no
rule removal improves common strict. Removing the `sʃ` before `u` rule loses
one common strict item (*issue*), despite a one-item common lenient gain.
Reports and source hashes are under
`/tmp/phonemize-route-diagnosis-next-20261022` and
`/tmp/phonemize-postlex-diagnosis-next-20261022`.

A broad candidate to reduce pretonic `/ɪ/` to `/ə/` before primary stress in
`-tion` words was rejected: final-output replay changes 294 predictions,
loses 177 full-dictionary strict and 27 lenient items, and loses 42 common
strict and 5 lenient items. The pronunciation varies by root and prefix, so
the suffix alone is not a safe conditioning class. No runtime rule, dictionary
entry, reference or baseline changed from these diagnostics.

### Continued batch: weak `auto-` in the *automotive* compound (2026-10-22)

Rules-only *automotive* split the verified parts `auto` + `motive` and kept
the free-word diphthong in the unstressed head (`/ˌɔtoʊˈmoʊtɪv/`). Cambridge
US records `/ˌɑː.t̬əˈmoʊ.t̬ɪv/`, supporting a weak `/ə/` in that bound,
tail-primary compound ([Cambridge US pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/automotive)).
The change is on the compound-component join, not a whole-word pronunciation
table. Controls preserve head-stressed *autopilot*, the hiatus in
*autoeurope*, the distinct *autopacific* compound, and *non-automotive* in
hyphenated context. The existing morphology path also keeps *automotives*
correct.

The final frozen-prediction diff has 12 rows: four dictionary/rules outputs
for *automotive* and its possessive, plus eight synthetic morphology outputs.
No other dictionary rows changed, and *non-automotive* itself is unchanged.
Common strict and top-5000 strict each gain one word with no losses. Re-pinning
remains 528 entries with the same five net-positive regressions. Final gates:
common 5,469/6,990 strict and 6,399 lenient; top slice 2,955/3,617 strict
and 3,370 lenient; full rules 62,684/105,065 strict and 83,731 lenient;
stress-aware 54,799 headline and 45,794 exact; parity 94,787/100,804 strict
and 100,691 lenient; public CMU 4,749 default and 4,190 rules; homographs
1,455/1,615. All four context IPA cells and every reading/fixed supported-POS
subset are unchanged from baseline. All 408 Jest suites / 7,172 tests,
typecheck, Rollup and focused combining-form tests pass. Baselines remain
unchanged because this batch is below the 70-word commit minimum.

The frozen pre-candidate rule snapshot is
`/tmp/phonemize-before-auto-motive-stable-20261022.tsv` and the final candidate
is `/tmp/phonemize-after-auto-motive-preserve-hyphen-20261022.tsv` (1,296,330
rows). Their SHA-256 hashes are recorded in the session evidence; the final
candidate was measured against the stable rebuilt tables.

### Follow-up train-only candidate screen (2026-10-22)

After the automotive change, reran the ten-fold spelling-family learner on the
same fixed 6,990 common-word population. Fourteen fold-local greedy candidates
were accepted; six distinct readings appeared in at least one fold, but none
passed the existing train-only filter in any fold. Applying only filter-passed
rules therefore left mean held-out strict unchanged at 75.54%. The strongest
repeated grapheme candidate (`d`, unstressed `/ɪ/` to `/ə/`) has mixed train
wins and losses and failed all five folds in which it was accepted, so it was
not replayed as a runtime rule. Report and fold evidence are under
`/tmp/phonemize-learn-after-auto-20261022/`. This screen added no source or
reference changes; release gaps remain 823 common and 301 top-slice words.

The matching structural-feature run accepted 32 fold-local candidates across
nine readings; none passed the filter in any fold, and mean held-out strict
again remained 75.54%. Its highest-frequency candidate (`l`, unstressed
`/ɪ/` to `/ə/`) had 40 train wins against 30 losses and failed in all seven
folds that accepted it. No structural rule advanced to runtime replay. Evidence
is under `/tmp/phonemize-learn-structural-after-auto-20261022/`.

### Candidate audit: *automobile* and apostrophe-name route (2026-10-22)

The fresh common mismatch list includes *automobile*: the public dictionary
route returns `/ˈɔtəmoʊˌbiɫ/`, while rules-only returns `/ɔˈtɑməbɪɫ/`.
Cambridge's US pronunciation is `/ˈɑː.t̬ə.moʊ.biːl/`; its Academic Content
Dictionary also accepts `/ˈɔ.t̬ə.moʊˌbil/`, matching the current public output
([Cambridge automobile](https://dictionary.cambridge.org/us/pronunciation/english/automobile)).
The apparent common error is therefore isolated to the pure-rules path. A
special `auto + mobile` split would affect only this root and its inflections,
so it does not establish a reusable class and was not added. The default
O'Reilly Media sentence/possessive regressions still use the normal dictionary
and tokenizer route; no proper-name pronunciation map is required. The public
issue page could not be retrieved in this session, so the confirmed spelling
and brand context remain based on the user's clarification and local tests.

### Candidate audit: root-conditioned `-ically` schwa (2026-10-22)

Tested restoring /ə/ before final /l/ only when the spelling ends in `-ically`
and the base lexicon entry (word minus `-ly`) ends in /ɪkəl/. This is a
root-conditioned class rule, not a per-word map. On the frozen 6,990-word
English subset it gained one strict item (5,469→5,470); the top-5,000 slice
gained one (2,954→2,955), with both lenient counts unchanged. On the full
105,065-word testable dictionary, strict fell 62,684→62,680 and lenient stayed
83,731. The candidate therefore fails the full-dictionary no-regression gate
and was rejected. Its lexical-root shape is not sufficient evidence that the
adverb retains that schwa across the dictionary population. No runtime code or
expectations changed; reports and baselines remain at the before-run state.

The user's clarification identifies O'Reilly Media as the brand example;
issue #28's apostrophe/name tests remain the regression contract. No brand
specific mapping was added.

### Candidate screen: composing `-ation` from an `-ate` root (2026-10-22)

Frozen the current 1,296,330-row prediction surface before screening this
composition alternative. A broad counterfactual recomposed `-ation` forms
from the corresponding `-ate` root (existing lexical reading when available,
otherwise its rules prediction) and moved stress with the same suffix rule.
It changed 18 common-cohort rows and lost 15 strict items overall; the top
slice lost 8. Restricting it to roots explicitly supplied by the existing
runtime lexical tables still lost one strict item in both common and top
cohorts, with no strict wins. The broad spelling relation is not enough to
choose a root reading or preserve the derived form's stress, so neither
candidate was adopted. This was an offline screen; source, references, runtime
tables, and baselines were not changed. Frozen snapshot SHA256 is
`6cc977950d73476170b01ae64879f9cb99e53f4d5192882a346c5d534c50e729`; candidate
reports are `/tmp/phonemize-ation-sim-broad.json` and
`/tmp/phonemize-ation-sim-known-roots.json`.

### Candidate screen: composing long `-ible` forms from their stem (2026-10-22)

A second morphology screen tried using the spelled stem's existing reading, or
its ordinary rules prediction when no lexical reading exists, before adding
`-ible`. After modeling final dark /l/, the fixed common cohort had one strict
win (*accessible*) and eight losses (net -7); the top slice lost three strict
items. The losses include roots such as `compat`, `incred`, and `respons` that
the spelling can produce as phoneme strings but that do not supply the needed
spoken stem. A generic long-stem fallback therefore invents morphology where
it should leave the whole word intact. It was rejected before runtime replay.
The diagnostic report is `/tmp/phonemize-ible-sim.json`; no source,
expectations, data, or baselines changed.

### Follow-up route and postlex audit (2026-10-22)

Replayed all 6,990 current common-word baseline predictions after the latest
accumulated batch. The route ablations still show morphology as a net-positive
route (removing it loses 753 strict and 489 lenient items); bypassing compound
splitting loses 867 strict and 567 lenient items. The largest removable
postlex gains remain broad correctness constraints, not missing class rules:
removing doubled-consonant normalization loses 369 strict items, and removing
the rhotic schwa normalization loses 90. The only one-word strict gain exposed
by removing a smaller postlex rule was *issue*, while that also moved *tissue*
outside the lenient radius; their shared `ssu` spelling does not license a
different general rule.

The current common mismatch report's *transmit* reading is also not a safe
American-English rule target: Cambridge US records `/trænsˈmɪt/`, agreeing with
the current rules output, while its UK entry has `/trænzˈmɪt/`. The expected
voiced form in the pinned cross-dialect reference is not evidence to alter the
US rule. See [Cambridge transmit pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/transmit).
Previously screened `-lace` compound bypasses remain rejected: Cambridge US
has weak `/ləs/` in *necklace* but `/leɪs/` in *shoelace*, and the frozen
full-dictionary replay found six losses for two wins even after excluding
`-place`.

Focused issue #28 coverage was rerun after this audit: both apostrophe-name
suites pass all 28 tests, including O'Brien, O'Reilly Media, its possessive,
sentence tokenization, and straight/curly apostrophes. No runtime or reference
change followed this candidate screen. Current release metrics and committed
baselines remain unchanged; the 90% common strict target remains open.

### Rejected fabricated `-get` stem fallback (2026-10-22)

Tested skipping morphology for `-able`/`-al` forms whose stripped stem ends
in `-get` but has no independent lexical entry. The frozen rules-route replay
changes only *vegetable* and *vegetal*: *vegetal* moves from `/vɛɡətəl/` to
`/vɛdʒətəl/`, matching the fixed reference and Oxford/American Heritage's soft
`g`; *vegetable* moves from `/vɛɡətəbəl/` to `/vɪdʒɛteɪbəl/`, farther from
Cambridge US `/ˈvedʒ.tə.bəl/`. Full-dictionary rules strict/lenient each rise
by one, but common and top-slice scores do not change, and the paired
`-getable` control regresses in phones. The structural guard is therefore not
adopted; the shared fabricated stem still needs a class repair that preserves
the correct compressed *vegetable* reading. Sources:
[Cambridge vegetable](https://dictionary.cambridge.org/us/pronunciation/english/vegetable),
[Oxford vegetal](https://www.oxfordlearnersdictionaries.com/definition/english/vegetal),
[American Heritage vegetal](https://ahdictionary.com/word/search.html?q=vegetal).

The separate `-quire + -ment` screen was also closed without a change. The
common *requirement* rules output `/ɹiˈkwaɪɝmənt/` differs from IPA-Dict's
`/ɹɪˈkwaɪɹmənt/`, but Cambridge US records `/rɪˈkwaɪr.mənt/` and Merriam-Webster
allows the optional schwa in the base *require* (`ri-ˈkwī(-ə)r`). The current
output has authoritative support; changing it to fit the pinned gold would
need more than a regular suffix join and would conflict with existing
`require`/`requirement` paired controls. Sources:
[Cambridge requirement](https://dictionary.cambridge.org/us/dictionary/english/requirement),
[Merriam-Webster require](https://www.merriam-webster.com/dictionary/require).

### Rejected `-ally` rule-first stem composition (2026-10-22)

Tested preferring the ordinary rules reading of an `-ally` base over its
lexical stem when composing the adverb. This aligns rules-only *personally*
with Cambridge US /ˈpɝ.sə.nə.li/, but breaks *continually* and *especially*;
the frozen common cohort falls 5469→5468 strict and the top-5000 slice loses
one lenient item. The unmodified `-ally` composition remains in source. The
paired controls show that lexical/rule disagreement alone does not identify
which reading belongs in the derivative. Cambridge sources:
[personally](https://dictionary.cambridge.org/pronunciation/english/personally),
[continually](https://dictionary.cambridge.org/pronunciation/english/continually),
[especially](https://dictionary.cambridge.org/pronunciation/english/especially).

The fresh structural and general learner replays on the same 6,990-word
population accepted 32 and 14 training proposals across ten spelling-family
folds; none passed their held-out filters. The structural proposals lower
aggregate held-out strict from 3846 to 3835/5091 when applied together, so
neither learner exposed a candidate for dispatch replay. Artifacts:
`/tmp/phonemize-next-release/learner-20261022/`,
`/tmp/phonemize-next-release/learner-general-20261022/`, and
`/tmp/phonemize-route-diagnosis/report.json`. No source, expectation, runtime
table, or baseline changed during these screens.

### AmE *new* yod and stressed CMU AH source correction (2026-10-22)

The AmE dictionary entry for *new* and its regular plural *news* had inherited
British-style `/j/` from IPA-Dict. The custom CMU source now records `/nuː/` and
`/nuːz/`; the existing en-GB transform still produces `/njuː/` and `/njuːz/`.
Cambridge confirms these dialect readings for [new](https://dictionary.cambridge.org/pronunciation/english/new),
[news](https://dictionary.cambridge.org/pronunciation/english/news),
[newly](https://dictionary.cambridge.org/pronunciation/english/newly), and
[newcomer](https://dictionary.cambridge.org/us/dictionary/english/newcomer).
The latter's `/ˈnuːˌkʌm.ɚ/` also exposed a source-notation mismatch: custom
CMU `AH2` was converted to schwa even when this source explicitly records
STRUT. The build recognizes a per-entry `stressed-strut` note so this
correction does not alter other custom pronunciations or default ARPABET
conversion.

The frozen 1,296,330-row snapshot changed 615 existing predictions (47
dictionary, 40 rule, 528 derived), with no additions or removals. All changes
belong to the `new*` family or its derived forms. After rebuild, common strict
is 5,470/6,990 (+1 from the pre-change run), top-5,000 strict is 2,956/3,617
(+1), runtime parity is 94,787/100,804 (unchanged from its committed
baseline), public CMU default is 4,749/5,000, rules-only CMU is 4,190/5,000,
stress-aware is 54,806/90,308, context remains 88/85/53/49 of 108, and
homographs remain 1,455/1,615. The +1 common change comes from source
correction and is not counted as a rule gain. Rules-only CMU's legacy 90% floor
remains unmet. `yarn typecheck`, `yarn test:ipa`, and all 409 Jest suites /
7,174 tests pass. The common strict target remains open; no baseline was
updated.

### Rejected weak-vowel extension from final `-ce` to `-ge` (2026-10-22)

Tested extending the existing weak pre-final vowel reduction from silent-e
`-ce` to `-ge`, covering forms such as *damage*, *image*, *message*, *package*,
and *storage*. On the frozen common subset it gained 9 strict items (5,470 to
5,479), with 5 top-slice gains (2,956 to 2,961); common lenient rose by 2 and
top-slice lenient by 3. That apparent gain did not generalize: full-dictionary
strict fell from 62,690 to 62,657 and lenient from 83,735 to 83,725. Across
changed rules-only dictionary rows the candidate produced 50 exact wins and 85
exact losses. The `-age` tail alone does not distinguish schwa forms from
words retaining /ɪ/, including *average*, *bandage*, *garbage*, and
*leverage*. The extension was reverted without a rebuild or baseline update.

A narrower rule limited to orthographic geminate + `a` before `-ge` still
gained 6 common strict items and 3 top-slice items, but full strict fell by 9
(62,690 to 62,681). Its 40 changed rules-only dictionary rows had 11 exact
wins and 20 exact losses; *baggage* and *message* improved, while *babbage*,
*blockage*, *pillage* and several derived forms regressed. The spelling frame
therefore still does not separate the two readings, and this variant was also
reverted. Its snapshot is `/tmp/phonemize-age-geminate-after-20261022.tsv`
(SHA-256 `8743ff056cbfd7d97a177c06cf74a0b9c13091bfb0248047a02d356a030fb24b`).

Frozen snapshots: `/tmp/phonemize-age-class-before-20261022.tsv`
(SHA-256 `c0b09a15218152f2c24c7cc90f6e4e81094a463c08557e1bc86393667b209544`)
and `/tmp/phonemize-age-class-after-20261022.tsv` (SHA-256
`324d55317b3d22e2e7f88352efca9d2a8693cf6b676fe6f12f172dc7e282e848`).

### Rejected rules-first `-ically` stem composition (2026-10-22)

Tried composing `-ically` from the rendered rules-path `-ical` base rather than
the available lexical base. The frozen snapshot changed 10 dictionary, 61
rules, and 655 derived-form predictions. The changed rules rows yielded 4 exact
wins and 31 losses; the fixed common cohort fell from 5,470 to 5,468 strict,
the top slice from 2,956 to 2,955, and full strict from 62,690 to 62,678
(lenient 83,735 to 83,726). The existing post-lexical `-ically` schwa-elision
then removes the `/ə/` retained by the rendered base in forms such as
*typically*, while the changed base vowel breaks other derivatives. The
candidate was reverted without a rebuild or baseline update. Snapshot:
`/tmp/phonemize-ically-rule-root-first-after-20261022.tsv` (SHA-256
`924447295ebf3fc64be591df5330afd1315ff2eac7e3cc06bb81ccd5bedfecd9`).

### Authority check: common weak `-it` readings (2026-10-22)

The next high-frequency mismatch group includes rules-path /ɪ/ against IPA-Dict
/ə/ in words such as *credit*, *edit*, *editor*, *unit*, *limit*, and *merit*.
Cambridge supports /ɪ/ for US *credit* as a noun, *editor*, *unit*, *limit*, and
*merit*, but also records /ə/ for the verb sense of *credit* meaning “believe”
and in its American Dictionary entry for *edit*. *Benefit* also varies between
Cambridge's /ə/ and /ɪ/ transcriptions across its dictionaries. These entries
therefore do not establish a safe uniform spelling rule or a single reference
correction; no source, runtime rule, or baseline changed. Sources: [credit](https://dictionary.cambridge.org/pronunciation/english/credit), [edit](https://dictionary.cambridge.org/dictionary/english/edit), [editor](https://dictionary.cambridge.org/pronunciation/english/editor), [unit](https://dictionary.cambridge.org/us/dictionary/english/unit), [limit](https://dictionary.cambridge.org/dictionary/english/limit), [merit](https://dictionary.cambridge.org/us/pronunciation/english/merit), and [benefit](https://dictionary.cambridge.org/dictionary/english/benefit).

### Continued batch: authoritative `-tice` correction and plurals (2026-10-22)

Cambridge US gives /ɪ/ in [notice](https://dictionary.cambridge.org/us/pronunciation/english/notice),
[practice](https://dictionary.cambridge.org/us/pronunciation/english/practice),
[justice](https://dictionary.cambridge.org/us/pronunciation/english/justice), and
[malpractice](https://dictionary.cambridge.org/us/pronunciation/english/malpractice),
where IPA-Dict used /ə/ in the final syllable. Corrected those source readings;
for *justice*, the CMU source annotation preserves the dictionary's stressed
STRUT. The regular sibilant /ɪz/ form is retained in rules for `-tice` plurals.
The same root-vowel correction applies to *noticed* and *practiced*: Cambridge
directly transcribes US *practiced* as /ˈpræk.tɪst/, and the past-tense form
*noticed* preserves the /ɪ/ in *notice* (rather than the stale IPA-Dict schwa).
Paired controls `classes` and `buses` keep the existing `/əz/` reference
convention. Cambridge's [regular plural rule](https://dictionary.cambridge.org/grammar/british-grammar/nouns-form)
supports the `/ɪz/` ending after a sibilant. The issue #28 regression suite also
continues to cover the user's clarified *O'Reilly Media* brand example; no
brand-specific pronunciation map was added.

The dictionary builder now honors `corrected-reference` markers when trimming
predictable plurals, so corrected source forms stay in the fixed evaluation
population. `malpractices` remains a predictable generated plural and is
trimmed as before. The corrected-reference change is source maintenance, not
a rule gain. The `-tice` rule change was replayed through the rebuilt data and
all tracked gates:

- Common rules strict: 5,470 → 5,473/6,990; top-5,000: 2,956 → 2,959/3,617.
  The final common count includes the independently documented *noticed* and
  *practiced* reference corrections; common lenient counts remain 6,399 and
  3,370. The rule batch alone had measured 5,472 common strict and 62,691 full
  dictionary strict before those reference rows were corrected.
- Full-dictionary strict/lenient: 62,690/83,735 → 62,694/83,738.
- Runtime parity: 94,787 → 94,788/100,804 strict; lenient remains 100,691.
- Public CMU default remains 4,749/5,000; rules-only remains 4,190/5,000
  (still below its legacy 90% floor, with no decrease).
- Stress-aware phonemic remains 54,806/90,308; context IPA remains 88/85/53/49
  of 108; homographs remain 1,455/1,615.
- `yarn typecheck`, all 409 Jest suites / 7,176 tests, and the focused apostrophe
  and `-tice` suites (68 tests) pass.

The compression audit found 3,396 code lines across the five rule modules and
1,151 in `g2p.ts`, crossing both retained limits by one. Grouping the two
compound-split boundary slices brought the modules to 3,395 lines and
`g2p.ts` to 1,150; the focused rule, apostrophe, and issue #28 suites (73
tests) plus typecheck pass afterward. A four-shard comparison against the
frozen snapshot is byte-identical across all 1,296,330 predictions. The
adjacent `^y` rules remain separate:
the syllabifier has a downstream `pattern.source === "^y$"` special case, so
combining the regexes changes output even though their match sets are equal.

The common strict target is still 819 correct words away from 90% (6,292/6,990),
and the top-5,000 slice is 297 away (3,256/3,617). This is a small accumulating
gain, below the normal +70-word improvement-commit threshold, so baselines were
not refreshed and no commit was made. The frozen source snapshot is
`/tmp/phonemize-new-us-correction-20261022/verified-final-final.txt` (SHA-256
`c0b09a15218152f2c24c7cc90f6e4e81094a463c08557e1bc86393667b209544`); the
final full prediction snapshot is `/tmp/phonemize-tice-final-snapshot-20261022.tsv`
and final parity dump is `/tmp/phonemize-tice-final-parity-20261022.tsv`.

### Rejected lexical-evidence gate for the `-ies` y-stem (2026-10-22)

Tested requiring a lexicon-attested restored `-y` base before the general
`-ies` morphology branch can join the plural. This fixes the rules-only false
parse of *series* as `sery + -ies`, matching Cambridge US /ˈsɪr.iːz/, but the
gate rejects productive rule-derived stems such as *amplify* and *bakery*.
The frozen common cohort falls from 5,473 to 5,452 strict and 6,399 to 6,384
lenient; top-5,000 strict falls from 2,959 to 2,952. Paired examples
*amplifies* and *bakeries* regress, and `en-rule-reduction2.test.ts` fails its
*amplifies* expectation. Reverted the gate. A valid repair needs independent
morphological evidence that separates invariant *series* from productive
`-ies` forms without requiring every restored stem to be stored. Cambridge US
lists UK /ɪ/ and US /ə/ for *ministry*, so that item does not justify a uniform
`-istry` vowel rule. A second pass allowing recursive morphology restored
*amplifies* but still changed *bakeries* and other productive forms; common
strict was 5,455 and lenient 6,386, with top-slice strict 2,953. It was also
reverted. Sources: [series](https://dictionary.cambridge.org/us/pronunciation/english/series),
[ministry](https://dictionary.cambridge.org/us/pronunciation/english/ministry),
[chemistry](https://dictionary.cambridge.org/us/pronunciation/english/chemistry).

### Rejected common initial-vowel trace generalization (2026-10-22)

Re-ran the fixed common cohort with direct phoneme-rule traces. The largest
apparent clusters are word-initial `i` (183 misses), `a` (134), and `e` (141
across three rules), but examples include *Missouri*, *Michael*, *Niagara*,
*Antigua*, and many other name or abbreviation readings. They do not identify
a shared spelling environment suitable for one rule. A closer review of the
single-edit `ɛ`/`ɪ` errors also found mixed lexical and POS behavior: Cambridge
US gives noun *accent* /ˈæk.sənt/ and verb /ˈæk.sent/, so the rule's noun-like
schwa is supported, while the pinned row uses the verb's vowel in this
POS-neutral isolated-word metric. Cambridge
lists /ək-/ as the primary US start for *accessory* and /æk-/ as an alternate;
the current rules output is supported as well. No phoneme rule or reference
was changed. Sources: [accent](https://dictionary.cambridge.org/us/pronunciation/english/accent),
[accessory](https://dictionary.cambridge.org/us/dictionary/english/accessory).

### Going reference and rebuilt-table comparability (2026-10-23)

Cambridge US gives *going* /ˈɡoʊ.ɪŋ/; the previous IPA-Dict row used a
secondary clipped /n/ reading as its sole reference, while the spelling rules
already produced /ŋ/. Added the primary CMU/Cambridge reading to
`src-data/en/custom.dict` and taught the dictionary builder not to trim an
explicitly corrected `-ing` reference as predictable morphology. This is a
reference correction, not a pronunciation-rule gain. The measured common
strict count moves from 5,473 to 5,474/6,990 and top-5,000 from 2,959 to
2,960/3,617 solely because the gold row now matches the rule output.

Also corrected *software*: Cambridge US includes /t/ in /ˈsɑːft.wer/, which
the old IPA-Dict row omitted. The rules already emitted /t/. This is a second
source correction, not a rule gain. After both corrections, common strict is
5,475/6,990 and top-5,000 is 2,961/3,617; lenient counts remain 6,399 and
3,370.

Added a `retain-reference` marker for *goings* so plural trimming preserves
the existing parity population. Cambridge US lists *going* and its regular
/-z/ form; the rule reading remains unchanged. Compared with the completed
build immediately before this marker, the full snapshot has 12 added and one
removed evaluation rows, with zero changed predictions for shared rows. The
final parity count is back to 94,788/100,804 strict and 100,691 lenient. An
earlier 165,038-row difference came from a snapshot taken before the
dependency-aware exception miner finished; that snapshot is discarded and is
not evidence of source drift. The original `data/en/dict.json` hash was
`919deacd839ce1013c711e419650e4e685be8a08106b935225eabff847c4e16e8`; the
final regenerated hash is
`51bc1d4cbafdd2f79a4c7a9114cf5962cbeb9eee3d829ce7868f2245685dbe77`.

The user's clarification confirms *O'Reilly Media* is the real brand example;
*O'Reily* is illustrative only. Existing apostrophe tests cover the brand,
possessives, both apostrophe forms, and sentence context without a name-specific
rule. `yarn typecheck`, `git diff --check`, `yarn test:ipa`, and the full
409-suite / 7,177-test Jest run passed; after adding the software assertion,
the focused apostrophe/back-vowel tests passed all 75 tests. Default CMU
accuracy remains 4,749/5,000; rules-only remains 4,190/5,000, below its legacy
90% floor but nondecreasing. Context remains 88/108 and homographs 1,455/1,615.
Full-dictionary strict/lenient is 62,700/83,742 over 105,065 rows. The common
strict target still needs 817 words in the 6,990 cohort and 295 in the
top-5,000 slice; these reference corrections do not count toward the rule-gain
commit threshold.
Sources: [Cambridge going](https://dictionary.cambridge.org/us/pronunciation/english/going),
[Cambridge goings](https://dictionary.cambridge.org/pronunciation/english/goings),
[Cambridge software](https://dictionary.cambridge.org/us/pronunciation/english/software).

### Rejected common strict spelling candidates (2026-10-23)

Re-ran structural rule learning against the current fixed 6,990-word cohort
with 10 spelling-family folds. The learner selected 33 candidate readings
across folds, but 0/33 passed the legacy paired-control and top-5,000 filter;
mean held-out strict remained 75.63% before and after the candidates. The
largest pooled proposals changed unstressed /ɪ/ to /ə/ after `l` or `d`, but
they broke held-out words and controls and were not adopted. Full report:
`/tmp/phonemize-learn-structural-current-20261023/cv-common-report.json`.

Several apparent high-frequency rule misses are reference-convention
conflicts rather than safe rule opportunities: Cambridge US gives /ɪ/ in
*message*, *credit*, *image*, and *service*, matching current rule output,
while the pinned CMU rows use unstressed AH. Switching these runtime rows to
Cambridge readings would lower the CMU-scored public API cell, so the common
reference/runtime contract remains unchanged. Sources: [message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[credit](https://dictionary.cambridge.org/us/pronunciation/english/credit),
[image](https://dictionary.cambridge.org/us/pronunciation/english/image),
[service](https://dictionary.cambridge.org/us/pronunciation/english/service).

### Rejected ordinary rule candidates and `-ies` premise check (2026-10-23)

The ordinary, non-structural learner was also replayed over the same fixed
cohort and 10 spelling-family folds. It accepted 14 fold-local candidates;
none passed the existing filter. Its six pooled readings had 0/10 passing
folds, so no rule was adopted. Report:
`/tmp/phonemize-learn-ordinary-current-20261023/cv-common-report.json`.

Tested whether the existing compound-part index could supply the attestation
missing from the exception-table-only morphological `lex()` probe for the
*series* `sery + -ies` collision. It has neither `amplify` nor `bakery` in its
head/tail indexes (nor `sery` or `specy`), so it cannot license the productive
control stems while excluding the accidental `sery` stem. This rejects that
data source as a general `-ies` discriminator; the earlier failed
`lexicon-attested` and recursive-stem gates remain reverted. No compound
tables or runtime predictions changed. Keep `-ies` morphology closed to this
same spelling-only premise until an independent class signal is found.

### Current common-error route census (2026-10-23)

Replayed the exact fixed English subset through rules-only `trace()` and
confirmed all 1,515 strict mismatches: 1,240 rules, 237 morphology, and 38
compound. The largest simple ending buckets, assigning each word to its first
matching suffix in the probe, were final `-s` (108), `-er` (52), `-ion` (33),
`-ed` (32), and `-al` (30). They are heterogeneous: for example, the top
`-ment` errors disagree in stress, vowel quality, and consonant retention;
the 10 `-ical` errors have both /ɪ/ and /ə/ targets, and their wide vowel
substitution has already failed paired replay. This rules out choosing the
next fix from suffix frequency alone. The probe retained exactly 6,990 ranked
words and 1,515 mismatches, matching `evaluate.ts`.

### Careful final /t/ in multi-variant `-ts` references (2026-10-23)

IPA-Dict lists both short and full final clusters for some spelling-final
`-ts` forms. The old picker intentionally left multi-variant/homograph rows
untouched, so *projects*, *conflicts*, *impacts*, and *prospects* kept the
short `/ks/` variant while the rule path and pinned CMUdict retained `/kts/`.
Cambridge US independently gives final `/t/` in the corresponding *project*,
*conflict*, *impact*, and *prospect* headwords. Added a general source-picker
step that removes a variant only when another variant with the same complete
stress pattern differs by exactly final `/t/` before `/s/`, and the spelling
ends in `ts`. Other stress/vowel readings remain in the pool. Corrected rows
are pinned through dictionary trimming so the evaluation cohort stays fixed.

On the frozen IPA-Dict input, 11 existing references changed; no keys were
added or removed from the 109,145-entry dictionary. Ten of the 11 changed
references matched the rules-only prediction before the build; the remaining
change did not create a strict regression. The fixed common cohort gained
4 strict words (5,475→5,479/6,990), including one top-5,000 word
(2,961→2,962/3,617); lenient counts did not change. Full-dictionary strict /
lenient finished at 62,711/83,743, and parity at 94,792/100,804 strict and
100,692 lenient. Public CMU remained 4,749/5,000 default and 4,190/5,000
rules-only; context 88/108 and homographs 1,455/1,615 were unchanged; the
stress-aware phonemic headline increased from 54,812 to 54,823. These are
reference-variant corrections, not rule gains, and do not satisfy the +70
ordinary commit threshold. The common strict goal remains 813 words short and
the top-5,000 goal 294 short.

The focused variant tests passed after demonstrating the expected failures
before implementation. Typecheck and the full Jest suite passed (410 suites,
7,180 tests), including issue #28. The full frozen-input build completed its
dependency-aware repin; it added 529 repins, matching the before-run, and the
parity dump changed only eight runtime words, all still exact against their
respective reference rows. Sources: [Cambridge project](https://dictionary.cambridge.org/us/pronunciation/english/project),
[conflict](https://dictionary.cambridge.org/us/pronunciation/english/conflict),
[impact](https://dictionary.cambridge.org/us/pronunciation/english/impact),
[prospect](https://dictionary.cambridge.org/us/pronunciation/english/prospect).

### Full `/ts/` recovery in multi-variant `-ts` references (2026-10-23)

Extended the same source-selection rule to another IPA-Dict pattern: a short
variant can omit the entire final `/ts/`, as in *requests*, *scientists* and
*contests*. Cambridge's US headwords retain final `/t/` in [request](https://dictionary.cambridge.org/us/pronunciation/english/request),
[scientist](https://dictionary.cambridge.org/pronunciation/english/scientist), and the noun [contest](https://dictionary.cambridge.org/us/dictionary/english/contest);
the regular inflections therefore retain `/ts/`. The picker now removes a short form only when another source form
matches it exactly after deleting the final `/ts/` (or only `/t/` before `/s/`),
and only for spellings ending in `ts`. It retains the full coda and all distinct
stress and vowel readings. This is a dictionary-reference correction; no G2P
word mapping or runtime lexicon was added.

The fixed 6,990 common cohort rose from 5,479 to 5,483 strict (lenient 6,403
unchanged); the top-5,000 slice rose from 2,962 to 2,964 strict (lenient 3,372
unchanged). Full-dictionary rule-path strict/lenient is 62,736/83,772 over
105,065 rows. Runtime parity is 94,795/100,804 strict and 100,696 lenient; against
the preceding `/t/`-only candidate, the official stress-stripped scorer reports
exactly three strict wins and no losses
(`environmentalists`, `instrumentalists`, `internationalists`). Public CMU
default remains 4,749/5,000 and rules-only 4,190/5,000; context remains 88/108,
homographs 1,455/1,615, and stress-aware strict 54,852/90,308. These source
corrections are not rule gains and do not meet the +70 ordinary commit
threshold. The release strict gaps are 809 common words and 292 top-slice words.

The full frozen-input build retained 109,145 dictionary keys; dependency-aware
repinning changed from 529 to 530. Typecheck, all 410 Jest suites / 7,181
tests, the official parity gate, Rollup and packaged CJS/ESM O'Reilly Media
sentence/possessive smoke pass. The
existing Rollup warnings about mixed default/named exports and external
`pinyin-pro` remain. No baselines were refreshed and no commit was made.

After the reference rebuild, structural rule learning was repeated over the
same 6,990-word population and 10 spelling-family folds. It accepted 31
fold-local readings, but none passed the existing paired-control/top-slice
filter; held-out strict stayed 75.77% before and after filtering. The largest
proposals again broadened unstressed /ɪ/ to /ə/ after `l` or `d`, and failed
the filter in every fold. No rule was adopted from that run. Report:
`/tmp/phonemize-learn-structural-finalts-20261022/cv-common-report.json`.

### Rejected lowercase-initialism table fallback (2026-10-22)

A prototype reused the existing source-attested `initialisms.json` rows when
the rule route saw lowercase spellings. Offline strict replay looked
promising (+93 full-dictionary wins, no losses; +18 common and +11 top-slice),
but the full Jest run failed four paired-control suites: spoken `sri`,
consonantal `pgm`/`mgm`, the weak article `a`, and the article in the
`select a picture` sentence. The table has genuine homographic spellings, so
membership alone cannot choose the initialism reading in lowercase text.
This fallback was reverted and the gram-free data pipeline was rebuilt; the
source hashes match the frozen before-run. The strict goal remains at
5,483/6,990 and 2,964/3,617. Before reconsidering this class, a fix must
resolve the acronym-vs-word reading from case or context without breaking those
controls. Frozen snapshots and reports are in
`/tmp/phonemize-initialisms-before-20261022/` and
`/tmp/phonemize-initialisms-after-20261022/`.

The checked-in `scripts/eval-common-baseline.json` is the operative commit
baseline in this checkout: 5,460/6,990. The next ordinary improvement commit
requires 5,530; this working tree is at 5,483, so it is 47 strict words short
of that checkpoint. No baseline was refreshed.

### Rejected distance-objective structural candidates (2026-10-23)

Repeated the fixed common-cohort, ten spelling-family-fold learner with its
distance objective, in addition to the strict-objective screens above. It
selected 17 fold-local candidates, but none passed the existing legacy
paired-loss diagnostic; held-out strict stayed 75.77% before and after
filtering. The most repeated proposals again changed context-poor unstressed
vowels (`eɪ` to `ə` after `m`, and `/ɪ/` to `/ə/` by an `r` slot feature),
with mixed train wins and losses and no passing fold. No rule was replayed into
runtime and no source or dictionary data changed. Report:
`/tmp/phonemize-learn-distance-structural-current-20261023/cv-common-report.json`.

Rechecked the fixed acceptance cells: common strict/lenient remains
5,483/6,403 of 6,990, top-5,000 remains 2,964/3,372 of 3,617, public CMU
default remains 4,749/5,000, and rules-only CMU remains 4,190/5,000 (the known
legacy 90% failure, with nondecrease required). Issue #28's focused apostrophe
suite passes 24/24, including O'Reilly Media sentence and possessive forms
with straight, left-curly and right-curly apostrophes. No acceptance baseline
was refreshed.

### Rejected `-ical` corrected-reference candidate (2026-10-23)

Tested Cambridge US /ɪ/ references for nine `-ical` words through
`src-data/en/custom.dict`, with a generic aligned dark-L preservation attempt.
The candidate raised the measured common strict count from 5,483 to 5,491,
but changed the fixed cohorts: `chemicals` disappeared, while `hypotheticals`
and `radicals` appeared (6,989 common / 3,616 top-slice items instead of
6,990 / 3,617). Common lenient fell by one in each slice. Runtime parity strict
also fell from 94,795/100,804 to 94,785/100,805; full-dictionary lenient stayed
83,772 and the stress-aware headline stayed 54,852. Public CMU cells, context
and homographs were unchanged. The reference and helper changes were removed;
the candidate is rejected because it violates the fixed-population and
no-regression gates. It was not counted as a rule gain and no baseline was
updated.

### Frozen-table route and postlex ablations (2026-10-23)

Repeated both diagnostics against the restored 109,145-key dictionary and
current source hashes. The route census verified 107,643 baseline predictions;
removing morphology scored 57,943/80,703 strict/lenient versus 64,084/85,681,
and bypassing morphology plus splitting scored 54,928/79,090. No individual
route alternative had a net strict or lenient win on the fixed common cohort.
The postlex ablation found no common strict-improving removal; the only
common-changing row was `/sʃ(?=u)/`, whose removal loses one strict case while
gaining one lenient case (`issue`). Neither diagnostic identifies a safe
class candidate. Reports:
`/tmp/phonemize-route-census-post-rebuild-20261023/report.json` and
`/tmp/phonemize-postlex-census-post-rebuild-20261023/results.json`.

### Rejected stressed-final `-ey` class (2026-10-23)

Cambridge US records *key* as /kiː/, while the rules-only route predicts
/keɪ/. A candidate exception in the shared `-ey` rule produced one common and
one top-slice strict gain, but the rebuilt full-dictionary strict count fell
by six and changed 19 rule/morphology/compound predictions, including
`keyable`. The broad rule is rejected. A temporary `key K IY1` source row
corrected the default dictionary lookup but was evicted from the runtime
exception table because the rules-only difference is below the miner's
edit-distance threshold; the focused rules-only test failed, so that no-op
row and its test were removed. The standard dictionary reading is retained
for default lookup; the rules-only `key` class remains open. No baseline or
runtime behavior was changed.

### Repeated spelling-family learner pass (2026-10-23)

Re-ran the ten-fold TRAIN-only rule learner against the current 6,990-word
fixed cohort. Thirteen candidates were selected in one or more folds, but none
passed the existing paired-loss/top-slice filter diagnostic. Mean held-out
strict stayed 75.77% before and after filtering. The report is
`/tmp/phonemize-current-rule-learn-20261023/cv-common-report.json`; no runtime
rule or baseline changed. The common error census remains 5,484/6,990 strict
and 2,965/3,617 top-slice strict. The largest direct trace clusters are mixed
initial-vowel readings dominated by names, abbreviations and loanwords, so
they do not justify a general spelling rule without a narrower phonological
or morphological explanation.

### Cambridge US `between` reference correction (2026-10-23)

Cambridge US gives *between* as /bɪˈtwiːn/, while the fetched IPA-Dict row
expected /biˈtwin/ against the already matching rules prediction. Updated the
source dictionary rows for *between* and its regular *betweens* form in
`src-data/en/custom.dict`; no G2P rule changed. Rules-only morphology uses the
corrected root for *betweens* as well. Paired against a no-correction rebuild
from the same upstream source URL, fixed populations stayed 6,990 and 3,617:
common strict/lenient changed 5,483/6,403 to 5,484/6,403, top-slice
strict/lenient 2,964/3,372 to 2,965/3,372, and full-dictionary strict/lenient
62,736/83,772 to 62,738/83,773. Runtime parity moved 94,795/100,804 to
94,796/100,805; stress-aware headline/exact moved 54,852/45,853 to
54,854/45,855. CMU default/rules stayed 4,749/4,190, context cells stayed
88/85/53/49, and homographs stayed 1,455/1,615. Issue #28 remains 24/24;
all 411 test suites / 7,182 tests and typecheck pass. This is reference
maintenance, not a pronunciation-rule gain; committed baselines and the
ordinary +70-word commit threshold are unchanged. Source: [Cambridge US
between](https://dictionary.cambridge.org/us/pronunciation/english/between).

### High-frequency /ɑ/-/ɔ/ and function-word audit (2026-10-23)

Rechecked the highest-ranked mismatches *online* (80), *blog* (537), *dog*
(1,047), and *lost* (1,079). The default outputs match pinned CMUdict, while
the rules-only route chooses /ɑ/ and IPA-Dict currently expects /ɔ/. Cambridge
US pronunciation pages list /ɑ/ for *online* and *dog*; its American
Dictionary also records /ɔ/ for *online*, *dog*, and *lost*. These are
attested American variants, not a defensible single-reference rule class;
changing the runtime/dictionary toward one form risks the public CMU gate or
rejecting an attested variant, so those rows remain unchanged. Sources:
[online](https://dictionary.cambridge.org/us/pronunciation/english/online),
[dog](https://dictionary.cambridge.org/us/pronunciation/english/dog),
[lost](https://dictionary.cambridge.org/us/pronunciation/english/lost).

The isolated *from* rules prediction /fɹɑm/ disagrees with its common
IPA-Dict weak-form target /fɹəm/. Cambridge US records strong /frʌm/ and weak
/frəm/. A live tokenizer replay confirms the default API returns /fɹʌm/ in
isolation and /fɹəm/ in sentences; with `disableDict: true`, both paths return
/fɹɑm/. Thus the weak-form stage works when its root is right, while the
rules-only citation form remains wrong. A spelling rule based only on this
function word is unsupported; keep the class open rather than add a word map.
Source: [Cambridge US from](https://dictionary.cambridge.org/us/pronunciation/english/from).

### Cambridge US `production` and `promotion` references (2026-10-23)

Cambridge US gives *production* /prəˈdʌkʃən/ and *promotion* /prəˈmoʊʃən/;
the pinned IPA-Dict references used rhotic pretonic vowels for both. Added
source corrections to `src-data/en/custom.dict`. The existing rules-only
predictions already match Cambridge, so this is reference maintenance rather
than a rule gain. Against the fixed 6,990/3,617 cohort, strict changed from
5,484/2,965 to 5,485/2,967 and lenient from 6,403/3,372 to 6,404/3,374.
The rebuild retained the fixed denominator; newly reintroduced inflections
such as *productions* and *promotions* remain outside the frozen cohort.
Full-dictionary strict/lenient stayed 62,738/83,773, parity was
94,797/100,807, stress-aware headline/exact was 54,855/45,855, CMU
default/rules remained 4,749/4,190, context remained 88/85/53/49 and
homographs 1,455/1,615. The separate *distribution* reference candidate was
rejected: although Cambridge US supports the rules output, it lowered the
independent CMU default score by one. No baseline was refreshed.

Sources: [Cambridge US production](https://dictionary.cambridge.org/pronunciation/english/production),
[Cambridge US promotion](https://dictionary.cambridge.org/pronunciation/english/promotion),
[Cambridge US distribution](https://dictionary.cambridge.org/pronunciation/english/distribution).

### Cambridge US `result` family references (2026-10-23)

Cambridge US supports /rɪˈzʌlt/ for *result* and /rɪˈzʌltɪŋ/ for
*resulting*. Updated the source references for *results*, *resulted* and
*resulting* in `src-data/en/custom.dict`, retaining all three through the
general morphology trimmer. This corrects the source vocabulary to match the
standard dictionary; it does not alter the G2P rules. The rebuilt dictionary
contains 109,146 entries and restores the fixed common/top denominators to
6,990/3,617. Counts remain common strict/lenient 5,484/6,403, top-slice
2,965/3,372, full-dictionary 62,738/83,773, parity 94,796/100,805,
stress-aware 54,854/45,855, public CMU default/rules 4,749/4,190,
context 88/85/53/49 and homographs 1,455/1,615. Thus the earlier one-case
lenient drop was only the accidentally trimmed *resulting* row; with the
fixed population restored, no tracked metric regresses. The common strict
target still needs 808 words to reach 90%; the 5,484 count is below the
strict target. It exceeds the 5,270 ordinary-commit minimum by 214 words
against the documented 5,200 committed score, but this reference-only change
contributed no rules gain and no baseline was moved. The runtime dictionary
now carries the corrected readings; aggregate scores did not change.
Sources: [Cambridge US result](https://dictionary.cambridge.org/pronunciation/english/result),
[Cambridge US resulting](https://dictionary.cambridge.org/pronunciation/english/resulting).

### Automotive component reduction removed after policy audit (2026-10-22)

A later audit found that the `auto` + `motive` join condition was an exact-lexeme
G2P exception despite the earlier description as a compound rule. No broader
spelling class had evidence that separated *automotive* from *autopilot*,
*autoeurope*, *autopacific*, and other `auto-` formations, so the exception and
its context plumbing were removed. The dictionary-backed public reading remains
covered by the ordinary lexical entry; rules-only *automotive* returns its
component-based `/ˌɔtoʊˈmoʊtɪv/`. Its inflected form follows the existing
morphology route. The refreshed fixed common evaluation is 5,484/6,990 strict
and 6,403 lenient; the top slice is 2,966/3,617 strict and 3,373 lenient.
After rebuilding the existing source dictionary, public CMU is 4,749/5,000 by
default and 4,189 in rules mode; runtime parity is 94,797/100,807 strict and
100,699 lenient; stress-aware accuracy is 54,854 headline / 45,854 exact;
context cells remain 88/85/53/49, and homographs 1,455/1,615. The 10-fold
spelling-family learner accepted 13 training candidates but none passed the
legacy filter; held-out strict stayed 75.83%. Full tests pass (412 suites /
7,183 tests), typecheck and diff check pass. These counts are diagnostic, not a
qualifying release improvement or a baseline update.

### Rejected Cambridge US `-age` reference batch (2026-10-23)

Audited a 12-row reference batch after checking US entries for *message*,
*image*, *storage*, *package*, *cottage*, *village*, *damage*, *passage*,
*voltage*, *usage*, *luggage* and *dosage*. The references did match the
documented US readings, but the rebuilt candidate was rejected under the
no-regression gates: common strict rose only 5,484→5,487/6,990 and top-slice
strict 2,966→2,968/3,617, while rules-mode CMU fell 4,189→4,185, stress-aware
headline fell 54,854→54,848, and parity strict fell 94,796→94,795. Runtime
mining also changed compound routes for *messagepad*, *passageway* and
*storagetek*. The 12 temporary rows and generated tables have been reverted;
the regenerated pre-experiment dictionary, compound-parts and exceptions
files match the frozen hashes. Frozen snapshots and the changed-word replay
remain under `/tmp/phonemize-pre-age-reference-20261023.txt` and
`/tmp/phonemize-age-rule-changes.txt`. No score or baseline was adopted.

### Rejected direct custom-root fallback probe (2026-10-23)

Probed adding Cambridge-supported source rows for *have*, *one* and *said* to
`src-data/en/custom.dict` to resolve their rules-only silent-e/suppletive
failures. The rebuilt dictionary, exceptions and compound-parts hashes were
identical to the frozen inputs because those readings were already present in
the generated dictionary. `disableDict` also bypasses those direct lexical
entries; the rules-only predictions remained `/heɪv/`, `/oʊn/` and `/seɪd/`.
The source rows and a candidate test were removed. This confirms that lexical
source duplication cannot improve the fixed rules metric; these irregular
spellings remain open for a general class solution or an explicit benchmark
contract change, neither of which is justified by this probe.

### Attack the spelling-only rule premise (2026-10-23)

Tested the premise that a frequent spelling suffix alone identifies the
pronunciation correction. On the current fixed 6,990-word cohort, suffix
groups are large but internally mixed: `-age` has 46 entries (27 strict
errors, 19 exact rules matches), `-tion` 293 (31 errors, 262 matches),
`-ical` 37 (10 errors, 27 matches), and `-ity` 70 (24 errors, 46 matches).
These counts do not imply one shared cause: for example, `-tion` errors
include prefix/root stress, weak-vowel variants, and /ʃ/~/ʒ/ differences.
The already replayed broad candidates independently falsify the premise:
final `-ate` cost 48 common strict cases, broad `-tion` reduction cost 42,
and broad `-ical` reduction produced 10 wins but 27 losses. Cambridge US
supports /ɪ/ in *medical*, *clinical*, *chemical*, and *practical*, but weak
/ə/ in *political*, so even the direction varies inside this ending and the
pinned-reference disagreement is part of the error cohort. Sources:
[medical](https://dictionary.cambridge.org/pronunciation/english/medical),
[clinical](https://dictionary.cambridge.org/pronunciation/english/clinical),
[chemical](https://dictionary.cambridge.org/us/pronunciation/english/chemical),
[practical](https://dictionary.cambridge.org/us/pronunciation/english/practical),
and [political](https://dictionary.cambridge.org/us/pronunciation/english/political).
The next candidate must be conditioned on a morphological or phonological
environment that separates its wins from these same-suffix controls; no new
suffix-wide correction was adopted.

Follow-up on the same premise: common-cohort `-ly` has 22 strict errors among
175 words, but the error routes are mixed (direct rule, morphology and compound
decomposition); examples such as *only*, *directly*, *rely* and *hourly* do
not share a single stem operation. The `-lity` phoneme rule is also balanced
in the full dictionary: the pinned references contain 104 `/ləti/` and 104
`/lɪti/` endings. The common cohort has 25 such words (17 `/ləti/`, 8
`/lɪti/`), so replacing the ending sound globally would trade one set of
errors for another. These are prioritization evidence only; neither class has
been changed. A candidate should replay against the actual dispatcher and
identify a narrower stem/stress condition before implementation.

The structural TRAIN-only rule learner was also rerun on this checkout. It
accepted 31 fold-local candidates, but none passed its existing legacy filter
in any fold; the 10-fold held-out mean stayed at 75.83% before and after
filter-passed candidates. Its own corpus is 6,992 words (2 above the pinned
6,990 contract), and the replay covers only 5,088 pure-rule words (72.77%),
so this is candidate rejection evidence, not a release score or adoption
gate. Even its most repeated `l` reduction proposal had 29 TRAIN fixes against
22 breaks across folds and no filter pass; `b` reduction had 31 fixes/15
breaks but lost 8 top-slice cases. No learned correction was promoted. Report:
`/tmp/phonemize-next-release-rule-learning-20261023/cv-common-report.json`
(SHA-256 `ed67f6994c7e53e1d0eafe00d0d58608bac60aedffbd766207302fbcd9e5587a`).

### Rejected initial open-`i` before `r` candidate (2026-10-23)

The top approximate common failure trace, `phoneme:^i` → `/ɪ/`, covered 183
words. Replaying a conditional rule on the real `ruleSyllables` dispatch
(without editing source) showed the cluster spans stressed and unstressed
syllables and several distinct gold outcomes. A broad initial open-`i` before
`r` trial changed six common words for one strict win (`Irish`) and no common
loss, but over the full 105,068-word rules population it yielded 7 strict
wins and 5 losses. The losses include `iridium`, whose `/ɪ/` first vowel is
independently supported by Cambridge US; Cambridge supports initial `/aɪ/`
for `iron`, `irony`, and `Irish` as well. Sources: [iron](https://dictionary.cambridge.org/pronunciation/english/iron),
[irony](https://dictionary.cambridge.org/pronunciation/english/irony),
[Irish](https://dictionary.cambridge.org/us/pronunciation/english/irish),
and [iridium](https://dictionary.cambridge.org/pronunciation/english/iridium).
Narrowing to `<ir>a/o` removed the observed losses but yielded only two wins
(`ironic`, `irony`) outside the fixed common cohort. Neither condition
qualifies as a productive spelling/phonological class, so no rule was
adopted.

Full-path diagnostics likewise reject route removal as a general repair:
disabling morphology lowers common strict from 5,484 to 4,731; forcing
unsplit analysis lowers it to 4,617. The 91-rule postlex leave-one-out replay
found no single removal with positive common strict delta. Reports are
`/tmp/phonemize-next-release-routes-20261023/report.json` and
`/tmp/phonemize-next-release-postlex-20261023/results.json`; these isolate
alternative paths and rule contributions, not deployable changes.

The required whole-dictionary replay (`--all --include-long`) verifies this
at broader scope: morphology removal drops strict from 64,084 to 57,942/107,646,
and unsplit dispatch to 54,928/107,646. Of 177 postlex rules, the only
single-removal strict gain is `/nð$/` at +2/−1; it affects rare Greek/name
forms such as `manthe` and `xanthe`, with zero common-cohort changes. It is not
a productive English accuracy candidate. Full reports:
`/tmp/phonemize-next-release-routes-all-20261023/report.json` (SHA-256
`a5b72287a7f79df9503f3c43a8b2df186047c920a615a4465ea70eaa460a8c8e`) and
`/tmp/phonemize-next-release-postlex-all-20261023/results.json` (SHA-256
`623bb271d61857e8f4656ff994de8e1646bf53086d2543541cbed534cb2e079c`).

### Checked the common `-ution` vowel cluster (2026-10-23)

The common errors `contribution` and `institution` looked like a shared
unstressed-vowel reduction, but authoritative US references disagree with the
pinned `data/en/dict.json` targets in the direction that current rules already
produce: Cambridge gives `/ɪ/` in `contribution` and `/ə/` in `institution`.
Its US `attribution` entry also gives `/ə/`, while the pinned reference row has
`/ɪ/`; this is a useful paired family control outside the common mismatch
list. Sources: [contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
[institution](https://dictionary.cambridge.org/pronunciation/english/institution),
and [attribution](https://dictionary.cambridge.org/pronunciation/english/attribution).
No phoneme-rule change is supported by this cluster: forcing the pinned-reference
surface would move these cases away from the checked US readings. This is
reference-contract evidence only; the existing pinned evaluation was left
unchanged.

### Structural spelling-family candidate replay (2026-10-23)

The current structural learner was rerun against the frozen dictionary and
frequency-list hashes, with 10 spelling-family folds, minimum support 3, and
the actual `predict()` path. It covered 5,112/7,099 common words (72.01%)
eligible for rules-only replay. Across folds it accepted 265 TRAIN-selected
corrections, but none passed the existing TRAIN-only filter. Held-out strict
accuracy was 3,864/5,112 before and remained 3,864/5,112 after the passing
filter; applying every unfiltered correction instead reduced it to 3,816/5,112
and lowered held-out lenient from 4,587 to 4,559. The leading apparent TRAIN
candidate (`t`, unstressed `ɪ` to `ə`) was +61/−47 on TRAIN across folds and
passed the filter in 0/10 folds. No runtime rule was adopted.

Report: `/tmp/phonemize-next-release-learn-20261023/cv-common-report.json`
(SHA-256 `8c36c655dbc2d2d082b49647cb9858bf4106aef1785be6a9420cd12b49ea7b01`);
dictionary SHA-256 `a0724770946d32be592003a8e7996e6783523f00121d4647eeb3c0374acd6b35`,
frequency SHA-256 `981c776dc7e8996accb256e5fea9d241331b9602efe0c977285734890e1ae729`.

### Cambridge US `-age` references and the KIT plural (2026-10-23)

Cambridge US marks `/ɪ/` in the endings of *message, image, package, storage,
village, dosage, cottage,* and *passage*, while the pinned IPA-Dict rows used
`/ə/` for several of them. Its entries also confirm `/ɪdʒ/` in the roots
*bandage, forage,* and *hostage*. The source-checked `corrected-reference`
overlay now selects these attested readings and the regular sibilant plural
`/ɪz/` for their verified plural forms. Sources: [message](https://dictionary.cambridge.org/us/pronunciation/english/message),
[image](https://dictionary.cambridge.org/us/pronunciation/english/image),
[package](https://dictionary.cambridge.org/us/pronunciation/english/package),
[storage](https://dictionary.cambridge.org/us/pronunciation/english/storage),
[village](https://dictionary.cambridge.org/us/pronunciation/english/village),
[dosage](https://dictionary.cambridge.org/us/pronunciation/english/dosage),
[cottage](https://dictionary.cambridge.org/us/pronunciation/english/cottage),
[passage](https://dictionary.cambridge.org/us/pronunciation/english/passage),
[bandage](https://dictionary.cambridge.org/us/pronunciation/english/bandage),
[forage](https://dictionary.cambridge.org/us/pronunciation/english/forage), and
[hostage](https://dictionary.cambridge.org/us/pronunciation/english/hostage).
The entries for `bandages`, `images`, `messages`, `packages`, `passages`, and
`villages` also have `/ɪz/` variants in the pinned CMUdict cache.

The full-path loss replay exposed a related class issue: the ordinary
sibilant `/ɪz/` plural was being reduced to `/əz/` even when the disyllabic
`-age` base has a KIT `/ɪdʒ/` nucleus. The phonotactic repair preserves that
allomorph only when the KIT is not a diphthong offglide; it leaves weak and
diphthong controls such as *averages, beverages, porterages, damages,
mortgages, pages, stages, underages, percentages,* and *wages* unchanged.
The paired rules-path tests cover *images, messages, packages,* and *cottages*
in both isolation and sentence output.

After rebuilding the dictionary, compound parts and exceptions, the fixed
cohort is 5,491/6,990 common strict and 2,970/3,617 top-slice strict; lenient
is 6,404 and 3,373. Against the frozen pre-change run, common strict is +7,
common lenient +1, top strict +4 and top lenient unchanged. Full-dictionary
rules strict/lenient is 62,745/83,771 (strict +9; lenient unchanged by count).
Runtime parity strict is 94,802/100,806 versus 94,797/100,807 before; parity
lenient is 100,698 versus 100,699. The adoption contract gates parity strict.
Public CMU remains 4,749/5,000 default and 4,189/5,000 rules (the known legacy
rules-mode 90% floor still fails, and the rules count did not decrease).
Stress-aware headline is 54,849 with exact IPA 45,864; context cells remain
88/108, 85/108, 53/108 and 49/108; homographs remain 1,455/1,615.

The rebuild reports 531 dependency-aware re-pins and five net-positive
exception regressions (`caterings`, `fared`, `instituting`, `provance`,
`provence`); the standard accuracy gates above show no count regression.
`yarn typecheck`, all 412 Jest suites / 7,190 tests, and Rollup pass. The
Rollup run retains its existing external-dependency and mixed-export warnings.
Issue #28's apostrophe suite passes 24/24, including O'Reilly Media, possessives,
sentence tokenization and straight/curly apostrophes. Baselines remain
unchanged; the ordinary commit threshold is still 5,529 common strict.

### Rejected `-ility` reference correction after full-gate replay (2026-10-23)

Cambridge US gives a final schwa in *facility*, *liability*, *disability*,
*stability*, and *visibility*, matching the existing rules-only readings:
`/fəˈsɪɫəti/`, `/ˌɫaɪəˈbɪɫəti/`, `/ˌdɪsəˈbɪɫəti/`,
`/stəˈbɪɫəti/`, and `/ˌvɪzəˈbɪɫəti/`. Sources: [facility](https://dictionary.cambridge.org/us/dictionary/english/facility),
[liability](https://dictionary.cambridge.org/us/pronunciation/english/liability),
[disability](https://dictionary.cambridge.org/us/dictionary/english/disability),
[stability](https://dictionary.cambridge.org/us/pronunciation/english/stability),
and [visibility](https://dictionary.cambridge.org/pronunciation/english/visibility).
The pinned CMU reference instead uses /ɪ/ for the final weak syllable in these
five entries. A trial source correction left common strict at 5,491/6,990 and
the top slice at 2,970/3,617, while the public CMU score fell from 4,749 to
4,745 and the stress-aware score from 54,849 to 54,844. Rebuilding also changed
63 full-snapshot outputs, including `instability` and derived forms, without a
common strict gain. The candidate therefore failed the no-regression contract
and was removed; no runtime data or test expectation was retained. This is an
unresolved reference-contract conflict, not a G2P rule gap to patch with a
per-word exception.

The unchanged 1,296,352-line snapshot was regenerated after removing the trial
and compared byte-for-byte with the frozen pre-trial snapshot. Current strict,
parity, common API, apostrophe and `-age` plural checks returned to their
pre-trial values. No baseline was refreshed.

### Intervocalic /s/ cluster review (2026-10-23)

The next common strict error cluster was spelling `s` realized as `/z/` in
18 mismatches, but the examples split across unrelated environments:
intervocalic syllable onsets (*visa, Susan, prison, Jesus, Rosa*), coda clusters
(*lesbian, Disney, wisdom, Brisbane*), bound-prefix patterns (*disaster,
transmit*), and final `-se` (*please, ease*). A candidate rule based only on
“weak syllable after a vowel” would also affect voiceless controls such as
*basic* and *bison*; coda voicing would conflate *wisdom* with voiceless
`dis-` words. The frozen structural learner proposed no passing `s`/`z`
correction; its only nearby candidate was stressed `re-` `z→s` (6 TRAIN fixes,
4 breaks, accepted in 2/10 folds and passed in 0/10). No general class change
was supported, so no source or output table was edited. This remains a
phonemic spelling ambiguity rather than a safe broad rule candidate.

### Rejected `-ical` dictionary-reading trial and common-rule mining (2026-10-23)

Cambridge US supports `/ɪ/` in several common `-ical` readings where the
fixed IPA-Dict rows use `/ə/`. A trial added twelve source-checked base and
plural entries to `src-data/en/custom.dict` and rebuilt the runtime tables.
Common rules strict stayed at 5,491/6,990 and the top slice at 2,970/3,617;
public CMU default stayed at 4,749/5,000 and rules rose by one to 4,190/5,000.
The stress-aware headline fell from the frozen 54,849 to 54,839, so the
candidate violates the no-regression contract despite the Cambridge readings.
The mappings were removed, generated English dictionary and exception hashes
returned to their pre-trial values, and no baseline was refreshed. This is a
reference-variant conflict, not an adopted spelling rule.

The frozen common-word learner accepted no ordinary local correction in any
of ten spelling-family folds. Its structural pass accepted 29 candidates but
none passed the TRAIN-only filter; held strict stayed at 75.96% before and
after passing candidates. A second structural run optimizing edit distance
accepted 10 candidates and also passed none of the filters. Route replay
confirmed morphology improves the common cohort: strict fell from 5,491 to
4,738 when morphology was removed. Neither diagnosis exposed a safe replacement
class. The learner reports and route
evidence are under `/tmp/phonemize-ical-20261023/` and
`/tmp/phonemize-route-diagnosis/report.json`. After restoring the frozen state,
all 412 Jest suites / 7,190 tests and typecheck passed. No rule or baseline
change was adopted from this investigation.

### Rechecked common mismatch clusters and `-land` composition (2026-10-23)

The current fixed-cohort replay remains 5,491/6,990 strict and 2,970/3,617
top-slice strict. Its largest direct trace clusters are initial-letter vowel
alternations and named entities/initialisms; they do not describe shared
productive environments. The 14 common `-land` mismatches were traced through
the actual rules path: *Ireland, England, Finland,* and *Queensland* use direct
letter rules; *Maryland, Portland, Oakland, Iceland,* and *Highland* use distinct
compound dispatches; *Cleveland, Newfoundland, Switzerland, Auckland,* and
*Swaziland* have separate vowel or consonant errors. Even the `land` syllable
varies between weak `/lənd/` and secondary-stressed `/ˌlænd/`, while many
similar compounds are already correct. A shared `-land` rewrite would therefore
hide unrelated root errors and break correct controls. No pronunciation rule
was changed. The public default API remains 4,749/5,000 (94.98%), and the
clarified O'Reilly Media issue #28 suite passes 24/24 including straight and
curly apostrophes. Next candidate work should target an environment with
consistent root and suffix ownership, not spelling overlap alone.

### Rejected `cui` onset and rules-path dictionary fallback (2026-10-23)

The common `cuisine` miss suggested restoring `/w/` in an initial `cui` onset.
Replay showed the unguarded spelling pattern also changed the noninitial
`cuit` syllables in *circuit* and *biscuit*; a first-syllable guard preserved
those controls and `cuing`, but the fixed common strict counts stayed
5,491/6,990 and 2,970/3,617 (lenient common increased by one). Cambridge US
supports /kwɪˈziːn/ for *cuisine* and /kwiː/ at the start of *Cuisinart*;
Spanish sources support /kwi/ for *cuidado*. Sources: [Cambridge cuisine](https://dictionary.cambridge.org/pronunciation/english/cuisine),
[Cambridge Cuisinart](https://dictionary.cambridge.org/us/pronunciation/english/cuisinart),
and [Cambridge Spanish cuidado](https://dictionary.cambridge.org/dictionary/spanish-english/cuidado).
The same trace showed that `disableDict: true` bypasses even a verified
`src-data/en/custom.dict` row, so adding *cuisine* there cannot improve the
rules-only acceptance metric. The source-only experiment and onset rule were
removed; `src/en/syllabify.ts`, `src-data/en/custom.dict`, generated dictionary,
and exception hashes match the frozen inputs. No pronunciation baseline was
refreshed. This onset remains a narrow loanword cluster, not an adopted rule.

### Adopted `do + -es` allomorph and POS preservation (2026-10-23)

The user clarified that the reported apostrophe example concerns O'Reilly Media;
the existing general apostrophe handling remains correct for the brand and its
straight/curly forms. A separate productive morphology defect was found in the
verb family `does`, `redoes`, `undoes`, `outdoes`, and `overdoes`: regular
sibilant `-es` was selecting the stem-final `/u/` instead of the established
`do` allomorph. The morphology route now selects `/ʌ/` before `/z/` for that
verb class. When POS identifies noun `does` (the plural of *doe*), it instead
uses the regular `doe + -s` composition and preserves `/doʊz/`. The function
word reducer now respects noun POS, preventing a noun reading from receiving
the weak verbal form. Paired regressions cover the derived verbs, `do/doing/done`,
`goes`, noun `does`, and weak-form sentence context.

The frozen full-dictionary snapshot changed 28 rows: 3 rule-path words
(`does`, `outdoes`, `overdoes`), 4 morphology forms (`adoes`, `hairdoes`,
`redoes`, `todoes`), and 21 function-word tokens tagged as nouns. Dictionary
routes did not change. The fixed common cohort gained one strict item to
5,492/6,990, and the top-5,000 slice gained one to 2,971/3,617; common
lenient is 6,404/6,990 and top lenient 3,373/3,617. The full rule-path strict
count gained three to 62,748, with lenient unchanged at 83,771. Public CMU
default remains 4,749/5,000; rules increased by one to 4,190/5,000. Runtime
parity is 94,802/100,806 strict and 100,698 lenient. Stress-aware phonemic
correctness is 54,852 (exact 45,864). Homographs remain 1,455/1,615.

The context IPA contract is unchanged (`per-reading-pos-subset-v2`): default
automatic 88/108, default known-POS 85/108, rules automatic 53/108, and rules
known-POS 49/108. The evaluator reports no changed eval occurrences in any
cell; every reading, slice, fixed supported-POS case and explicit control is
therefore preserved. The full Jest suite passes (413 suites, 7,196 tests),
typecheck passes, `yarn build` succeeds, and the extracted npm package passes
CJS and ESM smoke checks for verb/noun `does`, sentence weak form, and
O'Reilly Media. No baseline was refreshed: common strict remains below the
next-release target of 6,292/6,990, and the top slice remains below 3,256/3,617.

### 2026-10-23 common error-route and expanded learner replay

Re-ran `node --require tsx/cjs scripts/evaluate.ts --subset common --cluster`
against the current checkout: common strict is 5,492/6,990 and top-slice strict
is 2,971/3,617. The leading trace class is initial `i` (183 trace hits), but
only 62 strict common mismatches actually begin with `i`; those split across
PRICE names and places (Ireland, Iran, Iraq, Iowa), initialisms, and unrelated
segment/stress-forming environments. No general onset change is supported by
that count. The remaining top trace clusters are single-letter vowels with
multiple expected outputs, likewise too broad without narrower structural
conditions.

The full common route replay verified all 6,992 manifest rows: removing
morphology reduces strict from 5,492 to 4,738 and lenient from 6,404 to 5,915;
using the unsplit route reduces them further to 4,624 and 5,837. The postlex
removal table identified no positive high-yield removal; its largest strict
regressions are useful retained rules (`/əɹ/`, `/sʒ/`, `/oʊɹ/`, and doubled
consonant reduction). Expanded spelling-family cross-validation increased the
structural learner limit from 30 to 100 rules. Strict optimization accepted 29
fold-local candidates but none passed the existing training-only candidate
filter in any of 10 folds; mean held-out strict stayed 75.96%. Distance
optimization accepted 10 candidates, with zero passing any fold. Its best
repeatable candidate (`n`, right context `it`, `/ə/→/ɪ/`) had 12 train fixes and
9 breaks across accepted folds and top-5,000 evidence of 3 fixes/5 breaks.
Other high-frequency weak-vowel candidates also failed paired-break and
out-of-fold checks. No runtime rule or baseline was changed from this replay.
Reports are saved under `/tmp/phonemize-structural100-20261023/`,
`/tmp/phonemize-distance-structural100-20261023/`, and
`/tmp/phonemize-route-diagnosis/`.

### Correct casual nasal-stop omissions in regular `-nted/-nting` references (2026-10-23)

A fixed-cohort mismatch audit found that the runtime rules already preserve the
stem-final `/t/` in regular forms, while eight IPA-Dict entries omitted it:
`documenting`, `hinted`, `jointed`, `mounted`, `prevented`, `preventing`,
`resenting`, and `segmented`. The source normalizer now restores that written
stop in `-nted` entries even when the reference already has the syllabic
`/ɪd/`, and in `-nting` entries whose phone string has `/nɪŋ/` or `/nəŋ/` with
no stop. Cambridge US transcribes *mounted* with /t/ (flapped in its phonetic
notation); Oxford gives `/prɪˈventɪŋ/` and `/prɪˈventɪd/` for *preventing* and
*prevented*. Cambridge's *document* entry and participle usage support the
same preserved stem stop. See [Cambridge mounted](https://dictionary.cambridge.org/us/dictionary/english/mounted),
[Oxford prevent verb forms](https://www.oxfordlearnersdictionaries.com/us/definition/english/prevent),
[Cambridge documenting](https://dictionary.cambridge.org/dictionary/english/documenting),
and [Cambridge document](https://dictionary.cambridge.org/pronunciation/english/document).

The rebuilt dictionary changed eight reference rows, with two in the fixed
common cohort (`mounted`, `preventing`). Rules-only output for both already
matched the authoritative stop-preserving readings, so the common strict count
rose from 5,492 to 5,494/6,990 because the references were corrected; this is
source-quality evidence, not a rule gain. Top-slice strict stayed 2,971/3,617.
The runtime snapshot changed 21 output rows: `documenting` and `segmented`,
whose new source readings entered the exception table, plus 19 synthetic
suffix probes derived from those two words. Their full prediction diffs were
reviewed. No per-word G2P rule or mapping was added. The committed common
baseline was not refreshed because its reference set changed.

After rebuilding, runtime parity is 94,810/100,806 strict and 100,700 lenient;
stress-aware phonemic correctness is 54,858 (exact 45,870). Public CMU default
remains 4,749/5,000 and rules-only remains 4,190/5,000 (the known legacy
rules-only 90% floor still fails). Homographs remain 1,455/1,615. Context IPA
remains 88/108 default/automatic, 85/108 default/known-POS, 53/108
rules/automatic, and 49/108 rules/known-POS; all eval occurrence diffs are
empty, including the fixed supported-POS subset and controls. The full Jest
suite passes (413 suites, 7,207 tests), typecheck passes, the complete data and
Rollup build succeeds, and extracted-package CJS/ESM smoke checks pass for
O'Reilly and its possessive as well as `mounted` and `preventing`. The common
strict release target remains 6,292/6,990, so this reference correction does
not complete the pronunciation objective.

### Independent-source check of the remaining common-rule misses (2026-10-23)

Compared the current fixed top-5,000 rule predictions against both the pinned
CMU public-segment report and IPA-Dict. Of 643 top-slice words where rules
differ from IPA-Dict, 505 have CMU readings matching IPA-Dict without matching
the rule prediction; only one has a CMU reading matching rules but not
IPA-Dict. This confirms those 505 as credible rule-miss candidates, but does
not itself identify a safe shared spelling rule: the largest suffix buckets
mix stress, vowel quality, and lexical subclasses. For example, the `-cent`
family includes initial-stress *recent/decent*, final-stress *percent/ascent*,
and already-correct *descent/crescent/innocent*.

Replayed both strict- and distance-objective rule learners over the same
family-folded common population. Strict accepted 11 and structural strict 29
fold-local candidates; distance accepted 10; none passed the existing
train-only paired-break filter in any fold. Structural strict held-out mean
remained 75.96%. The candidates with the strongest top-slice evidence still
had more paired breaks than fixes or failed out-of-fold checks. No rule was
adopted from these proposals. Reports are under
`/tmp/phonemize-rule-corrections/` and
`/tmp/phonemize-structural100-20261023/`.

### Preserve weak syllables inside hyphen compounds and repair `-together` (2026-10-23)

The shared hyphen join previously moved stress to the start of the second
component. When that component begins with a weak syllable, this changed its
vowels as well as its stress. The join now preserves the first component's
head stress and demotes the second component's existing stress; productive
prefixes such as `non-` retain their earlier route. This yields the attested
phonemes for *get-together* and *air-conditioning* without changing
`non-automotive`, `ad-nauseam`, or the `today/tonight` controls. Cambridge US
gives `/ˈɡet.təˌɡeð.ɚ/` for *get-together*, `/ˈer kənˌdɪʃ.ə.n.ɪŋ/` for *air
conditioning*, and `/təˈɡeð.ɚ/` for *together*; its *altogether* entry supports
the weak `to-`, LOT `all-`, hard `/ɡ/`, and stressed `/ɛ/` sequence. See
[Cambridge get-together](https://dictionary.cambridge.org/us/dictionary/english/get-together),
[air conditioning](https://dictionary.cambridge.org/pronunciation/english/air-conditioning),
[together](https://dictionary.cambridge.org/pronunciation/english/together), and
[altogether](https://dictionary.cambridge.org/us/pronunciation/english/altogether).

The unhyphenated `-together` spelling class now gives rule-only
`together` `/təˈɡɛðɝ/` and `altogether` `/ˌɔɫtəˈɡɛðɝ/`. Across the fixed
dictionary snapshot, the rule path gained two strict matches and three
lenient matches, with zero losses; the two strict wins are `together` and
`altogether`. The common cohort rose by one strict word to 5,495/6,990, and the
top slice by one to 2,972/3,617. CMU rules-only rose by one segment to
4,191/5,000; default CMU stayed at 4,749/5,000. Full-dictionary rule strict
rose from 62,754 to 62,756. These are small accumulated gains, below the
70-word ordinary improvement-commit threshold; no baseline was refreshed and
no commit was made.

After rebuilding, all 414 Jest suites / 7,217 tests pass, as do typecheck,
Rollup, runtime parity (94,810/100,806 strict; 100,700 lenient), stress-aware
IPA (54,860 headline; 45,872 exact), homographs (1,455/1,615), and all four
context IPA cells (unchanged at 88/108, 85/108, 53/108, 49/108). Public CMU
default remains above its 4,739 gate. The rules-only 90% legacy gate still
fails, but its score did not regress. Extracted npm-package CJS and ESM checks
return the same together/altogether and O'Reilly Media/possessive readings.
The fixed release targets remain open by 797 common words and 284 top-slice
words.

### Recheck the frequent `-ity` mismatch bucket against a pronunciation source (2026-10-23)

The current rules-only common report groups several misses under `-ity`, including
*facility* (`/fəˈsɪlɪti/` expected vs `/fəˈsɪləti/` predicted) and *charity*
(`/ˈtʃɛɹɪti/` expected vs `/ˈtʃɛɹəti/` predicted). Cambridge US gives
`/fəˈsɪl.ə.t̬i/` for *facility* and `/ˈtʃer.ə.t̬i/` for *charity*, matching the
runtime vowel reduction in both words ([facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[charity](https://dictionary.cambridge.org/us/pronunciation/english/charity)).
This confirms the strict-CMU mismatch is not evidence that the productive suffix
rule should force `/ɪ/`; doing so would move these outputs away from the
independently sourced US pronunciations. No runtime rule or reference was changed.

The current fixed common score remains 5,495/6,990 strict (78.61%), with
2,972/3,617 (82.17%) on the top-5,000 slice. This source check does not count as
a pronunciation gain and leaves the 90% common target open. Future work on this
bucket needs per-word source confirmation and paired neighboring controls before
any suffix-wide change.

A second source check found the same oracle limitation in another frequent
mismatch: rules-only *wanted* is `/ˈwɑntɪd/`, while the pinned IPA-Dict target is
`/wɔntɪd/`; Cambridge US gives `/ˈwɑːn.t̬ɪd/`, supporting the rule output
([wanted](https://dictionary.cambridge.org/us/pronunciation/english/wanted)).
The default dictionary still follows the pinned target, so replacing that
reference would also change the default CMU comparison; it is not a safe
benchmark-only score adjustment. By contrast, *naked* is a real open rules
error: rules predict `/ˈneɪkt/`, while Cambridge US gives `/ˈneɪ.kɪd/`
([naked](https://dictionary.cambridge.org/pronunciation/english/naked)). The
fixed common cohort has no productive `-ked` comparison class beyond ordinary
`-ed` forms such as *asked, worked,* and *marked*, so forcing syllabic `/ɪd/`
on that spelling would be an unsupported exception. Neither case was changed;
both remain separate from suffix-wide gains.

The apparent `-less` cluster also does not support a vowel rewrite. In the
fixed common cohort, only *wireless* and *regardless* are strict mismatches
among five `-less` forms. *Tireless* and *peerless* controls already follow
Cambridge US `/ˈtaɪr.ləs/` and `/ˈpɪr.ləs/`; Cambridge's US *regardless* entry
also gives `/rɪˈɡɑːrd.ləs/`, consistent with the runtime's reduced suffix
([tireless](https://dictionary.cambridge.org/us/pronunciation/english/tireless),
[peerless](https://dictionary.cambridge.org/pronunciation/english/peerless),
[regardless](https://dictionary.cambridge.org/us/dictionary/english/regardless)).
The two remaining label differences involve different positions and do not
form a productive `-less` correction class, so no suffix change was made.

### Rejected `-terest` rule replay (2026-10-23)

Oxford lists *interest* as `/ˈɪntrəst/` and `/ˈɪntrest/`
([Oxford Advanced Learner's Dictionary](https://www.oxfordlearnersdictionaries.com/us/definition/english/interest_1));
the isolated rules-only route currently gives `/ɪnˈtɛɹəst/`. A candidate
`-terest` rime produced `/ˈɪntɹəst/` and raised rules-only CMU accuracy by one,
but common-subset strict stayed 5,495/6,990. Its broad spelling match also
changed *bitterest* on the default path and changed stress in *self-interest*;
runtime parity fell from 94,810 to 94,809 strict. Oxford marks secondary stress
on the first component of *self-interest* (`/ˌself ˈɪntrəst/`)
([Oxford entry](https://www.oxfordlearnersdictionaries.com/us/definition/english/self-interest)),
which the candidate did not preserve. The candidate and its test were removed;
the pre-change `src/en/syllabify.ts` hash and common score are restored. This
root-specific rime is not a safe general rule under the current gate contract.

### Initial `ex-` mismatch cluster is stress/POS mixed (2026-10-23)

An alignment audit of the fixed 6,990-word common cohort found eleven
single-vowel mismatches with rule `/ɪ/` where the pinned reference has `/ɛ/`
at the initial `ex` spelling. That does not support a global `ex` vowel rule:
common controls *expect, exchange, experience,* and *expense* already require
and receive `/ɪ/`. Oxford confirms initial stress and `/ɛ/` for *expert*
(`/ˈekspɜːrt/`) and for the noun *export* (`/ˈekspɔːrt/`), while *export* as
a verb has a different stress pattern ([expert](https://www.oxfordlearnersdictionaries.com/us/definition/english/expert_2),
[export](https://www.oxfordlearnersdictionaries.com/us/definition/english/export_1)).
The cluster also includes *exit, exercise, extreme,* and *extract*, whose
stress or part-of-speech choices differ. Since the fixed rules-only gate has
no token POS/context, a blanket initial-`ex` adjustment would trade these
classes against already-correct controls. No rule was adopted from this
cluster; any follow-up needs a genuinely productive morphological condition
that preserves the checked `ex-` verb families.

### Re-source prefix voicing replay (2026-10-23)

The rule-only form of *resource* incorrectly voiced root-initial `/s/` to `/z/`
across the productive `re-` boundary. Cambridge US lists `/ˈriː.sɔːrs/` first
and `/ˈriː.zɔːrs/` as a variant; Oxford lists `/ˈriːsɔːrs/` and
`/rɪˈsɔːrs/` ([Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/resource),
[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/resource_1)).
The prefix rule now preserves `/s/` for `re- + search/source` families while
leaving the distinct `/z/` allomorphs in *resort* and *result* unchanged. Paired
controls cover *research, resort, result, resupply, resources, resourceful,*
*source,* and *sources*. The full rule-path replay changed only *resource* and
seven synthetic morphology probes; default dictionary output was unchanged.

After rebuilding the shipped dictionary and dependency-aware exception table,
the common cohort measured 5,496/6,990 strict and 6,405/6,990 lenient; the
top-5,000 slice measured 2,973/3,617 strict and 3,374/3,617 lenient. Relative
to the frozen pre-change run, each strict slice gained one and lenient counts
were unchanged. Runtime parity remained 94,810/100,806 strict and 100,700
lenient; stress-aware accuracy increased by 75, homographs remained
1,455/1,615, and all four context-IPA cells were unchanged. Public CMU default
remained 4,749/5,000 (94.98%); rules-only was 4,192/5,000 (83.84%), up one
and still below its known legacy 90% floor. Typecheck, all 415 Jest suites
(7,226 tests), and direct Rollup build passed. The full dictionary report-only
metric is tracked separately from the fixed common cohort. This is a one-word
gain, so it stays in the accumulating batch and does not qualify for a commit
or baseline refresh.

### Fresh structural-correction replay on the current common cohort (2026-10-23)

The fixed-cohort failure-cluster report is dominated by initial vowel choices
in names and words with multiple lexical readings; the largest approximate
clusters are initial `i` (183), `a` (134), and `e` (162 combined across
several targets). The counts are diagnostic only: a grapheme cluster mixes
different lexical items and is not evidence for a shared rule.

Reran `learn:rules --structural` against the current source and pinned caches,
using family-grouped folds and its actual rule-path replay. It selected 29
training candidates across ten folds, but none passed the legacy filter in any
held-out fold; mean held-out strict stayed 76.00%. The research runner covers
5,088 of its 6,992 common testable items, so its output is candidate triage,
not the fixed-cohort release metric. No learned correction was adopted.

The current route replay scored 5,496/6,992 with morphology enabled; removing
morphology fell to 4,742 and the unsplit alternative to 4,628. The postlex
ablation replay found no removal that improves common strict accuracy. These
checks confirm that productive morphology and postlex behavior are already
material to the score; future candidates need a specific morphological
boundary with sourced readings and paired unchanged controls rather than a
generic phone substitution.

### `re-` before the Latin `flect` root (2026-10-23)

Cambridge US gives `/rɪˈflekt/` for *reflect* and `/rɪˈflekʃən/` for
*reflection* ([reflect](https://dictionary.cambridge.org/us/dictionary/english/reflect),
[reflection](https://dictionary.cambridge.org/us/pronunciation/english/reflection)).
Its prefix entry lists `re-` as `/riː-/, /ri-/, /rɪ-/`, while *reflux* has
`/riː/` ([re-](https://dictionary.cambridge.org/us/pronunciation/english/re),
[reflux](https://dictionary.cambridge.org/us/pronunciation/english/reflux));
so this does not justify changing every initial `re` or `refl` spelling.
The spelling/morphology condition now covers the `re- + flect` root and its
common derivations, while paired controls keep the existing `/i/` in *reflag,
reflate, reflation,* and *reflux* and preserve the distinct *reflex* and
*reflectone* readings.

Frozen 1,296,352-row snapshots changed 18 predictions after the complete
rebuild: four rule-only words (*reflect, reflection, reflective, reflector*)
and 14 mechanically generated, nonstandard suffix probes. The other 1,296,334
rows were identical; no default dictionary or POS-context output changed. The
probe changes were reviewed; valid family forms are pinned by the regression
test, while examples such as *reflectiones*, *reflectored,* and the generated
forms of *reflectone* are not English inflections. The common strict score
rose by two to 5,498/6,990, top-5,000 by one to 2,974/3,617, and full-dict
strict by four to 62,761/105,067; each lenient count was unchanged. Public CMU
default stayed 4,749/5,000, rules-only rose one to 4,193/5,000, parity and
homographs stayed level, stress-aware accuracy rose four, and all context-IPA
cells stayed level. Typecheck, 416 Jest suites (7,238 tests), direct Rollup,
and the issue #28 regressions passed. At two new common strict words, this
remains below the 70-word improvement-commit minimum and stays uncommitted.

### `re-` before the `fresh` root (2026-10-23)

Cambridge US gives `/rɪˈfreʃ/` for *refresh* and `/rɪˈfreʃ.mənt/` for
*refreshment* ([refresh](https://dictionary.cambridge.org/us/dictionary/english/refresh),
[refreshment](https://dictionary.cambridge.org/pronunciation/english/refreshment));
Cambridge also gives `/rɪˈfreʃ.ɚ/` for *refresher*
([refresher](https://dictionary.cambridge.org/us/pronunciation/english/refresher)).
The new root-and-suffix condition applies weak `/ɪ/` to the `re- + fresh` family
without changing productive `/i/` in controls *reflag, reflate, reflation,
reflux, reframe,* and *rephrase*. The family forms *refresh, refreshed,
refreshing, refreshes, refresher, refreshment,* and *refreshingly* are covered
by regressions.

Against the frozen pre-change snapshot, only the rule-path pronunciation of
*refresh* changed among the fixed evaluation items, correcting one strict
common-cohort error; the complete rebuild additionally changed five generated
synthetic morphology probes (*refreshs, refresheres, refreshered,
refreshering,* and *refresherer*). Those probes are not standard English forms;
the real inflections and controls remain pinned by tests. No paired control or
tracked accuracy gate regressed. After rebuild, common strict/lenient measured
5,499/6,990 and 6,405/6,990; top-5,000 strict/lenient was 2,974/3,617 and
3,374/3,617. Full-dictionary strict/lenient was 62,762/105,067 and
83,774/105,067. Runtime parity remained 94,810/100,806 strict and 100,700
lenient; public CMU default remained 4,749/5,000, while rules-only remained
4,193/5,000. Stress-aware correct count rose one to 54,865; homographs stayed
1,455/1,615, and all four context-IPA cells were unchanged. Typecheck, direct
Rollup, all 417 Jest suites (7,256 tests), and issue #28 regressions passed.
This one-word gain remains in the accumulating batch below the 70-word minimum
for an improvement commit; baselines were not refreshed.

### Fresh family-fold structural replay after the October 23 rule batch

Re-ran `learn-rule-corrections.ts --structural` against the current 6,992-word
learner population and pinned caches. Actual runtime replay reached 5,085 of
6,992 words (72.73% pure-rule coverage). Across ten spelling-family folds it
accepted 28 local candidates, but none passed the existing TRAIN-only filter;
the held-out strict mean remained 76.05% after only passing candidates. Applying
all accepted proposals instead lowered held strict from 3,867 to 3,858/5,085.
The most repeated proposal was an unstressed `/ɪ/`→`/ə/` change around `l`
(36 training fixes, 26 breaks, including 18/10 on the top slice), but its
examples mixed different syllable and spelling classes: it helped *challenge,
holiday,* and *privilege* while breaking *college, affiliate,* and *Halifax*.
No general rule is supported by that signal, so no source behavior or baseline
changed. The current fixed-cohort acceptance remains 5,499/6,990 common strict
and 2,974/3,617 top-slice strict. Full learner output is at
`/tmp/phonemize-rule-corrections/cv-common-report.json`.

### Source-check the `-tion` weak-vowel residuals

The common mismatch report includes *definition* (`/ˌdɛfəˈnɪʃən/` in the
pinned IPA-Dict row vs rules `/ˌdɛfɪˈnɪʃən/`) and *definitive* (pinned weak
`/ɪ/` vs rules `/ə/`). Cambridge US records the `/ɪ/` syllable for
*definition* and `/ə/` for *definitive*; Cambridge US also gives `/ə/` in
*definite* and *definitely*. Oxford's American entry independently supports
the `/ə/` in *definitive* ([Cambridge definition](https://dictionary.cambridge.org/us/pronunciation/english/definition),
[definitive](https://dictionary.cambridge.org/us/pronunciation/english/definitive),
[definite](https://dictionary.cambridge.org/us/dictionary/english/definite),
[definitely](https://dictionary.cambridge.org/us/pronunciation/english/definitely);
[Oxford definitive](https://www.oxfordlearnersdictionaries.com/us/definition/english/definitive)).
These strict mismatches therefore do not support changing the weak-vowel rule;
they are source-variant disagreements and are not pronunciation gains. No
runtime or benchmark references changed.

### Weak `re-` before the verb stem `fer` (2026-10-23)

Cambridge US gives *refer* `/rɪˈfɝ/` and *referral* `/rɪˈfɝ.əl/`; Oxford's
American entry explicitly gives *referred* `/rɪˈfɜːrd/`. The prior IPA-Dict
rows used `/rə/` for *refer* and *referred*, while the existing *referral* and
*referring* references already used `/rɪ/`. Corrected three source rows in
`src-data/en/custom.dict`, and added a root-conditioned rule for bare `refer`;
the regular inflection and `-al` morphology inherit the corrected lexical
stem. Paired controls retain the separate initial-stress or suffix readings in
*reference, referent, referee, reframe,* and *rephrase*. Sources: [Cambridge
refer](https://dictionary.cambridge.org/us/pronunciation/english/refer),
[Cambridge referral](https://dictionary.cambridge.org/us/pronunciation/english/referral),
and [Oxford referred](https://www.oxfordlearnersdictionaries.com/us/definition/english/refer).

The frozen 1,293,482-key snapshot comparison had 23 changed existing
predictions, 13 added and 13 removed rows. Changes were limited to the
`refer`/`referred` family and generated suffix probes; no unrelated word key
changed. The dependency-aware exception rebuild retained 532 re-pins and five
known net-positive regressions. After rebuild, common strict was 5,502/6,990
(up three combined with the verified source corrections) and top-slice strict
was 2,975/3,617 (up one); common and top lenient remained 6,405 and 3,374.
The reference corrections are separate evidence and are not counted as pure
rule gains. Full-dictionary strict rose four to 62,766/105,067 with lenient
unchanged at 83,774; runtime parity stayed 94,810/100,806 strict and 100,700
lenient. Public CMU default remained 4,749/5,000 and rules-only rose one to
4,194/5,000. Stress-aware correctness rose one to 54,866; homographs stayed
1,455/1,615, and context IPA stayed 88/85/53/49 in its four cells. All 418
Jest suites / 7,267 tests, typecheck, and Rollup passed, including issue #28.
The total common strict change remains below the 70-word ordinary commit
minimum; no baselines were refreshed.

After this rebuild, repeated the structural learner audit on the expanded
6,993-word population: 27 candidates were selected over ten spelling-family
folds, and none passed the existing held-out filter. Mean held strict remained
76.06%; the strongest `/ɪ/`→`/ə/` proposal around `l` had 36 training fixes
against 26 breaks and failed all ten folds. Route and postlex removal
diagnostics likewise produced no actionable rule candidate with positive
common strict net. No runtime behavior changed in these diagnostics.

### Preserve hard /ɡ/ across closed -in compounds (2026-10-23)

The rule-only route softened the final /ɡ/ in *login* and *plugin* by
letting the following *i* cross a closed compound boundary. Added a
compound-root-conditioned rule for verified monosyllabic *-og/-ug* heads,
plus a regular plural path for *logins*; *begin, virgin, origin,* and
*margin* remain paired soft-g controls. Cambridge US records primary-stress
*login* `/ˈlɑːɡ.ɪn/` and *plug-in* `/ˈplʌɡ.ɪn/`, with the STRUT vowel in the
latter. Cambridge's /ɑː/ for *log/login* conflicts with the fixed CMU cohort's
/ɔ/ convention; switching it lowered common strict by five and CMU default by
two, so this batch retains /ɔ/ and records that source discrepancy instead
of claiming a gain. The source rows use the project's dark-L convention; the
closed-compound rule derives the reading from its verified root and adds no
whole-word runtime maps. References:
[Cambridge login](https://dictionary.cambridge.org/pronunciation/english/login)
and [Cambridge plug-in](https://dictionary.cambridge.org/pronunciation/english/plug-in).

The frozen snapshot had 12 changed predictions and no added or removed keys:
dictionary/rule `login`, rule `plugin`, `logins`, and generated suffix probes
for `login`. No unrelated word family changed. The dependency-aware rebuild
retained 532 re-pins and five known net-positive regressions. Common
strict/lenient reached 5,503/6,990 and 6,407/6,990; top-5000 strict/lenient
reached 2,976/3,617 and 3,375/3,617. Full-dictionary strict/lenient were
62,767 and 83,776 (105,067 words); runtime parity was 94,810/100,806 strict
and 100,700 lenient. Public CMU default remained 4,749/5,000; rules-only was
4,195/5,000, compared with its recorded 4,194 before-run value and existing
sub-90% floor. Stress-aware correctness was 54,867 with exact 45,882;
homographs remained 1,455/1,615 and context IPA remained 88/85/53/49. All 419
Jest suites / 7,275 tests, typecheck, Rollup, and `git diff --check` passed.
This batch is below the required 70-word common-strict commit gain, so no
baseline was refreshed and the work remains accumulated for a later qualified
batch.

The next structural learner pass used the unchanged 6,993-word common
population and ten spelling-family folds. It accepted 29 tentative rules,
but none passed the held-out diagnostic; applying all tentative rules reduced
held-out strict from 3,867/5,082 to 3,856/5,082. The leading `/ɪ/`→`/ə/`
proposal after `l` had 34 training fixes against 25 breaks and failed all
folds. No further runtime rule was adopted from this pass.

### Generalize the `matur-` root family and retain apostrophe-name behavior (2026-10-23)

Cambridge US supports `/məˈtʃʊr/` for *mature*, `/məˈtʃʊrəti/` for *maturity*,
and `/ˌmætʃ.əˈreɪ.ʃən/` for *maturation*. The rules-only route had assigned first
stress to *mature* and missed the palatalized `/tʃ/` in the related roots. Added
a spelling-family-conditioned final-stress rule, `ture`/`tu` reflex, and bound-root
composition for `-ation`; no whole-word runtime maps or source-table entries were
added. Paired controls include *nature, future, premature, temperature,* and
*stature*. Cambridge references: [mature](https://dictionary.cambridge.org/pronunciation/english/mature),
[maturity](https://dictionary.cambridge.org/us/pronunciation/english/maturity),
[maturation](https://dictionary.cambridge.org/us/pronunciation/english/maturation),
[immature](https://dictionary.cambridge.org/us/dictionary/english/immature),
and [matured](https://dictionary.cambridge.org/us/dictionary/english/matured).

The frozen 1,296,352-prediction snapshot changed exactly five rules-only forms:
*mature, immature, maturity, immaturity,* and *maturation*. No dictionary, morphology,
or POS prediction changed. The relevant controls and the 33 issue #28 apostrophe tests
passed, including *O'Reilly Media*, `O'Reily`, curly apostrophes, and possessives;
O'Reilly's official [brand guide](https://www.oreilly.com/about/logos/) confirms the
brand name styling, while this change does not add a brand exception. A CJS package
smoke test also preserved `O'Brien` and `O'Reilly` as complete tokens and produced
their expected readings in the built distribution. After rebuilding,
common strict/lenient were 5,504/6,990 and 6,408/6,990 (+1 each from the before-run);
top-5000 strict/lenient were 2,977/3,617 and 3,376/3,617 (+1 each). Full-dictionary
strict/lenient were 62,769 and 83,778 (105,067 words, +2 each); parity stayed 94,810/100,806
strict and 100,700 lenient. Public CMU default remained 4,749/5,000; rules-only was
4,196/5,000 (+1, with its existing sub-90% floor). Stress-aware correctness was
54,870 (+3), exact was 45,884 (+2), homographs stayed 1,455/1,615, and context IPA
stayed 88/85/53/49 across its four cells. All 420 Jest suites / 7,290 tests,
typecheck, Rollup, and `git diff --check` passed. This is below the 70-word
common-strict commit minimum; no baselines were refreshed and the change remains
accumulated.

The same freeze-bound learner was rerun on this rebuilt checkout's 6,993-word
common population, with 5,081 words in spelling-rule scope and ten family folds.
It selected 33 tentative rules; none passed the held-out filter, and applying all
of them dropped pooled held-out strict from 3,867/5,081 to 3,855/5,081. The
strongest `l` /ɪ/→/ə/ class still had losses in every fold. The refreshed route
and postlex diagnostics likewise show no validated broadening candidate, so no
additional speculative class rule was adopted.

A behavior-neutral compression pass consolidated the new `matur-` guard and
suffix composition. The full 1,296,352-prediction snapshot is byte-identical
before and after (SHA-256 `ef1afa3c4a4034943a0106b4e9cbc0177a0e4a7ee08dd48d882efcc22220f2af`).
The five-module count is now 3,429 (G2P 1,166; syllabify 1,720; postlex 497;
morph-table 20; morph-parser 26), still above the retained 3,395 compression
cap and the 1,150 G2P trigger. No broader neutral merge was clear in this pass;
keep compression active before adding more rule code.

### Cambridge US correction for weak `-age` references (2026-10-23)

Cambridge US lists `/ˈdæmɪdʒ/` for *damage*, `/ˈjuːsɪdʒ/` for *usage*,
`/ˈkɝɪdʒ/` for *courage*, and `/dɪˈskɝɪdʒ/` for *discourage*; its entry for
*undamaged* preserves STRUT in the prefix and gives `/ʌnˈdæmɪdʒd/`. These
readings contradicted several legacy CMU-derived source rows. Corrected those
reference entries and regular *-s/-ed* forms, retaining the existing general
rule path and adding no runtime word map. Cambridge sources:
[damage](https://dictionary.cambridge.org/us/pronunciation/english/damage),
[usage](https://dictionary.cambridge.org/dictionary/english/usage),
[courage](https://dictionary.cambridge.org/us/pronunciation/english/courage),
[discourage](https://dictionary.cambridge.org/us/pronunciation/english/discourage),
and [undamaged](https://dictionary.cambridge.org/us/pronunciation/english/undamaged).

The final 1,296,396-line snapshot was compared with the pre-batch freeze. It
has no key additions/removals and 97 unique changed outputs (nine dictionary,
five rules-only, and 83 derived-form probes), all in the affected families. The
rules-only route still misplaces stress in *undamaged* (`/ˈʌndəmɪdʒd/`); the
paired un-prefixed and other `un-` controls show different stress patterns, so
this is recorded as an open class gap rather than patched with a word map.
The reference-corrected default is `/ˌʌnˈdæmɪdʒd/`.

Common strict/lenient are 5,528/6,990 and 6,425/6,990; top-5000 strict/lenient
are 2,991/3,617 and 3,385/3,617. Relative to the 2026-10-22 committed baseline,
strict gains are 68 and 44 respectively; the ordinary commit minimum remains
70 on the primary common cohort, so this batch does not qualify yet. Full-dict
strict is 62,876/105,070; parity is 94,805/100,810 strict and 100,704 lenient.
Public CMU default is 4,749/5,000 (94.98%); rules-only is 4,213/5,000 and has
not regressed. Stress-aware is 54,867 headline / 45,897 exact; homographs are
1,455/1,615; the four context cells remain 88/85/53/49. All 423 Jest suites
(7,323 tests), typecheck, Rollup, and `git diff --check` pass. No baselines were
refreshed and no commit was made. Evidence: `/tmp/phonemize-after-age-reference-final.tsv`
and `/tmp/phonemize-after-age-reference-parity-final.tsv`.

### Common reference follow-up: *article* (2026-10-23)

The family-grouped structural learner was rerun on the fixed 6,994-word common
population (5,065 direct rule-path words, ten spelling-family folds). It accepted
27 tentative substitutions; none passed its train-only filter, and applying all
accepted candidates lowered held-out strict from 3,872/5,065 to 3,866/5,065.
The tempting unstressed `/ɪ/`→`/ə/` proposal after `l` had 35 training fixes
against 25 breaks and failed every fold, so no general rule was taken from it.

Cambridge US lists *article* as `/ˈɑːr.t̬ɪ.kəl/`, while the pinned CMU set also
contains that reading alongside `/ˈɑːr.tə.kəl/`. Updated the source reference to
the independently documented Cambridge reading; the public API remains within
the pinned CMU alternatives. The candidate *holiday* and *personal* changes were
withdrawn because their combined trial reduced common lenient and CMU default
counts. Source: [Cambridge US article](https://dictionary.cambridge.org/us/pronunciation/english/article).

The final 1,296,407-prediction snapshot differs from the age-reference freeze in
13 existing outputs and 12 added morphology/dictionary probes, all rooted in
`article`; one old derived probe was evicted. The rebuilt fixed common cohort
is 5,528/6,990 strict, 6,425/6,990 lenient; top-5000 is 2,991/3,617 strict,
3,385/3,617 lenient. These counts are unchanged from the immediately preceding
age-reference build, so this source correction is not counted as a rule gain.
CMU default is 4,749/5,000; rules-only remains 4,213/5,000. Full-dictionary
strict/lenient are 62,876/105,071 and 83,877/105,071; parity is 94,805/100,811
strict and 100,705 lenient. Stress-aware remains 54,867/45,897; context remains
88/85/53/49; homographs remain 1,455/1,615. The fixed common strict gain over
the committed 2026-10-22 baseline is still 68 words, below the ordinary 70-word
commit threshold and far below the requested 6,292/6,990 target. No baseline was
refreshed or commit made. The G2P line-count trigger remains active at 1,166
lines / 3,429 lines across the five rule modules; further compression is still
needed before adding rule code.

### Rejected `-es` reference batch and regex-table compression (2026-10-23)

Cambridge US also supports the existing rules-only readings for *here, service,
credit,* and *status*. A trial source batch was rejected after rebuilding: the
fixed common gate could not run because the rebuild evicted `credits`, and the
regular *services* route produced `/sɝvɪsəz/`, reducing CMU rules-only from
4,213 to 4,212. All four rows were removed and the dictionary was rebuilt; the
fixed cohort is again complete, and CMU rules-only returned to 4,213/5,000.
This exposes a silent-e stem versus *-s/-es* dispatch gap; do not paper it over
with isolated inflection rows. Cambridge checks:
[here](https://dictionary.cambridge.org/us/pronunciation/english/here),
[service](https://dictionary.cambridge.org/us/pronunciation/english/service),
[credit](https://dictionary.cambridge.org/us/pronunciation/english/credit),
and [status](https://dictionary.cambridge.org/us/pronunciation/english/status).

The follow-up structural learner screen used the fixed common population and
ten spelling-family folds with its distance objective. It selected four
tentative substitutions; none passed the train-only filter, and held-out strict
remained unchanged after filtered candidates. No learned rule was adopted.

A proposed compression merged three adjacent phoneme-table conditions with
identical output. The engine also checks specific `RegExp.source` strings in
stress/weak-vowel guards, so the merged `^a` row changed many unrelated words.
The candidate was fully reverted: its full prediction dump now matches the
pre-compression 1,296,407-row snapshot byte-for-byte (SHA-256
`7cafb9c575e8ba913a16be96f03e8853d7667743ddcf380be0b950cca4e0134ef`), and all
424 Jest suites / 7,324 tests pass. The existing compression trigger therefore
remains active; add no rule code until a genuinely neutral compression is
validated.

### Rejected unstressed `re-` vowel broadening (2026-10-23)

The fixed common-word mismatch report suggested changing the initial unstressed
`re` syllable from `/i/` to `/ɪ/`. A full-cohort runtime replay changed 98 words:
12 strict wins and 86 losses (top-5000: 6 wins, 47 losses). The losses include
productive `re-` forms such as *review, report, reply, return, release,* and
*replace*. Cambridge US confirms `/ɪ/` in *recover, rely, repair,* and
*replacement*, but that evidence does not support the spelling-wide rule; no
runtime change was adopted. The next candidate must distinguish the root class
or morphology and be replayed with its unchanged neighboring controls.

### Common mismatch route and inflection audit (2026-10-23)

The current fixed-cohort mismatch report contains 1,462 strict errors. Runtime
traces route 1,193 through direct rules, 230 through morphology, and 39 through
compound splitting. A separate audit of common words spelled with final `-ed`
found 31 strict mismatches, but no spelling-only voicing or syllabification
class: forms such as *naked* and *wicked* have lexicalized adjective readings,
while the same orthographic ending also represents ordinary past-tense verbs.
The broad re-prefix probe above and this inflection audit therefore yielded no
adoptable rule. No predictions, references, baselines, or runtime data changed.

The largest direct-rule cluster is the open-syllable `^i$` reading. A
stress-conditioned replay that changed `/aɪ/` to `/ɪ/` in non-primary,
non-secondary syllables changed 49 common-cohort predictions but produced no
strict wins and 27 losses (top-5000: 0 wins, 15 losses). The affected open-i
syllables include both lax cases and roots that retain PRICE (`idea`, `ideal`,
`directory`, `direct`, `oxide`), so stress position alone is not a safe class
condition. No runtime change was adopted.

### Rejected `ex-` stress/vowel default and refreshed family-fold screen (2026-10-23)

A broad replay changed 46 common words beginning with `ex` when their initial
syllable was unstressed: `/ɪks/` was changed to initial-stressed `/ɛks/`. It
produced 7 strict wins and 37 losses; among the top-5000 slice it produced 3
wins and 25 losses. *Expert* and *extreme* were repaired, but common controls
such as *experience, exchange, express, expect, explore,* and *explain* regressed.
The difference is lexical and morphological, so no general `ex-` rule was
adopted.

A fresh ten-fold, spelling-family grouped structural learner run on the fixed
common population accepted 27 tentative corrections. None passed the
train-only safety filter; held-out strict remained 76.45% before and after. It
therefore supplied no candidate for runtime adoption. The screening artifacts
are in `/tmp/phonemize-common-structural-20261023c`.

The 24-test apostrophe regression suite still passes, including issue #28's
O'Brien and O'Reilly Media sentence cases, O'Reilly possessives with straight
and curly apostrophes, and the illustrative O'Reily spelling. The current
fixed common strict score remains 5,528/6,990; no pronunciation rule or
baseline changed in this pass.

### CMU weak-vowel disagreement check: `-tribution` (2026-10-23)

The current rules-only output is `/ɪ/` in *distribution* and *contribution*,
while the pinned CMU entries encode the corresponding unstressed vowel as
`AH0` (`/ə/`). Cambridge US gives `/ɪ/` for both; Collins US independently
shows `/ɪ/` for *contribution*. These are acceptable pronunciation-source
variants, not evidence that the `/ɪ/` rule should be changed to win two strict
CMU comparisons. Adding a single-reading custom override would also put the
public CMU score's nondecrease gate at risk. No source, runtime, or evaluator
change was made. Sources: [Cambridge US distribution](https://dictionary.cambridge.org/us/pronunciation/english/distribution), [Cambridge US contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution), [Collins contribution](https://www.collinsdictionary.com/dictionary/english-pronunciations/contribution).

### Rejected y-plural stem substitution (2026-10-23)

The ten-fold family-grouped structural learner was also run with its distance
objective. It accepted 10 tentative candidates; none passed the train-only
safety filter. The filtered held-out strict score stayed 3,872/5,065, while
unfiltered candidates fell to 3,862/5,065. Artifacts:
`/tmp/phonemize-common-distance-structural-20261023`.

A separate replay tested using the rule-rendered singular instead of the
lexical stem when `-y` becomes `-ies` and the two stems differed by one weak
`/ɪ/`↔`/ə/` vowel. Across the full dictionary's 630 testable `-ies` forms,
the broad candidate changed 11 forms, 4 strict wins and 7 losses. Narrowing to
`-tory`/`-stry` changed only *territories* and *ministries* (2 wins, no losses),
but Cambridge US gives the *ministry* singular with `/ə/` and the rule-root
candidate would use `/ɪ/`; the narrow pattern therefore lacks a safe shared
class reading. No change was adopted. The frozen pre-candidate prediction dump
is `/tmp/phonemize-goal-freeze-20261023.tsv` (1,296,407 rows, SHA-256
`7cafb9c575e8ba913b59603e8853d7667743ddcabcf380be0b950cca4e0134ef`).

### `-lity` strict cluster checked against Cambridge US (2026-10-23)

The latest fixed-cohort replay still reports 5,528/6,990 strict and 2,991/3,617
top-5000 strict. The 24 common `-ity` failures include several final `-lity`
forms where CMU expects `/ɪti/` but the current rule emits `/əti/`. Cambridge US
independently gives the current weak `/ə/` for *facility*, *liability*, and
*stability*, so changing the shared `^lity$` rule to KIT would make a strict
CMU score look better while making those documented US forms less faithful.
No vowel rule or evaluator was changed. References: [facility](https://dictionary.cambridge.org/us/pronunciation/english/facility), [liability](https://dictionary.cambridge.org/us/pronunciation/english/liability), [stability](https://dictionary.cambridge.org/us/pronunciation/english/stability).

### Rejected `-ity` KIT-wide correction and `^a` intermediate-output probe (2026-10-23)

The pinned top-5,000 rules report contains 39 outputs ending in `/əti/`. A
uniform change to `/ɪti/` would repair *identity*, *diversity*, and *charity*,
but break *university, security, opportunity, authority, quantity, priority,
equity,* and *majority*: 3 strict wins versus 8 losses. This confirms that a
suffix-wide KIT change is unsafe even before the other tracked gates.

An attempted alignment of `/æ/` in raw syllable output to common-word gold was
also rejected as a diagnostic: it inspected the intermediate result before
`applyPostLexical`, which already changes relevant `-ange` forms such as
*change* and *range* to `/eɪ/`. Intermediate syllable arrays are not final
predictions, so that alignment cannot support a rule change. The live common
gate was rerun: 5,528/6,990 strict and 2,991/3,617 in the top-5,000 slice;
public CMU default is 4,749/5,000 and rules-only is 4,213/5,000. A fresh
1,296,407-row snapshot matches the pre-candidate freeze byte-for-byte
(SHA-256 `7cafb9c575e8ba913b59603e8853d7667743ddcabcf380be0b950cca4e0134ef`).
The learner's `l`, second-slot, unstressed `/ɪ/`→`/ə/` candidate also remains
rejected: despite pooled +35/−25 strict fixes/breaks (top-5000 +18/−10),
all six folds that selected it failed the safety filter; examples broken include *college*,
*affiliate*, *metallica*, and *Halifax*. No source, reference, prediction, or
baseline changed.

### Current route and postlex replay (2026-10-23)

Replayed the current common diagnostic population (6,995 entries; the fixed
release cohort remains 6,990). Actual route dispatch scores 5,529 strict and
6,428 lenient. Disabling morphology drops strict to 4,772; forcing unsplit
dispatch drops it to 4,658. Morphology therefore contributes 757 strict
matches net, and its losses need class-level repair rather than route removal.
The all-dictionary route report could not be written: the sandbox returned
`-122` while writing its oversized artifact, so no full-dictionary route
conclusion is claimed.

The common postlex replay examined all 91 fired rules. Removing no single rule
improved common strict. No postlex edit was made. Report fingerprints: `g2p.ts`
`379173511c29e58d79478fd216e0a91b7af80dd9de6faf3e7aafcd8471840dc7`,
`postlex.ts` `25f2b2e3480abde8b4f7784855b886e3ac656784718cf5f421722bd2a7b5e611`;
reports are under `/tmp/phonemize-routes-common-current-20261023/` and
`/tmp/phonemize-postlex-common-current-20261023/`.

### Verified rule-path freeze and `personal` source conflict (2026-10-23)

A fresh streaming replay of all 1,296,407 rows in
`/tmp/phonemize-goal-freeze-20261023.tsv` matched the current working tree
exactly (zero mismatches). The current comment-aware five-module code count is
3,438 (g2p 1,177; syllabify 1,718; postlex 497; morph-table 20; morph-parser
26), so the retained 3,395 ceiling and 1,150-line g2p trigger remain active.

The common morphology replay exposed `personal` as a source disagreement:
Cambridge US gives `/pɝsənəl/`, and `personally` `/pɝsənəli/`, while the pinned
CMU reference for `personal` accepts only `/pɝsɪnəl/`. The current public
default therefore matches CMU, and correcting the runtime entry would lower
that fixed metric. No dictionary or runtime change was made. A future
morphology fix must repair the derived `personally` route without changing the
public default for `personal`, and must pass the paired `individual/individually`
controls. Sources: [Cambridge US personal](https://dictionary.cambridge.org/us/dictionary/english/personal),
[Cambridge US personally](https://dictionary.cambridge.org/us/dictionary/english/personally).

The remaining fixed-cohort `-ally` mismatches are not one suffix class. The
rules route reports different failures for *actually, eventually, additionally,*
and *individually* (stress or root composition), while *personally* is the
`personal` stem disagreement above. *Typically, physically, periodically,* and
*dramatically* lose schwa through the existing `-ically` post-phonotactic
elision. That broad insertion was already replayed against the pinned CMU and
full-dictionary gates: it had zero net common strict gain and regressed the
full dictionary; the root-conditioned variant also regressed full strict by
four. Neither should be retried as a spelling-wide fix. No runtime code or
references changed in this audit.

### Cambridge US source correction for `during` (2026-10-23)

The IPA-Dict source row for *during* is `/ˈdɝɪŋ/`, while the rules path gives
`/ˈdjʊɹɪŋ/`. Cambridge US records `/ˈdʊr.ɪŋ/`; Oxford's American entry lists
`/ˈdʊrɪŋ/` and `/ˈdjʊərɪŋ/`. The spelling does not define a general `du+r`
class: *enduring*, *duress*, *durable*, and *duration* take different roots or
suffix routes. A single source-data correction was added to `custom.dict`,
without a G2P/POS code map. The default API now serves the Cambridge US form;
the rules path retains the Oxford-accepted yod variant. [Cambridge US during](https://dictionary.cambridge.org/us/pronunciation/english/during),
[Oxford American during](https://www.oxfordlearnersdictionaries.com/us/definition/american_english/during).

The pre-change regression failed on `dict.during` (`/ˈdɝɪŋ/` vs expected
`/ˈdʊɹɪŋ/`); after rebuild all four final focused tests pass, including a complete
sentence and `duress`/`durable`/`duration` controls. This is a verified source
correction, not a rule gain: common strict remains 5,528/6,990 and top-5000
strict 2,991/3,617; their lenient counts rise by one each. Full-dictionary
strict is unchanged, lenient rises by one, parity strict correct count is
unchanged, and CMU default/rules remain 4,749/5,000 and 4,213/5,000. Context
remains 88/108, homographs 1,455/1,615, and stress-aware accuracy 54,867/90,314.
The 1,296,407-row frozen replay changed exactly 11 outputs: `dict\tduring` plus
ten mechanically generated suffix probes rooted at `during`; no rules-only or
POS rows changed. Before SHA-256 is
`7cafb9c575e8ba913a16be96f03e8853d7667743ddcf380be0b950cca4e0134ef`; after SHA-256 is
`cef2db70736661cd087b62399d995bc79a1742dd1cc21b223ecbd043858714c6`.
The full 425-suite / 7,329-test run and typecheck passed; the final focused
regression passes 4/4. No baseline was refreshed or commit made; the requested
common strict target remains open.

### Strict common-word candidate replay (2026-10-23)

A fresh 10-fold, spelling-family split of the 6,995-word common diagnostic
population proposed eight conditional spelling candidates. None passed its
held-out safety filter. The pooled best candidate (unstressed `/ɪ/` to schwa
in a particular second-slot environment) would fix 25 strict cases and break
15 in training, while every held-out fold that selected it failed; held-out
strict remained 76.45%. It is rejected, and no pronunciation rule was changed.
The required strict release cohort remains 5,528/6,990 (79.08%) and its
3,617-word top-5,000 slice remains 2,991 (82.69%).

### High-error `-tribution` family review (2026-10-23)

The fixed common cohort's broad `-on` error cluster prompted a paired review of
*contribution, attribution, retribution,* and their related forms. No suffix
rule was adopted: the vowel before `/bju/` is not uniform across the family,
and the pinned IPA-Dict/CMU-derived reference conflicts with Cambridge US on
*contribution* (`/ɪ/` in Cambridge, `/ə/` in the pinned row) and *attribution*
(`/ə/` in Cambridge, `/ɪ/` in the pinned row). Cambridge US supports `/ə/` in
*retribution*, where the current rule path has `/ɪ/`, but changing this one
root would be a lexical exception rather than a demonstrated general class.
Changing the pinned rows would also require rechecking the nondecreasing public
CMU gate; these source differences are not counted as rule gains. Sources:
[Cambridge US contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
[Cambridge US attribution](https://dictionary.cambridge.org/us/pronunciation/english/attribution),
[Cambridge US retribution](https://dictionary.cambridge.org/pronunciation/american-english/retribution).

### Stressed standalone `-son/-ton` rime correction (2026-10-23)

The common mismatch audit found stressed standalone *son* and *ton* taking the
generic short-o `/ɑ/`, while the pinned rows and Cambridge US use STRUT. A
syllable/stress-conditioned rule now renders only a primary-stressed,
standalone `son` or `ton` rime as `/ʌ/`; weak suffixes and bound forms remain on
their existing routes. Cambridge US confirms `/sʌn/` and `/tʌn/`, and `/ɑː/`
in *proton*. Paired controls *proton, exton, tonic, tonight, person, lesson,
John, con,* and *don* remain byte-identical. The full frozen prediction replay
changed exactly three rules rows: `son`, `ton`, and `son's`; hash
`bb7afdf7688b0a3e87b0ccaeb13eb14055a1580db9a878574c908deda3d61e40` versus
`cef2db70736661cd087b62399d995bc79a1742dd1cc21b223ecbd043858714c6` before.
The 6,990-word common strict count rises by two to 5,530; top-5,000 rises by
one to 2,992. Full rules strict is 62,879/105,071. Public CMU default is
4,749/5,000 and rules is 4,214/5,000; context remains 88/108 and homographs
1,455/1,615. Stress-aware headline is 54,869/90,314. Full Jest passes 426
suites/7,339 tests, typecheck passes, and Rollup CJS/ESM issue #28 and rules-only
son/ton smoke tests pass. The cumulative 5,530 score clears the current
5,529 ordinary-commit threshold from the 2026-10-22 committed 5,459 baseline,
but no commit or baseline refresh was made because the compression trigger is
still active. The behavior-neutral compression immediately before this rule saved one code
line and preserved all 1,296,407 outputs; after adding the separate rule line,
the five-module count is 3,438 (g2p 1,177, syllabify 1,718, postlex 497,
morph-table 20, morph-parser 26), so
the compression trigger remains active. Sources:
[Cambridge US son](https://dictionary.cambridge.org/pronunciation/english/son),
[Cambridge US ton](https://dictionary.cambridge.org/us/pronunciation/english/ton),
[Cambridge US proton](https://dictionary.cambridge.org/us/pronunciation/english/proton).

The post-build 1,296,407-row replay is byte-identical to the pre-build
candidate (zero changed rows; the same SHA-256 above), confirming that exception
eviction and re-pin introduced no additional output changes.

### Follow-up behavior-neutral compression (2026-10-23)

Merged repeated `-al` vetoes, standalone-pronoun skips, root-stress returns, and
same-output phoneme overrides without changing their branch order or regex
identity. The five-module count drops from 3,438 to 3,431 (g2p 1,175,
syllabify 1,713, postlex 497, morph-table 20, morph-parser 26). The full
1,296,407-row snapshot is byte-identical before and after (`bb7afdf7688b0a3e87b0ccaeb13eb14055a1580db9a878574c908deda3d61e40`). Typecheck and
all 426 Jest suites / 7,340 tests pass. No pronunciation or data files changed.
The retained 3,395 cap and 1,150-line G2P trigger remain active; this compression
is separately reviewable, but further reduction is needed before committing.

### Cambridge US correction for lexical `-ed` adjectives (2026-10-23)

The common-cohort morphology route misrenders *naked*, *wicked*, and *crooked*
as regular past-tense forms without the final unstressed vowel. Cambridge US
records /ˈneɪ.kɪd/, /ˈwɪk.ɪd/, and /ˈkrʊk.ɪd/. The spelling ending is not a
productive class: nearby *marked*, *baked*, and *asked* correctly end in /t/.
These three lexical readings were added to `src-data/en/custom.dict` and marked
as corrected references so dictionary trimming preserves all fixed-cohort rows.
Custom POS homographs keep *wicked* and *crooked* verb forms on /kt/ while their
adjective readings use /ɪd/. Focused tests verify default and POS-selected
readings and preserve regular /t/ controls. Sources: [Cambridge US naked](https://dictionary.cambridge.org/us/pronunciation/english/naked),
[Cambridge US wicked](https://dictionary.cambridge.org/us/pronunciation/english/wicked),
[Cambridge US crooked](https://dictionary.cambridge.org/us/pronunciation/english/crooked).

This is a lexical/reference correction, not a general G2P rule gain. After
rebuild, rules strict remains 5,532/6,990 and 2,992/3,617; public CMU default is
4,748/5,000 and rules-only 4,214/5,000. CMU default still clears its absolute
4,739 floor, but is one below the previously recorded 4,749; this delta remains
under investigation and is not claimed as nondecreasing. Runtime parity is
94,805/100,811 strict and stress-aware accuracy is 54,877/90,314 (+92 vs
baseline); context remains 88/108 and homographs 1,455/1,615. The common fixed
cohort runs at its prior counts with the same denominators. All 427 Jest suites
(7,355 tests), typecheck, focused POS tests, context IPA, and homograph gates
pass. No baseline was refreshed or commit made. The requested strict targets
remain open.

### Common `-ated` reference and root check (2026-10-23)

The fixed-cohort rules-only mismatch *located* is predicted /loʊkeɪtɪd/;
the pinned dictionary reference is /loʊkeɪd/. Cambridge US defines *located*
as the past form of *locate* and gives /loʊˈkeɪt/, which supports retaining
the /t/ and regular /ɪd/ suffix. However, the independent pinned CMU cohort
currently accepts /loʊkeɪd/ as one variant, and the shipped default matches
that variant. Replacing the shared reference/runtime entry with /loʊkeɪtɪd/
would risk the required nondecreasing CMU gate, so no correction was adopted.
This remains a source conflict, not evidence for changing the general -ed rule.

The same fixed-cohort scan found *consolidated*: current rules produce
/kənˈsɑɫɪˌdeɪtɪd/, while Cambridge US gives /kənˈsɑː.lə.deɪ.t̬ɪd/. Its base
*consolidate* and derived *consolidation* also use /ə/ in Cambridge, indicating
a root-family vowel issue. The spelling evidence is confined to this lexical
family so far; no new general rule was proposed. Cambridge sources:
[located / locate](https://dictionary.cambridge.org/us/dictionary/english/located),
[consolidated](https://dictionary.cambridge.org/us/pronunciation/english/consolidated),
[consolidate](https://dictionary.cambridge.org/us/pronunciation/english/consolidate),
[consolidation](https://dictionary.cambridge.org/us/pronunciation/english/consolidation).

### Cambridge US reference corrections for common `-ist` forms (2026-10-23)

The fixed-cohort `-ist/-ists` audit found ten IPA-Dict references whose weak
final vowel disagreed with the already-correct general rules output. Cambridge
US confirms /ɪst/ for *artist, tourist, specialist, florist, Baptist,
journalist, dentist, communist,* and *therapist*; its *terrorist* entry
confirms /ɪst/, which also supports the regular plural *terrorists*. The
*florist* source also confirms /ɔr/, resolving the separate LOT/AW mismatch.
Plural references for *florists, dentists, communists, journalists,* and
specialists and the possessives affected by the source rebuild were aligned
to those cited singular readings plus regular inflection. *Chemists* was
corrected from the Cambridge US *chemist* reading and regular plural /s/.
Already-correct *artists, chemist,* and *scientist* remain paired controls.
Sources: [artist](https://dictionary.cambridge.org/us/pronunciation/english/artist),
[tourist](https://dictionary.cambridge.org/pronunciation/english/tourist),
[specialist](https://dictionary.cambridge.org/us/pronunciation/english/specialist),
[florist](https://dictionary.cambridge.org/us/pronunciation/english/florist),
[Baptist](https://dictionary.cambridge.org/us/pronunciation/english/baptist),
[journalist](https://dictionary.cambridge.org/us/pronunciation/english/journalist),
[dentist](https://dictionary.cambridge.org/us/pronunciation/english/dentist),
[communist](https://dictionary.cambridge.org/us/pronunciation/english/communist),
[therapist](https://dictionary.cambridge.org/pronunciation/english/therapist),
[terrorist](https://dictionary.cambridge.org/pronunciation/english/terrorist),
and [chemist](https://dictionary.cambridge.org/us/pronunciation/english/chemist).

These are source corrections, not ten G2P-rule gains. The one common runtime
gain was *florists*: rebuilding the verified *florist* stem changed its
rules-only plural from /ˈfɫɑɹɪsts/ to /ˈfɫɔɹɪsts/, matching the corrected root
and Cambridge US. The fixed common count therefore moved from 5,533 to
5,544/6,990, with ten reference corrections and one derived-word improvement;
top-5,000 moved from 2,992 to 2,995/3,617 through three reference corrections.
Lenient counts were unchanged. The generated cohort initially trimmed
*artists*, which made the evaluator reject its fixed 6,990 denominator; an
explicit corrected-reference row now retains that already-correct plural.

The final before/after snapshot review found changes only in these `-ist`
lexemes, their plural/possessive forms, compounds, and derived probes; the
full rebuild retained 532 dependency pins. Default public CMU remains
4,748/5,000; rules-only CMU is 4,215/5,000 (the known legacy 90% floor still
fails and is nondecreasing). Runtime parity is 94,809/100,815 strict and
100,709 lenient. Stress-aware phonemic correctness is 54,883/90,318. Context
IPA remains 88/85/53/49 across its four cells, and homographs remain
1,455/1,615. The full rules report is 62,898/105,075; its denominator and
references changed in this source correction, so it is not claimed as a
frozen-reference rule gain.

The complete Jest suite passes (429 suites, 7,413 tests), as do typecheck,
Rollup, fixed-cohort evaluation, context and homograph gates, and CJS/ESM
package smoke checks for issue #28's O'Brien and O'Reilly Media sentence.
No baseline was refreshed or commit made: the strict common targets remain
748 words short and 261 words short on the top-5,000 slice; the 70-word
ordinary commit minimum applies to pronunciation gains, not reference edits,
and the rule-compression triggers remain active.

### Fixed-cohort structural learner rerun (2026-10-23)

Reran `learn-rule-corrections.ts --structural --objective strict --k-folds 10`
against the unchanged common-cohort contract. The actual-dispatch replay covered
5,063/6,995 common-testable words (72.38%) and accepted 31 train-selected rules;
none passed the existing adoption filter. Applying all accepted rules lowered
held-out strict from 3,874/5,063 to 3,863/5,063, lowered lenient from
4,575/5,063 to 4,567/5,063, and worsened aggregate distance from 1,987 to
2,011. No candidate was adopted. The fixed 6,990-word rules score remains
5,533/6,990 and top-5,000 remains 2,992/3,617. This replay is diagnostic only;
the learner's partial route coverage and negative held-out result provide no
evidence for changing runtime rules or the cohort contract. Full report:
`/dev/shm/learner-common-20261023/cv-common-report.json` (ephemeral).

### Rejected broad `-ist` inflection guard (2026-10-23)

A proposed `silentE()` exception attempted to stop tourist + `-ed/-ing` from
being reconstructed as *touriste*. The full snapshot replay changed 164
predictions and exposed clear regressions, including *unlisted* changing from
/ənˈɫɪstɪd/ to /ˈʌnɫɪstɪd/ because the spelling suffix `-ist` also occurs
across `un-` + *list*. The candidate code and its focused test were removed;
no runtime inflection rule was adopted. Shell verification is restored: the
`-ist` reference tests and paired nominal-root tests pass (52 tests), and the
current fixed-cohort evaluation is 5,544/6,990 strict, 6,428 lenient and
2,995/3,617 top-slice strict, 3,386 lenient. This does not meet the release
targets, and no baseline or commit was changed.

### Weak `-igate` batch and issue #28 continuation (2026-10-23)

Added a general unstressed open-`i` reduction before final `-gate` for the verb
family, with `frigate`, `digate`, and `profligate` retained as spelling/stress
controls. Cambridge US supports the reduced vowel in [castigate](https://dictionary.cambridge.org/us/dictionary/english/castigate),
[fumigate](https://dictionary.cambridge.org/us/pronunciation/english/fumigate),
[instigate](https://dictionary.cambridge.org/pronunciation/english/instigate),
[irrigate](https://dictionary.cambridge.org/us/pronunciation/english/irrigate),
[litigate](https://dictionary.cambridge.org/pronunciation/english/litigate),
[mitigate](https://dictionary.cambridge.org/us/pronunciation/english/mitigate),
[navigate](https://dictionary.cambridge.org/us/pronunciation/english/navigate),
and [obligate](https://dictionary.cambridge.org/us/dictionary/english/obligate).
These sources establish the verb-family reading; reference changes for
litigate and its regular inflections are not counted as rule gains.

After rebuilding, exception fragments falsely recomposed three common words.
Cambridge US confirms [commerce](https://dictionary.cambridge.org/us/pronunciation/english/commerce),
[exposure](https://dictionary.cambridge.org/us/pronunciation/english/exposure),
and [passenger](https://dictionary.cambridge.org/us/pronunciation/english/passenger).
The broader verified-head/tail decomposition guard changed 1,961 predictions,
including extensive derived-form losses, so it was rejected. These three
source-backed words were restored in `src-data/en/custom.dict`; the general
exception-fragment recomposition class remains open for a safer structural fix.

The final fixed common cohort is 5,545/6,990 strict and 6,428 lenient; the
top-5,000 slice is 2,996/3,617 strict and 3,386 lenient. The 70-word minimum
for a qualifying common strict improvement is exceeded by 86 versus the
2026-10-22 baseline; qualifying baselines were refreshed after gate review.
Runtime parity is
94,807/100,816 strict and 100,710 lenient; common public API accuracy is
4,748/5,000, while rules-only remains 4,216/5,000 (the known existing miss of
the legacy 90% rules-only floor). Context IPA remains 88/85/53/49 in its four
cells, and homographs remain 1,455/1,615. Stress-aware phonemic accuracy is
54,881/90,319, +96 against the committed baseline; the denominator changed and
the count is two below the pre-build frozen run, so it is not described as a
non-regression against that run. The full rules report is 62,903/105,077.
Re-scoring the frozen pre-change rule predictions and current predictions
against the same rebuilt dictionary's stress-aware references produced
54,896 correct in both snapshots with no changed pass/fail cases; the raw
cross-build difference therefore follows reference/population changes, not
an identified pronunciation regression in the candidate.

Validation: all 430 Jest suites and 7,429 tests pass; typecheck and production
Rollup build pass; CJS and ESM package smoke tests both return the expected
O'Reilly Media and Media tokens. The before/after full prediction snapshots
for the final rebuilt candidate differ on 90 shared rows (3 dictionary, 10
rule, 77 morphology rows; the current rebuild adds 11 rows). Replaying the
changed rule and dictionary words against the rebuilt references shows ten
strict wins and no losses on the rule route, plus three corrected dictionary
outputs and no losses. Runtime parity also re-scores 94,806/100,816 for both
the frozen pre-change and current predictions against the same rebuilt
dictionary. Only `navigate` is in the fixed common/top-5,000
cohorts among those changed rule rows; its score rises by one in each. The 77
morphology changes include synthetic suffix probes; the six regular
`-s/-ed/-ing` forms tested for `castigate` and `navigate` retain the expected
root and inflection. Compression triggers remain active. The stress-aware
contract re-score has no changed pass/fail cases against the same rebuilt
references. The >=90% common strict goal remains 747 words away; the current
batch is a qualified +86 common-strict checkpoint, not the release target.

Compression review counted 3,411 code lines across the five rule modules and
1,165 in `g2p.ts`, above the retained 3,395 / 1,150 limits. The apparent
adjacent same-output syllabifier rows are referenced by `RegExp.source` in
special-case dispatch and trace labels; merging them changed `castigate` and
`navigate` from `/ə/` back to `/eɪ/`. That compression candidate was reverted.
No compression refactor is adopted; the trigger remains active for a pass
that preserves rule identity as well as predictions.

The unstructured fixed-common learner was also rerun with ten spelling-family
folds. It selected 13 candidates, but none passed the existing training-only
filter in any fold; held-out strict remained 76.54% before and after filtered
rules. The leading candidate (`d`, prior stressed `e`, unstressed `ɪ→ə`)
had +25/-13 training changes and +15/-8 top-5,000 changes across folds, so it
was not adopted. Report: `.rule-learning-common-20261023/cv-common-report.json`.

### Function-word <of> and weak -ity audit (2026-10-23)

The CMU rules-only API cohort exposed a clear `of` error: its isolated rule
prediction was `/ɔf/`, while Cambridge US lists weak `/əv/` and strong `/ɑv/`.
The existing `^of$` phoneme route now uses the function-word environment to
voice the final fricative and use the project STRUT symbol; `off`, `office`,
`offer`, `proof`, `roof`, and `aloof` remain unchanged. Cambridge source:
[of pronunciation](https://dictionary.cambridge.org/pronunciation/english/of).
The frozen full snapshot changed only the rules row for `of`; a post-build
snapshot was byte-identical. Rules-only CMU API accuracy rose from 4,216 to
4,217/5,000; the default API remains 4,748/5,000. `of` is excluded from both
fixed common cohorts, so the 5,545/6,990 and 2,996/3,617 release scores did not
change. No baseline was refreshed for this gain.

The apparent common `-ity` cluster was rejected as a CMU-targeting opportunity:
Cambridge US supports the current schwa in *facility, celebrity, identity,* and
*stability*. Their `/ɪ/` CMU references therefore cannot justify changing the
rule output. Sources: [facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[celebrity](https://dictionary.cambridge.org/us/pronunciation/english/celebrity),
[identity](https://dictionary.cambridge.org/pronunciation/english/identity),
[stability](https://dictionary.cambridge.org/us/dictionary/english/stability).

A `-ate` suffix screen over the 21-word overlap of the fixed common cohort and
the public CMU API reference was rejected before runtime editing: turning a
non-primary final `/eɪt/` into `/ət/` produced one strict win (`immediate`) and
ten losses, including verb controls such as *participate, indicate, operate,*
and *navigate*. Cambridge explicitly distinguishes the
noun `/sɚˈtɪf.ə.kət/` from verb `/sɚˈtɪf.ɪ.keɪt/` in [certificate](https://dictionary.cambridge.org/us/pronunciation/english/certificate),
so final stress alone cannot classify this suffix safely. The candidate was
not implemented; any further `-ate` work needs sentence POS routing and paired
noun/adjective/verb controls.

Post-change validation: 431 Jest suites / 7,443 tests, typecheck, dictionary
rebuild, and Rollup build passed. Full-dict rules remained 62,903/105,077;
runtime parity remained 94,807/100,816; stress-aware remained 54,881/90,319;
context IPA remained 88/85/53/49; homographs remained 1,455/1,615. The rules-
only common API remains below its legacy 90% floor at 4,217/5,000, while the
default API passes at 4,748/5,000. The release common targets remain unmet.

### Rule-path `-vary` stem recovery in `-variation` (2026-10-23)

The common failure report showed `variation` taking the unrelated `vari`
headword as its suffix stem. The `-ation` handler now restores a `-vary` stem
for this spelling frame before looking up an `i`-final stem. This is limited to
`-ari` bases whose corresponding `-ary` form resolves through the ordinary
stem rules; `mediation`, `foliation`, `remediation`, and `aviation` remain
byte-identical. Cambridge US gives `/ˌvɛɹiˈeɪʃən/` for [variation](https://dictionary.cambridge.org/pronunciation/english/variation),
matching the corrected rules path. Paired controls `vary`, `varied`, `varies`,
`varying`, `variety`, `aviation`, `radiation`, `initiation`, and `variate` pass.

The frozen 1,296,475-row runtime snapshot changed exactly one row:
`rule\tvariation`, from `/ˌvɑɹiˈeɪʃən/` to `/ˌvɛɹiˈeɪʃən/`; hashes are
`cae3a97c5c4faa36a3e4a56d30a091887ea8eb62e7fe37916d689625e87b3240` before
and `6af19662b1a7c714d44fe9a31a22da7d45d7f5a09980ba513897f60d64de4c80` after.
Fixed common strict rises to 5,546/6,990; top-5,000 remains 2,996/3,617. A
fresh `build-dict` could not run because the sandbox could not resolve
`raw.githubusercontent.com`; do not refresh baselines or count this as a
release-qualified commit until the rebuild and remaining gates run. The other
current checks are full-dict 62,904/105,077, stress-aware 54,882/90,319,
runtime parity 94,807/100,816, public API default 4,748/5,000 and rules-only
4,217/5,000, context IPA 88/85/53/49, and homographs 1,455/1,615. All are
nondecreasing versus the frozen before-run; context and homograph gates meet
their release thresholds.

### Function-word final /s/ after /æ/ (2026-10-23)

The rules-only common API report identified `as` as a high-frequency coda
voicing error: the strong citation was `/ˈæs/`, but Cambridge records US strong
`/æz/` and weak `/əz/` ([Cambridge](https://dictionary.cambridge.org/pronunciation/english/as)).
The syllabifier now voices final `<s>` after `/æ/` only for a function word;
lexical controls `gas` and `mass`, as well as `us` and `this`, remain voiceless.
Sentence-level weak `as` remains `/əz/`. The before/after 1,296,475-row
snapshot changed only `rule\tas`, from `/ˈæs/` to `/ˈæz/`; hashes are
`6af19662b1a7c714d44fe9a31a22da7d45d7f5a09980ba513897f60d64de4c80` and
`a23ea3ef0fde46e74503b5c53d787f191ec3f6852017da5b4e220ef1b2ce760f`.
Rules-only public API rises by one to 4,218/5,000. The fixed common cohorts
exclude `as` and remain at 5,546/6,990 and 2,996/3,617. Full-dict strict is
62,904/105,077, stress-aware is 54,882/90,319, parity is 94,807/100,816,
context IPA is 88/85/53/49, homographs are 1,455/1,615, and default public API
is 4,748/5,000. Typecheck and all 433 Jest suites / 7,457 tests pass.

The required dictionary rebuild remains unverified: `yarn build-dict` cannot
open the `tsx` IPC pipe (`EPERM`), and the direct `node --require tsx/cjs
scripts/build-dict.ts` route reaches the source fetch but DNS returns
`EAI_AGAIN` for `raw.githubusercontent.com`. No baselines were updated and this
batch is not release-qualified until rebuilding and rerunning its gates.

### Rejected common-word candidates (2026-10-23)

A class-level attempt to prefer whole-word syllabification when an `-ies`
form had no independently attested `-y` stem fixed `series` (`/ˈsɛɹiz/` →
`/ˈsɪɹiz/`, matching Cambridge US), but broke productive/OOV plurals. Against
the frozen rule path it reduced fixed-common strict from 5,546 to 5,525,
top-5,000 strict from 2,996 to 2,989, and full-dict strict from 62,904 to
62,782. The loss list included `congeries`, `galeries`, and `miniseries`; the
candidate was reverted. A narrower simulation over `-eries` also showed those
three losses against the single `series` win, so no word-specific fallback was
added.

The ten-fold structural learner selected 31 conditional candidates, but none
passed its train-only legacy filter. The top candidate (`ɪ` → `ə` before the
second-syllable `l`) had +41/−31 training corrections and +21/−13 top-5,000
changes, with no held-out strict gain. The next `d`/unstressed-`ɪ` candidate
had +25/−13 training changes and +15/−8 top-5,000 changes. Cambridge confirms
the current `/ɪ/` in `credit`, and `media` independently requires `/ɪ/` after
`d`; these candidates are not adopted. The regenerated fixed-common report
after reverting remains 5,546/6,990 strict and 2,996/3,617 top-5,000; the
rules-only API remains 4,218/5,000. No baselines changed.

### Strong function-word `do` (2026-10-23)

The rules-only API ranked `do` as a common error: the verb/auxiliary should have
strong `/du/`, while the musical-note homograph has `/doʊ/` and weak auxiliary
forms reduce in context. Cambridge US records `/du/` and `/də/`
([Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/do)).
The syllabifier now applies `/u/` only to the standalone function-word route;
`dodo`, `do-si-do`, `Colorado`, and the existing `doing`, `done`, `goes`, and
`to` controls are covered. A broader rule that changed every final `do` was
rejected after it damaged hundreds of names and compounds.

The frozen 1,296,475-row snapshot changes only `rule do`, `rule do's`,
`rule make-do`, and `rule to-do`; hashes are
`a23ea3ef0fde46e74503b5c53d787f191ec3f6852017da5b4e220ef1b2ce760f` before and
`5586fe8251b4fb1858b8ba18b575ba83be677842a4b803baa89b7a7f1e1e590e` after.
The fixed common cohorts do not contain `do`, so remain 5,546/6,990 strict and
2,996/3,617 top-5,000. Rules-only public API rises to 4,219/5,000; default API
remains 4,748/5,000. Full-dict strict/lenient are 62,905/105,077 and
83,888/105,077; stress-aware is 54,882/90,319; parity is 94,807/100,816;
context IPA is 88/85/53/49; homographs are 1,455/1,615. All 433 Jest suites
(7,457 tests) and typecheck pass. The runtime dictionary rebuild remains
blocked by DNS `EAI_AGAIN` resolving `raw.githubusercontent.com`; baselines
remain untouched and this batch is not release-qualified until rebuild and
acceptance gates can run.

### Align diagnostics with the frozen release cohort (2026-10-23)

The route, postlex, and rule-learning diagnostics dynamically rebuilt their
"common" population from the frequency list and current dictionary. That added
seven later-eligible forms (americans, articles, journalists, productions,
promotions, refers, and specialists) beyond the frozen 6,990-word contract;
the learner also treated the first 5,000 raw frequency entries as its top
slice instead of the fixed 3,617-word cohort. Updated all three diagnostics
to use common-cohort.json by default, retaining explicit expanded options for
exploratory runs. The cohort regression test passes.

After alignment, route diagnosis verifies exactly 6,990 predictions at
5,546/6,990 strict and 6,428/6,990 lenient, matching test:eval --subset
common. Removing morphology alone drops strict accuracy to 4,786; disabling
morphology, compound, and decomposition routes together drops it to 4,672,
so those broad fallbacks are not safe fixes. Postlex diagnosis replays the same 6,990 words;
no rule removal yields a strict gain (the only positive lenient delta is one
case paired with a strict loss). The corrected frozen-cohort ten-fold run
scored 5,062 in-scope rule-path items and accepted 28 experimental
corrections, but none passed the existing train-only adoption filter. Its
top candidate was unstressed /ɪ/→/ə/ in a penultimate-lateral context:
train +30/−22, fixed top-5,000 +15/−9. Held-out strict stayed at 76.55%,
and losses included college, affiliate, metallica, and Halifax while some
wins were names. The candidate is not adopted. The distance-oriented
ten-fold run accepted eight candidates across all folds, but none passed
the train filter; its best were schwa→ɪ before final -it (+8/−6 train,
fixed top-5,000 +2/−3) and medial ɪ→ə near r (+12/−5 train, top-5,000
0/−5). Held-out strict remained 76.55%. These do not provide a safe class fix.

### Rejected unstressed final -it reduction (2026-10-23)

An offline class simulation changed final unstressed /ɪt/ to /ət/ for words
spelled -it. It raised fixed-common strict by only four items (5,546→5,550),
left the fixed top-5,000 slice unchanged at 2,996/3,617, and lowered full
common lenient by one (6,428→6,427). The proposed spelling class mixes
reference readings: the candidate's wins include credit, edit, unit, rabbit,
and orbit, while controls such as visit, benefit, permit, transit, audit, and
exhibit must retain /ɪ/. Cambridge US independently records /ɪ/ in visit
([Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/visit)).
This loses a tracked metric and makes no top-slice progress, so it was not
implemented.

### Rejected `-nage` vowel reduction (2026-10-23)

An offline common-cohort simulation changed final unstressed /ɪdʒ/ to /ədʒ/
for spellings ending -nage. It appeared to add two strict matches to the
6,990-word cohort and one to the fixed top-5,000 slice, with no losses in
either frozen population. The apparent wins do not establish a spelling
class: Cambridge US gives `manage` /ˈmæn.ədʒ/ but gives `drainage` and
`carnage` /ɪdʒ/. The rule would therefore damage the independently attested
`drainage` reading despite its CMUdict-only simulated gain. No runtime rule
was adopted; this spelling class needs a morphological or lexical distinction
before it can be used safely.

### Rejected final `-sis` schwa reduction (2026-10-23)

An offline substitution of final /ɪs/ with /əs/ for words spelled -sis improved
fixed-common strict by three (5,546→5,549) and top-5,000 strict by one
(2,996→2,997), without losses in either frozen slice. Full-dictionary strict
fell by four (65,153→65,149): wins such as `emphasis`, `genesis`, and
`hypothesis` were outweighed by losses including `cassis`, `lysis`, `nemesis`,
`pathogenesis`, and `sepsis`. Narrowing to -esis still lowered full-dictionary
strict by two, losing `nemesis` and `pathogenesis`. The class was not adopted.

### Rejected low-support medial `tr` reduction (2026-10-23)

A min-support-3 spelling-family search proposed changing an unstressed /ɪ/ to
/ə/ in the third-from-last syllable when adjacent to `tr`. Its small train-only
examples were `contribution`, `attribute`, and `tremendous`; no candidate
passed the existing train filter or produced a held-out improvement. Cambridge
US independently confirms /ɪ/ in `contribution`, in the noun `attribute`, and
in `tremendous`, so the proposed reduction is also contrary to authoritative
US readings. No runtime change was made.

### Accumulated verbal `-duce` inflection gain (2026-10-23)

When an isolated regular -s form has a `-duce` stem, morphology now prefers
the independently available verb reading. This fixes `produces`, where the
bare headword's noun stress had been inherited by the inflected verb, while
leaving the noun citation `produce` and neighboring verbal -duce forms intact.
Cambridge distinguishes the verb `/prəˈduːs/` from noun `/ˈprɑːduːs/`, and
Oxford lists the verb's third-person form `produces`
([Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/produce),
[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/produce_1)).

The frozen 1,296,475-row prediction snapshot changes only `rule produces`;
hashes are `5586fe8251b4fb1858b8ba18b575ba83be677842a4b803baa89b0a7f1e1e590e`
before and `f1550906988e50cf9ac7da8ca5a3a374cfda3fe80c015c51fa480b0c94085fd4`
after. Fixed common strict/lenient move 5,546/6,428 → 5,547/6,429; top-5,000
remains 2,996/3,386. Full-dictionary strict/lenient move 62,905/83,888 →
62,906/83,889; stress-aware phonemic moves 54,882→54,883. Runtime parity
remains 94,807/100,816, default public API 4,748/5,000, rules-only public
API 4,219/5,000, context IPA 88/85/53/49, and homographs 1,455/1,615.
Typecheck and all 434 Jest suites / 7,459 tests pass. The required dictionary
rebuild still fails with DNS `EAI_AGAIN` for `raw.githubusercontent.com`, so
this gain remains uncommitted and no baselines were refreshed. The ordinary
+70 common-strict commit threshold is met against HEAD's 5,459/6,990 baseline,
but the required rebuild is still needed before commit qualification.

### Accumulated weak `pro-` stem correction in `-s` morphology (2026-10-23)

Regular -s morphology now reuses `verbStem`'s weak pro- onset normalization
when the stem has no competing !V citation reading. This repairs `proceeds`
and rule-derived forms such as `productives` and `promotionals`; noun-homograph
controls `progresses` and `processes` remain unchanged. Cambridge records
`productive` /prəˈdʌktɪv/ and `promotional` /prəˈmoʊʃənəl/; it also lists the
noun `proceeds` with initial stress, so contextual noun use remains a separate
homograph concern ([productive](https://dictionary.cambridge.org/pronunciation/english/productive),
[promotional](https://dictionary.cambridge.org/us/pronunciation/english/promotional),
[proceeds](https://dictionary.cambridge.org/us/dictionary/english/proceeds)).

Compared with the preceding `-duce` snapshot, only five predictions change:
`rule proceeds`, `morph non-productives`, `morph productives`,
`morph productivelys`, and `morph promotionals`. Snapshot hashes are
`f1550906988e50cf9ac7da8ca5a3a374cfda3fe80c015c51fa480b0c94085fd4` before and
`9c462e639e3079f18fd1f29316c128af8690331e006253f3d956bcbff49616086a` after.
Fixed common strict/lenient now stand at 5,548/6,430; top-5,000 remains
2,996/3,386. Full-dictionary strict/lenient are 62,907/83,890 and
stress-aware phonemic is 54,884/90,319. Runtime parity (94,807/100,816),
default API (4,748/5,000), rules-only API (4,219/5,000), context IPA
(88/85/53/49), and homographs (1,455/1,615) are unchanged. Typecheck and all
434 Jest suites / 7,460 tests pass. Re-dumping after adding the explicit-noun-POS
guard produced a byte-identical snapshot
(`9c462e39e3079f18fd1f29316c128af8690331e006253f3d956bcbff49616086a`), so the
five changed default predictions remain exactly the previously reviewed five.
A fresh spelling-family CV run proposed five candidate readings, but none
passed its legacy filter across held-out folds, so none was adopted. The
dictionary rebuild still fails with DNS `EAI_AGAIN`; no baselines were refreshed
and the accumulated changes remain uncommitted pending a successful rebuild and
final qualification.

### Structural-context search and route audit (2026-10-23)

Replayed the fixed 6,990-word cohort by actual `disableDict` route: pure rules
5,092 words / 3,904 strict correct, morphology 1,588 / 1,373, and compounds
310 / 271. The current 5,548 strict total is 744 below the 6,292 release
threshold. A ten-fold structural-feature learner accepted nine candidate
readings, but none passed its train-only adoption filter; the passed-only
held-out mean stayed 76.55%. Adding three-way contexts increased the search to
18 distinct candidates, all rejected by the same train-only filter, and the
unfiltered accepted sequence lowered held-out strict from 76.55% to 76.16%.
This confirms that richer contexts in the current one-phone replay do not
support a broader safe rule by themselves.

One recurring candidate changed an unstressed /ɪ/ near `-tin` to /ə/ and
improved `satin`, `Latin`, and `platinum` in the CMU-derived cohort, but it
also changes `bulletin`; Cambridge US explicitly gives /ɪ/ in `bulletin`,
while satin differs by dialect (US /ə/, UK /ɪ/). That class is not safe to
adopt from this reference signal ([Cambridge bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin),
[Cambridge satin](https://dictionary.cambridge.org/us/pronunciation/english/satin)).
Postlex removal replay found no rule whose removal increases common strict;
the only strict improvement on removal also breaks `issue`. No runtime rule
or baseline was changed during this diagnosis.

### Source corrections for the AmE `-dure` family (2026-10-23)

Cambridge US gives `endure` /ɪnˈdʊr/ and Oxford US gives the same no-yod
pattern for `endure`, `endures`, `endured`, and `enduring`
([Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/endure),
[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/endure)).
The broader runtime yod rule was rejected: it raised fixed common and top-slice
strict by one each but lowered full-dictionary strict by two and runtime parity
by three. The rule is restored, with its `-dure`/`-ture` controls intact.
Cambridge/Oxford-supported source pronunciations for the four `endure` forms
are recorded in `src-data/en/custom.dict`; they remain unbuilt because
`build-dict.ts` cannot fetch upstream inputs while DNS for
`raw.githubusercontent.com` returns `EAI_AGAIN`. No runtime acceptance baseline
was changed.

### Authoritative check of common-rule failure clusters (2026-10-23)

Re-ran `test:eval --subset common --cluster` on the frozen cohort (5,548/6,990
strict). The leading rule traces are initial `i`→/ɪ/ (178 cases), `a`→/æ/
(129), unstressed `e`→/ɪ/ (71), and `e`→/ɛ/ (68); the sample words mix
loanwords, geographic names, and ordinary vocabulary. These are diagnostics,
not coherent spelling classes. A suffix census of the 1,442 current common
mismatches likewise does not establish a safe -ity or -ment rewrite.

Cambridge US confirms the rule-path schwa in *facility* /fəˈsɪl.ə.t̬i/,
*stability* /stəˈbɪl.ə.t̬i/, and *liability* /ˌlaɪ.əˈbɪl.ə.t̬i/; the pinned
IPA-Dict rows instead expect /ɪ/ in those weak syllables. A broad weak-vowel
change would move those real US readings away from the independent dictionary
source. The ending -ment is also not uniform: Cambridge gives *comment*
/ˈkɑː.ment/, *document* noun /ˈdɑː.kjə.mənt/ (verb /ˈdɑː.kjə.ment/), and
*cement* /səˈment/. So a suffix-only replacement would mix different stress,
POS, and vowel patterns ([facility](https://dictionary.cambridge.org/us/pronunciation/english/facility),
[stability](https://dictionary.cambridge.org/us/dictionary/english/stability),
[liability](https://dictionary.cambridge.org/us/dictionary/english/liability),
[comment](https://dictionary.cambridge.org/us/pronunciation/english/comment),
[document](https://dictionary.cambridge.org/pronunciation/english/document),
[cement](https://dictionary.cambridge.org/us/dictionary/english/cement)). No
runtime rule or baseline was changed by this audit; follow-up work should first
separate source disagreement from a productive morphological environment.

### Rebuilt generated English data and checked source corrections (2026-10-23)

Fetched the configured upstream sources and completed `build-dict.ts`,
`seed-data.ts`, `mine-compound-parts.ts`, and gram-free `mine-exceptions.ts`
through direct Node/tsx registration. The dictionary contains 109,159 entries;
the dependency-aware exception pass re-pinned 532 stems, resolved 535
wrong-to-exact derived forms, and retained five net-positive regressions
(`caterings`, `fared`, `instituting`, `provance`, `provence`). The rebuilt
exception table has 53,515 entries. This replaced the earlier DNS-blocked
build state; it did not refresh baselines.

Cambridge US records *present* verb as /prɪˈzent/; its regular participle is
represented in `src-data/en/custom.dict` as *presenting* /prɪˈzentɪŋ/. The
previous IPA-Dict row used /i/ in the weak first syllable. The generated rule
and default outputs now preserve the Cambridge-supported /ɪ/ reading. This is
a reference correction, not a rule gain. A second candidate for *detailed*
matched Cambridge's /ˈdiːteɪld/ but was withdrawn because replacing the pinned
IPA-Dict reference reduced public CMU accuracy from 4,748/5,000 to 4,747/5,000;
the source entry and test expectation were removed.

After the final rebuild, the fixed common rule cohort is 5,549/6,990 strict
and 6,430/6,990 lenient; the fixed top-5,000 slice is 2,996/3,617 strict and
3,386/3,617 lenient. Full-dictionary rule accuracy is 62,907/105,078 strict
and 83,889/105,078 lenient. Runtime parity is 94,808/100,817 strict and
100,711 lenient; public API is 4,748/5,000 default and 4,219/5,000 rules-only;
context IPA remains 88/85/53/49 across default/rules × auto/gold POS, and
homographs remain 1,455/1,615. The common strict count's one-item increase is
not counted as a pronunciation gain because the reference row changed. Full
lenient is one below the immediately preceding run, so this batch is not
qualified for adoption or baseline refresh.

On the rebuilt table, the fixed-cohort ten-fold structural learner accepted
28 candidate rules; none passed the train-only filter. The strongest weak-
vowel candidate changed 15 top-slice words to matches but broke 9, and its
held-out mean did not improve. Postlex removal still found no common strict
gain. All 434 Jest suites / 7,461 tests and `yarn typecheck` pass, including
the focused apostrophe/reference tests. Issue #28's O'Brien, O'Reilly Media,
possessive, curly-apostrophe, and sentence-token regressions remain green.
Release strict targets remain unmet; no baseline was updated and no commit was
created.

### Rejected unstressed open-a lengthening candidate (2026-10-23)

The refreshed cluster report remains led by initial `i` (178 cases), initial
`a` (129), and separate `e` environments (71/68); route ablation confirms
morphology is essential (+764 strict words over disabling it), while unsplitting
the whole cohort loses 878. A candidate to require stress before `nextIsCle`
lowered common/top-slice strict from 5,549/2,996 to 5,548/2,995. Narrowing the
candidate to unstressed `-ate` silent-e syllables improved the trace for
*chocolate* to `/ˈtʃɑkəɫət/`, but dropped strict to 5,474/6,990 and 2,971/3,617;
the wider `nextIsMagicE` condition also changed unrelated `-able`/`-ate` forms.
Both experiments were reverted. Cambridge US confirms *chocolate* /ˈtʃɑːk.lət/,
but this single-word evidence does not justify a broad class: [Cambridge US
pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/chocolate).
The fixed rule cohorts are restored at 5,549/6,990 and 2,996/3,617; no baseline
or pronunciation source was changed.

### Frozen-cohort suffix census and `-age` probe (2026-10-23)

Counted exact stress-stripped rule matches by spelling suffix across the fixed
6,990 words. The highest error counts among endings with at least 20 examples
were `-on` 77/419, `-er` 50/364, `-an` 47/123, `-al` 40/235, `-es` 36/224,
`-ent` 30/188, `-ed` 30/349, `-ty` 30/108, `-re` 29/130, `-se` 29/102,
`-ate` 17/73, and `-age` 17/46. This census is for candidate discovery only;
it does not establish that an ending is a productive phonological class.

As a direct `-age` probe, changing every generated final `/ɪdʒ/` to `/ədʒ/`
would turn 7 mismatches into matches but break 29 already-correct words in the
full slice (46 examples total); the top-5,000 slice would gain 4 and lose 16.
The examples split between productive `-age` forms and lexical `-age` words
(`message`, `village`, `passage`, `cottage`), so the blanket vowel change was
rejected. The diagnostic did not alter runtime code, references, or baselines.

The independent family-fold learner run with `--objective distance --structural`
accepted eight local candidates (two distinct readings overall), but none
passed the train-only filter; filtered held-out strict stayed at 76.55%. The
full 107,657-word postlex removal replay likewise found no rule removal with a
positive common-strict delta. Current verified scores remain common strict
5,549/6,990, top-5,000 strict 2,996/3,617, and public API 4,748/5,000. These
screens leave the next step at source-backed investigation of high-impact
word-class errors, not wider one-phone or postlex edits.

### Separate CMU API and fixed rule-cohort plural reports (2026-10-23)

The public API's CMU top-5,000 mismatch report and the 6,990-word rules-only
cohort are different populations. Several sibilant `-es` examples previously
noticed in the API report (`resources`, `searches`, `references`, `forces`,
among others) are not members of the frozen rule cohort; only `releases` and
`addresses` from that sample are. On the actual fixed cohort, a root-backed
simulation that restored `/ɪz/` after `/s z ʃ ʒ/` found one strict win but broke
84 currently correct common words (41 in the top-5,000 slice). The
phonotactics merger is retained; API mismatches are not counted as common-rule
improvements.

A deterministic edit alignment of the same fixed cohort's 1,441 rule errors
counts the largest single-phone substitutions as `/ɪ/→/ə/` (219), `/ɪ/→/i/`
(86), `/ə/→/ɪ/` (77), `/ə/→/ɑ/` (68), and `/æ/→/ə/` (64). The result depends
on one minimum-edit alignment where sequences admit alternatives; it is a
diagnostic count, not a candidate score. Opposing directions and diverse
contexts confirm that a global weak-vowel rewrite is not a class-level fix.

The common `-ed` error set also contains an apparent `-ked` cluster: rules
render *naked* and *wicked* with the past-tense `/t/`, while the pinned rows
have the lexical adjective `/ɪd/`. The same fixed cohort contains *liked*,
whose regular past `/t/` is already correct. Because spelling alone does not
separate these readings, no `-ked` rewrite was made; the two adjective
references remain in the existing source-correction audit.

### Rejected initial `ir-` vowel candidate (2026-10-23)

A temporary rule changed a primary- or secondary-stressed initial `i` to
`/aɪ/` before `r` plus `a/e/o`. On the unchanged 6,990-word rules cohort this
left strict at 5,549/6,990 and raised lenient by one, from 6,430 to 6,431;
top-slice strict remained 2,996/3,617 and lenient rose by one, from 3,386 to
3,387. That apparent gain is not a safe class improvement: Cambridge US gives
*Iran* `/ɪˈræn/`, directly contradicting the broad rule, while its `/aɪ/`
readings for *Ireland*, *Irish*, and *iron* do not establish a productive
`ir-` correspondence ([Iran](https://dictionary.cambridge.org/us/pronunciation/english/iran),
[Ireland](https://dictionary.cambridge.org/us/pronunciation/english/ireland),
[Irish](https://dictionary.cambridge.org/us/pronunciation/english/irish),
[iron](https://dictionary.cambridge.org/us/pronunciation/english/iron)). The
temporary rule was removed. No pronunciation source, baseline, or runtime
mapping was changed; the next candidate must distinguish its readings from
spelling and assigned stress alone.

### Rejected blanket final `-ity` vowel promotion (2026-10-23)

Replayed a stress-stripped `/əti/` → `/ɪti/` substitution for words ending in
`-ity` or `-ities` across all 6,990 fixed-cohort predictions. It would change
86 outputs: 13 strict wins and 60 strict regressions (net −47); regressions
include *activity*, *community*, *quality*, *ability*, *facilities*, and
*university*. Wins and losses are interleaved across bases, so the suffix alone
does not select the reference vowel. The transformation was only simulated;
no source, runtime rule, expected reading, or baseline changed.

### `-tribution` reduction is reference variation, not a safe rule (2026-10-23)

The remaining `-tion` cluster includes *distribution* and *contribution*,
where rules retain `/ɪ/` before stressed `/bju/` but the pinned rows use
`/ə/`. Cambridge's US pronunciation entries give `/ɪ/` for both words, while
its American Dictionary gives `/ə/` for *distribution*; Cambridge also lists
`/ə/` and `/ɪ/` variants for related *attribution* across its US/UK sources
([distribution pronunciation](https://dictionary.cambridge.org/us/pronunciation/english/distribution),
[distribution American Dictionary](https://dictionary.cambridge.org/dictionary/english/distribution),
[contribution](https://dictionary.cambridge.org/us/pronunciation/english/contribution),
[attribution](https://dictionary.cambridge.org/us/pronunciation/english/attribution)).
The vowel alternation therefore cannot justify a blanket rule from the pinned
rows; no pronunciation or scoring reference was changed.

### Frozen-cohort morphology route audit (2026-10-23)

Replayed current rule predictions with morphology disabled and with
syllabification kept unsplit. The verified baseline remains 5,549/6,990
strict, 6,430/6,990 lenient; removing morphology falls to 4,785/6,990 strict
and unsplitting to 4,671/6,990, so neither route is a viable adoption path.
The largest local morphology ablation win was the `-ies` y-stem handler
(2 wins, 64 losses): it fixes *series* and *ministries*, but the first is an
invariant lexical `-ies` noun without a *sery* stem, while the second's pinned
plural vowel differs from its own *ministry* stem. The remaining affected
forms include productive y-plurals, so broadening the handler would damage the
class. A rhotic `-er` ablation recovers *recorder* but loses eight strict
readings overall and confounds the noun/verb readings of *record*. These
route-local examples identify concrete investigations; neither ablation is
accepted as a fix.

A temporary y-stem guard requiring a dictionary-backed base also failed:
common strict fell 21 (to 5,528/6,990), and top-slice strict fell 7 (to
2,989/3,617). It repairs *series* by avoiding the fabricated *sery* stem but
rejects many valid rule-derived plurals because their bases are absent from
the trimmed runtime table. The guard was removed; the morphology source is
unchanged.

### High-frequency `have` rule-path check (2026-10-23)

Cambridge US lists strong `have` /hæv/ and weak /həv/ or /əv/. The shipped
default exception table already returns /hæv/, while `disableDict:true` rules
still render /heɪv/. A temporary custom-dictionary injection repaired exactly
one item in the fixed common and top-5000 rule cohorts with no measured
regressions, but it was not a source change: it bypassed the evaluator's
intentional dictionary-disabled rule route, and no general silent-e class
distinguishes `have` from `gave` and `save`. The probe was discarded; this
does not count as a common-rule gain.

### Month-abbreviation reference check (2026-10-23)

The frozen common cohort's `feb`, `aug`, `oct` and `nov` failures are not
obvious IPA-Dict mistakes: Cambridge US gives the written abbreviations `Feb.`
and `Aug.` full month-name pronunciations, and its pronunciation entry for
`Nov.` likewise gives the full November form ([Feb](https://dictionary.cambridge.org/us/pronunciation/english/feb),
[Aug](https://dictionary.cambridge.org/us/pronunciation/english/aug),
[Nov](https://dictionary.cambridge.org/us/pronunciation/english/nov)). `Oct.`
also has an attested full October pronunciation, though Cambridge's US vowel
differs from the pinned IPA-Dict form ([Oct](https://dictionary.cambridge.org/us/pronunciation/english/oct)).
The fixed isolated-word evaluator has no punctuation or sentence context to
establish whether these bare forms should be expanded. Keep the rows in the
unchanged denominator and do not rewrite their references or count them as a
pronunciation gain without a clearer benchmark contract.

### Issue #28 authoritative O'Brien reading (2026-10-23)

Cambridge US gives O'Brien /oʊˈbraɪən/ ([source](https://dictionary.cambridge.org/pronunciation/english/o-brien)),
so the earlier IPA-Dict /oʊˈbɹaɪɪn/ expectation was corrected. The general
Irish O' composition path now applies the attested /aɪən/ compound ending
when the independently read surname has /aɪɪn/; Brien alone, O'Neill,
O'Briens, O'Reilly Media, apostrophe variants, possessives, sentence tokens
and the rules-only route are paired controls. O'Reilly Media is only an
unaffected brand-name example, not the word reported in the issue. The same verified reading is recorded
for O'Brien and its regular possessive in `src-data/en/custom.dict` so the
runtime reference agrees with the standard source without a whole-name branch
in G2P code.

After rebuilding dictionary, compound parts and dependency-aware exceptions,
full-dictionary rule strict/lenient is 62,910/105,078 and 83,891/105,078
(two strict and two lenient gains from the corrected O'Brien entries); runtime
parity is unchanged at 94,808/100,817 strict and 100,711 lenient. Common strict
remains 5,550/6,990 and top-5000 strict 2,997/3,617. Public API CMU is
4,748/5,000 default and 4,220/5,000 rules-only; context is 88/108 default-auto,
85/108 default-gold, 53/108 rules-auto and 49/108 rules-gold; homographs are
1,455/1,615; stress-aware phonemic is 54,884/90,320. The fixed common release
targets remain unmet. No baseline was refreshed and no commit was made.

Validation: `yarn typecheck`, all 435 Jest suites / 7,469 tests, focused
apostrophe regressions, full/common strict evaluation, parity, CMU default and
rules, context IPA, homographs, and stress-aware evaluation pass their
non-regression checks. Rules-only CMU remains below its legacy 90% floor, as
before. A fresh structural 10-fold learner run on the frozen common cohort
accepted 28 candidates but none passed the train-only filter; mean held-out
strict stayed 76.55%. The route diagnosis confirms that removing morphology
reduces strict from 5,550 to 4,785, while forcing unsplit syllabification
reduces it to 4,671, so neither is an adoption path. Rollup also built the
CJS/ESM package, and the compiled CJS smoke preserved Brien, O'Brien,
O'Briens, O'Brien's, O'Neill and O'Reilly Media readings.

### `-posit` root replay (2026-10-23)

Rechecked the `posit` family against the frozen 6,990-word common cohort.
Ten cohort members contain `posit`; eight already match the pinned strict
reading, while `deposit` (`/dɪˈpoʊzɪt/` vs `/dəˈpɑzɪt/`) and `composite`
(`/kəmˈpɑzət/` vs `/kɑmˈpɑzət/`) fail. Their errors belong to different
syllables (`de-` plus stressed `po` versus reduced `com-`), so a single
`-posit` vowel rewrite cannot repair both. Related controls `position`,
`positive`, `opposition`, `opposite`, `composition`, `repository`,
`proposition`, and `disposition` already pass. No rule or reference changed;
the suffix-only candidate was rejected pending a broader independently
supported syllable/stress class.

### Common cohort replay and source-backed corrections (2026-10-23)

The user clarified that O'Reilly Media is an unaffected brand-name example;
the issue reports O'Brien. The general O' composition regression still covers
apostrophe spelling variants, possessives, prose tokens, and rule-only output.
No O'Reilly-specific rule or word mapping was added.

Cambridge US readings were independently checked for *credit*, *edit*,
*editor*, and *edition*. Those source-backed pronunciations and regular
inflections were recorded in `src-data/en/custom.dict`; no whole-word logic
was added to `g2p.ts`. The common evaluator now keeps a hash-checked,
evaluation-only IPA snapshot so dictionary trimming does not remove fixed
cohort gold rows. Reference corrections are reported separately from rule
gains and do not flow into runtime tables.

The rebuilt checkout currently scores common strict **5,592/6,990 (80.00%)**,
top-5000 **3,021/3,617 (83.52%)**, full rule strict/lenient **62,892/105,077**
and **83,882/105,077**, stress-aware **54,860/90,319**, runtime parity
**94,806/100,816 strict** and **100,710/100,816 lenient**, public CMU default
**4,747/5,000** and rules-only **4,221/5,000**, context **88/108, 85/108,
53/108, 49/108**, and homographs **1,455/1,615**. These do not pass every
adoption gate: runtime parity is one strict item below its committed baseline,
stress-aware is below baseline, and CMU default is one item below the earlier
before-run result. The rules-only CMU floor remains unmet as documented.

A short `-it` morphology candidate repaired *edited* and *credited* in paired
tests, but full stress-aware and full-dictionary gates regressed; the
candidate and its temporary tests were removed. The open stop-r silent-e
recovery was kept after paired *mitred/metred* controls passed. Common strict
remains far below the release target of 90%; no baseline was refreshed and
no commit was made.

### Short `-it` premise replay (2026-10-23)

The premise that a shared primary-stress frame separates short `-it` verbs
from silent-e `-ite` roots was tested directly on fixed-cohort `-ited/-iting`
forms. Of 11 cases, current rules match 10 pinned readings; composing from
the short-root prediction matches only 2. Restricting the candidate to forms
whose predicted `-it` and `-ite` roots share a primary-stressed syllable still
matches only 1/7, versus 6/7 current predictions. The premise is contradicted
by the held controls, so no such runtime rule is retained.

A fresh ten-fold family-grouped structural learner accepted 25 experimental
readings, but none passed the train-only filter; applying all accepted rules
would lower held-out strict from 76.89% to 76.58%. Route ablation again showed
that morphology and split syllabification protect hundreds of common strict
matches. Whole-dictionary postlex ablation found no common strict gain from
removing a rule. These diagnostics did not justify a new pronunciation rule.

The `-ative` class was also replayed directly against the frozen common set.
Deriving every `-ative` form from its corresponding `-ate` base produced one
strict win and six losses among the 16 cohort cases. Restricting the rewrite to
an apparently unstressed `-ate` ending produced no changed predictions, so
that stress predicate did not recover a deployable subclass. No suffix rule
was added; stress and root selection remain lexically conditioned in this
cohort, and the broader candidate is unsafe.

### Common error-class cross-validation (2026-10-23)

A fresh family-grouped ten-fold run of `learn-rule-corrections.ts --structural`
replayed 5,064 rules-path words per fold. It accepted 25 fold-local candidates
across six distinct spellings, but none passed the train-only filter; filtered
held strict remained 76.89% (the same as baseline). The strongest recurring
candidate changed an unstressed /ɪ/ to /ə/ before `b`. It repaired `robinson`,
`rabbit`, `cabin`, and `orbit`, but broke controls including `exhibit` and
`cubic`; it also caused top-5000 losses without a win. Other candidates had
positive aggregate training nets but failed at least one paired/top-5000 gate.
No rule was adopted from this run.

A separate whole-testable-dictionary replay of unstressed `-tin` / `-ti+n`
centralization found 18 strict repairs and 75 regressions (net -57), despite
five repairs and no regressions in the fixed common cohort. The affected
spellings include names and ordinary vocabulary with mixed readings, so the
cohort-only gain does not justify a runtime rule. Cambridge's US bulletin
entry also syllabifies the word as /ˈbʊl.ə.tɪn/, while the pinned cohort and
runtime dictionary use /ˈbʊlɪtən/; this confirms that vowel-reduction targets
cannot be inferred from a suffix spelling alone. [Cambridge pronunciation of
bulletin](https://dictionary.cambridge.org/us/pronunciation/english/bulletin).

Further suffix narrowing did not isolate a safe subclass: conditioning the
same change on final `-atin` yielded four repairs and three regressions across
the testable dictionary, with two common-cohort repairs and no common losses.
The regressions include `gallatin`, `lovastatin`, and `patin`; no `-atin` rule
was adopted.

### Rebuilt common batch and silent-e guard repair (2026-10-24)

The final rebuild after the Cambridge-backed `edit`, `credit`, and
`investment` source corrections exposed a collateral change from the
open-stop-r silent-e recovery: a newly added fallback treated otherwise
unvouched `-ed/-ing` stems as known monosyllables. Restricting that fallback to
its intended open-stop-r cases restored neighboring forms such as *bobbled*,
*dwindled*, and *impeded* while retaining *mitred/metred*. The focused
open-stop-r suite passes both dictionary modes.

A frozen prediction-snapshot review found 20 changed rule-path dictionary
forms: 11 strict wins and 6 losses over the full dictionary (net +5), and 2
wins with no losses in both the fixed common and top-5000 cohorts. The two
common gains are *edited* and *personally*. Stress-aware phonemic changed by 6
wins and 3 losses (net +3); runtime parity changed by 12 wins and one loss
(net +11). The isolated full-dictionary and stress-aware counts did not fall.
The remaining strict losses include *editorship*, whose composition still
needs a general fix; it was not hidden with a word-specific runtime rule.

After rebuilding dictionaries, compound parts and dependency-aware
exceptions, current counts are common strict **5,593/6,990**, top-5000 strict
**3,022/3,617**, full rule strict/lenient **62,915/105,077** and
**83,891/105,077**, stress-aware phonemic **54,886/90,319**, runtime parity
**94,807/100,816 strict** and **100,710/100,816 lenient**, public CMU API
**4,748/5,000 default** and **4,223/5,000 rules-only**, context **88/108,
85/108, 53/108, 49/108**, and homographs **1,455/1,615**. The independent
Cambridge US pronunciations for [*creditable*](https://dictionary.cambridge.org/us/dictionary/english/creditable),
[*discredit*](https://dictionary.cambridge.org/us/dictionary/english/discredit),
and [*disinvestment*](https://dictionary.cambridge.org/us/dictionary/english/disinvestment)
confirm their new rule outputs; the matching pinned IPA-Dict forms are stale
reference variants, so those differences were reviewed separately from common
cohort gains.

All 435 Jest suites / 7,474 tests and typecheck pass. Every context cell,
reading/class slice, and fixed 88-case POS-supported cell is nondecreasing.
The common baseline advanced by 48 over the last working-tree checkpoint and
134 over the previous committed baseline, exceeding the normal +70 commit
threshold. The next-release strict targets remain unmet by 699 common words
and 234 top-5000 words; no claim of release-goal completion is made.

The `-ity` mismatch cluster also contains documented accent/reference variants,
not a uniform rule error. The rules path gives `liability` /...bɪləti/ and
`celebrity` /...brəti/, matching Cambridge's US pronunciations, while the
frozen cohort uses /ɪ/ in those unstressed suffix vowels. These cases are
kept out of runtime tuning; any gold change would need a separately versioned
reference contract and must not be counted as a pronunciation gain.
[Cambridge liability](https://dictionary.cambridge.org/us/pronunciation/english/liability),
[Cambridge celebrity](https://dictionary.cambridge.org/us/pronunciation/english/celebrity).

The common `-ation` miss set was replayed as well. Replacing /ʃ/ with /ʒ/ after
/eɪ/ would fix `equation`, but across the full testable dictionary the broad
condition yields one strict fix and 434 breaks. Cambridge confirms the US
/ɪˈkweɪʒən/ reading, but the only supported spelling family in this replay is
`equation`; a broader suffix rule is unsafe and a one-lemma source-code branch
would violate the no-per-word-exception policy. No source rule was added.
[Cambridge equation](https://dictionary.cambridge.org/pronunciation/english/equation).

### Rejected common `-ment` vowel rewrite (2026-10-23)

A direct fixed-cohort replay changed final rules-path `/ənt/` to `/ɛnt/` in
every matching word ending in `-ment`. Of 66 changed words, it repaired only
*comment* and *document*, broke 57 previously correct readings, and left seven
still incorrect. The suffix does not select the vowel reliably, so no runtime
rule or reference changed. Current release metrics remain 5,592/6,990 strict
and 3,021/3,617 top-5,000 strict; this candidate is not counted as progress
toward either target.
