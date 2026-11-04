import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge US surgeon /ˈsɝː.dʒən/ and Oxford bludgeon/burgeon,
// including the Oxford-listed -s/-ed/-ing forms:
// https://dictionary.cambridge.org/pronunciation/english/surgeon
// https://www.oxfordlearnersdictionaries.com/definition/english/bludgeon
// https://www.oxfordlearnersdictionaries.com/us/definition/english/burgeon
// Synthetic controls assert only the rime this rule owns.
describe.each([false, true])("final geon rime (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["surgeon", "sturgeon", "bludgeon", "burgeon", "dungeon", "pigeon"])("coalesces the final weak nucleus in %s", word => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/dʒən$/);
  });
  test.each([
    ["surgeons", /dʒənz$/], ["surgeon's", /dʒənz$/],
    ["bludgeoned", /dʒənd$/], ["burgeoned", /dʒənd$/],
    ["bludgeoning", /dʒənɪŋ$/], ["burgeoning", /dʒənɪŋ$/],
    ["zurgeon", /dʒən$/], ["zurgeons", /dʒənz$/],
    ["zurgeoned", /dʒənd$/], ["zurgeoning", /dʒənɪŋ$/],
  ])("preserves the rime through the actual morphology route: %s", (word, rime) => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(rime);
  });
  test("retains initial and medial hiatus and the previous gion family", () => {
    expect(engine.predict("geon")).toBe("ˈdʒiɑn");
    expect(engine.predict("geonic")?.replace(/[ˈˌ]/g, "")).toContain("dʒi");
    for (const word of ["region", "religion", "contagion", "legion"])
      expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/dʒən$/);
  });
  test("preserves POS readings in full sentences", () => {

    const tokens = englishTokens(engine, "The surgeon records the event. They bludgeon the wall. The burgeoning town is quiet.");
    for (const [word, pos] of [["surgeon", "N"], ["bludgeon", "V"], ["burgeoning", "ADJ"]])
      expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", pos));
    expect(tokens.find(token => token.word === "records")?.phoneme).toBe(engine.predict("records", "en-US", "V"));
  });
  test("keeps caller-owned complete and derived readings", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("zurgeon", "ˈzɛŋ");
    expect(owned.predict("zurgeon")).toBe("ˈzɛŋ");
    expect(owned.predict("zurgeons")).toBe("ˈzɛŋz");
  });
});
