import { assertHomographBaseline } from "../scripts/homograph-baseline-guard";

const baseline = { sentences: 1615, eval: 90.09287925696594, evalMacro: 90.1680623902846 };
const result = { sentences: 1615, correct: 1455, macro: 90.1680623902846 };

test("preserves exact correct count, macro score, and population", () => {
  expect(() => assertHomographBaseline(result, baseline)).not.toThrow();
  expect(() => assertHomographBaseline({ ...result, correct: 1456 }, baseline)).not.toThrow();
  expect(() => assertHomographBaseline({ ...result, correct: 1454 }, baseline)).toThrow("fell below");
  expect(() => assertHomographBaseline({ ...result, macro: 90.16 }, baseline)).toThrow("fell below");
  expect(() => assertHomographBaseline({ ...result, sentences: 1616 }, baseline)).toThrow("denominator");
});

test("rejects missing or malformed baseline and result", () => {
  expect(() => assertHomographBaseline(result, null)).toThrow("without the homograph baseline");
  expect(() => assertHomographBaseline(result, { ...baseline, eval: 90.1 })).toThrow("exact count");
  expect(() => assertHomographBaseline(result, { ...baseline, evalMacro: NaN })).toThrow("invalid scores");
  expect(() => assertHomographBaseline(result, JSON.parse(JSON.stringify({ ...baseline, eval: String(baseline.eval) })))).toThrow("invalid scores");
  expect(() => assertHomographBaseline({ ...result, correct: 1616 }, baseline)).toThrow("invalid scores");
});
