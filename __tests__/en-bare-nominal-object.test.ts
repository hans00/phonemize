import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { SimplePOSTagger } from "../src/en/pos-tagger";

it("uses a clause-initial plural subject with a bare nominal object", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const sentence = "Contractors extract tens of thousands of samples from the area.";
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "extract")?.phoneme).toBe("ɪkˈstɹækt");
  const tagger = new SimplePOSTagger();
  for (const verb of ["extract", "permit", "record"]) {
    const words = ["Contractors", verb, "tens", "of", "samples", "."];
    expect(tagger.tagWord(verb, ["Contractors", "tens"], { words, index: 1 }).pos).toBe("V");
  }
});
it("preserves adjective and noun objects following a finite s verb", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const [sentence, word, ipa] of [
    ["The method yields approximate values of the unknowns.", "approximate", "əˈpɹɑksəmət"],
    ["The machine automatically invites appropriate users to answer questions.", "appropriate", "əˈpɹoʊpɹiət"],
    ["The procedure replaces duplicate individuals in the population.", "duplicate", "ˈdupɫəkət"],
    ["The Indian diaspora includes expatriate residents of France.", "expatriate", "ɛkˈspeɪtɹiət"],
    ["The reaction involves conjugate additions of enolates.", "conjugate", "ˈkɑndʒəɡət"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
