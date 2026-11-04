import { decompose } from "../src/en/suffixes";

export interface StemDependency {
  target: string;
  stem: string;
}

/** Conservative spelling and executed-stem components; no pronunciation labels are used. */
export function nestedFamilyFolds(words: readonly string[], dependencies: readonly StemDependency[], foldCount = 10) {
  const vocabulary = new Set(words);
  if (vocabulary.size !== words.length || words.some(word => !word || word !== word.toLowerCase()))
    throw new Error("Nested fold vocabulary must contain unique lowercase words");
  if (!Number.isInteger(foldCount) || foldCount < 2) throw new Error("Invalid fold count");
  const parent = new Map(words.map(word => [word, word]));
  const root = (word: string): string => {
    const p = parent.get(word);
    if (p === undefined) throw new Error(`Unknown family word: ${word}`);
    if (p === word) return word;
    const result = root(p);
    parent.set(word, result);
    return result;
  };
  const join = (a: string, b: string) => {
    if (!vocabulary.has(b)) return;
    const x = root(a), y = root(b);
    if (x !== y) parent.set(x < y ? y : x, x < y ? x : y);
  };
  for (const word of words) {
    const d = decompose(word);
    if (d.steps.length) for (const base of [d.base, ...d.baseAlts]) join(word, base);
    const stem = word.replace(/(?:ing|ed|es|s)$/, "");
    if (stem !== word && stem.length >= 3)
      for (const base of [stem, stem + "e", stem.replace(/([bcdfghjklmnpqrstvwxyz])\1$/, "$1")]) join(word, base);
    if (word.endsWith("ies")) join(word, word.slice(0, -3) + "y");
  }
  const firstUse = new Map<string, string>();
  for (const { target, stem } of dependencies) {
    if (!vocabulary.has(target) || !stem) throw new Error(`Invalid dependency: ${target} → ${stem}`);
    if (stem === target) continue;
    join(target, stem);
    const first = firstUse.get(stem);
    if (first !== undefined) join(target, first);
    else firstUse.set(stem, target);
  }
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = root(word), group = groups.get(key) ?? [];
    group.push(word);
    groups.set(key, group);
  }
  if (groups.size < foldCount) throw new Error(`Need at least ${foldCount} distinct families`);
  const sorted = [...groups.entries()].sort(([a, x], [b, y]) => y.length - x.length || (a < b ? -1 : a > b ? 1 : 0));
  const sizes = Array<number>(foldCount).fill(0), assignments = new Map<string, { family: string; fold: number }>();
  for (const [family, members] of sorted) {
    const fold = sizes.indexOf(Math.min(...sizes));
    for (const word of members) assignments.set(word, { family, fold });
    sizes[fold] += members.length;
  }
  for (const { target, stem } of dependencies) {
    const f = assignments.get(target)?.fold, g = assignments.get(stem)?.fold;
    if (g !== undefined && f !== g) throw new Error(`Attested stem leaked across folds: ${target} → ${stem}`);
    const first = firstUse.get(stem);
    if (first !== undefined && f !== assignments.get(first)?.fold) throw new Error(`Shared stem leaked across folds: ${stem}`);
  }
  return { assignments, sizes, familyCount: groups.size };
}
