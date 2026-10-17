import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Cambridge: a singular name requires third-person -s in the present indicative.
const api = createPhonemizer({ processors: [new EnglishG2P()] });
describe("singular named subjects and finite tense", () => {
  it.each([
    ["Mary read the book.", "ɹɛd"],
    ["At the meeting, Mary read the report.", "ɹɛd"],
    ["Mary quickly read the report.", "ɹɛd"],
    ["Mary has read the book.", "ɹɛd"],
    ["Mary can read the book.", "ɹid"],
    ["They read the book daily.", "ɹid"],
    ["The Smiths read the book daily.", "ɹid"],
    ["I suggest Mary read the book.", "ɹid"],
    ["I insist that Mary read the book.", "ɹid"],
    ["For Mary read the next paragraph.", "ɹid"],
    ["Mary, read the next paragraph.", "ɹid"],
    ["Mary has a read of the book.", "ɹid"],
  ])("preserves the reading in %s", (sentence, ipa) => {
    const out = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === "read")?.phoneme).toBe(ipa);
  });
  it("preserves present agreement and neighboring adjective/noun readings", () => {
    const out = api.phonemize("Mary reads the elaborate record.", { language: "en-US", returnArray: true });
    expect(out.find(token => token.word === "reads")?.phoneme).toBe("ɹidz");
    expect(out.find(token => token.word === "elaborate")?.phoneme).toMatch(/ˈɫæb.*ət$/);
    expect(out.find(token => token.word === "record")?.phoneme).toBe("ˈɹɛkɝd");
  });
});
