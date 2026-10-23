import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import dictionary = require("../data/en/dict.json");

describe("Cambridge US reading of during", () => {
  it("serves the US /ʊr/ reading in isolation and in a sentence", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });

    expect(dictionary.during).toBe("ˈdʊɹɪŋ");
    expect(engine.predict("during", "en-US")).toBe("ˈdʊɹɪŋ");
    const tokens = api.phonemize("We met during the war.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "during")?.phoneme).toBe("ˈdʊɹɪŋ");
  });

  it.each([
    ["duress", "ˈdʊɹɛs"],
    ["durable", "ˈdʊɹəbəɫ"],
    ["duration", "ˌdʊˈɹeɪʃən"],
  ])("leaves neighboring du+r words unchanged: %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });
});
