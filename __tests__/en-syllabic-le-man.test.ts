import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("syllabic le before man or men, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test("preserves the lateral in compounds and inflections", () => {
    expect(engine.predict("gentleman", "en", "N")).toBe("ˈdʒɛntəɫmən");
    expect(engine.predict("rifleman", "en", "N")).toBe("ˈɹaɪfəɫmən");
    expect(engine.predict("riflemen", "en", "N")).toBe("ˈɹaɪfəɫmən");
    expect(engine.predict("cattlemen", "en", "N")).toBe("ˈkætəɫmən");
    expect(engine.predict("gentleman's", "en", "N")).toBe("ˈdʒɛntəɫmənz");
  });

  test("retains separate adjective and verb stems and avoids a vowel hiatus", () => {
    expect(engine.predict("gentle", "en", "ADJ")).toBe("ˈdʒɛntəɫ");
    expect(engine.predict("rifle", "en", "V")).toBe("ˈɹaɪfəɫ");
    expect(engine.predict("alleman", "en", "N")).not.toContain("æəɫ");
  });

  test("uses the forms in complete sentences", () => {
    expect(api.phonemize("The gentleman thanked the rifleman.", { language: "en-US" }))
      .toBe("ðə ˈdʒɛntəɫmən θæŋkt ðə ˈɹaɪfəɫmən.");
    expect(api.phonemize("The riflemen watched the cattlemen.", { language: "en-US" }))
      .toBe("ðə ˈɹaɪfəɫmən wɑtʃt ðə ˈkætəɫmən.");
  });
});

test("rebuilt exceptions preserve previously supported surname plurals", () => {
  const engine = new EnglishG2P();
  expect(engine.predict("beidlemans", "en")).toBe("ˈbaɪdəɫmənz");
  expect(engine.predict("rendlemans", "en")).toBe("ˈɹɛndəɫmənz");
});
