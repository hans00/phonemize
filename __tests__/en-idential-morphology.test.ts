import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("-idential morphology (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("preserves the -ident base and moves primary stress to -ential", () => {
    expect(g2p.predict("presidential")).toBe(disableDict ? "ˌpɹɛzɪˈdɛnʃəɫ" : "ˌpɹɛzəˈdɛnʃəɫ");
    expect(g2p.predict("residential")).toBe("ˌɹɛzɪˈdɛnʃəɫ");
    expect(g2p.predict("confidential")).toBe("ˌkɑnfəˈdɛnʃəɫ");
  });

  test("keeps the base readings and established inflections intact", () => {
    expect(g2p.predict("president")).toContain("pɹɛz");
    expect(g2p.predict("resident")).toContain("ɹɛz");
    expect(g2p.predict("confident")).toContain("kɑnf");
    expect(g2p.predict("residentials")).toContain("ɹɛzɪ");
    expect(g2p.predict("confidentially")).toContain("kɑnfə");
  });

  test("does not extend the stress shift to neighboring -dential words", () => {
    expect(g2p.predict("prudential")).toBe("pɹuˈdɛnʃəɫ");
    expect(g2p.predict("providential")).toBe(disableDict ? "ˌpɹɑvɪˈdɛnʃəɫ" : "ˌpɹɑvəˈdɛnʃəɫ");
    expect(g2p.predict("credential")).toBe(disableDict ? "kɹɪˈdɛnʃəɫ" : "kɹəˈdɛnʃəɫ");
  });

  test("preserves sentence tokenization and neighboring noun/verb readings", () => {
    const api = createPhonemizer({ processors: [g2p] });
    const tokens = api.phonemize(
      "The president announced a presidential plan. A resident requested residential housing. The manager kept confidential records.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(token => token.word === "presidential")?.phoneme).toBe(disableDict ? "ˌpɹɛzɪˈdɛnʃəɫ" : "ˌpɹɛzəˈdɛnʃəɫ");
    expect(tokens.find(token => token.word === "residential")?.phoneme).toBe("ˌɹɛzɪˈdɛnʃəɫ");
    expect(tokens.find(token => token.word === "confidential")?.phoneme).toBe("ˌkɑnfəˈdɛnʃəɫ");
    expect(tokens.find(token => token.word === "announced")?.phoneme).toBe("əˈnaʊnst");
    expect(tokens.filter(token => token.word === "president")).toHaveLength(1);
    expect(tokens.filter(token => token.word === "resident")).toHaveLength(1);
  });
});
