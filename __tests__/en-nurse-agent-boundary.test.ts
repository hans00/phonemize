import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("NURSE agent boundary (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["merger", "ˈmɝdʒɝ"], ["mergers", "ˈmɝdʒɝz"], ["merger's", "ˈmɝdʒɝz"],
    ["merge", "ˈmɝdʒ"], ["merging", "ˈmɝdʒɪŋ"], ["merged", "ˈmɝdʒd"],
    ["unmerged", "ənˈmɝdʒd"], ["urger", "ˈɝdʒɝ"], ["purger", "ˈpɝdʒɝ"], ["surger", "ˈsɝdʒɝ"],
    ["burger", "ˈbɝɡɝ"], ["burgers", "ˈbɝɡɝz"], ["Berger", "ˈbɝɡɝ"],
    ["Kruger", "ˈkɹuɡɝ"], ["tiger", "ˈtaɪɡɝ"], ["larger", "ˈɫɑɹdʒɝ"], ["charger", "ˈtʃɑɹdʒɝ"],
  ])("retains the root and neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("retains roots and plurals after target eviction", () => {
    const evicted = new EnglishG2P({ disableDict });
    const access = evicted as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["merger", "mergers", "merger's"]) delete access.dictionary[word];
    expect(evicted.predict("merger")).toBe("ˈmɝdʒɝ");
    expect(evicted.predict("mergers")).toBe("ˈmɝdʒɝz");
    expect(evicted.predict("merger's")).toBe("ˈmɝdʒɝz");
  });
  it("honors a caller's complete stem", () => {
    const custom = new EnglishG2P({ disableDict });
    const access = custom as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.merger;
    custom.addPronunciation("merge", "M ER1 G");
    expect(custom.predict("merger")).toBe("ˈmɝɡɝ");
  });
  it("preserves noun, adjective and finite verb controls in prose", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The larger merger will work.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "larger")?.phoneme).toBe("ˈɫɑɹdʒɝ");
    expect(tokens.find(t => t.word === "merger")?.phoneme).toBe("ˈmɝdʒɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});

it.each([["Ferger", "ˈfɝɡɝ"], ["Jerger", "ˈdʒɝɡɝ"], ["Boerger", "ˈbɔɹɡɝ"]])(
  "preserves the existing default source reading of %s after rebuild", (word, ipa) => {
    expect(new EnglishG2P().predict(word)).toBe(ipa);
  },
);
