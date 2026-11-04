import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { preserveAryDiphthongs } from "../src/en/morph-parser";

// https://www.oxfordlearnersdictionaries.com/definition/english/librarian
// https://dictionary.cambridge.org/us/pronunciation/english/ovarian
// Pin the inherited nucleus; secondary-stress conventions belong to the renderer.
describe.each([false, true])("-ary/-arian root inheritance (disableDict=%s)", disableDict => {
  test.each([undefined, "N", "ADJ", "V"])("preserves root diphthongs with caller POS %s", pos => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("librarian", "en-US", pos)).toMatch(/^ɫaɪˈbɹɛ/);
    expect(engine.predict("ovarian", "en-US", pos)).toMatch(/^oʊˈvɛ/);
  });
  test.each(["librarians", "librarianlike", "librarianhood", "nonlibrarian"])("keeps the root through %s", word => {
    expect(new EnglishG2P({ disableDict }).predict(word)).toContain("ɫaɪˈbɹɛ");
  });
  test("honors a caller-owned complete pronunciation", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("librarian", "lɪˈbɹɛɹiən");
    expect(engine.predict("librarian")).toBe("lɪˈbɹɛɹiən");
  });
  test("inherits an aligned novel root without copying its weak vowels", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("pivary", "ˈpaɪvɝi");
    expect(engine.predict("pivarian")).toBe("paɪˈvɛɹiən");
  });
  test("rejects a supplied root with a different consonant skeleton", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("pivary", "ˈpaɪkɝi");
    expect(engine.predict("pivarian")).toBe("pɪˈvɛɹiən");
  });
  test("rejects a supplied root with a different number of nuclei", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("pivary", "ˈpaɪvɝ");
    expect(engine.predict("pivarian")).toBe("pɪˈvɛɹiən");
  });
  test("retains an evicted -arian root through outer composition", () => {
    const engine = new EnglishG2P({ disableDict });
    const stored: unknown = Reflect.get(engine, "dictionary");
    if (!stored || typeof stored !== "object") throw new Error("Missing dictionary");
    const table: Record<string, unknown> = { ...stored };
    delete table.librarian; delete table.ovarian;
    Object.defineProperty(engine, "dictionary", { value: table });
    for (const word of ["librarian", "librarians", "nonlibrarian", "librarianlike"])
      expect(engine.predict(word)).toContain("ɫaɪˈbɹɛ");
    for (const word of ["ovarian", "ovarians", "ovarianlike"])
      expect(engine.predict(word)).toMatch(/^oʊˈvɛ/);
  });
  test("composes a novel derived root before plural and privative boundaries", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("pivary", "ˈpaɪvɝi");
    expect(engine.predict("pivarians")).toBe("paɪˈvɛɹiənz");
    expect(engine.predict("nonpivarian")).toContain("paɪˈvɛɹiən");
  });
  test("reuses a proven novel stem before other productive suffixes", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("pivary", "ˈpaɪvɝi");
    expect(engine.predict("pivarianed")).toBe("paɪˈvɛɹiənd");
    expect(engine.predict("pivarianing")).toBe("paɪˈvɛɹiənɪŋ");
    expect(engine.predict("pivarianer")).toBe("paɪˈvɛɹiənɝ");
    expect(engine.predict("pivarianes")).toBe("paɪˈvɛɹiənz");
  });
  test("keeps an intact root whose apparent prefix has no proven -ary repair", () => {
    expect(new EnglishG2P({ disableDict }).predict("disciplinarian")).toMatch(/^ˌdɪs/);
  });
  test("preserves short roots and existing reduced vowels", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("marian")).toBe("ˈmɛɹiən");
    expect(engine.predict("agrarian")).toBe("əˈɡɹɛɹiən");
    expect(engine.predict("unitarian")).toBe("ˌjunəˈtɛɹiən");
    expect(engine.predict("riparian")).toBe("ɹɪˈpɛɹiən");
  });
  test("preserves the surrounding noun, adjective and verb", () => {
    const engine = new EnglishG2P({ disableDict });
    const tokens = createPhonemizer({ processors: [engine] }).phonemize(
      "The careful librarian records a review of ovarian development.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(t => t.word === "librarian")?.phoneme).toMatch(/^ɫaɪˈbɹɛ/);
    expect(tokens.find(t => t.word === "ovarian")?.phoneme).toMatch(/^oʊˈvɛ/);
    expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
    expect(tokens.find(t => t.word === "development")?.phoneme).toBe("dɪˈvɛɫəpmənt");
    expect(tokens.find(t => t.word === "records")?.phoneme).toBe("ɹɪˈkɔɹdz");
  });
});

test("inheritance cannot replace an accented or already full derived vowel", () => {
  expect(preserveAryDiphthongs("ˈpɪvɛɹiən", "ˈpaɪvɛɹi")).toBe("ˈpɪvɛɹiən");
  expect(preserveAryDiphthongs("pɑˈvɛɹiən", "ˈpaɪvɛɹi")).toBe("pɑˈvɛɹiən");
});
