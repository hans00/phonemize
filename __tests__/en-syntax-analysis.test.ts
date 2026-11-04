import { analyzeEnglishSentence } from "../src/en/g2p";

const analyze = (sentence: string, maxStates?: number) => analyzeEnglishSentence(sentence.split(" "), { maxStates });
describe("bounded English feature chart", () => {
  test("preserves comma-separated predicate and nominal alternatives", () => {
    const predicates = analyze("They will read , record , and replay the tape .");
    expect(predicates.status).toBe("parsed");
    expect(predicates.tokens[3].tags).toEqual(["PUNCT"]);
    expect(predicates.tokens[4].tags).toEqual(["V"]);
    expect(predicates.tokens[4].verbForms).toContain("base");
    const nominals = analyze("They will buy fish , produce , and bread .");
    expect(nominals.status).toBe("parsed");
    expect(nominals.tokens[5].tags).toContain("N");
    expect(analyze("They are calm , kind , and ready .").status).toBe("parsed");
    expect(analyze("They buy fish , bread and cheese .").status).toBe("parsed");
    expect(analyze("However , many factors affect intelligence .").status).toBe("unparsed");
    expect(analyze("They will reads , record , and replay the tape .").status).toBe("unparsed");
  });
  test("retains infinitive and prepositional complements after a copula", () => {
    const infinitive = analyze("The goal is to develop and implement interactive programs .");
    expect(infinitive.status).toBe("parsed");
    expect(infinitive.forest.some(n => n.alternatives.some(d => d.rule === "copular-infinitive"))).toBe(true);
    expect(infinitive.tokens[3].tags).toEqual(expect.arrayContaining(["ADP", "PART"]));
    const location = analyze("They are in the garden .");
    expect(location.status).toBe("parsed");
    expect(location.forest.some(n => n.alternatives.some(d => d.rule === "copular-preposition"))).toBe(true);
    const ambiguous = analyze("The tribute is to war and record company executives .");
    expect(ambiguous.status).toBe("parsed");
    expect(ambiguous.tokens[3].tags).toEqual(expect.arrayContaining(["ADP", "PART"]));
    expect(ambiguous.tokens[6].tags).toContain("N");
    expect(analyze("They is in the garden .").status).toBe("unparsed");
  });
  test("modal selection preserves the base form across a possessive NP", () => {
    const report = analyze("I will read yesterday’s notes .");
    expect(report.status).toBe("parsed");
    expect(report.tokens[2].tags).toEqual(["V"]);
    expect(report.tokens[2].verbForms).toEqual(["base"]);
    expect(report.forest.some(n => n.alternatives.some(d => d.rule === "modal-base"))).toBe(true);
    expect(analyze("I will reads notes .").status).toBe("unparsed");
  });
  test("unifies explicit pronoun agreement and auxiliary-selected forms", () => {
    expect(analyze("They are reading .").status).toBe("parsed");
    expect(analyze("They is reading .").status).toBe("unparsed");
    expect(analyze("They was reading .").status).toBe("unparsed");
    expect(analyze("She has read notes .").status).toBe("parsed");
    expect(analyze("She have read notes .").status).toBe("unparsed");
    expect(analyze("I will have read notes .").status).toBe("parsed");
  });
  test("retains lexical and attachment hypotheses instead of claiming intent", () => {
    const duck = analyze("I saw her duck .");
    expect(duck.status).toBe("parsed");
    expect(duck.tokens[3].tags).toEqual(expect.arrayContaining(["N", "V"]));
    expect(duck.tokens[3].basis).toBe("shape");
    const produce = analyze("Stone offers produce boxes for delivery .");
    expect(produce.tokens[2].tags).toEqual(expect.arrayContaining(["N", "V"]));
    expect(produce.limitations.join(" ")).toContain("hypotheses");
  });
  test("retains adverb-modified adjectives alongside infinitive hypotheses", () => {
    const complement = analyze("They are highly articulate .");
    expect(complement.status).toBe("parsed");
    expect(complement.tokens[3].tags).toContain("ADJ");
    expect(complement.forest.some(n => n.alternatives.some(d => d.rule === "adjective-modifier"))).toBe(true);
    const phrase = analyze("They spoke to highly articulate students .");
    expect(phrase.status).toBe("parsed");
    expect(phrase.tokens[4].tags).toEqual(expect.arrayContaining(["ADJ", "V"]));
    const infinitive = analyze("They want to clearly articulate the problem .");
    expect(infinitive.status).toBe("parsed");
    expect(infinitive.tokens[4].tags).toContain("V");
    expect(analyze("They want to apply polish to the shoes .").tokens[4].tags).toContain("N");
  });
  test("preserves repeated occurrences and does not mutate the input", () => {
    const words = ["They", "record", "a", "record", "."];
    const report = analyzeEnglishSentence(words);
    expect(report.words).toEqual(words);
    expect(report.tokens).toHaveLength(words.length);
    expect(report.tokens[1].tags).toContain("V");
    expect(report.tokens[3].tags).toContain("N");
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.tokens)).toBe(true);
    expect(words).toEqual(["They", "record", "a", "record", "."]);
  });
  test("keeps embedded finite predicates available after a complementizer", () => {
    const report = analyze("They state that Pythagoras learned mathematics .");
    expect(report.status).toBe("parsed");
    expect(report.tokens[4].tags).toContain("V");
    expect(report.forest.some(n => n.alternatives.some(d => d.rule === "finite-clause-complement"))).toBe(true);
    expect(analyze("They state that she are reading .").status).toBe("unparsed");
    expect(analyze("They state that she is reading .").status).toBe("parsed");
  });
  test("does not force number agreement from a title ending in s", () => {
    const report = analyze("The game Puzzle Pirates uses tools .");
    expect(report.status).toBe("parsed");
    expect(report.tokens[4].tags).toContain("V");
    expect(report.forest.some(n => n.alternatives.some(d => d.rule === "name-apposition"))).toBe(true);
    expect(analyze("They uses tools .").status).toBe("unparsed");
  });
  test("coordinates predicates while preserving auxiliary selection", () => {
    const report = analyze("They read and record notes .");
    expect(report.status).toBe("parsed");
    expect(report.tokens[2].tags).toEqual(["CCONJ"]);
    expect(report.tokens[3].tags).toContain("V");
    expect(analyze("They will read and record notes .").status).toBe("parsed");
    expect(analyze("They will read and records notes .").status).toBe("unparsed");
    expect(analyze("They are reading and recording .").status).toBe("parsed");
    const mixed = analyze("They are reading and record .");
    // Separate finite predicates are possible; this is not one shared progressive.
    expect(mixed.status).toBe("parsed");
    expect(mixed.forest.filter(n => n.start === 1 && n.end === 5).some(n => n.alternatives.some(d => d.rule === "be-participle"))).toBe(false);
  });
  test("coordinates subjects with number and case agreement", () => {
    expect(analyze("She and he are reading .").status).toBe("parsed");
    expect(analyze("She and he is reading .").status).toBe("unparsed");
    expect(analyze("I and her are reading .").status).toBe("unparsed");
    expect(analyze("I saw her and him .").status).toBe("parsed");
    expect(analyze("I saw her and he .").status).toBe("unparsed");
    expect(analyze("They or she is reading .").status).toBe("parsed");
  });
  test("keeps independent clause agreement and shared adjective predicates", () => {
    expect(analyze("She reads but they write .").status).toBe("parsed");
    expect(analyze("She reads but they writes .").status).toBe("unparsed");
    expect(analyze("They are quick and smart .").status).toBe("parsed");
    expect(analyze("They is quick and smart .").status).toBe("unparsed");
    expect(analyze("They read a book . and write notes .").status).toBe("unparsed");
  });
  test("retains title fragments and reduced relatives as competing analyses", () => {
    const title = analyze("The Medicinal Uses of Cannabis and Cannabinoids .");
    expect(title.status).toBe("parsed");
    expect(title.roots.map(id => title.forest[id].category)).toContain("NP");
    expect(title.tokens[2].tags).toContain("N");
    const relative = analyze("It was created after lessons learned in Afghanistan and Iraq .");
    expect(relative.status).toBe("parsed");
    expect(relative.tokens[5].tags).toContain("V");
    expect(relative.forest.some(n => n.alternatives.some(d => d.rule === "reduced-relative"))).toBe(true);
  });
  test("quantifiers constrain object boundaries without becoming unknown verbs", () => {
    const report = analyze("They decide on a small church and invite all family and friends .");
    expect(report.status).toBe("parsed");
    expect(report.tokens[7].tags).toContain("V");
    expect(report.tokens[8].basis).toBe("closed-class");
    expect(report.tokens[8].tags).toContain("DET");
    expect(report.tokens[8].tags).not.toContain("N");
    expect(report.tokens[8].tags).not.toContain("V");
    expect(analyze("Many are reading .").status).toBe("parsed");
    expect(analyze("Many is reading .").status).toBe("unparsed");
    expect(analyze("They are certain .").status).toBe("parsed");
  });
  test("missing coverage and pruning never become a certainty claim", () => {
    expect(analyze("你好 .").status).toBe("unparsed");
    expect(analyze("I saw her duck .", 1).status).toBe("truncated");
    expect(analyzeEnglishSentence(Array(65).fill("cat")).status).toBe("truncated");
    expect(() => analyze("I read .", 0)).toThrow(RangeError);
  });
});
