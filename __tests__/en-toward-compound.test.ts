import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";

describe("to-ward retains its second-syllable preposition stress", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["toward", "təˈwɔɹd", 1],
    ["towards", "təˈwɔɹdz", 1],
    ["untoward", "ˌʌntəˈwɔɹd", 2],
  ])("%s → %s", (word, ipa, stress) => {
    const slots = syllabify(word);
    expect(slots.slice(-2)).toEqual(["to", word === "towards" ? "wards" : "ward"]);
    expect(assignStress(slots, word)).toBe(stress);
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["backward", "ˈbækwɝd"],
    ["forward", "ˈfɔɹwɝd"],
    ["upward", "ˈʌpwɝd"],
    ["downward", "ˈdaʊnwɝd"],
    ["aboard", "əˈbɔɹd"],
    ["award", "əˈwɔɹd"],
    ["Howard", "ˈhaʊɝd"],
  ])("keeps neighboring %s in its established frame", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the independent <how> onset in howitzer", () => {
    expect(rules.predict("howitzer", "en-US")).toMatch(/^haʊ/);
  });

  it("keeps the already-supported toward derivations", () => {
    expect(rules.predict("towardly", "en-US")).toBe("təˈwɔɹdɫi");
    expect(rules.predict("towardness", "en-US")).toBe("təˈwɔɹdnəs");
  });

  it("keeps the preposition and neighboring noun/verb readings stable in sentences", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P()] });
    const prep = phonemizer.phonemize("She walked toward the door.", { language: "en-US", returnArray: true });
    expect(prep.find(token => token.word === "toward")?.phoneme).toBe("təˈwɔɹd");
    expect(prep.find(token => token.word === "walked")?.phoneme).toBe("wɔkt");
    expect(prep.find(token => token.word === "door")?.phoneme).toBe("dɔɹ");

    const noun = phonemizer.phonemize("The award was presented.", { language: "en-US", returnArray: true });
    expect(noun.find(token => token.word === "award")?.phoneme).toBe("əˈwɔɹd");
    expect(noun.find(token => token.word === "presented")?.phoneme).toBe("pɝˈzɛntɪd");
  });
});
