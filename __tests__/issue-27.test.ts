import { toIPA } from "../src/index";
import EnglishG2P from "../src/en/g2p";

describe("Issue #27: wind and solutions", () => {
  it("defaults isolated wind to the noun pronunciation", () => {
    expect(toIPA("wind")).toBe("ˈwɪnd");
    expect(toIPA("Wind")).toBe("ˈwɪnd");
    expect(toIPA("Please wind the clock")).toContain("waɪnd");
  });

  it("preserves solution's pronunciation in the plural and in context", () => {
    expect(toIPA("solutions")).toBe("səˈɫuʃənz");
    expect(toIPA("wind solutions")).toBe("wɪnd səˈɫuʃənz");
  });

  it.each(["solution", "confusion", "nation", "suggestion"])(
    "inflects %s without changing its stem",
    (word) => {
      const g2p = new EnglishG2P();
      expect(g2p.predict(`${word}s`)).toBe(`${g2p.predict(word)}z`);
    },
  );

  it.each(["solution", "nation"])("inflects %s with the dictionary disabled", (word) => {
    const g2p = new EnglishG2P({ disableDict: true });
    expect(g2p.predict(`${word}s`)).toBe(`${g2p.predict(word)}z`);
  });
});
