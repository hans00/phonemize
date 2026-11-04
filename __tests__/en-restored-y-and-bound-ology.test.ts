import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("restored y and bound suffix context (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test("supplied y stems retain their diphthong before vowel-initial suffixes", () => {
    for (const word of ["reliable", "reliance", "pliable", "justifiable", "verifiable", "identifiable"])
      expect(g2p.predict(word)).toMatch(/aɪ/);
    for (const word of ["variable", "variance"])
      expect(g2p.predict(word)).toMatch(/^ˈvɛɹi/);
  });
  test("bound i stems keep their independent hiatus or palatalization", () => {
    expect(g2p.predict("deviance")).toMatch(/ˈdivi/);
    expect(g2p.predict("invariable")).toMatch(/ˈvɛɹi/);
    expect(g2p.predict("conscience")).toMatch(/nʃəns$/);
    expect(g2p.predict("experience")).toMatch(/ˈpɪɹi/);
  });
  test("a pronounced restored e cannot supply an ance stem", () => {
    expect(g2p.predict("entrance")).toMatch(/^ˈɛntɹəns$/);
    expect(g2p.predict("continuance")).toMatch(/ˈtɪnjuəns$/);
    expect(g2p.predict("issuance")).toMatch(/^ˈɪʃuəns$/);
    expect(g2p.predict("allowance")).toMatch(/ˈ[lɫ]aʊəns$/);
  });
  test("pretonic o retains whole-word reduction before ology", () => {
    expect(g2p.predict("anthropology")).toMatch(/θɹəˈpɑ/);
    expect(g2p.predict("methodology")).toMatch(/mɛθəˈdɑ/);
    expect(g2p.predict("immunology")).toMatch(/m[ˌ]?juˈnɑ/);
    expect(g2p.predict("biology")).toMatch(/baɪˈɑ/);
  });
  test("short vowel-initial roots take -ology stress on the whole spelling", () => {
    expect(g2p.predict("apology")).toMatch(/^əˈpɑɫəˌ?dʒi$/);
    expect(g2p.predict("astrology")).toBe("əˈstɹɑɫədʒi");
    expect(g2p.predict("ecology")).toMatch(/^(?:ɪ|i)ˈkɑɫədʒi$/);
    for (const word of ["astrology", "ecology"]) {
      expect(g2p.predict(word, "en", "NN")).toBe(g2p.predict(word, "en"));
    }
  });
  test("keeps the -ology readings and neighboring controls in sentence context", () => {

    const tokens = englishTokens(g2p, "Ecology and astrology influence biology, technology, and psychology.");
    const ipa = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(ipa("ecology")).toMatch(/^(?:ɪ|i)ˈkɑɫədʒi$/);
    expect(ipa("astrology")).toBe("əˈstɹɑɫədʒi");
    expect(ipa("biology")).toBe("ˌbaɪˈɑɫədʒi");
    expect(ipa("technology")).toBe("ˌtɛknˈɑɫədʒi");
    expect(ipa("psychology")).toBe("ˌsaɪˈkɑɫədʒi");
  });
});

test("public suffix composition keeps the restored root and weak vowel", () => {
  expect(toIPA("reliable")).toMatch(/aɪ/);
  expect(toIPA("entrance")).toMatch(/ɛntɹəns/);
  expect(toIPA("methodology")).toMatch(/θəˈdɑ/);
});
