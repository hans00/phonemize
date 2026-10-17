import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("finite plural objects, disableDict=%s", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, {
    language: "en-US", returnArray: true,
  }).find(token => token.word === word)?.phoneme;
  it("recognizes a singular subject and direct plural object", () => {
    expect(phone("The pacemaker uses batteries.", "uses")).toBe("ˈjuzəz");
    expect(phone("Since a pacemaker uses batteries, the device works.", "uses")).toBe("ˈjuzəz");
  });
  it("preserves plural nouns and following predicates", () => {
    expect(phone("The uses of batteries are varied.", "uses")).toBe("ˈjusəz");
    expect(phone("The uses batteries have are varied.", "uses")).toBe("ˈjusəz");
    expect(phone("These uses were recorded.", "uses")).toBe("ˈjusəz");
  });
  it("preserves a neighboring agent and past-tense verb", () => {
    expect(phone("The reader read the notes yesterday.", "read")).toBe("ɹɛd");
  });
});
