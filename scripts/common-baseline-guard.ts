interface BaselineSlice {
  n: number;
  strictAccuracy: number;
  lenientAccuracy: number;
}
interface ResultSlice {
  total: number;
  strictCorrect: number;
  lenientCorrect: number;
}

export function assertCommonBaselineUpdate(
  result: { full: ResultSlice; top5000: ResultSlice },
  baseline: { full: BaselineSlice; top5000: BaselineSlice } | null,
): void {
  if (!baseline) throw new Error("Cannot update a missing common baseline");
  for (const slice of ["full", "top5000"] as const) {
    const previous = baseline[slice], current = result[slice];
    if (!previous || !Number.isInteger(previous.n) || previous.n !== current.total) {
      throw new Error(`Common baseline ${slice} denominator changed`);
    }
    for (const [accuracy, correct] of [["strictAccuracy", "strictCorrect"], ["lenientAccuracy", "lenientCorrect"]] as const) {
      const raw = previous[accuracy] * previous.n / 100;
      const count = Math.round(raw);
      if (typeof previous[accuracy] !== "number" || !Number.isFinite(raw) || count < 0 || count > previous.n || Math.abs(raw - count) > 1e-6) {
        throw new Error(`Common baseline ${slice} ${accuracy} has no exact count`);
      }
      if (current[correct] < count) throw new Error(`Common baseline ${slice} ${accuracy} fell below baseline`);
    }
  }
}
