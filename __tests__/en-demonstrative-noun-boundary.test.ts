import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("terminal demonstrative homograph, disableDict=%s", disableDict => {
  it("tags a terminal noun homograph after clause-level that as nominal", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.tagWord("record", {
      prev: "that",
      sentence: { words: ["Nearby", "Mawsynram", "currently", "holds", "that"], index: 5 },
    }).pos).toBe("N");
  });

  it("keeps a relative-clause verb after its noun antecedent", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.tagWord("records", {
      prev: "that",
      next: "failures",
      sentence: { words: ["The", "machine", "that"], index: 3 },
    }).pos).toBe("V");
  });
});

it("uses the noun reading for sentence-final record without treating a verb as a noun", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize("Nearby Mawsynram currently holds that record.", { language: "en-US", returnArray: true })
    .find(token => token.word === "record")?.phoneme).toBe("ˈɹɛkɝd");
  const engine = new EnglishG2P();
  expect(engine.tagWord("ran", { prev: "that", sentence: { words: ["They", "said", "that"], index: 3 } }).pos).toBe("V");
});
