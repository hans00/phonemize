/**
 * Universal English phonotactic post-processing.
 *
 * A small, principled set of rules that apply to *any* IPA output
 * regardless of which pipeline produced it. These are pure
 * phonological tweaks (not word-specific patches) that adjust the
 * surface form to match native phonology — happy-tensing, syllabic
 * consonants, etc.
 *
 * Distinct from the retired postBase pile (which was 500+ ad-hoc
 * if/replace rules for specific orthographic patterns). The rules
 * here have ≤10 entries and each one captures a universal pattern.
 *
 * Performance notes:
 *   - Every regex is module-level const so the engine caches its
 *     compilation.
 *   - Each rule is guarded by a cheap substring/endsWith check before
 *     the regex executes. The vast majority of IPA strings don't hit
 *     any given rule, so the guards skip the expensive scan.
 *   - dropSilentH short-circuits when there's no /h/ at all (avoids
 *     allocating a new string).
 */

// Vowel set as a string for cheap `.includes()` lookups — faster than
// Set.has() on the hot path because no hash + closure overhead.
// Includes ASCII a-u (which appear in some IPA composites like /eɪ/,
// /oʊ/, /aʊ/, /aɪ/, /ɔɪ/) AND the IPA vowels æ ɛ ɪ ɔ ʊ ʌ ə ɝ ɑ.
// ɑ (U+0251) is distinct from ASCII a (U+0061) — both must be present.
const VOWELS = "aeiouɑæɛɪɔʊʌəɝ";

// ─── Rule: word-initial /ɑɑ/ → /ɑ/ ────────────────────────────────────────
const INIT_AA_RE = /^([ˈˌ])?ɑɑ/;
function collapseInitialDoubleA(ipa: string): string {
  // Cheap pre-check: only fire when input could possibly start with ɑ
  // (allowing for an optional stress mark in front).
  const c0 = ipa.charCodeAt(0);
  // ɑ = U+0251 (0x251 = 593); ˈ = U+02C8 (712); ˌ = U+02CC (716).
  if (c0 !== 593 && c0 !== 712 && c0 !== 716) return ipa;
  return ipa.replace(INIT_AA_RE, "$1ɑ");
}

// ─── Rule: word-final /dt/ → /t/ ──────────────────────────────────────────
function simplifyDtFinal(ipa: string): string {
  const len = ipa.length;
  if (len < 2 || ipa.charCodeAt(len - 1) !== 116 /* 't' */) return ipa;
  if (ipa.charCodeAt(len - 2) !== 100 /* 'd' */) return ipa;
  return ipa.slice(0, len - 2) + "t";
}

// ─── Rule: past-tense /-əd/ allomorph ─────────────────────────────────────
// Voiced consonants (excluding t/d) and vowels that license -d (not -əd):
//   bdʒvzðmnŋɫlɹjɡ + all vowels (ASCII a-u + IPA ɑæɛɪɔʊʌəɝ).
const ED_VOICED_NON_TD = "bʒvzðmnŋɫlɹjɡɑæɛɪɔʊʌəɝaeiouy";
function fixPastTenseED(ipa: string): string {
  const len = ipa.length;
  if (len < 3) return ipa;
  // Cheap end-check before the slice comparison.
  if (ipa.charCodeAt(len - 1) !== 100 /* 'd' */) return ipa;
  if (ipa.charCodeAt(len - 2) !== 601 /* 'ə' (U+0259) */) return ipa;
  const prev = ipa[len - 3];
  if (prev === "t" || prev === "d") return ipa;
  if (ED_VOICED_NON_TD.indexOf(prev) < 0) return ipa;
  return ipa.slice(0, -2) + "d";
}

// ─── Rule: drop silent /h/ in non-initial consonant clusters ──────────────
function dropSilentH(ipa: string): string {
  // Fast path: no /h/ → return unchanged (no allocation).
  if (ipa.indexOf("h") < 0) return ipa;
  // Phonotactic fact: English /h/ only occurs immediately before a
  // vowel (onset position). Any /h/ NOT followed by a vowel is silent:
  //   - consonant clusters:  akhtar /ˈæktɝ/, hw→w (westernize)
  //   - post-vocalic coda:   behl /ˈbɛɫ/, ahn /ˈæn/
  //   - word-final after V:  borah /ˈbɔɹə/, beulah /ˈbjuɫə/
  // A stress mark after /h/ counts as "not a vowel" too — /h/ never
  // ends a syllable before the next syllable's onset.
  let out = "";
  let writeFrom = 0;
  for (let i = 0; i < ipa.length; i++) {
    if (ipa[i] !== "h") continue;
    const next = ipa[i + 1];
    const nextIsVowel = next !== undefined && VOWELS.indexOf(next) >= 0;
    if (!nextIsVowel) {
      out += ipa.slice(writeFrom, i);
      writeFrom = i + 1;
    }
  }
  if (writeFrom === 0) return ipa; // no drops
  return out + ipa.slice(writeFrom);
}

// ─── Rule: stressed schwa → STRUT vowel /ʌ/ ───────────────────────────────
// Pattern: stress mark + zero-or-more onset consonants + /ə/. The
// CMU dict's /ˈə/ is convention for what IPA writes as /ˈʌ/.
const STRESSED_SCHWA_RE = /([ˈˌ])([^aeiouɑæɛɪɔʊʌəɝˈˌ]*)ə/g;
function stressedSchwaToStrut(ipa: string): string {
  // Cheap pre-check: needs both a stress mark and a /ə/.
  if (ipa.indexOf("ˈ") < 0 && ipa.indexOf("ˌ") < 0) return ipa;
  if (ipa.indexOf("ə") < 0) return ipa;
  return ipa.replace(STRESSED_SCHWA_RE, "$1$2ʌ");
}

// ─── Rule: unstressed /ɪɹ/ → /ɝ/ ──────────────────────────────────────────
const RHOTIC_IR_RE = /ɪɹ/g;
function coalesceUnstressedIR(ipa: string): string {
  if (ipa.indexOf("ɪɹ") < 0) return ipa;
  return ipa.replace(RHOTIC_IR_RE, (_m, offset) => {
    // Walk back for nearest stress mark vs vowel. Stress mark before
    // any other vowel → this ɪ is stressed → don't coalesce.
    for (let i = (offset as number) - 1; i >= 0; i--) {
      const c = ipa[i];
      if (c === "ˈ" || c === "ˌ") return "ɪɹ";
      if (VOWELS.indexOf(c) >= 0) break;
    }
    return "ɝ";
  });
}

// ─── Rule: plural -ɪz after vowel/diphthong → -z ──────────────────────────
// When a word ends in a vowel + plural -s, the suffix surfaces as just
// /z/, not the syllabic /ɪz/ used after a sibilant. Rules emit the
// syllabic form for all -es:
//   echoes:     oʊɪz → oʊz
//   dominoes:   oʊɪz → oʊz
//   alkalies:   aɪɪz → aɪz
//   burrowes:   oʊɪz → oʊz
//
// Triggers on diphthongs (oʊ/aɪ/eɪ/ɔɪ/aʊ) + ɪz at word end.
const PLURAL_VZ_RE = /(oʊ|aɪ|eɪ|ɔɪ|aʊ)ɪz$/;
function simplifyPluralAfterVowel(ipa: string): string {
  if (!ipa.endsWith("ɪz")) return ipa;
  return ipa.replace(PLURAL_VZ_RE, "$1z");
}

// ─── Rule: weak-vowel merger in syllabic -es ──────────────────────────────
// The syllabic plural/3sg -es after a sibilant (s,z,ʃ,ʒ) surfaces with
// /ə/ in the dict 359:107 over /ɪ/ (ages dʒəz, clauses zəz, approaches
// tʃəz). Note: -ed is NOT converted — the dict prefers /ɪd/ there
// (697:316), so the merger only applies to -es. Anchored to word end.
const SYLLABIC_ES_RE = /([szʃʒ])ɪz$/;
function weakVowelInflection(ipa: string): string {
  if (ipa.endsWith("ɪz")) return ipa.replace(SYLLABIC_ES_RE, "$1əz");
  return ipa;
}

// ─── Rule: hiatus tensing — /ɪ/ before another vowel → /i/ ───────────────
// Word-internal /ɪV/ sequences (where V is any vowel other than ɪ itself)
// surface with tense /i/ in fluent speech:
//   abbreviate: ɪeɪt → ieɪt
//   curious:    ɪəs  → iəs
//   audio:      ɪoʊ  → ioʊ
//
// Guard: skip when the ɪ bears stress (a stress mark immediately
// precedes its onset). Stressed ɪ stays /ɪ/.
const HIATUS_IR_RE = /ɪ([aeiouɑæɛɔʊʌəɝ])/g;
const DIPHTHONG_PRE_I = "eaoɔ"; // chars that form a diphthong with ɪ (eɪ, aɪ, oɪ, ɔɪ)
function tenseHiatusI(ipa: string): string {
  if (ipa.indexOf("ɪ") < 0) return ipa;
  return ipa.replace(HIATUS_IR_RE, (match, next, offset) => {
    const pos = offset as number;
    // Skip when ɪ is the second half of a diphthong (eɪ, aɪ, oɪ, ɔɪ) —
    // the next char after ɪ is its trail-vowel partner of the NEXT
    // nucleus, not part of the same syllable.
    if (pos > 0 && DIPHTHONG_PRE_I.indexOf(ipa[pos - 1]) >= 0) return match;
    // Scan back for nearest stress mark vs vowel. Stress mark before
    // any other vowel → this ɪ is stressed → keep lax.
    for (let i = pos - 1; i >= 0; i--) {
      const c = ipa[i];
      if (c === "ˈ") return match;
      if (c === "ˌ") break;
      if (VOWELS.indexOf(c) >= 0) break;
    }
    return "i" + next;
  });
}

// ─── Rule: -ically schwa elision ──────────────────────────────────────────
const ICALLY_RE = /ɪkəɫi$/;
function elideIcallySchwa(ipa: string): string {
  // Cheap pre-check; the regex would also short-circuit but this avoids
  // the regex object allocation in V8's slow path.
  if (!ipa.endsWith("ɪkəɫi")) return ipa;
  return ipa.replace(ICALLY_RE, "ɪkɫi");
}

// ─── Rule: AmE /nt/-deletion after diphthong + unstressed V ──────────────
const NT_DELETE_RE = /(aʊ|eɪ|ɔɪ|aɪ|oʊ)nt([əɪi])/g;
function deleteIntervocalicNT(ipa: string): string {
  // Cheap pre-check: must contain "nt".
  if (ipa.indexOf("nt") < 0) return ipa;
  return ipa.replace(NT_DELETE_RE, "$1n$2");
}

// ─── Rule: initial secondary stress on long Latinate words ────────────────
function addInitialSecondary(ipa: string): string {
  const primaryAt = ipa.indexOf("ˈ");
  if (primaryAt < 0) return ipa;
  // Count nuclei before the primary mark. Bail early if a ˌ exists.
  let beforePrimary = 0;
  let inV = false;
  for (let i = 0; i < primaryAt; i++) {
    const c = ipa[i];
    if (c === "ˌ") return ipa;
    if (VOWELS.indexOf(c) >= 0) {
      if (!inV) {
        beforePrimary++;
        if (beforePrimary >= 2) {
          // We have enough nuclei; just scan the rest for an existing ˌ.
          // (We need to make sure no later ˌ exists either.) — actually
          // the original guarantee was "ˌ before primaryAt"; since we
          // exit the loop at primaryAt, that's already enforced.
        }
      }
      inV = true;
    } else if (c !== "ˈ") inV = false;
  }
  if (beforePrimary < 2) return ipa;
  // Find syllable-0 nucleus.
  let n0Start = -1;
  for (let i = 0; i < ipa.length; i++) {
    if (VOWELS.indexOf(ipa[i]) >= 0) { n0Start = i; break; }
  }
  if (n0Start < 0) return ipa;
  if (ipa[n0Start] === "ə") return ipa;
  // Walk back to the syllable's onset.
  let onset = n0Start;
  while (
    onset > 0 &&
    VOWELS.indexOf(ipa[onset - 1]) < 0 &&
    ipa[onset - 1] !== "ˈ" &&
    ipa[onset - 1] !== "ˌ"
  ) onset--;
  return ipa.slice(0, onset) + "ˌ" + ipa.slice(onset);
}

// ─── Rule: happy-tensing (word-final unstressed /ɪ/ → /i/) ────────────────
function applyHappyTensing(ipa: string): string {
  const len = ipa.length;
  if (len === 0 || ipa.charCodeAt(len - 1) !== 618 /* 'ɪ' (U+026A) */) return ipa;
  // Not part of a diphthong: previous char isn't e/a/o/ɔ.
  const prev = ipa[len - 2];
  if (prev && "eaoɔ".indexOf(prev) >= 0) return ipa;
  // Walk back to make sure ɪ isn't stressed.
  for (let i = len - 2; i >= 0; i--) {
    const c = ipa[i];
    if (c === "ˈ") return ipa;
    if (VOWELS.indexOf(c) >= 0) break;
  }
  return ipa.slice(0, len - 1) + "i";
}

/**
 * Apply the small phonotactic rule set in the canonical order. Each
 * rule self-guards with a cheap pre-check, so calls that don't trigger
 * any rule do roughly O(rule-count) substring scans + zero allocations.
 *
 * `_word` is currently unused but kept in the signature so future rules
 * can use orthographic context without a breaking change.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function applyPhonotactics(ipa: string, _word?: string): string {
  let cur = ipa;
  cur = collapseInitialDoubleA(cur);
  cur = simplifyDtFinal(cur);
  cur = fixPastTenseED(cur);
  cur = dropSilentH(cur);
  cur = stressedSchwaToStrut(cur);
  cur = coalesceUnstressedIR(cur);
  cur = tenseHiatusI(cur);
  cur = simplifyPluralAfterVowel(cur);
  cur = weakVowelInflection(cur);
  cur = elideIcallySchwa(cur);
  cur = deleteIntervocalicNT(cur);
  cur = addInitialSecondary(cur);
  cur = applyHappyTensing(cur);
  return cur;
}
