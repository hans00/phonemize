import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("diminutive ie with a vouched digraph root (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["cookie", "ˈkʊki"], ["cookies", "ˈkʊkiz"],
    ["bookie", "ˈbʊki"], ["bookies", "ˈbʊkiz"],
    ["rookie", "ˈɹʊki"], ["rookies", "ˈɹʊkiz"],
    ["goodie", "ˈɡʊdi"], ["goodies", "ˈɡʊdiz"],
    ["sweetie", "ˈswiti"], ["spookie", "ˈspuki"], ["kookie", "ˈkuki"],
    ["ladies", "ˈɫeɪdiz"], ["navies", "ˈneɪviz"], ["allie", "ˈæɫi"],
    ["book", "ˈbʊk"], ["cook", "ˈkʊk"], ["noncookie", "nɑnˈkʊki"],
    ["steadier", "ˈstɛdiɝ"], ["steadiest", "ˈstɛdiəst"],
  ])("retains the root or neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains singular and plural roots after lexical eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["cookie", "cookies", "bookie", "bookies", "rookie", "rookies", "goodie", "goodies"]) delete access.dictionary[word];
    expect(evicted.predict("cookie")).toBe("ˈkʊki");
    expect(evicted.predict("cookies")).toBe("ˈkʊkiz");
    expect(evicted.predict("bookie")).toBe("ˈbʊki");
    expect(evicted.predict("rookie")).toBe("ˈɹʊki");
    expect(evicted.predict("goodie")).toBe("ˈɡʊdi");
  });
  it("honors a custom complete root", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.cookie;
    custom.addPronunciation("cook", "K UW1 K");
    expect(custom.predict("cookie")).toBe("ˈkuki");
  });
  it("preserves an ambiguous rhotic name and bound verb frame", () => {
    expect(engine.predict("fourier")).toBe(disableDict ? "ˈfaʊɹiɝ" : "ˈfʊɹieɪ");
    expect(engine.predict("belie")).toBe(disableDict ? "bɪˈɫi" : "bɪˈɫaɪ");
  });
  it("retains noun, adjective and finite verb controls in prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever rookie will cook a cookie.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "rookie")?.phoneme).toBe("ˈɹʊki");
    expect(tokens.find(t => t.word === "cookie")?.phoneme).toBe("ˈkʊki");
    expect(tokens.find(t => t.word === "cook")?.phoneme).toBe("kʊk");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
  });
});
