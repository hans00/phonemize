import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("double-z plural and 3sg suffix", () => {
  it.each([
    ["quiz", "quizzes", "ˈkwɪz", "ˈkwɪzɪz"],
    ["whizz", "whizzes", "ˈhwɪz", "ˈhwɪzɪz"],
    ["buzz", "buzzes", "ˈbʌz", "ˈbʌzɪz"],
    ["fizz", "fizzes", "ˈfɪz", "ˈfɪzɪz"],
    ["fuzz", "fuzzes", "ˈfʌz", "ˈfʌzɪz"],
    ["jazz", "jazzes", "ˈdʒæz", "ˈdʒæzɪz"],
  ])("composes %s + -es from the root and regular sibilant allomorph", (root, form, rootIPA, formIPA) => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict(root, "en-US")).toBe(rootIPA);
    expect(g2p.trace(form, "en-US").path).toBe("morphology");
    expect(g2p.predict(form, "en-US")).toBe(formIPA);
    expect(g2p.predict(form, "en-US", "V")).toBe(formIPA);
  });

  it("keeps the suffix pronunciation through full sentence tokenization", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = phonemizer.phonemize(
      "The quizzes were difficult. The beehive buzzes loudly. She whizzes past.",
      { language: "en-US", returnArray: true },
    );
    const outputs = tokens.map(token => [token.word.toLowerCase(), token.phoneme] as const);
    expect(outputs.filter(([word]) => ["quizzes", "buzzes", "whizzes"].includes(word))).toEqual([
      ["quizzes", "ˈkwɪzɪz"], ["buzzes", "ˈbʌzɪz"], ["whizzes", "ˈhwɪzɪz"],
    ]);
  });

  it.each([
    ["uses", "ˈjusəz"], ["cases", "ˈkeɪsəz"], ["buses", "ˈbʌsəz"],
    ["gases", "ˈɡæsəz"], ["dishes", "ˈdɪʃəz"], ["boxes", "ˈbɑksəz"],
  ])("leaves the neighboring -es class unchanged for %s", (word, expected) => {
    expect(new EnglishG2P({ disableDict: true }).predict(word, "en-US")).toBe(expected);
  });
});
