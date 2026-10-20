import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("negative-prefix /tɪd/ ending, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it("restores the regular -ed vowel in un-, dis- and non- morphology", () => {
    for (const word of [
      "uncollected", "unlimited", "unexpected", "uncharted", "discontented", "disinvited",
    ]) expect(engine.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
  });

  it("preserves plain -ed controls and prefixed stems without a matching suffix", () => {
    for (const word of ["unwanted", "unlisted", "painted", "wanted"])
      expect(engine.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
  });

  it("keeps an evicted polysyllabic verb root available under un- + -ed", () => {
    expect(engine.predict("unheralded", "en")).toBe("ənˈhɛɹəɫdɪd");
  });
});

it("keeps negative-prefix -ed readings in complete sentences", () => {
  const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const sentence = "The unexpected storm left an unlimited flood and an uncollected notice.";
  const tokens = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true });
  for (const word of ["unexpected", "unlimited", "uncollected"])
    expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/tɪd$/);
});
