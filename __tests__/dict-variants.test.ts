import { preferCarefulFinalTs, preferKitFinalCket } from "../scripts/dict-variants";

describe("careful IPA-Dict variants before final -ts", () => {
  it("drops only t-deleted alternatives and preserves stress variants", () => {
    const variants = [
      "ˈpɹɑdʒɛks",
      "ˈpɹɑdʒɛkts",
      "pɹəˈdʒɛks",
      "pɹəˈdʒɛkts",
    ];

    expect(preferCarefulFinalTs(variants, "projects")).toEqual([
      "ˈpɹɑdʒɛkts",
      "pɹəˈdʒɛkts",
    ]);
  });

  it("does not remove a different vowel or stress alternative", () => {
    const variants = ["ˈkɑnfɫɪks", "ˈkɑnfɫɪkts", "kənˈfɫɪks", "kənˈfɫɪkts"];

    expect(preferCarefulFinalTs(variants, "conflicts")).toEqual([
      "ˈkɑnfɫɪkts",
      "kənˈfɫɪkts",
    ]);
  });

  it("restores the full /ts/ coda when the source shortens that exact suffix", () => {
    const variants = ["ɹiˈkwɛs", "ɹiˈkwɛsts", "ɹɪˈkwɛs", "ɹɪˈkwɛsts"];

    expect(preferCarefulFinalTs(variants, "requests")).toEqual([
      "ɹiˈkwɛsts",
      "ɹɪˈkwɛsts",
    ]);
  });

  it("leaves words and variants outside the exact spelling/phone frame unchanged", () => {
    const notFinalTs = ["ˈækt", "ˈæk"];
    const noPairedT = ["ˈfɫeɪvɝɪs", "ˈfɫeɪvɝɪss"];

    expect(preferCarefulFinalTs(notFinalTs, "act")).toBe(notFinalTs);
    expect(preferCarefulFinalTs(noPairedT, "flavorists")).toBe(noPairedT);
  });
});

describe("careful -cket lexical vowel", () => {
  it.each([
    ["jacket", "ˈdʒækət", "ˈdʒækɪt"],
    ["packet", "ˈpækət", "ˈpækɪt"],
    ["pocket", "ˈpɑkət", "ˈpɑkɪt"],
    ["bucket", "ˈbʌkət", "ˈbʌkɪt"],
    ["sprocket", "ˈspɹɑkət", "ˈspɹɑkɪt"],
    ["jackets", "ˈdʒækəts", "ˈdʒækɪts"],
    ["jacketed", "ˈdʒækətɪd", "ˈdʒækɪtɪd"],
    ["jacketing", "ˈdʒækətɪŋ", "ˈdʒækɪtɪŋ"],
    ["ticketless", "ˈtɪkətɫəs", "ˈtɪkɪtɫəs"],
    ["Nantucket", "nænˈtʌkət", "nænˈtʌkɪt"],
    ["pocketful", "ˈpɑkətˌfʊɫ", "ˈpɑkɪtˌfʊɫ"],
    ["pocketfuls", "ˈpɑkətˌfʊɫz", "ˈpɑkɪtˌfʊɫz"],
    ["pocketbook", "ˈpɑkətˌbʊk", "ˈpɑkɪtˌbʊk"],
    ["pocketbooks", "ˈpɑkətˌbʊks", "ˈpɑkɪtˌbʊks"],
  ])("uses KIT for %s", (word, input, expected) => {
    expect(preferKitFinalCket(input, word)).toBe(expected);
  });

  it.each([
    ["bluejacket", "ˈbɫuˌdʒækɪt"],
    ["mashantucket", "ˌmæʃənˈtʌkət"],
    ["basket", "ˈbæskət"],
  ])("leaves non-final -cket environments unchanged for %s", (word, ipa) => {
    expect(preferKitFinalCket(ipa, word)).toBe(ipa);
  });
});
