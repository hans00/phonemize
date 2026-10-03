import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("pre-l source rounding (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["salt", "bald", "false", "alter", "alternative", "also", "always", "baltimore", "malta", "walter"])("%s rounds its pre-l a", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]/);
  });
  test.each(["alto", "altitude", "altimeter", "altruism", "maltreat", "malware", "alderman"])("%s retains its learned/prefix vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/æ[lɫ]/);
  });
  test("aldinger keeps the supplied lexical variant and native rule vowel", () => {
    expect(g2p.predict("aldinger", "en")).toMatch(disableDict ? /^ˈæ[lɫ]/ : /^ˈɔ[lɫ]/);
  });
  test.each(["royalty", "loyalty"])("%s does not round a vowel in a merged diphthong slot", word => {
    expect(g2p.predict(word, "en")).not.toMatch(/ɔɪɔ[lɫ]/);
  });
  test.each(["salad", "balance", "valley", "galaxy"])("%s keeps a checked vowel outside the dental frame", word => {
    expect(g2p.predict(word, "en")).toMatch(/æ/);
  });
  test.each(["salted", "salting", "balding"])("%s retains its attested rounded root through inflection", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɔ[lɫ]/);
  });
});

test.each(["salt", "bald", "false", "always"])("%s is preserved through the public API", word => {
  expect(toIPA(word)).toMatch(/ɔ[lɫ]/);
});
