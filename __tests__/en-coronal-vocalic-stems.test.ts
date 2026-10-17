import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

test.each([false, true])(
  "uses AmE free-u allomorphs in productive composition (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["newly", "newspaper", "newsletter", "newness", "durable"])
      delete d[w];
    Reflect.set(e, "dictionary", d);
    for (const [word, ipa] of [
      ["news", "ˈnuz"],
      ["newly", "ˈnuɫi"],
      ["newness", "ˈnunəs"],
      ["newspapers", "ˈnuzˌpeɪpɝz"],
      ["newsletters", "ˈnuzˌɫɛtɝz"],
      ["newsworthy", "ˈnuzˌwɝði"],
      ["newspaper", "ˈnuzˌpeɪpɝ"],
      ["newsletter", "ˈnuzˌɫɛtɝ"],
      ["dues", "ˈduz"],
      ["durable", "ˈdʊɹəbəɫ"],
      ["durably", "ˈdʊɹəbɫi"],
    ])
      expect(e.predict(word)).toBe(ipa);
    // The pretonic noun can reduce its root vowel; this control owns yod only.
    expect(e.predict("durability")).not.toMatch(/^[ˈˌ]?dj/);
    expect(e.predict("nonnewspaper")?.replace(/ˌ/g, "")).toBe("nɑnˈnuzpeɪpɝ");
    expect(e.predict("nonprofit")).toBe("nɑnˈpɹɑfət");
    expect(e.predict("nonpayment")).toBe("nɑnˈpeɪmənt");
    // Noncoronal onsets and polysyllabic roots retain their yod.
    for (const [word, ipa] of [
      ["few", "ˈfju"],
      ["hue", "ˈhju"],
      ["queued", "ˈkjud"],
      ["queuing", "ˈkjuɪŋ"],
      ["continued", "kənˈtɪnjud"],
      ["continues", "kənˈtɪnjuz"],
      ["valuing", "ˈvæɫjuɪŋ"],
      ["sued", "ˈsud"],
    ])
      expect(e.predict(word)).toBe(ipa);
    const api = createPhonemizer({ processors: [e] });
    expect(
      api
        .phonemize("The newly appointed recorder keeps the newspaper.", {
          language: "en-US",
          returnArray: true,
        })
        .find((t) => t.word === "newly")?.phoneme,
    ).toBe("ˈnuɫi");
  },
);
test.each([false, true])(
  "keeps caller-supplied stem and target ownership (rules=%s)",
  (disableDict) => {
    const e = new EnglishG2P({ disableDict });
    const d = { ...Reflect.get(e, "dictionary") };
    for (const w of ["newly", "newspaper", "dues", "durable"]) delete d[w];
    Reflect.set(e, "dictionary", d);
    e.addPronunciation("new", "ˈnju");
    expect(e.predict("newly")).toBe("ˈnjuɫi");
    expect(e.predict("news")).toBe("ˈnjuz");
    expect(e.predict("newspaper")).toBe("ˈnjuzˌpeɪpɝ");
    e.addPronunciation("due", "ˈdju");
    expect(e.predict("dues")).toBe("ˈdjuz");
    e.addPronunciation("dure", "ˈdjʊɹ");
    expect(e.predict("durable")).toBe("ˈdjʊɹəbəɫ");
    e.addPronunciation("newly", "ˈzɛmp");
    expect(e.predict("newly")).toBe("ˈzɛmp");
  },
);
