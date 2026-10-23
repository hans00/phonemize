/**
 * Correct IPA-Dict's regular -ed allomorph and casual stem-stop deletions.
 * Cambridge specifies /ɪd/ after /t/ and /d/; some entries use /əd/ or omit
 * the written /t/ before syllabic /ɪd/ or /ɪŋ/.
 */
export function normalizeRegularEdAllomorph(word: string, ipa: string): string {
  const ending = /([td])ed$/i.exec(word);
  if (!ending) return ipa;

  // IPA-Dict also has a few careful-vs-casual omissions of the stem-final
  // /t/ in -nted words whose transcriptions already use /ɪd/ (mounted,
  // hinted, jointed, prevented, segmented). Restore the written /t/ even
  // when the allomorph itself is already correct.
  if (/nted$/i.test(word) && /ɪd$/.test(ipa)) {
    const base = ipa.slice(0, -2);
    if (!base.replace(/[ˈˌ]$/, "").endsWith("t")) return `${base}tɪd`;
    return ipa;
  }
  if (!/əd$/.test(ipa)) return ipa;

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

/** Restore stem-final /t/ omitted from IPA-Dict's casual -nting variants. */
export function restoreNasalStopBeforeIng(word: string, ipa: string): string {
  if (!/nting$/i.test(word) || !/n[ɪə]ŋ$/.test(ipa)) return ipa;
  return ipa.replace(/n(?=[ɪə]ŋ$)/, "nt");
}
