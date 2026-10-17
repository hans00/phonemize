import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge content: noun /ˈkɑntɛnt/, adjective and verb /kənˈtɛnt/.
const api = createPhonemizer({ processors: [new EnglishG2P()] });
describe("source-backed adjective associations and copular degree phrases", () => {
  it.each([["N", "ˈkɑntɛnt"], ["V", "kənˈtɛnt"], ["ADJ", "kənˈtɛnt"]])("preserves content as %s", (pos, ipa) => {
    expect(new EnglishG2P().predict("content", "en-US", pos)).toBe(ipa);
  });
  it.each([
    ["She was very content.", "content", "kənˈtɛnt"],
    ["She was not very content.", "content", "kənˈtɛnt"],
    ["She was still quite content.", "content", "kənˈtɛnt"],
    ["She was too content.", "content", "kənˈtɛnt"],
    ["He was very learned.", "learned", "ˈɫɝnɪd"],
    ["The very content was deleted.", "content", "ˈkɑntɛnt"],
    ["They content themselves.", "content", "kənˈtɛnt"],
    ["He has learned the lesson.", "learned", "ɫɝnd"],
    ["The lead pipe was heavy.", "lead", "ɫɛd"],
  ])("uses the supplied syntactic evidence in %s", (sentence, word, ipa) => {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
  });
});

// Cambridge learnedly: -ly composes with the adjective in a POS union.
it.each([false, true])("uses adjective unions in productive -ly, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  expect(engine.predict("learnedly")).toBe("ˈɫɝnɪdɫi");
  expect(engine.predict("closely")).toBe("ˈkɫoʊsɫi");
  expect(engine.predict("lively")).toBe("ˈɫaɪvɫi");
  engine.addPronunciation("learned", "ˈzɛŋ");
  expect(engine.predict("learnedly")).toBe("ˈzɛŋɫi");
  engine.addPronunciation("learnedly", "ˈbɛŋ");
  expect(engine.predict("learnedly")).toBe("ˈbɛŋ");
});
