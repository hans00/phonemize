import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("the woman/women inflection changes the <wo> vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    // Merriam-Webster gives /ˈwʊmən/ and plural /ˈwɪmən/.
    ["woman", "ˈwʊmən"],
    ["women", "ˈwɪmən"],
  ])("uses the inflection-supported reading in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["womanly", "ˈwʊmənɫi"],
    ["womanhood", "ˈwʊmənˌhʊd"],
    ["chairwoman", "ˈtʃɛɹˌwʊmən"],
    ["chairwomen", "ˈtʃɛɹˌwɪmən"],
    ["fireman", "ˈfɪɹɪmən"],
    ["firemen", "ˈfaɪɝˌmɛn"],
  ])("preserves the neighboring morphology in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps singular and plural readings in sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    expect(api.phonemize("The woman spoke to the women.", { language: "en-US" })).toBe(
      "ðə ˈwʊmən spoʊk tə ðə ˈwɪmən.",
    );
  });

  it("leaves the shipped dictionary readings unchanged", () => {
    const g2p = new EnglishG2P();
    expect(g2p.predict("woman", "en-US")).toBe("ˈwʊmən");
    expect(g2p.predict("women", "en-US")).toBe("ˈwɪmən");
  });
});
