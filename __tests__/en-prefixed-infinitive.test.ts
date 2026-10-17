import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const cases: Array<[string, string, string]> = [
  ["They plan to re-invite Nakano.", "invite", "ˌɪnˈvaɪt"],
  ["They plan to re-record music.", "record", "ɹɪˈkɔɹd"],
  ["They plan to re-read the book.", "read", "ɹid"],
  ["They plan to re-wound the tissue.", "wound", "wund"],
  ["They tried to wound the tissue.", "wound", "wund"],
  ["The guide refers to re-use of equipment.", "use", "jus"],
  ["They discussed the re-record.", "record", "ˈɹɛkɝd"],
  ["They have wound care supplies.", "wound", "wund"],
  ["He wound the clock yesterday.", "wound", "waʊnd"],
];
it.each(cases)("keeps an infinitive and its nominal/past controls: %s", (text, word, ipa) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
describe.each([false, true])("vouched verbal bases own morphology (rules=%s)", disableDict => {
  it("owns regular inflections and a new agent without a child exception", () => {
    const e = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(e, "dictionary") };
    for (const word of ["wounded", "wounding"]) delete dictionary[word];
    Reflect.set(e, "dictionary", dictionary);
    expect(e.predict("wounded")).toBe("ˈwundɪd");
    expect(e.predict("wounding")).toBe("ˈwundɪŋ");
    expect(e.predict("wounder")).toBe("ˈwundɝ");
    e.addPronunciation("wound", "ˈzɛŋ");
    expect(e.predict("wounded")).toBe("ˈzɛŋd");
    expect(e.predict("wounding")).toBe("ˈzɛŋɪŋ");
    expect(e.predict("wounder")).toBe("ˈzɛŋɝ");
    e.addPronunciation("wounding", "ˈkɛŋ");
    expect(e.predict("wounding")).toBe("ˈkɛŋ");
  });
});
