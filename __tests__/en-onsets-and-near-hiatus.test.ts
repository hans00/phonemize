import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("onsets and NEAR hiatus (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each([
    ["fbi", /ɛfbiaɪ$/], ["cpu", /sipiju$/], ["dna", /diɛneɪ$/], ["mba", /ɛmbieɪ$/],
  ] as const)("%s spells its letters", (word, segments) => {
    expect(g2p.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toMatch(segments);
  });
  test("fallback letter spelling has a single final primary stress", () => {
    const ipa = g2p.predict("fbi", "en")!;
    expect(ipa.match(/ˈ/g)).toHaveLength(1);
    expect(ipa).toMatch(/ˈaɪ$/);
  });
  test("native digraphs and loan onsets retain a spoken onset", () => {
    for (const [word, onset] of [["who", /^h/], ["rho", /^ɹ/], ["gnu", /^n/]] as const)
      expect(g2p.predict(word, "en")!.replace(/[ˈˌ]/g, "")).toMatch(onset);
    expect(g2p.predict("pty", "en")).toMatch(/taɪ$/);
    // Sri also has a supplied abbreviation reading; its rule onset stays spoken.
    if (disableDict) expect(g2p.predict("sri", "en")).toMatch(/^ˈsɹ/);
  });
  test("custom pronunciations precede the new onset fallback", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("fbi", "F AA1 B IY0");
    expect(custom.predict("fbi", "en")).toMatch(/fɑbi$/);
  });
  test("anger and its inflections retain the complete hard-ng root", () => {
    for (const word of ["anger", "angers", "angered", "angering"])
      expect(g2p.predict(word, "en")).toMatch(/^ˈæŋɡɝ/);
  });
  test("soft-ng and ordinary ng boundaries remain distinct", () => {
    for (const word of ["danger", "ranger", "stranger"])
      expect(g2p.predict(word, "en")).toMatch(/ndʒɝ$/);
    expect(g2p.predict("singer", "en")).toMatch(/ɪŋɝ$/);
  });
  test.each(["period", "material", "bacterial", "experience", "interior", "exterior", "superior", "ulterior"])("%s retains the strong NEAR nucleus", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈ[^ˈ]*ɪɹi/);
  });
  test("weak ior/iour after n and v supplies a glide", () => {
    for (const word of ["junior", "senior", "savior", "saviour", "behavior", "behaviour", "misbehavior"])
      expect(g2p.predict(word, "en")).toMatch(/[nv]jɝ/);
    expect(g2p.predict("warrior", "en")).toMatch(/ɹiɝ$/);
    expect(g2p.predict("interior", "en")).toMatch(/ɹiɝ$/);
  });
  test("ontal derivatives keep root stress rather than citation-stem stress", () => {
    expect(g2p.predict("horizontal", "en")).toMatch(/ˈzɑnt/);
    expect(g2p.predict("periodontal", "en")).toMatch(/ˈdɑnt/);
  });
  test("aerial and stereo retain their contrasting e nuclei", () => {
    expect(g2p.predict("aerial", "en")).toMatch(/^ˈɛɹi/);
    expect(g2p.predict("stereo", "en")).toMatch(/^ˈstɛɹi/);
  });
});

test("public API preserves spelled onsets and NEAR roots", () => {
  expect(toIPA("fbi")).toMatch(/ɛfˌ?biˈaɪ$/);
  expect(toIPA("superior")).toMatch(/ˈpɪɹi/);
});
