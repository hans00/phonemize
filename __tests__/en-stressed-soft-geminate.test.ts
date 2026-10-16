import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("primary lax-e geminate (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["suggestion", "səˈdʒɛstʃən"], ["suggestions", "səˈdʒɛstʃənz"],
    ["suggestion's", "səˈdʒɛstʃənz"], ["suggestible", "səˈdʒɛstəbəɫ"],
    ["dagger", "ˈdæɡɝ"], ["aggie", "ˈæɡi"], ["baggy", "ˈbæɡi"],
    ["buggy", "ˈbʌɡi"], ["legge", "ˈɫɛɡ"], ["bagge", "ˈbæɡ"],
  ])("preserves the root or contrast in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains a hard g before a closed e syllable", () => {
    expect(engine.predict("leggette")).toMatch(/ˈɡɛt$/);
  });
  it("retains a hard g before primary i", () => {
    expect(engine.predict("biaggini")).toContain("ˈɡini");
  });
  it("preserves the tense-vowel hard g", () => {
    expect(engine.predict("saggese")).toContain("ɡi");
  });
  it("preserves the weak closed get rime", () => {
    expect(engine.predict("nugget")).toMatch(/ɡ[əɪ]t$/);
  });
  it("does not merge a distinct g + j boundary in an OOV compound", () => {
    expect(engine.predict("eggjam")).toMatch(/ɡ[ˈˌ]?dʒ/);
  });
  it.each(["autosuggestion", "ruggestion", "nuggestible"])("keeps the softened root productive in %s", word => {
    expect(engine.predict(word)).toContain("ˈdʒɛst");
  });
  it("preserves an existing root under the non prefix", () => {
    expect(engine.predict("nonsuggestible")).toContain("səˈdʒɛstəbəɫ");
  });
  it("preserves a caller's root and its inflections", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("suggestion", "ˈzɛŋ");
    for (const [word, ipa] of [["suggestion", "ˈzɛŋ"], ["suggestions", "ˈzɛŋz"],
      ["suggestion's", "ˈzɛŋz"]])
      expect(custom.predict(word)).toBe(ipa);
  });
  it("preserves noun, adjective and verb readings in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work on a suggestion.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["suggestion", "səˈdʒɛstʃən"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    expect(api.phonemize("The suggestible reader will work.", {
      language: "en-US", returnArray: true,
    }).find(t => t.word === "suggestible")?.phoneme).toBe("səˈdʒɛstəbəɫ");
  });
});
