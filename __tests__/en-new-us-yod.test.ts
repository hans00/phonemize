import EnG2P from "../src/en/g2p";

describe("AmE/BrE yod in new", () => {
  it("uses the AmE no-yod reading for new without changing its derived controls", () => {
    const enUS = new EnG2P();
    expect(enUS.predict("new", "en-US")).toBe("ˈnu");
    expect(enUS.predict("news", "en-US")).toBe("ˈnuz");
    expect(enUS.predict("newly", "en-US")).toBe("ˈnuɫi");
    expect(enUS.predict("renew", "en-US")).toBe("ɹɪˈnu");
    expect(enUS.predict("newcomer", "en-US")).toBe("ˈnuˌkʌmɝ");
    expect(enUS.predict("newcomers", "en-US")).toBe("ˈnuˌkʌmɝz");
  });

  it("retains British yod through the existing dialect transform", () => {
    const enGB = new EnG2P({ dialect: "en-GB" });
    expect(enGB.predict("new", "en-GB")).toBe("ˈnju");
    expect(enGB.predict("news", "en-GB")).toBe("ˈnjuz");
  });
});
