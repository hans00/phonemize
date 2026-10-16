import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// References: existing pinned dictionary readings; secondary stress varies.
describe.each([false, true])("Deictic compound boundaries (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  it.each([
    ["hereby", /hɪɹˈbaɪ$/], ["herein", /hɪ(?:ˈɹ|ɹˈ)ɪn$/],
    ["thereby", /ðɛɹˈbaɪ$/], ["therein", /ðɛˈɹɪn$/],
    ["thereof", /ðɛˈɹ[əʌ]v$/], ["whereas", /hwɛˈɹæz$/],
    ["whereby", /hwɛɹˈbaɪ$/], ["wherein", /hwɛˈɹɪn$/],
  ])("keeps the complete components in %s", (word, ipa) => {
    expect(engine.predict(word)).toMatch(ipa);
  });

  it.each([
    ["here", "ˈhɪɹ"], ["there", "ˈðɛɹ"], ["where", "ˈhwɛɹ"],
    ["coastal", "ˈkoʊstəɫ"], ["therefore", "ˈðɛɹˌfɔɹ"],
  ])("preserves the independent rime in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("keeps adjective, noun and verb readings in the full sentence", () => {
    const tokens = api.phonemize("The invalid record whereby they record results was removed.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "whereby")?.phoneme).toMatch(/hwɛɹˈbaɪ$/);
    expect(tokens.filter(t => t.word === "record").map(t => t.phoneme))
      .toEqual([engine.predict("record", "en-US", "N"), engine.predict("record", "en-US", "V")]);
  });
});

describe("Lexical controls outside the monosyllabic-tail class", () => {
  const engine = new EnglishG2P();
  it.each([
    ["whereabouts", "ˈhwɛɹəˌbaʊts"], ["hereafter", "hɪˈɹæftɝ"],
    ["thereupon", "ˌðɛɹəˈpɑn"], ["whereupon", "ˌhwɛɹəˈpɑn"],
  ])("preserves %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
});
