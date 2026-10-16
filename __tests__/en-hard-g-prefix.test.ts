import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("en- before native hard-g roots (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["engage", "ɛnˈɡeɪdʒ"], ["engaged", "ɛnˈɡeɪdʒd"],
    ["engaging", "ɛnˈɡeɪdʒɪŋ"], ["engagement", "ɛnˈɡeɪdʒmənt"],
  ])("preserves the prefix boundary in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });

  it.each([
    ["Engert", "ˈɛŋɡɝt"], ["Engquist", "ˈɛŋkwɪst"],
  ])("preserves a different spelling environment in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["English", "England", "congress"])("retains internal assimilation in %s", word => {
    expect(engine.predict(word)).toContain("ŋɡ");
  });
  it("retains assimilation before k", () => {
    expect(engine.predict("think")).toContain("ŋk");
  });

  it("keeps derivations correct if the now rule-exact stem is evicted", () => {
    const fresh = new EnglishG2P({ disableDict });
    const internal = fresh as unknown as { dictionary: Record<string, string> };
    internal.dictionary = { ...internal.dictionary };
    delete internal.dictionary.engage;
    for (const word of ["disengage", "unengage", "nonengage"]) {
      expect(fresh.predict(word)).toMatch(/nˈɡeɪdʒ$/);
    }

    expect(fresh.predict("engager")).toBe("ɛnˈɡeɪdʒɝ");
    expect(fresh.predict("engagers")).toBe("ɛnˈɡeɪdʒɝz");
    expect(fresh.predict("engaging")).toBe("ɛnˈɡeɪdʒɪŋ");
    expect(fresh.predict("engages")).toMatch(/^ɛnˈɡeɪdʒ[əɪ]z$/);
    expect(fresh.predict("engagement")).toBe("ɛnˈɡeɪdʒmənt");
  });

  it("uses the strong -age frame for another OOV agent", () => {
    expect(engine.predict("enrager")).toBe("ɛnˈɹeɪdʒɝ");
  });
  it.each(["manager", "packager"])("does not tense weak -age in %s", word => {
    expect(engine.predict(word)).toMatch(/[əɪ]dʒɝ$/);
    expect(engine.predict(word)).not.toContain("eɪdʒ");
  });

  it("preserves adjective, noun and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The engaged reader will work.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "engaged")?.phoneme).toBe("ɛnˈɡeɪdʒd");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
