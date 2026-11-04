import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("closed-coda stem yod (disableDict=%s)", disableDict => {
  test("retains dialect through recursive stem composition", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("tubeless", "en-US")).toBe("ˈtubɫəs");
    expect(engine.predict("tubeless", "en-GB")).toBe("ˈtjubɫəs");
    expect(engine.predict("tubelessness", "en-US")).toBe("ˈtubɫəsnəs");
    expect(engine.predict("tubelessness", "en-GB")).toBe("ˈtjubɫəsnəs");
    expect(engine.predict("non-tubeless", "en-GB")).toBe("nɑnˈtjubɫəs");
    expect(engine.predict("tubes", "en-US", "N")).toBe("tubz");
    expect(engine.predict("tubes", "en-GB", "N")).toBe("tjubz");
  });

  test.each(["ˈtub", "ˈtjub"])("preserves caller-owned stem %s in both dialects", pronunciation => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("tube", pronunciation);
    for (const dialect of ["en-US", "en-GB"]) {
      expect(engine.predict("tubes", dialect)).toBe(pronunciation + "z");
      expect(engine.predict("tubeless", dialect)).toBe(pronunciation + "ɫəs");
      expect(engine.predict("tubelessness", dialect)).toBe(pronunciation + "ɫəsnəs");
    }
  });

  test("preserves the sentence's noun, adjective and verb controls", () => {
    const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict })] });
    const result = api.phonemize("The clear tubes carry water.", { language: "en-US" });
    expect(result).toContain("tubz");
    expect(result).not.toContain("tjubz");
  });
});
