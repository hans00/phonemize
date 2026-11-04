import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("weak /ɪ/ in the -acquisition spelling family", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["acquisition", "ˌækwəˈzɪʃən"],
    ["acquisitions", "ˌækwəˈzɪʃənz"],
  ])("uses the reduced <qui> in %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each(["reacquisition", "microacquisition"])(
    "composes with the -acquisition morpheme in OOV form %s",
    (word) => expect(g2p.predict(word, "en-US")).toMatch(/kwəˈzɪʃən/),
  );

  it.each([
    ["acquire", "əˈkwaɪɹ"],
    ["acquisitive", "əˈkwɪzətɪv"],
    ["inquisition", "ˌɪnkwɪˈzɪʃən"],
    ["inquisitive", "ɪnˈkwɪzətɪv"],
  ])("preserves neighboring <qui> readings in %s", (word, ipa) => {
    // Merriam-Webster records acquire with optional schwa before /r/.
    const readings = word === "acquire" ? [ipa, "əˈkwaɪɝ"] : [ipa];
    expect(readings).toContain(g2p.predict(word, "en-US"));
  });

  it("keeps the acquisition/inquisition contrast in a sentence", () => {

    const tokens = englishTokens(g2p, "The acquisition followed an inquisition.");
    expect(tokens.find(token => token.word === "acquisition")?.phoneme).toBe("ˌækwəˈzɪʃən");
    expect(tokens.find(token => token.word === "inquisition")?.phoneme).toBe("ˌɪnkwɪˈzɪʃən");
  });
});
