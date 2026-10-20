import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("finite subject frames through locative and infinitive phrases (disableDict=%s)", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const processor = new EnglishG2P({ disableDict });
  const target = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
  const pos = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word.toLowerCase());
    return processor.tagWord(word, { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  it("selects third-person verb readings before bounded locative phrases", () => {
    for (const sentence of [
      "Norman lives at Greenwood children's home, south of London.",
      "This gastropod lives in most oceans.",
      "Currently, Bishop Zipfel lives at Little Sisters of the Poor.",
      "He currently lives in Studio City, California.",
    ]) expect(target(sentence, "lives")).toBe("ɫɪvz");
  });

  it("keeps plural lives as a noun before its own locative phrase", () => {
    expect(target("Their lives at sea were difficult.", "lives")).toBe("ɫaɪvz");
    expect(target("The lives in the story are very different.", "lives")).toBe("ɫaɪvz");
  });

  it("recognizes a plural subject across one PP before a to-infinitive", () => {
    expect(target("The puzzle elements in the first few levels combine to form more complex puzzles.", "combine"))
      .toBe("kəmˈbaɪn");
    expect(target("Then, too, the flowers refuse to be self-fertilized.", "refuse"))
      .toBe(disableDict ? "ɹiˈfjus" : "ɹɪˈfjuz");
    expect(target("The first few levels of the puzzle combine to form a challenge.", "combine"))
      .toBe("kəmˈbaɪn");
  });

  it("keeps a shared subject across a but-coordinated to-infinitive predicate", () => {
    expect(target("They manage to steal the diamond, but refuse to hand it over to JD.", "refuse"))
      .toBe(disableDict ? "ɹiˈfjus" : "ɹɪˈfjuz");
  });

  it("keeps noun refuse and combine readings outside finite predicate frames", () => {
    expect(pos("The refuse was collected.", "refuse")).not.toBe("V");
    expect(pos("The combine is stored beside the barn.", "combine")).not.toBe("V");
    if (!disableDict) {
      expect(target("The refuse was collected.", "refuse")).toMatch(/^ˈɹɛ/);
      expect(target("The combine is stored beside the barn.", "combine")).toBe("ˈkɑmbaɪn");
    }
  });
});
