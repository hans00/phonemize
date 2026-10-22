import EnglishG2P from "../src/en/g2p";

describe("weak final vowel in the medicine compound root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["medicine", "ˈmɛdəsən"],
    ["medicine's", "ˈmɛdəsənz"],
    ["medicines", "ˈmɛdəsənz"],
    ["telemedicine", "ˌtɛɫəˈmɛdəsən"],
    ["telemedicines", "ˌtɛɫəˈmɛdəsənz"],
    ["genemedicine", "ˌdʒɛnəˈmɛdəsən"],
    ["genemedicines", "ˌdʒɛnəˈmɛdəsənz"],
  ])("keeps the final root vowel weak in %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
    if (["medicine", "telemedicine", "genemedicine"].includes(word))
      expect(rules.trace(word, "en-US").path).toBe("rules");
    if (["medicines", "telemedicines", "genemedicines"].includes(word))
      expect(rules.trace(word, "en-US").path).toBe("morphology");
  });

  it.each([
    ["medicinal", "məˈdɪsənəɫ"],
    ["medic", "ˈmɛdɪk"],
    ["vaccine", "ˈvæksɪn"],
    ["plasticine", "ˈpɫæstɪsɪn"],
    ["biocine", "ˈbaɪoʊsɪn"],
  ])("preserves neighboring reading %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });
});
