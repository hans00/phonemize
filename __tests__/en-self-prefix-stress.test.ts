import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge self-conscious, self-control and self-torment place primary on the root.
// https://dictionary.cambridge.org/pronunciation/english/self-conscious
// https://dictionary.cambridge.org/dictionary/english/self-control
// https://dictionary.cambridge.org/dictionary/english/self-torment
describe.each([false, true])("reflexive self- stress (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["self-conscious", "ˌsɛɫfˈkɑnʃəs"],
    ["self-control", "ˌsɛɫfkənˈtɹoʊɫ"],
    ["self-contained", "ˌsɛɫfkənˈteɪnd"],
    ["self-tormented", "ˌsɛɫftɔɹˈmɛntɪd"],
    ["self-tormenting", "ˌsɛɫftɔɹˈmɛntɪŋ"],
  ])("retains root stress in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test("preserves a supplied novel root's stress and weak initial vowel", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("vodded", "kəˈzɛŋ");
    expect(owned.predict("self-vodded")).toBe("ˌsɛɫfkəˈzɛŋ");
    owned.addPronunciation("self", "ˈkʌp");
    expect(owned.predict("self-vodded")).toBe("ˌkʌpkəˈzɛŋ");
    owned.addPronunciation("self-vodded", "ˈbɪm");
    expect(owned.predict("self-vodded")).toBe("ˈbɪm");
  });
});

test.each([
  ["get-together", "ˈɡɛttəˌɡɛðɝ"],
  ["air-conditioning", "ˈɛɹkənˌdɪʃənɪŋ"],
  ["serbo-croatian", "ˈsɝboʊkɹoʊˌeɪʃən"],
])("preserves the independent compound stress of %s", (word, ipa) => {
  expect(new EnglishG2P().predict(word)).toBe(ipa);
});

test("preserves noun, adjective and verb neighbors in complete sentences", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize("The self-conscious artist is quiet. The self-tormented man will record a song.", { language: "en-US", returnArray: true });
  expect(tokens.slice(1, 4).map(t => t.word)).toEqual(["self", "-", "conscious"]);
  expect(tokens.find(t => t.word === "conscious")?.phoneme).toBe("ˈkɑnʃəs");
  expect(tokens.find(t => t.word === "tormented")?.phoneme).toBe("tɔɹˈmɛntɪd");
  expect(tokens.find(t => t.word === "quiet")?.phoneme).toBe("ˈkwaɪət");
  expect(tokens.find(t => t.word === "record")?.phoneme).toBe("ɹɪˈkɔɹd");
});
