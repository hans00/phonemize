import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

it("uses an explicit past matrix after a clause-initial when adjunct", () => {
  for (const known of [false, true]) {
    const engine = new EnglishG2P();
    const tag = engine.tagWord.bind(engine);
    if (known) engine.tagWord = (word, context) => word === "read" ? { pos: "V", confidence: 1 } : tag(word, context);
    const api = createPhonemizer({ processors: [engine] });
    for (const sentence of ["When I read it, it changed everything.", "When I read it, it kind of changed everything.", "When we read it, they acted on the advice.", "When they read it, I was surprised.", "But when I read it, it moved me."])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
  }
});
it("preserves present/future matrices and ambiguous bare ed roots", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const sentence of ["When I read it, it makes me happy.", "When I read it, it will be changed.", "When I read it, I need glasses.", "When I read it, I embed the notes.", "When I read it, I shred the notes.", "When I read it, I bobsled afterwards.", "I know when I read it, it changed everything."])
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "read")?.phoneme).toBe("ɹid");
});
it("preserves explicit base-verb and noun controls", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  for (const sentence of ["The wound was clear.", "I will wound it when necessary."])
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "wound")?.phoneme).toBe("wund");
});
