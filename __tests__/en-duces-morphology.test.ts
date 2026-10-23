import EnglishG2P from "../src/en/g2p";

describe("verbal -duce inflections", () => {
  const processor = new EnglishG2P({ disableDict: true });

  it("uses the verb stem for the productive third-person form of produce", () => {
    expect(processor.predict("produces", "en-US")).toBe("pɹəˈdusəz");
    expect(processor.trace("produces", "en-US").path).toBe("morphology");
  });

  it("keeps the noun and neighboring verbal -duce forms distinct", () => {
    expect(processor.predict("produce", "en-US")?.replace(/[ˈˌ]/g, "")).toBe("pɹoʊdus");
    expect(processor.predict("reduces", "en-US")).toBe("ɹəˈdusəz");
    expect(processor.predict("introduces", "en-US")).toBe("ˌɪntɹəˈdusəz");
    expect(processor.predict("deduces", "en-US")).toBe("dɪˈdusəz");
    expect(processor.predict("seduces", "en-US")).toBe("sɪˈdusəz");
  });

  it("applies the weak pro- root to regular -s forms without a noun homograph", () => {
    expect(processor.predict("proceeds", "en-US")).toBe("pɹəˈsidz");
    expect(processor.predict("provides", "en-US")).toBe("pɹəˈvaɪdz");
    expect(processor.predict("productives", "en-US")).toBe("pɹəˈdʌktɪvz");
    expect(processor.predict("promotionals", "en-US")).toBe("pɹəˈmoʊʃənəɫz");
    expect(processor.predict("progresses", "en-US")).toBe("ˈpɹɑˌɡɹɛsəz");
    expect(processor.predict("processes", "en-US")).toBe("ˈpɹɑˌsɛsəz");
  });
});
