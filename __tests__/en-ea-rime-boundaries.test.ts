import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("ea rime boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["breath", "death", "deaf", "breathy", "breathless", "deathbed"])("%s preserves the checked vowel before f/th", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɛ[θf]/);
  });
  test.each(["heath", "sheath", "wreath", "beneath"])("%s keeps the high vowel outside the voiced-stop onset frame", word => {
    expect(g2p.predict(word, "en")).toMatch(/iθ/);
  });
  test.each(["break", "great", "breaking", "backbreaking", "lawbreaking", "greater", "greatest", "greatly", "greatness", "breaker"])("%s preserves the stop+r lengthened rime", word => {
    expect(g2p.predict(word, "en")).toMatch(/eɪ[kt]/);
  });
  test.each(["freak", "creak", "bleak", "beak", "peak"])("%s keeps the ordinary ea reading", word => {
    expect(g2p.predict(word, "en")).toMatch(/ik/);
  });
  test.each(["breathe", "breathing", "breather"])("%s preserves its sounded-e verb stem", word => {
    expect(g2p.predict(word, "en")).toMatch(/ið/);
  });
});

test.each(["breath", "death", "deaf", "break", "breaking", "great"])("%s survives the public API", word => {
  expect(toIPA(word)).toMatch(/ɛ[θf]|eɪ[kt]/);
});
