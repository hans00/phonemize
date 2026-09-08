import { normalizeSegments, parseCmu, scoreWords } from "../scripts/evaluate-common-accuracy";

describe("Common-word accuracy benchmark", () => {
  it("accepts all reference variants and distinguishes reduced AH0 from STRUT", () => {
    const reference = parseCmu("use Y UW1 S\nuse(2) Y UW1 Z # verb\nabout AH0 B AW1 T\ncut K AH1 T\n");
    expect(reference.get("use")).toEqual(["jus", "juz"]);
    expect(reference.get("about")).toEqual(["əbaʊt"]);
    expect(reference.get("cut")).toEqual(["kʌt"]);
    expect(scoreWords(["use"], reference, () => "ˈjuz").accuracy).toBe(100);
  });

  it("keeps missing references and wrong vowels in the denominator", () => {
    const reference = new Map([["cat", ["kæt"]], ["cut", ["kʌt"]]]);
    const result = scoreWords(["cat", "cut", "unknown"], reference, () => "ˈkæt");
    expect(result.correct).toBe(1);
    expect(result.mismatches).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.accuracy).toBeCloseTo(100 / 3);
    expect(scoreWords([], reference, () => "").accuracy).toBe(0);
  });

  it("ignores only stress, spacing, length and symbol variants", () => {
    expect(normalizeSegments("ˈɫiː g")).toBe("liɡ");
    expect(normalizeSegments("kʌt")).not.toBe(normalizeSegments("kət"));
    expect(normalizeSegments("hɪɹ")).not.toBe(normalizeSegments("hiɹ"));
  });

  it("rejects unsupported reference phones instead of silently skipping them", () => {
    expect(() => parseCmu("word K UNKNOWN T")).toThrow("Unknown CMU phone");
  });
});
