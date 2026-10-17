import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";
// Cambridge: https://dictionary.cambridge.org/us/pronunciation/english/hymn
// Keep the nasal spelling available to the shared coda rules.
test.each([false, true])("keeps nasal codas after y (rules=%s)", disableDict => {
  const e = new EnglishG2P({ disableDict });
  const dictionary = { ...Reflect.get(e, "dictionary") };
  for (const w of ["hymn", "hymns", "hymned", "hymning"]) delete dictionary[w];
  Reflect.set(e, "dictionary", dictionary);
  for (const [word, ipa] of [["hymn", "ˈhɪm"], ["hymns", "ˈhɪmz"], ["hymned", "ˈhɪmd"], ["hymning", "ˈhɪmɪŋ"], ["gym", "ˈdʒɪm"], ["symbol", "ˈsɪmbəl"], ["cymbal", "ˈsɪmbəl"], ["nymph", "ˈnɪmf"], ["lynx", "ˈlɪŋks"]]) {
    expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
  }
  const api = createPhonemizer({ processors: [e] });
  for (const sentence of ["The hymn was short.", "They hymn the dawn.", "The short hymn ended."]) {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "hymn")?.phoneme.replace(/[ˈˌ]/g, "")).toBe("hɪm");
  }
});
test("preserves caller nasal codas and lexical derivations", () => {
  const e = new EnglishG2P();
  expect(parseIpa(e.predict("hymnal")!)).toEqual(parseIpa("ˈhɪmnəl"));
  e.addPronunciation("hymn", "ˈhɪmn");
  expect(e.predict("hymn")).toBe("ˈhɪmn");
  expect(e.predict("hymns")).toBe("ˈhɪmnz");
});
