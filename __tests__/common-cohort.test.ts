import cohort = require("../scripts/common-cohort.json");
import { commonReferences } from "../scripts/common-cohort-gold";

describe("fixed English common-word cohort", () => {
  it("keeps the ranked population stable when dictionary references add forms", () => {
    expect(cohort.n).toBe(6990);
    expect(cohort.topN).toBe(3617);
    expect(cohort.words).toHaveLength(6990);
    expect(new Set(cohort.words).size).toBe(6990);
    expect(cohort.top5000).toHaveLength(3617);
    expect(new Set(cohort.top5000).size).toBe(3617);
    expect(cohort.top5000.every(word => cohort.words.includes(word))).toBe(true);
    expect(cohort.words.every(word => commonReferences[word])).toBe(true);
    expect(Object.keys(commonReferences)).toHaveLength(6990);
    expect(cohort.words).toContain("production");
    expect(cohort.words).not.toContain("productions");
  });
});
