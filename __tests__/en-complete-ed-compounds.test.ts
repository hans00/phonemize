import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// MW woodshed/hotbed: the complete lexical tail retains DRESS, not past -ed.
describe.each([false, true])("complete -ed compound tails, rules=%s", disableDict => {
  test.each([
    ["woodshed", "ˈwʊdˌʃɛd"],
    ["hotbed", "ˈhɑtˌbɛd"],
    ["toolshed", "ˈtuɫˌʃɛd"],
  ])("retains the complete tail in %s across caller roles", (word, expected) => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"])
      expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test.each([
    ["The woodshed is warm.", "woodshed", "ˈwʊdˌʃɛd"],
    ["The hotbed is warm.", "hotbed", "ˈhɑtˌbɛd"],
    ["The toolshed is warm.", "toolshed", "ˈtuɫˌʃɛd"],
    ["Musicians woodshed every day.", "woodshed", "ˈwʊdˌʃɛd"],
  ])("preserves the full reading in %s", (sentence, word, expected) => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme).toBe(expected);
  });

  test("keeps caller-owned regular verb stems ahead of compound recovery", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("toolsh", "Z AE1 P");
    for (const pos of [undefined, "N", "ADJ", "V"])
      expect(engine.predict("toolshed", "en-US", pos)).toBe(pos === undefined ? "ˈzæpt" : "zæpt");
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("They toolshed the wall.", { language: "en-US", returnArray: true })
      .find(token => token.word === "toolshed")?.phoneme).toBe("zæpt");
  });

  test("keeps ordinary past-tense restoration", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("wanted")).toBe(disableDict ? "ˈwɑntɪd" : "ˈwɔntɪd");
    expect(engine.predict("tired")).toBe("ˈtaɪɝd");
    for (const [word, expected] of [["seemed", "ˈsimd"], ["deemed", "ˈdimd"], ["teemed", "ˈtimd"], ["teamed", "ˈtimd"], ["boomed", "ˈbumd"], ["zoomed", "ˈzumd"], ["harmed", "ˈhɑɹmd"], ["barbed", "ˈbɑɹbd"], ["surfed", "ˈsɝft"]])
      expect(engine.predict(word)).toBe(expected);
  });

  test("retains full consumer readings after root retention", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const [word, expected] of [["harmison", "ˈhɑɹmɪsən"], ["barbarian", "bɑɹˈbɛɹiən"], ["tribal", "ˈtɹaɪbəɫ"], ["barbeaus", "bɑɹˈboʊz"]])
      expect(engine.predict(word)).toBe(expected);
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("The Barbeaus arrived today.", { language: "en-US", returnArray: true })
      .find(token => token.word === "Barbeaus")?.phoneme).toBe("bɑɹˈboʊz");
  });

  test("keeps the compound stem's stress in agents and full sentences", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(engine.predict("woodshedder", "en-US", pos)).toBe("ˈwʊdˌʃɛdɝ");
      expect(engine.predict("woodshedders", "en-US", pos)).toBe("ˈwʊdˌʃɛdɝz");
    }
    const api = createPhonemizer({ processors: [engine] });
    for (const [sentence, word, expected] of [
      ["The woodshedder is rehearsing.", "woodshedder", "ˈwʊdˌʃɛdɝ"],
      ["The woodshedders are rehearsing.", "woodshedders", "ˈwʊdˌʃɛdɝz"],
      ["The musicians are woodshedding.", "woodshedding", "ˈwʊdˌʃɛdɪŋ"],
    ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
      .find(token => token.word === word)?.phoneme).toBe(expected);
  });

  test("keeps vouched fly compounds distinct from ordinary ly adverbs", () => {
    const engine = new EnglishG2P({ disableDict });
    for (const pos of [undefined, "N", "ADJ", "V"]) {
      expect(engine.predict("barfly", "en-US", pos)).toBe("ˈbɑɹˌfɫaɪ");
      expect(engine.predict("barflies", "en-US", pos)).toBe("ˈbɑɹˌfɫaɪz");
    }
    const api = createPhonemizer({ processors: [engine] });
    expect(api.phonemize("The barfly drinks here.", { language: "en-US", returnArray: true })
      .find(token => token.word === "barfly")?.phoneme).toBe("ˈbɑɹˌfɫaɪ");
    expect(api.phonemize("The barflies drink here.", { language: "en-US", returnArray: true })
      .find(token => token.word === "barflies")?.phoneme).toBe("ˈbɑɹˌfɫaɪz");
    engine.addPronunciation("barf", "Z AE1 P");
    expect(engine.predict("barfly")).toBe("ˈzæpɫi");
    for (const [word, expected] of [["briefly", "ˈbɹifɫi"], ["chiefly", "ˈtʃifɫi"], ["deafly", "ˈdɛfɫi"], ["safely", "ˈseɪfɫi"]])
      expect(engine.predict(word)).toBe(expected);
  });
});
