import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak con- verb roots (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const standard = (ipa: string | null) => (ipa ?? "").replace(/ˌ/g, "").replace(/ʌ/g, "ə");

  it("keeps the prefix weak and stresses the bound verb root", () => {
    const expected: Record<string, string> = {
      concern: "kənˈsɝn",
      confess: "kənˈfɛs",
      confirm: "kənˈfɝm",
      constrict: "kənˈstɹɪkt",
      constrain: "kənˈstɹeɪn",
      consult: "kənˈsəɫt",
    };
    for (const [word, ipa] of Object.entries(expected)) expect(standard(g2p.predict(word, "en"))).toBe(ipa);
  });

  it("preserves initial-stressed noun and homograph controls", () => {
    expect(standard(g2p.predict("concert", "en"))).toBe("ˈkɑnsɝt");
    expect(standard(g2p.predict("concept", "en"))).toBe("ˈkɑnsɛpt");
    expect(standard(g2p.predict("conflict", "en"))).toBe("ˈkɑnfɫɪkt");
    expect(standard(g2p.predict("contract", "en"))).toBe("ˈkɑntɹækt");
    expect(standard(g2p.predict("constraint", "en"))).toBe(disableDict ? "ˈkɑnstɹeɪnt" : "kənˈstɹeɪnt");
    expect(standard(g2p.predict("construct", "en"))).toBe("ˈkɑnstɹəkt");
    expect(standard(g2p.predict("content", "en"))).toBe(disableDict ? "ˈkɑntənt" : "ˈkɑntɛnt");
  });

  it("keeps root stress under outer un- inflection", () => {
    expect(standard(g2p.predict("unconfirmed", "en"))).toBe("ənkənˈfɝmd");
    expect(standard(g2p.predict("unconstrained", "en"))).toBe("ənkənˈstɹeɪnd");
    expect(standard(g2p.predict("unconsulted", "en"))).toBe("ənkənˈsəɫtɪd");
  });
});
