import { protectOovPlurals } from "../scripts/protect-oov-plurals";

test("OOV plural retention drops actual causal regressions and preserves caller overrides", () => {
  const source = { zonic: "ˈzoʊnɪk", phonic: "ˈfɑnɪk", control: "ˈkɑn" };
  class Engine {
    dictionary: Record<string, string> = {};
    custom: Record<string, string> = {};
    addPronunciation(word: string, ipa: string): void { this.custom[word] = ipa; }
    predict(word: string): string {
      if (this.custom[word]) return this.custom[word];
      if (word === "control") return this.dictionary.phonic ? "ˈbæd" : source.control;
      if (word.endsWith("s")) {
        const root = word.slice(0, -1);
        if (this.custom[root]) return this.custom[root] + "z";
        return this.dictionary[root] ? this.dictionary[root] + "s" : "ˈbæd";
      }
      return source[word as keyof typeof source] || "ˈbæd";
    }
  }
  const evicted = new Map(Object.entries(source).filter(([root]) => root !== "control"));
  const table = Object.freeze({});
  const pins = protectOovPlurals(Engine, source, table, evicted, {});
  expect({ ...pins }).toEqual({ zonic: source.zonic });
  expect(table).toEqual({});
  // A repeated build uses SOURCE and this build's evictions, not its previous output.
  expect({ ...protectOovPlurals(Engine, source, table, evicted, {}) }).toEqual({ ...pins });
});
