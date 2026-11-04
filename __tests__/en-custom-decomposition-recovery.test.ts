import EnglishG2P from "../src/en/g2p";
import { withoutDictionaryEntries } from "./helpers/english";

describe.each([false, true])("custom compound parts after lexical eviction (rules=%s)", (disableDict) => {
  it.each(["visco", "pico", "bio"])("preserves an explicit custom tail after %s", (head) => {
    const engine = new EnglishG2P({ disableDict });
    withoutDictionaryEntries(engine, ["bewilder"]);
    engine.addPronunciation("bewilder", "ˈzɛŋ");
    expect(engine.predict(head + "bewilder")).toContain("zɛŋ");
    expect(engine.predict("bewilder")).toBe("ˈzɛŋ");
  });
});
