import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Fused comparative phrases (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  it.each([
    ["nevertheless", "ˌnɛvɝðəˈɫɛs"], ["nonetheless", "ˌnʌnðəˈɫɛs"],
    ["allthemore", "ˌɔɫðəˈmɔɹ"], ["nonethemore", "ˌnʌnðəˈmɔɹ"],
  ])("retains the article and full comparative in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it.each(["heartless", "ruthless", "breathless", "worthless", "blitheless", "scatheless", "seetheless", "absintheless"])(
    "retains the weak adjective suffix in %s", word => {
      expect(engine.predict(word)).toMatch(/ɫ[əɪ]s$/);
      expect(engine.predict(word)).not.toContain("ðəˈɫɛs");
    });

  it("preserves noun, adjective and verb readings in a complete sentence", () => {
    const tokens = api.phonemize("Nevertheless, the fearless reader will read the record.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(t => t.word === "Nevertheless")?.phoneme).toBe("ˌnɛvɝðəˈɫɛs");
    expect(tokens.find(t => t.word === "fearless")?.phoneme).toMatch(/ɫ[əɪ]s$/);
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "read")?.phoneme).toBe(engine.predict("read", "en-US", "V"));
    expect(tokens.find(t => t.word === "record")?.phoneme).toBe(engine.predict("record", "en-US", "N"));
  });
});
