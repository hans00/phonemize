import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("-ule stems in monosyllabic -ular formations, rules=%s", disableDict => {
  const engine = () => new EnglishG2P({ disableDict });

  it.each([
    ["modular", "ˈmɑdʒəɫɝ"],
    ["nodular", "ˈnɑdʒəɫɝ"],
    ["titular", "ˈtɪtʃəɫɝ"],
    ["tubular", "ˈtubjəɫɝ"],
  ])("composes %s from its -ule stem", (word, ipa) => {
    expect(engine().predict(word)).toBe(ipa);
  });

  it("keeps lexical bases and longer -ular controls on their established readings", () => {
    const g2p = engine();
    expect(g2p.predict("module")).toBe("ˈmɑdʒuɫ");
    expect(g2p.predict("nodule")).toBe("ˈnɑdʒuɫ");
    expect(g2p.predict("tubule")).toBe("ˈtubjuɫ");
    expect(g2p.predict("molecular")).toBe("məˈɫɛkjəɫɝ");
    expect(g2p.predict("cellular")).toBe("ˈsɛɫjəɫɝ");
    if (disableDict) {
      expect(g2p.predict("consular")).toBe("ˈkɑnzjəɫɝ");
      expect(g2p.predict("insular")).toBe("ɪnˈsuɫɝ");
      expect(g2p.predict("jugular")).toBe("ˈdʒʌɡjəɫɝ");
    } else {
      expect(g2p.predict("consular")).toBe("ˈkɑnsəɫɝ");
      expect(g2p.predict("jugular")).toBe("ˈdʒuɡjəɫɝ");
    }
    expect(g2p.predict("regular")).toBe(disableDict ? "ˈɹɛɡjəɫɝ" : "ˈɹeɪɡjəɫɝ");
    expect(g2p.predict("triangular")).toBe(disableDict ? "ˈtɹaɪæŋɡjəɫɝ" : "tɹaɪˈæŋɡjəɫɝ");
  });

  it("keeps derived readings through a complete sentence", () => {
    const api = createPhonemizer({ processors: [engine()] });
    const tokens = api.phonemize("The modular device has a tubular and nodular design.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.filter(token => ["modular", "tubular", "nodular"].includes(token.word))
      .map(token => [token.word, token.phoneme])).toEqual([
        ["modular", "ˈmɑdʒəɫɝ"],
        ["tubular", "ˈtubjəɫɝ"],
        ["nodular", "ˈnɑdʒəɫɝ"],
      ]);
    expect(tokens.find(token => token.word === "device")?.phoneme).toBe("dɪˈvaɪs");
  });
});
