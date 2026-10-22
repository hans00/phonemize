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
      ["Compared to other mass circulation papers in Israel, Haaretz uses smaller headlines and print.", "uses", "ˈjuzəz"],
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

  it("recognizes base verbs after modified bare plural subjects with compound objects", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    for (const sentence of [
      "Adequate safety stock levels permit business operations to proceed.",
      "Such stand-alone power systems permit operations at night.",
      "Most U.S. states with low population densities commonly permit bicycle use on interstate freeways.",
    ]) {
      const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "permit");
      expect(token?.phoneme).toBe(disableDict ? "ˈpɝmɪt" : "pɝˈmɪt");
    }
    for (const sentence of ["A permit was issued.", "They applied for a permit.", "The permit applications arrived."]) {
      const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "permit");
      expect(token?.phoneme).toBe("ˈpɝmɪt");
    }
  });

  it("recognizes a transitive phrasal verb before its particle object", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const sentence = "Firecats invite back coaches Mastrole, Hall, Naples Daily News, September 24, 2005.";
    const token = api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word.toLowerCase() === "invite");
    expect(token?.phoneme).toBe(disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt");

    const noun = api.phonemize("The invite came by email.", { language: "en-US", returnArray: true })
      .find(t => t.word.toLowerCase() === "invite");
    expect(noun?.phoneme).toBe(disableDict ? "ɪnˈvaɪt" : "ˈɪnvaɪt");
  });
});
it("infers finite POS from the same determiner-backed syntax for unrelated verbs", () => {
  const tagger = new SimplePOSTagger();
  for (const target of ["uses", "records", "permits"]) {
    const words = ["The", "device", target, "recycled", "materials", "."];
    expect(tagger.tagWord(target, ["device", "recycled"], { words, index: 2 }).pos).toBe("V");
  }
});
