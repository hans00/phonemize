import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import dictionary = require("../data/en/dict.json");

describe.each([false, true])("complete -sh stems (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test("keeps the stem vowel in agents and inflections", () => {
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(engine.predict("washer", "en-US", pos)).toBe("ˈwɑʃɝ");
      expect(engine.predict("washes", "en-US", pos)).toContain("wɑʃ");
      expect(engine.predict("squasher", "en-US", pos)).toContain("kwɑʃɝ");
      expect(engine.predict("squashes", "en-US", pos)).toContain("kwɑʃ");
    }
    expect(engine.predict("ambushes", "en-US")).toContain("bʊʃ");
    expect(engine.predict("distinguishes", "en-US")).toContain("dɪˈstɪŋɡwɪʃ");
    expect(engine.predict("swordfishes", "en-US")).toMatch(/^ˈsɔɹd(?:ˌ)?fɪʃ/);
    expect(engine.predict("whitewashes", "en-US")).toContain("wɑʃ");
  });
  test("keeps neighboring roots and endings", () => {
    expect(engine.predict("wash")).toBe("ˈwɑʃ");
    expect(engine.predict("washed")).toBe("ˈwɑʃt");
    expect(engine.predict("washing")).toBe("ˈwɑʃɪŋ");
    expect(engine.predict("watcher")).toBe("ˈwɑtʃɝ");
    expect(engine.predict("wagon")).toBe("ˈwæɡən");
    expect(engine.predict("wager")).toBe("ˈweɪdʒɝ");
    expect(engine.predict("dishes")).toBe("ˈdɪʃəz");
  });
  test.each(["en-US", "en-GB"])("preserves target selection in %s sentences", language => {
    for (const [sentence, word] of [["The washer washes dishes.", "washer"], ["The washer washes dishes.", "washes"], ["They squashed the squashes.", "squashes"], ["She distinguishes cases.", "distinguishes"], ["They caught swordfishes.", "swordfishes"]]) {
      expect(api.phonemize(sentence, { language, returnArray: true }).find(token => token.word === word)?.phoneme)
        .toBe(engine.predict(word, language));
    }
  });
  test.each([["wash", "washes"], ["squash", "squasher"], ["languish", "languishes"], ["distinguish", "distinguishes"], ["swordfish", "swordfishes"]])("preserves an explicit %s stem", (root, word) => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation(root, "ˈtʊɡ");
    expect(custom.predict(word)).toMatch(/^ˈtʊɡ/);
  });
  test("retains caller stems after derived exceptions are evicted", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("wash", "ˈtʊɡ");
    custom.addPronunciation("brainwash", "ˈtʊɡ");
    expect(custom.predict("washer")).toBe("ˈtʊɡɝ");
    expect(custom.predict("washers")).toBe("ˈtʊɡɝz");
    expect(custom.predict("brainwashes")).toBe("ˈtʊɡz");
  });
  test("preserves the existing priority of a whole-word exception", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("ambush", "ˈtʊɡ");
    expect(custom.predict("ambushes")).toBe(disableDict ? "ˈtʊɡz" : engine.predict("ambushes"));
  });
});

test.each(["backlashes", "whiplashes"])("preserves the source stress convention for %s", word => {
  const reference = (dictionary as Record<string, string>)[word];
  expect(reference).toBeDefined();
  expect(new EnglishG2P({ disableDict: true }).predict(word)).toBe(reference);
});
