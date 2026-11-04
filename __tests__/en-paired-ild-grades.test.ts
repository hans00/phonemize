import EnglishG2P from "../src/en/g2p";
import { englishTokens, withoutDictionaryEntries } from "./helpers/english";

describe.each([false, true])("paired PRICE-ild grades, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([["milder", "ˈmaɪɫdɝ"], ["mildest", "ˈmaɪɫdəst"], ["wildest", "ˈwaɪɫdəst"]])("retains the root nucleus in %s", (word, ipa) => {
    if (!disableDict && word === "wildest") expect(engine.predict(word)).toMatch(/^ˈwaɪɫd[əɪ]st$/);
    else expect(engine.predict(word)).toBe(ipa);
  });
  it.each([["gilder", "ˈɡɪɫdɝ"], ["guilder", "ˈɡɪɫdɝ"], ["childers", "ˈtʃɪɫdɝz"]])("preserves the ungraded or checked root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves an owned base with an independent counterpart after eviction", () => {
    const own = new EnglishG2P({ disableDict });
    withoutDictionaryEntries(own, ["milder"]);
    own.addPronunciation("mildest", "ˈmaɪɫdəst");
    own.addPronunciation("mild", "ˈzɛŋ");
    expect(own.predict("milder")).toBe("ˈzɛŋɝ");
  });
  it("supports an OOV counterpart without adding a runtime word map", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("zildest", "ˈzaɪɫdəst");
    expect(own.predict("zilder")).toBe("ˈzaɪɫdɝ");
    own.addPronunciation("zild", "ˈzɛŋ");
    expect(own.predict("zilder")).toBe("ˈzɛŋɝ");
    own.addPronunciation("zilder", "ˈbɛŋ");
    expect(own.predict("zilder")).toBe("ˈbɛŋ");
  });
  it("preserves noun, adjective and verb neighbours in a sentence", () => {

    const tokens = englishTokens(engine, "The kind minder will hinder the milder child.");
    expect(tokens.filter(t => ["kind", "minder", "hinder", "milder", "child"].includes(t.word)).map(t => t.phoneme))
      .toEqual(["kaɪnd", "ˈmaɪndɝ", "ˈhɪndɝ", "ˈmaɪɫdɝ", "tʃaɪɫd"]);
  });
});
