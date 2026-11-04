import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test("-icity preserves a coda vowel only if the competing analysis disagrees", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(g.predict("toxicity", "en-US", pos)).toBe("tɑkˈsɪsəti");
      expect(g.predict("plasticity", "en-US", pos)).toBe("pɫæsˈtɪsəti");
      expect(g.predict("complicity", "en-US", pos)).toBe("kəmˈpɫɪsəti");
    }
    expect(g.predict("toxicities")).toBe("tɑkˈsɪsətiz");
    expect(g.predict("plasticities")).toBe("pɫæsˈtɪsətiz");
    expect(g.predict("publicity")).toMatch(/^pə/);
    expect(g.predict("simplicity")).toMatch(/^sɪm/);
    expect(g.predict("complicit")).toMatch(/^kəm/);
    expect(g.predict("object", "en-US", "N")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "ADJ")).toBe("ˈɑbdʒɛkt");
    expect(g.predict("object", "en-US", "V")).toBe("əbˈdʒɛkt");
    const p = createPhonemizer({ processors: [g] });
    for (const [sentence, expected] of [["The object is plastic.", "ˈɑbdʒɛkt"], ["They object to toxicity.", "əbˈdʒɛkt"]]) {
      expect(p.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === "object")?.phoneme).toBe(expected);
    }
    for (const language of ["en-US", "en-GB"]) {
      const tokens = p.phonemize("Toxicity and plasticity do not establish complicity.", { language, returnArray: true });
      expect(tokens.find(t => t.word === "Toxicity")?.phoneme).toMatch(/kˈsɪs/);
      expect(tokens.find(t => t.word === "plasticity")?.phoneme).toMatch(/æsˈtɪs/);
      expect(tokens.find(t => t.word === "complicity")?.phoneme).toMatch(/^kəm/);
    }
  }
});

test("caller-supplied adjective vowels compose through -icity and plural", () => {
  for (const disableDict of [false, true]) {
    const g = new EnglishG2P({ disableDict });
    g.addPronunciation("toxic", "ˈtɛksɪk");
    expect(g.predict("toxicity")).toBe("tɛkˈsɪsəti");
    expect(g.predict("toxicities")).toBe("tɛkˈsɪsətiz");
  }
});
