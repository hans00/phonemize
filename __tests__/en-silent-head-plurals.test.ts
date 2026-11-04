import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("silent-e compound inflections, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["trademark", "ˈtɹeɪdˌmɑɹk", "trademarks", "ˈtɹeɪdˌmɑɹks"],
    ["notebook", "ˈnoʊtˌbʊk", "notebooks", "ˈnoʊtˌbʊks"],
    ["homeboy", "ˈhoʊmˌbɔɪ", "homeboys", "ˈhoʊmˌbɔɪz"],
    ["notebag", "ˈnoʊtˌbæɡ", "notebags", "ˈnoʊtˌbæɡz"],
    ["homekit", "ˈhoʊmˌkɪt", "homekits", "ˈhoʊmˌkɪts"],
  ])("retains the head rime in %s / %s", (stem, singular, plural, expected) => {
    expect(engine.predict(stem)).toBe(singular);
    expect(engine.predict(plural)).toBe(expected);
  });
  test("preserves y-plural restoration and ordinary short roots", () => {
    expect(engine.predict("comedies")).toBe("ˈkɑmədiz");
    expect(engine.predict("limpets")).toBe("ˈɫɪmpəts");
    expect(engine.predict("neckties")).toBe("ˈnɛkˌtaɪz");
    expect(engine.predict("placeboes")).toBe("pɫəˈsiboʊz");
    expect(engine.predict("outdoes")).toBe("ˌaʊtˈdʌz");
    expect(engine.predict("sidelined")).toBe("ˈsaɪdˌɫaɪnd");
    expect(engine.predict("stalemated")).toBe("ˈsteɪɫˌmeɪtɪd");
  });
  test.each([
    ["flower", "ˈfɫaʊɝ"], ["shower", "ˈʃaʊɝ"],
    ["tower", "ˈtaʊɝ"], ["glower", "ˈɡɫaʊɝ"],
    ["forecast", "ˈfɔɹˌkæst"],
  ])("retains an evicted stem across -ed and -ing: %s", (stem, ipa) => {
    expect(engine.predict(stem + "ing")).toBe(ipa + "ɪŋ");
    expect(engine.predict(stem + "ed")).toBe(ipa + (stem.endsWith("t") ? "ɪd" : "d"));
    if (stem.endsWith("ower")) expect(engine.predict(stem + "er")).toBe(ipa + "ɝ");
  });
  test.each([
    ["Their trademarks are registered.", "trademarks", "ˈtɹeɪdˌmɑɹks"],
    ["She trademarks the design.", "trademarks", "ˈtɹeɪdˌmɑɹks"],
    ["Her notebooks are open.", "notebooks", "ˈnoʊtˌbʊks"],
    ["The flowering plant is tall.", "flowering", "ˈfɫaʊɝɪŋ"],
    ["They are showering now.", "showering", "ˈʃaʊɝɪŋ"],
    ["They are forecasting rain.", "forecasting", "ˈfɔɹˌkæstɪŋ"],
  ])("preserves sentence context in %s", (sentence, word, ipa) => {
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
  });
  test("keeps caller-owned whole stems ahead of recovered compound parts", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("notebook", "N AA1 T B UH2 K");
    expect(custom.predict("notebooks")).toBe("ˈnɑtˌbʊks");
    expect(engine.predict("notebooks")).toBe("ˈnoʊtˌbʊks");
  });
});

test("keeps neighboring adjective and noun/verb readings in full prose", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const target = (sentence: string, word: string) => api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme;
  expect(target("The appropriate trademarks are listed.", "appropriate")).toBe("əˈpɹoʊpɹiət");
  expect(target("They record the trademark.", "record")).toBe("ɹɪˈkɔɹd");
  expect(target("The record shows trademarks.", "record")).toBe("ˈɹɛkɝd");
});
