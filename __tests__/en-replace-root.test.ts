import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("compositional replace root", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["replace", "ɹɪˈpɫeɪs"],
    ["replaced", "ɹɪˈpɫeɪst"],
    ["replacement", "ɹɪˈpɫeɪsmənt"],
    ["replacing", "ɹɪˈpɫeɪsɪŋ"],
    ["replaceable", "ɹɪˈpɫeɪsəbəɫ"],
  ])("composes the attested root reading in %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the unrelated re- root reading in replay forms", () => {
    expect(rules.predict("replay", "en-US")).toBe("ɹiˈpɫeɪ");
    expect(rules.predict("replayed", "en-US")).toBe("ɹiˈpɫeɪd");
  });

  it("does not duplicate stress when the root combines with privative ir-", () => {
    expect(rules.predict("irreplaceable", "en-US")).toBe("ˌɪɹəˈpɫeɪsəbəɫ");
  });

  it("retains the verb and noun readings in sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const result = phonemizer.phonemize("They replaced the part with a replacement.", {
      language: "en-US", returnArray: true,
    });
    expect(result.find(token => token.word.toLowerCase() === "replaced")?.phoneme)
      .toBe("ɹɪˈpɫeɪst");
    expect(result.find(token => token.word.toLowerCase() === "replacement")?.phoneme)
      .toBe("ɹɪˈpɫeɪsmənt");
  });
});
