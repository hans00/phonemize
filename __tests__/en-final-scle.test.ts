import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge muscle/corpuscle: final -scle is /səl/; muscular retains /skj/.
describe.each([false, true])("final scle and sounded scul, rules=%s", disableDict => {
  it("retains the complete silent-c root after eviction", () => {
    const engine = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary.muscle;
    Reflect.set(engine, "dictionary", dictionary);
    for (const [word, ipa] of [["muscle", "ˈmʌsəɫ"], ["muscles", "ˈmʌsəɫz"],
      ["muscled", "ˈmʌsəɫd"], ["muscling", "ˈmʌsəɫɪŋ"]]) expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves the OOV plural nucleus without claiming the stem stress is repaired", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("corpuscle")).toMatch(/səɫ$/);
    expect(engine.predict("corpuscles")).toMatch(/səɫz$/);
  });
  it("retains the velar in neighboring sounded environments", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("muscular")).toBe("ˈmʌskjəɫɝ");
    expect(engine.predict("musculature")).toBe("ˈmʌskjəɫətʃɝ");
    expect(engine.predict("sclerotic")).toMatch(/^sk/);
    expect(engine.predict("sickle")).toBe("ˈsɪkəɫ");
  });
  it("preserves duplicate noun/verb occurrences and adjective controls", () => {
    const api = createPhonemizer({processors: [new EnglishG2P({ disableDict })]});
    const out = api.phonemize("The muscular reader trains the muscle while they muscle the bar.", {language: "en-US", returnArray: true});
    expect(out.filter(token => token.word === "muscle").map(token => token.phoneme)).toEqual(["ˈmʌsəɫ", "ˈmʌsəɫ"]);
    expect(out.find(token => token.word === "muscular")?.phoneme).toBe("ˈmʌskjəɫɝ");
    expect(out.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
  });
  it("retains explicit caller clusters and whole-child overrides", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("muscle", "ˈmʌskəɫ");
    expect(engine.predict("muscles")).toBe("ˈmʌskəɫz");
    engine.addPronunciation("muscles", "ˈzɛŋ");
    expect(engine.predict("muscles")).toBe("ˈzɛŋ");
  });
});
