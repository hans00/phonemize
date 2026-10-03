import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("checked r and o (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });

  test("open o is checked in its consonant ending frame", () => {
    for (const word of ["model", "models", "modeled", "modeling", "modern", "novel", "novels", "gospel", "hostel", "hospital"])
      expect(g2p.predict(word)).toMatch(/[ɑɔ]/);
    for (const word of ["hotel", "motel", "poster", "posters", "host", "hostess"])
      expect(g2p.predict(word)).toContain("oʊ");
  });

  test("a prefixed word retains its checked root after eviction", () => {
    expect(g2p.predict("premodern")).toMatch(/m[ɑɔ]dɝn$/);
    for (const word of ["remodel", "remodeled", "remodeling"])
      expect(g2p.predict(word)).toContain("mɑd");
  });

  test("cover and shovel preserve STRUT through inflections", () => {
    for (const word of ["cover", "covered", "covering", "hover", "hovering", "shovel", "shoveled", "shoveling", "hovel"])
      expect(g2p.predict(word)).toMatch(/[ʌə]v/);
    for (const word of ["move", "movie", "prove", "groove"])
      expect(g2p.predict(word)).toContain("uv");
  });

  test("k/l+ost contrasts with the long h/p/m frame", () => {
    for (const word of ["cost", "costs", "costed", "costing", "coster", "lost"])
      expect(g2p.predict(word)).toMatch(/[ɑɔ]st/);
    for (const word of ["host", "post", "most", "ghost"])
      expect(g2p.predict(word)).toMatch(/oʊst/);
  });

  test("a complete ear rime stays intact in an agent noun", () => {
    for (const word of ["wearer", "bearer", "swearer"])
      expect(g2p.predict(word)).toMatch(/ɛɹɝ$/);
    for (const word of ["hearer", "fearer"])
      expect(g2p.predict(word)).toMatch(/[iɪ]ɹɝ$/);
  });

  test("initial stressed doubled r keeps its checked vowel", () => {
    expect(g2p.predict("mirror")).toMatch(/^ˈmɪɹ/);
    for (const word of ["terrace", "terrible", "territory"])
      expect(g2p.predict(word)).toMatch(/^ˈtɛɹ/);
    for (const word of ["hurry", "stirrup", "squirrel"])
      expect(g2p.predict(word)).toContain("ɝ");
    expect(g2p.predict("interracial")).toMatch(/ɪntɝˈɹ/);
    expect(g2p.predict("overrunning")).toMatch(/oʊvɝɹ/);
  });

  test("checked cor roots keep root stress and one coalesced r", () => {
    for (const word of ["correct", "corrected", "correcting", "correction", "corrective", "corrupt", "corruption"])
      expect(g2p.predict(word)).toMatch(/^kɝˈ[ɛʌə]/);
    expect(g2p.predict("correlate")).toMatch(/^ˈkɔɹ/);
  });

  test("a bound -ation root sees its complete -al frame", () => {
    expect(g2p.predict("national")).toMatch(/^ˈnæʃən/);
    expect(g2p.predict("rational")).toMatch(/^ˈɹæʃən/);
    expect(g2p.predict("stational")).toMatch(/^ˈsteɪʃən/);
    expect(g2p.predict("relational")).toMatch(/ˈɫeɪʃən/);
  });

  test("letter-spelled tokens cannot supply a suffix stem", () => {
    expect(g2p.predict("italy")).toMatch(/^ˈɪtə[lɫ]i$/);
    expect(g2p.predict("ITA")).toContain("aɪ");
    expect(g2p.predict("happily")).toMatch(/^ˈhæpə[lɫ]i$/);
    expect(g2p.predict("oddly")).toMatch(/[ɑɔ]d[lɫ]i$/);
  });
});

test("public API uses the corrected root nuclei", () => {
  expect(toIPA("model")).toContain("mɑ");
  expect(toIPA("modal")).toContain("moʊ");
  expect(toIPA("mirror")).toContain("mɪɹ");
  expect(toIPA("correct")).toMatch(/^kɝˈɛkt$/);
});
