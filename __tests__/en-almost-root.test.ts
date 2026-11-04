import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("almost lexicalized compound reading", () => {
  it.each([false, true])("keeps the all+most vowel in the word and sentence (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("almost", "en-US", "RB")).toBe("ˈɔɫˌmoʊst");
    expect(engine.predict("all", "en-US")).toBe("ˈɔɫ");
    expect(engine.predict("most", "en-US")).toBe("ˈmoʊst");
    expect(engine.predict("foremost", "en-US")).toBe("ˈfɔɹˌmoʊst");


    const tokens = englishTokens(engine, "Almost all the work is done; most of it is foremost in our plan.");
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("almost")).toBe("ˈɔɫˌmoʊst");
    expect(reading("all")).toBe("ɔɫ");
    expect(reading("most")).toBe("moʊst");
    expect(reading("foremost")).toBe("ˈfɔɹˌmoʊst");
  });
});
