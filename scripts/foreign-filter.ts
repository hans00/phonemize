/**
 * Foreign-origin word filter (mirrors scripts/mine-exceptions.ts
 * ORIGIN_RULES). Rules can't predict source-language phonology — these
 * belong in exceptions, not in the rule-engine target. Shared by
 * scripts/evaluate-strict.ts (excluded from its scored population) and
 * scripts/evaluate.ts's `--subset common` (the English-subset scoring
 * target excludes these too).
 */
const FOREIGN: RegExp[] = [
  /(wski|wska|cki|cka|czyk|czak|wicz)$/, /(cz|sz|rz|szcz)/,
  /(elli|etti|ozzi|ucci|ello|etto|ozzo|accia|aldo|otto|essa)$/,
  /(gli|gn[aeiou])/,
  /(eaux|aux|eau|oise|ois|aire|ette|elle|gne|ille|ique)$/,
  /(beau|deau|reau|teau|mont|jean)/,
  /(ez|os|illo|illa|ando|endo|ente)$/,
  /(rodriguez|gonzalez|hernandez|sanchez|gomez|santos)/,
  /(stein|berg|burg|mann|hoff|holz|brunn|heim|bach|wald|enstein)$/,
  /(sch|tsch|pf)/,
  /(ovich|evich|ovna|evna|insky|insk|ova|ev|ov|enko|sky)$/,
  /(opoulos|idis|akis|opolous|antos|aros)$/,
  /(ahmed|hamed|hussein|hassan|abdul|mohammed|mohamed)/,
  /^(mc|mac|o')/, /(ough|llwyd|gwyn|aoibh)/,
  /(tsuda|shima|moto|hara|yama|kawa|saki|naka|hashi|guchi|sato|suzuki|takaha)$/,
  /^(nguyen|tran|huynh|wang|chen|liu|zhang|kim|lee|park|choi)$/,
];
const NATIVE_OVERRIDE = /^(scratch|scheme|schedule|sch|school)$/;
export function isForeign(w: string): boolean {
  if (NATIVE_OVERRIDE.test(w)) return false;
  for (const p of FOREIGN) if (p.test(w) && w.length >= 5) return true;
  return false;
}
