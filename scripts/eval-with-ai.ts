import OpenAI from 'openai';
import { G2PModel } from '../src/g2p';
import { expandText } from '../src/expand';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const text = expandText(`\
Yet again the global demand for
moose will be met largely by the
US and Canada. The recession-hit
States is taking comfort in its moose
growth figures with gross production
expected to break 700,000 and net exports to grow by 2%. The worldwide
dominance of Canada shows no signs
of abating though with this year’s
moose population expected to match
last year’s record figures of one hundred million billion.

Europe’s rise as an international
moose power will slow slightly this
year as a response to the European
Union’s move towards standardising
the European moose. Stringent quality controls are holding back the development of the eastern european
populations compared to last year
when they contributed significantly
to europe’s strong growth figures.
Norway, which is not an EU member
but has observer status, strengthed
in numbers relative to the Euro area
with numbers of Norweigian moose,
known locally as elk’’ expected to rise
for the tenth consecutive year, particularly thanks to a strong showing in
the last quarter.`.replace(/\n/g, " ")
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
And give me a score between 0 and 100.
P.S. The score should at the end of the response and formatted as "Score: <score>".`;

openai.chat.completions.create({
  model: "o3-mini",
  messages: [{ role: "user", content: score_prompt }],
}).then(res => {
  const content = res.choices[0].message.content;
  console.log(content + "\n");

//   if (content) {
//     const score = content.match(/Score: (\d+)$/)?.[1];
//     console.log(`Score: ${score}`);
//   }
});
