import EnglishG2P from "../src/en/g2p";

describe("nano- combining prefix in rules-only composition", () => {
  const g2p = new EnglishG2P({ disableDict: true });

  it.each([
    ["nanotechnology", "ˌnænoʊtɛkˈnɑɫədʒi"],
    // The standard-source check covers the singular; keep the plural as a
    // morphology control so the combining-prefix branch does not capture it.
    ["nanotechnologies", "ˌnænoʊtɛkˈnɑɫədʒiz"],
    ["nanometer", "ˈnænoʊˌmitɝ"],
    ["nanosecond", "ˈnænoʊˌsɛkənd"],
  ])("composes %s without overriding inflection", (word, ipa) => {
    expect(g2p.predict(word)).toBe(ipa);
  });
});
