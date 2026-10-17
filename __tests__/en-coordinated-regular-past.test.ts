import { inferVerbForm, simplePOSTagger } from "../src/en/pos-tagger";
import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

it.each([
  ["John", "cleaned", "the", "room", "and", "read", "the", "book"],
  ["John", "visited", "Oxford", "and", "read", "the", "book"],
  ["She", "attended", "Downe", "House", "School", ",", "and", "read", "English", "at", "Christ", "Church"],
  ["They", "completed", "the", "plan", "and", "read", "a", "letter"],
  ["The", "teacher", "repaired", "the", "book", "and", "read", "the", "article"],
  ["Breault", "developed", "an", "interest", "in", "science", "fiction", "and", "fantasy", "early", "in", "his", "childhood", ",", "and", "read", "The", "Hobbit"],
])("inherits a finite regular past in %j", (...words: string[]) => {
  expect(inferVerbForm({ words, index: words.indexOf("read") })).toBe("past");
});

it.each([
  ["John", "planned", "to", "leave", "and", "read", "the", "book"],
  ["They", "visit", "the", "learned", "society", "and", "read", "the", "book"],
  ["John", "cleaned", "the", "room", "and", "they", "read", "the", "book"],
  ["John", "cleaned", "the", "room", "and", "now", "read", "the", "book"],
  ["John", "collected", "books", "and", "read", "receipts"],
  ["John", "will", "clean", "the", "room", "and", "read", "the", "book"],
  ["John", "cleaned", "the", "room", ",", "Oxford", "writes", "and", "read", "the", "book"],
])("preserves the other clause or nominal frame in %j", (...words: string[]) => {
  expect(inferVerbForm({ words, index: words.indexOf("read") })).not.toBe("past");
});

it("preserves an adjective and noun beside coordinated past read", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P()] });
  const tokens = api.phonemize("He repaired the present record and read the book.", { language: "en-US", returnArray: true });
  expect(tokens.filter(t => ["present", "record", "read"].includes(t.word)).map(t => t.phoneme))
    .toEqual(["ˈpɹɛzənt", "ˈɹɛkɝd", "ɹɛd"]);
});

it("uses the same finite frame for POS and inflection beside a proper object", () => {
  const words = ["She", "attended", "Downe", "House", "School", ",", "and", "read", "English", "at", "Oxford"];
  expect(simplePOSTagger.tagWord("read", ["and", "English"], { words, index: 7 }).pos).toBe("V");
  expect(inferVerbForm({ words, index: 7 })).toBe("past");
});
it("does not promote a nominal modifier because its later relative mentions yesterday", () => {
  const words = ["The", "letter", "and", "read", "receipts", "generated", "yesterday", "are", "logged"];
  expect(simplePOSTagger.tagWord("read", ["and", "receipts"], { words, index: 3 }).pos).not.toBe("V");
  // Cambridge read receipt /riːd/: an explicit noun reading survives the later relative's tense cue.
  expect(new EnglishG2P().predict("read", "en-US", "N", { words, index: 3 })).toBe("ɹid");
});
