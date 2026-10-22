import EnglishG2P from "../src/en/g2p";

describe("regular plurals of line compounds", () => {
  it.each([false, true])("keeps the verified compound in the stem (disableDict=%s)", disableDict => {
    const g2p = new EnglishG2P({ disableDict });

    expect(g2p.predict("guideline", "en")).toBe("ˈɡaɪdˌɫaɪn");
    expect(g2p.predict("guidelines", "en")).toBe("ˈɡaɪdˌɫaɪnz");
    expect(g2p.predict("sidelines", "en")).toBe("ˈsaɪdˌɫaɪnz");
    expect(g2p.predict("lifelines", "en")).toBe("ˈɫaɪfˌɫaɪnz");
    expect(g2p.predict("pipelines", "en")).toBe("ˈpaɪpˌɫaɪnz");
    expect(g2p.predict("baselines", "en")).toBe("ˈbeɪsˌɫaɪnz");
    expect(g2p.predict("timelines", "en")).toBe("ˈtaɪmˌɫaɪnz");
    expect(g2p.predict("headlines", "en")).toBe("ˈhɛdˌɫaɪnz");
  });
});
