import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge US forgotten /fɚˈɡɑːtən/, forbidden /fɚˈbɪdən/;
// its Academic Content entry also accepts full /fɔr-/ with root stress.
describe.each([false, true])("native for- participles (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([["forgotten", "fɝˈɡɑtən"], ["forbidden", "fɝˈbɪdən"]])("retains root stress and a vouched prefix reading in %s", (word, ipa) => {
    const expected = word === "forbidden" && !disableDict ? "fɔɹˈbɪdən" : ipa;
    expect(engine.predict(word)).toBe(expected);
    expect(engine.predict(word, "en-US", "V")).toBe(expected);
    expect(engine.predict(word, "en-US", "ADJ")).toBe(expected);
  });
  test.each([["unforgotten", "ˌʌnfɝˈɡɑtən"], ["nonforgotten", "ˌnɑnfɝˈɡɑtən"], ["unforbidden", "ˌʌnfɔɹˈbɪdən"], ["forbiddenness", "fɔɹˈbɪdənnəs"], ["forbiddenly", "fɔɹˈbɪdənɫi"], ["forgottens", "fɝˈɡɑtənz"]])("preserves the stem reading in an OOV derivative: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test.each([["forgabben", "fɝˈɡæbən"], ["forfadden", "fɝˈfædən"]])("applies the same checked participial frame to a novel form: %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  test.each(["format", "formality", "formalities", "fortuitous", "forlenza", "fortuna", "forgo"])("preserves the full rime outside the participial boundary: %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^fɔɹ/);
  });
  test("preserves adjective and passive contexts plus unrelated noun/verb controls", () => {

    const tokens = englishTokens(engine, "The forgotten book is old. Smoking is forbidden here. They format reports.");
    expect(tokens.find(token => token.word === "forgotten")?.phoneme).toBe("fɝˈɡɑtən");
    expect(tokens.find(token => token.word === "forbidden")?.phoneme).toBe(disableDict ? "fɝˈbɪdən" : "fɔɹˈbɪdən");
    expect(tokens.find(token => token.word === "book")?.phoneme).toBe("bʊk");
    expect(tokens.find(token => token.word === "format")?.phoneme?.replace(/[ˈˌ]/g, "")).toMatch(/^fɔɹ/);
  });
});

test("retains caller ownership of a complete participle", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("forgotten", "ˈzɛŋ");
  expect(engine.predict("forgotten")).toBe("ˈzɛŋ");
  expect(engine.predict("unforgotten")).toBe("ənˈzɛŋ");
  expect(engine.predict("forgottens")).toBe("ˈzɛŋz");
});
