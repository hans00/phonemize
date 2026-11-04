import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("compound prepositions ending in to (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const tagged = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word);
    return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  test("identifies closed nominal complements", () => {
    expect(tagged("Mortalities that occur prior to export are excluded.", "export")).toBe("N");
    expect(tagged("Owing to abuse of power, the team stopped.", "abuse")).toBe("N");
    expect(tagged("According to record, the meeting ended.", "record")).toBe("N");
    expect(tagged("Subsequent to use, the room closed.", "use")).toBe("N");
  });

  test("preserves verbal and adjective controls", () => {
    expect(tagged("They want to export goods.", "export")).toBe("V");
    expect(tagged("The team is due to present the plan.", "present")).toBe("V");
    expect(tagged("Due to read of the incident, the officer opened the report.", "read")).toBe("V");
    expect(tagged("The present rules are useful.", "present")).not.toBe("V");
  });

  test("keeps noun and verb readings in complete sentences", () => {
    if (disableDict) return;
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("Mortalities that occur prior to export are excluded.", { language: "en-US" })).toContain("ˈɛkspɔɹt");
    expect(api.phonemize("They want to export goods.", { language: "en-US" })).toContain("ɪkˈspɔɹt");
  });
});
