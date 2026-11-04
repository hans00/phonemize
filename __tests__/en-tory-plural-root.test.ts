import { EnglishG2P } from "../src/en/g2p";

describe("rule-derived -tory plural stems", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the reduced US root vowel in the rules and default routes", () => {
    expect(rules.predict("territories", "en")).toBe("ˈtɛɹəˌtɔɹiz");
    expect(new EnglishG2P().predict("territories", "en")).toBe("ˈtɛɹəˌtɔɹiz");
  });

  it.each([
    ["dormitories", "ˈdɔɹməˌtɔɹiz"],
    ["repositories", "ɹiˈpɑzəˌtɔɹiz"],
    ["histories", "ˈhɪstɝiz"],
    ["laboratories", "ˈɫæbɹəˌtɔɹiz"],
    ["ministries", "ˈmɪnəstɹiz"],
    ["densities", "ˈdɛnsətiz"],
    ["intensities", "ɪnˈtɛnsətiz"],
  ])("preserves neighboring reading for %s", (word, ipa) => {
    expect(rules.predict(word, "en")).toBe(ipa);
  });

  it("carries the rule-derived schwa root through propensities", () => {
    expect(rules.predict("propensity", "en")).toBe("pɹəˈpɛnsəti");
    expect(rules.predict("propensities", "en")).toBe("pɹəˈpɛnsətiz");
    expect(new EnglishG2P().predict("propensities", "en")).toBe("pɹəˈpɛnsətiz");
  });
});
