import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { inferVerbForm } from "../src/en/pos-tagger";

describe.each([false, true])("modal with coordinated predicates (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test("uses the verb reading before an object", () => {
    const tokens = api.phonemize("The animal could rend and tear flesh.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "tear")?.phoneme).toBe(engine.predict("tear", "en-US", "V"));
  });
  test.each([
    "They will read, record, and replay the tape.",
    "They can read, record, or replay a lecture.",
  ])("shares the modal with a comma-separated predicate in %s", sentence => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "record")?.phoneme).toBe(engine.predict("record", "en-US", "V"));
  });
  test("does not treat the middle of a nominal object list as a verb", () => {
    const tokens = api.phonemize("They will buy fish, produce, and bread at the store.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "produce")?.phoneme).toBe(engine.predict("produce", "en-US", "N"));
  });
  test("also shares the modal with the final predicate", () => {
    const tokens = api.phonemize("They will read, record, and present the report.", { language: "en-US", returnArray: true });
    for (const word of ["record", "present"])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", "V"));
  });
  test.each(["N", "ADJ", "V"])("preserves explicit %s in the three-predicate frame", pos => {
    const context = { words: ["They", "will", "read", ",", "record", ",", "and", "replay", "the", "tape", "."], index: 4 };
    expect(engine.predictWithContext("record", context, "en-US", pos)).toBe(engine.predict("record", "en-US", pos));
  });
  test.each(["N", "ADJ", "V"])("preserves supplied %s in the same context", pos => {
    const context = { words: ["The", "animal", "could", "rend", "and", "tear", "flesh", "."], index: 5 };
    expect(engine.predictWithContext("tear", context, "en-US", pos)).toBe(engine.predict("tear", "en-US", pos));
  });
  test.each(["They can pack fish and produce for winter.", "They can fish and produce when supplies are plentiful."])("keeps the food noun in %s", sentence => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "produce")?.phoneme).toBe(engine.predict("produce", "en-US", "N"));
  });
  test.each([
    ["They could swim and present records were lost.", "present", "ADJ"],
    ["They could swim and present records will remain.", "present", "ADJ"],
    ["They could swim and present records remain intact.", "present", "ADJ"],
    ["They could swim and present records showed growth.", "present", "ADJ"],
    ["They could fish and produce mixes were sold.", "produce", "N"],
  ])("preserves a following noun phrase in %s", (sentence, word, pos) => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
  });
});

test("the final predicate keeps the modal base form despite a past-time adverb", () => {
  const words = ["They", "would", "sign", ",", "present", ",", "and", "read", "the", "book", "yesterday", "."];
  expect(inferVerbForm({ words, index: 7 })).toBe("base");
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize(words.join(" "), { language: "en-US", returnArray: true });
  expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹid");
});

test("a shared modal preserves verb voicing and the noun control for misuse", () => {
  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const verb = api.phonemize("There are allegations that he would distort and misuse data given to him.", { language: "en-US", returnArray: true });
  const noun = api.phonemize("The misuse of data was reported.", { language: "en-US", returnArray: true });
  expect(verb.find(token => token.word === "misuse")?.phoneme).toBe(engine.predict("misuse", "en-US", "V"));
  expect(noun.find(token => token.word === "misuse")?.phoneme).toBe(engine.predict("misuse", "en-US", "N"));
});
