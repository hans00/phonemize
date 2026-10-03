import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("bound roots and singular endings (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test.each(["element", "implement", "complement", "supplement"])("%s keeps the bound root's medial onset", word => {
    const ipa = g2p.predict(word, "en");
    expect(ipa).toMatch(word === "element" ? /^ˈɛ[lɫ]əmənt$/ : /p[lɫ]əmənt$/);
  });
  test.each(["battlement", "encirclement", "entanglement", "entitlement", "settlement"])("%s preserves a free silent-le stem", word => {
    expect(g2p.predict(word, "en")).toMatch(/ə[lɫ]mənt$/);
  });
  test.each(["achievement", "basement", "placement", "statement", "involvement"])("%s preserves its dropped-e derivation", word => {
    expect(g2p.predict(word, "en")).not.toMatch(/[ɪə]mənt$/);
  });
  test.each(["basis", "thesis", "crisis", "analysis", "oasis", "paralysis"])("%s remains a singular Greek noun", word => {
    expect(g2p.predict(word, "en")).toMatch(/[sɪə]s$/);
    expect(g2p.predict(word, "en")).not.toMatch(/iz$/);
  });
  test.each(["yogis", "antis", "nazis"])("%s retains its genuine i-stem plural", word => {
    expect(g2p.predict(word, "en")).toMatch(/z$/);
  });
  test.each(["radical", "helical", "magical", "practical"])("%s preserves the -ic c before -al", word => {
    expect(g2p.predict(word, "en")).toMatch(/kə[lɫ]$/);
  });
  test.each(["implementation", "instrumentation", "argumentation", "ornamentation"])("%s preserves the -ment stem before -ation", word => {
    const ipa = g2p.predict(word, "en");
    expect(ipa).toMatch(/m[əɛ]nˈteɪʃən$/);
    if (disableDict) expect(ipa).toMatch(/^ˌ/);
  });
  test.each(["approval", "arrival", "removal"])("%s still restores a genuine silent e", word => {
    expect(g2p.predict(word, "en")).toMatch(/və[lɫ]$/);
  });
});

test.each(["element", "implement", "complement", "supplement"])("%s reaches the public API", word => {
  expect(toIPA(word)).toMatch(/(?:ɛ[lɫ]|p[lɫ])əmənt/);
});
