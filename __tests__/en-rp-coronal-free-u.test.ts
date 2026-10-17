import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
test.each([false, true])(
  "preserves the historical RP yod contrast (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    for (const [word, us, gb] of [
      ["newly", "ˈnuɫi", "ˈnjuɫi"],
      ["news", "ˈnuz", "ˈnjuz"],
      ["newspaper", "ˈnuzˌpeɪpɝ", "ˈnjuzˌpeɪpə"],
      ["newsletter", "ˈnuzˌɫɛtɝ", "ˈnjuzˌɫɛtə"],
      ["dues", "ˈduz", "ˈdjuz"],
      ["durable", "ˈdʊɹəbəɫ", "ˈdjʊɹəbəɫ"],
    ]) {
      expect(e.predict(word, "en-US")).toBe(us);
      expect(e.predict(word, "en-GB")).toBe(gb);
    }
    for (const word of ["dude", "duvet"])
      expect(e.predict(word, "en-GB")).not.toMatch(/^ˈ?dju/);
    e.addPronunciation("newly", "ˈzɛmp");
    expect(e.predict("newly", "en-GB")).toBe("ˈzɛmp");
  },
);
test("preserves explicit noun, adjective and verb controls", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, word, ipa] of [
    ["The present moment matters.", "present", "ˈpɹɛzənt"],
    ["They present the award.", "present", "pɹɪˈzɛnt"],
    ["The record was clear.", "record", "ˈɹɛkɝd"],
  ])
    expect(
      api
        .phonemize(sentence, { language: "en-US", returnArray: true })
        .find((t) => t.word === word)?.phoneme,
    ).toBe(ipa);
});
