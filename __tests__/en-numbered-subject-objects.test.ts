import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("numbered subjects and stacked objects, rules=%s", disableDict => {
  it("uses named or determiner-backed subjects with bounded adjective stacks", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const [sentence, word, ipa] of [
      ["Ukraine uses five-digit numeric postal codes.", "uses", "ˈjuzəz"],
      ["Alice uses four-part digital recordings.", "uses", "ˈjuzəz"],
      ["Line 2 uses four-car trains.", "uses", "ˈjuzəz"],
      ["The model twenty five uses four-part records.", "uses", "ˈjuzəz"],
      ["Phase 3 records four-part digital readings.", "records", "ɹɪˈkɔɹdz"],
      ["Zone 2 permits four-part recordings.", "permits", "pɝˈmɪts"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("keeps adjective-led wind nouns and numbered noun phrases", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const sentence of ["Strong winds uprooted trees.", "High winds also disrupted communications.", "Sustained winds reached forty-eight knots."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "winds")?.phoneme).toBe("wɪndz");
    expect(api.phonemize("The two uses were clear.", { language: "en-US", returnArray: true }).find(t => t.word === "uses")?.phoneme).toBe("ˈjusəz");
  });
  it("retains both verb and noun occurrences around number expansion", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = api.phonemize("Line 2 uses four-car trains; the two uses were clear.", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => t.word === "uses").map(t => t.phoneme)).toEqual(["ˈjuzəz", "ˈjusəz"]);
    expect(tokens.filter(t => t.word === "two")).toHaveLength(2);
  });
});
