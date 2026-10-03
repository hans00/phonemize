import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("ion derivative boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["practitioner", "partitioner", "positioner", "auctioner", "auctioneer"])("%s preserves palatal tion across the n onset", word => {
    expect(g2p.predict(word, "en")).toMatch(/ʃə[ˈˌ]?n/);
  });
  test.each(["missionary", "cessionary", "recessionary"])("%s preserves voiceless sion after s", word => {
    expect(g2p.predict(word, "en")).toMatch(/ʃə[ˈˌ]?n/);
  });
  test.each(["visionary", "illusionary", "exclusionary"])("%s preserves voiced sion", word => {
    expect(g2p.predict(word, "en")).toMatch(/ʒə[ˈˌ]?n/);
  });
  test.each(["stationery", "stationary"])("%s preserves the open-a root and strong final rime", word => {
    expect(g2p.predict(word, "en")).toMatch(/steɪʃəˌ?nɛɹi/);
  });
  test.each(["nutritionist", "revisionist", "conditioner", "dictionary", "functionary"])("%s preserves its existing ion reading", word => {
    expect(g2p.predict(word, "en")).toMatch(/[ʃʒ]ə[ˈˌ]?n/);
  });
});

test("a stressed io hiatus is not an unstressed ion ending", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  expect(g2p.predict("cationic", "en")).not.toMatch(/ʃ/);
});

test("trace attributes the split suffix to its existing table rule", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  const trace = g2p.trace("practitioner");
  expect(trace.steps.some(step => step.grapheme === "tio" && step.phoneme === "ʃə" && step.rule.endsWith(":boundary"))).toBe(true);
});

test.each(["practitioner", "stationery"])("%s survives the public API", word => {
  expect(toIPA(word)).toMatch(/ʃə[ˈˌ]?n/);
});
