import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Silent-e compound boundaries (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });
  const phones = (word: string) => engine.predict(word)!.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");

  it.each(["firefox", "fireeye"])("retains a merged rhotic root in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈfaɪɝ/);
  });

  it.each([
    ["smokescreen", "smoʊkskɹin"], ["widespread", "waɪdspɹɛd"],
    ["thereby", "ðɛɹbaɪ"], ["moreover", "mɔɹoʊvɝ"], ["somewhat", "səmwət"],
  ])("restores the segmental boundary in %s", (word, ipa) => {
    expect(phones(word)).toBe(ipa);
  });

  it.each(["fireeye", "wavefox", "stonefox"])("uses existing verified parts for a novel compound: %s", word => {
    expect(phones(word)).not.toMatch(/(?:ɹɪ|vɪ|nə)f/);
    expect(engine.predict(word)).toMatch(/(?:aɪ|f[ɑɔ]ks)$/);
  });

  it.each(["lacerate", "laceration"])("keeps the bound Latin root in %s", word => {
    expect(engine.predict(word)).toMatch(/[ˈˌ][ɫl]æs/);
  });
  it("keeps adjective/borrowed-root stress outside compound splitting", () => {
    expect(engine.predict("comedic")).toMatch(/kəˈm[ɛi]/);
    expect(engine.predict("pageant")).toMatch(/^ˈpædʒ/);
  });

  it.each(["racetam", "piracetam", "levetiracetam"])("keeps the bound chemical stem in %s", word => {
    expect(engine.predict(word)).not.toContain("ɹeɪs");
  });

  it.each(["fireman", "foreman"])("keeps the weak occupational suffix in %s", word => {
    expect(engine.predict(word)).toMatch(/mən$/);
  });
  it.each(["wholesome", "lonesome"])("keeps weak adjective -some in %s", word => {
    expect(engine.predict(word)).toMatch(/səm$/);
  });
  it("retains the weak directional rime", () => {
    expect(engine.predict("shoreward")).toMatch(/ɝd$/);
  });

  it.each([
    ["Firefox opened the page.", "Firefox", /faɪɝ/],
    ["They built a smokescreen.", "smokescreen", /smoʊkskɹin/],
    ["The damage is widespread.", "widespread", /waɪdspɹɛd/],
    ["They lacerate the surface.", "lacerate", /[ɫl]æs/],
  ] as const)("preserves noun/adjective/verb boundaries in %s", (sentence, word, ipa) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)!;
    expect(target.phoneme.replace(/[ˈˌ]/g, "")).toMatch(ipa);
  });
});
