import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("fused ever compounds (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["wherever", /^(?:ˌ)?hwɛˈɹɛvɝ$/],
    ["whatsoever", /^ˌhw[əʌ]tsoʊˈɛvɝ$/],
    ["whosoever", /^ˌhusoʊˈɛvɝ$/],
    ["whomsoever", /^ˌhumsoʊˈɛvɝ$/],
    ["howsoever", /^ˌhaʊsoʊˈɛvɝ$/],
    ["wheresoever", /^ˌhwɛɹsoʊˈɛvɝ$/],
  ] as const)("preserves the components in %s", (word, ipa) => {
    expect(engine.predict(word)).toMatch(ipa);
  });
  it.each([
    ["believer", /^b[ɪə]ˈɫivɝ$/],
    ["reliever", /^ɹ[iɪ]ˈɫivɝ$/],
    ["cheever", /^ˈtʃivɝ$/],
    ["lever", /^ˈɫ[ɛi]vɝ$/],
    ["clever", /^ˈkɫɛvɝ$/],
    ["never", /^ˈnɛvɝ$/],
    ["sever", /^ˈsɛvɝ$/],
  ] as const)("preserves an unrelated root in %s", (word, ipa) => {
    expect(engine.predict(word)).toMatch(ipa);
  });
  it.each(["however", "whatever", "whenever", "whoever", "whichever", "whomever"])("retains final primary stress in %s", word => {
    expect(engine.predict(word)).toMatch(/ˈ[^ˈ]*ɛvɝ$/);
  });
  it("preserves noun, adjective and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will work wherever he can.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "wherever")?.phoneme).toMatch(/hwɛˈɹɛvɝ$/);
  });
});
