import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("unvoiced th controls (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([["maths", "mæθs"], ["faiths", "feɪθs"]])("%s", (word, expected) => {
    expect(engine.predict(word, "en-US", "N")).toBe(expected);
  });
});
