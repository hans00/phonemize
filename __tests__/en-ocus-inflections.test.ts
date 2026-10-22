import EnglishG2P from "../src/en/g2p";

describe("-ocus inflections keep the unstressed /əs/ stem", () => {
  it.each([false, true])("composes focus derivatives without restoring a silent e (rules=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });
    for (const [word, expected] of [
      ["focused", "ˈfoʊkəst"],
      ["focusing", "ˈfoʊkəsɪŋ"],
      ["refocused", "ɹiˈfoʊkəst"],
      ["refocusing", "ɹiˈfoʊkəsɪŋ"],
      ["refocuses", "ɹiˈfoʊkəsəz"],
    ]) {
      expect(g2p.predict(word, "en-US")).toBe(expected);
      expect(g2p.trace(word, "en-US").path).toBe("morphology");
    }
  });

  it.each([
    ["focus", "ˈfoʊkəs"],
    ["accused", "əkˈjuzd"],
    ["accusing", "əkˈjuzɪŋ"],
    ["refused", "ɹɪˈfjuzd"],
    ["used", "ˈjuzd"],
    ["using", "ˈjuzɪŋ"],
  ])("preserves the root or silent-e control %s", (word, expected) => {
    expect(new EnglishG2P().predict(word, "en-US")).toBe(expected);
  });
});
