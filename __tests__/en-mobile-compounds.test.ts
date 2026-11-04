import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src";

describe("bound compound -mobile", () => {
  const rules = new EnglishG2P({ disableDict: true });

  test.each([
    ["automobile", "ˈɔtəmoʊˌbiɫ"],
    ["bookmobile", "ˈbʊkmoʊˌbiɫ"],
    ["snowmobile", "ˈsnoʊmoʊˌbiɫ"],
    ["automobiles", "ˈɔtəmoʊˌbiɫz"],
    ["bookmobiles", "ˈbʊkmoʊˌbiɫz"],
    ["snowmobiles", "ˈsnoʊmoʊˌbiɫz"],
  ])("composes %s from its head and bound mobile tail", (word, expected) => {
    expect(rules.predict(word)).toBe(expected);
  });

  test("retains full compound and suffix behavior in context", () => {
    const phonemizer = createPhonemizer({ processors: [rules] });
    expect(phonemizer.phonemize("The bookmobile followed the snowmobile.", "en-US"))
      .toBe("ðə ˈbʊkmoʊˌbiɫ ˈfɑɫoʊd ðə ˈsnoʊmoʊˌbiɫ.");
    expect(rules.predict("automobile", "en-US", "N")).toBe("ˈɔtəmoʊˌbiɫ");
    expect(rules.predict("snowmobile", "en-US", "N")).toBe("ˈsnoʊmoʊˌbiɫ");
  });

  test("does not treat free mobile or the im- prefix as compound -mobile", () => {
    expect(rules.predict("mobile")).toBe("ˈmoʊbəɫ");
    expect(rules.predict("immobile")).toBe("ˈɪməbɪɫ");
    expect(rules.predict("automotive")).toBe("ˌɔtəˈmoʊtɪv");
  });
});
