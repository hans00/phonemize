import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

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
});

test("public suffix composition keeps the restored root and weak vowel", () => {
  expect(toIPA("reliable")).toMatch(/aɪ/);
  expect(toIPA("entrance")).toMatch(/ɛntɹəns/);
  expect(toIPA("methodology")).toMatch(/θəˈdɑ/);
});
