import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe("strong to and compounds ending in -to", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([["to", "ˈtu"], ["into", "ˈɪntu"], ["onto", "ˈɑntu"]])(
    "uses /u/ in %s",
    (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
  );

  it.each([["photo", "ˈfoʊtoʊ"], ["pinto", "ˈpɪntoʊ"], ["tonto", "ˈtɑntoʊ"]])(
    "keeps ordinary final -to in %s",
    (word, expected) => expect(rules.predict(word, "en-US")).toBe(expected),
  );

  it("keeps weak to in connected speech", () => {

    const tokens = englishTokens(rules, "I want to go into town.");
    expect(tokens.find(token => token.word === "to")?.phoneme).toBe("tə");
    expect(tokens.find(token => token.word === "into")?.phoneme).toBe("ˈɪntu");
  });
});
