import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("final eye and its neighboring spellings (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word)?.phoneme;

  test("keeps the same vowel as a noun and a verb in full sentences", () => {
    expect(phone("The eye is open.", "eye")).toBe("aɪ");
    expect(phone("They eye the prize.", "eye")).toBe("aɪ");
    expect(phone("The eyes are open.", "eyes")).toBe("aɪz");
  });

  test("preserves the compound tail and nearby non-silent-e words", () => {
    expect(engine.predict("buckeye", "en-US")).toMatch(/kaɪ$/);
    expect(engine.predict("goldeneye", "en-US")).toMatch(/naɪ$/);
    expect(engine.predict("hey", "en-US")).toBe("ˈheɪ");
    expect(engine.predict("grey", "en-US")).toBe("ˈɡɹeɪ");
    expect(engine.predict("dye", "en-US")).toBe("ˈdaɪ");
    expect(engine.predict("beyer", "en-US")).toBe("ˈbeɪɝ");
  });
});
