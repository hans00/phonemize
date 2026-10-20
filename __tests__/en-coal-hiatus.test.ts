import EnglishG2P from "../src/en/g2p";

const g2p = new EnglishG2P({ disableDict: true });
const defaultG2p = new EnglishG2P();

describe("initial coa hiatus in the coal- / coalesc- root families", () => {
  it.each([
    ["coalition", "koʊəˈɫɪʃən"],
    ["coalitions", "ˌkoʊəˈɫɪʃənz"],
    ["coalesce", "koʊəˈɫɛs"],
    ["coalesced", "ˌkoʊəˈɫɛst"],
    ["coalescing", "ˌkoʊəˈɫɛsɪŋ"],
    ["coalescent", "koʊəˈɫɛsənt"],
    ["coalescence", "ˌkoʊəˈɫɛsəns"],
  ])("reads %s with the unstressed <a> nucleus", (word, expected) => {
    expect(g2p.predict(word)).toBe(expected);
    expect(defaultG2p.predict(word)).toBe(expected);
  });

  it("keeps the coal rime and ordinary co- vowel boundaries", () => {
    expect(g2p.predict("coal")).toBe("ˈkoʊɫ");
    expect(g2p.predict("coaling")).toBe("ˈkoʊɫɪŋ");
    expect(g2p.predict("coauthor")).toBe("ˈkoʊəθɝ");
    expect(g2p.predict("cooperate")).toBe("ˈkupɝˌeɪt");
  });
});
