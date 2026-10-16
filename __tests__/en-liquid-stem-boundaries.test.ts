import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("liquid stem boundaries (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["sterling", "ˈstɝɫɪŋ"], ["starling", "ˈstɑɹɫɪŋ"], ["darling", "ˈdɑɹɫɪŋ"],
    ["curler", "ˈkɝɫɝ"], ["sampling", "ˈsæmpɫɪŋ"], ["trampling", "ˈtɹæmpɫɪŋ"],
    ["dumpling", "ˈdʌmpɫɪŋ"], ["curling", "ˈkɝɫɪŋ"], ["hurling", "ˈhɝɫɪŋ"],
    ["snarling", "ˈsnɑɹɫɪŋ"], ["curled", "ˈkɝɫd"], ["hurled", "ˈhɝɫd"],
    ["whirled", "ˈhwɝɫd"], ["purled", "ˈpɝɫd"],
  ])("retains the complete root in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["snarled", "ˈsnɑɹəɫd"], ["sampled", "ˈsæmpəɫd"], ["trampled", "ˈtɹæmpəɫd"],
    ["simpler", "ˈsɪmpəɫɝ"], ["eurosterling", "ˌjuɹoʊˈstɝɫɪŋ"], ["reader", "ˈɹidɝ"],
  ])("preserves the neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("recovers inflections after exception eviction", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["sampling", "samplings", "starling", "starlings", "starling's"]) delete access.dictionary[word];
    expect(fresh.predict("samplings")).toBe("ˈsæmpɫɪŋz");
    expect(fresh.predict("starlings")).toBe("ˈstɑɹɫɪŋz");
    expect(fresh.predict("starling's")).toBe("ˈstɑɹɫɪŋz");
  });
  it("retains noun, adjective and verb readings in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader is sampling a dumpling.", { language: "en-US", returnArray: true });
    for (const [word, ipa] of [["clever", "ˈkɫɛvɝ"], ["reader", "ˈɹidɝ"], ["sampling", "ˈsæmpɫɪŋ"], ["dumpling", "ˈdʌmpɫɪŋ"]]) {
      expect(tokens.find(t => t.word === word)?.phoneme).toBe(ipa);
    }
  });
});
