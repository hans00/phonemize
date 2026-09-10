import EnG2P from "../src/en/g2p";

// Rule-path regressions for unstressed rhotic syllables and the unstressed
// vowel qualities fixed alongside them: the inflected -its/-ists ending and
// the word-initial <e> closed by a sonorant. Every case is a rule, not a
// word — the word named is the class exemplar, and each frame was measured
// over the whole dict before adoption.
//
// An unstressed /ɝ/ sitting immediately before a stress mark + vowel keeps
// its r-colouring; the /ɹ/ is NOT re-analysed as the onset of the stressed
// syllable. Measured over data/en/dict.json: 1659 entries spell that
// position /ɝ/ against 101 that spell it /ə/ + /ɹ/ (16:1), and the
// de-rhoticizing rule that used to run in the phonotactic pass scored
// 360:9 strict against the lexicon on the rules-only dump — plus it was
// rewriting dictionary output at runtime, since the phonotactic pass runs
// on every path. Removed; these cases pin the behaviour.
const g2p = new EnG2P({ disableDict: true });
const rules = (word: string) => g2p.predict(word, "en");

describe("unstressed rhotic before a stressed syllable keeps /ɝ/", () => {
  describe("medially", () => {
    it.each([
      ["operating", "ˈɑpɝˌeɪtɪŋ"],
      ["operation", "ˌɑpɝˈeɪʃən"],
      ["operational", "ˌɑpɝˈeɪʃənəɫ"],
      ["generation", "ˌdʒɛnɝˈeɪʃən"],
      ["federation", "ˌfɛdɝˈeɪʃən"],
      ["collaboration", "kəˌɫæbɝˈeɪʃən"],
      ["cooperation", "ˌkwɑpɝˈeɪʃən"],
      ["incorporated", "ˌɪnˈkɔɹpɝˌeɪtɪd"],
      ["authorized", "ˈɔθɝˌaɪzd"],
      ["terrorism", "ˈtɛɹɝˌɪzəm"],
      ["toronto", "tɝˈɑntoʊ"],
      ["correctly", "kɝˈɛktɫi"],
      ["derived", "dɝˈaɪvd"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });

  describe("word-initially", () => {
    it.each([
      ["arrived", "ɝˈaɪvd"],
      ["arranged", "ɝˈeɪndʒd"],
      ["arising", "ɝˈaɪzɪŋ"],
      ["originally", "ɝˈɪdʒənəɫi"],
    ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));
  });
});

// The -s handlers build the plural from the stem's pronunciation, so a
// stem whose final <i> is written /ə/ carried that schwa into the plural.
// The lexicon raises it before the /ts/ or /sts/ cluster (-its 21 ɪ : 8 ə,
// -ists 30 : 14), which is where credit ˈkɹɛdət / credits ˈkɹɛdɪts and
// artist ˈɑɹtəst / artists ˈɑɹtɪsts come from.
describe("inflected -its/-ists raise the stem schwa to /ɪ/", () => {
  it.each([
    ["credits", "ˈkɹɛdɪts"],
    ["profits", "ˈpɹɑfɪts"],
    ["spirits", "ˈspɪɹɪts"],
    ["artists", "ˈɑɹtɪsts"],
    ["jurists", "ˈdʒʊɹɪsts"],
    ["panelists", "ˈpænəɫɪsts"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves the singular stem alone", () => {
    expect(rules("credit")).toBe("ˈkɹɛdɪt");
    expect(rules("artist")).toBe("ˈɑɹtɪst");
  });
});

// A word-initial unstressed <e> closed by a sonorant coda keeps its full
// /ɛ/ rather than raising to /ɪ/; an open initial syllable still reduces,
// and so does a sonorant followed by /t/ or /s/. Measured 71 ɛ : 19 ɪ over
// data/en/dict.json on exactly that frame.
describe("word-initial unstressed <e> before a sonorant coda", () => {
  it.each([
    ["embargo", "ɛmˈbɑɹɡoʊ"],
    ["endorse", "ɛnˈdɔɹs"],
    ["enforce", "ɛnˈfɔɹs"],
    ["enlarge", "ɛnˈɫɑɹdʒ"],
    ["ellington", "ɛˈɫɪŋtən"],
    ["elfrieda", "ɛɫˈfɹidə"],
  ])("%s → %s", (word, ipa) => expect(rules(word)).toBe(ipa));

  it("leaves an open initial syllable reduced", () => {
    expect(rules("election")).toBe("ɪˈɫɛkʃən");
    expect(rules("erosion")).toBe("ɪˈɹoʊʒən");
  });

  it("leaves a sonorant + /t/ or /s/ coda reduced", () => {
    expect(rules("entirely")).toBe("ɪnˈtaɪɝɫi");
    expect(rules("ensconce")).toBe("ɪnˈskɑns");
  });
});
