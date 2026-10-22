import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("regular -s preserves the doubled-l -all rime", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["calls", "ˈkɔɫz"],
    ["balls", "ˈbɔɫz"],
    ["falls", "ˈfɔɫz"],
    ["walls", "ˈwɔɫz"],
    ["halls", "ˈhɔɫz"],
    ["malls", "ˈmɔɫz"],
    ["smalls", "ˈsmɔɫz"],
    ["stalls", "ˈstɔɫz"],
  ])("predicts %s from its -all stem", (word, ipa) => {
    expect(rules.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps the singular and non-doubled-l controls on their existing routes", () => {
    expect(rules.predict("call", "en-US")).toBe("ˈkɔɫ");
    expect(rules.predict("called", "en-US")).toBe("ˈkɔɫd");
    expect(rules.predict("calling", "en-US")).toBe("ˈkɔɫɪŋ");
    expect(rules.predict("pal", "en-US")).toBe("ˈpæɫ");
    expect(rules.predict("pals", "en-US")).toBe("ˈpɔɫz");
    expect(rules.predict("shall", "en-US")).toBe("ˈʃɔɫ");
    expect(rules.predict("install", "en-US")).toBe("ˌɪnˈstɔɫ");
    expect(rules.predict("installment", "en-US")).toBe("ˌɪnˈstɔɫmənt");
  });

  it("keeps plural rimes intact in sentence tokenization", () => {
    const api = createPhonemizer({ processors: [rules] });
    const tokens = api.phonemize("Calls came from the halls and walls.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.find(token => token.word === "Calls")?.phoneme).toBe("kɔɫz");
    expect(tokens.find(token => token.word === "halls")?.phoneme).toBe("hɔɫz");
    expect(tokens.find(token => token.word === "walls")?.phoneme).toBe("wɔɫz");
  });
});
