import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

describe.each([false, true])("final silent gn stress (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["align", "əˈɫaɪn"], ["consign", "kənˈsaɪn"], ["malign", "məˈɫaɪn"],
    ["aligned", "əˈɫaɪnd"], ["aligning", "əˈɫaɪnɪŋ"],
    ["alignment", "əˈɫaɪnmənt"], ["aligner", "əˈɫaɪnɝ"],
    ["consigned", "kənˈsaɪnd"], ["consigning", "kənˈsaɪnɪŋ"],
    ["maligned", "məˈɫaɪnd"], ["maligning", "məˈɫaɪnɪŋ"],
    ["misalign", "ˌmɪsəˈɫaɪn"], ["misaligned", "ˌmɪsəˈɫaɪnd"],
    ["misalignments", "ˌmɪsəˈɫaɪnmənts"],
    ["reconsign", "ˌɹikənˈsaɪn"], ["reconsigning", "ˌɹikənˈsaɪnɪŋ"],
    ["sign", "ˈsaɪn"], ["reign", "ˈɹeɪn"], ["deign", "ˈdeɪn"],
    ["benign", "bɪˈnaɪn"], ["career", "kɝˈɪɹ"],
  ])("retains the root and neighboring class in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves primary on an open-class nominal compound head", () => {
    expect(parseIpa(engine.predict("webdesign")!).primary).toBe(0);
  });
  it("preserves a custom root after whole-target eviction", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.aligned;
    custom.addPronunciation("align", "AH0 L EY1 N");
    expect(custom.predict("aligned")).toBe("əˈɫeɪnd");
  });
  it("checks adjective, noun and verb readings in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The malign reader will align the sign.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "malign")?.phoneme).toBe("məˈɫaɪn");
    expect(tokens.find(t => t.word === "align")?.phoneme).toBe("əˈɫaɪn");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "sign")?.phoneme).toBe("saɪn");
  });
});

it.each([
  ["ensign", "ˈɛnsən"], ["foreign", "ˈfɑɹən"], ["sovereign", "ˈsɑvɹən"],
])("preserves the default supplied nominal reading in %s", (word, ipa) => {
  expect(new EnglishG2P().predict(word)).toBe(ipa);
});
