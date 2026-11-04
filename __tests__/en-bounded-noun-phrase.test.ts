import EnglishG2P from "../src/en/g2p";
import { createPhonemizer } from "../src/core";

describe.each([false, true])("bounded noun phrases (rules=%s)", disableDict => {
  const engine = new EnglishG2P({ disableDict });
  const api = createPhonemizer({ processors: [engine] });
  test.each([
    ["This swimming event uses medley swimming as a relay.", "uses"],
    ["The trading system uses low-voltage signals.", "uses"],
    ["This swimming event records medley swimming as a relay.", "records"],
  ])("recognizes the finite verb in %s", (sentence, word) => {
    const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
    expect(tokens.find(token => token.word === word)?.phoneme).toBe(engine.predict(word, "en-US", "V"));
  });
});

const api = createPhonemizer({ processors: [new EnglishG2P()] });
test.each([
  ["The learning record was useful.", "record", "ˈɹɛkɝd"],
  ["Google wins record sales awards.", "record", "ˈɹɛkɝd"],
  ["The uses of data are clear.", "uses", "ˈjusəz"],
  ["The swimming event record was broken.", "record", "ˈɹɛkɝd"],
  ["The recording artist read that book yesterday.", "read", "ɹɛd"],
  ["They may read that book tomorrow.", "read", "ɹid"],
])("preserves the contrasting reading in %s", (sentence, word, ipa) => {
  const tokens = api.phonemize(sentence, { language: "en-US", returnArray: true });
  expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
});
