import EnglishG2P from "../src/en/g2p";

describe("Latinate -ductory retains its -duct root stress", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("matches the standard stress and weak intro- vowel in introductory", () => {
    expect(rules.predict("introductory", "en-US")).toBe("ˌɪntɹəˈdʌktɝi");
  });

  it("carries the corrected root through -ly and leaves introduction stable", () => {
    expect(rules.predict("introductorily", "en-US")).toBe("ˌɪntɹəˈdʌktɝəɫi");
    expect(rules.predict("introduction", "en-US")).toBe("ˌɪntɹəˈdʌkʃən");
  });

  it.each([
    ["laboratory", "ɫəˈbɔɹəˌtɔɹi"],
    ["satisfactory", "ˌsætɪsˈfæktɝi"],
    ["territory", "ˈtɛɹəˌtɔɹi"],
  ])("does not change the neighboring -tory pattern in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the shipped dictionary pronunciation of introductory", () => {
    expect(new EnglishG2P().predict("introductory", "en-US")).toBe("ˌɪntɹəˈdʌktɝi");
  });
});
