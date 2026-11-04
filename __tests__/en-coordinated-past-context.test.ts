import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test.each([false, true])("a coordinated past predicate after a prepositional phrase retains past read (rules=%s)", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const sentence = "They went to a local library and read all books yesterday.";
  const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
  expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹɛd");
});
