import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

describe.each([false, true])("weak -elor (disableDict=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });

  test.each([
    ["bachelor", "N", "ˈbætʃəɫɝ"],
    ["counselor", "N", "ˈkaʊnsəɫɝ"],
    ["counselors", "N", "ˈkaʊnsəɫɝz"],
    ["counsel", "V", "ˈkaʊnsəɫ"],
  ])("%s in %s context", (word, pos, expected) => {
    expect(engine.predict(word, "en-US", pos)).toBe(expected);
  });

  test.each([
    ["The bachelor thanked the counselor.", "ðə ˈbætʃəɫɝ θæŋkt ðə ˈkaʊnsəɫɝ."],
    ["They counsel the students.", "ðeɪ ˈkaʊnsəɫ ðə ˈstudənts."],
    ["The counselors advised the bachelor.", "ðə ˈkaʊnsəɫɝz ædˈvaɪzd ðə ˈbætʃəɫɝ."],
  ])("preserves sentence context: %s", (sentence, expected) => {
    expect(phonemizer.phonemize(sentence, { language: "en-US" })).toBe(expected);
  });
});
