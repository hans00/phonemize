import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("Latinate adjective composition (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["separately", "adequately", "alternately", "deliberately", "moderately", "intimately", "disproportionately", "inordinately", "approximately"])("%s uses the weak adjective ending", word => {
    expect(g2p.predict(word, "en")).toMatch(/ətɫi$/);
  });
  test("appropriately retains a supplied weak-vowel variant", () => {
    expect(g2p.predict("appropriately", "en")).toMatch(disableDict ? /ətɫi$/ : /(?<![eaɔ])[əɪ]tɫi$/);
  });
  test.each(["innately", "ornately", "sedately", "lately", "stately"])("%s retains stressed or short ate", word => {
    expect(g2p.predict(word, "en")).toMatch(/eɪtɫi$/);
  });
  test.each(["original", "originally", "aboriginal"])("%s places stress in the extended word", word => {
    expect(g2p.predict(word, "en")).toMatch(/ɝˈɪdʒənəɫ/);
  });
  test.each(["attitudinal", "latitudinal", "longitudinal"])("%s places primary stress on the long root", word => {
    expect(g2p.predict(word, "en")).toMatch(/ˈtudənəɫ$/);
  });
  test("intramarginal retains stress on the extended root", () => {
    expect(g2p.predict("intramarginal", "en")).toMatch(/ˈmɑɹdʒ[əɪ]nəɫ$/);
  });
  test("abdominal keeps the lax root vowel in its extended context", () => {
    expect(g2p.predict("abdominal", "en")).toMatch(/ˈdɑmənəɫ$/);
  });
  test.each(["retinal", "criminal", "terminal", "marginal"])("%s keeps the shorter root's initial stress", word => {
    expect(g2p.predict(word, "en")).toMatch(/^ˈ/);
  });
  test.each(["crucial", "crucially"])("%s retains the high open u before cial", word => {
    expect(g2p.predict(word, "en")).toMatch(/kɹuʃəɫ/);
  });
  test.each([["racial", /ɹeɪʃəɫ/], ["special", /spɛʃəɫ/], ["initial", /ˈnɪʃəɫ/], ["martial", /mɑɹʃəɫ/]] as const)("%s keeps a contrasting suffix boundary", (word, owned) => {
    expect(g2p.predict(word, "en")).toMatch(owned);
  });
});

test.each([["separately", /ətɫi$/], ["originally", /ɝˈɪdʒənəɫ/], ["crucially", /kɹuʃəɫ/]] as const)("%s reaches the public API", (word, owned) => {
  expect(toIPA(word)).toMatch(owned);
});
