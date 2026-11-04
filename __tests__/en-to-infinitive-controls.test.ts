import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("to infinitive controls (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const tagged = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word);
    return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  test("preserves infinitives even when followed by of", () => {
    expect(tagged("The project due to consist of three parts is ready.", "consist")).toBe("V");
    expect(tagged("The speaker is almost due to speak of policy.", "speak")).toBe("V");
    expect(tagged("They came from London to dispose of furniture.", "dispose")).toBe("V");
    expect(tagged("She moved from refusing to speak of policy.", "speak")).toBe("V");
    expect(tagged("The collection was expected to consist of books.", "consist")).toBe("V");
  });

  test("does not extend an infinitive into a coordinated clause", () => {
    expect(tagged("She wants to act decisively and present policy matters.", "present")).not.toBe("V");
  });
});

test.each(["en-US", "en-GB"])("keeps the adjective reading across a coordinated clause in %s", language => {
  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const tokens = api.phonemize("She wants to act decisively and present policy matters.", { language, returnArray: true });
  expect(tokens.find(token => token.word === "present")?.phoneme).toBe(engine.predict("present", language, "ADJ"));
});
