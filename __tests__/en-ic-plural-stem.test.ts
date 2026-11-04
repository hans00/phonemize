import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("-ic plural stem (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test("retains the singular's final vowel in its regular plural", () => {
    expect(engine.predict("republics", "en-US", "N")).toBe("ɹiˈpʌbɫɪks");
    expect(engine.predict("publics", "en-US", "N")).toBe("ˈpʌbɫɪks");
    expect(engine.predict("diacritics", "en-US", "N")).toBe("ˌdaɪəˈkɹɪtɪks");
    expect(engine.predict("telepathics", "en-US", "N")).toBe("ˌtɛɫəˈpæθɪks");
    expect(engine.predict("classicals", "en-US", "N")).toBe("ˈkɫæsɪkəɫz");
    expect(engine.predict("basic", "en-US", "ADJ")).toBe("ˈbeɪsɪk");
    expect(api.phonemize("The republics publish basic laws.", { language: "en-US" })).toBe("ðə ɹiˈpʌbɫɪks ˈpʌbɫɪʃ ˈbeɪsɪk ɫɔz.");
  });

  test("preserves an explicitly supplied root", () => {
    const custom = new EnglishG2P({ disableDict });
    custom.addPronunciation("public", "ˈpəblək");
    expect(custom.predict("publics", "en-US", "N")).toBe("ˈpʌbɫəks");
  });
});
