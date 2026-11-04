import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

// Oxford US thirsty /ˈθɜːrsti/, thirty /ˈθɜːrti/:
// https://www.oxfordlearnersdictionaries.com/us/definition/english/thirsty
// https://www.oxfordlearnersdictionaries.com/definition/english/thirty
// Existing thirty reference/table flap and secondary stress are preserved.
describe.each([false, true])("initial th with clustered y foot (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test.each(["thirsty", "thingy", "thirty", "thirky"])("retains voiceless th in %s", word => {
    expect(engine.predict(word)).toMatch(/^ˈθ/);
  });
  test.each(["thirstier", "thirstiest", "thirstily", "thirstiness", "thirty's"])("keeps theta through the actual derived route in %s", word => {
    expect(engine.predict(word)?.replace(/ˌ/g, "")).toMatch(/^ˈθ/);
  });
  test.each([["this", "ð"], ["that", "ð"], ["they", "ð"], ["their", "ð"], ["thirst", "θ"], ["third", "θ"], ["thick", "θ"]])("preserves the neighboring onset in %s", (word, onset) => {
    expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(new RegExp("^" + onset));
  });
  test("preserves adjective, noun and verb readings in complete sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They think that this thing is theirs. The thirsty child drinks water. Thirty children record the results.", { language: "en-US", returnArray: true });
    expect(tokens.find(t => t.word === "thirsty")?.phoneme).toBe("ˈθɝsti");
    expect(tokens.find(t => t.word === "Thirty")?.phoneme).toMatch(/^ˈθ/);
    expect(tokens.find(t => t.word === "think")?.phoneme).toBe(engine.predict("think", "en-US", "V"));
    expect(tokens.find(t => t.word === "thing")?.phoneme).toBe(engine.predict("thing", "en-US", "N"));
    for (const word of ["They", "that", "this", "theirs"])
      expect(tokens.find(t => t.word === word)?.phoneme.replace(/[ˈˌ]/g, "")).toMatch(/^ð/);
  });
  test("preserves a retained-y plural after the base leaves the table", () => {
    for (const base of ["Thirky", "Thursby"])
      expect(engine.predict(base + "s", "en-US", "N")).toBe(engine.predict(base, "en-US", "N") + "z");
  });
  test("retains caller ownership before a suffix", () => {
    const owned = new EnglishG2P({ disableDict });
    owned.addPronunciation("thirsty", "ˈzɛŋ");
    expect(owned.predict("thirsty")).toBe("ˈzɛŋ");
    expect(owned.predict("thirstier")).toBe("ˈzɛŋɝ");
  });
});
