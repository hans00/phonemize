import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford document and MW implement/ornament/compliment distinguish weak noun -ment from strong verb -ment.
describe.each([false, true])("weak nominal -ment plurals, disableDict=%s", disableDict => {
  const cold = () => {
    const e = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(e, "dictionary") };
    for (const stem of ["document", "implement", "ornament", "compliment", "supplement"])
      for (const end of ["", "s", "ed", "ing"]) delete dictionary[stem + end];
    Reflect.set(e, "dictionary", dictionary);
    return e;
  };
  it.each([
    ["supplements", "ˈsʌpɫəmənts", "ˈsʌpɫəmɛnts", "The supplements are missing.", "She supplements her income."],
    ["documents", "ˈdɑkjəmənts", "ˈdɑkjumɛnts", "The documents are missing.", "She documents events."],
    ["implements", "ˈɪmpɫəmənts", "ˈɪmpɫəmɛnts", "The implements are missing.", "She implements changes."],
    ["ornaments", "ˈɔɹnəmənts", "ˈɔɹnəmɛnts", "The ornaments are missing.", "She ornaments the hall."],
    ["compliments", "ˈkɑmpɫəmənts", "ˈkɑmpɫəmɛnts", "The compliments are welcome.", "She compliments the artist."],
  ])("preserves the noun and verb readings of %s", (word, noun, verb, nounSentence, verbSentence) => {
    const e = cold(), api = createPhonemizer({ processors: [e] });
    // Secondary boundary marking differs between existing paths; exact phones and primary stress stay protected.
    expect(e.predict(word, "en-US", "N")?.replace(/ˌ/g, "")).toBe(noun);
    expect(e.predict(word, "en-US", "V")?.replace(/ˌ/g, "")).toBe(verb);
    for (const [sentence, ipa] of [[nounSentence, noun], [verbSentence, verb]])
      expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("keeps caller root and whole-token overrides", () => {
    const e = cold();
    e.addPronunciation("document", "ˈtɛst");
    expect(e.predict("documents")).toBe("ˈtɛsts");
    e.addPronunciation("documents", "ˈkʌstəm");
    expect(e.predict("documents", "en-US", "V")).toBe("ˈkʌstəm");
  });
  it("preserves regular verb inflections and nominal prefix ownership", () => {
    const e = cold();
    expect(e.predict("documented")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛntɪd");
    expect(e.predict("documenting")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛntɪŋ");
    expect(e.predict("nondocuments")?.replace(/ˌ/g, "")).toBe("nɑnˈdɑkjəmənts");
  });
  it("preserves noun primary stress in separate stress-shift classes", () => {
    const e = cold();
    expect(e.predict("segments", "en-US", "N")).toBe("ˈsɛɡmənts");
    expect(e.predict("torments", "en-US", "N")?.replace(/ˌ/g, "")).toBe("ˈtɔɹmɛnts");
    expect(e.predict("fragments", "en-US", "N")?.replace(/ˌ/g, "")).toBe("ˈfɹæɡmənts");
  });
  it("preserves neighboring noun, adjective, verb and tense controls", () => {
    const api = createPhonemizer({ processors: [cold()] });
    const pick = (s: string, w: string) => api.phonemize(s, { language: "en-US", returnArray: true }).find(t => t.word === w)?.phoneme;
    expect(pick("The records of blue notes are missing.", "records")).toBe("ˈɹɛkɝdz");
    expect(pick("The musician records blue notes.", "records")).toBe("ɹɪˈkɔɹdz");
    expect(pick("The viral infection spreads.", "viral")).toBe("ˈvaɪɹəɫ");
    expect(pick("The documentary documents a conflict.", "documents")?.replace(/ˌ/g, "")).toBe("ˈdɑkjumɛnts");
    if (!disableDict) {
      expect(pick("I read that book yesterday.", "read")).toBe("ɹɛd");
      expect(pick("I will read it tomorrow.", "read")).toBe("ɹid");
    }
  });
});

// This route is correct before the change; default and a fully evicted ambiguous stem remain existing POS limitations.
it("preserves the original rules verb when its tag is ambiguous !V", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const tokens = api.phonemize("For example, a World Rainforest Movement report documents land disputes and human rights abuses at Mount Elgon.", { language: "en-US", returnArray: true });
  expect(tokens.find(t => t.word === "documents")?.phoneme).toMatch(/^ˈdɑkj[əu]ˌ?mɛnts$/);
});
