import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { inferVerbForm, simplePOSTagger } from "../src/en/pos-tagger";

const cases = [
  ["Lastly, players can form guilds and invite other players to join.", "invite"],
  ["They can discuss plans and use some tools to build.", "use"],
  ["They can review forms and permit other users to enter.", "permit"],
];
it.each(cases)("inherits shared modal base: %s", (sentence, word) => {
  const words = sentence.replace(/([,.!?;:])/g, " $1 ").trim().split(/\s+/);
  const index = words.indexOf(word);
  expect(simplePOSTagger.tagWord(word, [words[index - 1], words[index + 1]], { words, index }).pos).toBe("V");
  expect(inferVerbForm({ words, index })).toBe("base");
});
describe.each([false, true])("modal coordination, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const pick = (s: string, word: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  it("selects verb contrasts", () => {
    expect(pick(cases[0][0], "invite")).toBe(disableDict ? "ɪnˈvaɪt" : "ˌɪnˈvaɪt");
    expect(pick(cases[1][0], "use")).toBe("juz");
  });
  it("keeps coordinated objects nominal", () => {
    expect(pick("They can buy a tool and use cases for discussion.", "use")).toBe("jus");
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
  });
  if (!disableDict) it("retains past, perfect and direct modal controls", () => {
    expect(pick("He worked hard and read some books yesterday.", "read")).toBe("ɹɛd");
    expect(pick("He could have trained and read some books to learn.", "read")).toBe("ɹɛd");
    expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
  });
});
