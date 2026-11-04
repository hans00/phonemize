import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
import dictionary = require("../data/en/dict.json");

describe("curated dictionary roots and paired morphology controls", () => {
  it.each([false, true])("uses the sourced gross vowel across POS and inflections without generalizing -oss (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const unstressed = (word: string, pos: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "");
    expect(unstressed("gross", "JJ")).toBe("ɡɹoʊs");
    expect(unstressed("gross", "NN")).toBe("ɡɹoʊs");
    expect(unstressed("gross", "VB")).toBe("ɡɹoʊs");
    expect(unstressed("grossed", "VBD")).toBe("ɡɹoʊst");
    expect(unstressed("grossing", "VBG")).toBe("ɡɹoʊsɪŋ");
    expect(unstressed("grosses", "VBZ")).toBe("ɡɹoʊsəz");
    expect(unstressed("grossly", "RB")).toBe("ɡɹoʊsɫi");
    const controlVowels = disableDict ? "ɑ" : "ɔ";
    expect(unstressed("gloss", "NN")).toBe(`ɡɫ${controlVowels}s`);
    expect(unstressed("loss", "NN")).toBe(`ɫ${controlVowels}s`);
    expect(unstressed("moss", "NN")).toBe(`m${controlVowels}s`);
    expect(unstressed("cross", "NN")).toBe(`kɹ${controlVowels}s`);
    expect(unstressed("toss", "NN")).toBe(`t${controlVowels}s`);

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Gross sales fell after the company grossed a million; the grossly exaggerated report glossed over the loss, moss, cross, and toss controls.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("gross")).toBe("ɡɹoʊs");
    expect(reading("grossed")).toBe("ɡɹoʊst");
    expect(reading("grossly")).toBe("ˈɡɹoʊsɫi");
    expect(reading("glossed")).toBe("ɡɫɔst");
    expect(reading("loss")).toBe(`ɫ${controlVowels}s`);
    expect(reading("moss")).toBe(`m${controlVowels}s`);
    expect(reading("cross")).toBe(`kɹ${controlVowels}s`);
    expect(reading("toss")).toBe(`t${controlVowels}s`);
  });

  it("keeps the standard r-colored stem when composing regular plurals", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("standard", "en-US")).toBe("ˈstændɝd");
    expect(rules.predict("standards", "en-US", "NNS")).toBe("ˈstændɝdz");
    expect(rules.predict("standardize", "en-US", "VB")).toBe("ˈstændɝˌdaɪz");
    expect(rules.predict("standardized", "en-US", "VBD")).toBe("ˈstændɝˌdaɪzd");
    expect(rules.predict("standardization", "en-US", "NN")).toBe("ˌstændɝdəˈzeɪʃən");

    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("The standards were standardized through standardization.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("standards")).toBe("ˈstændɝdz");
    expect(reading("standardized")).toBe("ˈstændɝˌdaɪzd");
    expect(reading("standardization")).toBe("ˌstændɝdəˈzeɪʃən");

    // The rebuilt dictionary route should inherit the corrected regular plural.
    const dictionary = new EnglishG2P();
    expect(dictionary.predict("standards", "en-US", "NNS")).toBe("ˈstændɝdz");
    expect(dictionary.predict("standardized", "en-US", "VBD")).toBe("ˈstændɝˌdaɪzd");
  });

  it.each([false, true])("uses the sourced olive weak-vowel root without changing alive/live controls (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const normalized = (word: string, pos?: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
    expect(normalized("olive", "NN")).toBe("ɑləv");
    expect(normalized("olives", "NNS")).toBe(disableDict ? "ɑləvz" : "ɑlɪvz");
    expect(engine.predict("alive", "en-US", "JJ")).toBe("əˈɫaɪv");
    expect(normalized("live", "JJ")).toBe("laɪv");
    expect(engine.predict("olivewood", "en-US", "NN")).toBe("ˌɑɫɪˈvjuʊd");
    expect(engine.predict("Oliver", "en-US")).toBe("ˈɑɫəvɝ");
    expect(engine.predict("Olivers", "en-US")).toBe("ˈɑɫəvɝz");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Olive oil was served with olives, while alive guests enjoyed the live music beside olivewood.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
    expect(reading("olive")).toBe("ɑləv");
    expect(reading("olives")).toBe(disableDict ? "ɑləvz" : "ɑlɪvz");
    expect(reading("alive")).toBe("əlaɪv");
    expect(reading("live")).toBe("laɪv");
    expect(reading("olivewood")).toBe("ɑlɪvjuʊd");
  });

  it.each([false, true])("uses the sourced Muslim reading across noun/adjective use without changing Islamic (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const normalized = (word: string, pos?: string) => engine.predict(word, "en-US", pos)?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
    expect(normalized("Muslim", "NN")).toBe("mʌzləm");
    expect(normalized("Muslim", "JJ")).toBe("mʌzləm");
    expect(normalized("Muslims", "NNS")).toBe("mʌzləmz");
    expect(normalized("Islamic", "JJ")).toBe(disableDict ? "ɪslæmɪk" : "ɪzlɑmɪk");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The Muslim family visited an Islamic center, and the Muslims spoke about Islam.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme?.replace(/[ˈˌ]/g, "").replace(/ɫ/g, "l");
    expect(reading("Muslim")).toBe("mʌzləm");
    expect(reading("Muslims")).toBe("mʌzləmz");
    expect(reading("Islamic")).toBe(disableDict ? "ɪslæmɪk" : "ɪzlɑmɪk");
  });

  it.each([false, true])("uses the sourced renaissance root without absorbing the renascence family (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const root = disableDict ? "ˈɹɛnəˌsɑns" : "ˌɹɛnəˈsɑns";
    const plural = disableDict ? "ˈɹɛnəˌsɑnsəz" : "ˌɹɛnəˈsɑnsəz";
    expect(engine.predict("renaissance", "en-US", "NN")).toBe(root);
    expect(engine.predict("Renaissance", "en-US", "NN")).toBe(root);
    expect(engine.predict("renaissances", "en-US", "NNS")).toBe(plural);
    expect(engine.predict("renascence", "en-US", "NN")).toBe("ˈɹɛnəsəns");
    expect(engine.predict("renascent", "en-US", "JJ")).toBe("ˈɹɛnəsənt");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The Renaissance inspired a modern renaissance; its cultural renascence was not the same as a renascent tradition.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("Renaissance")).toBe(root);
    expect(reading("renaissance")).toBe(root);
    expect(reading("renascence")).toBe("ˈɹɛnəsəns");
    expect(reading("renascent")).toBe("ˈɹɛnəsənt");
  });

  it.each([false, true])("uses the sourced imagine verb stem and preserves its morphology controls (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("imagine", "en-US", "VB")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒən");
    expect(engine.predict("imagines", "en-US", "VBZ")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənz");
    expect(engine.predict("imagined", "en-US", "VBD")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənd");
    expect(engine.predict("imagining", "en-US", "VBG")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒənɪŋ");
    expect(engine.predict("imagination", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɪmædʒəneɪʃən");
    expect(engine.predict("image", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɪmɪdʒ");
    expect(engine.predict("magic", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("mædʒɪk");
    expect(engine.predict("manage", "en-US", "VB")?.replace(/[ˈˌ]/g, "")).toBe(disableDict ? "mænɪdʒ" : "mænədʒ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Imagine what she imagined while imagining the scene; her imagination changed.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme?.replace(/[ˈˌ]/g, "");
    expect(reading("imagine")).toBe("ɪmædʒən");
    expect(reading("imagined")).toBe("ɪmædʒənd");
    expect(reading("imagining")).toBe("ɪmædʒənɪŋ");
    expect(reading("imagination")).toBe("ɪmædʒəneɪʃən");
  });

  it.each([false, true])("uses the sourced seminar noun and plural without changing seminary (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("seminar", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɑɹ");
    expect(engine.predict("seminars", "en-US", "NNS")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɑɹz");
    expect(engine.predict("seminary", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("sɛmənɛɹi");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The seminar ended before the seminars began at the seminary.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme?.replace(/[ˈˌ]/g, "");
    expect(reading("seminar")).toBe("sɛmənɑɹ");
    expect(reading("seminars")).toBe("sɛmənɑɹz");
    expect(reading("seminary")).toBe("sɛmənɛɹi");
  });

  it.each([false, true])("inflects a prefixed standard head before compound decomposition (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("substandard", "en-US", "JJ")).toBe("səbˈstændɝd");
    expect(engine.predict("substandards", "en-US", "NNS")).toBe("səbˈstændɝdz");
    expect(engine.predict("subunites", "en-US")).toBe("ˈsʌbjuˌnaɪts");
    expect(engine.predict("subway", "en-US", "NN")).toBe("ˈsʌbˌweɪ");
    expect(engine.predict("subways", "en-US", "NNS")).toBe("ˈsʌbˌweɪz");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Substandard parts failed standards tests on the subway and subways.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("substandard")).toBe("səbˈstændɝd");
    expect(reading("subways")).toBe("ˈsʌbˌweɪz");
  });

  it.each([false, true])("uses the sourced French-loan variant for restaurant without changing related spellings (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("restaurant", "en-US", "NN")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnt");
    expect(engine.predict("restaurants", "en-US", "NNS")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnts");
    expect(engine.predict("restraint", "en-US", "NN")).toBe("ɹiˈstɹeɪnt");
    expect(engine.predict("restoration", "en-US", "NN")).toBe("ˌɹɛstɝˈeɪʃən");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Restaurants like this restaurant stayed open despite the restraint and later restoration work.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("restaurant")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnt");
    expect(reading("restaurants")?.replace(/[ˈˌ]/g, "")).toBe("ɹɛstɹɑnts");
    expect(reading("restraint")).toBe("ɹiˈstɹeɪnt");
    expect(reading("restoration")).toBe("ˌɹɛstɝˈeɪʃən");
  });

  it.each([false, true])("uses the sourced common roots with paired controls (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    const expected = {
      adjacent: "əˈdʒeɪsənt",
      basin: "ˈbeɪsən",
      depot: "ˈdipoʊ",
      integer: "ˈɪntədʒɝ",
      petroleum: "pəˈtɹoʊɫiəm",
      severe: "səˈvɪɹ",
    };
    for (const [word, ipa] of Object.entries(expected))
      expect(engine.predict(word, "en-US")).toBe(ipa);
    expect(engine.predict("adjust", "en-US")).toBe("əˈdʒʌst");
    expect(engine.predict("basic", "en-US")).toBe("ˈbeɪsɪk");
    expect(engine.predict("several", "en-US")).toBe("ˈsɛvɝəɫ");
    expect(engine.predict("depots", "en-US", "NNS")).toBe("ˈdipoʊz");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The adjacent basin depot listed each integer; petroleum caused severe damage.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    for (const [word, ipa] of Object.entries(expected)) expect(reading(word)).toBe(ipa);
  });

  it.each([false, true])("uses the sourced apparel root without changing neighboring ap- words (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("apparel", "en-US", "NN")).toBe("əˈpæɹəɫ");
    expect(engine.predict("apparent", "en-US", "JJ")).toBe("əˈpɛɹənt");
    expect(engine.predict("appraise", "en-US", "VB")).toBe("əˈpɹeɪz");
    expect(engine.predict("appeal", "en-US", "NN")).toBe("əˈpiɫ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The apparel store looked apparent while they appraised the appeal of the design.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("apparel")).toBe("əˈpæɹəɫ");
    expect(reading("apparent")).toBe("əˈpɛɹənt");
    expect(reading("appraised")).toBe("əˈpɹeɪzd");
    expect(reading("appeal")).toBe("əˈpiɫ");
  });

  it("keeps shipped-reference inflections when a root is rules-only", () => {
    expect(dictionary.coverages).toBeDefined();
  });

  it.each([false, true])("uses sourced lexical -ate roots without changing controls (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const expected = {
      senate: "ˈsɛnət",
      climate: "ˈkɫaɪmət",
      ultimate: "ˈʌɫtəmət",
      immediate: "ɪˈmidiət",
      prostate: "ˈpɹɑsteɪt",
    };
    for (const [word, ipa] of Object.entries(expected))
      expect(engine.predict(word, "en-US")).toBe(ipa);
    expect(engine.predict("private", "en-US")).toBe("ˈpɹaɪvət");
    expect(engine.predict("evaluate", "en-US")).toBe(`${disableDict ? "ɪ" : "i"}ˈvæɫjuˌeɪt`);
    expect(engine.predict("front", "en-US")).toBe("ˈfɹʌnt");
    expect(engine.predict("some", "en-US")).toBe("ˈsʌm");
    expect(engine.predict("come", "en-US")).toBe("ˈkʌm");
    expect(engine.predict("from", "en-US", "NN")).toBe("fɹʌm");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The Senate discussed climate; the immediate report covered the ultimate goal and prostate health; from there, they will evaluate it.", {
      language: "en-US",
      returnArray: true,
    });
    for (const [word, ipa] of Object.entries(expected))
      expect(tokens.find(token => token.word.toLowerCase() === word)?.phoneme).toBe(ipa);
    expect(tokens.find(token => token.word.toLowerCase() === "from")?.phoneme).toBe("fɹəm");
    expect(tokens.find(token => token.word.toLowerCase() === "evaluate")?.phoneme).toBe(`${disableDict ? "ɪ" : "i"}ˈvæɫjuˌeɪt`);
  });

  it.each([false, true])("uses the sourced coverage, garage, and heritage roots in context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("coverage", "en-US", "NN")).toBe(disableDict ? "ˈkʌvɝɪdʒ" : "ˈkʌvɝədʒ");
    expect(engine.predict("heritage", "en-US", "NN")).toBe(disableDict ? "ˈhɛɹɪtɪdʒ" : "ˈhɛɹətədʒ");
    expect(engine.predict("garage", "en-US", "NN")).toBe("ɡɝˈɑʒ");
    expect(engine.predict("garage", "en-US", "VB")).toBe("ɡɝˈɑʒ");
    expect(engine.predict("advance", "en-US", "NN")).toBe("ədˈvæns");
    expect(engine.predict("advance", "en-US", "VB")).toBe("ədˈvæns");
    expect(engine.predict("advanced", "en-US", "VBD")).toBe("ədˈvænst");
    expect(engine.predict("message", "en-US", "NN")).toBe("ˈmɛsɪdʒ");
    expect(engine.predict("average", "en-US", "NN")).toBe("ˈævɝɪdʒ");
    expect(engine.predict("advice", "en-US", "NN")).toBe("ædˈvaɪs");
    expect(engine.predict("advantage", "en-US", "NN")).toBe("ædˈvæntɪdʒ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Our garage offers coverage for the local heritage site; the average message was brief.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("garage")).toBe("ɡɝˈɑʒ");
    expect(reading("coverage")).toBe(disableDict ? "ˈkʌvɝɪdʒ" : "ˈkʌvɝədʒ");
    expect(reading("heritage")).toBe(disableDict ? "ˈhɛɹɪtɪdʒ" : "ˈhɛɹətədʒ");
    expect(reading("message")).toBe("ˈmɛsɪdʒ");
    expect(reading("average")).toBe("ˈævɝɪdʒ");

    const adTokens = api.phonemize("They made an advance, then advance carefully; advice gave them an advantage.", {
      language: "en-US",
      returnArray: true,
    });
    const readings = (word: string) => adTokens.filter(token => token.word.toLowerCase() === word).map(token => token.phoneme);
    expect(readings("advance")).toEqual(["ədˈvæns", "ədˈvæns"]);
    expect(readings("advice")).toEqual(["ædˈvaɪs"]);
    expect(readings("advantage")).toEqual(["ædˈvæntɪdʒ"]);
  });

  it.each([false, true])("uses the sourced business root without changing -iness controls (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("business", "en-US", "NN")).toBe("ˈbɪznəs");
    expect(engine.predict("businesses", "en-US", "NNS")).toBe("ˈbɪznəsəz");
    expect(engine.predict("happiness", "en-US", "NN")).toBe("ˈhæpinəs");
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("A business plan helped her businesses, and the happiness it brought lasted.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("business")).toBe("ˈbɪznəs");
    expect(reading("businesses")).toBe("ˈbɪznəsəz");
    expect(reading("happiness")).toBe("ˈhæpinəs");
  });

  it.each([false, true])("preserves the sourced base readings on the %s dictionary mode", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("recipe", "en-US", "NN")).toBe("ˈɹɛsəpi");
    expect(engine.predict("cuisine", "en-US", "NN")).toBe("kwɪˈzin");
    expect(engine.predict("periodic", "en-US", "JJ")).toBe("ˌpɪɹiˈɑdɪk");
  });

  it("composes regular plurals from the reviewed roots", () => {
    const rules = new EnglishG2P({ disableDict: true });
    expect(rules.predict("recipes", "en-US", "NNS")).toBe("ˈɹɛsəpiz");
    expect(rules.predict("cuisines", "en-US", "NNS")).toBe("kwɪˈzinz");
  });

  it.each([false, true])("uses the sourced comment root in both POS readings and derivatives (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("comment", "en-US", "NN")).toBe("ˈkɑmɛnt");
    expect(engine.predict("comment", "en-US", "VB")).toBe("ˈkɑmɛnt");
    expect(engine.predict("comments", "en-US", "NNS")).toBe("ˈkɑmɛnts");
    expect(engine.predict("commented", "en-US", "VBD")).toBe("ˈkɑmɛntɪd");
    expect(engine.predict("document", "en-US", "NN")).toBe("ˈdɑkjəmənt");
    expect(engine.predict("document", "en-US", "VB")).toBe("ˈdɑkjəmənt");
  });

  it("keeps eight sourced common-word readings on the rules path and the shipped readings on the dictionary path", () => {
    const expected = {
      ago: ["əˈɡoʊ", "əˈɡoʊ"],
      knowledge: ["ˈnɑɫədʒ", "ˈnɑɫɪdʒ"],
      father: ["ˈfɑðɝ", "ˈfɑðɝ"],
      mortgage: ["ˈmɔɹɡədʒ", "ˈmɔɹɡɪdʒ"],
      christmas: ["ˈkɹɪsməs", "ˈkɹɪsməs"],
      hospital: ["ˈhɑˌspɪtəɫ", "ˈhɑspɪtəɫ"],
      volume: ["ˈvɑɫjum", "ˈvɑɫjum"],
      entire: ["ɪnˈtaɪɝ", "ɪnˈtaɪɝ"],
    };
    const sentence = "Years ago, my father gained knowledge about the mortgage; Christmas at the hospital recorded its volume during the entire visit.";
    const normalize = (ipa: string | undefined) => ipa?.replace(/[ˈˌ]/g, "");

    for (const [mode, disableDict] of [false, true].entries()) {
      const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
      const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
      for (const [word, readings] of Object.entries(expected)) {
        const token = tokens.find(item => item.word.toLowerCase() === word);
        expect(normalize(token?.phoneme)).toBe(normalize(readings[mode]));
      }
    }
  });

  it.each([false, true])("uses the sourced secure reading for adjective and verb in a sentence (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const expected = "sɪˈkjʊɹ";
    expect(engine.predict("secure", "en-US", "JJ")).toBe(expected);
    expect(engine.predict("secure", "en-US", "VB")).toBe(expected);
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The connection is secure, and the team will secure the server.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.filter(token => token.word.toLowerCase() === "secure").map(token => token.phoneme)).toEqual([
      expected, expected,
    ]);
  });

  it.each([false, true])("uses the sourced email root for noun and verb without changing mail controls (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
    expect(stripStress(engine.predict("email", "en-US", "NN"))).toBe("imeɪɫ");
    expect(stripStress(engine.predict("email", "en-US", "VB"))).toBe("imeɪɫ");
    expect(stripStress(engine.predict("emails", "en-US", "NNS"))).toBe("imeɪɫz");
    expect(engine.predict("mail", "en-US", "NN")).toBe("meɪɫ");
    expect(engine.predict("main", "en-US", "NN")).toBe("meɪn");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("I sent an email, then emailed the team.", { language: "en-US", returnArray: true });
    expect(stripStress(tokens.find(token => token.word === "email")?.phoneme)).toBe("imeɪɫ");
    expect(stripStress(tokens.find(token => token.word === "emailed")?.phoneme)).toBe("imeɪɫd");
  });

  it.each([false, true])("uses the reviewed area, individual, and upon readings without changing neighbors (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const stripStress = (ipa: string | null | undefined) => ipa?.replace(/[ˈˌ]/g, "");
    expect(engine.predict("area", "en-US", "NN")).toBe("ˈɛɹiə");
    expect(engine.predict("individual", "en-US", "NN")).toBe("ˌɪndəˈvɪdʒəwəɫ");
    expect(engine.predict("individual", "en-US", "JJ")).toBe("ˌɪndəˈvɪdʒəwəɫ");
    expect(engine.predict("upon", "en-US", "IN")).toBe("əˈpɑn");
    expect(engine.predict("calendar", "en-US", "NN")).toBe("ˈkæɫəndɝ");
    expect(engine.predict("calendars", "en-US", "NNS")).toBe("ˈkæɫəndɝz");
    expect(engine.predict("calendrical", "en-US", "JJ")).toBe("kəˈɫɛndɹɪkəɫ");
    expect(engine.predict("aerial", "en-US", "JJ")).toBe("ˈɛɹiəɫ");
    expect(engine.predict("manual", "en-US", "JJ")).toBe("ˈmænjuəɫ");
    expect(engine.predict("camera", "en-US", "NN")).toBe("ˈkæmɝə");
    expect(engine.predict("up", "en-US", "RP")).toBe("ʌp");
    expect(engine.predict("on", "en-US", "IN")).toBe("ɑn");
    expect(engine.predict("canal", "en-US", "NN")).toBe(disableDict ? "ˈkænəɫ" : "kəˈnæɫ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Each individual mapped the area upon request; the calendar lists its dates up on the manual.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("individual")).toBe("ˌɪndəˈvɪdʒəwəɫ");
    expect(reading("area")).toBe("ˈɛɹiə");
    expect(reading("upon")).toBe("əˈpɑn");
    expect(reading("calendar")).toBe("ˈkæɫəndɝ");
    expect(stripStress(reading("up"))).toBe("ʌp");
    expect(stripStress(reading("on"))).toBe("ɑn");
  });

  it.each([false, true])("uses the sourced weekday stems and preserves other -day words (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("monday", "en-US", "NN")).toBe("ˈmʌnˌdeɪ");
    expect(engine.predict("friday", "en-US", "NN")).toBe("ˈfɹaɪˌdeɪ");
    expect(engine.predict("wednesday", "en-US", "NN")).toBe("ˈwɛnzˌdeɪ");
    expect(engine.predict("mondays", "en-US", "NNS")).toBe("ˈmʌnˌdeɪz");
    expect(engine.predict("fridays", "en-US", "NNS")).toBe("ˈfɹaɪˌdeɪz");
    expect(engine.predict("wednesdays", "en-US", "NNS")).toBe("ˈwɛnzˌdeɪz");
    expect(engine.predict("sunday", "en-US", "NN")).toBe("ˈsʌnˌdeɪ");
    expect(engine.predict("thursday", "en-US", "NN")).toBe("ˈθɝzdeɪ");
    expect(engine.predict("tuesday", "en-US", "NN")).toBe(disableDict ? "ˈtuzdeɪ" : "ˈtjuzˌdeɪ");
    expect(engine.predict("holiday", "en-US", "NN")).toBe(disableDict ? "ˈhɑɫɪdeɪ" : "ˈhɑɫəˌdeɪ");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("We meet on Monday and Wednesday, then finish on Friday.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("monday")).toBe("ˈmʌnˌdeɪ");
    expect(reading("wednesday")).toBe("ˈwɛnzˌdeɪ");
    expect(reading("friday")).toBe("ˈfɹaɪˌdeɪ");
  });

  it.each([false, true])("uses sourced common roots in sentences and morphology (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("budget", "en-US", "NN")).toBe("ˈbʌdʒɪt");
    expect(engine.predict("budget", "en-US", "VB")).toBe("ˈbʌdʒɪt");
    expect(engine.predict("budgeting", "en-US", "VBG")).toBe("ˈbʌdʒɪtɪŋ");
    expect(engine.predict("disease", "en-US", "NN")).toBe("dɪˈziz");
    expect(engine.predict("diseases", "en-US", "NNS")).toBe("dɪˈzizəz");
    expect(engine.predict("furniture", "en-US", "NN")).toBe("ˈfɝnɪtʃɝ");
    expect(engine.predict("political", "en-US", "JJ")).toBe("pəˈɫɪtəkəɫ");
    expect(engine.predict("pretty", "en-US", "JJ")).toBe("ˈpɹɪti");
    expect(engine.predict("prettier", "en-US", "JJR")).toBe("ˈpɹɪtiɝ");
    expect(engine.predict("prettiest", "en-US", "JJS")).toBe("ˈpɹɪtiəst");

    expect(engine.predict("petty", "en-US", "JJ")).toBe("ˈpɛti");
    expect(engine.predict("sweaty", "en-US", "JJ")).toBe("ˈswɛti");
    expect(engine.predict("politician", "en-US", "NN")).toBe(disableDict ? "ˌpɑɫɪˈtɪʃən" : "ˌpɑɫəˈtɪʃən");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize(
      "They budgeted for pretty political furniture after the disease spread.",
      { language: "en-US", returnArray: true },
    );
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("budgeted")).toBe("ˈbʌdʒɪtɪd");
    expect(reading("pretty")).toBe("ˈpɹɪti");
    expect(reading("political")).toBe("pəˈɫɪtəkəɫ");
    expect(reading("furniture")).toBe("ˈfɝnɪtʃɝ");
    expect(reading("disease")).toBe("dɪˈziz");
  });

  it.each([false, true])("retains the target readings in full sentences (dictionary disabled: %s)", (disableDict) => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const tokens = api.phonemize("I tried a recipe from a local cuisine class with periodic reports.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
    expect(reading("recipe")).toBe("ˈɹɛsəpi");
    expect(reading("cuisine")).toBe("kwɪˈzin");
    expect(reading("periodic")).toBe("ˌpɪɹiˈɑdɪk");
  });

  it.each([false, true])("uses verified lexical roots and preserves their sentence readings (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The parallel radar apparatus was on the boulevard near the asylum.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
    expect(reading("parallel")).toBe("ˈpɛɹəˌɫɛɫ");
    expect(reading("radar")).toBe("ˈɹeɪˌdɑɹ");
    expect(reading("apparatus")).toBe("ˌæpɝˈætəs");
    expect(reading("boulevard")).toBe("ˈbʊɫəˌvɑɹd");
    expect(reading("asylum")).toBe("əˈsaɪɫəm");
    expect(engine.predict("radars", "en-US", "NNS")).toBe("ˈɹeɪˌdɑɹz");
    expect(engine.predict("asylums", "en-US", "NNS")).toBe("əˈsaɪɫəmz");
  });

  it.each([false, true])("keeps diabetes distinct from the regular diabetic family (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Diabetes and prediabetes differ from diabetic conditions.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word === word)?.phoneme;
    expect(reading("Diabetes")).toBe("ˌdaɪəˈbitiz");
    expect(reading("prediabetes")).toBe("pɹiˌdaɪəˈbitiz");
    expect(reading("diabetic")?.replace(/[ˈˌ]/g, "")).toBe("daɪəbɛtɪk");
  });
  it.each([false, true])("preserves promise and compromise morphology in full sentences (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("I promise to keep my promises; a compromise was promised, not compromising.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("promise")).toBe("ˈpɹɑməs");
    expect(reading("promises")).toBe("ˈpɹɑməsəz");
    expect(reading("compromise")).toBe("ˈkɑmpɹəˌmaɪz");
    expect(reading("promised")).toBe("ˈpɹɑməst");
    expect(reading("compromising")).toBe("ˈkɑmpɹəˌmaɪzɪŋ");
  });

  it.each([false, true])("uses dictionary-backed loan roots and keeps their inflections (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The chocolate suited the regime; chocolates were served.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("chocolate")).toBe("ˈtʃɔkɫət");
    expect(reading("regime")).toBe("ɹeɪˈʒim");
    expect(reading("chocolates")).toBe("ˈtʃɔkɫəts");
  });

  it.each([false, true])("preserves common lexical roots, POS readings, and inflections (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The female police officer made breakfast, her favorite meal.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("female")).toBe("ˈfiˌmeɪɫ");
    expect(reading("police")).toBe("pəˈɫis");
    expect(reading("breakfast")).toBe("ˈbɹɛkfəst");
    expect(reading("favorite")).toBe("ˈfeɪvɝɪt");
    expect(engine.predict("females", "en-US", "NNS")).toBe("ˈfiˌmeɪɫz");
    expect(engine.predict("breakfasts", "en-US", "NNS")).toBe("ˈbɹɛkfəsts");
    expect(engine.predict("favorite", "en-US", "JJ")).toBe("ˈfeɪvɝɪt");
    expect(engine.predict("favorite", "en-US", "NN")).toBe("ˈfeɪvɝɪt");
    expect(engine.predict("police", "en-US", "VB")).toBe("pəˈɫis");
  });

  it.each([false, true])("keeps sourced common loan roots and their inflections in context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("In April, the cafe introduced a genre of massage expertise; nearby cafes offer massages.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("april")).toBe("ˈeɪpɹəɫ");
    expect(reading("cafe")).toBe("kæˈfeɪ");
    expect(reading("genre")).toBe("ˈʒɑnɹə");
    expect(reading("massage")).toBe("məˈsɑʒ");
    expect(reading("expertise")).toBe("ˌɛkspɝˈtiz");
    expect(reading("cafes")?.replace(/ˌ/g, "")).toBe("kæˈfeɪz");
    expect(reading("massages")).toBe("məˈsɑʒəz");
    expect(engine.predict("massage", "en-US", "VB")).toBe("məˈsɑʒ");
  });

  it.each([false, true])("preserves common lexical roots, POS readings, and inflections (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Have one key, put both keys among them, please. Shall we put both keys here?", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("Have")).toBe("həv");
    expect(reading("one")).toBe("wʌn");
    expect(reading("key")).toBe("ki");
    expect(reading("put")).toBe("pʊt");
    expect(reading("both")).toBe("boʊθ");
    expect(reading("keys")).toBe("kiz");
    expect(reading("among")).toBe("əˈmʌŋ");
    expect(reading("please")).toBe("pɫiz");
    expect(reading("Shall")).toBe("ʃəɫ");
    expect(engine.predict("have", "en-US")).toBe("ˈhæv");
    expect(engine.predict("one", "en-US")).toBe("ˈwʌn");
    expect(engine.predict("both", "en-US")).toBe("ˈboʊθ");
    expect(engine.predict("shall", "en-US")).toBe("ˈʃæɫ");
    expect(engine.predict("put", "en-US")).toBe("ˈpʊt");
    expect(engine.predict("please", "en-US")).toBe("ˈpɫiz");
    expect(engine.predict("key", "en-US")).toBe("ˈki");
    expect(engine.predict("among", "en-US")).toBe("əˈmʌŋ");
    expect(engine.predict("has", "en-US", "VBZ")).toBe("həz");
    expect(engine.predict("putting", "en-US", "VBG")).toBe("ˈpʊtɪŋ");
    expect(engine.predict("putted", "en-US", "VBD")).toBe("ˈpʊtɪd");
    expect(engine.predict("getting", "en-US", "VBG")).toBe("ˈɡɛtɪŋ");
    expect(engine.predict("pleased", "en-US", "VBD")).toBe("pɫizd");
    expect(engine.predict("pleasure", "en-US", "NN")).not.toBe("ˈplizɝ");
  });

  it.each([false, true])("preserves irregular common words and their related controls in context (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("I heard her once, then she was gone. I hear her now, and she is going home.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("heard")).toBe("hɝd");
    expect(reading("once")).toBe("wʌns");
    expect(reading("gone")).toBe("ɡɔn");
    expect(reading("hear")).toBe("hɪɹ");
    expect(reading("going")).toBe("ˈɡoʊɪŋ");
    expect(reading("her")).toBe("hɝ");
    expect(engine.predict("heard", "en-US", "VBD")).toBe("hɝd");
    expect(engine.predict("hear", "en-US", "VBP")).toBe("hɪɹ");
    expect(engine.predict("go", "en-US", "VB")).toBe("ɡoʊ");
    expect(engine.predict("goes", "en-US", "VBZ")).toBe("ɡoʊz");
    expect(engine.predict("gone", "en-US", "VBN")).toBe("ɡɔn");
    expect(engine.predict("one", "en-US", "CD")).toBe("wʌn");
  });

  it.each([false, true])("uses reviewed roots in productive families without changing neighboring rimes (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The sugar was sugary. The touch was touching; she touched the pouch.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("sugar")).toBe("ˈʃʊɡɝ");
    if (!disableDict) expect(reading("sugary")).toBe("ˈʃʊɡɝi");
    expect(reading("touch")).toBe("tʌtʃ");
    expect(reading("touching")).toBe("ˈtʌtʃɪŋ");
    expect(reading("touched")).toBe("tʌtʃt");
    expect(reading("pouch")).toBe("paʊtʃ");
    expect(engine.predict("sugar", "en-US")).toBe("ˈʃʊɡɝ");
    expect(engine.predict("sugars", "en-US", "NNS")).toBe("ˈʃʊɡɝz");
    expect(engine.predict("touch", "en-US", "NN")).toBe("tʌtʃ");
    expect(engine.predict("couch", "en-US", "NN")).toBe("kaʊtʃ");
    expect(engine.predict("sure", "en-US", "JJ")).toBe("ʃʊɹ");
  });

  it.each([false, true])("uses the reviewed label root across verb morphology and keeps short-e controls (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("They labeled each folder with a label; labeling is useful.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word.toLowerCase())?.phoneme;
    expect(reading("labeled")).toBe("ˈɫeɪbəɫd");
    expect(reading("label")).toBe("ˈɫeɪbəɫ");
    expect(reading("labeling")).toBe("ˈɫeɪbəɫɪŋ");
    expect(engine.predict("labels", "en-US", "NNS")).toBe("ˈɫeɪbəɫz");
    expect((engine.predict("level", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɫɛvəɫ");
    expect((engine.predict("camel", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("kæməɫ");
  });

  it.each([false, true])("keeps lexicalized syncope in evening without changing its base (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("The meeting lasted into the evening; even the room was quiet.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("evening")).toBe("ˈivnɪŋ");
    expect((engine.predict("even", "en-US", "JJ") ?? "").replace(/[ˈˌ]/g, "")).toBe("ivən");
  });

  it.each([false, true])("uses sourced roots when spelling controls cannot predict them (dictionary disabled: %s)", (disableDict) => {
    const engine = new EnglishG2P({ disableDict });
    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("My colleague cleaned the aquarium and bought poultry feed; the league is ready to pounce.", {
      language: "en-US",
      returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("colleague")).toBe("ˈkɑɫiɡ");
    expect(reading("aquarium")).toBe("əˈkwɛɹiəm");
    expect(reading("poultry")).toBe("ˈpoʊɫtɹi");
    expect(engine.predict("colleagues", "en-US", "NNS")).toBe("ˈkɑɫiɡz");
    expect((engine.predict("league", "en-US", "NN") ?? "").replace(/[ˈˌ]/g, "")).toBe("ɫiɡ");
    expect((engine.predict("pounce", "en-US", "VB") ?? "").replace(/[ˈˌ]/g, "")).toBe("paʊns");
  });

  it.each([false, true])("uses the lexical ancient vowel without changing the productive -cient class (dictionary disabled: %s)", disableDict => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("ancient", "en-US", "JJ")).toBe("ˈeɪntʃənt");
    expect(engine.predict("efficient", "en-US", "JJ")).toBe("ɪˈfɪʃənt");
    expect(engine.predict("deficient", "en-US", "JJ")).toBe("dɪˈfɪʃənt");

    const api = createPhonemizer({ processors: [engine] });
    const tokens = api.phonemize("Ancient history records efficient and deficient harvests.", {
      language: "en-US", returnArray: true,
    });
    const reading = (word: string) => tokens.find(token => token.word.toLowerCase() === word)?.phoneme;
    expect(reading("ancient")).toBe("ˈeɪntʃənt");
    expect(reading("efficient")).toBe("ɪˈfɪʃənt");
    expect(reading("deficient")).toBe("dɪˈfɪʃənt");
  });
});
