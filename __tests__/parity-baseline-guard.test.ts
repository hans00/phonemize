import { parityBeforeSnapshotRows, parityFellBelowBaseline, parityReferenceContractMatches, parityReferenceRowsSha256 } from "../scripts/parity-baseline-guard";

test("parity baseline rejects either strict or lenient regression", () => {
  const baseline = { strictCorrect: 10, lenientCorrect: 20 };
  expect(parityFellBelowBaseline({ strictCorrect: 9, lenientCorrect: 20 }, baseline)).toBe(true);
  expect(parityFellBelowBaseline({ strictCorrect: 10, lenientCorrect: 19 }, baseline)).toBe(true);
  expect(parityFellBelowBaseline({ strictCorrect: 10, lenientCorrect: 20 }, baseline)).toBe(false);
  expect(parityFellBelowBaseline({ strictCorrect: 11, lenientCorrect: 21 }, baseline)).toBe(false);
});

test("same-sized populations and reference changes cannot reuse a parity baseline", () => {
  const frozen = parityReferenceRowsSha256([["one", ["wʌn"]], ["two", ["tu"]]]);
  expect(parityReferenceRowsSha256([["two", ["tu"]], ["one", ["wʌn"]]])).toBe(frozen);
  expect(parityReferenceContractMatches(frozen, parityReferenceRowsSha256([["one", ["wʌn"]], ["new", ["tu"]]]))).toBe(false);
  expect(parityReferenceContractMatches(frozen, parityReferenceRowsSha256([["one", ["wən"]], ["two", ["tu"]]]))).toBe(false);
  expect(parityReferenceContractMatches(undefined, frozen)).toBe(false);
  expect(parityReferenceContractMatches(frozen, frozen)).toBe(true);
});

test("parity before-run accepts tagged snapshots and prefers dictionary over morphology routes", () => {
  expect(parityBeforeSnapshotRows([
    "dict\tword\twɝd",
    "rule\tword\twɜrd",
    "morph\tderived\tdɪˈɹaɪvd",
    "morph\tword\twɜrd-morph",
    "pos:NN\tword\twɝd",
    "dict\tcan't\tkænt",
    "word\twɝd",
  ].join("\n"))).toBe(["word\twɝd", "derived\tdɪˈɹaɪvd"].join("\n"));
});
