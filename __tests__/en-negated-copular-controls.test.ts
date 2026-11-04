import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

test("negated predicates preserve adjective, noun, passive and bare-verb readings", () => {
  const engine = new EnglishG2P();
  const api = createPhonemizer({ processors: [engine] });
  const phone = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true })
    .find(token => token.word === word)?.phoneme;
  expect(phone("The students are not content with the result.", "content")).toBe("kənˈtɛnt");
  expect(phone("The child is not upset with the teacher.", "upset")).toBe("əpˈsɛt");
  expect(phone("The teacher is not present in class.", "present")).toBe("ˈpɹɛzənt");
  expect(phone("The suitcase is not compact.", "compact")).toBe("kəmˈpækt");
  expect(phone("This is not abuse of power.", "abuse")).toBe("əˈbjus");
  expect(phone("The paper is not read in class.", "read")).toBe("ɹɛd");
  expect(phone("They do not read the book.", "read")).toBe("ɹid");
  expect(phone("The teacher does not present the lesson.", "present")).toBe("pɹɪˈzɛnt");
  expect(phone("This is not a record.", "record")).toBe("ˈɹɛkɝd");
  expect(engine.predict("upset", "en-US", "ADJ")).toBe("əpˈsɛt");
  expect(engine.predict("upset", "en-US", "N")).toBe("ˈʌpˌsɛt");
  expect(engine.predict("compact", "en-US", "ADJ")).toBe("kəmˈpækt");
  expect(engine.predict("compact", "en-US", "N")).toBe("ˈkɑmpækt");
  expect(engine.predict("compactly", "en-US")).toBe("kəmˈpæktɫi");
});
