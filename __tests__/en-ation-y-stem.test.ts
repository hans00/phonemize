import EnglishG2P from "../src/en/g2p";

describe("-ation restores a final y stem before composing", () => {
  it("uses vary rather than the unrelated i-final Vari entry for variation", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("variation", "en-US")).toBe("ˌvɛɹiˈeɪʃən");
  });

  it("preserves y-stem derivatives and unrelated -ation controls", () => {
    const rules = new EnglishG2P({ disableDict: true });
    for (const [word, ipa] of [
      ["vary", "ˈvɛɹi"], ["varied", "ˈvɛɹid"], ["varies", "ˈvɛɹiz"],
      ["varying", "ˈvɛɹiɪŋ"], ["variety", "vɝˈaɪəti"],
      ["variations", "ˌvɛɹiˈeɪʃənz"],
      ["aviation", "ˌeɪviˈeɪʃən"], ["radiation", "ˌɹeɪdiˈeɪʃən"],
      ["initiation", "ɪˌnɪʃiˈeɪʃən"], ["variate", "ˈvɛɹiˌeɪt"],
    ]) expect(rules.predict(word, "en-US")).toBe(ipa);
  });
});
