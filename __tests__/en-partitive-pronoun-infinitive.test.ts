import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("plural partitive pronouns license a bare infinitival predicate", () => {
  const g = new EnglishG2P(), p = createPhonemizer({ processors: [g] });
  for (const sentence of ["Both of them refuse to believe this.", "Many of us refuse to leave.", "Some of them still refuse to enter."]) {
    expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
  }
  for (const sentence of ["The refuse to recycle is wet.", "Some of the students' refuse to recycle is wet."]) {
    expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ˈɹɛfjus");
  }
  expect(p.phonemize("Both of them Refuse to leave.", { language: "en-US", returnArray: true }).find(t => t.word === "Refuse")?.phoneme).toBe("ˈɹɛfjus");
  expect(p.phonemize("Some of the officers' conduct to review is documented.", { language: "en-US", returnArray: true }).find(t => t.word === "conduct")?.phoneme).toBe("ˈkɑndəkt");
  expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
  expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
  expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
});
