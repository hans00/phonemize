import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("-al root controls (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  test("keeps the stress and weak vowel of independently pronounceable roots", () => {
    // Cambridge US shogun; shogun + -al is an attested derivation.
    expect(engine.predict("shogun", "en-US")).toBe("ˈʃoʊɡən");
    expect(engine.predict("shogunal", "en-US")).toBe("ˈʃoʊɡənəɫ");
    expect(engine.predict("faunal", "en-US")).toBe("ˈfɔnəɫ");
  });
});
