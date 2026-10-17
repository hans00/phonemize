import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

describe.each([false, true])("bounded finite object frames, rules=%s", disableDict => {
  it("keeps full finite, noun and adjective sentence controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const cases = [
      ["This secondary array uses pumped-fluid cooling.", "uses", "ˈjuzəz"],
      ["The device uses recycled materials.", "uses", "ˈjuzəz"],
      ["Her film uses both interviews and archival material.", "uses", "ˈjuzəz"],
      ["Their many uses remain clear.", "uses", "ˈjusəz"],
      ["Strong winds uprooted trees.", "winds", "wɪndz"],
      ["Strong winds also uprooted trees.", "winds", "wɪndz"],
      ["High winds also disrupted communications.", "winds", "wɪndz"],
      ["Sustained winds reached forty-eight knots.", "winds", "wɪndz"],
      ["The old records damaged the equipment.", "records", "ˈɹɛkɝdz"],
      ["The child records all were preserved.", "records", "ˈɹɛkɝdz"],
      ["The city permits were signed.", "permits", "ˈpɝmɪts"],
      ["The child records several songs.", "records", "ɹɪˈkɔɹdz"],
      ["The workshop permits restored cars.", "permits", "pɝˈmɪts"],
      ["There were stone axes that were found.", "axes", "ˈæksəz"],
      ...(disableDict ? [["The school records that were released are clear.", "records", "ˈɹɛkɝdz"]] : []),
      ...(!disableDict ? [
        ["The present record is clear.", "present", "ˈpɹɛzənt"],
        ["The present record is clear.", "record", "ˈɹɛkɝd"],
      ] : []),
    ];
    for (const [sentence, word, ipa] of cases)
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
});
it("infers finite POS from the same determiner-backed syntax for unrelated verbs", () => {
  const tagger = new SimplePOSTagger();
  for (const target of ["uses", "records", "permits"]) {
    const words = ["The", "device", target, "recycled", "materials", "."];
    expect(tagger.tagWord(target, ["device", "recycled"], { words, index: 2 }).pos).toBe("V");
  }
});
