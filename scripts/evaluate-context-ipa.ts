/** Offline context IPA gate. References never enter production dictionaries. */
import { createHash } from "crypto";
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { execFileSync } from "child_process";
import { createPhonemizer } from "../src/core";
import { preProcessByScript } from "../src/g2p";
import EnglishG2P from "../src/en/g2p";
import { loadHomographs, parseTsv, source } from "./evaluate-homographs";
import { NORMALIZER, Reference, parseArpabet, scoreIpa, summarize } from "./context-ipa";

const ROOT = join(__dirname, "..");
const REFERENCE = join(__dirname, "context-ipa-reference.json");
const BASELINE = join(__dirname, "context-ipa-baseline.json");
export const POS_ADAPTER: Record<string, string> = { NOUN: "N", VERB: "V", ADJ: "ADJ" };
export type Case = { id: string; split: string; word: string; gold: string; sentence: string; start: number; end: number; upos?: string };
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

/** Byte boundaries must round-trip; JS string offsets are UTF-16, not source UTF-8. */
export function targetSpan(c: Case) {
  const bytes = Buffer.from(c.sentence), prefix = bytes.subarray(0, c.start).toString("utf8");
  const surface = bytes.subarray(c.start, c.end).toString("utf8");
  if (!Number.isInteger(c.start) || !Number.isInteger(c.end) || c.start < 0 || c.end <= c.start || c.end > bytes.length ||
    Buffer.byteLength(prefix) !== c.start || Buffer.byteLength(surface) !== c.end - c.start || surface.toLowerCase() !== c.word)
    throw new Error(`Invalid source span: ${c.id}`);
  return { prefix, surface };
}

export function predictCase(c: Case, disableDict: boolean, goldPos: boolean, ref: Reference) {
  const { prefix, surface } = targetSpan(c);
  const engine = new EnglishG2P({ disableDict });
  const phonemizer = createPhonemizer({ processors: [engine] });
  const processed = preProcessByScript(c.sentence, phonemizer.registry, "en-US");
  // Include the target so trailing whitespace normalization cannot shift its start.
  // Require this entire normalized prefix to agree with the full sentence.
  const throughTarget = preProcessByScript(prefix + surface, phonemizer.registry, "en-US");
  const targetStart = throughTarget.length - surface.length;
  const tags: Array<{ word: string; pos: string }> = [];
  const originalTag = engine.tagWord.bind(engine);
  engine.tagWord = (word, context) => {
    const tag = originalTag(word, context); tags.push({ word, pos: tag.pos }); return tag;
  };
  const tokens = phonemizer.phonemize(c.sentence, { language: "en-US", returnArray: true });
  const hits = tokens.filter(t => t.word.toLowerCase() === c.word);
  const hit = hits.filter(t => t.position === targetStart);
  if (!processed.startsWith(throughTarget) || throughTarget.slice(targetStart).toLowerCase() !== c.word || hit.length !== 1)
    return { ipa: "", pos: null, alignment: "unaligned", oracleSupported: false, featuresNotInjected: Object.keys(ref.features) };
  const nth = hits.indexOf(hit[0]), matchingTags = tags.filter(t => t.word.toLowerCase() === c.word);
  if (matchingTags.length !== hits.length)
    return { ipa: "", pos: null, alignment: "tag-alignment", oracleSupported: false, featuresNotInjected: Object.keys(ref.features) };
  const injected = ref.upos === null ? undefined : POS_ADAPTER[ref.upos];
  if (!goldPos) return { ipa: hit[0].phoneme, pos: matchingTags[nth].pos, alignment: "aligned", oracleSupported: injected !== undefined, featuresNotInjected: [] };
  if (injected === undefined)
    return { ipa: "", pos: null, alignment: "unsupported-gold-pos", oracleSupported: false, featuresNotInjected: Object.keys(ref.features) };
  let seen = 0;
  engine.tagWord = (word, context) => word.toLowerCase() === c.word && seen++ === nth
    ? { pos: injected, confidence: 1 } : originalTag(word, context);
  const oracleTokens = phonemizer.phonemize(c.sentence, { language: "en-US", returnArray: true });
  const other = (ts: typeof tokens) => ts.filter(t => t.position !== targetStart);
  if (JSON.stringify(other(tokens)) !== JSON.stringify(other(oracleTokens))) throw new Error(`Oracle changed a non-target token: ${c.id}`);
  const oracle = oracleTokens.filter(t => t.word.toLowerCase() === c.word && t.position === targetStart);
  return { ipa: oracle.length === 1 ? oracle[0].phoneme : "", pos: injected,
    alignment: oracle.length === 1 ? "aligned" : "oracle-unaligned", oracleSupported: true,
    featuresNotInjected: Object.keys(ref.features) };
}

type Summary = ReturnType<typeof summarize>;
export function regressions(now: Record<string, Summary>, before: Record<string, Summary>): string[] {
  const failures: string[] = [];
  for (const [cell, n] of Object.entries(now)) {
    const b = before[cell];
    if (!b || n.n !== b.n) { failures.push(`${cell}: changed denominator or missing baseline`); continue; }
    for (const key of ["strict", "lenient", "balanced"] as const) if (n[key] < b[key]) failures.push(`${cell}: ${key} fell`);
    for (const group of ["slices", "readings"] as const) {
      const prefix = group === "readings" ? `${cell}/reading` : cell;
      for (const [slice, counts] of Object.entries(n[group])) {
        const old = b[group]?.[slice];
        if (!old || counts.n !== old.n) { failures.push(`${prefix}/${slice}: changed denominator`); continue; }
        for (const key of ["strict", "lenient"] as const) if (counts[key] < old[key]) failures.push(`${prefix}/${slice}: ${key} fell`);
      }
      if (Object.keys(b[group] ?? {}).some(s => !n[group][s])) failures.push(`${cell}: missing ${group}`);
    }
  }
  return failures;
}

export async function main(argv = process.argv.slice(2)) {
  const option = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag);
    if (i < 0) return fallback;
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`${flag} requires a value`);
    return argv[i + 1];
  };
  if (argv.includes("--help")) {
    console.log("yarn test:ipa [--split eval|train] [--mode all|default|rules] [--pos all|auto|gold] [--out DIR] [--baseline FILE] [--update-baseline]");
    return;
  }
  const valued = ["--split", "--mode", "--pos", "--out", "--baseline", "--metric"];
  for (let i = 0; i < argv.length; i++) {
    if (valued.includes(argv[i])) { option(argv[i], ""); i++; }
    else if (!["--download", "--update-baseline"].includes(argv[i])) throw new Error(`Unknown argument: ${argv[i]}`);
  }
  const split = option("--split", "eval"), mode = option("--mode", "all"), pos = option("--pos", "all");
  const baselinePath = resolve(option("--baseline", BASELINE));
  if (!["eval", "train"].includes(split) || !["all", "default", "rules"].includes(mode) || !["all", "auto", "gold"].includes(pos)) throw new Error("Invalid split/mode/POS option");
  if (argv.includes("--metric") && option("--metric", "") !== "context-ipa") throw new Error("Unknown metric");
  const update = argv.includes("--update-baseline");
  if (update && (split !== "eval" || mode !== "all" || pos !== "all")) throw new Error("Baseline capture requires eval and all four cells");
  const referenceBytes = readFileSync(REFERENCE);
  const manifest = JSON.parse(referenceBytes.toString()) as {
    metric: string; normalizer: string; adapter: string; dialect: string; sources: Record<string, { file?: string; sha256?: string; url: string }>;
    readings: Record<string, Reference>; controls: Case[];
  };
  if (manifest.metric !== "context-ipa-v1" || manifest.normalizer !== NORMALIZER || manifest.adapter !== "reading-upos-v1" || manifest.dialect !== "en-US") throw new Error("Unsupported reference contract");
  const cmuPath = join(resolve(process.env.COMMON_BENCHMARK_DIR ?? join(ROOT, "scripts/.common-accuracy-cache")), manifest.sources.cmudict.file!);
  const cmuBytes = readFileSync(cmuPath);
  if (hash(cmuBytes) !== manifest.sources.cmudict.sha256) throw new Error("CMUdict checksum mismatch");
  const cmu = new Map(cmuBytes.toString().split(/\r?\n/).map(l => l.split("#")[0].trim()).filter(Boolean).map(l => {
    const [word, ...phones] = l.split(/\s+/); return [word, phones.join(" ")] as const;
  }));
  for (const [id, r] of Object.entries(manifest.readings)) {
    if (!r.variants.length || !r.review || !manifest.sources[r.evidence] || r.upos !== null && !POS_ADAPTER[r.upos]) throw new Error(`Incomplete reference: ${id}`);
    for (const v of r.variants) {
      const p = parseArpabet(v.arpabet);
      if (v.protected?.some(i => !Number.isInteger(i) || i < 0 || i >= p.phones.length)) throw new Error(`Invalid protected phone: ${id}`);
      if (v.entry ? cmu.get(v.entry) !== v.arpabet : id !== "invite_nou" || r.evidence !== "mw-invite") throw new Error(`Unattested reference: ${id}`);
    }
  }
  const { files, byPath } = await loadHomographs(argv.includes("--download"));
  const wordids = parseTsv(byPath.get("wordids.tsv")!.toString());
  const wordForId = new Map(wordids.map(r => [r[1], r[0]]));
  for (const [id, r] of Object.entries(manifest.readings)) {
    const word = wordForId.get(id) ?? manifest.controls.find(c => c.gold === id)?.word;
    if (!word || r.variants.some(v => v.entry && v.entry.replace(/\(\d+\)$/, "") !== word)) throw new Error(`Wrong reference headword: ${id}`);
  }
  const words = new Set(Object.keys(manifest.readings).map(id => wordForId.get(id)).filter(Boolean));
  for (const [word, id] of wordids) if (words.has(word) && !manifest.readings[id]) throw new Error(`Missing contrasting reading ${id}`);
  const cases: Case[] = [];
  let population = 0;
  for (const [path, bytes] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (!path.startsWith(split + "/")) continue;
    parseTsv(bytes.toString()).forEach(([word, gold, sentence, start, end], i) => {
      population++;
      if (words.has(word)) cases.push({ id: `${path}:${i + 2}`, split, word, gold, sentence, start: Number(start), end: Number(end) });
    });
  }
  const wikiCases = cases.length;
  cases.push(...manifest.controls.filter(c => c.split === split));
  const controlIds = new Set(manifest.controls.map(c => c.id));
  if (!cases.length || new Set(cases.map(c => c.id)).size !== cases.length) throw new Error("Empty/duplicate cohort");
  for (const c of cases) {
    targetSpan(c);
    if (!manifest.readings[c.gold] || c.upos !== undefined && (!controlIds.has(c.id) || !POS_ADAPTER[c.upos])) throw new Error(`Invalid case annotation ${c.id}`);
  }
  const readingCounts = Object.fromEntries(Object.keys(manifest.readings).map(id => [id, cases.filter(c => c.gold === id).length]));
  const contract = { metric: manifest.metric, normalizer: NORMALIZER, adapter: manifest.adapter, gate: "per-reading-pos-subset-v2",
    referenceSha256: hash(referenceBytes), corpusSha256: source.contentSha256, cohortSha256: hash(JSON.stringify(cases)),
    evaluatorSha256: hash(readFileSync(__filename)), scorerSha256: hash(readFileSync(join(__dirname, "context-ipa.ts"))),
    loaderSha256: hash(readFileSync(join(__dirname, "evaluate-homographs.ts"))),
    phonesSha256: hash(readFileSync(join(__dirname, "evaluate-common-accuracy.ts"))) };
  const inputs = [...readdirSync(join(ROOT, "src/en")).filter(f => f.endsWith(".ts")).map(f => `src/en/${f}`),
    "src/core.ts", "src/g2p.ts", "src/tokenizer.ts", "src/utils.ts", "scripts/context-ipa.ts", "scripts/evaluate-context-ipa.ts",
    "scripts/context-ipa-reference.json", "scripts/evaluate-homographs.ts", "scripts/homograph-sources.json", "scripts/evaluate-common-accuracy.ts",
    ...readdirSync(join(ROOT, "data/en")).filter(f => f.endsWith(".json")).map(f => `data/en/${f}`)];
  const hashes = Object.fromEntries(inputs.map(f => [f, hash(readFileSync(join(ROOT, f)))]));
  const cells: Record<string, Summary> = {}, supportedPosCells: Record<string, Summary> = {}, outputs: Record<string, unknown[]> = {}, predictions: Record<string, string[]> = {};
  const previous = split === "eval" && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : null;
  const compatible = previous && JSON.stringify(previous.contract) === JSON.stringify(contract);
  if (previous && !compatible && !update) throw new Error("Baseline contract changed; do not compare different scorer/reference versions");
  const baseline = compatible ? previous : null;
  const diffs: Record<string, unknown[]> = {}, controlRegressions: string[] = [];
  for (const engineMode of mode === "all" ? ["default", "rules"] : [mode]) for (const posMode of pos === "all" ? ["auto", "gold"] : [pos]) {
    const cell = `${engineMode}/${posMode}`;
    const rows = cases.map(c => {
      const refs = Object.fromEntries(Object.entries(manifest.readings).filter(([id]) => wordForId.get(id) === c.word || id === c.gold));
      const ref = { ...manifest.readings[c.gold], upos: c.upos ?? manifest.readings[c.gold].upos };
      const prediction = predictCase(c, engineMode === "rules", posMode === "gold", ref);
      return { ...c, ...prediction, family: ref.family, upos: ref.upos, control: controlIds.has(c.id),
        oracleEligible: ref.upos !== null && POS_ADAPTER[ref.upos] !== undefined,
        expected: ref.variants.map(v => ({ ...v, parsed: parseArpabet(v.arpabet) })), score: scoreIpa(prediction.ipa, c.gold, refs) };
    });
    cells[cell] = summarize(rows); outputs[cell] = rows; predictions[cell] = rows.map(r => r.ipa);
    supportedPosCells[cell] = summarize(rows.filter(r => r.oracleEligible));
    if (baseline) {
      const old: string[] = baseline.predictions?.[cell];
      if (!old || old.length !== rows.length || old.some(ipa => typeof ipa !== "string")) throw new Error(`Invalid baseline predictions: ${cell}`);
      diffs[cell] = rows.flatMap((row, i) => {
        const refs = Object.fromEntries(Object.entries(manifest.readings).filter(([id]) => wordForId.get(id) === row.word || id === row.gold));
        const before = scoreIpa(old[i], row.gold, refs);
        const delta = [Number(row.score.strict) - Number(before.strict), Number(row.score.lenient) - Number(before.lenient)];
        if (row.control && delta.some(d => d < 0)) controlRegressions.push(`${cell}/${row.id}: explicit control regressed`);
        return old[i] === row.ipa ? [] : [{ id: row.id, word: row.word, gold: row.gold, before: old[i], after: row.ipa, delta, beforeScore: before, afterScore: row.score }];
      });
    }
    const s = cells[cell];
    console.log(`${cell}: strict ${s.strict}/${s.n} (${(100 * s.strict / s.n).toFixed(2)}%), lenient ${s.lenient}/${s.n} (${(100 * s.lenient / s.n).toFixed(2)}%); balanced ${(100 * s.balanced).toFixed(2)}%; unaligned ${rows.filter(r => r.alignment !== "aligned" && r.alignment !== "unsupported-gold-pos").length}; unsupported gold POS ${rows.filter(r => r.alignment === "unsupported-gold-pos").length}`);
  }
  for (const [f, digest] of Object.entries(hashes)) if (hash(readFileSync(join(ROOT, f))) !== digest) throw new Error(`Input changed during evaluation: ${f}`);
  if (hash(readFileSync(cmuPath)) !== manifest.sources.cmudict.sha256) throw new Error("CMUdict changed during evaluation");
  await loadHomographs(); // Recheck the complete pinned corpus after prediction.
  let commit = "unknown";
  try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { /* hashes still identify inputs */ }
  const report = { contract, split, coverage: { wikiCases, originalCases: population, controls: cases.length - wikiCases, lemmas: words.size,
      readingCounts, absentReadings: Object.keys(readingCounts).filter(id => readingCounts[id] === 0) },
    metadata: { commit, node: process.version, hashes, posAnnotationScope: "source-checked lexical-reading POS; not token-UPOS accuracy", featuresAreNotInjected: true }, cells, supportedPosCells, rows: outputs, diffs };
  const out = resolve(option("--out", join(ROOT, "scripts/.homograph-cache/context-ipa")));
  mkdirSync(out, { recursive: true }); writeFileSync(join(out, `${split}-report.json`), JSON.stringify(report, null, 2) + "\n");
  console.log(`Fixed cohort: ${wikiCases}/${population} original occurrences, plus ${cases.length - wikiCases} controls. Report: ${join(out, split + "-report.json")}`);
  if (split === "train") return report;
  const failures = baseline ? [...regressions(cells, baseline.cells),
    ...regressions(Object.fromEntries(Object.entries(supportedPosCells).map(([cell, s]) => [`${cell}/pos-supported`, s])),
      Object.fromEntries(Object.entries(baseline.supportedPosCells ?? {}).map(([cell, s]) => [`${cell}/pos-supported`, s as Summary]))),
    ...controlRegressions] : [];
  if (update) {
    if (failures.length) throw new Error(`Refusing to overwrite a regressed baseline: ${failures.join("; ")}`);
    writeFileSync(baselinePath, JSON.stringify({ contract, cells, supportedPosCells, predictions }, null, 2) + "\n");
    console.log("Initial/version-specific baseline captured; this is not a pronunciation improvement.");
  } else {
    if (!baseline) throw new Error("Missing context baseline; explicitly capture the initial baseline with --update-baseline");
    if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
  }
  return report;
}

if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
