// A declarative bound-morph table for English's STRESS-NEUTRAL
// derivational suffixes (including ary after an -ion root):
// the stem keeps whatever stress it already has
// (Church 1986's "#"-boundary class — -let, -like, -wise, -hood, -ness, -less, -ful, -ment, -ist,
// -ism, -ize, and the Latinate -tual/-tuous/-ulate/-ulation/
// -ulator family), as opposed to a "+"-boundary suffix that shifts
// stress onto itself or the syllable before it (-ity, -ation, -ial,
// -ular — NOT covered by this table; those keep their existing
// bespoke handlers in g2p.ts, because each needs its own stress
// placement logic this table's "concatenate onto the stem" model
// can't express, and because dict-wide measurements (2026-09-30) found
// no clean, adoptable win from touching them).
//
// Rows share the [suffix, ipa] shape of g2p.ts's original generic loop.
// Stem recovery and eligibility belong to the caller; composition uses
// softenBaseFinal + preSuffixReduce (i.e.,
// excluding -al and -ular, which each carry additional bespoke
// stem-recovery/stress-forcing code in g2p.ts this table does not
// attempt to replicate — see AGENTS.md's 2026-09-30 note for the
// dict-wide bypass measurements that justify limiting the table to
// exactly this stress-neutral subset).
// -ification transfers the actual -ify root into its stressed nominal suffix.
// -ify shares the suffix composition machinery; its callback establishes
// the antepenult stem frame and also allows two-letter bound stems.
export const STRESS_NEUTRAL_ROWS = [
  ["ie", "i"], ["let", "lət"],
  ["like", "ˌlaɪk"], ["wise", "ˌwaɪz"],
  ["hood", "ˌhʊd"], ["ify", "əˌfaɪ"],
  ["ary", "ɛɹi"], ["ous", "əs"],
  ["ish", "ɪʃ"],
  ["ification", "əfəˈkeɪʃən"],
  ["tual", "tʃuəl"],
  ["tuous", "tʃuəs"],
  ["ulation", "jəleɪʃən"],
  ["ulator", "jəleɪtɝ"],
  ["ulate", "jəleɪt"],
  ["ment", "mənt"],
  ["ness", "nəs"],
  ["less", "ləs"],
  ["ful", "fəl"],
  ["ize", "aɪz"],
  ["ist", "ɪst"],
  ["ism", "ɪzəm"],
].map(([suffix, ipa]) => ({ suffix, ipa }));
