import EnglishG2P from '../src/en/g2p';
import dictionary from '../data/en/dict.json';
import fs from 'fs';
import { join, resolve } from 'path';
import levenshtein from 'fast-levenshtein';
import { isForeign } from './foreign-filter';

const BASELINE_PATH = join(__dirname, 'eval-baseline.json');
const COMMON_BASELINE_PATH = join(__dirname, 'eval-common-baseline.json');
const MAX_WORD_LENGTH = 12; // Words longer than this are considered "compound" and excluded.

interface Baseline {
  date: string;
  strictAccuracy: number;
  lenientAccuracy: number;
  averageDistance: number;
  medianDistance: number;
}

interface SubsetBaselineSlice {
  n: number;
  strictAccuracy: number;
  lenientAccuracy: number;
}

interface CommonBaseline {
  date: string;
  full: SubsetBaselineSlice;
  top5000: SubsetBaselineSlice;
}

const subsetArgIdx = process.argv.indexOf('--subset');
const cliArgs = {
  cluster:         process.argv.includes('--cluster')         || process.argv.includes('-c'),
  updateBaseline:  process.argv.includes('--update-baseline') || process.argv.includes('-u'),
  subset:          subsetArgIdx >= 0 ? process.argv[subsetArgIdx + 1] : undefined,
};
if (cliArgs.subset !== undefined && cliArgs.subset !== 'common') {
  throw new Error(`--subset must be "common", got "${cliArgs.subset}"`);
}

/**
 * Normalizes a phoneme string for comparison.
 * - Removes primary and secondary stress markers.
 * - TODO: Could be extended to handle more variations.
 * @param phonemes The phoneme string.
 * @returns A normalized string.
 */
function normalizePhonemes(phonemes: string): string {
  // Strict is "exact after stress removal", so it also removes the one vowel
  // distinction American references condition on stress alone: STRUT /ʌ/ is
  // the stressed form of schwa /ə/. CMUdict has a single AH phone for both
  // (AH1 vs AH0, cmudict.phones), and Merriam-Webster writes both \ə\ (abut,
  // humdrum: "\ˈə\ in stressed syllables … IPA [ʌ]"). ipa-dict, the reference
  // here, writes ə under stress too, so /ʌ/ output would otherwise be a
  // stress mismatch counted as a vowel error.
  return phonemes.replace(/[ˈˌ]/g, '').replace(/ʌ/g, 'ə');
}

/**
 * Defines groups of phonemes that can be considered equivalent due to
 * stylistic or dialectal variations.
 * This helps in lenient comparison.
 * Each inner array represents a group of similar phonemes.
 */
const SIMILAR_PHONEME_GROUPS: string[][] = [
    ['ə', 'ʌ'],       // schwa vs. wedge (e.g., 'bus')
    ['ɑ', 'ɔ'],       // cot-caught merger
    ['i', 'ɪ'],       // happy-tensing (e.g., 'city')
    ['ɛ', 'eɪ'],      // e.g., economic
    ['ɫ', 'l'],       // l vs. ɫ
    ['æ', 'eɪ'],      // e.g., 'a' vs. 'eɪ'
];


/**
 * Canonizes a phoneme string by replacing variants with a canonical form.
 * This is used for lenient comparison.
 * @param phonemeStr The phoneme string.
 * @returns A new string with phonemes replaced by their canonical equivalents.
 */
function canonizePhonemeString(phonemeStr: string): string {
    let result = phonemeStr;
    SIMILAR_PHONEME_GROUPS.forEach(group => {
        const canonical = group[0];
        for (let i = 1; i < group.length; i++) {
            // Use a regex with the 'g' flag for global replacement.
            result = result.replace(new RegExp(group[i], 'g'), canonical);
        }
    });
    return result;
}


function clusterFailures(
  mismatches: Array<{ word: string; expected: string; predicted: string; distance: number }>,
  g2p: EnglishG2P,
): void {
  interface Cluster { rule: string; grapheme: string; phoneme: string; words: string[] }
  const clusters = new Map<string, Cluster>();

  for (const { word, expected, predicted } of mismatches) {
    const tr = g2p.trace(word);
    if (tr.path !== 'rules' || tr.steps.length === 0) continue;

    // Trace steps precede dark-l phonotactics. Ignore that allophone here
    // to locate substantive errors; the reported accuracy is unchanged.
    const normPred = normalizePhonemes(predicted).replace(/ɫ/g, 'l');
    const normExp  = normalizePhonemes(expected).replace(/ɫ/g, 'l');
    if (normPred === normExp) continue;
    let pos = 0;
    while (pos < normPred.length && pos < normExp.length && normPred[pos] === normExp[pos]) pos++;

    let stepEnd = 0;
    let hit = tr.steps[0];
    for (const step of tr.steps) {
      if (stepEnd + step.phoneme.length > pos) { hit = step; break; }
      stepEnd += step.phoneme.length;
    }

    const key = `${hit.rule}|${hit.grapheme}→${hit.phoneme}`;
    const existing = clusters.get(key);
    if (existing) existing.words.push(word);
    else clusters.set(key, { rule: hit.rule, grapheme: hit.grapheme, phoneme: hit.phoneme, words: [word] });
  }

  const top = [...clusters.values()].sort((a, b) => b.words.length - a.words.length).slice(0, 20);
  console.log('\n--- Approximate Failure Clusters (direct rule traces) ---\n');
  top.forEach((c, i) => {
    const ex = c.words.slice(0, 5).join(', ') + (c.words.length > 5 ? ` +${c.words.length - 5} more` : '');
    console.log(`${i + 1}. [${c.rule}]  "${c.grapheme}" → /${c.phoneme}/  (${c.words.length} words)`);
    console.log(`   e.g.: ${ex}`);
  });
}

/**
 * Rule 1: Must be a basic alphabetic word (apostrophes allowed) and have a
 *   reasonable length.
 * Rule 2: Exclude long words, which are likely compounds and not suitable
 *   for this ruleset.
 * Rule 3: Exclude acronyms/initialisms that are handled by separate logic
 *   in the G2P model.
 * Rule 4: Exclude words without standard vowels (a,e,i,o,u), which cannot
 *   be phonemized by normal rules.
 */
function getTestableWords(words: string[]): string[] {
  const VOWELS_AEIOU = new Set("aeiou".split(""));
  return words.filter(word => {
    if (!/^[a-z']+$/i.test(word) || word.length < 3) return false;
    if (word.length > MAX_WORD_LENGTH) return false;
    if (/^([A-Z]\\.?){2,8}$/.test(word)) return false;
    if (![...word.toLowerCase()].some(char => VOWELS_AEIOU.has(char))) return false;
    return true;
  });
}

interface ScoreResult {
  total: number;
  strictCorrect: number;
  lenientCorrect: number;
  strictAccuracy: number;
  lenientAccuracy: number;
  averageDistance: number;
  medianDistance: number;
  mismatches: Array<{ word: string; expected: string; predicted: string; distance: number }>;
}

/** Scores one word list with the strict/lenient definitions shared by every subset. */
function scoreWordList(wordList: string[], dict: Record<string, string>, g2p: EnglishG2P): ScoreResult {
  let strictCorrect = 0;
  let lenientCorrect = 0;
  const total = wordList.length;
  const mismatches: ScoreResult['mismatches'] = [];
  const allDistances: number[] = [];

  for (const word of wordList) {
    const expectedPron = dict[word];
    if (!expectedPron) continue;

    const predictedPron = g2p.predict(word, 'en');

    const normExpected = normalizePhonemes(expectedPron);
    const normPredicted = normalizePhonemes(predictedPron || '');

    if (normExpected === normPredicted) {
      strictCorrect++;
      lenientCorrect++;
      allDistances.push(0);
    } else {
      const canonExpected = canonizePhonemeString(normExpected);
      const canonPredicted = canonizePhonemeString(normPredicted);
      const distance = levenshtein.get(canonExpected, canonPredicted);
      allDistances.push(distance);

      if (distance <= 1) {
        lenientCorrect++;
      }

      mismatches.push({
        word,
        expected: expectedPron,
        predicted: predictedPron || '',
        distance: levenshtein.get(normExpected, normPredicted),
      });
    }
  }

  mismatches.sort((a, b) => b.distance - a.distance);

  const strictAccuracy = total ? (strictCorrect / total) * 100 : 0;
  const lenientAccuracy = total ? (lenientCorrect / total) * 100 : 0;

  const sumOfDistances = allDistances.reduce((acc, dist) => acc + dist, 0);
  const averageDistance = total ? sumOfDistances / total : 0;

  const sortedDistances = [...allDistances].sort((a, b) => a - b);
  const mid = Math.floor(total / 2);
  const medianDistance = total === 0 ? 0
    : total % 2 !== 0 ? sortedDistances[mid]
    : (sortedDistances[mid - 1] + sortedDistances[mid]) / 2;

  return { total, strictCorrect, lenientCorrect, strictAccuracy, lenientAccuracy, averageDistance, medianDistance, mismatches };
}

const delta = (now: number, prev: number | undefined, higherIsBetter = true) => {
  if (prev === undefined) return '';
  const d = now - prev;
  if (Math.abs(d) < 0.005) return '';
  const sign = d > 0 ? '+' : '';
  const arrow = higherIsBetter ? (d > 0 ? ' ↑' : ' ↓') : (d < 0 ? ' ↑' : ' ↓');
  return ` (${sign}${d.toFixed(2)}${arrow})`;
};

function writeMismatchReport(
  reportPath: string,
  result: ScoreResult,
  excludeNote: string,
): boolean {
  if (result.mismatches.length === 0) return false;
  let reportContent = `G2P Rule-based Mismatch Report\n`;
  reportContent += `=====================================\n`;
  reportContent += `${excludeNote}\n\n`;
  reportContent += `Overall Accuracy:\n`;
  reportContent += `  - Strict Accuracy: ${result.strictAccuracy.toFixed(2)}%\n`;
  reportContent += `  - Lenient Accuracy (dist <= 1): ${result.lenientAccuracy.toFixed(2)}%\n`;
  reportContent += `Error Distance Metrics (Levenshtein):\n`;
  reportContent += `  - Average Distance: ${result.averageDistance.toFixed(2)}\n`;
  reportContent += `  - Median Distance: ${result.medianDistance.toFixed(2)}\n\n`;
  reportContent += `All Mismatches (sorted by Levenshtein distance):\n\n`;

  result.mismatches.forEach(m => {
    reportContent += `Word: "${m.word}" (Distance: ${m.distance})\n`;
    reportContent += `  - Expected:  ${m.expected}\n`;
    reportContent += `  - Predicted: ${m.predicted}\n\n`;
  });

  fs.writeFileSync(reportPath, reportContent);
  return true;
}

/** Default full-dictionary run: unchanged behavior/output from before `--subset` existed. */
async function evaluateFullDict(g2p: EnglishG2P, dict: Record<string, string>, testableWords: string[]) {
  console.log(`Evaluating ${testableWords.length} testable words from the dictionary...`);

  const result = scoreWordList(testableWords, dict, g2p);

  let baseline: Baseline | null = null;
  if (fs.existsSync(BASELINE_PATH)) {
    try { baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')); } catch { /* ignore */ }
  }

  console.log(`\n--- G2P Rule-based Evaluation Results ---`);
  if (baseline) console.log(`    baseline: ${baseline.date}`);
  console.log(`Total words evaluated: ${result.total}`);
  console.log(`\nStrict Accuracy (exact match after stress removal):`);
  console.log(`  - Correct: ${result.strictCorrect}`);
  console.log(`  - Accuracy: ${result.strictAccuracy.toFixed(2)}%${delta(result.strictAccuracy, baseline?.strictAccuracy)}`);

  console.log(`\nLenient Accuracy (allowing Levenshtein distance <= 1):`);
  console.log(`  - Correct: ${result.lenientCorrect}`);
  console.log(`  - Accuracy: ${result.lenientAccuracy.toFixed(2)}%${delta(result.lenientAccuracy, baseline?.lenientAccuracy)}`);

  console.log(`\nError distance metrics (Levenshtein):`);
  console.log(`  - Average Distance: ${result.averageDistance.toFixed(2)}${delta(result.averageDistance, baseline?.averageDistance, false)}`);
  console.log(`  - Median Distance: ${result.medianDistance.toFixed(2)}${delta(result.medianDistance, baseline?.medianDistance, false)}`);

  const reportPath = 'g2p-mismatches-report.txt';
  if (writeMismatchReport(
    reportPath,
    result,
    `Excluding words longer than ${MAX_WORD_LENGTH} characters and detected abbreviations.`,
  )) {
    console.log(`\nFull mismatch report for the top 100 errors saved to: ${reportPath}`);
  }
  if (cliArgs.cluster) clusterFailures(result.mismatches, g2p);

  if (cliArgs.updateBaseline) {
    const b: Baseline = {
      date: new Date().toISOString().slice(0, 10),
      strictAccuracy: result.strictAccuracy,
      lenientAccuracy: result.lenientAccuracy,
      averageDistance: result.averageDistance,
      medianDistance: result.medianDistance,
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(b, null, 2) + '\n');
    console.log(`\nBaseline saved to ${BASELINE_PATH}`);
  }
}

/**
 * English-subset scoring (2026-09-27): of the ~24.2k remaining rules-only
 * lenient failures on the full dict, ~71% are proper names/surnames/brands
 * that rules can never reach from spelling alone (see AGENTS.md's ceiling
 * paragraph), so the full-dict score understates rule quality on the words
 * that matter to most users. This subset scores only dict words that are
 * both (a) in the frequency list (real English usage, not dictionary
 * long-tail) and (b) not flagged by `isForeign` (excludes the
 * proper-name/surname population `evaluate-strict.ts` already excludes for
 * the same reason). The full-dict `yarn test:eval` run above remains the
 * no-regression gate; this is the improvement target.
 */
async function evaluateCommonSubset(g2p: EnglishG2P, dict: Record<string, string>, testableWords: string[]) {
  const cacheDir = resolve(process.env.COMMON_BENCHMARK_DIR ?? 'scripts/.common-accuracy-cache');
  const freqPath = join(cacheDir, 'frequency.txt');
  if (!fs.existsSync(freqPath)) {
    throw new Error(
      `Missing ${freqPath}. Run \`yarn test:common-accuracy --download\` first to fetch the ` +
      `pinned frequency list this subset scores against.`,
    );
  }

  // Same dedup-in-rank-order treatment evaluate-common-accuracy.ts applies:
  // the raw list has a handful of duplicate tokens.
  const freqWords = [...new Set(fs.readFileSync(freqPath, 'utf8').trim().split(/\s+/))];
  const top5000Words = freqWords.slice(0, 5000);
  const freqSet = new Set(freqWords);
  const top5000Set = new Set(top5000Words);

  const nonForeignTestable = testableWords.filter(w => !isForeign(w.toLowerCase()));
  const fullSubset = nonForeignTestable.filter(w => freqSet.has(w.toLowerCase()));
  const top5000Subset = nonForeignTestable.filter(w => top5000Set.has(w.toLowerCase()));

  const fullResult = scoreWordList(fullSubset, dict, g2p);
  const top5000Result = scoreWordList(top5000Subset, dict, g2p);

  let baseline: CommonBaseline | null = null;
  if (fs.existsSync(COMMON_BASELINE_PATH)) {
    try { baseline = JSON.parse(fs.readFileSync(COMMON_BASELINE_PATH, 'utf-8')); } catch { /* ignore */ }
  }

  console.log(`\n--- G2P Rule-based Evaluation Results (English subset: frequency list, non-foreign) ---`);
  if (baseline) console.log(`    baseline: ${baseline.date}`);

  console.log(`\nFull frequency list (${freqWords.length} unique ranked words; ${fullSubset.length} testable & non-foreign):`);
  console.log(`  - Strict:  ${fullResult.strictCorrect}/${fullResult.total} = ${fullResult.strictAccuracy.toFixed(2)}%${delta(fullResult.strictAccuracy, baseline?.full.strictAccuracy)}`);
  console.log(`  - Lenient: ${fullResult.lenientCorrect}/${fullResult.total} = ${fullResult.lenientAccuracy.toFixed(2)}%${delta(fullResult.lenientAccuracy, baseline?.full.lenientAccuracy)}`);

  console.log(`\nTop-5000 slice (${top5000Words.length} ranked words; ${top5000Subset.length} testable & non-foreign):`);
  console.log(`  - Strict:  ${top5000Result.strictCorrect}/${top5000Result.total} = ${top5000Result.strictAccuracy.toFixed(2)}%${delta(top5000Result.strictAccuracy, baseline?.top5000.strictAccuracy)}`);
  console.log(`  - Lenient: ${top5000Result.lenientCorrect}/${top5000Result.total} = ${top5000Result.lenientAccuracy.toFixed(2)}%${delta(top5000Result.lenientAccuracy, baseline?.top5000.lenientAccuracy)}`);

  const commonReportPath = 'g2p-mismatches-common-report.txt';
  if (writeMismatchReport(
    commonReportPath,
    fullResult,
    `English subset (frequency list ∩ testable dict words, non-foreign).`,
  )) {
    console.log(`\nFull mismatch report (full frequency-list slice) saved to: ${commonReportPath}`);
  }

  if (cliArgs.cluster) clusterFailures(fullResult.mismatches, g2p);

  if (cliArgs.updateBaseline) {
    const b: CommonBaseline = {
      date: new Date().toISOString().slice(0, 10),
      full: { n: fullResult.total, strictAccuracy: fullResult.strictAccuracy, lenientAccuracy: fullResult.lenientAccuracy },
      top5000: { n: top5000Result.total, strictAccuracy: top5000Result.strictAccuracy, lenientAccuracy: top5000Result.lenientAccuracy },
    };
    fs.writeFileSync(COMMON_BASELINE_PATH, JSON.stringify(b, null, 2) + '\n');
    console.log(`\nBaseline saved to ${COMMON_BASELINE_PATH}`);
  }
}

async function evaluate() {
  console.log('Starting G2P rule-based evaluation...');

  const g2p = new EnglishG2P({ disableDict: true });
  const dict = dictionary as Record<string, string>;
  const words = Object.keys(dict);

  console.log(`Initial dictionary size: ${words.length}`);
  const testableWords = getTestableWords(words);
  console.log(`Filtered down to ${testableWords.length} testable words (excluding long words & abbreviations).`);

  if (cliArgs.subset === 'common') {
    await evaluateCommonSubset(g2p, dict, testableWords);
  } else {
    await evaluateFullDict(g2p, dict, testableWords);
  }
}

evaluate().catch(error => { console.error(error); process.exitCode = 1; });
