import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

test("capitalized infinitives after passive verbs retain their verb reading", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
    .find(token => token.word === word)?.phoneme;
  expect(phone("He was asked to Record Evidence.", "Record")).toBe("ɹɪˈkɔɹd");
  expect(phone("They were instructed to Present Evidence.", "Present")).toBe("pɹɪˈzɛnt");
  expect(phone("He was asked to record evidence.", "record")).toBe("ɹɪˈkɔɹd");
  expect(phone("The record was presented.", "record")).toBe("ˈɹɛkɝd");
});
