import { nestedFamilyFolds } from "../scripts/nested-family-folds";

test("keeps attested stems and shared unseen stems together without using labels", () => {
  const words = ["apple", "bottle", "candle", "desk", "fable", "paper", "tree", "pear", "star", "close", "river", "stone"];
  const edges = [
    { target: "apple", stem: "invented" },
    { target: "bottle", stem: "invented" },
    { target: "candle", stem: "apple" },
  ];
  const result = nestedFamilyFolds(words, edges, 3);
  const apple = result.assignments.get("apple");
  expect(result.assignments.get("bottle")).toEqual(apple);
  expect(result.assignments.get("candle")).toEqual(apple);
  expect(result.sizes.reduce((a, b) => a + b, 0)).toBe(words.length);
  const reversed = nestedFamilyFolds([...words].reverse(), [...edges].reverse(), 3);
  for (const word of words) expect(reversed.assignments.get(word)).toEqual(result.assignments.get(word));
});

test("rejects duplicate cohorts and dependencies outside the cohort", () => {
  expect(() => nestedFamilyFolds(["apple", "apple"], [], 2)).toThrow("unique lowercase");
  expect(() => nestedFamilyFolds(["apple", "bottle", "candle"], [{ target: "other", stem: "apple" }], 2)).toThrow("Invalid dependency");
});
