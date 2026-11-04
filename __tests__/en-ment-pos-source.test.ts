import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge US distinguishes segment by vowel and torment by primary stress.
// https://dictionary.cambridge.org/us/pronunciation/english/segment
// https://dictionary.cambridge.org/pronunciation/english/torment
const engine = new EnglishG2P();
test.each([
  ["segment", "N", "ˈsɛɡmənt"],
  ["segment", "V", "ˈsɛɡmɛnt"],
  ["torment", "N", "ˈtɔɹˌmɛnt"],
  ["torment", "V", "tɔɹˈmɛnt"],
])("preserves the US %s reading for %s", (word, pos, ipa) => {
  expect(engine.predict(word, "en-US", pos)).toBe(ipa);
});

test("distinguishes nominal and verbal readings in complete sentences", () => {

  const tokens = englishTokens(engine, "The segment is short. They segment the market. The torment is severe. They torment the prisoners.");
  expect(tokens.filter(t => t.word === "segment").map(t => t.phoneme)).toEqual(["ˈsɛɡmənt", "ˈsɛɡmɛnt"]);
  expect(tokens.filter(t => t.word === "torment").map(t => t.phoneme)).toEqual(["ˈtɔɹˌmɛnt", "tɔɹˈmɛnt"]);
  expect(tokens.find(t => t.word === "short")?.phoneme).toBe("ʃɔɹt");
});
