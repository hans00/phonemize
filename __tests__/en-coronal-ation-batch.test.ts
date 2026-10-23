import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};
describe.each([false, true])("coronal weak vowel before -ation (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["medication", "mɛdəˈkeɪʃən"], ["litigation", "lɪtəˈɡeɪʃən"],
    ["adjudication", "əˌdʒudəˈkeɪʃən"],
  ])("reduces the newly pretonic vowel in %s", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });
  it.each([
    ["medicate", disableDict ? "ˈmɛdəkeɪt" : "ˈmɛdɪkeɪt"], ["litigate", "ˈlɪtəɡeɪt"],
    ["lubrication", "lubɹɪˈkeɪʃən"], ["vacation", "veɪˈkeɪʃən"],
  ])("preserves the unaffected stem or environment in %s", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });
  it("preserves caller ownership of the complete noun", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("medication", "ˈzɛŋ");
    expect(custom.predict("medication")).toBe("ˈzɛŋ");
  });
  it("keeps noun, adjective and verb readings in full prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const result = api.phonemize("The clever reader will work before litigation.", {
      language: "en-US", returnArray: true,
    });
    for (const [word, ipa] of [["work", "wɝk"], ["litigation", "lɪtəˈɡeɪʃən"]])
      expect(reading(result.find(token => token.word === word)!.phoneme)).toEqual(reading(ipa));
    expect(result.find(token => token.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(result.find(token => token.word === "reader")?.phoneme).toBe("ˈɹidɝ");
  });
});
