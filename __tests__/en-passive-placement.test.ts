import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { simplePOSTagger } from "../src/en/pos-tagger";

it.each([
  "His skills were never put to use.", "The tool was put to use.",
  "The worker is put to work.", "The child was put to sleep.",
  "The claim was put to rest.", "The accused was put to trial.",
])("recognizes a closed nominal complement: %s", sentence => {
  const words = sentence.replace(/\./g, " .").split(" ");
  const index = words.indexOf("to") + 1;
  expect(simplePOSTagger.tagWord(words[index], ["to", words[index + 1]], { words, index }).pos).toBe("N");
});

it.each([
  "They want to use tools.", "He was told to use tools.",
  "He was put to work the machine.", "They put tools to use resources.",
])("preserves infinitives: %s", sentence => {
  const words = sentence.replace(/\./g, " .").split(" ");
  const index = words.indexOf("to") + 1;
  expect(simplePOSTagger.tagWord(words[index], ["to", words[index + 1]], { words, index }).pos).toBe("V");
});

describe.each([false, true])("passive placement, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  it("keeps noun use voiceless", () => {
    expect(pick("His skills were never put to use.", "use")).toBe("jus");
    expect(pick("The use of tools is clear.", "use")).toBe("jus");
  });
  it("preserves noun and verb stress in neighboring clauses", () => {
    expect(pick("The records were put to use.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
  });
  it("preserves past and modal read controls", () => {
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      expect(pick("They want to use tools.", "use")).toBe("juz");
    }
  });
});
