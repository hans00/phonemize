import EnglishG2P from "../src/en/g2p";
import { parseIpa } from "../scripts/context-ipa";
import { createPhonemizer } from "../src/core";
test.each([false, true])("retains a closed rhotic root and split s voicing (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const w of ["absorb", "absorbs", "absorbed", "absorbing", "absorbable", "absorbent", "absorbency"]) delete dictionary[w];
 Reflect.set(e, "dictionary", dictionary);
 for (const [word, ipa] of [["absorb", "əbˈzɔɹb"], ["absorbs", "əbˈzɔɹbz"], ["absorbed", "əbˈzɔɹbd"], ["absorbing", "əbˈzɔɹbɪŋ"], ["absorbable", "əbˈzɔɹbəbəl"], ["absorbent", "əbˈzɔɹbənt"], ["absorbency", "əbˈzɔɹbənsi"]]) expect(parseIpa(e.predict(word)!)).toEqual(parseIpa(ipa));
 for (const w of ["absent", "absinthe", "absolute", "absorption", "absurd"]) expect(e.predict(w)).toContain("s");
 expect(e.predict("abject")).toBe("ˈæbdʒɛkt");
 expect(e.predict("abortion")).toContain("ʃ");
 const api = createPhonemizer({ processors: [e] });
 for (const sentence of ["They absorb the light.", "The absorbent cloth was dry.", "The absorbency was high."]) expect(api.phonemize(sentence, { language: "en-US", returnArray: true }).find(t => /^absorb/.test(t.word))?.phoneme).toContain("zɔɹb");
});
test("keeps explicit root ownership and an unseen rhotic-stop root", () => {
 const e = new EnglishG2P({ disableDict: true });
 expect(e.predict("abglorb")).toMatch(/ˈɡ[ɫl]ɔɹb$/);
 expect(e.predict("abglorbs")).toMatch(/ˈɡ[ɫl]ɔɹbz$/);
 e.addPronunciation("absorb", "ˈɑbsɔɹb");
 expect(e.predict("absorb")).toBe("ˈɑbsɔɹb");
 expect(e.predict("absorbs")).toBe("ˈɑbsɔɹbz");
 expect(e.predict("absorbed")).toBe("ˈɑbsɔɹbd");
});
test.each([false, true])("retains a prefixed root in combining-o derivatives (rules=%s)", disableDict => {
 const e = new EnglishG2P({ disableDict }), dictionary = { ...Reflect.get(e, "dictionary") };
 for (const word of ["absorb", "absorbed", "absorbing", "absorbable", "bioabsorb", "bioabsorbable", "bioabsorbed", "bioabsorbing", "reabsorb", "reabsorbed", "nonabsorbable"]) delete dictionary[word];
 Reflect.set(e, "dictionary", dictionary);
 for (const word of ["bioabsorb", "bioabsorbable", "bioabsorbed", "bioabsorbing", "reabsorb", "reabsorbed", "nonabsorbable"]) expect(e.predict(word)).toMatch(/əbˈzɔɹb/);
 const api = createPhonemizer({ processors: [e] });
 expect(api.phonemize("It is a bioabsorbable stent.", { language: "en-US", returnArray: true }).find(t => t.word === "bioabsorbable")?.phoneme).toMatch(/əbˈzɔɹb/);
});
