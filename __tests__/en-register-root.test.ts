import EnglishG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";

const rules = new EnglishG2P({ disableDict: true });

describe("lexical regist- roots keep primary stress off the re- prefix path", () => {
  it.each(["register", "registrar", "registry"])("stresses the root in %s", word => {
    expect(assignStress(syllabify(word), word)).toBe(0);
    expect(rules.predict(word)).toMatch(/^ˈɹɛdʒ/);
  });

  it("leaves the longer registration suffix route intact", () => {
    expect(rules.predict("registration")).toBe("ˌɹɛdʒɪˈstɹeɪʃən");
    expect(rules.predict("registrant")).toBe("ˈɹɛdʒɪstɹənt");
  });

  it("keeps productive re- stress and the separate region root", () => {
    expect(rules.predict("rebuild")).toBe("ɹiˈbɪɫd");
    expect(rules.predict("region")).toBe("ˈɹidʒən");
  });
});
