import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const tokens = (text: string) => createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] })
  .phonemize(text, { language: "en-US", returnArray: true });
const tagAt = (engine: EnglishG2P, words: string[], index: number) => engine.tagWord(words[index], {
  prev: words[index - 1]?.toLowerCase(), next: words[index + 1]?.toLowerCase(), sentence: { words, index },
});

describe("syntax-supported finite predicate POS", () => {
  test("uses an independently tagged nominal subject to select a third-person verb", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const words = ["The", "door", "closes", "slowly"];
    const pos = tagAt(engine, words, 2);

    expect(pos.pos).toBe("V");
    expect(engine.predictWithContext("closes", { words, index: 2 }, "en", pos.pos)).toBe("ˈkɫoʊzəz");
    expect(tokens("The door closes slowly.").find(token => token.word === "closes")?.phoneme).toBe("ˈkɫoʊzəz");
  });

  test("does not promote a plural noun in object position to a predicate", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const words = ["The", "farmers", "operate", "combines"];
    expect(tagAt(engine, words, 3).pos).not.toBe("V");
    expect(tokens("The farmers operate combines.").find(token => token.word === "combines")?.phoneme).toBe("ˈkɑmbaɪnz");
  });

  test("does not use an adjective/verb hypothesis as the subject of a false clause", () => {
    const engine = new EnglishG2P({ disableDict: true });
    const words = "Integration enables lean uses of information for the creation of actionable knowledge".split(" ");
    expect(tagAt(engine, words, words.indexOf("uses")).pos).not.toBe("V");
    expect(engine.predictWithContext("uses", { words, index: words.indexOf("uses") }, "en", "N")).toBe("ˈjusəz");
  });

  test("does not promote a title-cased name compound", () => {
    const result = tokens("Handel Records Both Classical Covers.").find(token => token.word === "Records")?.phoneme;
    expect(result).toBe("ˈɹɛkɝdz");
  });
});
