export function preferCarefulFinalTs(variants: readonly string[], word: string): readonly string[] {
  if (!word.endsWith("ts")) return variants;

  const reduced = new Set(
    variants.filter(short => variants.some(long =>
      long !== short && (long.replace(/t(?=s$)/, "") === short || long.replace(/ts$/, "") === short),
    )),
  );
  return reduced.size ? variants.filter(variant => !reduced.has(variant)) : variants;
}
