import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("of pronunciation, rules-only=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  it("voices the final fricative in the function word of", () => {
    expect(api.toIPA("of", "en-US")).toBe("ˈʌv");
    expect(api.phonemize("a cup of tea", { language: "en-US", returnArray: true }).map(token => token.phoneme))
      .toContain("əv");
  });

  it.each(["off", "office", "offer", "proof", "roof", "aloof"])(
    "keeps the lexical coda in %s",
    word => {
      expect(api.toIPA(word, "en-US")).not.toMatch(/v$/);
    },
  );
});
