import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("a determined noun list supplies noun evidence", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const say = (sentence: string, word: string) =>
    api.phonemize(sentence, { language: "en-US", returnArray: true }).find(token => token.word === word)?.phoneme;
  expect(say("They used an adhesive, laminate, plug, and sealant.", "laminate")).toBe("ˈɫæmənət");
  expect(say("They will laminate the paper.", "laminate")).toBe("ˈɫæməˌneɪt");
  expect(say("The laminate was wet.", "laminate")).toBe("ˈɫæmənət");
  expect(say("They will record the tape.", "record")).toBe("ɹɪˈkɔɹd");
});
