// One shared composition function for every STRESS_NEUTRAL_ROWS suffix
// (see morph-table.ts), replacing what used to be g2p.ts's
// `for (const [sfx, ipa] of [...])` loop for those rows (see
// tryMorphologicalAnalysis, whose surviving loop now covers only -al
// and -ular, which need bespoke stem-recovery/forced-stress logic this
// function doesn't attempt). The original extraction preserved that
// inline loop's behaviour; later rows have their own callback guards and
// pronunciation gates. The extraction itself was not an accuracy gain:
// the original suffix families were already predicted
// well: dict-wide "bypass to plain rules" tests on every one of these
// suffixes came back strongly net-negative (-ment 12:119, -ness 6:173,
// -less 0:64, -ful 4:41, -ism 2:150, -ist 23:94, -ize 29:72 against
// bypassing the handlers; -cial/-tial 10:8 and -ual 5:2 marginal; the
// -ed ɪd→əd allomorph 204:524 again rejected) — the existing handler
// logic is already close to the accuracy ceiling for this population.
//
// softenBaseFinal/preSuffixReduce live here (not g2p.ts) because they're
// this module's own composition primitives, needed by both the table
// path below and g2p.ts's surviving -al/-ular loop; g2p.ts imports them
// from here rather than the reverse, so there's no import cycle between
// the two files.
//
// The caller restricts neutral -ary to complete -ion roots; other -ary
// spellings stay in their stress-sensitive whole-word frame.
//
// Stem attestation: `predictStem` delegates to g2p.ts's `stemPron` (lex(b) ||
// rule-predict b as literally spelled, gated off the French silent-e
// "-cre/-tre/-bre" shape a suffix-stripped fabricated stem can
// coincidentally match — see stemPron's own comment in g2p.ts).
// The callback also receives the suffix and its IPA so an unknown
// bound stem can be rendered with its suffix in view; lexical roots
// retain their supplied readings. The caller owns spelling restoration
// (e.g. adjective y before -hood); composition here is shared. -al/
// -ular (doubled-consonant undo, magic-e restoration, forced-stress
// rendering) are NOT in this table.
import { STRESS_NEUTRAL_ROWS } from "./morph-table";

// The vowel before an unstressed Latinate ending is the slot the suffix
// reduces (anim+al, crimin+al, capit+al, condi+ment), but the suffix
// handlers price the base without the suffix in view, so its last /ɪ/
// stays full — the same join problem the -ily/-ibly adverbs have. On the
// frame below data/en/dict.json has 78 ə : 22 ɪ, and 9 : 1 over the
// top-5000 slice; the rule path reaches it in `syllableToIPA`.
// Weak -im/-il before -ize reduces too (minimize/optimize/utilize):
// frozen full-dict strict +6/-0, lenient +1/-0. Other consonants and
// ordinary -ic/-ive bases retain their supplied vowels.
const PRE_SUFFIX_ORTHO_RE = /(?:i[tnmp](?:als?|ous|ants?|ents?)|i[lm]ize)$/;
export const preSuffixReduce = (ipa: string, word: string): string =>
  PRE_SUFFIX_ORTHO_RE.test(word)
    ? ipa.replace(/(?<![eaɔ])ɪ(?=[^ɑɔæɛɪiʊuʌəɝɚ]*$)/, "ə")
    : ipa;

// A front-vowel-initial suffix softens the base's final <c>/<g>
// (allerg+ist dʒ 62:4, critic+ize s). Priced alone the base ends the
// letter word-finally, where it always reads hard, so the suffix
// handlers have to put the softening back. Doubled gg/cc stays hard
// (druggist).
export function softenBaseFinal(ipa: string, base: string, sfx: string): string {
  // A syllabic final m loses its weak nucleus before a vowel suffix
  // (abysm + al, baptism + al); consonant-initial endings keep it.
  if (/sm$/.test(base) && /^[aeiouy]/.test(sfx)) ipa = ipa.replace(/zəm$/, "zm");
  if (!/^[eiy]/.test(sfx) || sfx === "ish") return ipa;
  if (/(?:^|[^g])g$/.test(base)) return ipa.replace(/ɡ$/, "dʒ");
  // A final sc cluster coalesces when the front suffix softens c.
  // This repairs the composition boundary, not consonants inside a stem.
  if (/(?:^|[^c])c$/.test(base)) return ipa.replace(/k$/, "s").replace(/ss$/, "ʃ");
  return ipa;
}

export function tryStressNeutralSuffix(
  lowerWord: string,
  predictStem: (stem: string, suffix: string, suffixIpa: string) => string | undefined,
): string | undefined {
  for (const { suffix, ipa } of STRESS_NEUTRAL_ROWS) {
    if (!lowerWord.endsWith(suffix) || lowerWord.length <= suffix.length + (suffix === "ify" ? 1 : 2)) continue;
    const stem = lowerWord.slice(0, -suffix.length);
    const stemPron = predictStem(stem, suffix, ipa);
    if (!stemPron) continue;
    return softenBaseFinal(preSuffixReduce(stemPron, lowerWord), stem, suffix) + ipa;
  }
  return undefined;
}

// Preserve a vouched root's still-weak nucleus after derivational stress moves.
// Alignment tolerates only front-lax vowel/lateral notation differences; it
// never copies into an accented nucleus, diphthong, hiatus or different root.
export function preservePretonicSchwa(ipa: string, inherited: string): string {
  const bare = inherited.replace(/[ˈˌ]/g, ""), normalize = (s: string): string => s.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l").replace(/[əɛɪ]/g, "ə"), primary = ipa.indexOf("ˈ");
  if (primary < 0 || normalize(ipa) !== normalize(inherited)) return ipa;
  let index = 0;
  return ipa.replace(/[^ˈˌ]/g, (phone: string, offset: number) =>
    bare[index++] === "ə" && offset < primary && /[ɛɪ]/.test(phone) && !/[ˈˌ][^aeiouyɑɔæɛɪʊʌəɝɚɜɒ]*$/.test(ipa.slice(0, offset)) && !/[aeiouyɑɔæɛɪʊʌəɝɚɜɒ]/.test((ipa[offset - 1] ?? "") + (ipa[offset + 1] ?? "")) ? "ə" : phone);
}

// Align an -ary base with -arian before copying only its pretonic diphthongs.
export function preserveAryDiphthongs(ipa: string, inherited: string): string {
  const tokens = (s: string): string[] => s.replace(/[ˈˌ]/g, "").replace(/ɝ/g, "əɹ").match(/aɪ|aʊ|eɪ|oʊ|ɔɪ|./g) ?? [];
  const vowel = /^(?:[aeiouɑɔæɛɪʊʌəɚ]|aɪ|aʊ|eɪ|oʊ|ɔɪ)$/, base = tokens(inherited), derived = tokens(ipa), vowels = base.filter(p => vowel.test(p));
  const consonants = (ps: string[]): string => ps.filter(p => !vowel.test(p)).join("").replace(/ɫ/g, "l");
  if (consonants(base) !== consonants(derived).replace(/n$/, "") || derived.filter(p => vowel.test(p)).length !== vowels.length + 1) return ipa;
  let index = 0;
  return ipa.replace(/aɪ|aʊ|eɪ|oʊ|ɔɪ|[aeiouɑɔæɛɪʊʌəɝɚ]/g, (phone: string, offset: number) => {
    const prior = vowels[index++];
    return offset < ipa.indexOf("ˈ") && /^(?:aɪ|aʊ|eɪ|oʊ|ɔɪ)$/.test(prior ?? "") && /^[ɪə]$/.test(phone) ? prior : phone;
  });
}
