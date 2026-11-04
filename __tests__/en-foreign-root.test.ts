import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("Cambridge-attested foreign root", () => {
  it.each([false, true])("uses the standard US /ɑ/ alternative in isolation and context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("foreign", "en-US")).toBe("ˈfɑɹən");

    // Keep the regular <eign> readings and a derived form stable.
    expect(engine.predict("reign", "en-US")).toBe("ˈɹeɪn");
    expect(engine.predict("deign", "en-US")).toBe("ˈdeɪn");
    expect(engine.predict("foreigner", "en-US")).toBe("ˈfɑɹənɝ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Foreign policy affects foreign visitors.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.filter(token => token.word.toLowerCase() === "foreign").map(token => token.phoneme))
      .toEqual(["ˈfɑɹən", "ˈfɑɹən"]);
  });
});

describe("Cambridge-attested common pronunciation variants", () => {
  it("uses dictionary-attested rules-only readings without changing dictionary output", () => {
    const defaultEngine = new EnglishG2P();
    const rulesEngine = new EnglishG2P({ disableDict: true });

    expect(defaultEngine.predict("pizza", "en-US")).toBe("ˈpitsə");
    expect(rulesEngine.predict("pizza", "en-US")).toBe("ˈpitsə");
    expect(defaultEngine.predict("pizzas", "en-US")).toBe("ˈpitsəz");
    expect(rulesEngine.predict("pizzas", "en-US")).toBe("ˈpitsəz");
    expect(defaultEngine.predict("Halloween", "en-US")).toBe("ˌhæɫəˈwin");
    expect(rulesEngine.predict("Halloween", "en-US")).toBe("ˌhæɫəˈwin");
    expect(defaultEngine.predict("genuine", "en-US")).toBe("ˌdʒɛnˈjuˌwaɪn");
    expect(rulesEngine.predict("genuine", "en-US")).toBe("ˈdʒɛnjuɪn");
    expect(defaultEngine.predict("routine", "en-US")).toBe("ɹuˈtin");
    expect(rulesEngine.predict("routine", "en-US")).toBe("ɹuˈtin");
    expect(defaultEngine.predict("Italian", "en-US")).toBe("ɪˈtæɫjən");
    expect(rulesEngine.predict("Italian", "en-US")).toBe("ɪˈtæɫjən");
    expect(defaultEngine.predict("gourmet", "en-US")).toBe("ˈɡʊɹˌmeɪ");
    expect(rulesEngine.predict("gourmet", "en-US")).toBe("ɡʊɹˈmeɪ");
    expect(defaultEngine.predict("ratio", "en-US")).toBe("ˈɹeɪʃiˌoʊ");
    expect(rulesEngine.predict("ratio", "en-US")).toBe("ˈɹeɪʃiˌoʊ");
    expect(defaultEngine.predict("omega", "en-US")).toBe("oʊˈmeɪɡə");
    expect(rulesEngine.predict("omega", "en-US")).toBe("oʊˈmeɪɡə");

    expect(rulesEngine.predict("pita", "en-US")).toBe("ˈpitə");
    expect(rulesEngine.predict("sizzle", "en-US")).toBe("ˈsɪzəɫ");
    expect(rulesEngine.predict("routinely", "en-US")).toBe("ɹuˈtinɫi");
    expect(rulesEngine.predict("Italy", "en-US")).toBe("ˈɪtəɫi");
    expect(rulesEngine.predict("rational", "en-US")).toBe("ˈɹæʃənəɫ");
    expect(rulesEngine.predict("omelet", "en-US")).toBe("ˈɑməˌɫɛt");

    const api = createPhonemizer({ processors: [rulesEngine] });
    const tokens = api.phonemize("Pizza is popular on Halloween; the ratio uses omega.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.filter(token => ["pizza", "halloween", "ratio", "omega"].includes(token.word.toLowerCase())).map(token => token.phoneme))
      .toEqual(["ˈpitsə", "ˌhæɫəˈwin", "ˈɹeɪʃiˌoʊ", "oʊˈmeɪɡə"]);
  });
});
