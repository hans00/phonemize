import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("suffix boundaries (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["steal", "appeal", "reveal"])("%s keeps its ea vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/iɫ$/);
  });
  test.each(["coal", "goal", "shoal"])("%s keeps its oa vowel", word => {
    expect(g2p.predict(word, "en")).toMatch(/oʊɫ$/);
  });
  test("trial keeps its vowel-initial suffix boundary", () => {
    expect(g2p.predict("trial", "en")).toMatch(/aɪəɫ$/);
  });
  test("argument sees the medial u glide and reduction", () => {
    expect(g2p.predict("argument", "en")).toMatch(/ɡjəmənt$/);
  });
  test("document sees the medial u glide", () => {
    expect(g2p.predict("document", "en")).toMatch(/kjəm[əɛ]nt$/);
  });
  test("instrument reduces medial u after r without a glide", () => {
    expect(g2p.predict("instrument", "en")).toMatch(/ɹəmənt$/);
  });
  test.each([
    ["achievement", /ivmənt$/], ["basement", /eɪsmənt$/],
    ["grateful", /eɪtfəɫ$/], ["homeless", /oʊmɫəs$/],
  ] as const)("%s retains its free silent-e stem vowel", (word, ending) => {
    expect(g2p.predict(word, "en")).toMatch(ending);
  });
  test("an attested u-final root retains its supplied reading", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("fabu", "F AE1 B UW0");
    expect(custom.predict("fabument", "en")).toMatch(/bumənt$/);
  });
});
