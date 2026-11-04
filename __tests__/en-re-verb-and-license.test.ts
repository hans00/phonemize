import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge US reproduce/reconstruct/license; re- preserves a verb's own root.
// https://dictionary.cambridge.org/us/dictionary/english/reproduce
// https://dictionary.cambridge.org/us/dictionary/english/reconstruct
// https://dictionary.cambridge.org/us/pronunciation/english/license
// https://www.oxfordlearnersdictionaries.com/definition/english/reuse_2 (noun /s/)
const withoutSecondary = (ipa: string | null) => ipa?.replace(/ˌ/g, "");

describe.each([false, true])("vouched re- verbs and weak ns spellings (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["reproduce", "ɹipɹəˈdus"],
    ["reproduces", "ɹipɹəˈdusəz"],
    ["reproduced", "ɹipɹəˈdust"],
    ["reproducing", "ɹipɹəˈdusɪŋ"],
    ["recombine", "ɹikəmˈbaɪn"],
    ["recombined", "ɹikəmˈbaɪnd"],
    ["recombining", "ɹikəmˈbaɪnɪŋ"],
    ["reconstruct", "ɹikənˈstɹʌkt"],
    ["reconstructed", "ɹikənˈstɹʌktɪd"],
    ["reconstructing", "ɹikənˈstɹʌktɪŋ"],
  ])("retains the complete verb root through %s", (word, ipa) => {
    expect(withoutSecondary(engine.predict(word))).toBe(ipa);
  });
  it.each([
    ["license", "ˈɫaɪsəns"],
    ["licence", "ˈɫaɪsəns"],
    ["licenses", "ˈɫaɪsənsəz"],
    ["licensed", "ˈɫaɪsənst"],
    ["licensing", "ˈɫaɪsənsɪŋ"],
    ["unlicensed", "ənˈɫaɪsənst"],
    ["licensable", "ˈɫaɪsənsəbəɫ"],
    ["licenser", "ˈɫaɪsənsɝ"],
  ])("shares the weak ending without changing the stem in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["really", "ˈɹiɫi"],
    ["defense", "dɪˈfɛns"],
    ["defence", "dɪˈfɛns"],
    ["dispense", "dɪˈspɛns"],
    ["dense", "ˈdɛns"],
    ["tense", "ˈtɛns"],
    ["suspense", "səˈspɛns"],
    ["silence", "ˈsaɪɫəns"],
  ])("preserves the neighboring environment in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each<[string, string, string, string[]]>([
    ["They reproduce the signal.", "reproduce", "ɹipɹəˈdus", ["ðeɪ", "ðə", "ˈsɪɡnəɫ", "."]],
    ["They reconstruct the active device.", "reconstruct", "ɹikənˈstɹʌkt", ["ðeɪ", "ðə", "ˈæktɪv", "dɪˈvaɪs", "."]],
    ["They license the active device.", "license", "ˈɫaɪsəns", ["ðeɪ", "ðə", "ˈæktɪv", "dɪˈvaɪs", "."]],
    ["The license is active.", "license", "ˈɫaɪsəns", ["ðə", "ɪz", "ˈæktɪv", "."]],
  ])("keeps the target reading in complete prose: %s", (text, word, ipa, others) => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(text, { language: "en-US", returnArray: true });
    expect(withoutSecondary(tokens.find(token => token.word === word)?.phoneme ?? null)).toBe(ipa);
    expect(tokens.filter(token => token.word !== word).map(token => token.phoneme)).toEqual(others);
    expect(withoutSecondary(engine.predict(word, "en-US", word === "license" && text.startsWith("The") ? "N" : "V"))).toBe(ipa);
  });
  it("does not treat a monosyllabic root's plural as a separate polysyllabic base", () => {
    expect(engine.predict("reuses")).toBe("ɹiˈjusəz");
    expect(engine.predict("reuses", "en-US", "N")).toBe("ɹiˈjusəz");
  });
  it.each(["ADJ", "NN", "IN"])("composes the verb root inside an adjective with supplied %s", pos => {
    expect(engine.predict("reproducible", "en-US", pos)).toBe("ˌɹipɹəˈdusəbəɫ");
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The result is reproducible.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "reproducible")?.phoneme).toBe("ˌɹipɹəˈdusəbəɫ");
  });
  it("retains a vouched whole stem before decomposing its plural-shaped verb", () => {
    expect(engine.predict("represents")).toBe("ˌɹɛpɹɪˈzɛnts");
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("She represents the company.", { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === "represents")?.phoneme).toBe("ˌɹɛpɹɪˈzɛnts");
    expect(tokens.filter(token => token.word !== "represents").map(token => token.word)).toEqual(["She", "the", "company", "."]);
  });
  it.each(["Bacteria reproduce.", "These active organisms reproduce.", "Cells reproduce rapidly.", "Bacteria reproduce in water."])("uses verb-root evidence in an intransitive clause: %s", text => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(text, { language: "en-US", returnArray: true });
    expect(withoutSecondary(tokens.find(token => token.word === "reproduce")?.phoneme ?? null)).toBe("ɹipɹəˈdus");
    const words = text.replace(/\.$/, "").split(" "), index = words.indexOf("reproduce");
    expect(engine.tagWord("reproduce", { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos).toBe("V");
    if (words.includes("active")) expect(tokens.find(token => token.word === "active")?.phoneme).toBe("ˈæktɪv");
  });

});

test("preserves both readings of the unprefixed root in prose", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize("The produce is fresh. They produce fresh food.", { language: "en-US", returnArray: true });
  expect(tokens.filter(token => token.word === "produce").map(token => token.phoneme)).toEqual(["ˈpɹoʊdus", "pɹəˈdus"]);
});

test("does not replace a caller's complete target pronunciation", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("reproduce", "ˈzɛŋ");
  expect(engine.predict("reproduce")).toBe("ˈzɛŋ");
});

test("preserves noun/verb stress in an unrelated ense root", () => {
  const engine = new EnglishG2P();
  expect(withoutSecondary(engine.predict("incense", "en-US", "N"))).toBe("ˈɪnsɛns");
  expect(withoutSecondary(engine.predict("incense", "en-US", "V"))).toBe("ɪnˈsɛns");
});

test("recognizes an ally adverb before an independently vouched verb", () => {
  const engine = new EnglishG2P(), words = ["They", "really", "reproduce"];
  expect(engine.tagWord("really", { prev: "They", next: "reproduce", sentence: { words, index: 1 } }).pos).toBe("ADV");
});

test.each(["Profitable reexport is legal", "Profitable reexport continues", "Legal reexport continues"])("retains a nominal re- subject: %s", text => {
  const engine = new EnglishG2P(), words = text.split(" ");
  expect(engine.tagWord("reexport", { prev: words[0], next: words[2], sentence: { words, index: 1 } }).pos).toBe("N");
});
