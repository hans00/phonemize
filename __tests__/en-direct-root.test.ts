import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const stripStress = (ipa: string): string => ipa.replace(/[ˈˌ]/g, "");

describe("direct- root pronunciation", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["direct", "daɪɹɛkt"],
    ["directed", "daɪɹɛktɪd"],
    ["directing", "daɪɹɛktɪŋ"],
    ["director", "daɪɹɛktɝ"],
    ["direction", "daɪɹɛkʃən"],
    ["directory", "daɪɹɛktɝi"],
    ["directive", "daɪɹɛktɪv"],
    ["directorial", "daɪɹəkˈtɔɹiəɫ"],
  ])("retains the PRICE root in %s", (word, expected) => {
    expect(stripStress(rules.predict(word, "en-US")!)).toBe(stripStress(expected));
  });

  it.each([
    ["indirect", "ɪndɪɹɛkt"],
    ["redirect", "ɹidɪɹɛkt"],
    ["discrete", "dɪskɹit"],
  ])("leaves the neighboring %s reading intact", (word, expected) => {
    expect(stripStress(rules.predict(word, "en-US")!)).toBe(expected);
  });

  it("keeps stress placement in the unstressed direct- root derivatives", () => {
    expect(rules.predict("direct", "en-US")).toBe("daɪˈɹɛkt");
    expect(rules.predict("director", "en-US")).toBe("daɪˈɹɛktɝ");
    expect(rules.predict("direction", "en-US")).toBe("daɪˈɹɛkʃən");
  });

  it("stresses parallel two-syllable -rect roots on the second syllable", () => {
    expect(rules.predict("correct", "en-US")).toBe("kɝˈɛkt");
    expect(rules.predict("erect", "en-US")).toBe("ɪˈɹɛkt");
    expect(rules.predict("directs", "en-US")).toBe("daɪˈɹɛkts");
    expect(rules.predict("erects", "en-US")).toBe("ɪˈɹɛkts");
  });

  it("preserves the root reading across adjective, verb, and noun sentence contexts", () => {
    const phonemizer = createPhonemizer({ processors: [rules] });
    const tokens = phonemizer.phonemize(
      "Take a direct route. They direct traffic. The director gave clear direction.",
      { language: "en-US", returnArray: true },
    );
    const direct = tokens.filter(token => token.word === "direct").map(token => token.phoneme);
    expect(direct).toHaveLength(2);
    expect(direct.map(stripStress)).toEqual(["daɪɹɛkt", "daɪɹɛkt"]);
    expect(tokens.find(token => token.word === "director")?.phoneme).toBe("daɪˈɹɛktɝ");
    expect(tokens.find(token => token.word === "direction")?.phoneme).toBe("daɪˈɹɛkʃən");
  });
});
