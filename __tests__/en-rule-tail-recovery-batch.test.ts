import { applyPostStress } from "../src/en/postlex";
import EnglishG2P from "../src/en/g2p";
import { parseIpa } from "../scripts/context-ipa";

const reading = (ipa: string) => {
  const { phones, primary } = parseIpa(ipa);
  return { phones, primary };
};

describe.each([false, true])("rule tails after exception eviction (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  // Simulate eviction per instance; never alter the shared imported table.
  const table = { ...Reflect.get(engine, "dictionary") };
  for (const root of ["elastic", "technologic", "academic", "alcoholic", "economic"]) delete table[root];
  Object.defineProperty(engine, "dictionary", { value: table });

  it.each([
    ["viscoelastic", "vɪskoʊɪˈlæstɪk"],
    ["picoelastic", "pikoʊɪˈlæstɪk"],
    ["biotechnological", "ˌbaɪoʊˌtɛknəˈlɑdʒɪkəl"],
    ["nonacademic", "nɑnˌækəˈdɛmɪk"],
    ["nonalcoholic", "nɑnˌælkəˈhɑlɪk"],
    ["noneconomic", "nɑnˌɛkəˈnɑmɪk"],
  ])("recovers the complete root in %s", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });

  it.each([
    ["technologic", "ˌtɛknəˈlɑdʒɪk"],
    ["geologic", "ˌdʒiəˈlɑdʒɪk"],
    ["biologic", "ˌbaɪəˈlɑdʒɪk"],
  ])("preserves the short Greek tail in %s", (word, ipa) => {
    expect(reading(engine.predict(word)!)).toEqual(reading(ipa));
  });
});

it.each([
  ["dietary", "ˈdaɪətɛɹi"],
  ["proprietary", "pɹəˈpɹaɪətɛɹi"],
  ["nonproprietary", "nɑnpɹəˈpɹaɪətɛɹi"],
])("keeps secondary-stress composition idempotent for %s", (word, ipa) => {
  const once = applyPostStress(ipa, word);
  expect(once).not.toMatch(/[ˈˌ]{2}/);
  expect(applyPostStress(once, word)).toBe(once);
});
