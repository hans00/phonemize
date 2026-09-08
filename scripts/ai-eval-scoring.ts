export interface WordEntry { word: string; ipa: string }
export function contextEntries(
  tokens: Array<{ word: string; phoneme: string }>,
  originalWords?: string[],
): WordEntry[] {
  return tokens.filter(t => /[\p{L}\p{M}\p{N}]/u.test(t.word))
    .map((t, i) => ({ word: originalWords?.[i] ?? t.word, ipa: t.phoneme.trim() }));
}
type Verdict = 'OK' | 'MINOR' | 'WRONG' | '?';
export interface CaseScore {
  name: string; lang: string; total: number; ok: number; minor: number;
  wrong: number; score: number;
  rows: Array<WordEntry & { verdict: Verdict; reason: string }>;
}

/** A malformed or duplicate response cannot qualify as a complete evaluation. */
export function parseVerdicts(content: string, entries: WordEntry[]): CaseScore['rows'] {
  const rows: CaseScore['rows'] = entries.map(e => ({ ...e, verdict: '?', reason: '' }));
  const block = content.match(/^BEGIN_VERDICTS\s*\r?\n([\s\S]*?)^END_VERDICTS\s*$/m);
  if (!block) return rows;
  const seen = new Set<number>();
  for (const line of block[1].split(/\r?\n/).filter(s => s.trim())) {
    const m = line.match(/^\s*(\d+)\s*\|\s*(OK|MINOR|WRONG)\s*\|\s*(.*)$/);
    const index = m ? Number(m[1]) - 1 : -1;
    if (!m || index < 0 || index >= rows.length || seen.has(index)) {
      return rows.map(r => ({ ...r, verdict: '?', reason: 'Malformed judge response' }));
    }
    seen.add(index);
    rows[index].verdict = m[2] as Verdict;
    rows[index].reason = m[3].trim();
  }
  return rows;
}

export function scoreCase(name: string, lang: string, rows: CaseScore['rows']): CaseScore {
  const count = (v: Verdict) => rows.filter(r => r.verdict === v).length;
  const ok = count('OK'), minor = count('MINOR'), wrong = count('WRONG');
  const total = rows.length;
  return { name, lang, total, ok, minor, wrong, score: total ? 100 * (ok + 0.5 * minor) / total : 0, rows };
}
