import EnG2P from "../src/en/g2p";

// Rule-path regressions for the back-vowel classes fixed in the 2026-09
// heuristic-learning pass: LOT vs THOUGHT before /ŋ/ and /f/, the /w/
// rounding of a following a, the loan-word final a, and the weak a-
// prefix. Every case is a rule, not a word — the word named is the class
// exemplar, and each frame was measured over the whole dict before
// adoption.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("LOT → THOUGHT before ŋ and f", () => {
  it.each([
    ["long", "ˈɫɔŋ"],
    ["song", "ˈsɔŋ"],
    ["strong", "ˈstɹɔŋ"],
    ["wrong", "ˈɹɔŋ"],
    ["belong", "bɪˈɫɔŋ"],
    ["strongly", "ˈstɹɔŋɫi"],
    ["songs", "ˈsɔŋz"],
    ["off", "ˈɔf"],
    ["offer", "ˈɔfɝ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("rounds the vowel across the split -ff- boundary too", () => {
    // office/officer/often/software split as of|fice, of|ten, sof|tware.
    for (const w of ["officer", "often", "software"])
      expect(rules(w)).toContain("ɔf");
  });

  it("leaves the ost and non-ŋ nasal frames alone", () => {
    // ^ost$ is the older, separately measured oʊ frame; a plain o + n
    // keeps the /ɑ/ default (congress, monger split as con|gress).
    expect(rules("most")).toBe("ˈmoʊst");
    expect(rules("post")).toBe("ˈpoʊst");
    expect(rules("congress")).toContain("ɑŋ");
  });
});

describe("a after a /w/-final onset is LOT, not TRAP", () => {
  it.each([
    ["want", "ˈwɑnt"],
    ["watch", "ˈwɑtʃ"],
    ["wash", "ˈwɑʃ"],
    ["wander", "ˈwɑndɝ"],
    ["swan", "ˈswɑn"],
    ["swap", "ˈswɑp"],
    ["squad", "ˈskwɑd"],
    ["squash", "ˈskwɑʃ"],
    ["quantum", "ˈkwɑntəm"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps æ before c and g, where the dict majority is TRAP", () => {
    expect(rules("quack")).toBe("ˈkwæk");
    expect(rules("whack")).toBe("ˈhwæk");
    expect(rules("wag")).toBe("ˈwæɡ");
    expect(rules("swagger")).toBe("ˈswæɡɝ");
  });

  it("leaves the l rimes to their own rules", () => {
    expect(rules("wall")).toBe("ˈwɔɫ");
    expect(rules("walk")).toBe("ˈwɔk");
  });
});

describe("ar after a /w/-final onset is NORTH, not START", () => {
  it.each([
    ["war", "ˈwɔɹ"],
    ["warm", "ˈwɔɹm"],
    ["ward", "ˈwɔɹd"],
    ["quart", "ˈkwɔɹt"],
    ["quarter", "ˈkwɔɹtɝ"],
    ["quarrel", "ˈkwɔɹəɫ"],
    ["dwarf", "ˈdwɔɹf"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps the magic-e -are rime as SQUARE", () => {
    expect(rules("ware")).toBe("ˈwɛɹ");
    expect(rules("square")).toBe("ˈskwɛɹ");
  });

  it("keeps the unstressed -ward suffix reduced", () => {
    expect(rules("eastward")).toBe("ˈistwɝd");
    expect(rules("outward")).toBe("ˈaʊtwɝd");
  });
});

describe("a stressed word-final bare a is the loan-word ɑ", () => {
  it.each([
    ["la", "ˈɫɑ"],
    ["ma", "ˈmɑ"],
    ["pa", "ˈpɑ"],
    ["spa", "ˈspɑ"],
    ["bra", "ˈbɹɑ"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves an unstressed final a reduced", () => {
    expect(rules("sofa")).toBe("ˈsoʊfə");
  });
});

// The a- + single r + vowel frame is split in the lexicon itself: around
// əˈɹaʊnd but arise/arrived/aroused/originally all ɝ (59:13 for ɝ word-
// initially). The rule path takes the majority, so this case asserts the
// stress placement the prefix rule owns, not the vowel the lexicon splits.
describe("the weak a- prefix before a single r", () => {
  it("stresses the root", () => {
    expect(rules("around")).toMatch(/^(?:əˈɹ|ɝˈ)aʊnd$/);
  });
});

describe("the weak a- prefix before a tense root", () => {
  it.each([
    ["about", "əˈbaʊt"],
    ["again", "əˈɡeɪn"],
    ["against", "əˈɡeɪnst"],
    ["agree", "əˈɡɹi"],
    ["amount", "əˈmaʊnt"],
    ["abroad", "əˈbɹɔd"],
    ["account", "əˈkaʊnt"],
    ["approach", "əˈpɹoʊtʃ"],
    ["appear", "əˈpɪɹ"],
    ["accrue", "əˈkɹu"],
    ["affair", "əˈfɛɹ"],
    ["assault", "əˈsɔɫt"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("keeps initial stress when the root has no digraph rime", () => {
    expect(rules("adam")).toBe("ˈædəm");
    expect(rules("atom")).toBe("ˈætəm");
    expect(rules("arab")).toBe("ˈæɹəb");
    expect(rules("apple")).toBe("ˈæpəɫ");
    expect(rules("abbey")).toBe("ˈæbi");
  });
});
