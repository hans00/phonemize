// A declarative bound-morph table for English's STRESS-NEUTRAL
// derivational suffixes: the stem keeps whatever stress it already has
// (Church 1986's "#"-boundary class — -ness, -less, -ful, -ment, -ist,
// -ism, -ize, -ify, and the Latinate -tual/-tuous/-ulate/-ulation/
// -ulator family), as opposed to a "+"-boundary suffix that shifts
// stress onto itself or the syllable before it (-ity, -ation, -ial,
// -ular — NOT covered by this table; those keep their existing
// bespoke handlers in g2p.ts, because each needs its own stress
// placement logic this table's "concatenate onto the stem" model
// can't express, and because dict-wide measurements (2026-09-30) found
// no clean, adoptable win from touching them).
//
// Each row is the [suffix, ipa] shape g2p.ts's own generic suffix loop
// used to carry inline (see tryMorphologicalAnalysis) — this table is
// the data for the subset of that loop's rows that need NO extra
// per-suffix logic beyond softenBaseFinal + preSuffixReduce (i.e.,
// excluding -al and -ular, which each carry additional bespoke
// stem-recovery/stress-forcing code in g2p.ts this table does not
// attempt to replicate — see AGENTS.md's 2026-09-30 note for the
// dict-wide bypass measurements that justify limiting the table to
// exactly this stress-neutral subset).
export interface MorphRow {
  suffix: string;
  ipa: string;
}

export const STRESS_NEUTRAL_ROWS: MorphRow[] = [
  ["ify", "əˌfaɪ"],
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
