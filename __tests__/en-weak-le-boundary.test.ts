import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import { assignStress } from "../src/en/syllabify";

// https://www.oxfordlearnersdictionaries.com/definition/english/uncle
// https://www.merriam-webster.com/dictionary/inclement

function withoutStoredRoot(disableDict: boolean, root: string): EnglishG2P {
  const engine = new EnglishG2P({ disableDict });
  const table: unknown = Reflect.get(engine, "dictionary");
  if (table === null || typeof table !== "object") throw new Error("Missing root lookup");
  const copied: Record<string, unknown> = { ...table };
  delete copied[root];
  Object.defineProperty(engine, "dictionary", { value: copied });
  return engine;
}

describe.each([false, true])("weak syllabic-l root boundaries (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([undefined, "N", "ADJ", "V"])("retains the complete root for POS %s", pos => {
    expect(engine.predict("uncle", "en-US", pos)).toBe("ˈʌŋkəɫ");
  });
  test.each(["uncles", "uncle's", "unclehood", "unclelike", "uncleless"])("preserves the root in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈʌŋkəɫ/);
  });
  test.each(["unclear", "uncleared", "unkind", "uncover", "include", "conclude", "uncouple"])("keeps the genuine nasal prefix in %s", word => {
    expect(engine.predict(word)).toMatch(/n[ˈˌ]?k/);
  });
  test("honors a caller-owned root through inflection", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("uncle", "ˈʌnkəɫ");
    expect(custom.predict("uncle")).toBe("ˈʌnkəɫ");
    expect(custom.predict("uncles")).toBe("ˈʌnkəɫz");
  });
  test("recovers the complete root when its stored entry is absent", () => {
    const evicted = withoutStoredRoot(disableDict, "uncle");
    for (const word of ["uncles", "unkles"]) expect(evicted.predict(word)).toBe("ˈʌŋkəɫz");
    for (const word of ["unclehood", "unclelike", "uncleless", "unklehood", "unklelike", "unkleless", "uncleable", "unkleable"])
      expect(evicted.predict(word)).toMatch(/^ˈʌŋkəɫ/);
  });
  test.each([
    ["preble", "prebles", "ˈpɹɛbəɫz"], ["dekle", "dekles", "ˈdɛkəɫz"],
    ["table", "tables", "ˈteɪbəɫz"], ["maple", "maples", "ˈmeɪpəɫz"],
    ["cycle", "cycles", "ˈsaɪkəɫz"], ["trifle", "trifles", "ˈtɹaɪfəɫz"],
  ])("retains the complete %s root in %s without its table entry", (root, plural, expected) => {
    expect(withoutStoredRoot(disableDict, root).predict(plural)).toBe(expected);
  });
  test("a supplied consonant-final stem outranks an invented silent-e root", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("piktl", "ˈpɛktəɫ");
    expect(custom.predict("piktles")).toBe("ˈpɛktəɫz");
  });
  test("keeps prefix vowels and an independently supplied root", () => {
    expect(engine.predict("commingle")).toBe("kəˈmɪŋɡəɫ");
    expect(engine.predict("preamble")).toBe("pɹiˈæmbəɫ");
    expect(engine.predict("recouple")).toBe("ɹiˈkʌpəɫ");
  });
  test.each([
    ["dismantle", "dɪˈsmæntəɫ"], ["dismantled", "dɪˈsmæntəɫd"],
    ["uncleable", "ˈʌŋkəɫəbəɫ"], ["dishable", "ˈdɪʃəbəɫ"],
    ["disneyable", "ˈdɪzniəbəɫ"],
  ])("keeps the existing stem boundary in %s", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
  test("does not fabricate syllabic l after glide or lateral rimes", () => {
    expect(engine.predict("bolles")).toBe("ˈboʊɫz");
    expect(engine.predict("bowles")).toBe("ˈboʊɫz");
    expect(engine.predict("rawles")).toBe("ˈɹɔɫz");
  });
  test("preserves the surrounding noun, adjective and verb", () => {
    const tokens = createPhonemizer({ processors: [engine] }).phonemize(
      "The careful reader told his uncle to include the record.",
      { language: "en-US", returnArray: true },
    );
    expect(tokens.find(t => t.word === "uncle")?.phoneme).toBe("ˈʌŋkəɫ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
    expect(tokens.find(t => t.word === "include")?.phoneme).toBe("ɪnˈkɫud");
  });
});

test.each([["pre", "ble"], ["de", "kle"], ["un", "kle"]])("a weak final %s/%s slot cannot receive root stress", (head, tail) => {
  expect(assignStress([head, tail], head + tail)).toBe(0);
});

test("an unattested silent-le fragment cannot license neutral -ment", () => {
  expect(new EnglishG2P({ disableDict: true }).predict("inclement")).toBe("ɪnˈkɫɛmənt");
});

test("silent h before l does not certify an independent C-le syllable", () => {
  const engine = new EnglishG2P({ disableDict: true });
  expect(engine.predict("kohles")).toBe("ˈkoʊɫz");
  expect(engine.predict("ahles")).toBe("ˈɑɫz");
});
