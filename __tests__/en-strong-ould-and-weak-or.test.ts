import EnglishG2P from "../src/en/g2p";

const clean = (ipa: string) => ipa.replace(/[ˈˌ]/g, "");

describe.each([false, true])("native rhotic and agent frames (disableDict=%s)", (disableDict) => {
  const g2p = new EnglishG2P({ disableDict });
  const say = (word: string) => clean(g2p.predict(word)!);

  test("the second nucleus of merged prior/mayor rimes stays weak", () => {
    for (const word of ["prior", "priors", "prior's", "priory", "priories", "unpriory", "nonpriory", "semipriory", "multipriory", "priorly", "nonprior", "semiprior", "multiprior"])
      expect(say(word)).toMatch(/pɹaɪɝ/);
    for (const word of ["mayor", "mayors", "mayor's", "nonmayor", "semimayor", "multimayor"])
      expect(say(word)).toMatch(/meɪɝ/);
    expect(g2p.predict("priority")).toMatch(/ˈɔɹ/);
    expect(say("for")).toMatch(/ɔɹ$/);
  });

  test("native ould and oulder keep GOAT and l outside modal roots", () => {
    for (const word of ["mould", "moulds", "moulded", "moulding", "moulder", "smoulder", "smouldering", "boulder", "boulders", "shoulder", "shouldered", "shouldering", "unshouldered", "nonshoulder", "semishoulder", "multishoulder"])
      expect(say(word)).toMatch(/oʊ[lɫ]d/);
    for (const word of ["could", "should", "would"])
      expect(say(word)).toMatch(/ʊd$/);
    for (const word of ["wood", "woods", "wooden"])
      expect(say(word)).toMatch(/wʊd/);
  });

  test("rhotic agent roots use independently supplied verb readings", () => {
    expect(g2p.predict("recorder")).toMatch(/ˈkɔɹdɝ$/);
    expect(g2p.predict("exporter")).toMatch(/ˈspɔɹtɝ$/);
    expect(g2p.predict("importer")).toMatch(/ˈpɔɹtɝ$/);
    expect(g2p.predict("protester")).toMatch(/^ˈpɹoʊ/);
  });

  test("short os rimes are not fabricated plurals of two-letter bases", () => {
    for (const word of ["cos", "eos", "pos"])
      expect(say(word)).toMatch(/s$/);
    for (const word of ["shows", "photos", "zeros"])
      expect(say(word)).toMatch(/oʊz$/);
  });
});
