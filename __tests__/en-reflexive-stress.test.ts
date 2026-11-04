import EnglishG2P from "../src/en/g2p";
import { assignStress, syllabify } from "../src/en/syllabify";
import { parseIpa } from "../scripts/context-ipa";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("closed-class self stress (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  it.each([
    ["himself", "hɪmˈsɛɫf"], ["herself", "hɝˈsɛɫf"],
    ["itself", "ˌɪtˈsɛɫf"], ["myself", "ˌmaɪˈsɛɫf"],
    ["oneself", "ˌwʌnˈsɛɫf"], ["theirselves", "ˌðɛɹˈsɛɫvz"],
  ])("preserves phonemes and contrastive primary in %s", (word, ipa) => {
    expect(parseIpa(engine.predict(word)!)).toEqual(parseIpa(ipa));
  });
  it.each([
    ["ourselves", "aʊɝˈsɛɫvz"], ["yourselves", "ˈjɔɹsɛɫvz"],
    ["themselves", "ðəmˈsɛɫvz"], ["self", "ˈsɛɫf"],
    ["selfless", "ˈsɛɫfɫəs"], ["selfhood", "ˈsɛɫfˌhʊd"],
  ])("keeps the existing path for %s", (word, ipa) => {
    expect(engine.predict(word)).toBe(ipa);
  });
  it("preserves a supplied whole-word pronunciation", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("himself", "Z EH1 D");
    expect(custom.predict("himself")).toBe("ˈzɛd");
  });
  it("retains noun, adjective and finite-verb sentence controls", () => {

    const tokens = englishTokens(engine, "The clever reader will work by himself.");
    expect(tokens.find(t => t.word === "himself")?.phoneme).toBe("hɪmˈsɛɫf");
    expect(tokens.find(t => t.word === "reader")?.phoneme).toBe("ˈɹidɝ");
    expect(tokens.find(t => t.word === "clever")?.phoneme).toBe("ˈkɫɛvɝ");
    expect(tokens.find(t => t.word === "work")?.phoneme).toBe("wɝk");
  });
});

it("distinguishes a function-word OOV frame from an open-class compound head", () => {
  expect(assignStress(syllabify("meself"), "meself")).toBe(1);
  expect(assignStress(syllabify("bookself"), "bookself")).toBe(0);
  expect(assignStress(syllabify("iself"), "iself")).toBe(0);
  expect(assignStress(syllabify("aself"), "aself")).toBe(0);
});
