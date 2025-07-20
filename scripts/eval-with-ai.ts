import OpenAI from 'openai';
import { G2PModel } from '../src/g2p';
import { expandText } from '../src/expand';

const openai = new OpenAI();

const text = expandText(`\
Through the rough thoroughfare, the knight’s subtle cough echoed as he strutted past the island’s crumbling lighthouse. The colonel, musing on the rhyme “Though the bough breaks, the bough will bend,” weighed enough wood for the bonfire. His mnemonic for the irregular pronunciation of colonel, island, and knight proved indispensable.`.replace(/\n/g, " ")
);

const model = new G2PModel();

// tokenize the text
const words = text.split(/(?:\s+|[.,!?])/).filter(Boolean);

// predict the phonemes
const phonemes = words.map(word => model.predict(word, undefined, "en", true));

// replace original words with phonemes
let result = text;
for (let i = 0; i < words.length; i++) {
  result = result.replace(words[i], phonemes[i]);
}

console.log(`Predicted phonemes:\n${result}\n`);

const score_prompt = `\
I'm trying to predict the english pronunciation without dictionary in US accent.
I will give you a text, and you will need to tell me the phonetic transcription of the text.

P.S. Currently not process context part of speech, please ignore it.

===

Text:
${text}

Phonetic transcription:
${result}

===

Please give me detailed feedback on the phonetic transcription under 400 words.
And give me a score between 0 and 100.`;

openai.chat.completions.create({
  model: "o3-mini",
  messages: [{ role: "user", content: score_prompt }],
}).then(res => {
  const content = res.choices[0].message.content;
  console.log(content + "\n");
});
