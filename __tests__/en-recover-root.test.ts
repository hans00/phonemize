import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("recover root and inflections", () => {
  it.each([false, true])("keeps the reduced re- vowel across the family (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("recover", "en-US", "VB")).toBe("ɹɪˈkʌvɝ");
    expect(engine.predict("recovers", "en-US", "VBZ")).toBe("ɹɪˈkʌvɝz");
    expect(engine.predict("recovered", "en-US", "VBD")).toBe(disableDict ? "ɹɪˈkʌvɝd" : "ɹəˈkʌvɝd");
    expect(engine.predict("recovery", "en-US", "NN")).toBe("ɹɪˈkʌvɝi");
    expect(engine.predict("recovery's", "en-US")).toBe("ɹɪˈkʌvɝiz");
    expect(engine.predict("cover", "en-US", "VB")).toBe("ˈkʌvɝ");
    expect(engine.predict("discover", "en-US", "VB")).toBe(disableDict ? "dɪsˈkʌvɝ" : "dɪˈskʌvɝ");
    expect(engine.predict("discovery", "en-US", "NN")).toBe(disableDict ? "dɪsˈkʌvɝi" : "ˌdɪsˈkʌvɹi");
    expect((engine.predict("recovery", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɹɪkʌvɝi");
    expect(engine.predict("misery", "en-US", "NN")).toBe(disableDict ? "ˈmɪsɝi" : "ˈmɪzɝi");


    const tokens = englishTokens(engine, "She hopes to recover, and her discovery and recovery have been steady.");
    expect(tokens.find(token => token.word.toLowerCase() === "recover")?.phoneme).toBe("ɹɪˈkʌvɝ");
    expect(tokens.find(token => token.word.toLowerCase() === "recovery")?.phoneme).toBe("ɹɪˈkʌvɝi");
    expect(tokens.find(token => token.word.toLowerCase() === "discovery")?.phoneme).toBe(disableDict ? "dɪsˈkʌvɝi" : "ˌdɪsˈkʌvɹi");
  });
});
