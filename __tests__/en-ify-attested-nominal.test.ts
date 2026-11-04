import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("-ify from an independently attested nominal (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  test.each([
    ["notify", "ˈnoʊtəˌfaɪ"],
    ["falsify", "ˈfɔɫsəˌfaɪ"],
    ["modify", "ˈmɑdəˌfaɪ"],
    ["ratify", "ˈɹætəˌfaɪ"],
    ["pacify", "ˈpæsəˌfaɪ"],
  ])("keeps the stem vowel in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  test.each(["N", "ADJ", "V"])("retains a supplied %s reading", pos => {
    expect(engine.predict("notify", "en-US", pos)).toBe("ˈnoʊtəˌfaɪ");
  });

  test("keeps the vowel in full sentences and inflections", () => {
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, word] of [
      ["They notify the committee.", "notify"],
      ["She notified the committee.", "notified"],
      ["They are notifying the committee.", "notifying"],
    ]) {
      const output = api.phonemize(sentence, { language: "en-US", returnArray: true });
      expect(output.find(token => token.word === word)?.phoneme).toMatch(/^ˈnoʊt/);
    }
  });
});
