import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
// Cambridge: https://dictionary.cambridge.org/pronunciation/english/receipt
// Only the ceipt rime owns silent p; other pt clusters retain both stops.
test.each([false, true])("retains silent p through ceipt inflections (rules=%s)", disableDict => {
  const e = new EnglishG2P({ disableDict });
  const dictionary = { ...Reflect.get(e, "dictionary") };
  for (const w of ["receipt", "receipts", "receipted", "receipting"]) delete dictionary[w];
  Reflect.set(e, "dictionary", dictionary);
  for (const [word, ending] of [["receipt", "sit"], ["receipts", "sits"], ["receipted", "sitɪd"], ["receipting", "sitɪŋ"]]) {
    expect(e.predict(word)).toMatch(new RegExp(ending + "$"));
    expect(e.predict(word)).not.toContain("p");
  }
  for (const w of ["captain", "script", "adept", "deceptive"]) expect(e.predict(w)).toContain("pt");
  for (const w of ["ceiling", "conceit", "deceit"]) expect(e.predict(w)).toContain("si");
  const api = createPhonemizer({ processors: [e] });
  for (const sentence of ["The receipt was short.", "They receipt the payment.", "The signed receipt arrived."]) {
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "receipt")?.phoneme).toMatch(/sit$/);
  }
});
test("keeps caller-owned stops", () => {
  const e = new EnglishG2P({ disableDict: true });
  e.addPronunciation("receipt", "ɹiˈsipt");
  expect(e.predict("receipt")).toBe("ɹiˈsipt");
  expect(e.predict("receipts")).toBe("ɹiˈsipts");
  expect(e.predict("receipted")).toBe("ɹiˈsiptɪd");
});
