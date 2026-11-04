import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("stressed final -ial hiatus, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test("retains the diphthong and primary stress through word forms", () => {
    expect(engine.predict("denial", "en", "N")).toBe("dɪˈnaɪəɫ");
    expect(engine.predict("denials", "en", "N")).toBe("dɪˈnaɪəɫz");
    expect(engine.predict("redial", "en", "V")).toBe("ɹiˈdaɪəɫ");
    expect(engine.predict("retrial", "en", "N")).toBe("ɹiˈtɹaɪəɫ");
    expect(engine.predict("deny", "en", "V")).toBe("dɪˈnaɪ");
    expect(engine.predict("dial", "en", "V")).toBe("ˈdaɪəɫ");
    expect(engine.predict("initial", "en", "ADJ")).toContain("nɪʃəɫ");
  });

  test("uses the new reading in full sentences", () => {
    expect(api.phonemize("The denial surprised them.", { language: "en-US" }))
      .toBe("ðə dɪˈnaɪəɫ səˈpɹaɪzd ðəm.");
    expect(api.phonemize("They redial the number.", { language: "en-US" }))
      .toBe("ðeɪ ɹiˈdaɪəɫ ðə ˈnʌmbɝ.");
  });
});

test("the default pipeline preserves redial's noun and verb stress contrast", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("redial", "en", "N")).toBe("ˈɹiˌdaɪəɫ");
  expect(engine.predict("redial", "en", "V")).toBe("ɹiˈdaɪəɫ");
  const api = createPhonemizer({ processors: [engine] });
  expect(api.phonemize("The redial is automatic.", { language: "en-US" }))
    .toBe("ðə ˈɹiˌdaɪəɫ ɪz ˌɔtəˈmætɪk.");
});

test("a doubled final consonant is not forced into the hiatus class", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("aviall", "en")).not.toContain("aɪ");
});
