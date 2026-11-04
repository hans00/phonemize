import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("forget irregular paradigm roots", () => {
  it.each([false, true])("uses the sourced present and past forms without shifting derived controls (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("forget", "en-US", "VB")).toBe("fɝˈɡɛt");
    expect(engine.predict("forgets", "en-US", "VBZ")).toBe("fɝˈɡɛts");
    expect(engine.predict("forgetting", "en-US", "VBG")).toBe("fɝˈɡɛtɪŋ");
    expect(engine.predict("forgot", "en-US", "VBD")).toBe("fɝˈɡɑt");
    expect(engine.predict("forgotten", "en-US", "VBN")).toBe("fɝˈɡɑtən");
    expect(engine.predict("regret", "en-US", "VB")).toBe(disableDict ? "ɹiˈɡɹɛt" : "ɹəˈɡɹɛt");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("I forget what I forgot, though I have not forgotten it.", {
      language: "en-US",
      returnArray: true,
    });
    const readings = tokens.filter(token => ["forget", "forgot", "forgotten"].includes(token.word.toLowerCase()));
    expect(readings.map(token => token.phoneme)).toEqual(["fɝˈɡɛt", "fɝˈɡɑt", "fɝˈɡɑtən"]);
  });
});
