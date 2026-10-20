import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford survivor/senator and Merriam-Webster narrator/radiator independently attest these roots.
describe.each([false, true])("supported -or agents, disableDict=%s", disableDict => {
  const cold = () => {
    const en = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(en, "dictionary") };
    for (const stem of ["survivor", "senator", "narrator", "radiator", "vibrator", "mediator", "locator"]) {
      for (const word of [stem, stem + "s", stem + "'s", stem + "ship", "non" + stem]) delete dictionary[word];
    }
    Reflect.set(en, "dictionary", dictionary);
    return en;
  };
  it.each([
    ["survivor", "sɝˈvaɪvɝ"], ["senator", "ˈsɛnətɝ"], ["narrator", "ˈnɛɹeɪtɝ"],
    ["radiator", "ˈɹeɪdieɪtɝ"], ["vibrator", "ˈvaɪbɹeɪtɝ"], ["mediator", "ˈmidieɪtɝ"], ["locator", "ˈɫoʊkeɪtɝ"],
  ])("recovers %s with the primary stress of its actual stem", (word, ipa) => {
    const en = cold();
    for (const variant of [word, word.toUpperCase()]) {
      // Existing composition paths differ in optional secondary boundary marks; primary and phones remain exact.
      expect(en.predict(variant)?.replace(/ˌ/g, "")).toBe(ipa);
    }
  });
  it("preserves plurals and possessives after singular eviction", () => {
    const en = cold();
    expect(en.predict("survivors")).toBe("sɝˈvaɪvɝz");
    expect(en.predict("survivor's")).toBe("sɝˈvaɪvɝz");
    expect(en.predict("senators")).toBe("ˈsɛnətɝz");
    expect(en.predict("senator's")).toBe("ˈsɛnətɝz");
  });
  it("retains the recovered noun under prefixes and neutral derivation", () => {
    const en = cold();
    for (const [word, ipa] of [
      ["nonsurvivor", "nɑnsɝˈvaɪvɝ"], ["nonsenator", "nɑnˈsɛnətɝ"],
      ["nonnarrator", "nɑnˈnɛɹeɪtɝ"], ["nonradiator", "nɑnˈɹeɪdieɪtɝ"],
      ["survivorship", "sɝˈvaɪvɝʃɪp"], ["survivorhood", "sɝˈvaɪvɝhʊd"],
    ]) expect(en.predict(word)?.replace(/ˌ/g, "")).toBe(ipa);
  });
  it("honors explicit caller stem and whole-token ownership", () => {
    const en = cold();
    en.addPronunciation("survive", "ˈtɛst");
    expect(en.predict("survivor")).toBe("ˈtɛstɝ");
    expect(en.predict("survivors")).toBe("ˈtɛstɝz");
    en.addPronunciation("senate", "ˈtɛst");
    expect(en.predict("senator")).toBe("ˈtɛstɝ");
    en.addPronunciation("survivor", "ˈkʌstəm");
    expect(en.predict("survivor")).toBe("ˈkʌstəm");
    expect(en.predict("survivorship")).toBe("ˈkʌstəmˌʃɪp");
  });
  it("retains established weak nuclei rather than copying another stem variant", () => {
    const en = cold();
    for (const [word, ipa] of [
      ["arbitrator", "ˈɑɹbɪˌtɹeɪtɝ"], ["estimator", "ˈɛstɪˌmeɪtɝ"],
      ["replicator", "ˈɹɛpɫɪˌkeɪtɝ"], ["syndicator", "ˈsɪndɪˌkeɪtɝ"],
    ]) expect(en.predict(word)).toBe(ipa);
  });
  it("does not invent a silent-e derivation for ordinary nouns or names", () => {
    const en = cold();
    expect(en.predict("actor")).toBe("ˈæktɝ");
    expect(en.predict("cormac")).toBe("ˈkɔɹmək");
    expect(en.predict("sorbus")).toBe("ˈsɔɹbəs");
    expect(en.predict("motor")).toBe("ˈmoʊtɝ");
    expect(en.predict("Lafavor")).toBe("ˈɫæfəvɝ");
  });
  it("preserves full-sentence noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [cold()] });
    const out = api.phonemize("The viral infection spreads. They vibrate the panel. The senator records blue notes. The records of blue notes are missing. A survivor tells the story.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "viral")?.phoneme).toBe("ˈvaɪɹəɫ");
    expect(out.find(t => t.word === "vibrate")?.phoneme).toBe("ˈvaɪbɹeɪt");
    expect(out.find(t => t.word === "senator")?.phoneme).toBe("ˈsɛnətɝ");
    expect(out.find(t => t.word === "survivor")?.phoneme).toBe("sɝˈvaɪvɝ");
    expect(out.filter(t => t.word === "records").map(t => t.phoneme)).toEqual(["ɹɪˈkɔɹdz", "ˈɹɛkɝdz"]);
  });
});
