import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("repeated productive re- prefixes (rules=%s)", disableDict => {
  it.each(["N", "V"])("preserves the inner release stress for %s", pos => {
    const e = new EnglishG2P({ disableDict });
    expect(e.predict("rerelease", "en-US", pos)).toBe("ˌɹiɹɪˈɫis");
    expect(e.predict("rereleases")).toBe("ˌɹiɹɪˈɫisəz");
    expect(e.predict("rereleased")).toBe("ˌɹiɹɪˈɫist");
    expect(e.predict("rereleasing")).toBe("ˌɹiɹɪˈɫisɪŋ");
    expect(e.predict("rererelease")).toBe("ˌɹiˌɹiɹɪˈɫis");
  });
  it("keeps neighboring non-silent-e and single-nucleus roots", () => {
    const e = new EnglishG2P({ disableDict });
    expect(e.predict("reregister")).toBe("ɹiˈɹɛdʒɪstɝ");
    expect(e.predict("reregistration")).toBe("ɹiˌɹɛdʒɪˈstɹeɪʃən");
    expect(e.predict("reredos")).toBe("ɹiˈɹɛdoʊz");
    expect(e.predict("release")).toBe("ɹiˈɫis");
    expect(e.predict("reregulate")).toBe("ɹiˈɹɛɡjəˌɫeɪt");
    expect(e.predict("reregulation")).toBe("ɹiˌɹɛɡjəˈɫeɪʃən");
  });
  it("composes custom roots without rewriting their vowel or overriding explicit children", () => {
    const e = new EnglishG2P({ disableDict });
    e.addPronunciation("release", "ɹiˈzɛŋ");
    expect(e.predict("rerelease")).toBe("ˌɹiɹiˈzɛŋ");
    e.addPronunciation("rerelease", "ˈkɛŋ");
    expect(e.predict("rerelease")).toBe("ˈkɛŋ");
  });
  it("keeps sentence boundaries and handles long repeated prefixes without recursion", () => {
    const e = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [e] });
    for (const text of ["They rerelease the film.", "The rerelease was successful."])
      expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === "rerelease")?.phoneme).toBe("ˌɹiɹɪˈɫis");
    expect(e.predict("re".repeat(1000) + "release")).toBe("ˌɹi".repeat(1000) + "ɹɪˈɫis");
  });
});
