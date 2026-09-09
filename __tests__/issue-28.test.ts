import { toIPA } from "../src/index";
import EnglishG2P from "../src/en/g2p";

describe("Issue #28: doubled-final-consonant name variants", () => {
  it("pronounces Seann like Sean", () => {
    expect(toIPA("Sean")).toBe("ˈʃɔn");
    expect(toIPA("Seann")).toBe("ˈʃɔn");
    expect(toIPA("seann")).toBe("ˈʃɔn");
  });

  it("reports the lexical stem in the trace", () => {
    const g2p = new EnglishG2P();
    const tr = g2p.trace("Seann");
    expect(tr.path).toBe("dictionary");
    expect(tr.steps[0].rule).toBe("geminate-stem:sean");
  });

  it("leaves short and common doubled-consonant words alone", () => {
    expect(toIPA("off")).not.toBe(toIPA("of"));
    expect(toIPA("ass")).not.toBe(toIPA("as"));
    expect(toIPA("press")).toBe("ˈpɹɛs");
    expect(toIPA("cross")).toMatch(/^ˈkɹ[ɑɔ]s$/);
  });

  it("does not reach into the lexicon when the dictionary is disabled", () => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict("seann")).toBe(g2p.predict("sean"));
    expect(g2p.predict("seann")).toBe("ˈsin");
  });
});
