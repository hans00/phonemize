import EnglishG2P from "../src/en/g2p";

describe("Cambridge US unstressed -ical references", () => {
  const words = [
    ["biblical", "ˈbɪbɫɪkəɫ"],
    ["chemical", "ˈkɛmɪkəɫ"],
    ["clinical", "ˈkɫɪnɪkəɫ"],
    ["hypothetical", "ˌhaɪpəˈθɛtɪkəɫ"],
    ["medical", "ˈmɛdɪkəɫ"],
    ["numerical", "nuˈmɛɹɪkəɫ"],
    ["practical", "ˈpɹæktɪkəɫ"],
    ["radical", "ˈɹædɪkəɫ"],
    ["typical", "ˈtɪpɪkəɫ"],
  ] as const;

  it.each([false, true])("uses the independently verified /ɪ/ forms (rules=%s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of words) expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps political as a separate /ə/ class in the dictionary route", () => {
    expect(new EnglishG2P().predict("political", "en-US")).toBe("pəˈɫɪtəkəɫ");
    expect(new EnglishG2P({ disableDict: true }).predict("political", "en-US")).toBe("pəˈɫɪtɪkəɫ");
  });
});
