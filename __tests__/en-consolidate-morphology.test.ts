import EnglishG2P from "../src/en/g2p";

describe("consolidate root morphology", () => {
  const shipped = new EnglishG2P();
  const rules = new EnglishG2P({ disableDict: true });

  it("uses the Cambridge US root reading in the shipped dictionary", () => {
    expect(shipped.predict("consolidate", "en-US")).toBe("kənˈsɑɫəˌdeɪt");
  });

  it.each([
    ["consolidates", "kənˈsɑɫəˌdeɪts"],
    ["consolidated's", "kənˈsɑɫəˌdeɪtɪdz"],
  ])("keeps the corrected source reading for %s", (word, expected) => {
    expect(shipped.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["consolidates", "kənˈsɑɫəˌdeɪts"],
    ["consolidated", "kənˈsɑɫəˌdeɪtɪd"],
    ["consolidated's", "kənˈsɑɫəˌdeɪtɪdz"],
    ["consolidating", "kənˈsɑɫəˌdeɪtɪŋ"],
    ["consolidation", "kənˌsɑɫəˈdeɪʃən"],
  ])("uses the corrected root for %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("preserves the derived reading in a sentence with verb POS", () => {
    const sentence = ["They", "consolidated", "several", "accounts"];
    expect(rules.predictWithContext("consolidated", { words: sentence, index: 1 }, "en-US", "V"))
      .toBe("kənˈsɑɫəˌdeɪtɪd");
  });

  it.each([
    ["solid", "ˈsɑɫəd"],
    ["solidify", "səˈɫɪdəˌfaɪ"],
    ["solidity", "səˈɫɪdəti"],
    ["consolidator", "kənˈsɑɫɪˌdeɪtɝ"],
    ["reconsolidated", "ˌɹikənˈsɑɫɪˌdeɪtɪd"],
  ])("leaves the neighboring %s form unchanged", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
