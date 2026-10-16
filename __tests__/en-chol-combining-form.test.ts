import EnglishG2P from "../src/en/g2p";

const engine = new EnglishG2P({ disableDict: true });
it.each(["cholera", "choleric", "cholesterol", "cholestyramine", "choline", "cholic", "cholane", "cholecystectomy", "cholelithic"])("uses the Greek combining-form onset in %s", (word) => {
  expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^k/);
});
it.each(["cholet", "cholewa", "cholla", "chore", "chortle", "chocolate"])("preserves the unrelated affricate in %s", (word) => {
  expect(engine.predict(word)?.replace(/[ˈˌ]/g, "")).toMatch(/^tʃ/);
});
