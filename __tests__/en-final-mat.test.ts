import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("checked final -mat rime", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["format", "ˈfɔɹmæt"],
    ["formats", "ˈfɔɹmæts"],
    ["formatted", "ˈfɔɹmætɪd"],
    ["formatting", "ˈfɔɹmætɪŋ"],
    ["reformat", "ɹiˈfɔɹmæt"],
    ["reformats", "ɹiˈfɔɹmæts"],
    ["reformatted", "ɹiˈfɔɹmætɪd"],
  ])("retains the checked vowel through %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["mat", "ˈmæt"],
    ["diplomat", "ˈdɪpɫəmæt"],
    ["diplomatic", "ˌdɪpɫəˈmætɪk"],
    ["laundromat", "ˈɫɔndɹəmæt"],
    ["combat", "ˈkɑmbæt"],
    ["kabat", "ˈkæbət"],
    ["wombat", "ˈwɑmbət"],
  ])("preserves the neighboring rime control %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it.each([
    ["astigmatism", "əˈstɪɡməˌtɪzəm"],
    ["astigmatist", "əˈstɪɡmətɪst"],
    ["dramatization", "ˌdɹæmətəˈzeɪʃən"],
    ["dramatize", "ˈdɹæməˌtaɪz"],
    ["traumatize", "ˈtɹɔməˌtaɪz"],
    ["pragmatism", "ˈpɹæɡməˌtɪzəm"],
  ])("leaves bound -mat roots unchanged in %s", (word, expected) => {
    expect(rules.predict(word, "en")).toBe(expected);
  });

  it("keeps noun and verb uses stable in full sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("They format the report, then save the format.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.filter(token => token.word === "format").map(token => token.phoneme)).toEqual([
      "ˈfɔɹmæt",
      "ˈfɔɹmæt",
    ]);
  });
});
