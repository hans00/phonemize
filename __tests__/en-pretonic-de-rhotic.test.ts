import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("pretonic de before stressed rhotic (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });

  test.each([
    ["determined", "V", "dɪˈtɝmənd"],
    ["determined", "ADJ", "dɪˈtɝmənd"],
    ["determining", "V", "dɪˈtɝmənɪŋ"],
    ["determinable", "ADJ", "dɪˈtɝmənəbəɫ"],
    ["determinant", "N", "dɪˈtɝmənənt"],
    ["deter", "V", "dɪˈtɝ"],
    ["detection", "N", "dɪˈtɛkʃən"],
    ["debater", "N", "dəˈbeɪtɝ"],
  ])("keeps the reading of %s as %s", (word, pos, expected) => {
    expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test("preserves the verb and adjective in full sentence context", () => {
    expect(api.phonemize("They determined the result.", { language: "en-US" })).toContain("dɪˈtɝmənd");
    expect(api.phonemize("The determined team can deter theft.", { language: "en-US" }))
      .toBe("ðə dɪˈtɝmənd tim kən dɪˈtɝ θɛft.");
  });
});
