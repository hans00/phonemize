import EnglishG2P from "../src/en/g2p";
import { applyPostLexical } from "../src/en/postlex";
import { createPhonemizer } from "../src/core";

// MW verb entries independently place primary on the silent-e root.
const verbs = [
  ["collide", "kəˈlaɪd", "They collide near the old bridge."],
  ["connive", "kəˈnaɪv", "They connive to deceive their rivals."],
  ["connote", "kəˈnoʊt", "They connote a sense of danger."],
  ["console", "kənˈsoʊl", "They console their friend."],
  ["conspire", "kənˈspaɪɝ", "They conspire against the plan."],
];
const normalize = (ipa: string | null) => (ipa ?? "").replace(/ɫ/g, "l");

describe.each([false, true])("caller-V bound i/o root, rules=%s", (disableDict) => {
  test.each(verbs)("retains the complete %s verb reading", (word, expected) => {
    expect(normalize(new EnglishG2P({ disableDict }).predict(word, "en-US", "V"))).toBe(expected);
  });

  test.each(verbs)("reads %s as a verb in its complete sentence", (word, expected, sentence) => {
    const engine = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = engine.phonemize(sentence, { language: "en-US", returnArray: true });
    if (typeof tokens === "string") throw new Error("Expected full token output");
    const targets = tokens.filter(token => token.word.toLowerCase() === word);
    expect(targets).toHaveLength(1);
    expect(normalize(targets[0]?.phoneme ?? null)).toBe(expected);
  });

  test("carries the verb root through inflections without lexical entries", () => {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: {} });
    for (const [word, base] of verbs) {
      expect(normalize(engine.predict(word, "en-US", "V"))).toBe(base);
      expect(normalize(engine.predict(word.slice(0, -1) + "ed", "en-US", "V"))).toBe(base + (/t$/.test(base) ? "ɪd" : /d$/.test(base) ? "ɪd" : "d"));
      expect(normalize(engine.predict(word.slice(0, -1) + "ing", "en-US", "V"))).toBe(base + "ɪŋ");
      expect(normalize(engine.predict(word + "s", "en-US", "V"))).toBe(base + (/t$/.test(base) ? "s" : "z"));
    }
  });

  test("keeps noun stress and existing verb controls", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(normalize(engine.predict("console", "en-US", "N"))).toBe("ˈkɑnsoʊl");
    expect(normalize(engine.predict("console", "en-US", "ADJ"))).toBe("ˈkɑnsoʊl");
    expect(normalize(engine.predict("compile", "en-US", "V"))).toBe("kəmˈpaɪl");
    expect(normalize(engine.predict("contrive", "en-US", "V"))).toBe("kənˈtɹaɪv");
  });

  test("keeps a known short root ahead of an invented silent-e root", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("conson", "ˈkɑnsən");
    expect(engine.predict("consoned", "en-US", "V")).toBe("ˈkɑnsənd");
    expect(engine.predict("consoning", "en-US", "V")).toBe("ˈkɑnsənɪŋ");
    engine.addPronunciation("consone", "kənˈsoʊn");
    expect(engine.predict("consoned", "en-US", "V")).toBe("kənˈsoʊnd");
    expect(engine.predict("consoning", "en-US", "V")).toBe("kənˈsoʊnɪŋ");
  });

  test("retains a caller-owned complete reading", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("console", "ˈkoʊnsoʊl");
    expect(engine.predict("console", "en-US", "V")).toBe("ˈkoʊnsoʊl");
  });
});

test("strong bound ive keeps PRICE while weak tails keep the original order", () => {
  expect(applyPostLexical("kənaɪv", "connive", 3, true)).toBe("kənaɪv");
  expect(applyPostLexical("kɑnaɪv", "connive", 3, false)).toBe("kɑnɪv");
  expect(applyPostLexical("neɪtaɪv", "native", 3, false)).toBe("neɪtɪv");
  expect(applyPostLexical("pɑzɪtaɪv", "positive", 4, false)).toBe("pɑzətɪv");
  expect(applyPostLexical("rɛstaɪv", "restive", 3, true)).toBe("rɛstɪv");
});
