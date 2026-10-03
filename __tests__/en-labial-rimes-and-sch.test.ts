import EnglishG2P from "../src/en/g2p";
import { toIPA } from "../src";

describe.each([false, true])("labial rimes and Greek sch (disableDict=%s)", disableDict => {
  const g2p = new EnglishG2P({ disableDict });
  test("labial ull/ush keeps short u across suffixes", () => {
    for (const word of ["bull", "bullet", "bullion", "bullish", "full", "fully", "pull", "pulled", "pulling", "push", "pushed", "pushing", "bush", "bushes"])
      expect(g2p.predict(word)).toMatch(/[bfp]ʊ/);
    for (const word of ["dull", "null", "skull", "brush", "blush"])
      expect(g2p.predict(word)).not.toContain("ʊ");
  });
  test("oo distinguishes long, short and unrounded labial rimes", () => {
    for (const word of ["food", "foods", "mood", "moody"])
      expect(g2p.predict(word)).toMatch(/[fm]u/);
    for (const word of ["blood", "bloody", "flood", "flooded", "flooding"])
      expect(g2p.predict(word)).toMatch(/[bf][lɫ][ʌə]/);
    for (const word of ["wood", "woods", "wooden", "wool", "woolen", "foot", "footage", "footed"])
      expect(g2p.predict(word)).toMatch(/[wf]ʊ/);
    for (const word of ["school", "pool", "tool", "boot", "root"])
      expect(g2p.predict(word)).toContain("u");
  });
  test("own contrasts with the diphthong in down and owd", () => {
    for (const word of ["own", "owned", "owning", "owner", "known", "grown", "shown", "thrown", "blown", "flown"])
      expect(g2p.predict(word)).toContain("oʊ");
    for (const word of ["down", "town", "brown", "crown", "frown", "crowd", "crowded", "powder"])
      expect(g2p.predict(word)).toContain("aʊ");
  });
  test("Greek sch preserves the Germanic spellings", () => {
    for (const word of ["school", "schools", "schooling", "scheme", "schemes", "scheming", "schema", "schematic", "scholar", "scholarly"])
      expect(g2p.predict(word)).toMatch(/^[ˈˌ]?sk/);
    for (const word of ["schmidt", "schmaltz", "scholl", "schook", "schoonover", "schemel", "scholten"])
      expect(g2p.predict(word)).toMatch(/^[ˈˌ]?ʃ/);
  });
  test("recognized prefix roots survive exception eviction", () => {
    expect(g2p.predict("unknown")).toMatch(/[ʌə]nˈnoʊn/);
    for (const word of ["preschool", "preschools", "preschooler", "preschooling", "reschool"])
      expect(g2p.predict(word)).toContain("sku");
  });
  test("restored fe plurals keep v-stem verbs distinct", () => {
    expect(g2p.predict("knives")).toMatch(/naɪvz/);
    expect(g2p.predict("wives")).toMatch(/waɪvz/);
    expect(g2p.predict("gives")).toMatch(/ɡɪvz/);
    expect(g2p.predict("hives")).toMatch(/haɪvz/);
  });
});

test("public API uses the same root rimes", () => {
  for (const [word, pattern] of [["school", /sku/], ["knives", /naɪvz/], ["blood", /b[lɫ][əʌ]/]] as const)
    expect(toIPA(word)).toMatch(pattern);
});
