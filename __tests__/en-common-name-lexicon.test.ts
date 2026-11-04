import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("dictionary-backed common-word readings", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["Canada", "ˈkænədə"],
    ["Carmichael", "ˈkɑɹmaɪkəɫ"],
    ["London", "ˈɫʌndən"],
    ["Londonderry", "ˈɫʌndəndɛɹi"],
    ["Washington", "ˈwɑʃɪŋtən"],
    ["China", "ˈtʃaɪnə"],
    ["David", "ˈdeɪvɪd"],
    ["Japan", "dʒəˈpæn"],
    ["February", "ˈfɛbɹuˌɛɹi"],
    ["Florida", "ˈfɫɔɹɪdə"],
    ["Michael", "ˈmaɪkəɫ"],
    ["Oklahoma", "oʊkɫəˈhoʊmə"],
    ["Omaha", "ˈoʊməˌhɑ"],
    ["Thomas", "ˈtɑməs"],
    ["Nicholas", "ˈnɪkəɫəs"],
    ["Jose", "ˌhoʊˈzeɪ"],
    ["Juan", "ˈhwɑn"],
    ["Andreas", "ɑnˈdɹeɪəs"],
    ["Joshua", "ˈdʒɑʃuə"],
    ["Louise", "ɫuˈiz"],
    ["Nicaragua", "ˌnɪkɝˈɑɡwə"],
    ["Somalia", "səˈmɑɫiə"],
    ["Ciao", "ˈtʃaʊ"],
    ["Carolina", "ˌkɛɹəˈɫaɪnə"],
    ["Dylan", "ˈdɪɫən"],
    ["Mali", "ˈmɑɫi"],
    ["California", "ˌkæɫəˈfɔɹnjə"],
    ["Europe", "ˈjʊɹəp"],
    ["England", "ˈɪŋɡɫənd"],
    ["Virginia", "vɝˈdʒɪnjə"],
    ["Chicago", "ʃɪˈkɑɡoʊ"],
    ["July", "ˌdʒuˈɫaɪ"],
  ])("uses the dictionary's US reading for %s", (word, expected) => {
    expect(rules.predict(word, "en-US")).toBe(expected);
  });

  it("preserves lexical readings in ordinary sentence context", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("Michael Carmichael, Thomas, Nicholas, Jose, Juan, Andreas, Joshua, Louise, Nicaragua, Somalia, Carolina, Dylan, Mali, California, Europe, England, Virginia, Chicago, and July, then said ciao before visiting Omaha, Florida, and Oklahoma this February.", {
      language: "en-US", returnArray: true,
    });
    const byWord = new Map(tokens.map(token => [token.word.toLowerCase(), token.phoneme]));
    expect(byWord.get("michael")).toBe("ˈmaɪkəɫ");
    expect(byWord.get("carmichael")).toBe("ˈkɑɹmaɪkəɫ");
    expect(byWord.get("florida")).toBe("ˈfɫɔɹɪdə");
    expect(byWord.get("oklahoma")).toBe("oʊkɫəˈhoʊmə");
    expect(byWord.get("february")).toBe("ˈfɛbɹuˌɛɹi");
    expect(byWord.get("omaha")).toBe("ˈoʊməˌhɑ");
    expect(byWord.get("thomas")).toBe("ˈtɑməs");
    expect(byWord.get("nicholas")).toBe("ˈnɪkəɫəs");
    expect(byWord.get("jose")).toBe("ˌhoʊˈzeɪ");
    // Sentence-level prosody may de-stress this monosyllabic name here.
    expect(byWord.get("juan")).toBe("hwɑn");
    expect(byWord.get("andreas")).toBe("ɑnˈdɹeɪəs");
    expect(byWord.get("joshua")).toBe("ˈdʒɑʃuə");
    expect(byWord.get("louise")).toBe("ɫuˈiz");
    expect(byWord.get("nicaragua")).toBe("ˌnɪkɝˈɑɡwə");
    expect(byWord.get("somalia")).toBe("səˈmɑɫiə");
    // Sentence-level prosody may de-stress this monosyllabic interjection.
    expect(byWord.get("ciao")).toBe("tʃaʊ");
    expect(byWord.get("carolina")).toBe("ˌkɛɹəˈɫaɪnə");
    expect(byWord.get("dylan")).toBe("ˈdɪɫən");
    expect(byWord.get("mali")).toBe("ˈmɑɫi");
    expect(byWord.get("california")).toBe("ˌkæɫəˈfɔɹnjə");
    expect(byWord.get("europe")).toBe("ˈjʊɹəp");
    expect(byWord.get("england")).toBe("ˈɪŋɡɫənd");
    expect(byWord.get("virginia")).toBe("vɝˈdʒɪnjə");
    expect(byWord.get("chicago")).toBe("ʃɪˈkɑɡoʊ");
    expect(byWord.get("july")).toBe("ˌdʒuˈɫaɪ");
    expect(rules.predict("florist", "en-US")).toBe("ˈfɫɔɹɪst");
  });

  it("uses the attested dictionary variant for elite without changing general final -ite rules", () => {
    expect(rules.predict("elite", "en-US")).toBe("eɪˈɫit");
    expect(rules.predict("elite", "en-US", "N")).toBe("eɪˈɫit");
    expect(rules.predict("bite", "en-US")).toBe("ˈbaɪt");
    expect(rules.predict("polite", "en-US")).toBe("ˈpoʊɫaɪt");
  });

  it("keeps the readings in ordinary sentence context and preserves spelling controls", () => {
    const api = createPhonemizer({ processors: [rules] });
    const names = api.phonemize("David visited Canada, China, Japan, London, and Washington.", {
      language: "en-US", returnArray: true,
    });
    const byWord = new Map(names.map(token => [token.word.toLowerCase(), token.phoneme]));
    expect(byWord.get("david")).toBe("ˈdeɪvɪd");
    expect(byWord.get("canada")).toBe("ˈkænədə");
    expect(byWord.get("china")).toBe("ˈtʃaɪnə");
    expect(byWord.get("japan")).toBe("dʒəˈpæn");
    expect(byWord.get("london")).toBe("ˈɫʌndən");
    expect(byWord.get("washington")).toBe("ˈwɑʃɪŋtən");
    expect(rules.predict("washing", "en-US")).toBe("ˈwɑʃɪŋ");
    expect(rules.predict("land", "en-US")).toBe("ˈɫænd");
  });
});
