import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("unmarked subject before infinitive (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const pos = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word.toLowerCase());
    return engine.tagWord(word, { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };
  test.each([
    "The men refuse to continue work until they are paid.",
    "The children refuse to leave the room.",
    "The fish refuse to accept food.",
    "The men refuse to be detained by police.",
  ])("recognizes the finite predicate in %s", sentence => {
    expect(pos(sentence, "refuse")).toBe("V");
    if (!disableDict) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
  });
  test.each([
    ["The shop produce to sell was fresh.", "produce"],
    ["The store produce to be sold was fresh.", "produce"],
    ["The defendant conduct to investigate surprised the jury.", "conduct"],
    ["The archive record to preserve remains intact.", "record"],
    ["The archive record to preserve during emergency remains intact.", "record"],
    ["The garden produce to sell, freshly harvested, tasted sweet.", "produce"],
    ["The government contract to purchase equipment expired.", "contract"],
    ["The factory produce to sell today rotted.", "produce"],
    ["The household refuse to recycle smelled.", "refuse"],
    ["The household refuse to recycle smells.", "refuse"],
    ["The Apostolic Delegate to Canada arrived.", "Delegate"],
  ])("preserves the nominal phrase in %s", (sentence, word) => {
    expect(pos(sentence, word)).not.toBe("V");
  });
});

test("explicit caller POS keeps the contrasting refuse readings", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("refuse", "en-US", "N")).toBe("ˈɹɛfjus");
  expect(engine.predict("refuse", "en-US", "ADJ")).toBe("ˈɹɛfjus");
  expect(engine.predict("refuse", "en-US", "V")).toBe("ɹɪˈfjuz");
});
