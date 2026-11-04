import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("partitive plural subjects license an infinitival verb", () => {
  const g = new EnglishG2P(), p = createPhonemizer({ processors: [g] });
  expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
  expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
  expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
  for (const sentence of [
    "Several of the speakers refuse to sign.",
    "Some of the local workers still refuse to leave.",
    "Both of the people refuse to leave.",
    "Today, several of the Korku speakers refuse to acknowledge the Nihali language.",
  ]) {
    expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ɹɪˈfjuz");
  }
  for (const sentence of ["Some of the yard refuse to recycle is wet.", "The yard refuse to recycle is wet.", "Some of the students' refuse to recycle is wet.", "Both of the children's refuse to recycle is wet."]) {
    expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "refuse")?.phoneme).toBe("ˈɹɛfjus");
  }
  expect(p.phonemize("Some of the officers' conduct to review is documented.", { language: "en-US", returnArray: true }).find(t => t.word === "conduct")?.phoneme).toBe("ˈkɑndəkt");
  expect(p.phonemize("The government contract to purchase equipment expired.", { language: "en-US", returnArray: true }).find(t => t.word === "contract")?.phoneme).toBe("ˈkɑntɹækt");
});
