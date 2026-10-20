import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("reduced vowel in the productive select root", () => {
  const rules = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });

  it.each([
    ["select", "səˈɫɛkt"],
    ["selection", "səˈɫɛkʃən"],
    ["selective", "səˈɫɛktɪv"],
    ["selectives", "səˈɫɛktɪvz"],
    ["selector", "səˈɫɛktɝ"],
  ])("reduces the initial vowel in %s", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it.each([
    ["selecta", "sɪˈɫɛktə"],
    ["selectee", "sɪˈɫɛkti"],
    ["self", "ˈsɛɫf"],
  ])("preserves the adjacent control %s", (word, expected) => {
    expect(rules.toIPA(word, "en-US")).toBe(expected);
  });

  it("keeps the vowel through verb, noun, and adjective sentence contexts", () => {
    expect(rules.phonemize("Please select a picture. The selection was selective.", {
      language: "en-US",
    })).toBe("pɫis səˈɫɛkt ə ˈpɪktʃɝ. ðə səˈɫɛkʃən wɑz səˈɫɛktɪv.");
  });
});
