import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const api = createPhonemizer({ processors: [new EnglishG2P()] });
describe("determined participial noun modifiers", () => {
  it.each([
    ["It was an engrossing read.", "read", "ɹid"],
    ["It was a crackling read.", "read", "ɹid"],
    ['It was a "crackling read.', "read", "ɹid"],
    ["An interesting read can present a problem.", "read", "ɹid"],
    ["An interesting read can present a problem.", "present", "pɹɪˈzɛnt"],
    ["The following read the notice.", "read", "ɹid"],
    ["The building permits the work.", "permits", "pɝˈmɪts"],
  ])("preserves the syntactic reading in %s", (sentence, word, ipa) => {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === word)?.phoneme).toBe(ipa);
  });
});
