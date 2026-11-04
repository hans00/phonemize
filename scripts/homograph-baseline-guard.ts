interface HomographBaseline {
  sentences: number;
  eval: number;
  evalMacro: number;
}

export function assertHomographBaseline(
  result: { sentences: number; correct: number; macro: number },
  baseline: HomographBaseline | null,
): void {
  if (!baseline) throw new Error("Cannot evaluate without the homograph baseline");
  if (!Number.isSafeInteger(baseline.sentences) || baseline.sentences !== result.sentences || result.sentences < 1)
    throw new Error("Homograph baseline denominator changed");
  const raw = baseline.eval * baseline.sentences / 100, correct = Math.round(raw);
  if (typeof baseline.eval !== "number" || !Number.isFinite(raw) || Math.abs(raw - correct) > 1e-6 || correct < 0 || correct > baseline.sentences ||
      !Number.isFinite(baseline.evalMacro) || baseline.evalMacro < 0 || baseline.evalMacro > 100)
    throw new Error("Homograph baseline has invalid scores or lacks an exact count");
  if (!Number.isSafeInteger(result.correct) || result.correct < 0 || result.correct > result.sentences ||
      !Number.isFinite(result.macro) || result.macro < 0 || result.macro > 100)
    throw new Error("Homograph result has invalid scores");
  if (result.correct < correct || result.macro + 1e-10 < baseline.evalMacro)
    throw new Error("Homograph accuracy fell below baseline");
}
