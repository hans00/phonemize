import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge US: estate /ɪˈsteɪt/, escape /ɪˈskeɪp/, establish
// /ɪˈstæblɪʃ/. Their initial written e is a weak es- syllable, with primary
// stress on the following lexical root.
describe("weak initial es- before the estate/escape/establish roots", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["estate", "ɪˈsteɪt"],
    ["estates", "ɪˈsteɪts"],
    ["escape", "ɪˈskeɪp"],
    ["escaped", "ɪˈskeɪpt"],
    ["escaping", "ɪˈskeɪpɪŋ"],
    ["establish", "ɪˈstæbɫɪʃ"],
    ["established", "ɪˈstæbɫɪʃt"],
    ["establishing", "ɪˈstæbɫɪʃɪŋ"],
    ["establishment", "ɪˈstæbɫɪʃmənt"],
  ])("predicts %s with root stress", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves contrasting initial-stress roots and -ade/-ee forms", () => {
    expect(rules.predict("escalate", "en-US")).toBe("ˈɛskəˌɫeɪt");
    expect(rules.predict("estimate", "en-US")).toBe("ˈɛstəˌmeɪt");
    expect(rules.predict("escapade", "en-US")).toBe("ˈɛskəˌpeɪd");
    expect(rules.predict("escapee", "en-US")).toBe("ˈɛskəpi");
  });

  it("keeps sentence tokenization and phrase context intact", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("They escaped the estate after officials established a plan.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.find(token => token.word === "escaped")?.phoneme).toBe("ɪˈskeɪpt");
    expect(tokens.find(token => token.word === "estate")?.phoneme).toBe("ɪˈsteɪt");
    expect(tokens.find(token => token.word === "established")?.phoneme).toBe("ɪˈstæbɫɪʃt");
  });

  it("uses the standard compound reading when a standalone root meets a lexicalized phrase", () => {
    const lexical = new EnglishG2P({ disableDict: true });
    lexical.addPronunciation("real-estate", "R IY1 L IH0 S T EY2 T");
    expect(lexical.predict("real-estate", "en-US")).toBe("ˈɹilɪˌsteɪt");
  });
});
