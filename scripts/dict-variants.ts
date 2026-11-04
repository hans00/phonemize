import { syllabify } from "../src/en/syllabify";

export function preferCarefulFinalTs(variants: readonly string[], word: string): readonly string[] {
  if (!word.endsWith("ts")) return variants;

  const reduced = new Set(
    variants.filter(short => variants.some(long =>
      long !== short && (long.replace(/t(?=s$)/, "") === short || long.replace(/ts$/, "") === short),
    )),
  );
  return reduced.size ? variants.filter(variant => !reduced.has(variant)) : variants;
}

// The English final -cket spelling class has KIT in its lexical stem. The
// upstream IPA-Dict file sometimes selects a schwa alternative for words
// whose paired KIT reading is standard (jacket, packet), and sometimes has
// only that schwa reading (pocket). Correct the class at the source boundary
// so rebuilt stems, transparent -s/-ed/-ing/-less forms, and lexical -ful/-book
// compounds agree with the spelling rule. Keep long Indigenous place names
// such as Mashantucket lexical.
export function preferKitFinalCket(ipa: string, word: string): string {
  const match = /^(.*cket)(s|ed|ing|less|fuls?|books?)?$/i.exec(word);
  if (!match || syllabify(match[1].toLowerCase()).length > 3) return ipa;
  const ending = /books?$/i.test(word) ? /kə(?=tˌ?bʊk(?:s)?$)/
    : /fuls?$/i.test(word) ? /kə(?=tˌ?fʊɫz?$)/
      : /kə(?=t(?:s|ɪd|ɪŋ|ɫəs)?$)/;
  return ipa.replace(ending, "kɪ");
}
