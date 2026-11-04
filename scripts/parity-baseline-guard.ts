import { createHash } from "crypto";

export function parityFellBelowBaseline(
  result: { strictCorrect: number; lenientCorrect: number },
  baseline: { strictCorrect: number; lenientCorrect: number },
): boolean {
  return result.strictCorrect < baseline.strictCorrect || result.lenientCorrect < baseline.lenientCorrect;
}

export function parityReferenceRowsSha256(rows: Iterable<readonly [string, readonly string[]]>): string {
  const ordered = Array.from(rows, ([word, references]) => [word, [...references]] as const)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export function parityReferenceContractMatches(expected: string | undefined, actual: string): boolean {
  return typeof expected === "string" && /^[a-f0-9]{64}$/.test(expected) && expected === actual;
}

/** Normalize parity dumps and tagged full snapshots to the parity TSV schema. */
export function parityBeforeSnapshotRows(content: string): string {
  const rows = new Map<string, { ipa: string; route: "dict" | "morph" }>();
  const tagged = content.split("\n").some((line) => {
    const fields = line.split("\t");
    return fields.length === 3 && ["dict", "rule", "morph", "pos:NN", "pos:IN"].includes(fields[0]);
  });
  for (const line of content.split("\n")) {
    const fields = line.split("\t");
    if (!tagged && fields.length === 2 && /^[a-z]+$/.test(fields[0])) {
      rows.set(fields[0], { ipa: fields[1], route: "dict" });
    } else if (tagged && fields.length === 3 && (fields[0] === "dict" || fields[0] === "morph") && /^[a-z]+$/.test(fields[1])) {
      const route = fields[0] as "dict" | "morph";
      const existing = rows.get(fields[1]);
      if (!existing || route === "dict") rows.set(fields[1], { ipa: fields[2], route });
    }
  }
  return [...rows].map(([word, { ipa }]) => `${word}\t${ipa}`).join("\n");
}
