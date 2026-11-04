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

  it("keeps the source-backed reading on the dictionary-disabled route", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("during", "en-US")).toBe("ˈdʊɹɪŋ");
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("We met during the war.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "during")?.phoneme).toBe("ˈdʊɹɪŋ");
  });

  it("uses the regular edit + -ed reading on the dictionary-disabled route", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("edited", "en-US", "V")).toBe("ˈɛdɪtɪd");
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("They edited the paper.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "edited")?.phoneme).toBe("ˈɛdɪtɪd");
    expect(rules.predict("editing", "en-US", "V")).toBe("ˈɛdɪtɪŋ");
  });

  it("keeps the longer credit root ahead of the embedded edit spelling", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("credit", "en-US", "N")).toBe("ˈkɹɛdɪt");
    expect(rules.predict("credited", "en-US", "V")).toBe("ˈkɹɛdɪtɪd");
    expect(rules.predict("crediting", "en-US", "V")).toBe("ˈkɹɛdɪtɪŋ");
    expect(rules.predict("accredited", "en-US", "V")).toBe("əˈkɹɛdɪtɪd");
    expect(rules.predict("accrediting", "en-US", "V")).toBe("əˈkɹɛdɪtɪŋ");
  });

  it.each([
    ["duress", "ˈdʊɹɛs"],
    ["durable", "ˈdʊɹəbəɫ"],
    ["duration", "ˌdʊˈɹeɪʃən"],
  ])("leaves neighboring du+r words unchanged: %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });
});
