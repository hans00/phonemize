import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("finite morphology respects noun boundaries, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word === word)?.phoneme;
  it.each([
    ["For concerts, this console may be moved.", "concerts", "ˈkɑnsɝts"],
    ["They work on projects that combine several methods.", "projects", "ˈpɹɑdʒɛkts"],
    ["There are unlimited lives, the player keeps going.", "lives", "ɫaɪvz"],
    ["The mountain winds, a common hazard, are strong.", "winds", "wɪndz"],
  ])("preserves the noun %s", (sentence, word, ipa) => {
    expect(phone(sentence, word)).toBe(ipa);
  });
  it("preserves distinct finite and noun readings of uses", () => {
    expect(phone("The pacemaker uses batteries.", "uses")).toBe("ˈjuzəz");
    expect(phone("There are also uses of batteries.", "uses")).toBe("ˈjusəz");
    expect(phone("She lives here.", "lives")).toBe("ɫɪvz");
    // Pinned CMU proceed/proceed(3) preserve both weak rhotic variants.
    expect(phone("As polymerization proceeds, the fibers form.", "proceeds")).toMatch(/^(?:pɹə|pɝ)ˈsidz$/);
  });
});
