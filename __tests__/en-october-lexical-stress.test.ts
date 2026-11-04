import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("lexical month-name stress", () => {
  it("uses the sourced October reading without disturbing adjacent month controls", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("october", "en-US")).toBe("ɑkˈtoʊbɝ");
    expect(g2p.predict("september", "en-US")).toBe("sɛpˈtɛmbɝ");
    expect(g2p.predict("november", "en-US")).toBe("noʊˈvɛmbɝ");
    expect(g2p.predict("december", "en-US")).toBe("dɪˈsɛmbɝ");


    const tokens = englishTokens(g2p, "They arrived in October after September and before November.");
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("october")).toBe("ɑkˈtoʊbɝ");
    expect(reading("september")).toBe("sɛpˈtɛmbɝ");
    expect(reading("november")).toBe("noʊˈvɛmbɝ");
  });
});
