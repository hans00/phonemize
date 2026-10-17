import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Merriam-Webster asthma, isthmus and isthmian supply the independent AmE readings.
describe.each([false, true])("Greek sth before m, disableDict=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["asthma", "ˈæzmə"], ["asthmatic", "æzˈmætɪk"],
    ["asthmas", "ˈæzməz"], ["isthmus", "ˈɪsməs"],
    ["isthmian", "ˈɪsmiən"], ["isthmic", "ˈɪsmɪk"],
    ["isthmuses", "ˈɪsməsəz"], ["asthmatically", "æzˈmætɪkɫi"],
  ])("simplifies the complete cluster in %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves the British voiceless counterpart", () => {
    expect(engine.predict("asthma", "en-GB")).toBe("ˈæsmə");
    expect(engine.predict("asthmatic", "en-GB")).toBe("æsˈmætɪk");
  });
  it("preserves adjacent native boundaries", () => {
    expect(engine.predict("eastman")).toBe("ˈistmən");
    expect(engine.predict("postman")).toBe(disableDict ? "ˈpoʊstmən" : "ˈpoʊsmən");
    expect(engine.predict("basement")).toBe("ˈbeɪsmənt");
  });
  it("preserves adjective, agent noun and past verb in a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine] });
    const out = api.phonemize("The asthmatic reader read the notes yesterday.", {
      language: "en-US", returnArray: true,
    });
    expect(out.find(t => t.word === "asthmatic")?.phoneme).toBe("æzˈmætɪk");
    expect(out.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(out.find(t => t.word === "read")?.phoneme).toBe("ɹɛd");
  });
  it("retains a complete root after dictionary eviction", () => {
    const own = new EnglishG2P({ disableDict });
    const dictionary = { ...Reflect.get(own, "dictionary") };
    delete dictionary.asthma;
    Reflect.set(own, "dictionary", dictionary);
    expect(own.predict("asthmas")).toBe("ˈæzməz");
    expect(own.predict("asthmas", "en-GB")).toBe("ˈæsməz");
  });
  it("preserves caller roots, explicit children and literal clusters", () => {
    const own = new EnglishG2P({ disableDict });
    own.addPronunciation("asthma", "ˈzɛŋ");
    expect(own.predict("asthmas")).toBe("ˈzɛŋz");
    own.addPronunciation("asthmas", "ˈkɛŋ");
    expect(own.predict("asthmas")).toBe("ˈkɛŋ");
    own.addPronunciation("asthma", "ˈæstmə");
    expect(own.predict("asthma")).toBe("ˈæstmə");
  });
});
