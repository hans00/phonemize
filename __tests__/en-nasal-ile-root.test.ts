import EnglishG2P from "../src/en/g2p";

// MW juvenile, senile and penile independently attest the final PRICE reading.
describe.each([false, true])("nasal ile roots, rules=%s", (disableDict) => {
  test.each([undefined, "N", "ADJ", "V"])("preserves the root for caller POS %s", (pos) => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["juvenile", "penile", "senile"])
      expect(engine.predict(word, "en-US", pos)).toMatch(/naɪɫ$/);
  });

  test.each(["juvenile", "penile", "senile"])("composes after target eviction: %s", (root) => {
    const engine = new EnglishG2P({ disableDict });
    // Exercise removal by the exception miner without modifying generated tables.
    const dictionary = { ...Reflect.get(engine, "dictionary") };
    delete dictionary[root];
    Object.defineProperty(engine, "dictionary", { value: dictionary });
    const bare = engine.predict(root);
    for (const suffix of ["s", "ness", "like"])
      expect(engine.predict(root + suffix)).toContain(bare);
    expect(engine.predict("non" + root)).toContain(bare);
  });

  test("retains caller-supplied root and target readings", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("vornil", "ˈvɔɹnɪl");
    engine.addPronunciation("juvenile", "ˈdʒuvənəl");
    expect(engine.predict("juvenile")).toBe("ˈdʒuvənəl");
    engine.addPronunciation("nonjuvenile", "ˈnɑndʒuvənəl");
    expect(engine.predict("nonjuvenile")).toBe("ˈnɑndʒuvənəl");
  });
});
