import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("bare -are rime (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  it("uses the strong AmE /ɑr/ only with no onset", () => {
    expect(engine.predict("are")).toBe("ˈɑɹ");
    if (disableDict) expect(engine.trace("are").path).toBe("rules");
  });

  it.each([
    ["care", "ˈkɛɹ"], ["bare", "ˈbɛɹ"], ["share", "ˈʃɛɹ"],
    ["prepare", "pɹiˈpɛɹ"], ["compare", "kəmˈpɛɹ"], ["square", "ˈskwɛɹ"],
  ])("preserves the onset-conditioned SQUARE in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it("keeps the full sentence reading distinct from onset-bearing rimes", () => {
    const phonemizer = createPhonemizer({ processors: [engine] });
    const tokens = phonemizer.phonemize("We are ready, and we care.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "are")?.phoneme).toBe("ɑɹ");
    expect(tokens.find(token => token.word === "care")?.phoneme).toBe("kɛɹ");
  });
});
