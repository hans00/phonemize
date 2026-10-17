import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("single-nucleus proto tails, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  // Cambridge American Dictionary: /ˈproʊt̬·əˌkɔl, -ˌkɑl/.
  it.each([["protocol", "ˈpɹoʊtəˌkɑɫ"], ["prototype", "ˈpɹoʊtəˌtaɪp"]])("retains the full combining head in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("leaves regular plurals with their singular root", () => {
    const own = new EnglishG2P({ disableDict });
    const plural = own.predict("protocols");
    own.addPronunciation("cols", "ˈzɛŋ");
    expect(own.predict("protocols")).toBe(plural);
  });
  it.each(["zoa", "zoan"])("does not reinterpret the hiatus tail %s as a single-nucleus root", tail => {
    const own = new EnglishG2P({ disableDict });
    const before = own.predict("proto" + tail);
    own.addPronunciation(tail, "ˈzɛŋ");
    expect(own.predict("proto" + tail)).toBe(before);
  });
  it("supports an OOV root and caller-owned prefix, root and target", () => {
    const own = new EnglishG2P({ disableDict });
    expect(own.predict("protokemp")).toBe("ˈpɹoʊtəˌkɛmp");
    own.addPronunciation("proto", "ˈzɛŋ");
    own.addPronunciation("kemp", "ˈfɔɹm");
    expect(own.predict("protokemp")).toBe("ˈzɛŋˌfɔɹm");
    own.addPronunciation("protokemp", "ˈkɛŋ");
    expect(own.predict("protokemp")).toBe("ˈkɛŋ");
  });
  it("preserves neighbouring adjective, noun and verb readings", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They record a kind minder following the protocol.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
    expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
    expect(tokens.find(t => t.word === "protocol")?.phoneme).toBe("ˈpɹoʊtəˌkɑɫ");
    if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
  });
});
