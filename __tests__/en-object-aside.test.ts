import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const cases: Array<[string, string, string]> = [
  ["She proposes appropriate names for characters.", "appropriate", "əˈpɹoʊpɹiət"],
  ["The dealer offers live animals for sale.", "live", "ɫaɪv"],
  ["The Dealer offers live animals for sale.", "live", "ɫaɪv"],
  ["Stone offers produce boxes for delivery.", "produce", "ˈpɹoʊdus"],
  ["The crews use ordinary (filtered) water.", "use", "juz"],
  ["Small water reactors, which heat water, use ordinary (filtered) water.", "use", "juz"],
  ["The crews use ordinary (clean (filtered)) water.", "use", "juz"],
  ["The crews close specific roads.", "close", "kɫoʊz"],
  ["Females produce litters of young animals.", "produce", "pɹəˈdus"],
  ["The agencies appropriate educational grants.", "appropriate", "əˈpɹoʊpɹiˌeɪt"],
  ["The age appropriate educational materials are available.", "appropriate", "əˈpɹoʊpɹiət"],
  ["The warehouse produce local residents bought is fresh.", "produce", "ˈpɹoʊdus"],
  ["The city records local residents read are archived.", "records", "ˈɹɛkɝdz"],
  ["The city records clinical samples that are stored.", "records", "ɹɪˈkɔɹdz"],
  ["More appropriate names for the project are needed.", "appropriate", "əˈpɹoʊpɹiət"],
  ["Using incense seal clocks requires patience.", "incense", "ˈɪnˌsɛns"],
  ["The elaborate entrance gates are still missing.", "entrance", "ˈɛntɹəns"],
];
it.each(cases)("keeps subject/object and noun contrasts in %s", (text, word, ipa) => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  expect(api.phonemize(text, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme).toBe(ipa);
});
