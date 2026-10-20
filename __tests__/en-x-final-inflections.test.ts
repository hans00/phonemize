import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("x-final stem inflections, rules=%s", disableDict => {
  test("keeps the root vowel in regular past and -ing forms", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, ipa] of [
      ["fixed", "ˈfɪkst"], ["mixed", "ˈmɪkst"], ["taxed", "ˈtækst"],
      ["faxed", "ˈfækst"], ["waxed", "ˈwækst"], ["maxed", "ˈmækst"],
      ["flexed", "ˈfɫɛkst"], ["vexed", "ˈvɛkst"],
      ["fixing", "ˈfɪksɪŋ"], ["taxing", "ˈtæksɪŋ"],
    ]) expect(engine.predict(word)).toBe(ipa);
  });

  test("retains coda, multi-syllable and caller-owned controls", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("boxed")).toBe("ˈbɑkst");
    expect(engine.predict("relaxed")).toBe("ɹiˈɫækst");
    engine.addPronunciation("fix", "ˈtɛst");
    expect(engine.predict("fixed")).toBe("ˈtɛstɪd");
  });
});
