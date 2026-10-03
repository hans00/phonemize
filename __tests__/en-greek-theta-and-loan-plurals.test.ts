import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("Greek theta and loan plurals (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["theater", "theatre", "theorem", "theory", "theoretical", "theology", "therapeutic", "therapist", "therapy", "thermal", "thermodynamic"])("%s keeps the voiceless Greek onset", word => {
    expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?θ/);
  });
  test.each(["therapy", "therapist", "therapeutic"])("%s does not read its initial syllable as the article", word => {
    expect(g2p.predict(word, "en")).toMatch(/θɛɹ/);
  });
  test.each(["the", "them", "themselves", "there", "therefore", "thenceforth"])("%s retains its voiced function-word onset", word => {
    expect(g2p.predict(word, "en")).toMatch(/^[ˈˌ]?ð/);
  });
  test.each(["mother", "brother", "weather", "father", "further", "other"])("%s preserves its medial voiced dental", word => {
    expect(g2p.predict(word, "en")).toMatch(/ð/);
  });
  test.each(["she", "he"])("%s retains its pronoun vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/i$/);
  });
  test("skis derives from the attested ski loan stem", () => {
    expect(g2p.predict("skis", "en")).toMatch(/skiz$/);
  });
  test.each(["this", "his", "has", "yes"])("%s is not a false vowel-stem plural", word => {
    expect(g2p.predict(word, "en")).not.toMatch(/(?:aɪ|eɪ|i)z$/);
  });
});

test.each(["therapy", "therapeutic", "theoretical", "skis"])("%s is preserved through the public API", word => {
  expect(toIPA(word)).toMatch(word === "skis" ? /skiz/ : /θ/);
});
