import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe("retained -age stems before plural -s", () => {
  it.each([
    ["average", "ˈævɝɪdʒ"],
    ["beverage", "ˈbɛvɝɪdʒ"],
    ["porterage", "ˈpɔɹtɝɪdʒ"],
  ])("retains the attested base reading of %s", (stem, expected) => {
    expect(new EnglishG2P({ disableDict: true }).predict(stem, "en-US")).toBe(expected);
  });

  it.each([
    ["average", "averages", "ˈævɝɪdʒəz"],
    ["beverage", "beverages", "ˈbɛvɝɪdʒəz"],
    ["porterage", "porterages", "ˈpɔɹtɝɪdʒəz"],
  ])("preserves %s stress in %s on the rules path", (_stem, plural, expected) => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.trace(plural, "en-US").path).toBe("morphology");
    expect(g2p.predict(plural, "en-US")).toBe(expected);
  });

  it.each([
    ["stages", "ˈsteɪdʒəz"],
    ["underages", "ˈʌndɝɪdʒəz"],
    ["percentages", "pɝˈsɛntɪdʒəz"],
    ["wages", "ˈweɪdʒəz"],
    ["damages", "ˈdæmɪdʒɪz"],
    ["mortgages", "ˈmɔɹɡədʒəz"],
  ])("preserves the distinct neighboring plural %s", (plural, expected) => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict(plural, "en-US")).toBe(expected);
  });

  it.each([
    ["image", "images", "ˈɪmɪdʒɪz"],
    ["message", "messages", "ˈmɛsɪdʒɪz"],
    ["package", "packages", "ˈpækɪdʒɪz"],
    ["cottage", "cottages", "ˈkɑtɪdʒɪz"],
  ])("keeps a KIT-final %s stem distinct before plural -es", (stem, plural, expected) => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.trace(stem, "en-US").path).toBe("rules");
    expect(g2p.trace(plural, "en-US").path).toBe("morphology");
    expect(g2p.predict(plural, "en-US")).toBe(expected);
  });

  it("keeps the inherited stems in sentence context across noun, adjective, and verb readings", () => {
    const phonemizer = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
    const tokens = phonemizer.phonemize(
      "The beverage was cold. The average price changed. The price is above average. We average the results. Porterages were charged separately.",
      { language: "en-US", returnArray: true },
    );
    const outputs = tokens.map(token => [token.word.toLowerCase(), token.phoneme] as const);
    expect(outputs.filter(([word]) => word === "average").map(([, ipa]) => ipa)).toEqual([
      "ˈævɝɪdʒ", "ˈævɝɪdʒ", "ˈævɝɪdʒ",
    ]);
    expect(outputs.find(([word]) => word === "beverage")?.[1]).toBe("ˈbɛvɝɪdʒ");
    expect(outputs.find(([word]) => word === "porterages")?.[1]).toBe("ˈpɔɹtɝɪdʒəz");
  });
});
