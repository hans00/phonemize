import { createPhonemizer } from "../src/core";
import EnglishG2P from "../src/en/g2p";

// Cambridge US: support /səˈpɔrt/, suppose /səˈpoʊz/, suppress /səˈpres/,
// and supplant /səˈplænt/. These are the assimilated sub- prefix before p-roots.
describe.each([false, true])("assimilated sup- prefix (disableDict=%s)", disableDict => {
  const processor = new EnglishG2P({ disableDict });

  it.each([
    ["support", "səˈpɔɹt"],
    ["suppose", "səˈpoʊz"],
    ["suppress", "səˈpɹɛs"],
    ["supplant", "səˈpɫænt"],
  ])("assigns stress to the p-initial root in %s", (word, ipa) => {
    expect(processor.predict(word, "en-US")).toBe(ipa);
    if (disableDict) expect(processor.trace(word, "en-US").path).toBe("rules");
  });

  it("preserves the distinct unprefixed stems and derived forms", () => {
    expect(processor.predict("supper", "en-US")).toBe("ˈsʌpɝ");
    expect(processor.predict("supple", "en-US")).toBe("ˈsʌpəɫ");
    expect(processor.predict("super", "en-US")).toBe("ˈsupɝ");
    expect(processor.predict("supine", "en-US")).toBe("ˈsupaɪn");
    expect(processor.predict("supply", "en-US")).toBe("səˈpɫaɪ");
    expect(processor.predict("supported", "en-US")).toBe("səˈpɔɹtɪd");
    expect(processor.predict("supposed", "en-US")).toBe("səˈpoʊzd");
    expect(processor.predict("suppression", "en-US")).toBe("səˈpɹɛʃən");
    expect(processor.predict("supposition", "en-US")).toBe("ˌsʌpəˈzɪʃən");
  });
});

it("keeps the assimilated sup- readings in full sentence context", () => {
  const api = createPhonemizer({ processors: [new EnglishG2P({ disableDict: true })] });
  const tokens = api.phonemize(
    "They support the plan. I suppose we can suppress it before it may supplant the old rule.",
    { language: "en-US", returnArray: true },
  );
  for (const [word, ipa] of [
    ["support", "səˈpɔɹt"], ["suppose", "səˈpoʊz"],
    ["suppress", "səˈpɹɛs"], ["supplant", "səˈpɫænt"],
  ]) expect(tokens.find(token => token.word === word)?.phoneme).toBe(ipa);
});
