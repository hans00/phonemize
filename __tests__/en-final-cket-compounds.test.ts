import EnglishG2P from "../src/en/g2p";

describe("-cket quantity compounds", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it("keeps the full noun suffix in the -cketful quantity class", () => {
    expect(rules.predict("pocketful", "en-US")).toBe("ˈpɑkɪtˌfʊɫ");
    expect(rules.predict("pocketfuls", "en-US")).toBe("ˈpɑkɪtˌfʊɫz");
  });

  it("leaves adjective -ful compounds weak", () => {
    expect(rules.predict("hopeful", "en-US")).toBe("ˈhoʊpfəɫ");
    expect(rules.predict("harmful", "en-US")).toBe("ˈhɑɹmfəɫ");
    expect(rules.predict("create-a-book", "en-US")).toBe("kɹieɪˈtɛəbʊk");
  });
});
