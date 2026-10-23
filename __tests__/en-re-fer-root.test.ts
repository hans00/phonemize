import EnglishG2P from "../src/en/g2p";

describe("the weak re- allomorph before the fer verb root", () => {
  const rules = new EnglishG2P({ disableDict: true });
  const runtime = new EnglishG2P();

  it.each([
    ["refer", "ɹɪˈfɝ"],
    ["refers", "ɹɪˈfɝz"],
    ["referred", "ɹɪˈfɝd"],
    ["referring", "ɹɪˈfɝɪŋ"],
    ["referral", "ɹɪˈfɝəɫ"],
    ["referrals", "ɹɪˈfɝəɫz"],
  ])("carries /ɪ/ through %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
    expect(runtime.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["reference", "ˈɹɛfɝəns"],
    ["referent", "ˈɹɛfɝənt"],
    ["reframe", "ɹiˈfɹeɪm"],
  ])("preserves the separate %s reading", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
    expect(runtime.predict(word, "en-US")).toBe(expected);
  });

  it.each([
    ["referee", "ɹiˈfɛɹi", "ˌɹɛfɝˈi"],
    ["rephrase", "ɹɛˈfɹeɪz", "ɹiˈfɹeɪz"],
  ])("keeps the existing route for %s", (word, ruleExpected, runtimeExpected) => {
    expect(rules.predict(word, "en-US")).toBe(ruleExpected);
    expect(runtime.predict(word, "en-US")).toBe(runtimeExpected);
  });
});
