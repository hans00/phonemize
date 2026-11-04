import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const json = (file: string) => JSON.parse(readFileSync(join(root, file), "utf8"));

describe("versioned evaluation baseline migrations", () => {
  it("keeps context v3 migration provenance and the refreshed baseline above the v2 floor", () => {
    const v2Path = "scripts/context-ipa-baseline-v2.json";
    const v2 = json(v2Path);
    const v3 = json("scripts/context-ipa-baseline-v3.json");

    expect(hash(readFileSync(join(root, v2Path)))).toBe(v3.provenance.legacyBaselineSha256);
    expect(hash(JSON.stringify(v2.predictions))).toBe(v3.provenance.predictionsSha256);
    expect(v3.provenance.rescoredPredictions).toBe(432);
    expect(v3.provenance.allSummaryFieldsIdentical).toBe(true);
    for (const cell of Object.keys(v2.cells)) {
      expect(v3.cells[cell].n).toBe(v2.cells[cell].n);
      expect(v3.cells[cell].strict).toBeGreaterThanOrEqual(v2.cells[cell].strict);
      expect(v3.cells[cell].lenient).toBeGreaterThanOrEqual(v2.cells[cell].lenient);
    }
    for (const cell of Object.keys(v2.supportedPosCells)) {
      expect(v3.supportedPosCells[cell].n).toBe(v2.supportedPosCells[cell].n);
      expect(v3.supportedPosCells[cell].strict).toBeGreaterThanOrEqual(v2.supportedPosCells[cell].strict);
      expect(v3.supportedPosCells[cell].lenient).toBeGreaterThanOrEqual(v2.supportedPosCells[cell].lenient);
    }
  });

  it("migrates context v4 by rescoring the unchanged v3 prediction snapshot", () => {
    const v3Path = "scripts/context-ipa-baseline-v3.json";
    const v3 = json(v3Path);
    const v4 = json("scripts/context-ipa-baseline-v4.json");

    expect(v4.provenance.legacyBaseline).toBe(v3Path);
    expect(hash(readFileSync(join(root, v3Path)))).toBe(v4.provenance.legacyBaselineSha256);
    expect(hash(JSON.stringify(v3.predictions))).toBe(v4.provenance.predictionsSha256);
    expect(v4.provenance.rescoredPredictions).toBe(432);
    expect(v4.provenance.allSummaryFieldsIdentical).toBe(true);
    expect(v4.predictions).toEqual(v3.predictions);
    expect(v4.cells).toEqual(v3.cells);
    expect(v4.supportedPosCells).toEqual(v3.supportedPosCells);
  });

  it("keeps the parity v6 floor anchored to the unchanged v2 snapshot and references", () => {
    const v2BaselinePath = "scripts/parity-baseline-v2.json";
    const v2BaselineBytes = readFileSync(join(root, v2BaselinePath));
    const v2References = json("scripts/parity-reference-v2.json");
    const manifest = json("scripts/parity-reference-historical-v6.json");
    const v6 = json("scripts/parity-baseline-v6.json");

    expect(hash(v2BaselineBytes)).toBe(manifest.historicalV2BaselineSha256);
    expect(hash(JSON.stringify(v2References))).toBe(manifest.historicalV2ReferenceManifestSha256);
    expect(manifest.frozenSnapshotSha256).toBe(json(v2BaselinePath).provenance.snapshotSha256);
    expect(v6.referenceVersion).toBe(manifest.version);
    expect(v6.referenceRowsSha256).toBe(manifest.referenceRowsSha256);
    expect(v6.strictCorrect).toBeGreaterThanOrEqual(v6.provenance.v6FrozenFloor[0]);
    expect(v6.lenientCorrect).toBeGreaterThanOrEqual(v6.provenance.v6FrozenFloor[1]);
    expect(v6.provenance.snapshotSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(v6.provenance.snapshot).toBe(
      `scripts/.prediction-cache/parity-${v6.provenance.snapshotSha256}.tsv.gz`,
    );
  });
});
