import { IPA_TO_ARPABET, IPA_TO_STRESS } from "./consts";

export function ipaToArpabet(ipa: string): string {
  let arpabet = "";
  let stress = "";
  for (let i = 0; i < ipa.length; i++) {
    const char = ipa[i];
    if (IPA_TO_STRESS[char]) {
      stress = IPA_TO_STRESS[char];
      continue;
    }
    if (IPA_TO_ARPABET[ipa.substring(i, i + 2)]) {
      if (arpabet) arpabet += " ";
      arpabet += IPA_TO_ARPABET[ipa.substring(i, i + 2)] + stress;
      stress = "";
      i++;
    } else {
      if (arpabet) arpabet += " ";
      arpabet += IPA_TO_ARPABET[char] + stress;
      stress = "";
    }
  }
  return arpabet;
}
