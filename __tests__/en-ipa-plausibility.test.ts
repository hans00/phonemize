import { inspectIpa } from "../src/en/g2p";

describe("IPA-only English plausibility", () => {
  test.each(["ˈwɛbpɪdʒ", "ˈwɛbˌpeɪdʒ", "blɪk", "stɹɛŋkθs", "ˈbʌtn̩", "d͡ʒʌd͡ʒ", "kæts", "kæt dɔɡ"])("accepts an available structural reading of %s", ipa => {
    expect(inspectIpa(ipa).status).toBe("compatible");
  });
  test.each(["ʌɪ", "ʌʊ"])("raised diphthong %s stays one nucleus", diphthong => {
    const report = inspectIpa("ˈv" + diphthong);
    expect(report.status).toBe("compatible");
    expect(report.syllables.map(s => s.nucleus)).toEqual([diphthong]);
    expect(inspectIpa("ˈv" + diphthong + "ə").syllables).toHaveLength(2);
    expect(inspectIpa("ˈvɝi").syllables).toHaveLength(2);
  });
  test("retains IPA segments and stress without consulting spelling", () => {
    const report = inspectIpa("/ˈwɛbˌpeɪdʒ/");
    expect(report.syllables.map(s => [s.onset, s.nucleus, s.coda, s.stress])).toEqual([
      ["w", "ɛ", "b", "primary"], ["p", "eɪ", "dʒ", "secondary"],
    ]);
    expect(report.syllables.map(s => s.start)).toEqual([2, 6]);
  });
  test.each(["bnɪk", "ŋæ", "æh", "k.at"])("reports native-profile concerns, not malformed IPA: %s", ipa => {
    expect(inspectIpa(ipa).status).toBe("marked");
  });
  test.each(["", "ˈ", "̩n", "[kæt", "ˈˌkæt", "kæt.", "kæt/"])("reports malformed representation: %s", ipa => {
    expect(inspectIpa(ipa).status).toBe("malformed");
  });
  test("unsupported IPA remains distinct from malformed input", () => {
    expect(inspectIpa("xɑ").status).toBe("unsupported");
    expect(inspectIpa("n̥ɑ").status).toBe("unsupported");
  });
  test("diacritics cannot attach across a syllable or stress boundary", () => {
    for (const ipa of ["kæt.ːdɔɡ", "kætˈːdɔɡ", "kæt.̩dɔɡ", "kætˈ̩dɔɡ", "kæt.̃dɔɡ", "kæt.̥dɔɡ"]) {
      expect(inspectIpa(ipa).status).toBe("malformed");
    }
    expect(inspectIpa("kæːt.dɔɡ").status).toBe("compatible");
    expect(inspectIpa("ˈbʌtn̩").status).toBe("compatible");
    expect(inspectIpa("kæt.n̥ɑ").status).toBe("unsupported");
    expect(inspectIpa("n̥̥ɑ").status).toBe("unsupported");
    expect(inspectIpa("xːɑ").status).toBe("unsupported");
    expect(inspectIpa("x̩ɑ").status).toBe("unsupported");
    expect(inspectIpa("x.ːɑ").status).toBe("malformed");
  });
  test("uses the requested dialect and declares bounded search", () => {
    expect(inspectIpa("ˈbɒtəl", { dialect: "en-GB" }).status).toBe("compatible");
    expect(inspectIpa("ˈbɒtəl", { dialect: "en-US" }).status).toBe("marked");
    expect(inspectIpa("kætkætkæt", { maxStates: 1 }).status).toBe("undetermined");
    expect(() => inspectIpa("kæt", { maxStates: 0 })).toThrow(RangeError);
  });
  test("recognizes attested clusters without admitting unrelated onsets", () => {
    expect(inspectIpa("dɪˈskɫoʊz").status).toBe("compatible");
    expect(inspectIpa("ˈkɑɹɫ").status).toBe("compatible");
    expect(inspectIpa("ˈkɑɹɫz").status).toBe("compatible");
    expect(inspectIpa("ˈkɑɹɫ", { maxStates: 1 }).status).toBe("undetermined");
    expect(inspectIpa("ˈkɑɫɹ").status).toBe("marked");
    expect(inspectIpa("sknɪk").status).toBe("marked");
    expect(inspectIpa("ˈbɹɪskɫi").syllables.map(s => [s.onset, s.nucleus, s.coda])).toEqual([
      ["bɹ", "ɪ", "s"], ["kɫ", "i", ""],
    ]);
  });
  test("recognizes British coronal yod before GOOSE without changing the US profile", () => {
    for (const ipa of ["tjuːn", "djuː", "njuː"]) {
      expect(inspectIpa(ipa, { dialect: "en-GB" }).status).toBe("compatible");
      expect(inspectIpa(ipa, { dialect: "en-US" }).status).toBe("marked");
    }
    expect(inspectIpa("tjaɪ", { dialect: "en-GB" }).status).toBe("marked");
  });
});
