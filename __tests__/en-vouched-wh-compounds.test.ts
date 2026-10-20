import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford meanwhile retains PRICE in the independent while root in both dialects.
describe.each([false, true])("vouched heads and grammatical wh tails, disableDict=%s", disableDict => {
  const cold = () => {
    const en = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(en, "dictionary") };
    delete dictionary.meanwhile;
    Reflect.set(en, "dictionary", dictionary);
    return en;
  };
  it("recovers the root after eviction and keeps ordinary inflections", () => {
    const en = cold();
    for (const language of ["en-US", "en-GB"]) {
      expect(en.predict("meanwhile", language)).toBe("ˈminˌwaɪɫ");
      expect(en.predict("meanwhiles", language)).toBe("ˈminˌwaɪɫz");
    }
  });
  it("preserves existing indefinite forms", () => {
    const en = cold();
    expect(en.predict("somewhere")).toBe("ˈsʌmˌwɛɹ");
    expect(en.predict("anywhere")).toBe("ˈɛniˌwɛɹ");
  });
  it("honors custom heads, tails and whole-token pronunciations", () => {
    const en = cold();
    en.addPronunciation("mean", "ˈtɛst");
    expect(en.predict("meanwhile")).toBe("ˈtɛstˌwaɪɫ");
    en.addPronunciation("while", "ˈfɔɹm");
    expect(en.predict("meanwhile")).toBe("ˈtɛstˌfɔɹm");
    en.addPronunciation("meanwhile", "ˈkʌstəm");
    expect(en.predict("meanwhile")).toBe("ˈkʌstəm");
  });
  it("does not treat every wh word as a grammatical compound tail", () => {
    const en = cold(), before = en.predict("meanwhistle");
    en.addPronunciation("whistle", "ˈtɛst");
    expect(en.predict("meanwhistle")).toBe(before);
  });
  it("preserves adverb, noun and verb controls in complete sentences", () => {
    const api = createPhonemizer({ processors: [cold()] });
    const out = api.phonemize("Meanwhile, the musician records blue notes. The records of blue notes are missing. The mean is clear. They mean well.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "Meanwhile")?.phoneme).toBe("ˈminˌwaɪɫ");
    expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
    expect(out.filter(t => t.word === "mean").map(t => t.phoneme)).toEqual(["min", "min"]);
  });
});
