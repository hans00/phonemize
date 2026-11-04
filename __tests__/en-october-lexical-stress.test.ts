import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("lexical month-name stress", () => {
  it("uses the sourced October reading without disturbing adjacent month controls", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("october", "en-US")).toBe("ɑkˈtoʊbɝ");
    expect(g2p.predict("september", "en-US")).toBe("sɛpˈtɛmbɝ");
    expect(g2p.predict("november", "en-US")).toBe("noʊˈvɛmbɝ");
    expect(g2p.predict("december", "en-US")).toBe("dɪˈsɛmbɝ");

    const api = createPhonemizer({ processors: [g2p] });
    const tokens = api.phonemize("They arrived in October after September and before November.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("october")).toBe("ɑkˈtoʊbɝ");
    expect(reading("september")).toBe("sɛpˈtɛmbɝ");
    expect(reading("november")).toBe("noʊˈvɛmbɝ");
  });
});
