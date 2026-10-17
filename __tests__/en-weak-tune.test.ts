import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("short weak postrhotic -tune (rules=%s)", disableDict => {
  it.each(["fortune", "fortunes", "fortune's"])("keeps dialect-specific nuclei in %s", word => {
    const e = new EnglishG2P({ disableDict }), plural = word !== "fortune" ? "z" : "";
    expect(e.predict(word, "en-US")).toBe("ˈfɔɹtʃən" + plural);
    expect(e.predict(word, "en-GB")).toBe("ˈfɔːtʃuːn" + plural);
  });
  it.each(["tune", "neptune", "opportune", "importune"])("retains the full nonmatching rime in %s", word => {
    expect(new EnglishG2P({ disableDict }).predict(word, "en-US")).toMatch(/tun$/);
  });
  it("composes the root in a new hyphenated prefix form", () => {
    const e = new EnglishG2P({ disableDict });
    expect(e.predict("post-fortune", "en-US")).toMatch(/fɔɹtʃən$/);
    expect(e.predict("post-fortune", "en-GB")).toMatch(/fɔːtʃuːn$/);
  });
  it("preserves caller roots and direct children", () => {
    const e = new EnglishG2P({ disableDict });
    e.addPronunciation("fortune", "ˈzɛŋ");
    expect(e.predict("fortunes")).toBe("ˈzɛŋz");
    expect(e.predict("fortune's", "en-GB")).toBe("ˈzɛŋz");
    e.addPronunciation("fortunes", "ˈkɛŋ");
    expect(e.predict("fortunes")).toBe("ˈkɛŋ");
  });
  it("retains the noun in full prose", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    expect(api.phonemize("The clever reader made a fortune.", { language: "en-US", returnArray: true }).find(t => t.word === "fortune")?.phoneme).toBe("ˈfɔɹtʃən");
  });
});
