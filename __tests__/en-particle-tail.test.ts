import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW lookup/hang-up and Cambridge cookout independently attest these roots.
// https://www.merriam-webster.com/dictionary/lookup
// https://www.merriam-webster.com/dictionary/hang-up
// https://dictionary.cambridge.org/us/pronunciation/english/cookout
const phones = (ipa: string | null | undefined): string => (ipa ?? "").replace(/ˌ/g, "").replace(/ʌ/g, "ə");

describe.each([false, true])("vouched particle tails (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each([
    ["lookup", "ˈɫʊkəp"], ["lookout", "ˈɫʊkaʊt"],
    ["cookout", "ˈkʊkaʊt"], ["lookups", "ˈɫʊkəps"],
  ])("preserves the complete root in %s", (word, expected) => {
    expect(phones(engine.predict(word))).toBe(expected);
  });
  test.each([
    ["look", "ˈɫʊk"], ["cook", "ˈkʊk"], ["group", "ˈɡɹup"],
    ["croup", "ˈkɹup"], ["soup", "ˈsup"], ["upper", "ˈʌpɝ"],
    ["reader", "ˈɹidɝ"],
  ])("keeps the neighboring %s root", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
  test("keeps noun, adjective and verb controls in the full sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The careful reader used a lookup table during the cookout.", {
      language: "en-US", returnArray: true,
    });
    expect(phones(tokens.find(t => t.word === "lookup")?.phoneme)).toBe("ˈɫʊkəp");
    expect(phones(tokens.find(t => t.word === "cookout")?.phoneme)).toBe("ˈkʊkaʊt");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "careful")?.phoneme).toBe("ˈkɛɹfəɫ");
  });
  test("uses a caller-owned root before an OOV particle tail", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("look", "ˈɫɑk");
    expect(phones(custom.predict("lookoff"))).toBe("ˈɫɑkɔf");
  });
  test.each(["backup", "pickup", "setup"])("retains a weak particle in %s", word => {
    expect(engine.predict(word)).toMatch(/əp$/);
  });
  test.each([
    ["takeover", "ˈteɪkˌoʊvɝ"], ["voiceover", "ˈvɔɪsˌoʊvɝ"],
    ["takeoff", "ˈteɪkˌɔf"], ["takeout", "ˈteɪkˌaʊt"],
  ])("preserves the established strong tail in %s", (word, expected) => {
    expect(engine.predict(word)).toBe(expected);
  });
});

test("the rule-composed nasal retains its root boundary before up", () => {
  expect(phones(new EnglishG2P({ disableDict: true }).predict("hangup"))).toBe("ˈhæŋəp");
});

test("the default dictionary retains an opaque surname", () => {
  expect(new EnglishG2P().predict("Gallup")).toBe("ˈɡæɫəp");
});
