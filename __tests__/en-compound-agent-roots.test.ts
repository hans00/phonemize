import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import * as exceptions from "../data/en/exceptions.json";
import { resolveJson } from "../src/utils";

test.each([false, true])("compound agents preserve complete roots and stress (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  expect(engine.predict("onlooker")).toMatch(/^ˈ[ɑɔ]nˌɫʊkɝ$/);
  expect(engine.predict("anteater")).toMatch(/^ˈæn(?:ˌt|tˌ)itɝ$/);
  expect(engine.predict("bargainer")).toBe(disableDict ? "ˈbɑɹɡənɝ" : "ˈbɑɹɡɪnɝ");
  expect(engine.predict("seedeater")).toBe("ˈsiˌditɝ");
  expect(engine.predict("linseeder")).toBe(`${engine.predict("linseed")}ɝ`);
  engine.addPronunciation("linseed", "ˈzi");
  expect(engine.predict("linseeder")).toBe("ˈziɝ");
});

test.each([false, true])("recovers a compound root after lexical eviction (disableDict=%s)", disableDict => {
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  delete table.homestead;
  delete table.homesteader;
  delete table.spearhead;
  const engine = new EnglishG2P({ disableDict });
  Object.defineProperty(engine, "dictionary", { value: table });
  expect(engine.predict("homesteaded")).toBe("ˈhoʊmˌstɛdɪd");
  expect(engine.predict("homesteading")).toBe("ˈhoʊmˌstɛdɪŋ");
  // Cambridge: https://dictionary.cambridge.org/us/dictionary/english/spearheading
  expect(engine.predict("spearheading")).toBe("ˈspɪɹˌhɛdɪŋ");
  engine.addPronunciation("homestead", "ˈzi");
  expect(engine.predict("homesteading")).toBe("ˈziɪŋ");
});

// Cambridge records homestead as both a noun and a verb and lists homesteaded.
// https://dictionary.cambridge.org/us/dictionary/english/homesteaded
test.each([false, true])("retains regular compound forms in sentences (disableDict=%s)", disableDict => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
  for (const [sentence, word, expected] of [
    ["They homesteaded the land.", "homesteaded", "ˈhoʊmˌstɛdɪd"],
    ["They are homesteading the land.", "homesteading", "ˈhoʊmˌstɛdɪŋ"],
  ]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true })
    .find(token => token.word === word)?.phoneme).toBe(expected);
});
