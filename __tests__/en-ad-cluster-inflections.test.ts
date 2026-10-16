import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("assimilated ad- cluster inflections (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["addressed", "əˈdɹɛst"], ["addressing", "əˈdɹɛsɪŋ"],
    ["acclaimed", "əˈkɫeɪmd"], ["acclaiming", "əˈkɫeɪmɪŋ"],
    ["affronted", "əˈfɹʌntɪd"], ["affronting", "əˈfɹʌntɪŋ"],
    ["accreted", "əˈkɹitɪd"], ["address", "ˈædɹɛs"],
    ["unaddressed", "ˌʌnəˈdɹɛst"], ["unaddressing", "ˌʌnəˈdɹɛsɪŋ"],
  ])("restores a verb root or preserves its neighboring frame in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("uses the existing vouched part after lexical stem eviction", () => {
    const fresh = new EnglishG2P({ disableDict });
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    for (const word of ["address", "dress", "addressed", "addressing", "unaddressed"]) delete access.dictionary[word];
    expect(fresh.predict("addressed")).toBe("əˈdɹɛst");
    expect(fresh.predict("addressing")).toBe("əˈdɹɛsɪŋ");
    expect(fresh.predict("unaddressed")).toBe("ˌʌnəˈdɹɛst");
  });
  it("preserves an explicit custom stem pronunciation", () => {
    const fresh = new EnglishG2P({ disableDict });
    fresh.addPronunciation("address", "AA1 D R EH0 S");
    const access = fresh as unknown as { dictionary: Record<string, string> };
    access.dictionary = { ...access.dictionary };
    delete access.dictionary.addressed;
    delete access.dictionary.addressing;
    expect(fresh.predict("addressed")).toBe("ˈɑdɹɛst");
    expect(fresh.predict("addressing")).toBe("ˈɑdɹɛsɪŋ");
  });
  it("preserves noun and adjective controls beside the inflected verb", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The clever reader addressed the letter.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "addressed")?.phoneme).toBe("əˈdɹɛst");
    const noun = api.phonemize("The address is clear.", { language: "en-US", returnArray: true });
    expect(noun.find(t => t.word === "address")?.phoneme).toBe("ˈædɹɛs");
  });
});

it("preserves an independently supplied polysyllabic verb citation", () => {
  expect(new EnglishG2P().predict("accredited")).toBe("əˈkɹɛdɪtɪd");
});
