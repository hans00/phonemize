import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("sourced perhaps and exercise roots", () => {
  it.each([false, true])("uses the dictionary-backed forms in both modes and context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("perhaps", "en-US", "RB")).toBe("pɝˈhæps");
    expect(engine.predict("exercise", "en-US", "NN")).toBe("ˈɛksɝˌsaɪz");
    expect(engine.predict("exercise", "en-US", "VB")).toBe("ˈɛksɝˌsaɪz");
    expect(engine.predict("exercises", "en-US", "NNS")).toBe("ˈɛksɝˌsaɪzəz");
    expect(engine.predict("exercised", "en-US", "VBD")).toBe("ˈɛksɝˌsaɪzd");
    expect(engine.predict("exercising", "en-US", "VBG")).toBe("ˈɛksɝˌsaɪzɪŋ");
    expect(engine.predict("exorcise", "en-US", "VB")).toBe("ɪɡˈzɔɹsaɪz");


    const tokens = englishTokens(engine, "Perhaps we should exercise more often; the exercise is useful.");
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("perhaps")).toBe("pɝˈhæps");
    expect(tokens.filter(token => token.word.toLowerCase() === "exercise").map(token => token.phoneme)).toEqual([
      "ˈɛksɝˌsaɪz", "ˈɛksɝˌsaɪz",
    ]);
  });
});
