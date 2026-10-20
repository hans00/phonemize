import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("finite predicates before vowel-final modifiers, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const pick = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  it("distinguishes a finite predicate from plural noun uses", () => {
    expect(pick("The Ashbory uses silicone rubber strings.", "uses")).toBe("ˈjuzəz");
    expect(pick("The novel uses of a tool are clear.", "uses")).toBe("ˈjusəz");
  });
  it("preserves contrastive stress on verb and noun records", () => {
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
  });
  it("does not turn past-time read into a present predicate", () => {
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
    }
  });
});
