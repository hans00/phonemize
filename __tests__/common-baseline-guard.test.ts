import { assertCommonBaselineUpdate } from "../scripts/common-baseline-guard";

const baseline = { full: { n: 10, strictAccuracy: 80, lenientAccuracy: 90 },
  top5000: { n: 5, strictAccuracy: 80, lenientAccuracy: 100 } };
const equal = { full: { total: 10, strictCorrect: 8, lenientCorrect: 9 },
  top5000: { total: 5, strictCorrect: 4, lenientCorrect: 5 } };

test("accepts unchanged and improved counts", () => {
  expect(() => assertCommonBaselineUpdate(equal, baseline)).not.toThrow();
  expect(() => assertCommonBaselineUpdate({ ...equal, full: { ...equal.full, strictCorrect: 9 } }, baseline)).not.toThrow();
});

test.each([
  ["full strict", { ...equal, full: { ...equal.full, strictCorrect: 7 } }],
  ["full lenient", { ...equal, full: { ...equal.full, lenientCorrect: 8 } }],
  ["top strict", { ...equal, top5000: { ...equal.top5000, strictCorrect: 3 } }],
  ["top lenient", { ...equal, top5000: { ...equal.top5000, lenientCorrect: 4 } }],
])("rejects %s regression", (_name, result) => {
  expect(() => assertCommonBaselineUpdate(result, baseline)).toThrow(/fell below baseline/);
});

test("rejects missing, malformed or changed baselines", () => {
  expect(() => assertCommonBaselineUpdate(equal, null)).toThrow(/missing/);
  expect(() => assertCommonBaselineUpdate(equal, { ...baseline, full: { ...baseline.full, n: 11 } })).toThrow(/denominator/);
  expect(() => assertCommonBaselineUpdate(equal, { ...baseline, top5000: { ...baseline.top5000, lenientAccuracy: 99 } })).toThrow(/exact count/);
});
