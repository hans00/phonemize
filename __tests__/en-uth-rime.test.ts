import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("monosyllabic -uth /u/ rime", () => {
  const g2p = new EnglishG2P({ disableDict: true });
  const phonemizer = createPhonemizer({ processors: [g2p] });

  it.each([
    ["truth", "ˈtɹuθ"],
    ["Ruth", "ˈɹuθ"],
  ])("uses the long-U reading for %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["youth", "ˈjuθ"],
    ["sleuth", "ˈsɫuθ"],
    ["tooth", "ˈtuθ"],
    ["south", "ˈsaʊθ"],
    ["mouth", "ˈmaʊθ"],
    ["uncouth", "ənˈkaʊθ"],
    ["bismuth", "ˈbɪsməθ"],
    ["truthful", "ˈtɹuθfəɫ"],
    ["truths", "ˈtɹuθs"],
    ["ruths", "ˈɹuθs"],
    ["untruth", "ənˈtɹuθ"],
  ])("preserves the contrasting form %s", (word, ipa) => {
    expect(g2p.predict(word, "en-US")).toBe(ipa);
  });

  it("keeps both readings intact in a sentence", () => {
    const tokens = phonemizer.phonemize("Ruth told the truth to the youth.", {
      language: "en-US",
      returnArray: true,
    });
    expect(tokens.find((token) => token.word === "Ruth")?.phoneme).toBe("ɹuθ");
    expect(tokens.find((token) => token.word === "truth")?.phoneme).toBe("tɹuθ");
    expect(tokens.find((token) => token.word === "youth")?.phoneme).toBe("juθ");
  });

  it("carries the long-U stem through possessive and name composition", () => {
    expect(g2p.predict("Ruth's", "en-US")).toBe("ˈɹuθs");
    expect(g2p.predict("Ruth-Ann", "en-US")).toBe("ɹuθˈæn");
  });
});
