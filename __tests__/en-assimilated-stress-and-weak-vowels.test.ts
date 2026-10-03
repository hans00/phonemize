import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("assimilated stress and weak vowels (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["assess", "assign", "attach", "attack", "attempt", "attend", "attract"])("%s gives stress to its heavy root", word => {
    expect(g2p.predict(word, "en")).toMatch(/^əˈ[st]/);
  });
  test.each(["asset", "attic"])("%s retains initial stress over a light root", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈæ/);
  });
  test.each(["adolescent", "adolescence", "evanescence", "convalescent"])("%s stresses its inchoative ending", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈ[lɫn]ɛsən/);
  });
  test("descent retains its short-word stress", () => {
    expect(g2p.predict("descent", "en")).toMatch(/ˈsɛnt$/);
  });
  test("crescent retains its first stressed nucleus", () => {
    expect(g2p.predict("crescent", "en")).toMatch(/^ˈkɹɛ/);
  });
  test.each(["eligible", "intelligible", "intelligent"])("%s centralizes its weak thematic i", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɛ[lɫ]ədʒ/);
  });
  test("ineligible retains its root stress and the supplied lexical vowel", () => {
    const ipa = g2p.predict("ineligible", "en");
    expect(ipa).toMatch(/ˈn?ɛ[lɫ]/);
    expect(ipa).toMatch(disableDict ? /ɛ[lɫ]ədʒ/ : /ɛ[lɫ][əɪ]dʒ/);
  });
  test("legible retains stress on its short root", () => {
    expect(g2p.predict("legible", "en")).toMatch(/^ˈ[lɫ]ɛdʒ/);
  });
  test.each(["operator", "moderator", "interaction", "literary", "peripheral"])("%s coalesces weak e with r", word => {
    expect(g2p.predict(word, "en")).toContain("ɝ");
    expect(g2p.predict(word, "en")).not.toContain("ɪɹ");
  });
  test.each(["petition", "peninsula"])("%s centralizes its weak pe-", word => {
    expect(g2p.predict(word, "en")).toMatch(/^pə/);
  });
  test.each(["decide", "defend"])("%s retains the distinct de- prefix", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˌ?dɪ/);
  });
  test.each(["believe", "begin"])("%s retains the distinct be- prefix", word => {
    expect(g2p.predict(word, "en")).toMatch(/^bɪ/);
  });
  test("political shifts stress from its citation stem", () => {
    expect(g2p.predict("political", "en")).toMatch(/^pəˈ[lɫ]ɪ/);
  });
});

// Exercise the public composition path against the independent CMU gains.
test.each(["open", "opening", "opened", "happened"])("%s retains the weak root vowel through the public API", word => {
  expect(toIPA(word)).toContain("pən");
});
