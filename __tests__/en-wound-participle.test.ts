import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

const engine = new EnglishG2P();
const api = createPhonemizer({ processors: [engine] });
const phone = (sentence: string, word = "wound") => api.phonemize(sentence, {
  language: "en-US", returnArray: true,
}).find(token => token.word.toLowerCase() === word)?.phoneme;

test.each([
  ["He had wound the cable around a reel.", "waʊnd"],
  ["She has wound up the clock.", "waʊnd"],
  ["The cable was wound around a reel.", "waʊnd"],
  ["The spirally-wound roller was replaced.", "waʊnd"],
  ["They have wound care supplies.", "wund"],
  ["He has wound care.", "wund"],
  ["The patient has wound infection.", "wund"],
  ["They will wound the guard.", "wund"],
  ["He had a wound on his arm.", "wund"],
  ["They wound the cord yesterday.", "waʊnd"],
])("selects the reading in %s", (sentence, expected) => {
  expect(phone(sentence)).toBe(expected);
});

test("retains another homograph's participle and caller-specified readings", () => {
  expect(phone("They have read books.", "read")).toBe("ɹɛd");
  expect(engine.predict("wound", "en-US", "V")).toBe("waʊnd");
  expect(engine.predict("wound", "en-US", "N")).toBe("wund");
  expect(phone("He wounds the animal.", "wounds")).toBe("wundz");
  expect(phone("The wounds are deep.", "wounds")).toBe("wundz");
});
