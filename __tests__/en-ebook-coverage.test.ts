import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("the dictionary covers ebook and its regular plural", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("ebook")).toBe("ˈiˌbʊk");
  expect(engine.predict("ebooks")).toBe("ˈiˌbʊks");
  expect(engine.predict("estate")).toBe("ɪˈsteɪt");
  expect(engine.predict("escape")).toBe("ɪˈskeɪp");
  const api = createPhonemizer({ processors: [engine] });
  for (const [sentence, word, expected] of [
    ["The ebook was available.", "ebook", "ˈiˌbʊk"],
    ["The ebooks were available.", "ebooks", "ˈiˌbʊks"],
  ]) {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(expected);
  }
  const verb = api.phonemize("They book the room.", { language: "en-US", returnArray: true });
  expect(verb.find(token => token.word === "book")?.phoneme).toBe(engine.predict("book", "en-US", "V"));
});
