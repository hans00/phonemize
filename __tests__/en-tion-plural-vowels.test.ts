import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("-tion plural stem vowels (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test("retains the independently predicted singular vowel in context", () => {
    expect(engine.predict("negotiations", "en-US", "N")).toBe("nəˌɡoʊʃiˈeɪʃənz");
    expect(engine.predict("reductions", "en-US", "N")).toBe("ɹiˈdʌkʃənz");
    expect(engine.predict("reverberations", "en-US", "N")).toBe("ɹɪˌvɝbɝˈeɪʃənz");
    expect(api.phonemize("The careful negotiations require sharp reductions.", { language: "en-US" })).toBe("ðə ˈkɛɹfəɫ nəˌɡoʊʃiˈeɪʃənz ɹiˈkwaɪɝ ʃɑɹp ɹiˈdʌkʃənz.");
  });

  test("keeps transparent prefixes, vowel-initial forms and custom roots", () => {
    expect(engine.predict("destabilizations", "en-US", "N")).toBe("diˌsteɪbəɫəˈzeɪʃənz");
    expect(engine.predict("elations", "en-US", "N")).toBe("ɪˈɫeɪʃənz");
    expect(engine.predict("destabilizations", "en-GB", "N")).toBe("diˌsteɪbəɫəˈzeɪʃənz");
    expect(engine.predict("elations", "en-GB", "N")).toBe("ɪˈɫeɪʃənz");
    expect(engine.predict("emotions", "en-US", "N")).toBe(disableDict ? "ˈiˌmoʊʃənz" : "ˈimoʊʃənz");
    if (disableDict) {
      const custom = new EnglishG2P({ disableDict });
      custom.addPronunciation("negotiation", "nɪˌɡoʊʃiˈeɪʃən");
      expect(custom.predict("negotiations", "en-US", "N")).toBe("nɪˌɡoʊʃiˈeɪʃənz");
    }
  });
});
