import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("vouched verb stems in finite s forms, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word === word)?.phoneme;
  it("keeps finite verb and plural noun readings distinct", () => {
    expect(phone("He uses the tools.", "uses")).toBe("ˈjuzəz");
    expect(phone("She lives here.", "lives")).toBe("ɫɪvz");
    expect(phone("The lives of sailors are difficult.", "lives")).toBe("ɫaɪvz");
    expect(phone("The uses of tools are varied.", "uses")).toBe("ˈjusəz");
    expect(phone("He excuses the error.", "excuses")).toBe("ɪkˈskjuzəz");
    if (!disableDict) expect(phone("The excuses were recorded.", "excuses")).toBe("ɪkˈskjusəz");
  });
  it("preserves explicit POS and an unlabelled citation reading", () => {
    expect(engine.predict("uses", "en-US", "V")).toBe("ˈjuzəz");
    expect(engine.predict("uses", "en-US", "N")).toBe("ˈjusəz");
    expect(engine.predict("uses")).toBe("ˈjusəz");
  });
  it("preserves a caller-owned root on the composition route", () => {
    const own = new EnglishG2P({ disableDict: true });
    own.addPronunciation("use", "ˈzɛŋ");
    expect(own.predict("uses", "en-US", "V")).toBe("zɛŋz");
    own.addPronunciation("uses", "ˈkɛŋ");
    expect(own.predict("uses", "en-US", "V")).toBe("ˈkɛŋ");
  });
});
