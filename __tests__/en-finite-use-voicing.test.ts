import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("finite monosyllabic use voicing, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phones = (word: string, pos: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "");
  it("preserves the noun/verb contrast without whole-target lexical lookup", () => {
    expect(phones("use", "V")).toBe("juz");
    expect(phones("use", "N")).toBe("jus");
  });
  it.each(["fuse", "muse", "truse"])("preserves the neighbouring monosyllable %s", word => {
    expect(phones(word, "V")).toMatch(/uz$/);
  });
  it("preserves regular verb inflections", () => {
    expect(phones("uses", "V")).toBe("juzəz");
    expect(phones("used", "VBN")).toBe("juzd");
    expect(phones("using", "V")).toBe("juzɪŋ");
  });
  it("preserves an explicit caller pronunciation", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("use", "ˈjus");
    expect(own.predict("use", "en-US", "V")).toBe("ˈjus");
  });
  it("preserves adjective and noun controls beside the finite verb", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The kind muse will use a fuse.", { language: "en-US", returnArray: true });
    expect(tokens.filter(t => ["kind", "muse", "use", "fuse"].includes(t.word)).map(t => t.phoneme))
      .toEqual(["kaɪnd", "mjuz", "juz", "fjuz"]);
    expect(api.phonemize("The use of a fuse is safe.", { language: "en-US", returnArray: true })
      .find(t => t.word === "use")?.phoneme).toBe("jus");
  });
});
it("preserves the existing rule-path terminal to-nominal phone", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  expect(api.phonemize("His skills were put to use.", { language: "en-US", returnArray: true })
    .find(t => t.word === "use")?.phoneme).toBe("jus");
});

describe.each([false, true])("caller-owned recursive roots, disableDict=%s", disableDict => {
  it("preserves the owned segment before phonological voicing", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("use", "ˈzɛŋ");
    expect(engine.predict("re-use", "en-US", "V")).toMatch(/ˈzɛŋ$/);
    engine.addPronunciation("use", "ˈjus");
    expect(engine.predict("re-use", "en-US", "V")).toMatch(/ˈjus$/);
    engine.addPronunciation("re-use", "ˈbɛŋ");
    expect(engine.predict("re-use", "en-US", "V")).toBe("ˈbɛŋ");
  });
  it("keeps finite re- verbs voiced", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    expect(api.phonemize("They can re-use the tools.", { language: "en-US", returnArray: true })
      .find(t => t.word === "use")?.phoneme).toBe("juz");
  });
});
it.each(["re-use", "re-re-use"])("retains the ambiguous to-nominal after %s boundaries", word => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  expect(api.phonemize(`His skills were put to ${word}.`, { language: "en-US", returnArray: true })
    .find(t => t.word === "use")?.phoneme).toBe("jus");
});

it.each([["\"", "\""], ["“", "”"]])("retains a quoted to-nominal between %s and %s", (open, close) => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  expect(api.phonemize(`His skills were put to ${open}use${close}.`, { language: "en-US", returnArray: true })
    .find(t => t.word === "use")?.phoneme).toBe("jus");
});
