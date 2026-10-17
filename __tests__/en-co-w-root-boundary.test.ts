import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("co before vouched polysyllabic w roots, rules=%s", disableDict => {
  it("retains the root consonants after whole-target eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const word of ["coworker", "coworkers", "cowriter", "cowriters"]) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [["coworker", "koʊwɝkɝ"], ["coworkers", "koʊwɝkɝz"], ["cowriter", "koʊɹaɪtɝ"], ["cowriters", "koʊɹaɪtɝz"]] as const)
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toBe(ipa);
  });
  it("preserves ambiguous short co-w spellings and caller ownership", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("cowan")).toBe(disableDict ? "ˈkoʊən" : "ˈkaʊən");
    expect(engine.predict("cowart")).toBe(disableDict ? "ˈkoʊɑɹt" : "ˈkaʊɑɹt");
    const owner = new EnglishG2P({ disableDict });
    owner.addPronunciation("worker", "ˈzɛŋ");
    const dictionary = { ...Reflect.get(owner, "dictionary") };
    delete dictionary.coworker;
    Reflect.set(owner, "dictionary", dictionary);
    expect(owner.predict("coworker")).toBe("ˌkoʊˈzɛŋ");
    owner.addPronunciation("coworker", "ˈkɛŋ");
    expect(owner.predict("coworker")).toBe("ˈkɛŋ");
  });
  it("keeps the root in complete noun and finite verb sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ending] of [["The coworker records the song.", "coworker", /koʊwɝkɝ$/], ["The cowriter permits the change.", "cowriter", /koʊɹaɪtɝ$/]] as const)
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(ending);
  });
});
