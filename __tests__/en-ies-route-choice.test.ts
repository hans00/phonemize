import { EnglishG2P } from "../src/en/g2p";

describe("-ies morphology keeps a whole-word reading when both routes agree apart from one vowel", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("uses the standard /ɪ/ series reading from the direct rule route", () => {
    expect(rules.predict("series", "en")).toBe("ˈsɪɹiz");
  });

  it.each([
    ["queries", "ˈkwɪɹiz"],
    ["countries", "ˈkʌntɹiz"],
    ["batteries", "ˈbætɝiz"],
    ["ministries", "ˈmɪnəstɹiz"],
    ["cranberries", "ˈkɹænbɛɹiz"],
    ["festivities", "fɛˈstɪvətiz"],
  ])("keeps the existing morphology for %s", (word, ipa) => {
    expect(rules.predict(word, "en")).toBe(ipa);
  });
});
