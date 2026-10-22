import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("rhotic vowel before the second r in -urrent/-urrant", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["current", "ˈkɝənt"],
    ["currant", "ˈkɝənt"],
    ["concurrent", "kənˈkɝənt"],
    ["recurrent", "ɹiˈkɝənt"],
    ["intercurrent", "ɪnˈtɝkɝənt"],
    ["undercurrent", "ˌʌndɝˈkɝənt"],
  ])("does not emit a duplicate /r/ in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["currency", "ˈkɝənsi"],
    ["curriculum", "kɝˈɪkjəɫəm"],
    ["burrito", "bɝˈɹitoʊ"],
    ["surreal", "ˈsɝɹiɫ"],
    ["overrun", "ˈoʊvɝɹən"],
    ["overreach", "ˈoʊvɝɹitʃ"],
  ])("preserves the neighboring %s rime", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("keeps word context and neighboring content words stable", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("The current rate and currant buns recur.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "current")?.phoneme).toBe("kɝənt");
    expect(tokens.find(token => token.word === "currant")?.phoneme).toBe("kɝənt");
    expect(tokens.find(token => token.word === "rate")?.phoneme).toBe("ɹeɪt");
    expect(tokens.find(token => token.word === "recur")?.phoneme).toBe("ɹiˈkɝ");
  });

  it("uses Cambridge US current in the default dictionary route", () => {
    expect(new EnglishG2P().predict("current", "en-US")).toBe("kɝənt");
    expect(new EnglishG2P().predict("concurrent", "en-US")).toBe("kənˈkɝənt");
  });
});
