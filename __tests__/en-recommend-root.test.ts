import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

const RECOMMEND = "ˌɹɛkəˈmɛnd";

describe.each([false, true])("Cambridge-sourced recommend root (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  test("uses the standard verb reading while preserving its inflections", () => {
    expect(engine.predict("recommend", "en", "V")).toBe(RECOMMEND);
    expect(engine.predict("recommends", "en", "V")).toBe("ˌɹɛkəˈmɛndz");
    expect(engine.predict("recommended", "en", "V")).toBe("ˌɹɛkəˈmɛndɪd");
    expect(engine.predict("recommending", "en", "V")).toBe("ˌɹɛkəˈmɛndɪŋ");
  });

  test("does not rewrite the related commend or recommendation roots", () => {
    expect(engine.predict("commend", "en", "V")).toBe("kəˈmɛnd");
    expect(engine.predict("commendation", "en", "N")).toBe("ˌkɑmənˈdeɪʃən");
  });
});

test("keeps verb POS and the complement's subjunctive reading in context", () => {
  const engine = new EnglishG2P();

  const tokens = englishTokens(engine, "I recommend that he read the book.");
  expect(tokens.find(token => token.word === "recommend")?.phoneme).toBe(RECOMMEND);
  expect(tokens.find(token => token.word === "read")?.phoneme).toBe("ɹid");
});
