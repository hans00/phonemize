import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("inter/intra morphology (rules=%s)", disableDict => {
  it("keeps an existing adjectival root through the prefix", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("interracial")).toBe("ˌɪntɝˈɹeɪʃəɫ");
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("The clever reader discussed interracial marriage.", { language: "en-US", returnArray: true }).find(t => t.word === "interracial")?.phoneme).toBe("ˌɪntɝˈɹeɪʃəɫ");
  });
  it("honors the caller root and explicit whole-word override", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("racial", "ˈzɛŋ");
    expect(engine.predict("interracial")).toContain("zɛŋ");
    engine.addPronunciation("interracial", "ˈkɛŋ");
    expect(engine.predict("interracial")).toBe("ˈkɛŋ");
  });
});
