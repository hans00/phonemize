import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("lexical guitar root and controls", () => {
  it.each([false, true])("keeps the attested root and composes its inflections (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("guitar", "en-US", "NN")).toBe("ɡɪˈtɑɹ");
    expect(engine.predict("guitars", "en-US", "NNS")).toBe("ɡɪˈtɑɹz");
    expect(engine.predict("guitarist", "en-US", "NN")).toBe("ɡɪˈtɑɹɪst");
    expect(engine.predict("guitarists", "en-US", "NNS")).toBe("ɡɪˈtɑɹɪsts");
    expect(engine.predict("sitar", "en-US", "NN")).toBe(disableDict ? "ˈsɪtɝ" : "sɪˈtɑɹ");
    expect(engine.predict("altar", "en-US", "NN")).toBe("ˈɔɫtɝ");
  });

  it("retains stress and controls in a sentence", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = api.phonemize("The guitarist played guitars beside the altar and sitar.", {
      language: "en-US", returnArray: true,
    });
    const read = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(read("guitarist")).toBe("ɡɪˈtɑɹɪst");
    expect(read("guitars")).toBe("ɡɪˈtɑɹz");
    expect(read("altar")).toBe("ˈɔɫtɝ");
    expect(read("sitar")).toBe("ˈsɪtɝ");
  });
});
