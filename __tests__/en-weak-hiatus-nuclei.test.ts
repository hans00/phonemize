import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("weak hiatus nuclei (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test("ia keeps a weak second nucleus before its sonorant or s coda", () => {
    for (const word of ["bias", "dial", "giant", "trial"])
      expect(g2p.predict(word)).toMatch(/aɪə/);
    for (const word of ["liar", "diary"])
      expect(g2p.predict(word)).toMatch(/aɪ(?:ɝ|əɹ)/);
    expect(g2p.predict("triad")?.replace(/[ˈˌ]/g, "")).toMatch(/aɪæd/);
    expect(g2p.predict("fiat")?.replace(/[ˈˌ]/g, "")).toMatch(/[iɪ]æt/);
  });
  test("ia inflections retain the root nucleus after exception eviction", () => {
    for (const word of ["biased", "biases", "dialed", "dialing", "dials", "giants"])
      expect(g2p.predict(word)).toMatch(/aɪə/);
  });
  test("bare oe has hiatus before m/t but not a borrowed consonant cluster", () => {
    for (const word of ["poem", "poems", "poet", "poets", "poetry"])
      expect(g2p.predict(word)).toMatch(/oʊə/);
    for (const word of ["bloem", "goetting", "koetting"])
      expect(g2p.predict(word)).not.toMatch(/oʊə/);
  });
  test("uel retains the second nucleus without inventing it in doubled ll", () => {
    for (const word of ["fuel", "fuels", "fueled", "duel", "duels", "cruel", "gruel"])
      expect(g2p.predict(word)).toMatch(/u[əɪ][lɫ]/);
    expect(g2p.predict("fueling")).toMatch(disableDict ? /uə[lɫ]/ : /u[əɪ]?[lɫ]/);
    for (const word of ["duell", "mueller", "cuellar"])
      expect(g2p.predict(word)).not.toMatch(/uə[lɫ]/);
  });
  test("rhotic able restores an attested silent-e root", () => {
    for (const word of ["desirable", "desirably", "undesirable"])
      expect(g2p.predict(word)).toMatch(/zaɪ[ɹɝ]/);
    expect(g2p.predict("admirable")).toMatch(/^ˈædm[ɝɹ]/);
    expect(g2p.predict("comparable")).toMatch(/^ˈkɑmp[ɝɹ]/);
  });
});

test("public API preserves the weak hiatus nuclei", () => {
  expect(toIPA("dial")).toMatch(/aɪə/);
  expect(toIPA("poetry")).toMatch(/oʊə/);
  expect(toIPA("fuel")).toMatch(/uə/);
});
