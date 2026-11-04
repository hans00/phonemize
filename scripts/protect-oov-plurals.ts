import * as levenshtein from "fast-levenshtein";
import { parseIpa } from "./context-ipa";

type Table = Record<string, string>;
const hasOwn = (table: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(table, key);
type Runtime = {
  predict(word: string): string | null | undefined;
  addPronunciation(word: string, ipa: string): void;
};
type Constructor = new (options?: { disableDict?: boolean }) => Runtime;

// Build-only instances: never mutate the shared imported runtime dictionary.
function withTable<T extends Runtime>(Ctor: new (options?: { disableDict?: boolean }) => T, dictionary: Table, disableDict = false): T {
  const engine = new Ctor({ disableDict });
  Object.defineProperty(engine, "dictionary", { value: dictionary, writable: true });
  return engine;
}

function same(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  try {
    const x = parseIpa(a), y = parseIpa(b);
    return x.primary === y.primary && JSON.stringify(x.phones) === JSON.stringify(y.phones);
  } catch { return false; }
}

const strip = (s: string): string => s.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");
function canonical(s: string): string {
  s = strip(s);
  for (const group of [["ɑ", "ɔ"], ["i", "ɪ"], ["ɛ", "eɪ"], ["ɫ", "l"], ["æ", "eɪ"]]) {
    for (const value of group.slice(1)) s = s.split(value).join(group[0]);
  }
  return s;
}
const score = (value: string, gold: string): number[] => [
  +(strip(value) === strip(gold)),
  +(levenshtein.get(canonical(value), canonical(gold)) <= 1),
];
function worse(before: string, after: string, gold: string): boolean {
  return score(after, gold).some((value, i) => value < score(before, gold)[i]) ||
    levenshtein.get(strip(after), strip(gold)) > levenshtein.get(strip(before), strip(gold)) ||
    same(before, gold) && !same(after, gold);
}

/** Regular OOV derivatives are dependency invariants, never additional gold examples. */
export function protectOovDerivatives(
  Ctor: Constructor, dictionary: Table, table: Table,
  evicted: ReadonlyMap<string, string>, homographs: object,
): Table {
  const makeTable = (pins: Table): Table => Object.assign(Object.create(null), table, pins);
  const baseTable = makeTable({}), baseline = [withTable(Ctor, baseTable), withTable(Ctor, baseTable, true)];
  const pins: Table = Object.create(null), cases: { root: string; child: string; expected: string }[] = [], blocked = new Set<string>();
  for (const [root, gold] of evicted) {
    const agent = root.endsWith("ival") && gold.endsWith("əɫ");
    const child = root + (agent ? "er" : "s");
    const suffix = agent ? "ɝ" : /nse$/.test(root) && gold.endsWith("s") ? "əz" : root.endsWith("ic") && gold.endsWith("k") ? "s" :
      ((root.endsWith("ian") || /[bcdfghjklmnpqrstvwxyz]leman$/.test(root)) && gold.endsWith("n") || root.endsWith("a") && /^[ˈˌ]*θ/.test(gold) && gold.endsWith("ə") || root.endsWith("airie") && gold.endsWith("i") || root.endsWith("eye") && gold.endsWith("aɪ")) ? "z" : undefined;
    if (!/^[a-z]{4,}$/.test(root) || !suffix ||
        hasOwn(table, root) || hasOwn(dictionary, child) ||
        hasOwn(homographs, root) || hasOwn(homographs, child) ||
        !same(baseline[1].predict(root), gold)) continue;
    const expected = gold + suffix;
    if (same(baseline[0].predict(child), expected) ||
        !same(withTable(Ctor, makeTable({ [root]: gold })).predict(child), expected)) continue;
    pins[root] = gold;
    cases.push({ root, child, expected });
  }
  if (!cases.length) return pins;
  const words = Object.entries(dictionary);
  const before = words.map(([word]) => baseline.map(engine => engine.predict(word) || ""));
  for (;;) {
    const currentTable = makeTable(pins), current = [withTable(Ctor, currentTable), withTable(Ctor, currentTable, true)];
    const remove = new Set<string>(), add: Table = Object.create(null);
    // Attribute through actual accesses, then test each cause in the real pipeline.
    const reject = (word: string, mode: number, failed: (value: string) => boolean, custom?: [string, string]): void => {
      const touched = new Set<string>();
      const tracing = new Proxy(currentTable, { get(target, key: string) {
        if (hasOwn(pins, key)) touched.add(key);
        return target[key];
      } });
      const run = (lookup: Table): string => {
        const engine = withTable(Ctor, lookup, !!mode);
        if (custom) engine.addPronunciation(...custom);
        return engine.predict(word) || "";
      };
      run(tracing);
      const causes = [...touched].filter(root => {
        const fewer = { ...pins }; delete fewer[root];
        return !failed(run(makeTable(fewer)));
      });
      const drops = causes.length ? causes : [...touched];
      if (!drops.length) throw new Error(`Unattributed OOV-plural pin regression: ${word}`);
      drops.forEach(root => remove.add(root));
    };
    words.forEach(([word, gold], index) => current.forEach((engine, mode) => {
      const old = before[index][mode], value = engine.predict(word) || "";
      if (old !== value && worse(old, value, gold)) {
        const pendingTable = makeTable({ ...pins, ...add });
        if (Object.keys(add).length && [false, true].every((rules, cell) => !worse(before[index][cell], withTable(Ctor, pendingTable, rules).predict(word) || "", gold))) return;
        const protectedTable = makeTable({ ...pins, ...add, [word]: gold });
        if (!blocked.has(word) && !hasOwn(currentTable, word) && !hasOwn(homographs, word) &&
            [false, true].every((rules, cell) => !worse(before[index][cell], withTable(Ctor, protectedTable, rules).predict(word) || "", gold))) add[word] = gold;
        else reject(word, mode, next => worse(old, next, gold));
      }
    }));
    for (const { root, child: originalChild } of cases) for (const prefix of ["", "un", "non", "inter", "intra"]) {
      if (!hasOwn(pins, root)) continue;
      const base = prefix + root, child = base + originalChild.slice(root.length);
      if (hasOwn(dictionary, child) || hasOwn(homographs, child)) continue;
      for (const ipa of ["ˈzɛŋ", "ˈzi", "ˈzaɪ"]) {
        const engines = [withTable(Ctor, baseTable), withTable(Ctor, currentTable)];
        engines.forEach(engine => engine.addPronunciation(base, ipa));
        const old = engines[0].predict(child), value = engines[1].predict(child);
        if (!same(old, value)) reject(child, 0, next => !same(old, next), [base, ipa]);
      }
    }
    for (const root of Object.keys(pins)) if (!cases.some(item => item.root === root)) for (const suffix of ["s", "es", "ed", "ing", "ly", "ness", "ful", "able"]) {
      const child = root + suffix;
      for (const ipa of ["ˈzɛŋ", "ˈzi", "ˈzaɪ"]) for (const mode of [0, 1]) {
        const engines = [withTable(Ctor, baseTable, !!mode), withTable(Ctor, currentTable, !!mode)];
        engines.forEach(engine => engine.addPronunciation(root, ipa));
        const old = engines[0].predict(child), value = engines[1].predict(child);
        if (old !== value && !same(old, value)) reject(child, mode, next => !same(old, next), [root, ipa]);
      }
    }
    for (const { root, child, expected } of cases) {
      if (hasOwn(pins, root) && !same(current[0].predict(child), expected)) remove.add(root);
    }
    console.log(`OOV derivative dependencies: ${Object.keys(pins).length} pins, ${remove.size} unsafe roots removed`);
    if (!remove.size && !Object.keys(add).length) return pins;
    for (const root of remove) { delete pins[root]; blocked.add(root); }
    for (const [root, gold] of Object.entries(add)) if (!blocked.has(root)) pins[root] = gold;
  }
}

/** Retain source roots needed to distinguish past -ed from a complete compound tail. */
export function protectEdRoots(
  Ctor: new (options?: { disableDict?: boolean }) => Runtime & Pick<import("../src/en/g2p").default, "analyzeWord">,
  dictionary: Table, table: Table,
  evicted: ReadonlyMap<string, string>, tails: Table, homographs: object,
): Table {
  const full = (value: string): string => value.replace(/ʌ/g, "ə").replace(/ɫ/g, "l");
  const makeTable = (pins: Table): Table => Object.assign(Object.create(null), table, pins);
  const baseline = [withTable(Ctor, makeTable({})), withTable(Ctor, makeTable({}), true)];
  const endings = Object.entries(tails).filter(([word, ipa]) => word.length >= 3 && /ed$/.test(word) && /ɛd$/.test(ipa))
    .map(([word]) => word.slice(0, -2));
  const pins: Table = Object.create(null), blocked = new Set<string>(), children = new Map<string, Set<string>>();
  const completeTail = (word: string): import("../src/en/analysis").CompoundCandidate | undefined => {
    const analysis = baseline[1].analyzeWord(word);
    let selected: import("../src/en/analysis").CompoundCandidate | undefined;
    for (const candidate of analysis.candidates) if (candidate.kind === "compound" &&
        (!selected || candidate.evidence.legacyScore > selected.legacyScore)) selected = candidate.evidence;
    return analysis.status === "enumerated" && selected && hasOwn(tails, selected.structure.right.spelling) &&
      /ed$/.test(selected.structure.right.spelling) && /ɛd$/.test(selected.structure.right.componentIpa) ? selected : undefined;
  };
  const propose = (root: string, gold: string, child: string, expected: string): void => {
    const possessive = child + "'s", expectedPossessive = expected + (/[szʃʒ]$/.test(expected) ? "ɪz" : /[ptkfθ]$/.test(expected) ? "s" : "z");
    if (hasOwn(homographs, child) || hasOwn(dictionary, child) && full(dictionary[child]) !== full(expected) ||
        hasOwn(dictionary, possessive) && full(dictionary[possessive]) !== full(expectedPossessive)) return;
    const restored = withTable(Ctor, makeTable({ [root]: gold }), true).predict(child) || "";
    if (full(restored) !== full(expected) || full(baseline[1].predict(child) || "") === full(expected)) return;
    pins[root] = gold;
    const readings = children.get(child) ?? new Set<string>();
    readings.add(full(expected)); children.set(child, readings);
  };
  for (const [root, gold] of evicted) {
    const bare = root.endsWith("e") ? root.slice(0, -1) : root;
    if (!/^[a-z]{3,60}$/.test(root) || hasOwn(table, root) || hasOwn(homographs, root) ||
        !endings.some(ending => bare.endsWith(ending)) || full(baseline[1].predict(root) || "") !== full(gold)) continue;
    const reading = parseIpa(gold);
    const child = root.endsWith("e") ? bare + "ed" : /[^aeiouy]y$/.test(root) ? root.slice(0, -1) + "ied" :
      /(?:[^aeiouy]|qu)[aeiou][^aeiouywx]$/.test(root) && reading.primary === reading.nuclei - 1
        ? root + root.slice(-1) + "ed" : root + "ed";
    const expected = gold + (/[td]$/.test(gold) ? "ɪd" : /[pksʃfθ]$/.test(gold) ? "t" : "d");
    if (completeTail(child)) propose(root, gold, child, expected);
  }
  // Rule-exact compound stems can still be needed by stress-neutral OOV derivatives.
  for (const [root, gold] of evicted) {
    if (!/^[a-z]{5,64}$/.test(root) || !/ed$/.test(root) || !/ɛd$/.test(gold) ||
        hasOwn(table, root) || hasOwn(homographs, root) || full(baseline[1].predict(root) || "") !== full(gold)) continue;
    const compound = completeTail(root);
    if (!compound || full(compound.componentIpa) !== full(gold)) continue;
    const agent = root + root.slice(-1) + "er";
    propose(root, gold, agent, gold + "ɝ");
    propose(root, gold, agent + "s", gold + "ɝz");
  }
  if (!Object.keys(pins).length) return pins;
  console.log(`Past-root proposals (regular-spelling v2): ${Object.keys(pins).length} source roots with competing complete tails`);
  const words = Object.entries(dictionary).map(([word, gold]): [string, string, string] => [word, gold, word]);
  // Preserve vowel-final source names/loans in regular OOV plurals too.
  for (const [root, gold] of Object.entries(dictionary)) {
    const child = root + "s";
    if (/^[a-z]{3,64}$/.test(root) && /[aeiu]$/.test(root) && /[ɑæʌɔɛɝɪiʊuə]$/.test(gold) &&
        !hasOwn(table, root) && !hasOwn(homographs, root) && !hasOwn(dictionary, child) && !hasOwn(homographs, child) &&
        full(baseline[1].predict(root) || "") === full(gold)) words.push([child, gold + "z", root]);
  }
  const before = words.map(([word]) => baseline.map(engine => engine.predict(word) || ""));
  const loses = (old: string, value: string, gold: string): boolean => worse(old, value, gold) ||
    full(old) === full(gold) && full(value) !== full(gold);
  for (;;) {
    const currentTable = makeTable(pins), current = [withTable(Ctor, currentTable), withTable(Ctor, currentTable, true)];
    const remove = new Set<string>(), add: Table = Object.create(null);
    words.forEach(([word, gold, owner], index) => current.forEach((engine, mode) => {
      const old = before[index][mode], value = engine.predict(word) || "";
      const failed = (next: string): boolean => owner === word ? loses(old, next, gold) : full(next) !== full(gold);
      if (old === value || !failed(value)) return;
      // A whole source entry can suppress accidental decomposition without removing its root.
      const protectedTable = makeTable({ ...pins, [owner]: dictionary[owner] });
      if (!blocked.has(owner) && !hasOwn(table, owner) && !hasOwn(pins, owner) && !hasOwn(homographs, owner) &&
          [false, true].every((rules, cell) => {
            const protectedValue = withTable(Ctor, protectedTable, rules).predict(word) || "";
            return owner === word ? !loses(before[index][cell], protectedValue, gold) : full(protectedValue) === full(gold);
          })) {
        add[owner] = dictionary[owner];
        if (owner !== word) {
          const readings = children.get(word) ?? new Set<string>();
          readings.add(full(gold)); children.set(word, readings);
        }
        return;
      }
      const touched = new Set<string>();
      const tracing = new Proxy(currentTable, { get(target, key: string) {
        if (hasOwn(pins, key)) touched.add(key);
        return target[key];
      } });
      withTable(Ctor, tracing, !!mode).predict(word);
      const causes = [...touched].filter(root => {
        const fewer = { ...pins }; delete fewer[root];
        return !failed(withTable(Ctor, makeTable(fewer), !!mode).predict(word) || "");
      });
      const rejected = causes.length ? causes : [...touched];
      if (!rejected.length) throw new Error(`Unattributed -ed root regression: ${word}`);
      rejected.forEach(root => remove.add(root));
    }));
    console.log(`Past-root dependencies: ${Object.keys(pins).length} pins, ${remove.size} removed, ${Object.keys(add).length} protected consumers`);
    if (!remove.size && !Object.keys(add).length) {
      for (const [child, readings] of children) for (const engine of current) {
        if (!readings.has(full(engine.predict(child) || ""))) throw new Error(`Unprotected regular past: ${child}`);
      }
      return pins;
    }
    for (const root of remove) { delete pins[root]; blocked.add(root); }
    for (const [word, gold] of Object.entries(add)) if (!blocked.has(word)) pins[word] = gold;
  }
}
