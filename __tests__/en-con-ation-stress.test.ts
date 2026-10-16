import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("con- noun stress retraction (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["confirmation", "ˌkɑnfɝˈmeɪʃən"],
    ["consultation", "ˌkɑnsəɫˈteɪʃən"],
    ["condemnation", "ˌkɑndəmˈneɪʃən"],
    ["confrontation", "ˌkɑnfɹənˈteɪʃən"],
    ["conformational", "ˌkɑnfɝˈmeɪʃənəɫ"],
    ["conformation", "ˌkɑnfɝˈmeɪʃən"],
  ])("renders the complete noun frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([
    ["information", "ˌɪnfɝˈmeɪʃən"],
    ["presentation", "ˌpɹɛzənˈteɪʃən"],
    ["distillation", "ˌdɪstəˈɫeɪʃən"],
  ])("preserves a neighboring noun frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains FORCE after a vowel-final prefix", () => {
    expect(engine.predict("deformation")).toMatch(/fɔɹˈmeɪʃən$/);
  });
  it("preserves plurals and prefixes after noun eviction", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["confirmation", "confirmations", "consultation", "consultations"]) delete access.dictionary[word];
    expect(fresh.predict("confirmations")).toBe("ˌkɑnfɝˈmeɪʃənz");
    expect(fresh.predict("consultations")).toBe("ˌkɑnsəɫˈteɪʃənz");
    expect(fresh.predict("nonconfirmation")).toBe("nɑnˌkɑnfɝˈmeɪʃən");
    expect(fresh.predict("nonconsultation")).toBe("nɑnˌkɑnsəɫˈteɪʃən");
    expect(fresh.predict("preconfirmation")).toMatch(/kɑnfɝˈmeɪʃən$/);
    if (!disableDict) expect(fresh.predict("reconfirmation")).toMatch(/kɑnfɝˈmeɪʃən$/);
  });
  it("preserves noun, adjective and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("After confirmation, the clever reader will work.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "confirmation")?.phoneme).toBe("ˌkɑnfɝˈmeɪʃən");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});

it.each([
  ["confirm", "kənˈfɝm"], ["consult", "kənˈsʌɫt"],
  ["condemn", "kənˈdɛm"], ["confront", "kənˈfɹʌnt"],
])("preserves the supplied verb citation in %s", (word, ipa) => {
  expect(new EnglishG2P().predict(word, "en", "V")).toBe(ipa);
});
