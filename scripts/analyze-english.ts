import EnglishG2P, { inspectIpa } from "../src/en/g2p";
import { createPhonemizer, type SentenceAnalysis } from "../src/core";

const [mode, ...args] = process.argv.slice(2);
const text = args.join(" ");
if (!text || !["word", "forest", "sentence", "ipa"].includes(mode)) {
  console.error("Usage: yarn analyze:en <word|forest|sentence|ipa> <input>");
  process.exitCode = 1;
} else if (mode === "ipa") {
  console.log(JSON.stringify(inspectIpa(text), null, 2));
} else if (mode === "word") {
  console.log(JSON.stringify({ default: new EnglishG2P().analyzeWord(text), rules: new EnglishG2P({ disableDict: true }).analyzeWord(text) }, null, 2));
} else if (mode === "forest") {
  console.log(JSON.stringify(new EnglishG2P({ disableDict: true }).analyzeWordForest(text), null, 2));
} else {
  const engine = new EnglishG2P({ analysis: "shadow" }), analyses = new Set<SentenceAnalysis>();
  const tag = engine.tagWord.bind(engine);
  engine.tagWord = (word, context) => {
    if (context?.sentence?.analysis) analyses.add(context.sentence.analysis);
    return tag(word, context);
  };
  const phonemes = createPhonemizer({ processors: [engine] }).phonemize(text, { language: "en-US", returnArray: true });
  console.log(JSON.stringify({ phonemes, analyses: Array.from(analyses, ({ words, status, tokens }) => ({ words, status, tokens })) }, null, 2));
}
