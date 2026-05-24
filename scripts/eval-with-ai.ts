import { spawnSync } from 'child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import OpenAI from 'openai';
import EnglishG2P from '../src/en-g2p';
import ChineseG2P from '../src/zh-g2p';
import JapaneseG2P from '../src/ja-g2p';
import KoreanG2P from '../src/ko-g2p';
import RussianG2P from '../src/ru-g2p';
import { createPhonemizer } from '../src/core';

const DATA_DIR = resolve(__dirname, 'eval-data');

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  'en-US': 'English (US)',
  'en-GB': 'English (British)',
  zh: 'Chinese (Mandarin)',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
};

const { provider, evalModel, langFilter } = parseArgs(process.argv.slice(2));

function parseArgs(argv: string[]): {
  provider: 'codex' | 'openai';
  evalModel: string;
  langFilter: Set<string>;
} {
  let provider: 'codex' | 'openai' | undefined;
  let evalModel: string | undefined;
  const langFilter = new Set<string>();
  const addLangs = (raw: string) => {
    for (const code of raw.split(',').map(s => s.trim()).filter(Boolean)) {
      langFilter.add(code.toLowerCase());
    }
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? (() => { throw new Error(`Missing value for ${a}`); })();
    if (a === '--provider' || a === '-p') provider = next().toLowerCase() as 'codex' | 'openai';
    else if (a.startsWith('--provider=')) provider = a.slice('--provider='.length).toLowerCase() as 'codex' | 'openai';
    else if (a === '--model' || a === '-m') evalModel = next();
    else if (a.startsWith('--model=')) evalModel = a.slice('--model='.length);
    else if (a === '--lang' || a === '-l') addLangs(next());
    else if (a.startsWith('--lang=')) addLangs(a.slice('--lang='.length));
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: eval-with-ai [--provider codex|openai] [--model <name>] [--lang <codes>]

Options:
  -p, --provider   AI provider for scoring: codex (ChatGPT auth) or openai (API key)
  -m, --model      Model name (default: gpt-5.5 for codex, o3-mini for openai)
  -l, --lang       Comma-separated language codes to evaluate (repeatable).
                   Omit to run all cases. Example: --lang en,zh

Test cases are loaded from scripts/eval-data/*.txt — add a new .txt file there to add a case.
Each file may start with a "# lang: <code>" header line (default: en).
Supported languages: ${Object.keys(LANG_NAMES).join(', ')}.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (provider && provider !== 'codex' && provider !== 'openai') {
    throw new Error(`Invalid provider: ${provider} (expected "codex" or "openai")`);
  }
  provider ??= 'codex';
  evalModel ??= provider === 'codex' ? 'gpt-5.5' : 'o3-mini';
  return { provider, evalModel, langFilter };
}

async function scoreWithOpenAI(prompt: string): Promise<string | null> {
  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: evalModel,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.choices[0].message.content;
}

function scoreWithCodex(prompt: string): string | null {
  const dir = mkdtempSync(join(tmpdir(), 'phonemize-eval-'));
  const outFile = join(dir, 'last.txt');
  try {
    const res = spawnSync(
      'codex',
      ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', '-m', evalModel, '-o', outFile, '-'],
      { input: prompt, stdio: ['pipe', 'inherit', 'inherit'] },
    );
    if (res.status !== 0) throw new Error(`codex exec exited with status ${res.status}`);
    return readFileSync(outFile, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

interface TestCase {
  name: string;
  lang: string;
  text: string;
}

function parseCase(filename: string, raw: string): TestCase {
  const lines = raw.split(/\r?\n/);
  const meta: Record<string, string> = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { if (Object.keys(meta).length) { i++; break; } else continue; }
    const m = line.match(/^#\s*([\w-]+)\s*:\s*(.+)$/);
    if (!m) break;
    meta[m[1].toLowerCase()] = m[2].trim();
  }
  const text = lines.slice(i).join(' ').replace(/\s+/g, ' ').trim();
  return {
    name: filename.replace(/\.txt$/, ''),
    lang: meta.lang || 'en',
    text,
  };
}

function loadCases(): TestCase[] {
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.txt')).sort();
  if (files.length === 0) throw new Error(`No .txt test cases found in ${DATA_DIR}`);
  return files.map(f => parseCase(f, readFileSync(join(DATA_DIR, f), 'utf8')));
}

function buildPrompt(lang: string, text: string, transcription: string): string {
  const langName = LANG_NAMES[lang] ?? lang;
  return `\
I'm trying to predict the ${langName} pronunciation without using a dictionary (rule-based G2P only).
I will give you a text, and you will need to evaluate the predicted phonetic transcription.

P.S. Currently not processing part-of-speech context, please ignore it.

===

Language: ${langName} (${lang})

Text:
${text}

Phonetic transcription (IPA):
${transcription}

===

Please give detailed feedback on the phonetic transcription under 400 words,
focusing on accuracy of vowels, consonants, stress, and any obvious mispredictions.
Conclude with a score between 0 and 100.`;
}

(async () => {
  const phonemizer = createPhonemizer({
    processors: [
      new EnglishG2P({
        disableDict: process.env.PHONEMIZE_NODICT === '1',
      }),
      new ChineseG2P(),
      new JapaneseG2P(),
      new KoreanG2P(),
      new RussianG2P(),
    ],
  });

  const allCases = loadCases();
  const cases = langFilter.size
    ? allCases.filter(c => langFilter.has(c.lang.toLowerCase()))
    : allCases;
  if (cases.length === 0) {
    const wanted = [...langFilter].join(', ');
    const available = [...new Set(allCases.map(c => c.lang))].join(', ');
    throw new Error(`No test cases match --lang ${wanted}. Available langs: ${available}`);
  }
  const filterNote = langFilter.size ? ` [filtered: ${[...langFilter].join(', ')}]` : '';
  console.log(`Scoring via ${provider} (model: ${evalModel}) — ${cases.length}/${allCases.length} case(s)${filterNote}\n`);

  for (const tc of cases) {
    const langName = LANG_NAMES[tc.lang] ?? tc.lang;
    // anyAscii is mandatory for ja/ko/ru — their G2Ps expect romaji/romaja/
    // Latinized Cyrillic input. Enabling unconditionally is harmless for en
    // (already Latin) and zh (the tokenizer preserves Han for pinyin-pro).
    const transcription = phonemizer.toIPA(tc.text, { language: tc.lang, anyAscii: true });

    console.log(`\n━━━ ${tc.name}  [${langName}] ━━━`);
    console.log(`Text:\n${tc.text}\n`);
    console.log(`Predicted phonemes:\n${transcription}\n`);

    const prompt = buildPrompt(tc.lang, tc.text, transcription);
    const content = provider === 'codex'
      ? scoreWithCodex(prompt)
      : await scoreWithOpenAI(prompt);
    if (content) console.log(`Feedback:\n${content}\n`);
  }
})();
