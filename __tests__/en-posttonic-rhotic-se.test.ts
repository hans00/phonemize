import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("posttonic rhotic -se (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test.each([["purchase", "ˈpɝtʃəs"], ["purpose", "ˈpɝpəs"]])("keeps the weak final syllable of %s across caller POS", (word, expected) => {
    for (const pos of [undefined, "N", "ADJ", "V"]) expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });
  test.each([
    ["They purchase a book.", "purchase", "ˈpɝtʃəs"],
    ["The purchase was final.", "purchase", "ˈpɝtʃəs"],
    ["The purpose was clear.", "purpose", "ˈpɝpəs"],
  ])("keeps the reading in %s", (sentence, word, expected) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme).toBe(expected);
  });
  test.each([["purchases", "ˈpɝtʃəsəz"], ["purchased", "ˈpɝtʃəst"], ["purchasing", "ˈpɝtʃəsɪŋ"], ["purposes", "ˈpɝpəsəz"], ["purposeful", "ˈpɝpəsfəɫ"]])("preserves derived %s", (word, expected) => {
    expect(engine.predict(word, "en-US")).toBe(expected);
  });
  test.each(["surprise", "surmise"])("preserves the PRICE vowel in %s", word => {
    expect(engine.predict(word, "en-US", "V")).toMatch(/aɪz$/);
  });
  test("preserves the rime in a hyphenated compound", () => {
    expect(engine.predict("all-purpose", "en-US", "ADJ")).toMatch(/ˈpɝpəs$/);
    const tokens = api.phonemize("This is an all-purpose tool.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "purpose")?.phoneme).toBe("ˈpɝpəs");
  });
  test("preserves a caller-supplied pronunciation", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("purchase", "Z AE1 P");
    expect(custom.predict("purchase", "en-US")).toBe("ˈzæp");
  });
  test("preserves a caller-supplied strong rime in derived forms", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("bercase", "B ER1 K EY2 S");
    expect(custom.predict("bercased", "en-US")).toBe("ˈbɝˌkeɪst");
    expect(custom.predict("bercasing", "en-US")).toBe("ˈbɝˌkeɪsɪŋ");
  });
});

test.each([false, true])("keeps the same weak rime in en-GB (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  expect(engine.predict("purchase", "en-GB", "V")).toBe("ˈpɜːtʃəs");
  expect(engine.predict("purpose", "en-GB", "N")).toBe("ˈpɜːpəs");
  expect(engine.predict("surmise", "en-GB", "V")).toMatch(/aɪz$/);
});
