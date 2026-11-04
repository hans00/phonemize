import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("vouched lexical loanword roots", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["anime", "ˈænəmeɪ"],
    ["lingerie", "ˌɫɑnʒəˈɹeɪ"],
    ["karaoke", "ˌkɛɹiˈoʊki"],
    ["ballet", "bæˈɫeɪ"],
    ["debut", "deɪˈbju"],
    ["entrepreneur", "ˌɑntɹəpɹəˈnɝ"],
    ["tsunami", "tsuˈnɑmi"],
    ["safari", "səˈfɑɹi"],
    ["piano", "piˈænoʊ"],
    ["alumni", "əˈɫʌmˌnaɪ"],
    ["voyeur", "ˌvɔɪˈjuɹ"],
    ["encyclopedia", "ɪnˌsaɪkɫəˈpidiə"],
    ["memorabilia", "ˌmɛmɝəˈbiɫjə"],
  ])("uses the attested US lexical root for %s", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves unrelated spelling controls", () => {
    expect(rules.predict("animal", "en-US")).toBe("ˈænəməɫ");
    expect(rules.predict("ball", "en-US")).toBe("ˈbɔɫ");
    expect(rules.predict("alumnus", "en-US")).toBe("əˈɫʌmnəs");
    expect(rules.predict("alumna", "en-US")).toBe("əˈɫumnə");
    expect(rules.predict("viewer", "en-US")).toBe("ˈvjuɝ");
    expect(rules.predict("voyeurism", "en-US")).not.toBe("ˈvɔɪɝɪzəm");
    expect(rules.predict("encyclopedias", "en-US")).toBe("ɪnˌsaɪkɫəˈpidiəz");
  });

  it("keeps each loanword reading through sentence tokenization", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = phonemizer.phonemize("The anime, ballet, lingerie, and karaoke are popular; the entrepreneur made her debut in the safari park after the tsunami warning. The piano recital welcomed alumni, and the encyclopedia displayed old memorabilia while a voyeur watched the viewer.", {
      language: "en-US", returnArray: true,
    });
    const expected: Record<string, string> = {
      anime: "ˈænəmeɪ",
      ballet: "bæˈɫeɪ",
      lingerie: "ˌɫɑnʒəˈɹeɪ",
      karaoke: "ˌkɛɹiˈoʊki",
      entrepreneur: "ˌɑntɹəpɹəˈnɝ",
      debut: "deɪˈbju",
      safari: "səˈfɑɹi",
      tsunami: "tsuˈnɑmi",
      piano: "piˈænoʊ",
      alumni: "əˈɫʌmˌnaɪ",
      voyeur: "ˌvɔɪˈjuɹ",
      encyclopedia: "ɪnˌsaɪkɫəˈpidiə",
      memorabilia: "ˌmɛmɝəˈbiɫjə",
    };
    for (const [word, ipa] of Object.entries(expected))
      expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
  });
});
