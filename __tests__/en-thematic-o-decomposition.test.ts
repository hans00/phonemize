import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe.each([false, true])("technical -o composition (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  // Collins / Merriam-Webster retain the adjective root's primary stress.
  it.each([
    ["viscoelastic", "vɪskoʊɪˈlæstɪk"],
    ["picoelastic", "pikoʊɪˈlæstɪk"],
  ])("preserves combining vowels and root stress in %s", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });
  it("retains the noun suffix stress and closed head vowel", () => {
    const result = reading(engine.predict("viscoelasticity")!);
    expect(result.phones.slice(0, 5)).toEqual(["v", "ɪ", "s", "k", "oʊ"]);
    expect(result.primary).toBe(4);
  });
  it.each(["visco", "pico"])("preserves caller-supplied %s instead of re-rendering it", root => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation(root, "ˈzɛŋ");
    expect(reading(custom.predict(root + "elastic")!)).toEqual(reading("zɛŋɪˈlæstɪk"));
  });
  it("keeps adjective and noun composition in complete sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const result = api.phonemize("These viscoelastic materials work.", {
      language: "en-US", returnArray: true,
    });
    expect(reading(result.find(token => token.word === "viscoelastic")!.phoneme))
      .toEqual(reading("vɪskoʊɪˈlæstɪk"));
    expect(result.find(token => token.word === "work")?.phoneme).toBe("wɝk");
  });
});
