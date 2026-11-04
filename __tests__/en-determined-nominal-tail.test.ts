import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { simplePOSTagger } from "../src/en/pos-tagger";

const api = createPhonemizer({ processors: [new EnglishG2P()] });

function readToken(sentence: string) {
  return api.phonemize(sentence, { language: "en-US", returnArray: true })
    .find(token => token.word.toLowerCase() === "read")?.phoneme;
}

test("a base-form homograph after a closed modifier chain is the noun head", () => {
  const sentence = "Fade to Black is perhaps Flinn's second-best known realistic novel and a frequent high school required read.";
  const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
  const index = words.findIndex(word => word.toLowerCase() === "read");

  expect(simplePOSTagger.tagWord("read", [words[index - 1], words[index + 1]], { words, index }, true).pos).toBe("N");
  expect(readToken(sentence)).toBe("ɹid");
  expect(readToken("A frequent school required read was assigned.")).toBe("ɹid");
});

test.each([
  ["The recording artist read that book yesterday.", "ɹɛd"],
  ["I read a required book yesterday.", "ɹɛd"],
  ["They may read the required book.", "ɹid"],
  ["A very well read scholar spoke.", "ɹɛd"],
  ["The required book was read yesterday.", "ɹɛd"],
])("preserves verb and participial controls in %s", (sentence, expected) => {
  expect(readToken(sentence)).toBe(expected);
});
