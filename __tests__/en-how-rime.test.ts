import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("MOUTH in the initial independent <h> + <ow> rime", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["how", "ˈhaʊ"],
    ["somehow", "ˈsʌmˌhaʊ"],
    ["anyhow", "ˈɛniˌhaʊ"],
    ["however", "ˌhaʊˈɛvɝ"],
  ])("uses MOUTH for %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["show", "ˈʃoʊ"],
    ["snow", "ˈsnoʊ"],
    ["throw", "ˈθɹoʊ"],
    ["slow", "ˈsɫoʊ"],
  ])("preserves GOAT in neighboring <ow> rimes: %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the independent onset in Howard and howitzer", () => {
    expect(g2p.predict("Howard", "en-US")).toBe("ˈhaʊɝd");
    expect(g2p.predict("howitzer", "en-US")).toMatch(/^haʊ/);
  });

  it("keeps the bound rime in sentence context", () => {
    const api = createPhonemizer({ processors: [g2p] });
    const tokens = api.phonemize("How, somehow, did the show end?", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "How")?.phoneme).toBe("haʊ");
    expect(tokens.find(token => token.word === "somehow")?.phoneme).toContain("ˌhaʊ");
    expect(tokens.find(token => token.word === "show")?.phoneme).toBe("ʃoʊ");
  });
});
