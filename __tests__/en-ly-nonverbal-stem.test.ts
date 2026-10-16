import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("nonverbal -ly base (rules=%s)", (disableDict) => {
  it.each([
    ["frequently", "ˈfɹikwəntɫi"],
    ["elaborately", "ɪˈɫæbɹətɫi"],
    ["intimately", "ˈɪntəmətɫi"],
    ["separately", "ˈsɛpɝətɫi"],
  ])("preserves the weak adjective reading in %s", (word, expected) => {
    expect(new EnglishG2P({ disableDict }).predict(word)).toBe(expected);
  });
});
it("preserves the existing primary stress when the phones already agree", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("alternately")).toBe("ˈɔɫtɝnətɫi");
});
it("preserves explicit custom stem pronunciations", () => {
  const engine = new EnglishG2P({ disableDict: true });
  engine.addPronunciation("frequent", "ˈzɛŋ");
  expect(engine.predict("frequently")).toBe("ˈzɛŋɫi");
});
