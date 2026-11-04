import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("initial ed is a root nucleus (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["edge", "ˈɛdʒ"], ["eddie", "ˈɛdi"], ["edgar", "ˈɛdɡɝ"],
    ["edges", "ˈɛdʒəz"], ["edged", "ˈɛdʒd"], ["edging", "ˈɛdʒɪŋ"],
    ["edgeless", "ˈɛdʒɫəs"], ["edgy", "ˈɛdʒi"],
    ["bed", "ˈbɛd"], ["redder", "ˈɹɛdɝ"], ["walked", "ˈwɔkt"],
    ["played", "ˈpɫeɪd"], ["added", "ˈædɪd"], ["ended", "ˈɛndɪd"],
  ])("preserves the nucleus or inflection of %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("keeps a productive initial nucleus outside dictionary words", () => {
    expect(engine.predict("edvax")).toMatch(/^ˈɛd/);
  });
  it("inherits caller roots through productive inflection", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("edge", "ˈɛŋ");
    expect(custom.predict("edge")).toBe("ˈɛŋ");
    expect(custom.predict("edges")).toBe("ˈɛŋz");
    expect(custom.predict("edging")).toBe("ˈɛŋɪŋ");
  });
  it("preserves noun, adjective and verb controls in a sentence", () => {

    const tokens = englishTokens(engine, "The clever reader will edge the carpet.");
    for (const [word, ipa] of [["edge", "ɛdʒ"], ["clever", "ˈkɫɛvɝ"],
      ["reader", "ˈɹidɝ"], ["carpet", "ˈkɑɹpət"]])
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
  });
});
