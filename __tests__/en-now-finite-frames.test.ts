import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";
const api = createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  ["I now read the article every day.", "read", "ɹid"],
  ["It now read 'Haldimand House'.", "read", "ɹɛd"],
  ["They would now read the notice.", "read", "ɹid"],
  ["It is now read by Alice.", "read", "ɹɛd"],
  ["I now record the details.", "record", "ɹɪˈkɔɹd"],
  ["The now-record speed is impressive.", "record", "ˈɹɛkɝd"],
  ["The now present difficulties are clear.", "present", "ˈpɹɛzənt"],
  ["She can now present the report.", "present", "pɹɪˈzɛnt"],
  ['The title is now "Record".', "Record", "ˈɹɛkɝd"],
  ["They now close the gate.", "close", "kɫoʊz"],
  ["The shops are now close to the station.", "close", "kɫoʊs"],
  ["She now lives in Canada.", "lives", "ɫɪvz"],
  ["Their lives are interesting.", "lives", "ɫaɪvz"],
  ["They now converse in Urdu.", "converse", "kənˈvɝs"],
  ["The converse is true.", "converse", "ˈkɑnvɝs"],
  ["The always articulate speaker is here.", "articulate", "ɑɹˈtɪkjəɫət"],
  ["They now articulate their needs.", "articulate", "ɑɹˈtɪkjəɫeɪt"],
  ["They now produce the goods.", "produce", "pɹəˈdus"],
  ["The fresh produce is here.", "produce", "ˈpɹoʊdus"],
])("preserves full finite and nominal context in %s", (sentence, word, ipa) => {
  expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => t.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
