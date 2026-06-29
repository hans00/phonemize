import { spawnSync } from 'child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import OpenAI from 'openai';
import EnglishG2P from '../src/en/g2p';
import ChineseG2P from '../src/zh/g2p';
import JapaneseG2P from '../src/ja/g2p';
import KoreanG2P from '../src/ko/g2p';
import RussianG2P from '../src/ru/g2p';
import { createPhonemizer } from '../src/core';

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  'en-US': 'English (US)',
  'en-GB': 'English (British)',
  zh: 'Chinese (Mandarin)',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
};

const { provider, evalModel, langFilter, dataDir } = parseArgs(process.argv.slice(2));

function parseArgs(argv: string[]): {
  provider: 'codex' | 'openai';
  evalModel: string;
  langFilter: Set<string>;
  dataDir: string;
} {
  let provider: 'codex' | 'openai' | undefined;
  let evalModel: string | undefined;
  let dataDir: string | undefined;
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
    else if (a === '--data-dir' || a === '-d') dataDir = next();
    else if (a.startsWith('--data-dir=')) dataDir = a.slice('--data-dir='.length);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: eval-with-ai [--provider codex|openai] [--model <name>] [--lang <codes>]

Options:
  -p, --provider   AI provider for scoring: codex (ChatGPT auth) or openai (API key)
  -m, --model      Model name (default: gpt-5.5 for codex, o3-mini for openai)
  -l, --lang       Comma-separated language codes to evaluate (repeatable).
                   Omit to run all cases. Example: --lang en,zh
  -d, --data-dir   Directory of .txt eval cases (default: scripts/eval-data).
                   e.g. --data-dir scripts/eval-data-wikipron for the
                   held-out WikiPron benchmark built by build-eval-set.ts.

Test cases are loaded from <data-dir>/*.txt — add a new .txt file there to add a case.
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
  dataDir ??= resolve(__dirname, 'eval-data');
  return { provider, evalModel, langFilter, dataDir };
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
      // stdout → 'ignore' (the judge's answer is read from outFile); stderr
      // captured to a pipe so codex's live token stream doesn't clutter output —
      // it's surfaced only when the run actually fails (usage limit, auth).
      { input: prompt, stdio: ['pipe', 'ignore', 'pipe'], encoding: 'utf8' },
    );
    if (res.status !== 0) {
      // Don't abort the whole batch on a transient failure (e.g. usage limit) —
      // return null so the caller skips this case and the rest still run.
      const tail = (res.stderr ?? '').toString().trim().split(/\r?\n/).slice(-3).join('\n');
      console.error(`\n⚠ codex exec exited with status ${res.status} — skipping this case.${tail ? `\n${tail}` : ''}`);
      return null;
    }
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
  const files = readdirSync(dataDir).filter(f => f.endsWith('.txt')).sort();
  if (files.length === 0) throw new Error(`No .txt test cases found in ${dataDir}`);
  return files.map(f => parseCase(f, readFileSync(join(dataDir, f), 'utf8')));
}

interface WordEntry {
  word: string;
  ipa: string;
}

type Verdict = "OK" | "MINOR" | "WRONG";

interface CaseScore {
  name: string;
  lang: string;
  total: number;
  ok: number;
  minor: number;
  wrong: number;
  score: number;
  rows: Array<{ word: string; ipa: string; verdict: Verdict | "?"; reason: string }>;
}

// Tokenize into scoring units: unique words (case-insensitive, order-preserved).
// For alphabetic scripts a "word" is a run of letters/marks/apostrophes; CJK
// runs come through as one unit (the judge still verdicts them).
function tokenizeWords(text: string): string[] {
  const matches = text.match(/[\p{L}\p{M}'’]+/gu) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const key = m.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function buildPrompt(lang: string, entries: WordEntry[]): string {
  const langName = LANG_NAMES[lang] ?? lang;
  const list = entries.map((e, i) => `${i + 1}\t${e.word}\t${e.ipa}`).join("\n");
  return `\
You are a phonetician auditing a rule-based grapheme-to-phoneme (G2P) system for ${langName}.
Each line below is one word and the system's predicted IPA (citation form, judged in
isolation — no sentence context, no part-of-speech, so do NOT penalise the absence of
context-dependent forms such as weak/reduced forms or sandhi).

Judge at the PHONEMIC level — the level that distinguishes one word from another in
${langName}. Two things matter, and only these:
  (a) the segmental phonemes (the consonant and vowel phonemes of the language);
  (b) any SUPRASEGMENTAL feature that is lexically contrastive in ${langName} — i.e.
      that can change a word's meaning or identity. Apply only what the language uses:
      lexical stress (e.g. English, Russian), lexical tone (e.g. Mandarin), or
      pitch accent (e.g. Japanese). If ${langName} has no contrastive feature of a
      given kind, ignore that kind entirely.

IGNORE everything sub-phonemic — detail that never distinguishes words in ${langName}:
predictable allophonic variation and assimilation, aspiration, vowel length where
non-contrastive, syllabic-consonant notation, narrow diacritics, and non-contrastive
secondary stress. Accept ANY pronunciation that is standard or a legitimate, widely
used regional/free variant: if the word has several valid pronunciations and the
prediction matches any one of them, it is OK.

Assign EXACTLY ONE verdict per word:
  OK    = phonemically correct — segments and any contrastive suprasegmental are valid
          for a standard (or accepted variant) pronunciation of the word.
  MINOR = the right word and clearly intelligible, but one sub-optimal phonemic choice a
          careful transcriber would correct, short of changing the word's identity.
  WRONG = a phonemic error that changes or obscures the word: a wrong phoneme in a
          salient position, a wrong contrastive suprasegmental (stress/tone/pitch
          accent), or an inserted / deleted phoneme.

Rigor — you are graded on ACCURACY, so do not over-flag:
  - Default to OK. Use WRONG only when you are confident the transcription is genuinely
    not a valid pronunciation of the word. If you are unsure, it is OK.
  - Before marking a STRESS error, recall the word's actual standard primary-stress
    syllable and check the prediction truly differs. Do NOT flag stress from a vague
    impression — long Latinate words (e.g. the -ation/-ity/-ic families: ˌɛdʒəˈkeɪʃən,
    pəˈsɪbɪlɪti, ˌɛkəˈnɑmɪk) carry predictable primary stress; verify before flagging.
  - Treat unstressed-vowel quality (ɪ~ə~i in reduced syllables) and secondary-stress
    placement as never-WRONG; at most MINOR.
A real phonemic error (wrong stem vowel like chase→/ɑ/, a deleted/inserted segment,
primary stress on a demonstrably wrong syllable) must still be marked WRONG — accuracy
means catching those, not waving them through.

Words (index, word, predicted IPA):
${list}

Output ONLY verdict lines, one per word, between the two markers, in this exact format:
<index> | <OK|MINOR|WRONG> | <reason in ≤8 words, or - >

BEGIN_VERDICTS
1 | ... | ...
END_VERDICTS

Output nothing after END_VERDICTS.`;
}

function parseVerdicts(content: string, entries: WordEntry[]): CaseScore["rows"] {
  const rows: CaseScore["rows"] = entries.map((e) => ({
    word: e.word,
    ipa: e.ipa,
    verdict: "?" as Verdict | "?",
    reason: "",
  }));
  const begin = content.indexOf("BEGIN_VERDICTS");
  const block = begin >= 0 ? content.slice(begin + "BEGIN_VERDICTS".length) : content;
  const end = block.indexOf("END_VERDICTS");
  const body = end >= 0 ? block.slice(0, end) : block;
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s*\|\s*(OK|MINOR|WRONG)\b\s*(?:\|\s*(.*))?$/i);
    if (!m) continue;
    const idx = parseInt(m[1], 10) - 1;
    if (idx < 0 || idx >= rows.length) continue;
    rows[idx].verdict = m[2].toUpperCase() as Verdict;
    rows[idx].reason = (m[3] ?? "").trim();
  }
  return rows;
}

function scoreCase(name: string, lang: string, rows: CaseScore["rows"]): CaseScore {
  let ok = 0,
    minor = 0,
    wrong = 0;
  for (const r of rows) {
    if (r.verdict === "OK") ok++;
    else if (r.verdict === "MINOR") minor++;
    else if (r.verdict === "WRONG") wrong++;
  }
  const total = ok + minor + wrong; // unparsed ("?") rows excluded from the denominator
  const score = total ? (100 * (ok + 0.5 * minor)) / total : 0;
  return { name, lang, total, ok, minor, wrong, score, rows };
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

  const scores: CaseScore[] = [];
  for (const tc of cases) {
    const langName = LANG_NAMES[tc.lang] ?? tc.lang;
    // anyAscii is mandatory for ja/ko/ru — their G2Ps expect romaji/romaja/
    // Latinized Cyrillic input. Enabling unconditionally is harmless for en
    // (already Latin) and zh (the tokenizer preserves Han for pinyin-pro).
    const ipaOf = (w: string) =>
      phonemizer.toIPA(w, { language: tc.lang, anyAscii: true }).trim();
    const entries: WordEntry[] = tokenizeWords(tc.text)
      .map((word) => ({ word, ipa: ipaOf(word) }))
      .filter((e) => e.ipa.length > 0);

    console.log(`\n━━━ ${tc.name}  [${langName}] ━━━`);
    console.log(`Words to score: ${entries.length}\n`);

    const prompt = buildPrompt(tc.lang, entries);
    const content =
      provider === 'codex' ? scoreWithCodex(prompt) : await scoreWithOpenAI(prompt);
    if (!content) {
      console.log('(no response from judge — skipping case)\n');
      continue;
    }

    const rows = parseVerdicts(content, entries);
    const cs = scoreCase(tc.name, tc.lang, rows);
    scores.push(cs);

    const unscored = rows.filter((r) => r.verdict === '?').length;
    for (const r of rows) {
      if (r.verdict === 'OK' || r.verdict === '?') continue;
      console.log(`  ${r.verdict === 'WRONG' ? '✗' : '~'} ${r.word} /${r.ipa}/${r.reason ? ` — ${r.reason}` : ''}`);
    }
    console.log(
      `\n  ${cs.name}: ${cs.score.toFixed(1)}%  (OK ${cs.ok}, MINOR ${cs.minor}, WRONG ${cs.wrong}, n=${cs.total}${unscored ? `, unscored ${unscored}` : ''})\n`,
    );
  }

  if (scores.length) {
    const sum = (f: (c: CaseScore) => number) => scores.reduce((a, c) => a + f(c), 0);
    const totOk = sum((c) => c.ok);
    const totMinor = sum((c) => c.minor);
    const totWrong = sum((c) => c.wrong);
    const n = totOk + totMinor + totWrong;
    const micro = n ? (100 * (totOk + 0.5 * totMinor)) / n : 0; // per-word pooled
    const macro = sum((c) => c.score) / scores.length; // per-case mean
    console.log('═'.repeat(56));
    console.log('Standardized rubric scores (OK=1, MINOR=0.5, WRONG=0):');
    for (const c of scores) {
      console.log(`  ${c.name.padEnd(28)} ${c.score.toFixed(1).padStart(5)}%  (n=${c.total})`);
    }
    console.log('─'.repeat(56));
    console.log(`  micro (pooled words): ${micro.toFixed(1)}%   n=${n}`);
    console.log(`  macro (mean of cases): ${macro.toFixed(1)}%   cases=${scores.length}`);
    console.log('═'.repeat(56));
  }
})();
