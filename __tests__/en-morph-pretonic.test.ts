import EnglishG2P from "../src/en/g2p";
import { preservePretonicSchwa } from "../src/en/morph-parser";
import { createPhonemizer } from "../src/core";

// The schwa and primary stress agree with Cambridge US intellectual and continual.
describe("inherited pretonic schwa", () => {
  test("keeps an aligned weak nucleus after the root stress moves", () => {
    expect(preservePretonicSchwa("ˌɪntɛˈlɛktʃuəl", "ˈɪntəˌɫɛktʃuəl")).toBe("ˌɪntəˈlɛktʃuəl");
  });
  test.each([
    ["ˈtɛl", "təl"],
    ["ˌtɛˈlɪk", "təlɪk"],
    ["paɪˈtɛl", "paəˈtɛl"],
    ["piɛˈta", "piəˈta"],
    ["ˌɪntɛˈrɛkt", "ˌɪntəˈlɛkt"],
    ["ˈtɛlɛ", "ˈtɛlə"],
    ["tɛl", "təl"],
  ])("preserves stress, hiatus/diphthongs and nonmatching roots in %s", (derived, inherited) => {
    expect(preservePretonicSchwa(derived, inherited)).toBe(derived);
  });
});

describe.each([false, true])("bound -ual composition (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([["intellectual", "ˌɪntəˈɫɛktʃuəɫ"], ["continual", "kənˈtɪnjuəɫ"], ["intellectually", "ˌɪntəˈɫɛktʃuəɫi"], ["continually", "kənˈtɪnjuəɫi"], ["intellectuals", "ˌɪntəˈɫɛktʃuəɫz"]])("retains the complete suffix frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test.each([["uncontinual", "kənˈtɪnjuəɫ"], ["nonintellectual", "ɪntəˈɫɛktʃuəɫ"]])("preserves the owned root under a productive prefix: %s", (word, tail) => {
    expect(engine.predict(word)?.endsWith(tail)).toBe(true);
  });
  test("places the owned individual root stress on vid", () => {
    expect(engine.predict("individual")).toContain("ˈvɪdʒ");
  });
  test("preserves adjective/noun contexts and unrelated verb controls", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The intellectual is active. They face continual problems. We print books.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "intellectual")?.phoneme).toBe("ˌɪntəˈɫɛktʃuəɫ");
    expect(tokens.find(token => token.word === "continual")?.phoneme).toBe("kənˈtɪnjuəɫ");
    expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
    expect(tokens.find(token => token.word === "print")?.phoneme).toBe("pɹɪnt");
  });
});

test("retains caller ownership of a supplied stem and complete adjective", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("contin", "ˈzɛŋ");
  expect(engine.predict("continual")).toMatch(/^ˈzɛŋ/);
  engine.addPronunciation("intellectual", "ˈkʌp");
  expect(engine.predict("intellectual")).toBe("ˈkʌp");
});


test("keeps both supplied components of a vowel-hiatus prefix formation", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("annual", "ˈzɛŋ");
  expect(engine.predict("biannual")).toBe("ˌbaɪˈzɛŋ");
  engine.addPronunciation("bi", "ˈkʌp");
  expect(engine.predict("biannual")).toBe("ˌkʌpˈzɛŋ");
});
