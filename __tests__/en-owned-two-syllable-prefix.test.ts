import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Collins antivirus and Cambridge anti-missile attest both anti- vowel variants.
describe.each([false, true])("owned two-syllable prefix roots, disableDict=%s", disableDict => {
  it("retains the independent root under a compositional prefix", () => {
    const en = new EnglishG2P({ disableDict });
    expect(en.predict("antivirus")).toMatch(/ˈvaɪɹəs$/);
    expect(en.predict("antimissile")).toMatch(/ˈmɪsəɫ$/);
    expect(en.predict("antiviruses")).toMatch(/ˈvaɪɹəs[əɪ]z$/);
    expect(en.predict("antimissiles")).toMatch(/ˈmɪsəɫz$/);
    expect(en.predict("nonviral")).toMatch(/ˈvaɪɹəɫ$/);
    expect(en.predict("antisiren")).toMatch(/ˈsaɪɹən$/);
  });

  it.each([["virus", "ˈvaɪɹəs"], ["viral", "ˈvaɪɹəɫ"], ["siren", "ˈsaɪɹən"], ["spiral", "ˈspaɪɹəɫ"]])("preserves the base %s", (word, ipa) => {
    const en = new EnglishG2P({ disableDict });
    expect(en.predict(word)).toBe(ipa);
  });

  it("honors custom prefix, root and whole-token readings after lexical eviction", () => {
    const en = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(en, "dictionary") };
    delete dictionary.antivirus;
    Reflect.set(en, "dictionary", dictionary);
    en.addPronunciation("anti", "ˈbɹi");
    en.addPronunciation("virus", "ˈtɛst");
    expect(en.predict("antivirus")).toBe("ˌbɹiˈtɛst");
    en.addPronunciation("antivirus", "ˈkʌstəm");
    expect(en.predict("antivirus")).toBe("ˈkʌstəm");
  });

  it("preserves noun, adjective and verb readings in complete sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("The viral infection spreads. The musician records blue notes. The records of blue notes are missing. They use antivirus software.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "viral")?.phoneme).toBe("ˈvaɪɹəɫ");
    expect(out.find(t => t.word === "antivirus")?.phoneme).toMatch(/ˈvaɪɹəs$/);
    expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
  });
});
