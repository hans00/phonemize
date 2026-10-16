import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("ea before weak v rimes (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["heaven", "ˈhɛvən"], ["heavy", "ˈhɛvi"], ["leaven", "ˈɫɛvən"],
    ["heavenly", "ˈhɛvənɫi"], ["heavier", "ˈhɛviɝ"], ["heaviest", "ˈhɛviəst"],
    ["heavily", "ˈhɛvəɫi"], ["leavened", "ˈɫɛvənd"], ["leavening", "ˈɫɛvənɪŋ"],
  ])("retains the native root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["beaver", "ˈbivɝ"], ["weaver", "ˈwivɝ"], ["heaving", "ˈhivɪŋ"],
    ["leaving", "ˈɫivɪŋ"], ["weaving", "ˈwivɪŋ"],
    ["cleavenger", "ˈkɫivɪndʒɝ"], ["eavenson", "ˈivɪnsən"],
  ])("preserves a different spelling boundary in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains derivations after all family exceptions are evicted", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["heavy", "heaven", "leaven", "heavier", "heaviest", "heavily", "heavenly", "leavened", "leavening"]) delete access.dictionary[word];
    expect(fresh.predict("heavily")).toBe("ˈhɛvəɫi");
    expect(fresh.predict("heavier")).toBe("ˈhɛviɝ");
    expect(fresh.predict("heaviest")).toBe("ˈhɛviəst");
    expect(fresh.predict("heavenly")).toBe("ˈhɛvənɫi");
    expect(fresh.predict("leavened")).toBe("ˈɫɛvənd");
    expect(fresh.predict("leavening")).toBe("ˈɫɛvənɪŋ");
    expect(fresh.predict("unheavenly")).toMatch(/ˈhɛvənɫi$/);
    expect(fresh.predict("unleavened")).toMatch(/ˈɫɛvənd$/);
    expect(fresh.predict("heavenless")).toBe("ˈhɛvənɫəs");
  });
  it("preserves noun, adjective and verb controls in sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The heavy reader will work.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "heavy")?.phoneme).toBe("ˈhɛvi");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    const verb = api.phonemize("They leaven the bread.", { language: "en-US", returnArray: true });
    expect(verb.find(t => t.word === "leaven")?.phoneme).toBe("ˈɫɛvən");
  });
});

it.each([
  ["Beaven", "ˈbivən"], ["Leavy", "ˈɫivi"], ["Peavy", "ˈpivi"],
])("retains existing lexical name coverage for %s in the default API", (word, ipa) => {
  expect(new EnglishG2P().predict(word)).toBe(ipa);
});
