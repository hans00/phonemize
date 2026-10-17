import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// American weak readings: https://www.merriam-webster.com/dictionary/fragile
// https://www.merriam-webster.com/dictionary/missile
// https://www.merriam-webster.com/dictionary/hostile
const readings = [
  ["agile", "ˈædʒəɫ"], ["docile", "ˈdɑsəɫ"], ["facile", "ˈfæsəɫ"],
  ["fertile", "ˈfɝtəɫ"], ["fissile", "ˈfɪsəɫ"], ["fragile", "ˈfɹædʒəɫ"],
  ["futile", "ˈfjutəɫ"], ["gracile", "ˈɡɹæsəɫ"], ["hostile", "ˈhɑstəɫ"],
  ["missile", "ˈmɪsəɫ"], ["sterile", "ˈstɛɹəɫ"], ["virile", "ˈvɪɹəɫ"],
];
describe.each([false, true])("trochaic weak ile, rules=%s", disableDict => {
  const withoutRoots = () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    for (const [word] of readings) delete dictionary[word];
    Reflect.set(engine, "dictionary", dictionary);
    return engine;
  };
  it.each(readings)("retains the weak root after eviction: %s", (word, ipa) => {
    expect(withoutRoots().predict(word)).toBe(ipa);
  });
  it.each([
    ["nonfragile", "nɑnˈfɹædʒəɫ"], ["nondocile", "nɑnˈdɑsəɫ"],
    ["nonsterile", "nɑnˈstɛɹəɫ"], ["nonhostile", "nɑnˈhɑstəɫ"],
    ["missiles", "ˈmɪsəɫz"], ["missile's", "ˈmɪsəɫz"],
  ])("preserves productive morphology: %s", (word, ipa) => {
    expect(withoutRoots().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it.each([
    ["fragility", "fɹəˈdʒɪɫəti"], ["agility", "əˈdʒɪɫəti"],
    ["fertility", "fɝˈtɪɫəti"], ["futility", "fjuˈtɪɫəti"],
    ["mobile", "ˈmoʊbəɫ"], ["mobility", "moʊˈbɪɫəti"],
    ["gerbil", "ˈdʒɝbɪɫ"], ["daffodil", "ˈdæfədɪɫ"], ["hillbilly", "ˈhɪɫbɪɫi"],
  ])("keeps the stressed derivative and neighboring rime: %s", (word, ipa) => {
    expect(withoutRoots().predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("keeps custom roots and complete targets ahead of the class", () => {
    const engine = withoutRoots();
    engine.addPronunciation("fragile", "ˈkɛmp");
    expect(engine.predict("nonfragile")).toMatch(/ˈkɛmp$/);
    engine.addPronunciation("nonfragile", "ˈzɛmp");
    expect(engine.predict("nonfragile")).toBe("ˈzɛmp");
  });
  it.each([
    ["The fragile vase fell.", "fragile", "ˈfɹædʒəɫ"],
    ["They found a missile.", "missile", "ˈmɪsəɫ"],
    ["The missile interceptor works.", "missile", "ˈmɪsəɫ"],
    ["They remain hostile.", "hostile", "ˈhɑstəɫ"],
  ])("preserves the whole sentence: %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [withoutRoots()] });
    const segments = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(segments.find(segment => segment.word === word)?.phoneme).toBe(ipa);
  });
});
