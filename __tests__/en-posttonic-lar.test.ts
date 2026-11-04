import EnglishG2P from "../src/en/g2p";
import { syllableToIPA } from "../src/en/syllabify";

// Oxford/MW similar and MW basilar attest this weak nucleus independently.
describe.each([false, true])("post-primary i before final lar, rules=%s", (disableDict) => {
  test.each([undefined, "N", "ADJ", "V"])("retains the frame under caller POS %s", (pos) => {
    const engine = new EnglishG2P({ disableDict });
    for (const word of ["similar", "basilar", "vimsilar"])
      expect(engine.predict(word, "en-US", pos)).toMatch(/[ms]əɫɝ$/);
  });

  test("composes a novel verb from its rule-owned root", () => {
    const engine = new EnglishG2P({ disableDict });
    expect(engine.predict("vimsilared", "en-US", "V")).toBe("ˈvɪmsəɫɝd");
    expect(engine.predict("vimsilaring", "en-US", "V")).toBe("ˈvɪmsəɫɝɪŋ");
  });

  test("keeps caller-supplied target readings", () => {
    const engine = new EnglishG2P({ disableDict });
    engine.addPronunciation("vimsilar", "ˈvɪmsɪlɝ");
    expect(engine.predict("vimsilar")).toBe("ˈvɪmsɪlɝ");
  });
});

test("reduces only the owned weak slot, preserving stress and tail boundaries", () => {
  const render = (stressed: boolean, finalTail: boolean, secondary: boolean, previousPrimary: boolean, previous = "si") =>
    syllableToIPA("mi", 1, stressed, false, "lar", undefined, previous, finalTail, "lar", secondary, previous, previousPrimary);
  expect(render(false, true, false, true)).toBe("mə");
  for (const prefix of ["non", "un", "dis", "pre"])
    expect(render(false, true, false, true, prefix)).not.toBe("mə");
  for (const control of [[true, true, false, true], [false, true, true, true], [false, false, false, true], [false, true, false, false]])
    expect(render(control[0], control[1], control[2], control[3])).not.toBe("mə");
});
