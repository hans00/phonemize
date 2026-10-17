import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

const api = () => createPhonemizer({ processors: [new EnglishG2P()] });
it.each([
  ["The school record, 'The First', was clear.", "record", "ˈɹɛkɝd"],
  ["They received a school permit, 'The Pass', yesterday.", "permit", "ˈpɝmɪt"],
  ["The school subject, 'The Past', was clear.", "subject", "ˈsʌbdʒɪkt"],
  ["The school object, 'The Orb', was lost.", "object", "ˈɑbdʒɛkt"],
  ["In making a wooden bow, the greater part is done on a straight stick.", "bow", "boʊ"],
  ["The weapons permit, a license, was renewed.", "permit", "ˈpɝmɪt"],
  ["They regard it as the weapons permit, a license for access.", "permit", "ˈpɝmɪt"],
])("keeps a nominal head before a new clause: %s", (sentence, word, ipa) => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
it.each([
  ["Record the signal.", "Record", "ɹɪˈkɔɹd"],
  ["Record 'the signal'.", "Record", "ɹɪˈkɔɹd"],
  ["The engineers record the signal.", "record", "ɹɪˈkɔɹd"],
  ["The engineers record 'the signal'.", "record", "ɹɪˈkɔɹd"],
  ["As the cells degenerate, a problem develops.", "degenerate", "dɪˈdʒɛnɝeɪt"],
  ["When the workers refuse, a conflict follows.", "refuse", "ɹɪˈfjuz"],
  ["Whichever way the branches of the tree incline, the path remains clear.", "incline", "ɪnˈkɫaɪn"],
  ["They tried to prove, or discard, the claim.", "discard", "dɪˈskɑɹd"],
])("preserves a real finite or coordinated predicate: %s", (sentence, word, ipa) => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});
it.each([
  ["The present moment matters.", "present", "ˈpɹɛzənt"],
  ["They present the award.", "present", "pɹɪˈzɛnt"],
  ["The record was clear.", "record", "ˈɹɛkɝd"],
])("preserves adjective, verb and noun controls: %s", (sentence, word, ipa) => {
  expect(api().phonemize(sentence, { language: "en-US", returnArray: true }).find(segment => segment.word === word)?.phoneme.replace(/ˌ/g, "")).toBe(ipa);
});

it("preserves both predicates in the original quantified-PP training sentence", () => {
  const sentence = "Since consumption of other goods increase, the embodied fuel used in the production of those goods would increase as well.";
  const occurrences = api().phonemize(sentence, { language: "en-US", returnArray: true }).filter(segment => segment.word === "increase");
  expect(occurrences.map(segment => segment.phoneme.replace(/ˌ/g, ""))).toEqual(["ɪnˈkɹis", "ɪnˈkɹis"]);
});
