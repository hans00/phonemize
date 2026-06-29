import EnglishG2P from '../src/en/g2p';
import dictionary from '../data/en/dict.json';
import fs from 'fs';
import { join } from 'path';
import levenshtein from 'fast-levenshtein';

const BASELINE_PATH = join(__dirname, 'eval-baseline.json');

interface Baseline {
  date: string;
  strictAccuracy: number;
  lenientAccuracy: number;
  averageDistance: number;
  medianDistance: number;
}

const cliArgs = {
  cluster:         process.argv.includes('--cluster')         || process.argv.includes('-c'),
  updateBaseline:  process.argv.includes('--update-baseline') || process.argv.includes('-u'),
};

/**
 * Normalizes a phoneme string for comparison.
 * - Removes primary and secondary stress markers.
 * - TODO: Could be extended to handle more variations.
 * @param phonemes The phoneme string.
 * @returns A normalized string.
 */
function normalizePhonemes(phonemes: string): string {
  return phonemes.replace(/[ˈˌ]/g, '');
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

    const normPred = predicted.replace(/[ˈˌ]/g, '');
    const normExp  = expected.replace(/[ˈˌ]/g, '');
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
  console.log('\n--- Top Failure Clusters ---\n');
  top.forEach((c, i) => {
    const ex = c.words.slice(0, 5).join(', ') + (c.words.length > 5 ? ` +${c.words.length - 5} more` : '');
    console.log(`${i + 1}. [${c.rule}]  "${c.grapheme}" → /${c.phoneme}/  (${c.words.length} words)`);
    console.log(`   e.g.: ${ex}`);
  });
}

async function evaluate() {
  console.log('Starting G2P rule-based evaluation...');

  const g2p = new EnglishG2P({ disableDict: true });
  const words = Object.keys(dictionary as Record<string, string>);
  const MAX_WORD_LENGTH = 12; // Words longer than this are considered "compound" and excluded.
  
  // Filter words based on user's criteria to get a more focused test set.
  console.log(`Initial dictionary size: ${words.length}`);
  const testableWords = words.filter(word => {
    // Rule 1: Must be a basic alphabetic word (apostrophes allowed) and have a reasonable length.
    if (!/^[a-z']+$/i.test(word) || word.length < 3) return false;

    // Rule 2: Exclude long words, which are likely compounds and not suitable for this ruleset.
    if (word.length > MAX_WORD_LENGTH) return false;

    // Rule 3: Exclude acronyms/initialisms that are handled by separate logic in the G2P model.
    if (/^([A-Z]\\.?){2,8}$/.test(word)) return false;
    
    // Rule 4: Exclude words without standard vowels (a,e,i,o,u), which cannot be phonemized by normal rules.
    const VOWELS_AEIOU = new Set("aeiou".split(""));
    if (![...word.toLowerCase()].some(char => VOWELS_AEIOU.has(char))) return false;

    return true;
  });
  console.log(`Filtered down to ${testableWords.length} testable words (excluding long words & abbreviations).`);


  let strictCorrect = 0;
  let lenientCorrect = 0;
  const total = testableWords.length;

  const mismatches: Array<{word: string, expected: string, predicted: string, distance: number}> = [];
  const allDistances: number[] = [];

  console.log(`Evaluating ${total} testable words from the dictionary...`);

  for (const word of testableWords) {
    const expectedPron = (dictionary as Record<string, string>)[word];
    if (!expectedPron) continue;

    // Force rule-based prediction
    const predictedPron = g2p.predict(word, 'en');

    const normExpected = normalizePhonemes(expectedPron);
    const normPredicted = normalizePhonemes(predictedPron || '');

    if (normExpected === normPredicted) {
      strictCorrect++;
      lenientCorrect++;
      allDistances.push(0);
    } else {
        // For lenient check, we first canonize the phonemes to account for stylistic differences.
        const canonExpected = canonizePhonemeString(normExpected);
        const canonPredicted = canonizePhonemeString(normPredicted);
        const distance = levenshtein.get(canonExpected, canonPredicted);
        allDistances.push(distance);
        
        if (distance <= 1) {
            lenientCorrect++;
        }

        // The mismatch report will show the original distance for transparency.
        mismatches.push({
            word,
            expected: expectedPron,
            predicted: predictedPron || '',
            distance: levenshtein.get(normExpected, normPredicted),
        });
    }
  }

  // Sort mismatches by distance to see the worst offenders first
  mismatches.sort((a, b) => b.distance - a.distance);

  const strictAccuracy = (strictCorrect / total) * 100;
  const lenientAccuracy = (lenientCorrect / total) * 100;

  // Calculate error metrics
  const sumOfDistances = allDistances.reduce((acc, dist) => acc + dist, 0);
  const averageDistance = sumOfDistances / total;

  allDistances.sort((a, b) => a - b);
  const mid = Math.floor(total / 2);
  const medianDistance = total % 2 !== 0 ? allDistances[mid] : (allDistances[mid - 1] + allDistances[mid]) / 2;

  let baseline: Baseline | null = null;
  if (fs.existsSync(BASELINE_PATH)) {
    try { baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')); } catch { /* ignore */ }
  }

  const delta = (now: number, prev: number | undefined, higherIsBetter = true) => {
    if (prev === undefined) return '';
    const d = now - prev;
    if (Math.abs(d) < 0.005) return '';
    const sign = d > 0 ? '+' : '';
    const arrow = higherIsBetter ? (d > 0 ? ' ↑' : ' ↓') : (d < 0 ? ' ↑' : ' ↓');
    return ` (${sign}${d.toFixed(2)}${arrow})`;
  };

  console.log(`\n--- G2P Rule-based Evaluation Results ---`);
  if (baseline) console.log(`    baseline: ${baseline.date}`);
  console.log(`Total words evaluated: ${total}`);
  console.log(`\nStrict Accuracy (exact match after stress removal):`);
  console.log(`  - Correct: ${strictCorrect}`);
  console.log(`  - Accuracy: ${strictAccuracy.toFixed(2)}%${delta(strictAccuracy, baseline?.strictAccuracy)}`);

  console.log(`\nLenient Accuracy (allowing Levenshtein distance <= 1):`);
  console.log(`  - Correct: ${lenientCorrect}`);
  console.log(`  - Accuracy: ${lenientAccuracy.toFixed(2)}%${delta(lenientAccuracy, baseline?.lenientAccuracy)}`);

  console.log(`\nError distance metrics (Levenshtein):`);
  console.log(`  - Average Distance: ${averageDistance.toFixed(2)}${delta(averageDistance, baseline?.averageDistance, false)}`);
  console.log(`  - Median Distance: ${medianDistance.toFixed(2)}${delta(medianDistance, baseline?.medianDistance, false)}`);


  if (mismatches.length > 0) {
    const reportPath = 'g2p-mismatches-report.txt';
    let reportContent = `G2P Rule-based Mismatch Report\n`;
    reportContent += `=====================================\n`;
    reportContent += `Excluding words longer than ${MAX_WORD_LENGTH} characters and detected abbreviations.\n\n`;
    reportContent += `Overall Accuracy:\n`;
    reportContent += `  - Strict Accuracy: ${strictAccuracy.toFixed(2)}%\n`;
    reportContent += `  - Lenient Accuracy (dist <= 1): ${lenientAccuracy.toFixed(2)}%\n`;
    reportContent += `Error Distance Metrics (Levenshtein):\n`;
    reportContent += `  - Average Distance: ${averageDistance.toFixed(2)}\n`;
    reportContent += `  - Median Distance: ${medianDistance.toFixed(2)}\n\n`;
    reportContent += `All Mismatches (sorted by Levenshtein distance):\n\n`;
    
    mismatches.forEach(m => {
        reportContent += `Word: "${m.word}" (Distance: ${m.distance})\n`;
        reportContent += `  - Expected:  ${m.expected}\n`;
        reportContent += `  - Predicted: ${m.predicted}\n\n`;
    });

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nFull mismatch report for the top 100 errors saved to: ${reportPath}`);
    if (cliArgs.cluster) clusterFailures(mismatches, g2p);
  }

  if (cliArgs.updateBaseline) {
    const b: Baseline = {
      date: new Date().toISOString().slice(0, 10),
      strictAccuracy,
      lenientAccuracy,
      averageDistance,
      medianDistance,
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(b, null, 2) + '\n');
    console.log(`\nBaseline saved to ${BASELINE_PATH}`);
  }
}

evaluate().catch(console.error); 