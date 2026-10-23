import EnG2P from "../src/en/g2p";
import { isFunctionWord } from "../src/en/pos-tagger";
import { createPhonemizer } from "../src/core";

describe("the vowel change in do + third-person -es", () => {
  const rules = new EnG2P({ disableDict: true });

  it.each([
    ["does", "ˈdʌz"],
    ["redoes", "ɹiˈdʌz"],
    ["undoes", "ənˈdʌz"],
  ])("derives %s as %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it("preserves the root and unrelated -oes controls", () => {
    expect(rules.predict("do", "en")).toBe("ˈdu");
    expect(rules.predict("dodo", "en")).toBe("ˈdoʊdoʊ");
    expect(rules.predict("do-si-do", "en")).toMatch(/doʊ$/);
    expect(rules.predict("colorado", "en")).toMatch(/doʊ$/);
    expect(rules.predict("doing", "en")).toBe("ˈduɪŋ");
    expect(rules.predict("done", "en")).toBe("ˈdʌn");
    expect(rules.predict("to", "en")).toBe("ˈtu");
    expect(rules.predict("goes", "en")).toBe("ˈɡoʊz");
  });

  it("uses doe + plural -s when context marks does as a noun", () => {
    expect(isFunctionWord("does", "N")).toBe(false);
    expect(isFunctionWord("does", "V")).toBe(true);
    expect(rules.predict("does", "en", "N")).toBe("doʊz");
  });

  it("keeps the verb weak in sentence context", () => {
    const api = createPhonemizer({ processors: [new EnG2P()] });
    const token = api.phonemize("She does the work.", { language: "en-US", returnArray: true })
      .find(({ word }) => word === "does");
    expect(token?.phoneme).toBe("dəz");
  });
});
