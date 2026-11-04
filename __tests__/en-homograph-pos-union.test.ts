import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge lists the disyllabic EDUCATED reading as an adjective.
describe("homograph readings shared across lexical POS", () => {
  it.each(["N", "ADJ"])("selects the OLD reading of aged for %s", pos => {
    expect(new EnglishG2P().predict("aged", "en-US", pos)).toBe("ˈeɪdʒɪd");
  });
  it.each(["V", "VBD", "!V"])("selects the AGE reading of aged for %s", pos => {
    expect(new EnglishG2P().predict("aged", "en-US", pos)).toBe("eɪdʒd");
  });
  it.each(["N", "ADJ"])("selects the educated reading for %s", pos => {
    expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ˈɫɝnɪd");
  });
  it.each(["V", "VBD", "!V"])("preserves the complementary reading for %s", pos => {
    expect(new EnglishG2P().predict("learned", "en-US", pos)).toBe("ɫɝnd");
  });
  it("keeps the verb in full prose and the caller's direct override", () => {
    const engine = new EnglishG2P();
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("They learned the lesson.", { language: "en-US", returnArray: true }).find(t => t.word === "learned")?.phoneme).toBe("ɫɝnd");
    engine.addPronunciation("learned", "ˈzɛŋ");
    expect(engine.predict("learned", "en-US", "ADJ")).toBe("ˈzɛŋ");
  });
  it("selects old-age vs of-age readings in full sentences", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P()] });
    const old = api.phonemize("Moumita takes good care of aged Pranabendu.", { language: "en-US", returnArray: true });
    const ofAge = api.phonemize("The students were aged 18.", { language: "en-US", returnArray: true });
    const verb = api.phonemize("She has aged well.", { language: "en-US", returnArray: true });

    expect(old.find(token => token.word === "aged")?.phoneme).toBe("ˈeɪdʒɪd");
    expect(ofAge.find(token => token.word === "aged")?.phoneme).toBe("eɪdʒd");
    expect(verb.find(token => token.word === "aged")?.phoneme).toBe("eɪdʒd");
  });
});

it("keeps an independently sourced noun/base reading distinct from the participle", () => {
  const engine = new EnglishG2P();
  for (const pos of ["N", "V"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹid");
  for (const pos of ["ADJ", "VBD"]) expect(engine.predict("read", "en-US", pos)).toBe("ɹɛd");
});

it("uses an explicitly selected lexical adjective reading in rules-only mode", () => {
  const rules = new EnglishG2P({ disableDict: true });
  expect(rules.predict("wicked", "en-US", "ADJ")).toBe("ˈwɪkɪd");
  expect(rules.predict("wicked", "en-US", "V")).toBe("wɪkt");
  const api = createPhonemizer({ processors: [rules] });
  const adjective = api.phonemize("The wicked witch cackled.", { language: "en-US", returnArray: true });
  const verb = api.phonemize("They wicked the dog.", { language: "en-US", returnArray: true });
  expect(adjective.find(token => token.word === "wicked")?.phoneme).toBe("ˈwɪkɪd");
  expect(verb.find(token => token.word === "wicked")?.phoneme).toBe("wɪkt");
});

it("selects the dictionary-sourced certificate noun and verb in full sentences", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const noun = api.phonemize("The certificate expired.", { language: "en-US", returnArray: true });
  const verb = api.phonemize("The board will certificate the copy.", { language: "en-US", returnArray: true });

  expect(noun.find(token => token.word === "certificate")?.phoneme).toBe("sɝˈtɪfəkət");
  expect(verb.find(token => token.word === "certificate")?.phoneme).toBe("sɝˈtɪfɪkeɪt");
});
