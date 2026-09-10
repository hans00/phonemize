import EnG2P from "../src/en/g2p";

// Rule-path regressions for the `s` voicing frames added in the 2026-09
// heuristic-learning pass. Every case is a rule, not a word: the word
// named is the class exemplar, and each frame was measured over the full
// dict (win/loss on the rules-only dump) before adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("-se on a consonant + open u stem voices", () => {
  it.each([
    ["fuse", "ˈfjuz"],
    ["muse", "ˈmjuz"],
    ["ruse", "ˈɹuz"],
  ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps /s/ where the stem is longer than u|se", () => {
    expect(rules("use")).toBe("ˈjus");
    expect(rules("abuse")).toBe("əˈbjus");
  });
});

describe("s opening a syllable after an open one", () => {
  it.each([
    ["chosen", "ˈtʃoʊzən"],
    ["rosen", "ˈɹoʊzən"],
    ["cosey", "ˈkoʊzi"],
    ["mosey", "ˈmoʊzi"],
    ["rosie", "ˈɹoʊzi"],
    ["hosie", "ˈhoʊzi"],
    ["reason", "ˈɹizən"],
    ["season", "ˈsizən"],
    ["treason", "ˈtɹizən"],
    ["peasant", "ˈpɛzənt"],
    ["pheasant", "ˈfɛzənt"],
    ["pleasant", "ˈpɫɛzənt"],
    ["easel", "ˈizəɫ"],
    ["weasel", "ˈwizəɫ"],
    ["feasible", "ˈfizəbəɫ"],
    ["paisley", "ˈpeɪzɫi"],
    ["beasley", "ˈbizɫi"],
    ["keesler", "ˈkizɫɝ"],
    ["visit", "ˈvɪzɪt"],
    ["revisit", "ɹiˈvɪzɪt"],
    ["visitor", "ˈvɪzɪtɝ"],
    ["visible", "ˈvɪzəbəɫ"],
    ["divisible", "dɪˈvɪzəbəɫ"],
    ["depository", "dɪˈpɑzəˌtɔɹi"],
    ["music", "ˈmjuzɪk"],
  ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the ea tails that keep /s/ alone", () => {
    expect(rules("easter")).toBe("ˈistɝ");
    expect(rules("measure")).toBe("ˈmɛʒɝ");
    expect(rules("base")).toBe("ˈbeɪs");
  });
});

describe("s after an ab-/ob-/de- prefix before a -serv-/-sorb- stem", () => {
  it.each([
    ["deserve", "dɪˈzɝv"],
    ["desertion", "dɪˈzɝʃən"],
    ["observe", "əbˈzɝv"],
  ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});

describe("-ser on an oe/ey/oo name base voices", () => {
  it.each([
    ["loeser", "ˈɫoʊzɝ"],
    ["heyser", "ˈheɪzɝ"],
  ])("%s -> %s", (word, ipa) => expect(rules(word)).toBe(ipa));
});
