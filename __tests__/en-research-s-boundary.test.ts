import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("re- + search root boundary (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");

  it("preserves the root-initial voiceless /s/ in research", () => {
    expect(stripStress(g2p.predict("research", "en-US"))).toBe("ɹisɝtʃ");
    if (disableDict) expect(g2p.trace("research", "en-US").path).toBe("rules");
  });

  it("keeps the other re-s voicing environments and root derivatives stable", () => {
    expect(stripStress(g2p.predict("researcher", "en-US"))).toBe("ɹisɝtʃɝ");
    expect(stripStress(g2p.predict("researching", "en-US"))).toBe("ɹisɝtʃɪŋ");
    expect(stripStress(g2p.predict("result", "en-US"))).toBe(disableDict ? "ɹizʌɫt" : "ɹɪzʌɫt");
    expect(stripStress(g2p.predict("reside", "en-US"))).toBe("ɹizaɪd");
    expect(stripStress(g2p.predict("reserve", "en-US"))).toBe("ɹizɝv");
    expect(stripStress(g2p.predict("present", "en-US"))).toBe(disableDict ? "pɹizɛnt" : "pɹɛzənt");
  });
});

it("keeps the research root reading in sentence context", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const tokens = api.phonemize("The research continued after the result was reviewed.", {
    language: "en-US",
    returnArray: true,
  });
  expect(tokens.find(token => token.word === "research")?.phoneme).toBe("ɹiˈsɝtʃ");
  expect(tokens.find(token => token.word === "result")?.phoneme).toBe("ɹiˈzʌɫt");
});
