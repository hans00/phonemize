import EnglishG2P from "../src/en/g2p";
import { isWeakAMineRoot } from "../src/en/syllabify";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("posttonic a + mine (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const access = engine as unknown as { dictionary: Record<string, string> };
  access.dictionary = { ...access.dictionary };
  delete access.dictionary.examine;

  it("retains KIT after the parent exception is removed", () => {
    expect(engine.predict("examine")).toBe("ɪɡˈzæmɪn");
  });
  it.each([
    ["examines", disableDict ? "ɪɡˈzæmɪnz" : "ɪɡˈzæmənz"],
    ["examined", disableDict ? "ɪɡˈzæmɪnd" : "ɪɡˈzæmənd"],
    ["examining", "ɪɡˈzæmɪnɪŋ"],
    ["examiner", disableDict ? "ɪɡˈzæmɪnɝ" : "ɪɡˈzæmənɝ"],
    ["examiners", disableDict ? "ɪɡˈzæmənɝz" : "ɪɡˈzæmɪnɝz"],
    ["examinable", "ɪɡˈzæmɪnəbəɫ"],
  ])("preserves the frozen derived reading of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["carmine", disableDict ? "ˈkɑɹˌmaɪn" : "ˈkɑɹmən"],
    ["calamine", "ˈkæɫəˌmaɪn"], ["dopamine", "ˈdɑpəˌmaɪn"],
    ["histamine", disableDict ? "ˈhɪstəˌmaɪn" : "ˈhɪstəˌmin"],
    ["bromine", disableDict ? "ˈbɹoʊmaɪn" : "ˈbɹoʊˌmin"],
    ["landmine", "ˈɫændˌmaɪn"],
  ])("preserves the frozen dictionary/rule control for %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves caller-owned roots and their inflections", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("examine", "ɪɡˈzɛŋ");
    expect(custom.predict("examine")).toBe("ɪɡˈzɛŋ");
    expect(custom.predict("examining")).toBe("ɪɡˈzɛŋɪŋ");
    custom.addPronunciation("examining", "ˈkɛŋ");
    expect(custom.predict("examining")).toBe("ˈkɛŋ");
  });
  it("preserves noun, adjective and finite verb readings in a sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will examine the carpet.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["examine", "ɪɡˈzæmɪn"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["carpet", "ˈkɑɹpət"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});

it("keeps vowel teams outside the checked-a class", () => {
  expect(isWeakAMineRoot("examine")).toBe(true);
  expect(isWeakAMineRoot("monoamine")).toBe(false);
  expect(isWeakAMineRoot("thiamine")).toBe(false);
});
