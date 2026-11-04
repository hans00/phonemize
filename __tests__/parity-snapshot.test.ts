import { compareParity, parseRows } from "../scripts/parity-snapshot";

test("reports individual wins and losses against the same frozen variants", () => {
  const refs = parseRows('one\t["wʌn","wən"]\ntwo\t["tu"]\n');
  const result = compareParity(parseRows("one\twən\ntwo\tta\n"), parseRows("one\twʌn\ntwo\ttu\n"), refs);
  expect(result.before).toEqual([1, 2]);
  expect(result.after).toEqual([2, 2]);
  expect(result.changes.map(row => row.word)).toEqual(["one", "two"]);
});

test("rejects changed populations even when their sizes match", () => {
  const refs = parseRows('one\t["wʌn"]\ntwo\t["tu"]\n');
  expect(() => compareParity(parseRows("one\twʌn\ntwo\ttu\n"), parseRows("one\twʌn\nnew\ttu\n"), refs)).toThrow("population differs");
  expect(() => parseRows("one\ta\none\tb\n")).toThrow("duplicate");
  expect(() => compareParity(parseRows("one\twʌn\n"), parseRows("one\twʌn\n"), parseRows('one\t[]\n'))).toThrow("Invalid references");
  expect(() => compareParity(new Map(), new Map(), new Map())).toThrow("population is empty");
});
