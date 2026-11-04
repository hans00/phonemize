import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

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

    const tokens = englishTokens(rules, "They format the report, then save the format.");
    expect(tokens.filter(token => token.word === "format").map(token => token.phoneme)).toEqual([
      "ˈfɔɹmæt",
      "ˈfɔɹmæt",
    ]);
  });
});
