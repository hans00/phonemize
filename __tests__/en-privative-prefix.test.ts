import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("Privative prefixes (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });

  it.each([
    ["uncertainty", /ˈsɝtənti$/],
    ["undefined", /ˈfaɪnd$/],
    ["unknown", /ˈnoʊn$/],
    ["nonprofit", /ˈpɹɑf[ɪə]t$/],
  ] as const)("preserves the attested root in %s", (word, expected) => {
    expect(g2p.predict(word)).toMatch(expected);
  });

  it("preserves the citation reading of a participial root", () => {
    expect(g2p.predict("unread")).toMatch(/ɹɛd$/);
  });

  it("uses a supplied root in a new non- formation", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("local", "L OW1 K AH0 L");
    expect(custom.predict("nonlocal")).toMatch(/ˈɫoʊkəɫ$/);
  });

  it.each([
    ["unanimous", /^juˈnæ/],
    ["universe", /^ˈju/],
    ["understand", /stænd$/],
  ] as const)("keeps a non-privative boundary in %s", (word, expected) => {
    expect(g2p.predict(word)).toMatch(expected);
  });
});
