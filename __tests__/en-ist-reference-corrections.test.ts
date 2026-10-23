import EnglishG2P from "../src/en/g2p";
import dictionary = require("../data/en/dict.json");

const corrected = [
  ["artist", "ˈɑɹtɪst"],
  ["tourist", "ˈtʊɹɪst"],
  ["specialist", "ˈspɛʃəɫɪst"],
  ["florist", "ˈfɫɔɹɪst"],
  ["florists", "ˈfɫɔɹɪsts"],
  ["baptist", "ˈbæptɪst"],
  ["terrorists", "ˈtɛɹɝɪsts"],
  ["journalist", "ˈdʒɝnəɫɪst"],
  ["dentists", "ˈdɛntɪsts"],
  ["communist", "ˈkɑmjənɪst"],
  ["therapist", "ˈθɛɹəpɪst"],
  ["chemists", "ˈkɛmɪsts"],
  ["tourists", "ˈtʊɹɪsts"],
  ["specialists", "ˈspɛʃəɫɪsts"],
  ["baptists", "ˈbæptɪsts"],
  ["baptists'", "ˈbæptɪsts"],
  ["communists", "ˈkɑmjənɪsts"],
  ["communists'", "ˈkɑmjənɪsts"],
  ["journalists", "ˈdʒɝnəɫɪsts"],
  ["journalists'", "ˈdʒɝnəɫɪsts"],
  ["specialists'", "ˈspɛʃəɫɪsts"],
] as const;

describe("Cambridge US references for -ist words", () => {
  it.each(corrected)("%s follows the independently checked reference", (word, ipa) => {
    expect(dictionary[word]).toBe(ipa);
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
  });

  it.each(corrected.filter(([word]) => word !== "florists"))(
    "%s remains consistent with the general -ist rule path",
    (word, ipa) => {
      expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
    },
  );

  it.each([
    ["chemist", "ˈkɛmɪst"],
    ["scientist", "ˈsaɪəntɪst"],
    ["artists", "ˈɑɹtɪsts"],
  ])("preserves already-correct -ist controls: %s", (word, ipa) => {
    expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
  });
});
