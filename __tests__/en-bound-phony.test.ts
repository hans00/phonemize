import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("Greek bound -phony versus free phony, rules=%s", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  test("a bound sound suffix does not inherit the free adjective's GOAT vowel", () => {
    expect(engine.predict("symphony")).toBe("ˈsɪmfəni");
    expect(engine.predict("symphonies")).toBe("ˈsɪmfəniz");
    expect(engine.predict("phony")).toBe("ˈfoʊni");
    expect(engine.predict("phonies")).toBe("ˈfoʊniz");
    expect(engine.predict("symphonic")).toBe("ˌsɪmˈfɑnɪk");
  });
  test("noun and adjective readings retain their own stress in full sentences", () => {
    const api = createPhonemizer({ processors: [engine] });
    const out = api.phonemize("They perform a symphony with a phony conductor.", { language: "en-US", returnArray: true });
    expect(out.find(t => t.word === "symphony")!.phoneme).toBe("ˈsɪmfəni");
    expect(out.find(t => t.word === "phony")!.phoneme).toBe("ˈfoʊni");
  });
});
