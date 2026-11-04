import { parityReferences, parityReferencesV3, parityReferencesV4 } from "../scripts/parity-references";

describe("versioned runtime parity reference corrections", () => {
  it("retains the dictionary reading and accepts the Cambridge US KIT reading", () => {
    expect(parityReferences("pocket", "ˈpɑkət")).toEqual(["ˈpɑkət", "ˈpɑkɪt"]);
  });

  it("accepts the correction after it has been applied to the rebuilt dictionary", () => {
    expect(parityReferences("pocket", "ˈpɑkɪt")).toEqual(["ˈpɑkɪt"]);
  });

  it("rejects an unrelated stale source transcription", () => {
    expect(() => parityReferences("pocket", "ˈpɔkət"))
      .toThrow("Parity reference correction does not match dictionary source: pocket");
  });

  it("keeps unrelated dictionary gold unchanged", () => {
    expect(parityReferences("basket", "ˈbæskət")).toEqual(["ˈbæskət"]);
    expect(parityReferences("constructor", "kənˈstɹəktɝ")).toEqual(["kənˈstɹəktɝ"]);
  });
});

test.each([
  ["genuine", "ˌdʒɛnˈjuˌwaɪn", "ˈdʒɛnjuɪn"],
  ["genuinely", "ˌdʒɛnˈjuˌwaɪnɫi", "ˈdʒɛnjuɪnɫi"],
])("v3 preserves both source readings for %s across rebuilds", (word, oldReading, newReading) => {
  expect(parityReferencesV3(word, oldReading)).toEqual([oldReading, newReading]);
  expect(parityReferencesV3(word, newReading)).toEqual([oldReading, newReading]);
  expect(() => parityReferencesV3(word, "unexpected")).toThrow("variant does not match dictionary source");
  expect(parityReferences(word, oldReading)).toEqual([oldReading]);
});

test("v3 retains the v2 correction rules for unrelated words", () => {
  expect(parityReferencesV3("pocket", "ˈpɑkət")).toEqual(parityReferences("pocket", "ˈpɑkət"));
  expect(parityReferencesV3("constructor", "kənˈstɹəktɝ")).toEqual(["kənˈstɹəktɝ"]);
});

test.each([
  ["resign", "ɹiˈsaɪn", "ɹɪˈzaɪn"],
  ["resort", "ɹiˈsɔɹt", "ɹɪˈzɔɹt"],
])("v4 compares old and corrected references for %s", (word, oldReading, newReading) => {
  expect(parityReferencesV4(word, oldReading)).toEqual([oldReading, newReading]);
  expect(parityReferencesV4(word, newReading)).toEqual([oldReading, newReading]);
  expect(() => parityReferencesV4(word, "unexpected")).toThrow("variant does not match dictionary source");
  expect(parityReferencesV3(word, oldReading)).toEqual([oldReading]);
});

test("v4 retains v3 and v2 references", () => {
  expect(parityReferencesV4("genuine", "ˌdʒɛnˈjuˌwaɪn")).toEqual(parityReferencesV3("genuine", "ˌdʒɛnˈjuˌwaɪn"));
  expect(parityReferencesV4("pocket", "ˈpɑkət")).toEqual(parityReferences("pocket", "ˈpɑkət"));
});
