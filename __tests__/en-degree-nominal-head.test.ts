import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { simplePOSTagger } from "../src/en/pos-tagger";

const nounSentences = [
  "It was a really fast read.",
  "It was a very good read.",
  "The very long read was useful.",
  "He enjoyed a quite entertaining read.",
  "It was a terrific, riveting, really fast read and really exciting and really horrifying, but managed to be really touching.",
];

describe.each([false, true])("determined degree phrases, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  if (!disableDict) it.each(nounSentences)("preserves noun read /rid/: %s", sentence => {
    expect(pick(sentence, "read")).toBe("ɹid");
  });
  it("preserves neighboring noun, adjective and verb controls", () => {
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
  });
  it("preserves past and modal read", () => {
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
      expect(pick("A very carefully read book was on the table.", "read")).toBe("ɹɛd");
    }
  });
});

it.each([
  "A very carefully read book was on the table.",
  "A very well read scholar spoke.",
  "A very quickly read and summarized book was on the table.",
  "I really quickly read the book yesterday.",
])("does not turn preverbal adverbs into a noun frame: %s", sentence => {
  const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
  const index = words.indexOf("read");
  expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }).pos).not.toBe("N");
});

it.each(nounSentences)("recognizes the nominal head independently of G2P mode: %s", sentence => {
  const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
  const index = words.indexOf("read");
  expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }).pos).toBe("N");
});
