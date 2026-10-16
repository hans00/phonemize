import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("pronounced e after obstruent + nasal (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["acne", "ˈækni"], ["acnes", "ˈækniz"], ["acne's", "ˈækniz"],
    ["acme", "ˈækmi"], ["acmes", "ˈækmiz"], ["acme's", "ˈækmiz"],
    ["daphne", "ˈdæfni"], ["daphnes", "ˈdæfniz"], ["daphne's", "ˈdæfniz"],
    ["borne", "ˈbɔɹn"], ["anne", "ˈæn"], ["home", "ˈhoʊm"],
    ["plane", "ˈpɫeɪn"],
  ])("preserves the root or control of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps the same ending productive outside the dictionary", () => {
    expect(engine.predict("macne")).toBe("ˈmækni");
  });
  it("does not tense a medial e", () => {
    expect(engine.predict("cadnetix")).toBe(disableDict ? "ˈkædnətɪks" : "ˌkædˈnɛtɪks");
  });
  it.each(["acne", "acme", "daphne"])("preserves caller-owned %s and its inflections", root => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation(root, "ˈzɛŋ");
    expect(custom.predict(root)).toBe("ˈzɛŋ");
    expect(custom.predict(root + "s")).toBe("ˈzɛŋz");
    expect(custom.predict(root + "'s")).toBe("ˈzɛŋz");
  });
  it("preserves noun, adjective and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work despite acne.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["acne", "ˈækni"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["work", "wɝk"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
