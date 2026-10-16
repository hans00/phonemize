import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("short particle compounds (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["input", "ˈɪnˌpʊt"], ["inputs", "ˈɪnˌpʊts"],
    ["bylaw", "ˈbaɪˌɫɔ"], ["bylaws", "ˈbaɪˌɫɔz"],
    ["inlaw", "ˈɪnˌɫɔ"], ["onset", "ˈɑnˌsɛt"],
    ["onsets", "ˈɑnˌsɛts"], ["upset", "ˈʌpˌsɛt"],
  ])("retains both full rimes in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it.each([["amply", "ˈæmpɫi"], ["hymen", "ˈhaɪmən"], ["upcoming", "ˈʌpˌkʌmɪŋ"]])("does not split unrelated fragments in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("composes an OOV particle plus a verified free tail", () => {
    expect(engine.predict("upbox")).toBe("ˈʌpˌbɑks");
    const longer = engine.predict("upregulation")!;
    expect(longer.replace(/[ˈˌ]/g, "")).toMatch(/^ʌp/);
    expect(longer).toMatch(/ˈɫeɪʃən$/);
  });
  it("preserves inflections if exact compound stems leave the table", () => {
    const fresh = new EnglishG2P({ disableDict });
    const internals = fresh as unknown as { dictionary: Record<string, string> };
    internals.dictionary = { ...internals.dictionary };
    for (const word of ["input", "inputs", "inputting", "inputted", "bylaw", "bylaws", "onset", "onsets"]) delete internals.dictionary[word];
    expect(fresh.predict("inputs")).toBe("ˈɪnˌpʊts");
    expect(fresh.predict("inputting")).toMatch(/^ˈɪnˌpʊtɪŋ$/);
    expect(fresh.predict("inputted")).toMatch(/^ˈɪnˌpʊt[əɪ]d$/);
    expect(fresh.predict("bylaws")).toBe("ˈbaɪˌɫɔz");
    expect(fresh.predict("onsets")).toBe("ˈɑnˌsɛts");
  });
  it("preserves noun, adjective and verb controls in a full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader will input numbers.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "input")?.phoneme).toBe("ˈɪnˌpʊt");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
  });
});

it("preserves the supplied noun/verb contrast for upset", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("upset", "en", "N")).toBe("ˈʌpˌsɛt");
  expect(engine.predict("upset", "en", "V")).toBe("əpˈsɛt");
});

it("preserves the dictionary pronunciation of a nontransparent surname", () => {
  expect(new EnglishG2P().predict("Byham")).toBe("ˈbaɪəm");
});
