import { parseIpa, parseArpabet, phoneDistance, scoreIpa, summarize, Reference } from "../scripts/context-ipa";
import { predictCase, regressions, targetSpan, Case } from "../scripts/evaluate-context-ipa";
import manifest = require("../scripts/context-ipa-reference.json");

const references = manifest.readings as Record<string, Reference>;
const refs = (...ids: string[]) => Object.fromEntries(ids.map(id => [id, references[id]]));
const invite = refs("invite_nou", "invite_vrb");
const score = (ipa: string, gold = "invite_nou") => scoreIpa(ipa, gold, invite);

describe("context IPA scorer", () => {
  test("keeps both invite readings but rejects the other POS even leniently", () => {
    expect(score("ˈɪnvaɪt").strict).toBe(true);
    expect(score("ɪnˈvaɪt", "invite_vrb").strict).toBe(true);
    expect(score("ɪnˈvaɪt")).toMatchObject({ strict: false, lenient: false, readingCorrect: false });
    expect(score("ˈɪnvaɪt", "invite_vrb").lenient).toBe(false);
  });
  test("missing primary and the legacy closest-reading truncation cannot pass strict", () => {
    expect(score("ɪnvaɪt")).toMatchObject({ strict: false, lenient: false, reason: "missing-stress" });
    expect(score("ˈɪnvaɪ").strict).toBe(false);
  });
  test("allows one unprotected phone edit, never a distinguishing phone", () => {
    expect(score("ˈɪnvaɪd")).toMatchObject({ strict: false, lenient: true });
    expect(score("ˈɪnveɪt").lenient).toBe(false);
    expect(scoreIpa("juz", "use_nou", refs("use_nou", "use_vrb"))).toMatchObject({ strict: false, lenient: false });
    expect(phoneDistance(["x", "i"], ["i"], [0])).toBe(Infinity);
  });
  test("same-POS tense and sense remain different readings", () => {
    expect(scoreIpa("ɹid", "read_past", refs("read_present", "read_past")).lenient).toBe(false);
    expect(scoreIpa("ɹɛd", "read_past", refs("read_present", "read_past")).strict).toBe(true);
    expect(scoreIpa("bæs", "bass", refs("bass", "bass_corp")).lenient).toBe(false);
  });
  test("accepts only whole variants belonging to the gold reading", () => {
    const uses = refs("uses_nou", "uses_vrb");
    for (const ipa of ["ˈjusəz", "ˈjusɪz"]) expect(scoreIpa(ipa, "uses_nou", uses).strict).toBe(true);
    expect(scoreIpa("ˈjuzəz", "uses_nou", uses).strict).toBe(false);
    expect(scoreIpa("lɝnd", "learned_adj", refs("learned_adj", "learned_vrb")).lenient).toBe(false);
  });
  test("rejects malformed, garbage and multiple-primary IPA", () => {
    for (const ipa of ["", "garbage", "ˈɪn1vaɪt", "ˈɪnˈvaɪt", "ˈpt", "ːɪnvaɪt"])
      expect(score(ipa)).toMatchObject({ strict: false, lenient: false, reason: "invalid-or-missing-ipa" });
  });
  test("normalizes notation and onset placement without losing primary stress", () => {
    expect(score("ɪnvˈaɪt", "invite_vrb").strict).toBe(true);
    expect(parseIpa("ˈʤɫiː")).toEqual(parseIpa("ˈd͡ʒli"));
    expect(parseIpa("ˈə").phones).toEqual(["ʌ"]);
    expect(parseIpa("ə").phones).toEqual(["ə"]);
    expect(parseIpa("ˈɹid").phones).not.toEqual(parseIpa("ˈɹɪd").phones);
  });
  test("phones rather than characters determine error distance", () => {
    expect(parseIpa("ˈtʃaɪ").phones).toEqual(["tʃ", "aɪ"]);
    expect(phoneDistance(parseIpa("aɪ").phones, parseIpa("eɪ").phones)).toBe(1);
    expect(parseArpabet("IH2 N V AY1 T").primary).toBe(1);
    expect(() => parseArpabet("IH1 N V AY1 T")).toThrow(/Multiple/);
  });
  test("a tie is a failure even when an identical reference exists under two readings", () => {
    expect(scoreIpa("ˈɪnvaɪt", "a", { a: references.invite_nou, b: references.invite_nou })).toMatchObject({ strict: false, lenient: false, reading: "(tie)" });
  });
  test("balanced reading counts expose minority-reading errors and gates use exact counts", () => {
    const rows = [true, true, true, false].map((ok, i) => ({ word: "invite", gold: i === 3 ? "invite_vrb" : "invite_nou",
      family: "pos-stress", score: score(ok ? "ˈɪnvaɪt" : "ɪnvaɪt") }));
    const s = summarize(rows);
    expect(s.strict).toBe(3); expect(s.balanced).toBe(0.5);
    expect(regressions({ auto: { ...s, strict: 2 } }, { auto: s })).toContain("auto: strict fell");
    expect(regressions({ auto: { ...s, n: 3 } }, { auto: s })).toContain("auto: changed denominator or missing baseline");
  });
  test("a win on another reading cannot hide a loss within the same family", () => {
    const rows = (swap: boolean) => ["invite_nou", "invite_vrb"].map((gold, i) => ({ word: "invite", gold,
      family: "pos-stress", score: score(i === Number(swap) ? (i ? "ɪnˈvaɪt" : "ˈɪnvaɪt") : "", gold) }));
    const before = summarize(rows(false)), after = summarize(rows(true));
    expect(after.strict).toBe(before.strict);
    expect(after.balanced).toBe(before.balanced);
    expect(after.slices).toEqual(before.slices);
    expect(regressions({ auto: after }, { auto: before })).toContain("auto/reading/invite_nou: strict fell");
  });
  test("all attested variants pass their reading and reject every contrastive reading", () => {
    const all = Object.keys(references);
    for (const gold of all) {
      const peers = all.filter(id => id.split("_")[0] === gold.split("_")[0]);
      for (const variant of references[gold].variants) {
        const parsed = parseArpabet(variant.arpabet);
        const tokens = variant.arpabet.split(/\s+/);
        let nucleus = 0;
        const ipa = parsed.phones.map((phone, i) => (/[012]$/.test(tokens[i]) && nucleus++ === parsed.primary ? "ˈ" : "") + phone).join("");
        expect(scoreIpa(ipa, gold, refs(...peers)).strict).toBe(true);
        for (const other of peers.filter(id => id !== gold))
          expect(scoreIpa(ipa, other, refs(...peers))).toMatchObject({ strict: false, lenient: false });
      }
    }
  });
});

const occurrence = (sentence: string, word: string, nth = 0): Case => {
  let at = -1;
  for (let i = 0; i <= nth; i++) at = sentence.indexOf(word, at + 1);
  return { id: "test", split: "eval", word, gold: "invite_nou", sentence,
    start: Buffer.byteLength(sentence.slice(0, at)), end: Buffer.byteLength(sentence.slice(0, at + word.length)) };
};
describe("public context path and local oracle", () => {
  test("duplicate targets are aligned to the specified occurrence", () => {
    const c = occurrence("We invite them and received an invite.", "invite", 1);
    expect(predictCase(c, false, false, references.invite_nou)).toMatchObject({ alignment: "aligned", pos: "N" });
    expect(predictCase(c, false, true, references.invite_vrb)).toMatchObject({ alignment: "aligned", pos: "V" });
  });
  test("UTF-8 spans survive non-ASCII prefixes and preprocessing expansions", () => {
    for (const sentence of ["Élodie received an invite.", "🙂 We received an invite.", "We received 2 gifts and an invite."])
      expect(predictCase(occurrence(sentence, "invite"), false, false, references.invite_nou).alignment).toBe("aligned");
    expect(() => targetSpan({ ...occurrence("Élodie received an invite.", "invite"), start: 1 })).toThrow(/Invalid source span/);
  });
  test("a subword cannot silently select another occurrence, while split hyphens align", () => {
    expect(predictCase(occurrence("We saw invites and an invite.", "invite"), false, true, references.invite_nou).alignment).toBe("unaligned");
    expect(predictCase(occurrence("We re-invite them.", "invite"), false, true, references.invite_vrb).alignment).toBe("aligned");
  });
  test("unknown POS is counted unsupported, and rules cannot gain a target dictionary reading", () => {
    expect(predictCase(occurrence("We heard the bass.", "bass"), false, true, references.bass)).toMatchObject({ alignment: "unsupported-gold-pos", ipa: "" });
    const c = occurrence("We received an invite.", "invite");
    expect(predictCase(c, true, true, references.invite_nou).ipa).toBe(predictCase(c, true, true, references.invite_vrb).ipa);
  });
});
