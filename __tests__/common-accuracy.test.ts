import { applyReferenceCorrections, normalizeSegments, parseCmu, scoreWords } from "../scripts/evaluate-common-accuracy";
import referenceV5 = require("../scripts/common-accuracy-reference-v5.json");
import referenceV7 = require("../scripts/common-accuracy-reference-v7.json");

describe("Common-word accuracy benchmark", () => {
  it("accepts all reference variants and distinguishes reduced AH0 from STRUT", () => {
    const reference = parseCmu("use Y UW1 S\nuse(2) Y UW1 Z # verb\nabout AH0 B AW1 T\ncut K AH1 T\n");
    expect(reference.get("use")).toEqual(["jus", "juz"]);
    expect(reference.get("about")).toEqual(["əbaʊt"]);
    expect(reference.get("cut")).toEqual(["kʌt"]);
    expect(scoreWords(["use"], reference, () => "ˈjuz").accuracy).toBe(100);
  });

  it("adds only the independently documented US query variant to its pinned CMU reading", () => {
    const cmu = parseCmu("query K W IY1 R IY0\ncat K AE T\n");
    const reference = applyReferenceCorrections(cmu, { query: referenceV5.corrections.query });
    expect(reference.get("query")).toEqual(["kwiɹi", "kwɪɹi"]);
    expect(reference.get("cat")).toEqual(["kæt"]);
    expect(scoreWords(["query"], reference, () => "ˈkwɪɹi").correct).toBe(1);
  });

  it("accepts the documented US KIT variant for pocket while retaining the pinned CMU reading", () => {
    const cmu = parseCmu("pocket P AA1 K AH0 T\ncat K AE T\n");
    const reference = applyReferenceCorrections(cmu, { pocket: referenceV5.corrections.pocket });
    expect(reference.get("pocket")).toEqual(["pɑkət", "pɑkɪt"]);
    expect(reference.get("cat")).toEqual(["kæt"]);
    expect(scoreWords(["pocket"], reference, () => "ˈpɑkɪt").correct).toBe(1);
  });

  it("accepts the documented US PALM variant for online while retaining the pinned CMU reading", () => {
    const cmu = parseCmu("online AO1 N L AY2 N\ncat K AE T\n");
    const reference = applyReferenceCorrections(cmu, { online: referenceV5.corrections.online });
    expect(reference.get("online")).toEqual(["ɔnlaɪn", "ɑnlaɪn"]);
    expect(reference.get("cat")).toEqual(["kæt"]);
    expect(scoreWords(["online"], reference, () => "ˈɑnlaɪn").correct).toBe(1);
  });

  it("accepts the Cambridge US unstressed schwa plus r in around while retaining both CMU readings", () => {
    const cmu = parseCmu("around ER0 AW1 N D\naround(2) ER0 AW1 N\ncat K AE T\n");
    const reference = applyReferenceCorrections(cmu, { around: referenceV5.corrections.around });
    expect(reference.get("around")).toEqual(["ɝaʊnd", "ɝaʊn", "əɹaʊnd"]);
    expect(reference.get("cat")).toEqual(["kæt"]);
    expect(scoreWords(["around"], reference, () => "əˈɹaʊnd").correct).toBe(1);
  });

  it("retains CMU readings while accepting Cambridge US forms for anime and lingerie", () => {
    const cmu = parseCmu("anime AE2 N IH0 M EY1\nlingerie L AA1 N ZH ER0 EY2\ncat K AE T\n");
    const reference = applyReferenceCorrections(cmu, {
      anime: referenceV7.corrections.anime,
      lingerie: referenceV7.corrections.lingerie,
    });
    expect(reference.get("anime")).toEqual(["ænɪmeɪ", "ænəmeɪ"]);
    expect(reference.get("lingerie")).toEqual(["lɑnʒɝeɪ", "lɑnʒəɹeɪ"]);
    expect(scoreWords(["anime", "lingerie"], reference, word => word === "anime" ? "ˈænəmeɪ" : "ˌlɑnʒəˈɹeɪ").correct).toBe(2);
  });

  it("refuses a source correction that no longer matches the pinned CMU entry", () => {
    expect(() => applyReferenceCorrections(new Map([ ["query", ["kwɪɹi"]] ])))
      .toThrow("Reference correction does not match pinned CMU entry: query");
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
