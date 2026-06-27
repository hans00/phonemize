/**
 * English suffix table (P2.0 of G2P redesign).
 *
 * Each entry describes one productive English suffix: its orthography,
 * its IPA realization, its stress-shift class, and whether it triggers
 * vowel reduction in the base. The decomposer uses this to peel a word
 * down to its base, the stress FSM uses the class to re-place stress,
 * and the reduction rules use the trigger flag to decide whether
 * unstressed base vowels collapse.
 *
 * Stress classes follow Chomsky-Halle / Hayes:
 *   - "neutral":  base stress preserved; suffix unstressed.
 *                 Germanic suffixes: -ness, -less, -ly, -ed, -ing, …
 *   - "pre":      stress on syllable immediately before suffix.
 *                 Latinate Class-I suffixes: -ity, -tion, -ic, -ial, …
 *   - "pre2":     stress on syllable two before suffix.
 *                 -ative, -atory, -ical (in some cases)
 *   - "self":     suffix bears primary stress.
 *                 -ee, -eer, -ese, -ette, -oon, -aire
 *
 * The reduction flag defaults from class: pre/pre2/self reduce, neutral
 * does not. Override only for known irregulars.
 *
 * Order in SUFFIXES matters only for the decomposer's longest-match
 * heuristic; the table is indexed by length at module load.
 */

/**
 * Stress class — positional, measured from the end of the word:
 *
 *   - "neutral":     inherit base stress (suffix doesn't alter it).
 *                    Germanic Class-II suffixes: -ness, -less, -ly, -ed, -ing, …
 *   - "penult":      primary stress on penultimate syllable of the whole word.
 *                    Class-I: -ation, -ition, -ic, -ous, -al, -ant/-ent,
 *                    -ization, -tion, -sion, -ial.
 *   - "antepenult":  primary stress on antepenultimate (3rd-from-end).
 *                    Class-I: -ity, -ical, -ative, -ology, -ability, -ological.
 *   - "final":       primary stress on the last syllable.
 *                    Self-stressing: -ee, -eer, -ese, -ette, -oon, -aire.
 *
 * This single positional view replaces the older "pre/pre2/first/self"
 * vocabulary, which was relative to the suffix's start position and turned
 * out to overlap depending on suffix syllable count. Position-from-end is
 * both simpler and matches the underlying Latin penult/antepenult rule.
 */
export type StressClass = "neutral" | "penult" | "antepenult" | "final";

export interface SuffixEntry {
  /** Orthographic suffix matched at word end. */
  suffix: string;
  /** Phoneme realization (no stress marks; stress comes from class). */
  ipa: string;
  /** Stress-shift class. */
  stress: StressClass;
  /** Whether the base undergoes vowel reduction; default by class. */
  reduces?: boolean;
  /** Minimum base length required after stripping; guards over-stripping. */
  minBase?: number;
  /** Base recovery: undo orthographic mutation. e.g. -iness ← -y + -ness. */
  recover?: { strip: string; add: string };
  /** Optional alternative base spellings to also try (e.g., "abat" → "abate"). */
  baseAlts?: string[];
  /** Optional context guard: regex matched against the base after stripping. */
  baseGuard?: RegExp;
  /** Phoneme-level allomorphs that may also realize this suffix. Caller
   *  picks the one matching the actual IPA tail. Used for -s/-ed allomorphy. */
  ipaAlts?: string[];
}

// Ordered loosely from longest/most-specific to shortest. The decomposer
// iterates and picks the longest matching suffix that satisfies baseGuard
// and minBase, so order within a length class doesn't matter — but keeping
// it readable helps maintenance.
export const SUFFIXES: SuffixEntry[] = [
  // ─── Class I (Latinate) — penult-stressing ────────────────────────────────
  // Stress falls on the word's penultimate syllable (which often coincides
  // with the first vowel of a multi-syl suffix like -ation or -ization).
  { suffix: "ization", ipa: "ɪzeɪʃən", stress: "penult", minBase: 3 },
  { suffix: "isation", ipa: "ɪzeɪʃən", stress: "penult", minBase: 3 },
  { suffix: "ifications", ipa: "ɪfɪkeɪʃənz", stress: "penult", minBase: 3 },
  { suffix: "ification", ipa: "ɪfɪkeɪʃən", stress: "penult", minBase: 3 },
  { suffix: "ations", ipa: "eɪʃənz", stress: "penult", minBase: 3 },
  { suffix: "ation", ipa: "eɪʃən", stress: "penult", minBase: 3 },
  { suffix: "itions", ipa: "ɪʃənz", stress: "penult", minBase: 3 },
  { suffix: "ition", ipa: "ɪʃən", stress: "penult", minBase: 3 },
  { suffix: "utions", ipa: "uʃənz", stress: "penult", minBase: 3 },
  { suffix: "ution", ipa: "uʃən", stress: "penult", minBase: 3 },
  { suffix: "otions", ipa: "oʊʃənz", stress: "penult", minBase: 3 },
  { suffix: "otion", ipa: "oʊʃən", stress: "penult", minBase: 3 },
  { suffix: "etions", ipa: "iʃənz", stress: "penult", minBase: 3 },
  { suffix: "etion", ipa: "iʃən", stress: "penult", minBase: 3 },
  { suffix: "ctions", ipa: "kʃənz", stress: "penult", minBase: 3 },
  { suffix: "ction", ipa: "kʃən", stress: "penult", minBase: 3 },
  { suffix: "tions", ipa: "ʃənz", stress: "penult", minBase: 3 },
  { suffix: "tion", ipa: "ʃən", stress: "penult", minBase: 3 },
  { suffix: "sions", ipa: "ʒənz", stress: "penult", minBase: 3 },
  { suffix: "sion", ipa: "ʒən", stress: "penult", minBase: 3 },
  { suffix: "cians", ipa: "ʃənz", stress: "penult", minBase: 3 },
  { suffix: "cian", ipa: "ʃən", stress: "penult", minBase: 3 },

  // ─── Class I (Latinate) — antepenult-stressing ────────────────────────────
  // -ity family: "ability" = əˈbɪlɪti (4 syl, stress syl 1 = antepenult)
  { suffix: "abilities", ipa: "əbɪlɪtiz", stress: "antepenult", minBase: 3 },
  { suffix: "ability", ipa: "əbɪlɪti", stress: "antepenult", minBase: 3 },
  { suffix: "ibilities", ipa: "əbɪlɪtiz", stress: "antepenult", minBase: 3 },
  { suffix: "ibility", ipa: "əbɪlɪti", stress: "antepenult", minBase: 3 },
  { suffix: "alities", ipa: "ælətiz", stress: "antepenult", minBase: 4 },
  { suffix: "ality", ipa: "æləti", stress: "antepenult", minBase: 4 },
  { suffix: "ivities", ipa: "ɪvətiz", stress: "antepenult", minBase: 4 },
  { suffix: "ivity", ipa: "ɪvəti", stress: "antepenult", minBase: 4 },
  { suffix: "osities", ipa: "ɑsətiz", stress: "antepenult", minBase: 4 },
  { suffix: "osity", ipa: "ɑsəti", stress: "antepenult", minBase: 4 },
  { suffix: "arities", ipa: "ɛɹətiz", stress: "antepenult", minBase: 4 },
  { suffix: "arity", ipa: "ɛɹəti", stress: "antepenult", minBase: 4 },
  { suffix: "orities", ipa: "ɔɹətiz", stress: "antepenult", minBase: 4 },
  { suffix: "ority", ipa: "ɔɹəti", stress: "antepenult", minBase: 4 },
  { suffix: "ities", ipa: "ətiz", stress: "antepenult", minBase: 3, ipaAlts: ["ɪtiz"] },
  { suffix: "ity", ipa: "əti", stress: "antepenult", minBase: 3, ipaAlts: ["ɪti"] },

  // -ic vs -ical: -ic is penult (a single-syl suffix); -ical antepenult.
  { suffix: "ically", ipa: "ɪkli", stress: "antepenult", minBase: 3 },
  { suffix: "icals", ipa: "ɪkəlz", stress: "antepenult", minBase: 3 },
  { suffix: "ical", ipa: "ɪkəl", stress: "antepenult", minBase: 3 },
  { suffix: "ics", ipa: "ɪks", stress: "penult", minBase: 3 },
  { suffix: "ic", ipa: "ɪk", stress: "penult", minBase: 3 },

  // -ial / -ious / -eous (penult for 1-syl realizations, antepenult for 2-syl)
  { suffix: "tial", ipa: "ʃəl", stress: "penult", minBase: 3 },
  { suffix: "cial", ipa: "ʃəl", stress: "penult", minBase: 3 },
  { suffix: "ial", ipa: "iəl", stress: "antepenult", minBase: 3 },
  { suffix: "cious", ipa: "ʃəs", stress: "penult", minBase: 3 },
  { suffix: "tious", ipa: "ʃəs", stress: "penult", minBase: 3 },
  { suffix: "geous", ipa: "dʒəs", stress: "penult", minBase: 3 },
  { suffix: "uous", ipa: "juəs", stress: "antepenult", minBase: 3 },
  { suffix: "ious", ipa: "iəs", stress: "antepenult", minBase: 3 },
  { suffix: "eous", ipa: "iəs", stress: "antepenult", minBase: 3 },

  // -ance/-ence/-ant/-ent (1-syl, penult-stressing)
  { suffix: "ances", ipa: "ənsɪz", stress: "penult", minBase: 3 },
  { suffix: "ance", ipa: "əns", stress: "penult", minBase: 3 },
  { suffix: "ences", ipa: "ənsɪz", stress: "penult", minBase: 3 },
  { suffix: "ence", ipa: "əns", stress: "penult", minBase: 3 },
  { suffix: "ants", ipa: "ənts", stress: "penult", minBase: 3 },
  { suffix: "ant", ipa: "ənt", stress: "penult", minBase: 3 },
  { suffix: "ents", ipa: "ənts", stress: "penult", minBase: 3 },
  { suffix: "ent", ipa: "ənt", stress: "penult", minBase: 3 },

  // -ative / -atory / -ology / -ography / -onomy: antepenult-stressing
  { suffix: "atively", ipa: "ətɪvli", stress: "antepenult", minBase: 3 },
  { suffix: "atives", ipa: "ətɪvz", stress: "antepenult", minBase: 3 },
  { suffix: "ative", ipa: "ətɪv", stress: "antepenult", minBase: 3 },
  { suffix: "atory", ipa: "ətɔɹi", stress: "antepenult", minBase: 3 },
  { suffix: "atories", ipa: "ətɔɹiz", stress: "antepenult", minBase: 3 },
  { suffix: "ologies", ipa: "ɑlədʒiz", stress: "antepenult", minBase: 3 },
  { suffix: "ology", ipa: "ɑlədʒi", stress: "antepenult", minBase: 3 },
  { suffix: "ologists", ipa: "ɑlədʒɪsts", stress: "antepenult", minBase: 3 },
  { suffix: "ologist", ipa: "ɑlədʒɪst", stress: "antepenult", minBase: 3 },
  { suffix: "ographies", ipa: "ɑɡɹəfiz", stress: "antepenult", minBase: 3 },
  { suffix: "ography", ipa: "ɑɡɹəfi", stress: "antepenult", minBase: 3 },
  { suffix: "onomies", ipa: "ɑnəmiz", stress: "antepenult", minBase: 3 },
  { suffix: "onomy", ipa: "ɑnəmi", stress: "antepenult", minBase: 3 },
  { suffix: "ological", ipa: "əlɑdʒɪkəl", stress: "antepenult", minBase: 3 },

  // ─── Self-stressing (final stress) ────────────────────────────────────────
  { suffix: "esque", ipa: "ɛsk", stress: "final", minBase: 3 },
  { suffix: "ettes", ipa: "ɛts", stress: "final", minBase: 3 },
  { suffix: "ette", ipa: "ɛt", stress: "final", minBase: 3 },
  { suffix: "eers", ipa: "ɪɹz", stress: "final", minBase: 3 },
  { suffix: "eer", ipa: "ɪɹ", stress: "final", minBase: 3 },
  { suffix: "ees", ipa: "iz", stress: "final", minBase: 3 },
  { suffix: "ee", ipa: "i", stress: "final", minBase: 3 },
  { suffix: "ese", ipa: "iz", stress: "final", minBase: 3 },
  { suffix: "aire", ipa: "ɛɹ", stress: "final", minBase: 3 },
  { suffix: "oons", ipa: "unz", stress: "final", minBase: 3 },
  { suffix: "oon", ipa: "un", stress: "final", minBase: 3 },

  // ─── Class II (Germanic / neutral): base stress preserved ─────────────────
  { suffix: "nesses", ipa: "nəsɪz", stress: "neutral", minBase: 3 },
  { suffix: "lessness", ipa: "ləsnəs", stress: "neutral", minBase: 3 },
  { suffix: "lessly", ipa: "ləsli", stress: "neutral", minBase: 3 },
  { suffix: "fulness", ipa: "fəlnəs", stress: "neutral", minBase: 3 },
  { suffix: "fully", ipa: "fəli", stress: "neutral", minBase: 3 },
  { suffix: "ingly", ipa: "ɪŋli", stress: "neutral", minBase: 3 },
  { suffix: "ness", ipa: "nəs", stress: "neutral", minBase: 3 },
  { suffix: "less", ipa: "ləs", stress: "neutral", minBase: 3 },
  { suffix: "ful", ipa: "fəl", stress: "neutral", minBase: 3 },
  { suffix: "ship", ipa: "ʃɪp", stress: "neutral", minBase: 3 },
  { suffix: "hood", ipa: "hʊd", stress: "neutral", minBase: 3 },
  { suffix: "dom", ipa: "dəm", stress: "neutral", minBase: 3 },
  { suffix: "ish", ipa: "ɪʃ", stress: "neutral", minBase: 3 },
  { suffix: "ments", ipa: "mənts", stress: "neutral", minBase: 3 },
  { suffix: "ment", ipa: "mənt", stress: "neutral", minBase: 3 },
  { suffix: "ism", ipa: "ɪzəm", stress: "neutral", minBase: 3 },
  { suffix: "isms", ipa: "ɪzəmz", stress: "neutral", minBase: 3 },
  { suffix: "ists", ipa: "ɪsts", stress: "neutral", minBase: 3 },
  { suffix: "ist", ipa: "ɪst", stress: "neutral", minBase: 3 },
  { suffix: "ward", ipa: "wɝd", stress: "neutral", minBase: 3 },
  { suffix: "wards", ipa: "wɝdz", stress: "neutral", minBase: 3 },
  { suffix: "wise", ipa: "waɪz", stress: "neutral", minBase: 3 },

  // -ly is highly productive but conflicts with many roots; require min length
  { suffix: "ly", ipa: "li", stress: "neutral", minBase: 4 },

  // Inflectional (always neutral). E-drop is undone via baseAlts.
  { suffix: "ings", ipa: "ɪŋz", stress: "neutral", minBase: 3 },
  { suffix: "ing", ipa: "ɪŋ", stress: "neutral", minBase: 3 },
  { suffix: "ied", ipa: "id", stress: "neutral", minBase: 3, recover: { strip: "", add: "y" }, ipaAlts: ["aɪd"] },
  { suffix: "ies", ipa: "iz", stress: "neutral", minBase: 3, recover: { strip: "", add: "y" }, ipaAlts: ["aɪz"] },
  { suffix: "ed", ipa: "d", stress: "neutral", minBase: 3, ipaAlts: ["t", "ɪd", "əd"] },
  { suffix: "est", ipa: "ɪst", stress: "neutral", minBase: 3, ipaAlts: ["əst"] },
  { suffix: "ers", ipa: "ɝz", stress: "neutral", minBase: 3 },
  { suffix: "er", ipa: "ɝ", stress: "neutral", minBase: 3 },     // agent / comparative
  { suffix: "es", ipa: "z", stress: "neutral", minBase: 3, ipaAlts: ["ɪz", "s"] },
  { suffix: "s", ipa: "z", stress: "neutral", minBase: 3, ipaAlts: ["s"] },

  // ─── -able / -ible (mostly neutral) ──────────────────────────────────────
  { suffix: "ably", ipa: "əbli", stress: "neutral", minBase: 3 },
  { suffix: "able", ipa: "əbəl", stress: "neutral", minBase: 3 },
  { suffix: "ibly", ipa: "əbli", stress: "neutral", minBase: 3 },
  { suffix: "ible", ipa: "əbəl", stress: "neutral", minBase: 3 },

  // ─── Verbalising suffixes — antepenult ────────────────────────────────────
  // -ize: "civilize" = ˈsɪvəlaɪz (3 syl, stress 0 = antepenult)
  { suffix: "izes", ipa: "aɪzɪz", stress: "antepenult", minBase: 3 },
  { suffix: "ized", ipa: "aɪzd", stress: "antepenult", minBase: 3 },
  { suffix: "izing", ipa: "aɪzɪŋ", stress: "antepenult", minBase: 3 },
  { suffix: "ize", ipa: "aɪz", stress: "antepenult", minBase: 3 },
  { suffix: "ises", ipa: "aɪzɪz", stress: "antepenult", minBase: 3 },
  { suffix: "ise", ipa: "aɪz", stress: "antepenult", minBase: 3 },
  { suffix: "ifies", ipa: "ɪfaɪz", stress: "antepenult", minBase: 3 },
  { suffix: "ified", ipa: "ɪfaɪd", stress: "antepenult", minBase: 3 },
  { suffix: "ify", ipa: "ɪfaɪ", stress: "antepenult", minBase: 3 },
  { suffix: "fies", ipa: "faɪz", stress: "antepenult", minBase: 3 },
  { suffix: "fied", ipa: "faɪd", stress: "antepenult", minBase: 3 },

  // -ous (penult: famous, dangerous, glorious)
  { suffix: "ously", ipa: "əsli", stress: "antepenult", minBase: 3 },
  { suffix: "ousness", ipa: "əsnəs", stress: "antepenult", minBase: 3 },
  { suffix: "ous", ipa: "əs", stress: "penult", minBase: 3 },
];

// Index for fast longest-match lookup
const BY_LEN: Map<number, SuffixEntry[]> = new Map();
{
  let maxLen = 0;
  for (const e of SUFFIXES) {
    maxLen = Math.max(maxLen, e.suffix.length);
    if (!BY_LEN.has(e.suffix.length)) BY_LEN.set(e.suffix.length, []);
    BY_LEN.get(e.suffix.length)!.push(e);
  }
}
const MAX_SUFFIX_LEN = Math.max(...Array.from(BY_LEN.keys()));

/**
 * Find the longest suffix entry matching the end of `word`. Returns the
 * primary base (after any orthographic recovery) plus a list of alternative
 * base spellings to try (e.g., for -ed/-ing also try base+"e", since
 * abated→abate dropped the final e). Caller can pick which alternative
 * resolves against a dictionary.
 *
 * Returns null if no entry matches under its minBase / baseGuard constraints.
 */
export function matchSuffix(
  word: string
): { entry: SuffixEntry; base: string; baseAlts: string[] } | null {
  for (let len = Math.min(MAX_SUFFIX_LEN, word.length - 1); len >= 1; len--) {
    const candidates = BY_LEN.get(len);
    if (!candidates) continue;
    const tail = word.slice(-len);
    for (const e of candidates) {
      if (e.suffix !== tail) continue;
      let base = word.slice(0, -len);
      if (e.recover) {
        if (base.endsWith(e.recover.strip)) {
          base = base.slice(0, base.length - e.recover.strip.length) + e.recover.add;
        } else if (e.recover.strip !== "") {
          continue;
        } else {
          base = base + e.recover.add;
        }
      }
      if (base.length < (e.minBase ?? 3)) continue;
      if (e.baseGuard && !e.baseGuard.test(base)) continue;

      const baseAlts: string[] = [];
      // E-drop recovery: many vowel-initial suffixes (-ed, -ing, -er, -ation,
      // -able, -ize, ...) attach to verbs that dropped a silent final e.
      // Try base+"e" so "abated"→"abate" resolves.
      if (/^[aeiouy]/.test(e.suffix) && !/[aeiouy]$/.test(base)) {
        baseAlts.push(base + "e");
      }
      // Consonant-doubling recovery: -ed/-ing on CVC verbs double the final
      // consonant (abet → abetted). Undo by stripping one of the doubled C.
      if (
        (e.suffix === "ed" || e.suffix === "ing" || e.suffix === "er" || e.suffix === "est") &&
        base.length >= 3 &&
        base[base.length - 1] === base[base.length - 2] &&
        !"aeiouy".includes(base[base.length - 1])
      ) {
        baseAlts.push(base.slice(0, -1));
      }
      // Latinate base restoration: -ation/-ition/-otion/-ution often attach
      // to -ate/-ite/-ote/-ute verbs whose final -e was elided.
      // -ction/-ption come from -ct/-pt + -ion.
      if (e.suffix === "ation" || e.suffix === "ations") baseAlts.push(base + "ate");
      else if (e.suffix === "ition" || e.suffix === "itions") baseAlts.push(base + "ite", base + "ish");
      else if (e.suffix === "otion" || e.suffix === "otions") baseAlts.push(base + "ote");
      else if (e.suffix === "ution" || e.suffix === "utions") baseAlts.push(base + "ute");
      else if (e.suffix === "ction" || e.suffix === "ctions") baseAlts.push(base + "ct");
      else if (e.suffix === "sion" || e.suffix === "sions") baseAlts.push(base + "se", base + "de", base + "d", base + "t");
      else if (e.suffix === "ity" || e.suffix === "ities") baseAlts.push(base + "e", base + "ate");
      return { entry: e, base, baseAlts };
    }
  }
  return null;
}

/**
 * Strip suffixes iteratively until no more match. Returns the chain of
 * (entry, intermediate base) and the final base.
 */
export interface DecompositionStep {
  entry: SuffixEntry;
  /** Word/base before this suffix is stripped. */
  before: string;
  /** Resulting base after stripping (input to the next iteration). */
  after: string;
  /** Alternative base spellings (e-drop / consonant doubling recovery). */
  afterAlts: string[];
}
export interface Decomposition {
  base: string;
  baseAlts: string[];
  steps: DecompositionStep[]; // outermost suffix first
}

export function decompose(word: string, maxDepth = 4): Decomposition {
  const steps: DecompositionStep[] = [];
  let cur = word;
  let curAlts: string[] = [];
  for (let depth = 0; depth < maxDepth; depth++) {
    const m = matchSuffix(cur);
    if (!m) break;
    steps.push({ entry: m.entry, before: cur, after: m.base, afterAlts: m.baseAlts });
    cur = m.base;
    curAlts = m.baseAlts;
  }
  return { base: cur, baseAlts: curAlts, steps };
}

/** Default reduction trigger by class. */
export function reduces(entry: SuffixEntry): boolean {
  if (entry.reduces !== undefined) return entry.reduces;
  return entry.stress !== "neutral";
}
