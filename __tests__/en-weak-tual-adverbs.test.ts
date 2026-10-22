import EnglishG2P from "../src/en/g2p";

describe("expanded /u/ in -tual adverbs", () => {
  it.each([
    ["actually", "ˈæktʃuəɫi"],
    ["perceptually", "pɝˈsɛptʃuəɫi"],
  ])("preserves the spelled /u/ in %s on the rule path", (word, ipa) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    // Cambridge US /ɪˈven.tʃu.ə.li/; corrects the old IPA-Dict onset-vowel reading.
    ["eventually", "ɪˈvɛntʃuəɫi"],
    ["factually", "ˈfæktʃuəɫi"],
    ["habitually", "həˈbɪtʃuəɫi"],
    ["virtually", "ˈvɝtʃuəɫi"],
  ])("preserves neighboring -tual readings: %s", (word, ipa) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(ipa);
  });
});
