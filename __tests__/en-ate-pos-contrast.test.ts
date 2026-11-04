import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

it("keeps lexical weak -ate in noun contexts and the full suffix in verb contexts", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const noun = api.phonemize("The graduate spoke.", { language: "en-US", returnArray: true });
  const verb = api.phonemize("They graduate in May.", { language: "en-US", returnArray: true });

  expect(noun.find(token => token.word === "graduate")?.phoneme).toBe("ˈɡɹædʒuət");
  expect(verb.find(token => token.word === "graduate")?.phoneme).toBe("ˈɡɹædʒuˌeɪt");
});

it("reduces a nonverbal -ate tail without weakening a verbal control", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const noun = api.phonemize("The climate changed.", { language: "en-US", returnArray: true });
  const estate = api.phonemize("The estate changed hands.", { language: "en-US", returnArray: true });
  const rate = api.phonemize("The current rate changed.", { language: "en-US", returnArray: true });
  const verb = api.phonemize("We will federate the states.", { language: "en-US", returnArray: true });

  expect(noun.find(token => token.word === "climate")?.phoneme).toBe("ˈkɫaɪmət");
  expect(estate.find(token => token.word === "estate")?.phoneme).toBe("ɪˈsteɪt");
  expect(rate.find(token => token.word === "rate")?.phoneme).toBe("ɹeɪt");
  expect(verb.find(token => token.word === "federate")?.phoneme).toBe("ˈfɛdɝˌeɪt");
});
