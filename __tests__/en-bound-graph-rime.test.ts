import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

describe.each([false, true])("bound -graph rime (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });

  test.each([
    ["photograph", "ˈfoʊtəɡɹæf"],
    ["monograph", "ˈmɑnəɡɹæf"],
    ["lithograph", "ˈɫɪθəɡɹæf"],
    ["photographs", "ˈfoʊtəɡɹæfs"],
    ["monographs", "ˈmɑnəɡɹæfs"],
    ["graph", "ˈɡɹæf"],
  ])("retains TRAP in %s", (word, ipa) => {
    expect(engine.predict(word, "en-US")?.replace(/ˌ/g, "")).toBe(ipa);
  });

  test.each([
    ["photography", "fəˈtɑɡɹəfi"],
    ["photographic", "ˌfoʊtəˈɡɹæfɪk"],
    ["paragraph", disableDict ? "ˈpɛɹəˌɡɹæf" : "ˈpæɹəˌɡɹæf"],
    ["telegraph", "ˈtɛɫəˌɡɹæf"],
    ["autograph", disableDict ? "ˈɔtoʊˌɡɹæf" : "ˈɔtəˌɡɹæf"],
  ])("preserves the neighboring %s route", (word, ipa) =>
    expect(engine.predict(word, "en-US")).toBe(ipa),
  );

  test("retains TRAP through inflection and sentence context", () => {
    expect(engine.predict("photographed", "en-US")?.replace(/ˌ/g, "")).toMatch(/ɡɹæft$/);
    for (const pos of ["N", "V", "NN", "VB"])
      expect(engine.predict("photograph", "en-US", pos)?.replace(/ˌ/g, "")).toMatch(/ɡɹæf$/);

    const tokens = englishTokens(engine, "They photographed two monographs.");
    expect(tokens.find(token => token.word === "photographed")?.phoneme.replace(/ˌ/g, "")).toMatch(/ɡɹæft$/);
    expect(tokens.find(token => token.word === "monographs")?.phoneme.replace(/ˌ/g, "")).toMatch(/ɡɹæfs$/);
  });
});
