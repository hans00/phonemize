import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("plural subject with into complement (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  const pos = (sentence: string, word: string) => {
    const words = sentence.match(/[A-Za-z]+|[^A-Za-z\s]/g) ?? [];
    const index = words.findIndex(token => token.toLowerCase() === word);
    return engine.tagWord(words[index], { prev: words[index - 1], next: words[index + 1], sentence: { words, index } }).pos;
  };

  test.each([
    ["The creatures combine into several groups.", "combine"],
    ["The compounds convert into liquid.", "convert"],
    ["They combine into a group.", "combine"],
  ])("finds the predicate in %s", (sentence, word) => {
    expect(pos(sentence, word)).toBe("V");
  });

  test("keeps a later coordinated predicate verbal", () => {
    const sentence = "Laser treatment causes tattoo pigment particles to heat up and fragment into smaller pieces.";
    expect(pos(sentence, "fragment")).toBe("V");
    if (!disableDict) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === "fragment")?.phoneme).toBe("fɹæɡˈmɛnt");
  });

  test("preserves a nominal subject and explicit readings", () => {
    expect(pos("The combines into the fields were old.", "combines")).not.toBe("V");
    if (!disableDict) {
      expect(api.phonemize("The creatures combine into several groups.", { language: "en-US" })).toBe("ðə ˈkɹitʃɝz kəmˈbaɪn ˈɪntu ˈsɛvɝəɫ ɡɹups.");
      expect(engine.predict("combine", "en-US", "N")).toBe("ˈkɑmbaɪn");
      expect(engine.predict("combine", "en-US", "ADJ")).toBe("ˈkɑmbaɪn");
      expect(engine.predict("combine", "en-US", "V")).toBe("kəmˈbaɪn");
    }
  });
});
