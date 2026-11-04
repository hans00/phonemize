import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("sourced suite, soul, comfort, congress, and bother roots", () => {
  it.each([false, true])("keeps lexical root readings through inflection and sentence context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("suite", "en-US", "NN")).toBe("swit");
    expect(engine.predict("suites", "en-US", "NNS")).toBe("swits");
    expect(engine.predict("soul", "en-US", "NN")).toBe("soʊɫ");
    expect(engine.predict("souls", "en-US", "NNS")).toBe("soʊɫz");
    expect(engine.predict("comfort", "en-US", "NN")).toBe("ˈkʌmfɝt");
    expect(engine.predict("comfort", "en-US", "VB")).toBe("ˈkʌmfɝt");
    expect(engine.predict("comfortable", "en-US", "JJ")).toBe("ˈkʌmfɝtəbəɫ");
    expect(engine.predict("congress", "en-US", "NN")).toBe(disableDict ? "ˈkɑŋɡɹɛs" : "ˈkɑŋɡɹəs");
    expect(engine.predict("congresses", "en-US", "NNS")).toBe("ˈkɑŋɡɹəsəz");
    expect(engine.predict("bother", "en-US", "NN")).toBe("ˈbɑðɝ");
    expect(engine.predict("bother", "en-US", "VB")).toBe("ˈbɑðɝ");
    expect(engine.predict("bothered", "en-US", "VBD")).toBe("ˈbɑðɝd");
    expect(engine.predict("bothering", "en-US", "VBG")).toBe("ˈbɑðɝɪŋ");

    expect(engine.predict("mother", "en-US", "NN")).toBe("ˈmʌðɝ");
    expect(engine.predict("brother", "en-US", "NN")).toBe("ˈbɹʌðɝ");
    expect(engine.predict("progress", "en-US", "NN")).toBe(disableDict ? "ˈpɹɑɡɹɛs" : "ˈpɹoʊɡɹɛs");
    expect(engine.predict("south", "en-US", "NN")).toBe("saʊθ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(
      "The suite offered comfort to every bothered soul; Congress heard the complaint without a bother.",
      { language: "en-US", returnArray: true },
    );
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("suite")).toBe("swit");
    expect(reading("comfort")).toBe("ˈkʌmfɝt");
    expect(reading("bothered")).toBe("ˈbɑðɝd");
    expect(reading("soul")).toBe("soʊɫ");
    expect(reading("Congress")).toBe(disableDict ? "ˈkɑŋɡɹɛs" : "ˈkɑŋɡɹəs");
  });
});
