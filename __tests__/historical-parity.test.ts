import { readFileSync } from "fs";
import { join } from "path";
import { gzipSync, gunzipSync } from "zlib";
import { historicalReferences } from "../scripts/evaluate-historical-parity";

const fixture = readFileSync(join(__dirname, "../scripts/parity-historical-v2.tsv.gz"));

test("reconstructed historical references retain their population and variants", () => {
  const references = historicalReferences(fixture);
  expect(references.size).toBe(100816);
  expect(JSON.parse(references.get("pocket")!)).toEqual(["ˈpɑkət", "ˈpɑkɪt"]);
  expect(references.has("jackets")).toBe(true);
  expect(references.has("climates")).toBe(false);
});

test("rejects a changed reference even when the population is unchanged", () => {
  const changed = gunzipSync(fixture).toString("utf8").replace("pocket\t", "pockeU\t");
  expect(() => historicalReferences(gzipSync(changed))).toThrow("frozen hash");
});
