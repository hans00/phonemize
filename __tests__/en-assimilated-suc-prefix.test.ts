import EnglishG2P from "../src/en/g2p";

describe("assimilated suc- stress", () => {
  const rules = new EnglishG2P({ disableDict: true });

  it.each([
    ["succeed", "səkˈsid"],
    ["success", "səkˈsɛs"],
    ["succinct", "səkˈsɪŋkt"],
    ["succumb", "səˈkʌm"],
  ])("stresses and reduces %s", (word, ipa) => {
    expect(rules.predict(word)).toBe(ipa);
  });

  it("leaves nearby suc-/suck- roots on their established routes", () => {
    expect(rules.predict("succor")).toBe("ˈsʌkɔɹ");
    expect(rules.predict("succulent")).toBe("ˈsʌkjəɫənt");
    expect(rules.predict("suck")).toBe("ˈsʌk");
    expect(rules.predict("sucrose")).toBe("ˈsukɹoʊz");
  });
});
