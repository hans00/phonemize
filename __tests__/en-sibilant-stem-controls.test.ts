import EnglishG2P from "../src/en/g2p";

test.each([false, true])("silent-e sibilant roots survive inflection (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  expect(engine.predict("lenses", "en-US")).toBe("ˈɫɛnzəz");
  expect(engine.predict("rinses", "en-US")).toBe("ˈɹɪnsəz");
  expect(engine.predict("tenses", "en-US")).toBe("ˈtɛnsəz");
  expect(engine.predict("senses", "en-US")).toBe("ˈsɛnsəz");
  expect(engine.predict("suspense", "en-US")).toBe("səˈspɛns");
  expect(engine.predict("suspenseful", "en-US")).toBe("səˈspɛnsfəɫ");
  expect(engine.predict("dispense", "en-US")).toBe("dɪˈspɛns");
  engine.addPronunciation("rinse", "ˈzi");
  expect(engine.predict("rinses", "en-US")).toBe("ˈziz");
  engine.addPronunciation("suspense", "ˈzaɪ");
  expect(engine.predict("suspenseful", "en-US")).toBe("ˈzaɪfəɫ");
});
