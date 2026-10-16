import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("pretonic rhotic KIT before a velar (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["curriculum", "kɝˈɪkjəɫəm"], ["curriculums", "kɝˈɪkjəɫəmz"], ["curriculum's", "kɝˈɪkjəɫəmz"],
    ["hurries", "ˈhɝiz"], ["flurries", "ˈfɫɝiz"], ["hurry", "ˈhɝi"],
    ["vidaurri", "vɪˈdɔɹi"],
  ])("preserves the root or unaffected frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each(["curricular", "curricularly"])("keeps primary stress and root phones in %s", word => {
    expect(engine.predict(word)?.replace(/ˌ/g, "")).toBe(word === "curricular" ? "kɝˈɪkjəɫɝ" : "kɝˈɪkjəɫɝɫi");
  });
  it.each(["curricula", "extracurricular", "intercurricular"])("retains the owned root in %s", word => {
    expect(engine.predict(word)).toMatch(/kɝˈɪkj/);
  });
  it.each(["overrun", "overrunning", "overrecurrent", "underrate", "underrated", "counterrevolution"])(
    "retains the separate r at a prefix boundary in %s", word => {
      expect(engine.predict(word)).toMatch(/ɝ[ˈˌ]?ɹ/);
    },
  );
  it("preserves the existing prefix vowel and unrelated weak ending", () => {
    expect(engine.predict("nonrecurring")).toMatch(/ɹɪ[ˈˌ]?kɝ/);
    expect(engine.predict("scurrilous")).toMatch(/ɫəs$/);
  });
  it("retains exact roots and prefix boundaries after target eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["curriculum", "curricular"]) delete access.dictionary[word];
    expect(evicted.predict("curriculum")).toBe("kɝˈɪkjəɫəm");
    expect(evicted.predict("noncurricular")).toMatch(/nɑnkɝˈɪkj/);
    expect(evicted.predict("overcurriculum")).toMatch(/kɝ[ˈˌ]ɪkj/);
  });
  it("retains caller-owned r in a root and its compositions", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["curriculum", "curricular"]) delete access.dictionary[word];
    custom.addPronunciation("curriculum", "kɝˈɹɪkjəɫəm");
    custom.addPronunciation("curricular", "kɝˈɹɪkjəɫɝ");
    expect(custom.predict("curriculum")).toBe("kɝˈɹɪkjəɫəm");
    expect(custom.predict("overcurriculum")).toMatch(/kɝ[ˈˌ]ɹɪkj/);
    expect(custom.predict("noncurricular")).toMatch(/nɑnkɝˈɹɪkj/);
  });
  it("preserves noun, adjective and finite verb controls in prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work with the curriculum.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "curriculum")?.phoneme).toBe("kɝˈɪkjəɫəm");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    const adjective = api.phonemize("The curricular plan will work.", { language: "en-US", returnArray: true });
    expect(adjective.find(t => t.word === "curricular")?.phoneme.replace(/ˌ/g, "")).toBe("kɝˈɪkjəɫɝ");
    expect(adjective.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});
