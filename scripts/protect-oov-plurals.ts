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
function withTable(Ctor: Constructor, dictionary: Table, disableDict = false): Runtime {
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

/** Regular OOV plurals are dependency invariants, never additional gold examples. */
export function protectOovPlurals(
  Ctor: Constructor, dictionary: Table, table: Table,
  evicted: ReadonlyMap<string, string>, homographs: object,
): Table {
  const makeTable = (pins: Table): Table => Object.assign(Object.create(null), table, pins);
  const baseTable = makeTable({}), baseline = [withTable(Ctor, baseTable), withTable(Ctor, baseTable, true)];
  const pins: Table = Object.create(null), cases: { root: string; child: string; expected: string }[] = [];
  for (const [root, gold] of evicted) {
    const child = root + "s";
    if (!/^[a-z]{4,}$/.test(root) || !/(?:ic|ian)$/.test(root) ||
        hasOwn(table, root) || hasOwn(dictionary, child) ||
        hasOwn(homographs, root) || hasOwn(homographs, child) ||
        (root.endsWith("ic") ? !gold.endsWith("k") : !gold.endsWith("n")) ||
        !same(baseline[1].predict(root), gold)) continue;
    const expected = gold + (root.endsWith("ic") ? "s" : "z");
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
    const remove = new Set<string>();
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
      if (old !== value && worse(old, value, gold)) reject(word, mode, next => worse(old, next, gold));
    }));
    for (const root of Object.keys(pins)) for (const prefix of ["", "un", "non", "inter", "intra"]) {
      const base = prefix + root, child = base + "s";
      if (hasOwn(dictionary, child) || hasOwn(homographs, child)) continue;
      for (const ipa of ["ˈzɛŋ", "ˈzi", "ˈzaɪ"]) {
        const engines = [withTable(Ctor, baseTable), withTable(Ctor, currentTable)];
        engines.forEach(engine => engine.addPronunciation(base, ipa));
        const old = engines[0].predict(child), value = engines[1].predict(child);
        if (!same(old, value)) reject(child, 0, next => !same(old, next), [base, ipa]);
      }
    }
    for (const { root, child, expected } of cases) {
      if (hasOwn(pins, root) && !same(current[0].predict(child), expected)) remove.add(root);
    }
    console.log(`OOV plural dependencies: ${Object.keys(pins).length} pins, ${remove.size} unsafe roots removed`);
    if (!remove.size) return pins;
    for (const root of remove) delete pins[root];
  }
}
