import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Weak -ably/-ibly spelling boundary (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  it.each([
    ["sibley", "ˈsɪbɫi"], ["shibley", "ˈʃɪbɫi"],
    ["mabley", "ˈmæbɫi"], ["stabley", "ˈstæbɫi"],
  ])("preserves the complete name root in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it.each(["probably", "possibly", "terribly", "horribly", "comfortably"])(
    "retains the weak suffix in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/əb[ɫl]i$/);
    },
  );

  it.each(["canola", "canolas", "canola's"])(
    "preserves the weak vowel before /noʊ/ in %s", word => {
      expect(engine.predict(word, "en-US")).toMatch(/^kəˈnoʊ/);
    },
  );
  it("preserves the same novel plural class beyond canola", () => {
    expect(engine.predict("granolas", "en-US")).toMatch(/^ɡɹəˈnoʊɫəz$/);
  });
  it("keeps a closed o syllable outside the plural-root frame", () => {
    expect(engine.predict("pocahontas", "en-US")).toMatch(/ntəs$/);
  });
  it("retains the KIT nucleus supplied to -tude", () => {
    expect(engine.predict("rectitude", "en-US")).toMatch(/tɪ[ˌ]?tud$/);
  });
  it.each([
    ["attitude", "ˈætəˌtud"], ["latitude", "ˈɫætəˌtud"],
    ["altitude", "ˈæɫtəˌtud"], ["solitude", "ˈsɑɫəˌtud"],
    ["know", "ˈnoʊ"], ["snow", "ˈsnoʊ"],
    ["texas", "ˈtɛksəs"], ["alias", "ˈeɪɫiəs"], ["canvas", "ˈkænvəs"],
  ])("preserves the unrelated root/suffix in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["Sibley arrived.", "Sibley", "sɪbɫi"],
    ["They probably arrived.", "probably", "əbɫi"],
  ])("preserves the boundary in %s", (sentence, word, phones) => {
    const target = phonemizer.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)!;
    expect(target.phoneme.replace(/[ˈˌ]/g, "")).toContain(phones);
  });
});

it.each([
  ["anona", "ɑˈnoʊnə"], ["cannone", "kɑˈnoʊni"], ["canova", "kɑˈnoʊvə"],
])("retains the supplied default reading of %s after re-mining", (word, ipa) => {
  expect(new EnglishG2P().predict(word, "en-US")).toBe(ipa);
});
