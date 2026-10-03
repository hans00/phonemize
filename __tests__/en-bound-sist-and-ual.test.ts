import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("bound sist/ual and un- boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test("Latin sist keeps root stress, distinct from a profession suffix", () => {
    for (const word of ["assist", "consist", "desist", "insist", "persist", "resist", "subsist", "assistant", "persistent"])
      expect(g2p.predict(word, "en")).toMatch(/ˈ[sz]ɪst/);
    expect(g2p.predict("artist", "en")).toMatch(/^ˈɑɹt/);
    expect(g2p.predict("cellist", "en")).toMatch(/[ɪə]st$/);
  });
  test("inflections preserve the sist root after exception-table eviction", () => {
    for (const word of ["assisting", "assisted", "consists", "resisting", "persisted", "subsisting", "assister", "persister", "insister", "resister"])
      expect(g2p.predict(word, "en")).toMatch(/ˈ[sz]ɪst/);
  });
  test("vowel-initial adjectives and participles preserve un-", () => {
    for (const word of ["unable", "unavailable", "unexpected", "unusual"])
      expect(g2p.predict(word, "en")?.replace(/[ˈˌ]/g, "")).toMatch(/^[əʌ]n/);
    for (const word of ["universe", "unionize", "unison", "unanimous"])
      expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?ju/);
  });
  test("an attested supplied vowel-initial adjective composes through un-", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("eavable", "IY1 V AH0 B AH0 L");
    expect(custom.predict("uneavable", "en")?.replace(/[ˈˌ]/g, "")).toMatch(/^[əʌ]niv/);
  });
  test("short sual sees intervocalic s and the complete hiatus", () => {
    for (const word of ["usual", "visual", "casual", "usually", "visually", "casually", "visuals", "casualness"])
      expect(g2p.predict(word, "en")).toMatch(/ʒə?wə/);
  });
  test("prefixed tual sees root stress in word context", () => {
    for (const word of ["conceptual", "contractual", "perpetual", "ineffectual", "intellectual"])
      expect(g2p.predict(word, "en")).toMatch(/ˈ[^ˈ]*[ɛæ]/);
    expect(g2p.predict("spiritual", "en")).toMatch(/^ˈspɪɹ/);
    expect(g2p.predict("ritual", "en")).toMatch(/^ˈɹɪ/);
  });
});

test("the public API retains the corrected bound-root and hiatus nuclei", () => {
  expect(toIPA("usual")).toMatch(/ʒə?wə/);
  expect(toIPA("consist")).toMatch(/ˈsɪst/);
  expect(toIPA("unavailable")).toMatch(/^[ˌˈ]?[əʌ]n/);
});
