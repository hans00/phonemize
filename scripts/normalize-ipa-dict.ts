/**
 * Correct the IPA-Dict vowel for the syllabic regular -ed allomorph.
 * Cambridge's pronunciation guide specifies /ɪd/ after /t/ and /d/. A set
 * of dictionary rows instead uses /əd/ in forms spelled -ted/-ded; the
 * shared spelling class and rule-path readings consistently support /ɪd/.
 */
export function normalizeRegularEdAllomorph(word: string, ipa: string): string {
  const ending = /([td])ed$/i.exec(word);
  if (!ending || !/əd$/.test(ipa)) return ipa;

  // Closed lightheaded/muddleheaded compounds have independent Cambridge
  // readings; keep their attested weak ending instead of treating the whole
  // spelling as a regular past/participle form.
  if (/headed$/i.test(word) && !/^headed$/i.test(word)) return ipa;

  // A few IPA-Dict rows also omit the written root-final stop (counted,
  // granted, printed). Restore that stop when the spelling proves the
  // suffix boundary; /tɪd/ or /dɪd/ is the standard syllabic allomorph.
  const base = ipa.slice(0, -2);
  const consonant = ending[1].toLowerCase();
  const restoredBase = base.replace(/[ˈˌ]$/, "")
    .endsWith(consonant) ? base : `${base}${consonant}`;
  return `${restoredBase}ɪd`;
}
