import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge I'm/I've and Oxford A (noun): the apostrophe retains the letter nucleus.
describe.each([false, true])("single-letter clitics, disableDict=%s", (disableDict) => {
  it.each([
    ["a", "ˈeɪ"], ["b", "ˈbi"], ["c", "ˈsi"], ["d", "ˈdi"], ["e", "ˈi"],
    ["f", "ˈɛf"], ["g", "ˈdʒi"], ["h", "ˈeɪtʃ"], ["i", "ˈaɪ"], ["k", "ˈkeɪ"],
    ["l", "ˈɛɫ"], ["m", "ˈɛm"], ["n", "ˈɛn"], ["p", "ˈpi"], ["r", "ˈɑɹ"],
    ["s", "ˈɛs"], ["t", "ˈti"], ["v", "ˈvi"], ["x", "ˈɛks"], ["y", "ˈwaɪ"],
  ])("reads standalone %s by its letter name", (letter, expected) => {
    expect(new EnglishG2P({ disableDict }).predict(letter, "en-US")).toBe(expected);
  });

  it("preserves article A as a weak form in prose", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("A cat. I can read.", { language: "en-US", returnArray: true });
    expect(out.find((token) => token.word === "A")?.phoneme).toBe("ə");
    expect(out.find((token) => token.word === "I")?.phoneme).toBe("aɪ");
  });

  it.each([
    ["I'm", "ˈaɪm"], ["I've", "ˈaɪv"], ["I'd", "ˈaɪd"], ["I'll", "ˈaɪl"],
    ["a's", "ˈeɪz"], ["e's", "ˈiz"], ["q's", "ˈkjuz"], ["l's", "ˈɛɫz"],
    ["w's", "ˈdʌbəɫjuz"], ["z's", "ˈziz"],
  ])("composes %s from the existing letter name", (word, expected) => {
    const en = new EnglishG2P({ disableDict });
    for (const variant of [word, word.toUpperCase(), word.replace("'", "’")]) {
      expect(en.predict(variant, "en-US")).toBe(expected);
    }
  });

  it("keeps letter nouns full in prose and leaves article and tense controls intact", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const out = api.phonemize("I'm ready. I've earned A's. A cat read that book yesterday. I will read it tomorrow.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "I'm")?.phoneme).toBe("aɪm");
    expect(out.find(t => t.word === "I've")?.phoneme).toBe("aɪv");
    expect(out.find(t => t.word === "A's")?.phoneme).toBe("eɪz");
    expect(out.find(t => t.word === "A")?.phoneme).toBe("ə");
    if (!disableDict) expect(out.filter(t => t.word === "read").map(t => t.phoneme)).toEqual(["ɹɛd", "ɹid"]);
  });

  it("uses the shared dialect and phonotactic stages for letter stems", () => {
    const en = new EnglishG2P({ disableDict });
    expect(en.predict("R's", "en-GB")).toBe("ˈɑːz");
    expect(en.predict("R's", "en-US")).toBe("ˈɑɹz");
    expect(en.predict("W's", "en-US", "N")).toBe("ˈdʌbəɫjuz");
    expect(en.predict("L's", "en-US", "N")).toBe("ɛɫz");
  });

  it("preserves explicit stem and whole-token ownership", () => {
    const en = new EnglishG2P({ disableDict });
    en.addPronunciation("i", "ˈtɛst");
    expect(en.predict("I'm", "en-GB")).toBe("ˈtɛstm");
    en.addPronunciation("I'm", "ˈkʌstəm");
    expect(en.predict("I’m", "en-GB")).toBe("ˈkʌstəm");
    en.addPronunciation("q", "ˈtɛst");
    expect(en.predict("q's")).toBe("ˈtɛsts");
  });

  it("does not turn ordinary lexical stems into initialisms", () => {
    const en = new EnglishG2P({ disableDict });
    expect(en.predict("gas")).toBe("ˈɡæs");
    expect(en.predict("gassed")).toBe("ˈɡæst");
    expect(en.predict("workin'")).toMatch(/ɪn$/);
    expect(en.predict("o'clock")).not.toBe(en.predict("o") + "kɫɑk");
  });
});
