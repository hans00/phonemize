import EnglishG2P from "../src/en/g2p";
import { englishTokens } from "./helpers/english";

// Cambridge US: departmental, experimental, and regimental.
// https://dictionary.cambridge.org/pronunciation/english/departmental
// https://dictionary.cambridge.org/us/pronunciation/english/experimental
// https://dictionary.cambridge.org/pronunciation/english/regimental
const rules = new EnglishG2P({ disableDict: true });

test.each([
  ["departmental", "dɪˌpɑɹtˈmɛntəɫ"],
  ["experimental", "ɪksˌpɛɹəˈmɛntəɫ"],
  ["regimental", "ˌɹɛdʒəˈmɛntəɫ"],
  ["developmental", "dɪˌvɛɫəpˈmɛntəɫ"],
  ["governmental", "ˌɡʌvɝnˈmɛntəɫ"],
])("composes -mental from an attested root: %s", (word, ipa) => {
  expect(rules.predict(word, "en-US")).toBe(ipa);
});

test("preserves the base and the -ment adjective's -ly form", () => {
  expect(rules.predict("department", "en-US")).toBe("dɪˈpɑɹtmənt");
  expect(rules.predict("departmentally", "en-US")).toBe("dɪˌpɑɹtˈmɛntəɫi");
  expect(rules.predict("developmentally", "en-US")).toBe("dɪˌvɛɫəpˈmɛntəɫi");
});

test("keeps noun, verb, and adjective readings in sentence context", () => {

  const tokens = englishTokens(rules, "The department approved the departmental plan. They experiment with an experimental method.");
  expect(tokens.filter(token => ["department", "departmental", "experiment", "experimental"].includes(token.word.toLowerCase()))
    .map(token => [token.word.toLowerCase(), token.phoneme]))
    .toEqual([
      ["department", "dɪˈpɑɹtmənt"],
      ["departmental", "dɪˌpɑɹtˈmɛntəɫ"],
      ["experiment", "ɪksˈpɛɹəmənt"],
      ["experimental", "ɪksˌpɛɹəˈmɛntəɫ"],
    ]);
});
