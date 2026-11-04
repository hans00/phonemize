import EnglishG2P from "../src/en/g2p";

describe("compatible recursive compound forest", () => {
  const engine = new EnglishG2P({ disableDict: true });
  test("preserves both castaway boundaries and whole-word rendering", () => {
    const forest = engine.analyzeWordForest("castaway");
    expect(forest.status).toBe("complete");
    expect(forest.analysis).toEqual(engine.analyzeWord("castaway"));
    expect(forest.nodes.filter(n => n.kind === "compound")).toHaveLength(2);
    expect(forest.nodes.some(n => n.kind === "whole" && n.start === 0 && n.end === 8 && n.origin === "direct-rules")).toBe(true);
    expect(Object.isFrozen(forest.nodes)).toBe(true);
  });
  test.each(["upperclassmen", "underclassmen"])("retains nested structure and explicitly projects secondary stress: %s", word => {
    const forest = engine.analyzeWordForest(word);
    expect(forest.status).toBe("complete");
    expect(forest.nodes.some(n => n.kind === "compound" && n.start === 5 && n.end === 13)).toBe(true);
    const projection = forest.nodes.find(n => n.kind === "secondary-projection");
    expect(projection).toBeDefined();
    if (projection?.kind === "secondary-projection") {
      const source = forest.nodes[projection.source];
      expect(source.componentIpa?.replace(/ˌ/g, "")).toBe(projection.componentIpa);
      expect(source.componentIpa).not.toBe(projection.componentIpa);
    }
    for (const node of forest.nodes) {
      if (node.kind === "choice" && node.componentIpa !== null)
        for (const id of node.alternatives) expect(forest.nodes[id].componentIpa).toBe(node.componentIpa);
      if (node.kind === "compound") {
        expect(forest.nodes[node.left].start).toBe(node.start);
        expect(forest.nodes[node.left].end).toBe(forest.nodes[node.right].start);
        expect(forest.nodes[node.right].end).toBe(node.end);
      }
      const edges = node.kind === "choice" ? node.alternatives : node.kind === "compound" ? [node.left, node.right] : node.kind === "secondary-projection" ? [node.source] : [];
      for (const id of edges) expect(id).toBeLessThan(node.id);
    }
  });
  test("retains the contextual component instead of the free head reading", () => {
    const forest = engine.analyzeWordForest("automotive");
    const compound = forest.nodes.find(n => n.kind === "compound");
    expect(compound).toBeDefined();
    if (compound?.kind === "compound") expect(forest.nodes[compound.left].componentIpa).toBe("ˈɔtə");
    expect(forest.analysis.actual.ipa).toBe(engine.predict("automotive"));
  });
  test("exposes whole-word dispatch guards and unsupported inputs", () => {
    const guarded = engine.analyzeWordForest("inquire");
    expect(guarded.guardedSpans).toBe(1);
    expect(guarded.nodes.some(n => n.kind === "compound")).toBe(false);
    expect(engine.analyzeWordForest("O’Reilly")).toMatchObject({ status: "unsupported", root: null, nodes: [] });
  });
  test("a bounded partial search cannot report complete analysis", () => {
    expect(engine.analyzeWordForest("upperclassmen", 1)).toMatchObject({ status: "truncated", root: null });
    expect(() => engine.analyzeWordForest("upperclassmen", 0)).toThrow(RangeError);
    expect(() => engine.analyzeWordForest("upperclassmen", 1.5)).toThrow(RangeError);
  });
});
