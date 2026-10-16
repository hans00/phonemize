import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import { inferVerbForm, simplePOSTagger } from "../src/en/pos-tagger";

const contractions = ["he's", "she’s", "it‘s", "that's", "there's", "what's", "who's", "I'm", "you're", "we’re", "they're"];

describe("Contracted auxiliaries retain their grammatical role", () => {
  it.each(contractions)("recognizes %s before a predicate", auxiliary => {
    expect(simplePOSTagger.tagWord("learned", [auxiliary, "a"]).pos).toBe("!V");
    expect(inferVerbForm({ words: [auxiliary, "read", "it"], index: 1 })).toBe("participle");
  });

  it.each(["Hammond's", "teachers'", "Mary’s"])("preserves the possessive in %s record", possessive => {
    expect(simplePOSTagger.tagWord("record", [possessive, "was"]).pos).toBe("N");
    expect(inferVerbForm({ words: [possessive, "read", "bus"], index: 1 })).toBeUndefined();
  });

  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  it.each([
    ["He's read the book.", "read", "ɹɛd"],
    ["She's already read the book.", "read", "ɹɛd"],
    ["They're read aloud.", "read", "ɹɛd"],
    ["He's learned a lot.", "learned", "ɫɝnd"],
    ["They're present today.", "present", "ˈpɹɛzənt"],
    ["He's an invalid.", "invalid", "ˈɪnvəɫəd"],
    ["That's invalid.", "invalid", "ˌɪnˈvæɫəd"],
  ])("selects the predicate in %s", (sentence, word, ipa) => {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
  });

  it("keeps adjective, noun and verb controls in the same sentence", () => {
    const tokens = api.phonemize("That's invalid on Hammond's record; they record it.", {
      language: "en-US", returnArray: true,
    });
    expect(tokens.filter(t => t.word === "record").map(t => t.phoneme))
      .toEqual(["ˈɹɛkɝd", "ɹɪˈkɔɹd"]);
  });

  it("does not introduce a whole-target homograph lookup in rules mode", () => {
    const rules = new EnglishG2P({ disableDict: true });
    const api = createPhonemizer({ processors: [rules] });
    const token = api.phonemize("He's read it.", { language: "en-US", returnArray: true })
      .find(t => t.word === "read")!;
    expect(token.phoneme).toBe(rules.predict("read", "en-US", "!V"));
  });
});
