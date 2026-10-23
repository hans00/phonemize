import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("function-word final s voicing, rules-only=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  it("voices the strong function word as", () => {
    expect(api.toIPA("as", "en-US")).toBe("ˈæz");
  });

  it.each(["gas", "mass", "us", "this"])("keeps the regular coda in %s", word => {
    expect(api.toIPA(word, "en-US")).toMatch(/s$/);
  });

  it("retains weak as in connected speech", () => {
    expect(api.phonemize("It is as good as that.", { language: "en-US", returnArray: true }).map(token => token.phoneme))
      .toContain("əz");
  });
});
