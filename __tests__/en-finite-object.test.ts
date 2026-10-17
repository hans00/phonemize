import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const cases: Array<[string, string, string]> = [
  ["The method uses toxic gases.", "uses", "ˈjuzəz"],
  ["This version uses electric guitars.", "uses", "ˈjuzəz"],
  ["The alphabet uses only ordinary letters.", "uses", "ˈjuzəz"],
  ["Haaretz uses smaller headlines.", "uses", "ˈjuzəz"],
  ["The department records medical notes.", "records", "ɹɪˈkɔɹdz"],
  ["The department records clinical samples collected daily.", "records", "ɹɪˈkɔɹdz"],
  ["The municipal records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
  ["We examined the city records local residents collected.", "records", "ˈɹɛkɝdz"],
  ["The city records local residents collected are archived.", "records", "ˈɹɛkɝdz"],
  ["The various uses require care.", "uses", "ˈjusəz"],
];
it.each(cases)("preserves the full clause and its contrast: %s", (text, word, ipa) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
