import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

describe.each([false, true])("English weigh rime (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["weigh", "ˈweɪ"], ["weight", "ˈweɪt"], ["weighty", "ˈweɪˌti"],
    ["weights", "ˈweɪts"], ["weighed", "ˈweɪd"], ["weighing", "ˈweɪɪŋ"],
    ["weightless", "ˈweɪtɫəs"], ["weightlessness", "ˈweɪtɫəsnəs"],
    ["weighable", "ˈweɪəbəɫ"],
  ])("retains phones and primary in %s", (word, ipa) => {
    expect(parseIpa(engine.predict(word)!)).toEqual(parseIpa(ipa));
  });
  it.each(["weighted", "weightier", "overweight", "underweight", "weightlifting"])("retains the owned root vowel in %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toContain("weɪt");
  });
  it.each([
    ["Weiss", "ˈwaɪs"], ["Weil", "ˈwaɪɫ"], ["Weinberg", "ˈwaɪnbɝɡ"],
    ["height", "ˈhaɪt"],
  ])("preserves the neighboring spelling class in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves noun, adjective and verb sentence controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will weigh the load.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "weigh")?.phoneme).toBe("weɪ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "load")?.phoneme).toBe("ɫoʊd");
  });
});

it("preserves the supplied default surname reading", () => {
  expect(new EnglishG2P().predict("Weightman")).toBe("ˈwaɪtmən");
});
