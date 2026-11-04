import { historicalV6References } from "../scripts/evaluate-parity-historical-v5";

test("v6 replaces the unsupported hurricane plural reading", () => {
  expect(historicalV6References("hurricane", "ˈhəɹəˌkeɪnz")).toEqual(["ˈhɝəˌkeɪn"]);
  expect(() => historicalV6References("hurricane", "ˈhɝəˌkeɪn")).toThrow("replacement mismatch");
});

test("v6 retains independently sourced alternatives from v5", () => {
  expect(historicalV6References("webpage", "ˈwɛbpɪdʒ")).toEqual(["ˈwɛbpɪdʒ", "ˈwɛbˌpeɪdʒ"]);
  expect(historicalV6References("ordinary", "ˈɔɹdənɛɹi")).toEqual(["ˈɔɹdənɛɹi"]);
});
