import EnglishG2P from "../src/en/g2p";
import { englishTokens, withoutDictionaryEntries } from "./helpers/english";

// Collins: https://www.collinsdictionary.com/dictionary/english-pronunciations/thermometer
// Combining -meter carries root stress; a unit such as nanometer stays a compound.
describe.each([false, true])("combining meter, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["thermometer", "θɝˈmɑmətɝ"],
    ["thermometers", "θɝˈmɑmətɝz"],
    ["micrometer", "maɪˈkɹɑmətɝ"],
    ["spectrometer", "spɛkˈtɹɑmətɝ"],
    ["nanometer", "ˈnænoʊˌmitɝ"],
  ])("keeps the root and neighboring unit: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves caller-owned tail and whole-target priority", () => {
    const own = new EnglishG2P({ disableDict });
    Reflect.set(own, "dictionary", { ...Reflect.get(own, "dictionary"), thermometer: "θɝˈmɑmətɝ" });
    own.addPronunciation("meter", "ˈzɛŋ");
    expect(own.predict("thermometer")).toBe(disableDict ? "ˈθɝmoʊˌzɛŋ" : "θɝˈmɑmətɝ");
    own.addPronunciation("thermometer", "ˈfɔɹm");
    expect(own.predict("thermometer")).toBe("ˈfɔɹm");
  });
  it("uses a caller-owned tail after the whole target is evicted", () => {
    const own = new EnglishG2P({ disableDict });
    withoutDictionaryEntries(own, ["thermometer"]);
    own.addPronunciation("meter", "ˈzɛŋ");
    expect(own.predict("thermometer")).toBe("ˈθɝmoʊˌzɛŋ");
  });
  it("retains surrounding noun, adjective and verb readings", () => {

    const tokens = englishTokens(engine, "They record a kind minder beside the thermometer.");
    expect(tokens.find(t => t.word === "kind")?.phoneme).toBe("kaɪnd");
    expect(tokens.find(t => t.word === "minder")?.phoneme).toBe("ˈmaɪndɝ");
    expect(tokens.find(t => t.word === "thermometer")?.phoneme).toBe("θɝˈmɑmətɝ");
    if (!disableDict) expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
  });
});
