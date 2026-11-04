import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("vowel-final ye inflections (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word)?.phoneme;

  test.each([
    ["eyed", "ˈaɪd"], ["eyeing", "ˈaɪɪŋ"], ["eyes", "ˈaɪz"],
    ["dyed", "ˈdaɪd"], ["dyeing", "ˈdaɪɪŋ"],
    ["greyed", "ˈɡɹeɪd"], ["obeyed", "oʊˈbeɪd"], ["preyed", "ˈpɹeɪd"],
    ["prettying", "ˈpɹɪtiɪŋ"], ["prettied", "ˈpɹɪtid"], ["hying", "ˈhaɪɪŋ"],
  ])("preserves the vowel and ending in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  test("keeps the verb, passive and noun readings in sentences", () => {
    expect(phone("They eyed the prize.", "eyed")).toBe("aɪd");
    expect(phone("The dye was eyed by the artist.", "eyed")).toBe("aɪd");
    expect(phone("Greyed hair framed the eye.", "eye")).toBe("aɪ");
    expect(phone("Greyed hair framed the eye.", "greyed")).toBe("ɡɹeɪd");
  });
});

test("a supplied vowel-final root survives regular inflection", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("eye", "ˈzi");
  expect(engine.predict("eyed", "en-US")).toBe("ˈzid");
  expect(engine.predict("eyeing", "en-US")).toBe("ˈziɪŋ");
  expect(engine.predict("eyes", "en-US")).toBe("ˈziz");
});
