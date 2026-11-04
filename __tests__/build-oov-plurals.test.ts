import EnglishG2P from "../src/en/g2p";
import { protectEdRoots, protectOovDerivatives } from "../scripts/protect-oov-plurals";
import * as exceptions from "../data/en/exceptions.json";
import * as compoundParts from "../data/en/compound-parts.json";
import { resolveJson } from "../src/utils";

test("sibilant OOV roots preserve dependent words and their caller overrides", () => {
  const source = { pense: "ˈpɛns", suspense: "səˈspɛns", suspenseful: "səˈspɛnsfəɫ" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const pins = protectOovDerivatives(EnglishG2P, source, table, new Map([["pense", source.pense]]), {});
  expect({ ...pins }).toEqual({ pense: source.pense, suspense: source.suspense });
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins } });
    expect(engine.predict("penses")).toBe("ˈpɛnsəz");
    expect(engine.predict("suspenseful")).toBe(source.suspenseful);
    engine.addPronunciation("suspense", "ˈzaɪ");
    expect(engine.predict("suspenseful")).toBe("ˈzaɪfəɫ");
  }
});

test("OOV plural retention drops actual causal regressions and preserves caller overrides", () => {
  const source = { zonic: "ˈzoʊnɪk", phonic: "ˈfɑnɪk", control: "ˈkɑn" };
  class Engine {
    dictionary: Record<string, string> = {};
    custom: Record<string, string> = {};
    addPronunciation(word: string, ipa: string): void { this.custom[word] = ipa; }
    predict(word: string): string {
      if (this.custom[word]) return this.custom[word];
      if (word === "control") return this.dictionary.phonic ? "ˈbæd" : source.control;
      if (word.endsWith("s")) {
        const root = word.slice(0, -1);
        if (this.custom[root]) return this.custom[root] + "z";
        return this.dictionary[root] ? this.dictionary[root] + "s" : "ˈbæd";
      }
      return source[word as keyof typeof source] || "ˈbæd";
    }
  }
  const evicted = new Map(Object.entries(source).filter(([root]) => root !== "control"));
  const table = Object.freeze({});
  const pins = protectOovDerivatives(Engine, source, table, evicted, {});
  expect({ ...pins }).toEqual({ zonic: source.zonic });
  expect(table).toEqual({});
  // A repeated build uses SOURCE and this build's evictions, not its previous output.
  expect({ ...protectOovDerivatives(Engine, source, table, evicted, {}) }).toEqual({ ...pins });
});

test("retains vouched theta weak-a roots for missing regular plurals", () => {
  const source = { thelma: "ˈθɛlmə", thekla: "ˈθɛklə", lemma: "ˈlɛmə", lemmas: "ˈlɛməz", nelma: "ˈnɛlmə" };
  const evicted = new Map(Object.entries(source).filter(([word]) => word !== "lemmas"));
  const pins = protectOovDerivatives(EnglishG2P, source, {}, evicted, {});
  expect({ ...pins }).toEqual({ thelma: source.thelma, thekla: source.thekla });
});

test("retains evicted man-ending stems when their regular OOV plurals depend on them", () => {
  const source = { beidleman: "ˈbaɪdəɫmən", rendleman: "ˈɹɛndəɫmən", gentleman: "ˈdʒɛntəɫmən", rifleman: "ˈɹaɪfəɫmən" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const pins = protectOovDerivatives(EnglishG2P, source, table, new Map(Object.entries(source)), {});
  expect({ ...pins }).toEqual({ beidleman: source.beidleman, rendleman: source.rendleman });
});

test("retains vowel-final airie stems when their regular OOV plurals depend on them", () => {
  const source = { laprairie: "ɫəˈpɹɛɹi", metairie: "məˈtɛɹi", prairie: "ˈpɹɛɹi", prairies: "ˈpɹɛɹiz" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const pins = protectOovDerivatives(EnglishG2P, source, table, new Map(Object.entries(source)), {});
  expect({ ...pins }).toEqual({ laprairie: source.laprairie, metairie: source.metairie });
});

test("retains an eye-final stem when its missing plural needs the lexical root", () => {
  const source = { goldeneye: "ˈɡoʊɫdəˌnaɪ" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  delete table.goldeneye;
  const pins = protectOovDerivatives(EnglishG2P, source, table, new Map(Object.entries(source)), {});
  expect(pins.goldeneye).toBe(source.goldeneye);
  const engine = new EnglishG2P();
  Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins }, writable: true });
  expect(engine.predict("goldeneyes", "en-US")).toBe("ˈɡoʊɫdəˌnaɪz");
  engine.addPronunciation("goldeneye", "ˈzi");
  expect(engine.predict("goldeneyes", "en-US")).toBe("ˈziz");
});

test("retains weak ival stems needed by regular OOV agent nouns", () => {
  const source = { carnival: "ˈkɑɹnəvəɫ", festival: "ˈfɛstəvəɫ" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const pins = protectOovDerivatives(EnglishG2P, source, table, new Map(Object.entries(source)), {});
  expect(pins.carnival).toBe(source.carnival);
  const engine = new EnglishG2P();
  Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins }, writable: true });
  engine.addPronunciation("carnival", "ˈzi");
  expect(engine.predict("carnivaler", "en-US")).toBe("ˈziɝ");
});

test("past-root retention protects whole consumers without changing their vowel frames", () => {
  const source = { harm: "ˈhɑɹm", harmison: "ˈhɑɹmɪsən", barb: "ˈbɑɹb", barbarian: "bɑɹˈbɛɹiən", seem: "ˈsim", carb: "ˈkɑɹb", aldicarb: "ˈɔɫdɪˌkɑɹb" };
  const evicted = new Map(Object.entries(source));
  const unpinned = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of [...Object.keys(source), "barbe"]) delete unpinned[word];
  const table = Object.freeze(unpinned);
  const tails = resolveJson<{ tails: Record<string, string> }>(compoundParts).tails;
  const pins = protectEdRoots(EnglishG2P, source, table, evicted, tails, {});
  expect(pins.harm).toBe(source.harm);
  expect(pins.harmison).toBe(source.harmison);
  expect(pins.seem).toBe(source.seem);
  expect(pins.barb).toBe(source.barb);
  expect(pins.barbarian).toBe(source.barbarian);
  expect(pins.carb).toBe(source.carb);
  expect(pins.aldicarb).toBe(source.aldicarb);
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins } });
    expect(engine.predict("harmed")).toBe("ˈhɑɹmd");
    expect(engine.predict("seemed")).toBe("ˈsimd");
    expect(engine.predict("harmison")).toBe(source.harmison);
    expect(engine.predict("barbarian")).toBe(source.barbarian);
    expect(engine.predict("aldicarb")).toBe(source.aldicarb);
    expect(engine.predict("carbed")).toBe("ˈkɑɹbd");
    engine.addPronunciation("harm", "Z AE1 P");
    expect(engine.predict("harmed")).toBe("ˈzæpt");
  }
  expect({ ...protectEdRoots(EnglishG2P, source, table, evicted, tails, {}) }).toEqual({ ...pins });
});

test("past-root proposals use regular doubled spellings instead of invented trimed/spamed", () => {
  const source = { trim: "ˈtɹɪm", spam: "ˈspæm" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const tails = resolveJson<{ tails: Record<string, string> }>(compoundParts).tails;
  const pins = protectEdRoots(EnglishG2P, source, table, new Map(Object.entries(source)), tails, {});
  expect({ ...pins }).toEqual({});
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: table });
    expect(engine.predict("trimmed")).toBe("ˈtɹɪmd");
    expect(engine.predict("spammed")).toBe("ˈspæmd");
  }
});

test("an attested possessive cannot justify inventing a competing regular verb", () => {
  const source = { calf: "ˈkæf", "calfed's": "ˈkæɫˌfɛdz" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of Object.keys(source)) delete table[word];
  const tails = resolveJson<{ tails: Record<string, string> }>(compoundParts).tails;
  const pins = protectEdRoots(EnglishG2P, source, table, new Map(Object.entries(source)), tails, {});
  expect({ ...pins }).toEqual({});
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: table });
    expect(engine.predict("calfed's")).toBe(source["calfed's"]);
  }
});

test("rule-exact complete tails retain their source stem in OOV agents", () => {
  const source = { woodshed: "ˈwʊdˌʃɛd" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  delete table.woodshed;
  const tails = resolveJson<{ tails: Record<string, string> }>(compoundParts).tails;
  const pins = protectEdRoots(EnglishG2P, source, table, new Map(Object.entries(source)), tails, {});
  expect(pins.woodshed).toBe(source.woodshed);
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins } });
    expect(engine.predict("woodshedder")).toBe("ˈwʊdˌʃɛdɝ");
    expect(engine.predict("woodshedders")).toBe("ˈwʊdˌʃɛdɝz");
  }
});

test("new root retention preserves vowel-final source parents in OOV plurals", () => {
  const source = { barbe: "ˈbɑɹb", barbeau: "bɑɹˈboʊ" };
  const table = { ...resolveJson<Record<string, string>>(exceptions) };
  for (const word of [...Object.keys(source), "barb"]) delete table[word];
  const tails = resolveJson<{ tails: Record<string, string> }>(compoundParts).tails;
  const pins = protectEdRoots(EnglishG2P, source, table, new Map(Object.entries(source)), tails, {});
  expect(pins.barbe).toBe(source.barbe);
  expect(pins.barbeau).toBe(source.barbeau);
  for (const disableDict of [false, true]) {
    const engine = new EnglishG2P({ disableDict });
    Object.defineProperty(engine, "dictionary", { value: { ...table, ...pins } });
    expect(engine.predict("barbeaus")).toBe("bɑɹˈboʊz");
    engine.addPronunciation("barbeau", "Z AE1 P");
    expect(engine.predict("barbeaus")).toBe("ˈzæps");
  }
});
