import { historicalV5References } from "../scripts/evaluate-parity-historical-v5";

test("retains the frozen reading and adds the independently sourced variant", () => {
  expect(historicalV5References("webpage", "ˈwɛbpɪdʒ")).toEqual(["ˈwɛbpɪdʒ", "ˈwɛbˌpeɪdʒ"]);
  expect(historicalV5References("hurricane", "ˈhəɹəˌkeɪnz")).toEqual(["ˈhəɹəˌkeɪnz", "ˈhɝəˌkeɪn"]);
  expect(historicalV5References("ordinary", "ˈɔɹdənɛɹi")).toEqual(["ˈɔɹdənɛɹi"]);
});

test("rejects reference drift and missing sources", () => {
  expect(() => historicalV5References("webpage", "ˈwɛbpeɪdʒ")).toThrow("reference mismatch");
  expect(() => historicalV5References("word", "a", { word: { from: "a", to: "b", source: "" } })).toThrow("reference mismatch");
});
