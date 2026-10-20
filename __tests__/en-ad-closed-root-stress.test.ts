import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe("assimilated ad- before closed pt/ft roots", () => {
  const processor = new EnglishG2P({ disableDict: true });

  it.each([
    ["adopt", "əˈdɑpt"],
    ["adapt", "əˈdæpt"],
    ["adept", "əˈdɛpt"],
    ["adrift", "əˈdɹɪft"],
  ])("keeps root stress in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it.each([
    ["adopts", "əˈdɑpts"],
    ["adapts", "əˈdæpts"],
    ["adepts", "əˈdɛpts"],
    ["adrifts", "əˈdɹɪfts"],
  ])("preserves root stress in the plural %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
  });

  it("preserves neighboring ad- and a- words in sentence context", () => {
    const phonemizer = createPhonemizer({ processors: [processor] });
    const tokens = phonemizer.phonemize(
      "We adopt a plan, adapt the design, and leave the boat adrift; an adult gave an address at the advent.",
      { language: "en-US", returnArray: true },
    );
    const ipa = (word: string) => tokens.find(token => token.word === word)?.phoneme;
    expect(ipa("adopt")).toBe("əˈdɑpt");
    expect(ipa("adapt")).toBe("əˈdæpt");
    expect(ipa("adrift")).toBe("əˈdɹɪft");
    expect(ipa("adult")).toBe("ˈædəɫt");
    expect(ipa("address")).toBe("ˈædɹɛs");
    expect(ipa("advent")).toBe("ˈædvənt");
  });
});
