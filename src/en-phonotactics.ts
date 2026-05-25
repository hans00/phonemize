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
 */

const VOWELS = new Set("aeiouæɛɪɔʊʌəɝ");

/**
 * Happy-tensing: word-final unstressed high front /ɪ/ realises as
 * tense /i/ (happy, city, abadi, valley). Applies when the IPA ends
 * with a single ɪ preceded by a consonant or stress mark — i.e.,
 * it's actually the nucleus of the final syllable, not the second
 * half of a diphthong (ai, oi, ei).
 */
function applyHappyTensing(ipa: string): string {
  if (!ipa.endsWith("ɪ")) return ipa;
  const len = ipa.length;
  // Must not be part of a diphthong (eɪ, aɪ, oɪ, ɔɪ).
  const prev = ipa[len - 2];
  if (prev && "eaoɔ".includes(prev)) return ipa;
  // The previous nucleus must not bear stress *immediately* before this
  // ɪ — that would make ɪ stressed, not "happy". This is approximated
  // by checking there's no ˈ in the trailing run.
  // Simpler: scan back for the nearest stress mark and ensure it's not
  // between this nucleus's onset and the nucleus itself.
  let i = len - 2;
  while (i >= 0 && !VOWELS.has(ipa[i])) {
    if (ipa[i] === "ˈ") return ipa; // stress mark right before ɪ → ɪ is stressed
    i--;
  }
  return ipa.slice(0, len - 1) + "i";
}

/**
 * Word-initial doubled "aa" (aardvark, aalseth, aachener, aaron):
 * rules tend to emit `ɑɑ` (two separate nuclei) but the actual
 * realisation is a single `ɑ`. Collapse the run.
 *
 * Triggered only if the input starts with a stress mark followed by
 * `ɑɑ` or the bare `ɑɑ` — i.e., word-initial position.
 */
function collapseInitialDoubleA(ipa: string): string {
  return ipa.replace(/^(ˈ|ˌ)?ɑɑ/, "$1ɑ");
}

/**
 * Cluster simplification at word boundaries:
 *   -dt$ → -t  (aamodt /ɑmət/, kupferschmidt-style names with silent d)
 *   -kt$ kept as-is (act, contact — d is voiced) — only apply when the
 *   /d/ would be redundant against a following voiceless stop with no
 *   semantic content. Conservative: only -dt where it's clearly a
 *   foreign-name pattern.
 */
function simplifyDtFinal(ipa: string): string {
  return ipa.replace(/dt$/, "t");
}

/**
 * Past-tense -ed allomorph: rules tend to emit /əd/ after every coda,
 * but English orthographic -ed only surfaces as /əd/ (syllabic) after
 * /t/ or /d/ (where the schwa is needed to break up the cluster). After
 * any other voiced consonant or vowel, it's just /d/. After voiceless
 * obstruents it's /t/ (handled separately by reduction rules).
 *
 * Concretely: `əd$` → `d` when preceded by a voiced non-coronal-stop
 * consonant or by a vowel.
 *   abridged: ˈbɹɪdʒəd → ˈbɹɪdʒd
 *   loved:    ˈɫəvəd  → ˈɫəvd
 *   rained:   ˈɹeɪnəd → ˈɹeɪnd
 *
 * Guard: don't touch when preceded by t or d (those legitimately need
 * the schwa) or by a voiceless obstruent (that's a /t/ allomorph
 * mismatch, separate rule).
 */
const ED_VOICED_NON_TD = /[bdʒvzðmnŋɫlɹjbɡæɛɪɔʊʌəɝaeiouy]/;
function fixPastTenseED(ipa: string): string {
  if (!ipa.endsWith("əd")) return ipa;
  const prev = ipa[ipa.length - 3];
  // Exclude t/d (need the schwa) and voiceless obstruents (need /t/).
  if (!prev) return ipa;
  if (prev === "t" || prev === "d") return ipa;
  if (!ED_VOICED_NON_TD.test(prev)) return ipa;
  return ipa.slice(0, -2) + "d";
}

/**
 * Add a secondary-stress mark to the word-initial nucleus of long
 * words when primary stress falls on the 3rd syllable or later.
 *
 * Many dict entries for long Latinate words (abbreviation, abrogation,
 * accommodation, …) carry a ˌ on syllable 0 even though our rules
 * only emit primary. Adding the secondary brings them closer to the
 * dict's surface form (and to natural English prosody, which often
 * gives long words a "rocking" stress pattern).
 *
 * Guards:
 *   - Word has ≥ 4 syllables.
 *   - Primary stress (ˈ) is on syllable 2 or later (0-indexed).
 *   - Syllable 0 doesn't already carry any stress mark.
 *   - Syllable 0's nucleus isn't a reduced schwa (ə) — adding stress
 *     to a schwa would be incoherent.
 */
function addInitialSecondary(ipa: string): string {
  const primaryAt = ipa.indexOf("ˈ");
  if (primaryAt < 0) return ipa;
  // Count nuclei before the primary mark.
  let beforePrimary = 0, inV = false;
  for (let i = 0; i < primaryAt; i++) {
    const c = ipa[i];
    if (c === "ˌ") return ipa; // already has a secondary
    if (VOWELS.has(c)) { if (!inV) beforePrimary++; inV = true; }
    else if (c !== "ˈ") inV = false;
  }
  if (beforePrimary < 2) return ipa;
  // Find syllable-0 nucleus position.
  let n0Start = -1;
  for (let i = 0; i < ipa.length; i++) {
    if (VOWELS.has(ipa[i])) { n0Start = i; break; }
  }
  if (n0Start < 0) return ipa;
  if (ipa[n0Start] === "ə") return ipa; // don't stress schwa
  // Walk back to the syllable's onset (first non-vowel run before n0Start).
  let onset = n0Start;
  while (onset > 0 && !VOWELS.has(ipa[onset - 1]) && ipa[onset - 1] !== "ˈ" && ipa[onset - 1] !== "ˌ") onset--;
  return ipa.slice(0, onset) + "ˌ" + ipa.slice(onset);
}

/**
 * Silent /h/ in consonant clusters. Rules emit /h/ wherever orthographic
 * "h" appears, but in many foreign-loanword clusters the h is silent
 * (akhtar, exhaust, dahlia). When /h/ sits between two non-vowel,
 * non-stress-mark segments, drop it.
 *
 * Doesn't touch:
 *   - Word-initial h (he, hello, hand) — not in a cluster.
 *   - Intervocalic h (behold, ahead) — h between vowels stays.
 *   - h preceded by a stress mark (stress mark resets cluster status).
 */
function dropSilentH(ipa: string): string {
  let out = "";
  for (let i = 0; i < ipa.length; i++) {
    if (ipa[i] !== "h") { out += ipa[i]; continue; }
    const prev = ipa[i - 1];
    const next = ipa[i + 1];
    const prevIsCluster = prev && !VOWELS.has(prev) && prev !== "ˈ" && prev !== "ˌ";
    const nextIsCluster = next && !VOWELS.has(next) && next !== "ˈ" && next !== "ˌ";
    if (prevIsCluster && nextIsCluster) continue; // drop
    out += ipa[i];
  }
  return out;
}

/**
 * Unstressed /ɪɹ/ → /ɝ/ coalescence. Across hundreds of dict entries
 * (afferent, anderegg, ampere, aileron, …) an unstressed /ɪ/ followed
 * by /ɹ/ surfaces as the single rhotic-vowel segment /ɝ/. Our rules
 * emit /ɪɹ/ because they treat the spelling as two separate segments.
 *
 * Don't fire when /ɪ/ is stressed (the ɹ is part of a separate
 * syllable's onset there) — checked by scanning back for ˈ/ˌ before
 * any vowel.
 */
const RHOTIC_IR_RE = /ɪɹ/g;
function coalesceUnstressedIR(ipa: string): string {
  return ipa.replace(RHOTIC_IR_RE, (_m, offset) => {
    // Walk backward to find the most recent stress mark or vowel; if
    // we hit ˈ/ˌ before any other vowel, this ɪ is stressed → leave it.
    for (let i = (offset as number) - 1; i >= 0; i--) {
      const c = ipa[i];
      if (c === "ˈ" || c === "ˌ") return "ɪɹ"; // stressed
      if (VOWELS.has(c)) break; // hit another vowel; ours is unstressed
    }
    return "ɝ";
  });
}

/**
 * Apply the small phonotactic rule set:
 *   1. Initial "aa" collapse.
 *   2. Final "dt" cluster simplification.
 *   3. Past-tense -ed allomorph correction.
 *   4. Drop silent /h/ inside consonant clusters.
 *   5. Unstressed /ɪɹ/ → /ɝ/ rhotic coalescence.
 *   6. Initial secondary stress on long Latinate words.
 *   7. Happy-tensing on word-final /ɪ/.
 *
 * `word` is currently unused but kept in the signature so future rules
 * can use orthographic context without a breaking change.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function applyPhonotactics(ipa: string, _word?: string): string {
  let cur = ipa;
  cur = collapseInitialDoubleA(cur);
  cur = simplifyDtFinal(cur);
  cur = fixPastTenseED(cur);
  cur = dropSilentH(cur);
  cur = coalesceUnstressedIR(cur);
  cur = addInitialSecondary(cur);
  cur = applyHappyTensing(cur);
  return cur;
}
