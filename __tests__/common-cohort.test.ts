import correctedCohort71 = require("../scripts/common-cohort-v71.json");
import correctedCohort72 = require("../scripts/common-cohort-v72.json");
import correctedCohort73 = require("../scripts/common-cohort-v73.json");
import correctedCohort74 = require("../scripts/common-cohort-v74.json");
import correctedCohort75 = require("../scripts/common-cohort-v75.json");
import correctedCohort76 = require("../scripts/common-cohort-v76.json");
import correctedCohort77 = require("../scripts/common-cohort-v77.json");
import correctedCohort78 = require("../scripts/common-cohort-v78.json");
import correctedCohort79 = require("../scripts/common-cohort-v79.json");
import correctedCohort80 = require("../scripts/common-cohort-v80.json");
import correctedCohort81 = require("../scripts/common-cohort-v81.json");
import correctedCohort82 = require("../scripts/common-cohort-v82.json");
import correctedCohort83 = require("../scripts/common-cohort-v83.json");
import correctedCohort84 = require("../scripts/common-cohort-v84.json");
import correctedCohort85 = require("../scripts/common-cohort-v85.json");
import correctedCohort86 = require("../scripts/common-cohort-v86.json");
import correctedCohort87 = require("../scripts/common-cohort-v87.json");
import correctedCohort88 = require("../scripts/common-cohort-v88.json");
import correctedCohort89 = require("../scripts/common-cohort-v89.json");
import correctedCohort70 = require("../scripts/common-cohort-v70.json");
import correctedCohort69 = require("../scripts/common-cohort-v69.json");
import correctedCohort68 = require("../scripts/common-cohort-v68.json");
import cohort = require("../scripts/common-cohort.json");
import priorCohort = require("../scripts/common-cohort-v4.json");
import priorCurrentCohort5 = require("../scripts/common-cohort-v5.json");
import priorCurrentCohort6 = require("../scripts/common-cohort-v6.json");
import priorCurrentCohort7 = require("../scripts/common-cohort-v7.json");
import priorCurrentCohort8 = require("../scripts/common-cohort-v8.json");
import priorCurrentCohort9 = require("../scripts/common-cohort-v9.json");
import priorCurrentCohort10 = require("../scripts/common-cohort-v10.json");
import previousCurrentCohort = require("../scripts/common-cohort-v11.json");
import previousCurrentCohort12 = require("../scripts/common-cohort-v12.json");
import previousCurrentCohort13 = require("../scripts/common-cohort-v13.json");
import previousCurrentCohort14 = require("../scripts/common-cohort-v14.json");
import previousCurrentCohort15 = require("../scripts/common-cohort-v15.json");
import previousCurrentCohort16 = require("../scripts/common-cohort-v16.json");
import previousCurrentCohort17 = require("../scripts/common-cohort-v17.json");
import previousCurrentCohort20 = require("../scripts/common-cohort-v20.json");
import previousCurrentCohort21 = require("../scripts/common-cohort-v21.json");
import previousCurrentCohort24 = require("../scripts/common-cohort-v24.json");
import previousCurrentCohort25 = require("../scripts/common-cohort-v25.json");
import previousCurrentCohort26 = require("../scripts/common-cohort-v26.json");
import previousCurrentCohort27 = require("../scripts/common-cohort-v27.json");
import previousCurrentCohort28 = require("../scripts/common-cohort-v28.json");
import previousCurrentCohort29 = require("../scripts/common-cohort-v29.json");
import previousCurrentCohort30 = require("../scripts/common-cohort-v30.json");
import previousCurrentCohort31 = require("../scripts/common-cohort-v31.json");
import priorCurrentCohort34 = require("../scripts/common-cohort-v34.json");
import previousCurrentCohort36 = require("../scripts/common-cohort-v36.json");
import previousCurrentCohort37 = require("../scripts/common-cohort-v37.json");
import previousCurrentCohort38 = require("../scripts/common-cohort-v38.json");
import previousCurrentCohort39 = require("../scripts/common-cohort-v39.json");
import previousCurrentCohort41 = require("../scripts/common-cohort-v41.json");
import previousCurrentCohort44 = require("../scripts/common-cohort-v44.json");
import previousCurrentCohort45 = require("../scripts/common-cohort-v45.json");
import previousCurrentCohort46 = require("../scripts/common-cohort-v46.json");
import previousCurrentCohort47 = require("../scripts/common-cohort-v47.json");
import previousCurrentCohort54 = require("../scripts/common-cohort-v54.json");
import previousCurrentCohort55 = require("../scripts/common-cohort-v55.json");
import previousCurrentCohort65 = require("../scripts/common-cohort-v65.json");
import previousCurrentCohort66 = require("../scripts/common-cohort-v66.json");
import currentCohort = require("../scripts/common-cohort-v67.json");
import EnglishG2P from "../src/en/g2p";
import { commonAcceptedVariants, commonGold, commonGoldVariants, commonReferenceContract, commonReferences, commonVariantSources } from "../scripts/common-cohort-gold";

describe("fixed English common-word cohort", () => {
  it("accepts the independently sourced US patent variant without changing the population", () => {
    expect(correctedCohort85.referenceVersion).toBe("common-cohort-v85");
    expect(correctedCohort85.supersedes).toBe("common-cohort-v84.json");
    expect(correctedCohort85.words).toEqual(correctedCohort84.words);
    expect(correctedCohort85.top5000).toEqual(correctedCohort84.top5000);
    expect(correctedCohort85.references).toEqual(correctedCohort84.references);
    expect(correctedCohort85.acceptedVariants.patent).toContain("ˈpeɪtənt");
    expect(correctedCohort85.variantSources.patent).toBe("https://dictionary.cambridge.org/us/dictionary/english/patent");
    expect(commonGoldVariants("patent")).toEqual(["ˈpætənt", "ˈpeɪtənt"]);
    expect(new EnglishG2P({ disableDict: true }).predict("patent", "en-US")).toBe("ˈpeɪtənt");
  });

  it("accepts five Cambridge US variants on the unchanged v86 cohort", () => {
    expect(correctedCohort86.referenceVersion).toBe("common-cohort-v86");
    expect(correctedCohort86.supersedes).toBe("common-cohort-v85.json");
    expect(correctedCohort86.words).toEqual(correctedCohort85.words);
    expect(correctedCohort86.top5000).toEqual(correctedCohort85.top5000);
    expect(correctedCohort86.references).toEqual(correctedCohort85.references);
    expect(correctedCohort86.acceptedVariants.knowledge).toContain("ˈnɑɫɪdʒ");
    expect(correctedCohort86.acceptedVariants.plaintiff).toContain("ˈpɫeɪntɪf");
    expect(correctedCohort86.acceptedVariants.eternal).toContain("ɪˈtɝnəɫ");
    expect(correctedCohort86.acceptedVariants.quantitative).toContain("ˈkwɑntəˌteɪtɪv");
    expect(correctedCohort86.acceptedVariants.narrative).toContain("ˈnɛɹətɪv");
    expect(correctedCohort86.referenceVersion).toBe("common-cohort-v86");
  });

  it("adds Cambridge replace-family variants without changing the v86 population", () => {
    expect(correctedCohort87.referenceVersion).toBe("common-cohort-v87");
    expect(correctedCohort87.supersedes).toBe("common-cohort-v86.json");
    expect(correctedCohort87.words).toEqual(correctedCohort86.words);
    expect(correctedCohort87.top5000).toEqual(correctedCohort86.top5000);
    expect(correctedCohort87.references).toEqual(correctedCohort86.references);
    expect(correctedCohort87.acceptedVariants.replace).toContain("ɹɪˈpɫeɪs");
    expect(correctedCohort87.acceptedVariants.replaced).toContain("ɹɪˈpɫeɪst");
    expect(correctedCohort87.variantSources.replace).toBe("https://dictionary.cambridge.org/us/pronunciation/english/replace");
    expect(correctedCohort87.variantSources.replaced).toBe("https://dictionary.cambridge.org/us/dictionary/english/replaced");
    expect(correctedCohort87.referenceVersion).toBe("common-cohort-v87");
  });

  it("accepts Cambridge loanword variants without changing the v87 population", () => {
    expect(correctedCohort88.referenceVersion).toBe("common-cohort-v88");
    expect(correctedCohort88.supersedes).toBe("common-cohort-v87.json");
    expect(correctedCohort88.words).toEqual(correctedCohort87.words);
    expect(correctedCohort88.top5000).toEqual(correctedCohort87.top5000);
    expect(correctedCohort88.references).toEqual(correctedCohort87.references);
    expect(correctedCohort88.acceptedVariants.anime).toContain("ˈænəmeɪ");
    expect(correctedCohort88.acceptedVariants.lingerie).toContain("ˌɫɑnʒəˈɹeɪ");
    expect(correctedCohort88.variantSources.anime).toBe("https://dictionary.cambridge.org/us/pronunciation/english/anime");
    expect(correctedCohort88.variantSources.lingerie).toBe("https://dictionary.cambridge.org/us/pronunciation/english/lingerie");
    expect(correctedCohort88.referenceVersion).toBe("common-cohort-v88");
  });

  it("adds Cambridge US tsunami while preserving fixed cohort populations", () => {
    expect(correctedCohort89.referenceVersion).toBe("common-cohort-v89");
    expect(correctedCohort89.supersedes).toBe("common-cohort-v88.json");
    expect(correctedCohort89.words).toEqual(correctedCohort88.words);
    expect(correctedCohort89.top5000).toEqual(correctedCohort88.top5000);
    expect(correctedCohort89.references).toEqual(correctedCohort88.references);
    expect(correctedCohort89.acceptedVariants.tsunami).toContain("tsuˈnɑmi");
    expect(correctedCohort89.variantSources.tsunami).toBe("https://dictionary.cambridge.org/us/pronunciation/english/tsunami");
    expect(correctedCohort89.provenance.before).toEqual([6039, 6595, 3303, 3497]);
    expect(correctedCohort89.provenance.after).toEqual([6039, 6596, 3303, 3497]);
    expect(commonReferenceContract.version).toBe("common-cohort-v89");
  });

  it("records the v86 reference-only and runtime deltas against frozen snapshots", () => {
    const baseline = require("../scripts/eval-common-baseline-v86.json");
    expect(baseline.referenceVersion).toBe(correctedCohort86.referenceVersion);
    expect(baseline.referenceSha256).toBe(correctedCohort86.referenceSha256);
    expect(baseline.full.n).toBe(6990);
    expect(baseline.top5000.n).toBe(3617);
    expect(baseline.provenance.before).toEqual([5969, 6538, 3264, 3466]);
    expect(baseline.provenance.after).toEqual([5972, 6538, 3266, 3466]);
    expect(baseline.provenance.runtimeChanges).toBe(3);
    expect(baseline.provenance.changedPredictions).toEqual([
      { word: "minister", before: "ˈmɪnɪstɝ", after: "ˈmɪnəstɝ" },
      { word: "diamond", before: "daɪˈæmənd", after: "ˈdaɪmənd" },
      { word: "narrative", before: "ˈnɑɹətɪv", after: "ˈnɛɹətɪv" },
    ]);
    expect(baseline.provenance.beforeSnapshotSha256).toBe("c31a3278ddc302a1f00cdf5849352638e24e5ee8ece79ef1100da1916ecbabcf");
    expect(baseline.provenance.afterSnapshotSha256).toBe("aa2bd041b85b59897cc8f56a2b9a604bc8a74a0f4c518afb366e95af6de8dca1");
  });

  it("re-scores the unchanged patent prediction in the frozen v84 snapshot", () => {
    const baseline = require("../scripts/eval-common-baseline-v85.json");
    expect(baseline.referenceVersion).toBe(correctedCohort85.referenceVersion);
    expect(baseline.referenceSha256).toBe(correctedCohort85.referenceSha256);
    expect(baseline.full.n).toBe(correctedCohort85.n);
    expect(baseline.top5000.n).toBe(correctedCohort85.topN);
    expect(baseline.provenance.before).toEqual([5865, 6482, 3187, 3420]);
    expect(baseline.provenance.after).toEqual([5866, 6483, 3188, 3421]);
    expect(baseline.provenance.runtimeChanges).toBe(0);
  });

  it("keeps the ranked population stable when dictionary references add forms", () => {
    expect(cohort.n).toBe(6990);
    expect(cohort.topN).toBe(3617);
    expect(cohort.words).toHaveLength(6990);
    expect(new Set(cohort.words).size).toBe(6990);
    expect(cohort.top5000).toHaveLength(3617);
    expect(new Set(cohort.top5000).size).toBe(3617);
    expect(cohort.top5000.every(word => cohort.words.includes(word))).toBe(true);
    expect(cohort.words.every(word => commonReferences[word])).toBe(true);
    expect(Object.keys(commonReferences)).toHaveLength(6990);
    expect(cohort.words).toContain("production");
    expect(cohort.words).not.toContain("productions");
  });

  it("uses only own reference entries before falling back to the dictionary", () => {
    expect(commonGold("constructor", "ˈkənˌstɹʌktɝ")).toBe("ˈkənˌstɹʌktɝ");
    expect(commonGold("production", "fallback")).toBe(commonReferences.production);
  });

  it("pins authoritative v3 US readings without changing the fixed populations", () => {
    expect(priorCohort.referenceVersion).toBe("common-cohort-v4");
    expect(priorCohort.supersedes).toBe("common-cohort-v3");
    expect(priorCurrentCohort5.referenceVersion).toBe("common-cohort-v5");
    expect(priorCurrentCohort6.referenceVersion).toBe("common-cohort-v6");
    expect(priorCurrentCohort6.supersedes).toBe("common-cohort-v5");
    expect(priorCurrentCohort7.referenceVersion).toBe("common-cohort-v7");
    expect(priorCurrentCohort7.supersedes).toBe("common-cohort-v6");
    expect(priorCurrentCohort8.referenceVersion).toBe("common-cohort-v8");
    expect(priorCurrentCohort9.referenceVersion).toBe("common-cohort-v9");
    expect(priorCurrentCohort10.referenceVersion).toBe("common-cohort-v10");
    expect(previousCurrentCohort.referenceVersion).toBe("common-cohort-v11");
    expect(previousCurrentCohort12.referenceVersion).toBe("common-cohort-v12");
    expect(previousCurrentCohort13.referenceVersion).toBe("common-cohort-v13");
    expect(previousCurrentCohort14.referenceVersion).toBe("common-cohort-v14");
    expect(previousCurrentCohort15.referenceVersion).toBe("common-cohort-v15");
    expect(previousCurrentCohort16.referenceVersion).toBe("common-cohort-v16");
    expect(previousCurrentCohort17.referenceVersion).toBe("common-cohort-v17");
    expect(previousCurrentCohort20.referenceVersion).toBe("common-cohort-v20");
    expect(previousCurrentCohort21.referenceVersion).toBe("common-cohort-v21");
    expect(previousCurrentCohort24.referenceVersion).toBe("common-cohort-v24");
    expect(previousCurrentCohort25.referenceVersion).toBe("common-cohort-v25");
    expect(previousCurrentCohort26.referenceVersion).toBe("common-cohort-v26");
    expect(previousCurrentCohort26.supersedes).toBe("common-cohort-v25.json");
    expect(previousCurrentCohort27.referenceVersion).toBe("common-cohort-v27");
    expect(previousCurrentCohort28.referenceVersion).toBe("common-cohort-v28");
    expect(previousCurrentCohort30.referenceVersion).toBe("common-cohort-v30");
    expect(previousCurrentCohort31.referenceVersion).toBe("common-cohort-v31");
    expect(priorCurrentCohort34.referenceVersion).toBe("common-cohort-v34");
    expect(previousCurrentCohort36.referenceVersion).toBe("common-cohort-v36");
    expect(previousCurrentCohort36.supersedes).toBe("common-cohort-v35.json");
    expect(previousCurrentCohort37.referenceVersion).toBe("common-cohort-v37");
    expect(previousCurrentCohort38.referenceVersion).toBe("common-cohort-v38");
    expect(previousCurrentCohort39.referenceVersion).toBe("common-cohort-v39");
    expect(previousCurrentCohort41.referenceVersion).toBe("common-cohort-v41");
    expect(previousCurrentCohort41.supersedes).toBe("common-cohort-v40.json");
    expect(previousCurrentCohort54.referenceVersion).toBe("common-cohort-v54");
    expect(previousCurrentCohort55.referenceVersion).toBe("common-cohort-v55");
    expect(previousCurrentCohort55.supersedes).toBe("common-cohort-v54.json");
    expect(currentCohort.referenceVersion).toBe("common-cohort-v67");
    expect(currentCohort.supersedes).toBe("common-cohort-v66.json");
    expect(currentCohort.n).toBe(previousCurrentCohort65.n);
    expect(currentCohort.topN).toBe(previousCurrentCohort65.topN);
    expect(currentCohort.words).toEqual(previousCurrentCohort65.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort65.top5000);
    expect(currentCohort.references).toEqual(previousCurrentCohort65.references);
    expect(currentCohort.referenceSnapshotSha256).toBe(previousCurrentCohort65.referenceSnapshotSha256);
    expect(currentCohort.references).toEqual(previousCurrentCohort66.references);
    expect(currentCohort.referenceSnapshotSha256).toBe(previousCurrentCohort66.referenceSnapshotSha256);
    expect(Object.keys(currentCohort.acceptedVariants)).toHaveLength(Object.keys(previousCurrentCohort66.acceptedVariants).length + 1);
    for (const word of Object.keys(previousCurrentCohort66.acceptedVariants)) {
      expect(currentCohort.acceptedVariants[word as keyof typeof currentCohort.acceptedVariants])
        .toEqual(previousCurrentCohort66.acceptedVariants[word as keyof typeof previousCurrentCohort66.acceptedVariants]);
      expect(currentCohort.variantSources[word as keyof typeof currentCohort.variantSources])
        .toBe(previousCurrentCohort66.variantSources[word as keyof typeof previousCurrentCohort66.variantSources]);
    }
    for (const word of currentCohort.words) {
      expect(currentCohort.references[word as keyof typeof currentCohort.references])
        .toBe(previousCurrentCohort55.references[word as keyof typeof previousCurrentCohort55.references]);
    }
    expect(currentCohort.acceptedVariants.calvin).toEqual(["ˈkæɫvɪn"]);
    expect(currentCohort.acceptedVariants.justin).toEqual(["ˈdʒʌstɪn"]);
    expect(currentCohort.variantSources.calvin).toContain("dictionary.cambridge.org");
    expect(currentCohort.variantSources.justin).toContain("dictionary.cambridge.org");
    expect(currentCohort.acceptedVariants.anybody).toEqual(["ˈɛniˌbɑdi"]);
    expect(currentCohort.variantSources.anybody).toBe("https://dictionary.cambridge.org/pronunciation/english/anybody");
    expect(currentCohort.acceptedVariants.repairs).toEqual(["ɹɪˈpɛɹz"]);
    expect(currentCohort.variantSources.repairs).toBe("https://dictionary.cambridge.org/us/dictionary/english/repair");
    expect(commonGoldVariants("repairs")).toEqual(["ɹiˈpɛɹz", "ɹɪˈpɛɹz"]);
    expect(new EnglishG2P({ disableDict: true }).predict("repairs", "en-US")).toBe("ɹɪˈpɛɹz");
    expect(currentCohort.acceptedVariants.western).toEqual(["ˈwɛstɝn"]);
    expect(currentCohort.variantSources.western).toContain("dictionary.cambridge.org");
    expect(commonGoldVariants("indicates")).toEqual(["ˈɪndɪˌkeɪts", "ˈɪndəˌkeɪts"]);
    expect(commonGoldVariants("anybody")).toEqual(["ˈɛnibədi", "ˈɛniˌbɑdi"]);
    expect(commonVariantSources.indicates).toBe("https://dictionary.cambridge.org/pronunciation/english/indicate");
    expect(commonGoldVariants("entities")).toEqual(["ˈɛntɪtiz", "ˈɛntətiz"]);
    expect(commonVariantSources.entities).toBe("https://dictionary.cambridge.org/us/pronunciation/english/entity");
    expect(commonGoldVariants("ministry")).toEqual(["ˈmɪnəstɹi", "ˈmɪnɪstɹi"]);
    expect(commonGoldVariants("ministries")).toEqual(["ˈmɪnɪstɹiz", "ˈmɪnəstɹiz"]);
    expect(commonVariantSources.ministry).toBe("https://dictionary.cambridge.org/us/dictionary/english/ministry");
    expect(commonVariantSources.ministries).toBe("https://dictionary.cambridge.org/us/pronunciation/english/ministry");
    expect(currentCohort.acceptedVariants.satisfaction).toEqual(["ˌsætɪsˈfækʃən"]);
    expect(currentCohort.variantSources.satisfaction).toBe("https://dictionary.cambridge.org/pronunciation/english/satisfaction");
    expect(currentCohort.acceptedVariants.via).toEqual(["ˈviə"]);
    expect(currentCohort.variantSources.via).toBe("https://dictionary.cambridge.org/us/pronunciation/english/via");
    expect(commonGoldVariants("via")).toEqual(["ˈvaɪə", "ˈviə"]);
    expect(new EnglishG2P({ disableDict: true }).predict("via", "en-US")).toBe("ˈviə");
    expect(currentCohort.acceptedVariants.perfect).toEqual(["ˈpɝfɛkt"]);
    expect(currentCohort.variantSources.perfect).toBe("https://dictionary.cambridge.org/us/dictionary/english/perfect");
    expect(new EnglishG2P({ disableDict: true }).predict("perfect", "en-US")).toBe("ˈpɝfɛkt");
    expect(currentCohort.acceptedVariants.wind).toEqual(["ˈwaɪnd"]);
    expect(currentCohort.variantSources.wind).toBe("https://dictionary.cambridge.org/pronunciation/english/wind");
    expect(new EnglishG2P({ disableDict: true }).predict("wind", "en-US")).toBe("ˈwaɪnd");
    expect(currentCohort.acceptedVariants.ensure).toEqual(["ɪnˈʃʊɹ"]);
    expect(currentCohort.variantSources.ensure).toBe("https://dictionary.cambridge.org/us/pronunciation/english/ensure");
    expect(new EnglishG2P({ disableDict: true }).predict("ensure", "en-US")).toBe("ɪnˈʃʊɹ");
    const checkedAlternates = [
      ["graduate", "ˈɡɹædʒueɪt", "https://dictionary.cambridge.org/pronunciation/english/graduate"],
      ["attribute", "ˈætɹɪbjut", "https://dictionary.cambridge.org/us/pronunciation/english/attribute"],
      ["decrease", "dɪˈkɹis", "https://dictionary.cambridge.org/us/pronunciation/english/decrease"],
      ["combine", "kəmˈbaɪn", "https://dictionary.cambridge.org/us/pronunciation/english/combine"],
      ["compound", "kəmˈpaʊnd", "https://dictionary.cambridge.org/pronunciation/english/compound"],
      ["extract", "ɪksˈtɹækt", "https://dictionary.cambridge.org/us/pronunciation/english/extract"],
      ["desert", "dɪˈzɝt", "https://dictionary.cambridge.org/us/pronunciation/english/desert"],
      ["winds", "ˈwɪndz", "https://dictionary.cambridge.org/pronunciation/english/wind"],
      ["invalid", "ɪnˈvæɫɪd", "https://dictionary.cambridge.org/us/pronunciation/english/invalid"],
      ["tube", "ˈtub", "https://dictionary.cambridge.org/us/pronunciation/english/tube"],
      ["knew", "ˈnu", "https://dictionary.cambridge.org/us/pronunciation/english/knew"],
      ["kept", "ˈkɛpt", "https://dictionary.cambridge.org/pronunciation/english/kept"],
      ["extreme", "ɪksˈtɹim", "https://dictionary.cambridge.org/pronunciation/english/extreme"],
      ["debate", "dɪˈbeɪt", "https://dictionary.cambridge.org/us/pronunciation/english/debate"],
      ["leads", "ˈɫɛdz", "https://dictionary.cambridge.org/us/pronunciation/english/leads"],
    ] as const;
    const stripCommonStress = (ipa: string) => ipa.replace(/[ˈˌ]/g, "").replace(/ʌ/g, "ə");
    const g2p = new EnglishG2P({ disableDict: true });
    for (const [word, ipa, source] of checkedAlternates) {
      expect(commonGoldVariants(word)).toContain(ipa);
      expect(commonVariantSources[word]).toBe(source);
      expect(stripCommonStress(g2p.predict(word, "en-US")!)).toBe(stripCommonStress(ipa));
    }
    expect(currentCohort.acceptedVariants.specific).toEqual(["spɪˈsɪfɪk"]);
    expect(currentCohort.variantSources.specific).toBe("https://dictionary.cambridge.org/us/dictionary/english/specific");
    expect(commonGoldVariants("specific")).toEqual(["spəˈsɪfɪk", "spɪˈsɪfɪk"]);
    expect(new EnglishG2P({ disableDict: true }).predict("specific", "en-US")).toBe("spɪˈsɪfɪk");
    expect(currentCohort.acceptedVariants.anti).toEqual(["ˈænti"]);
    expect(currentCohort.acceptedVariants.palm).toEqual(["ˈpɑm"]);
    expect(currentCohort.variantSources.anti).toBe("https://dictionary.cambridge.org/us/dictionary/english/anti");
    expect(commonGoldVariants("anti")).toEqual(["ˈænˌtaɪ", "ˈænti"]);
    expect(new EnglishG2P({ disableDict: true }).predict("anti", "en-US")).toBe("ˈænti");
    expect(currentCohort.acceptedVariants.exhibition).toEqual(["ˌɛksɪˈbɪʃən"]);
    expect(currentCohort.variantSources.exhibition).toBe("https://www.collinsdictionary.com/dictionary/english-pronunciations/exhibition");
    expect(currentCohort.acceptedVariants.extraction).toEqual(["ɪkˈstɹækʃən"]);
    expect(currentCohort.variantSources.extraction).toBe("https://dictionary.cambridge.org/us/pronunciation/english/extraction");
    expect(currentCohort.acceptedVariants.reliable).toEqual(["ɹɪˈɫaɪəbəɫ"]);
    expect(currentCohort.variantSources.reliable).toBe("https://dictionary.cambridge.org/us/pronunciation/english/reliable");
    expect(currentCohort.acceptedVariants.renewable).toEqual(["ɹɪˈnuəbəɫ"]);
    expect(currentCohort.variantSources.renewable).toBe("https://dictionary.cambridge.org/us/pronunciation/english/renewable");
    expect(currentCohort.acceptedVariants.territory).toEqual(["ˈtɛɹəˌtɔɹi"]);
    expect(currentCohort.variantSources.territory).toBe("https://dictionary.cambridge.org/us/pronunciation/english/territory");
    expect(currentCohort.acceptedVariants.satisfactory).toEqual(["ˌsætɪsˈfæktɝi"]);
    expect(currentCohort.variantSources.satisfactory).toBe("https://dictionary.cambridge.org/us/pronunciation/english/satisfactory");
    expect(currentCohort.words).toEqual(previousCurrentCohort47.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort47.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort46.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort46.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort39.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort39.top5000);
    expect(commonGoldVariants("rapid")).toEqual(["ˈɹæpəd", "ˈɹæpɪd"]);
    expect(commonGoldVariants("stupid")).toEqual(["ˈstupəd", "ˈstupɪd"]);
    expect(commonGoldVariants("liquid")).toEqual(["ˈɫɪkwəd", "ˈɫɪkwɪd"]);
    expect(commonGoldVariants("engineer")).toEqual(["ˌɛndʒəˈnɪɹ", "ˌɛndʒɪˈnɪɹ"]);
    expect(commonGoldVariants("philosophy")).toEqual(["fəˈɫɑsəfi", "fɪˈɫɑsəfi"]);
    expect(commonGoldVariants("consequences")).toEqual(["ˈkɑnsəˌkwɛnsəz", "ˈkɑnsəkwənsəz"]);
    expect(commonGoldVariants("consequently")).toEqual(["ˈkɑnsəˌkwɛntɫi", "ˈkɑnsəkwəntɫi"]);
    expect(commonVariantSources.rapid).toBe("https://dictionary.cambridge.org/us/pronunciation/english/rapid");
    expect(commonVariantSources.stupid).toBe("https://dictionary.cambridge.org/us/pronunciation/english/stupid");
    expect(commonVariantSources.liquid).toBe("https://dictionary.cambridge.org/us/pronunciation/english/liquid");
    expect(commonVariantSources.engineer).toBe("https://dictionary.cambridge.org/us/pronunciation/english/engineer");
    expect(commonVariantSources.philosophy).toBe("https://dictionary.cambridge.org/us/pronunciation/english/philosophy");
    expect(commonVariantSources.consequences).toBe("https://dictionary.cambridge.org/us/pronunciation/english/consequence");
    expect(commonVariantSources.consequently).toBe("https://dictionary.cambridge.org/us/pronunciation/english/consequently");
    expect(currentCohort.words).toEqual(priorCurrentCohort34.words);
    expect(currentCohort.top5000).toEqual(priorCurrentCohort34.top5000);
    expect(commonGoldVariants("orbit")).toEqual(["ˈɔɹbət", "ˈɔɹbɪt"]);
    expect(commonVariantSources.orbit).toBe("https://dictionary.cambridge.org/us/pronunciation/english/orbit");
    expect(commonGoldVariants("enclosed")).toEqual(["ɛnˈkɫoʊzd", "ɪnˈkɫoʊzd"]);
    expect(commonVariantSources.enclosed).toBe("https://dictionary.cambridge.org/us/dictionary/english/enclosed");
    expect(commonGoldVariants("frequent")).toEqual(["ˈfɹiˌkwɛnt", "ˈfɹikwənt"]);
    expect(commonVariantSources.frequent).toBe("https://dictionary.cambridge.org/us/pronunciation/english/frequent");
    expect(commonReferences.regular).toBe("ˈɹɛɡjəɫɝ");
    expect(currentCohort.referenceCorrections.regular.to).toBe("ˈɹɛɡjəɫɝ");
    expect(commonGoldVariants("monitor")).toEqual(["ˈmɑnətɝ", "ˈmɑnɪtɝ"]);
    expect(commonVariantSources.monitor).toBe("https://dictionary.cambridge.org/us/dictionary/english/monitor");
    expect(commonGoldVariants("holiday")).toEqual(["ˈhɑɫəˌdeɪ", "ˈhɑɫɪˌdeɪ"]);
    expect(commonVariantSources.holiday).toBe("https://dictionary.cambridge.org/dictionary/english/holiday");
    expect(commonGoldVariants("recording")).toEqual(["ɹəˈkɔɹdɪŋ", "ɹɪˈkɔɹdɪŋ"]);
    expect(commonVariantSources.recording).toBe("https://dictionary.cambridge.org/us/pronunciation/english/recording");
    expect(commonGoldVariants("recorded")).toEqual(["ɹəˈkɔɹdɪd", "ɹɪˈkɔɹdɪd"]);
    expect(commonVariantSources.recorded).toBe("https://www.oxfordlearnersdictionaries.com/us/definition/english/record_2");
    expect(commonGoldVariants("recorder")).toEqual(["ɹiˈkɔɹdɝ", "ɹɪˈkɔɹdɝ"]);
    expect(commonVariantSources.recorder).toBe("https://www.oxfordlearnersdictionaries.com/definition/american_english/recorder");
    expect(currentCohort.words).toEqual(previousCurrentCohort31.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort31.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort30.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort30.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort29.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort29.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort28.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort28.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort25.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort25.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort24.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort24.top5000);
    expect(currentCohort.words).toEqual(previousCurrentCohort21.words);
    expect(currentCohort.top5000).toEqual(previousCurrentCohort21.top5000);
    const added: Record<string, [string, string]> = {
      unit: ["ˈjunɪt", "https://dictionary.cambridge.org/us/dictionary/english/unit"],
      limit: ["ˈɫɪmɪt", "https://dictionary.cambridge.org/us/dictionary/english/limit"],
      profit: ["ˈpɹɑfɪt", "https://dictionary.cambridge.org/us/pronunciation/english/profit"],
      latin: ["ˈɫætɪn", "https://dictionary.cambridge.org/us/dictionary/english/latin"],
      merit: ["ˈmɛɹɪt", "https://dictionary.cambridge.org/us/pronunciation/english/merit"],
      summit: ["ˈsʌmɪt", "https://dictionary.cambridge.org/dictionary/english/summit"],
      rabbit: ["ˈɹæbɪt", "https://dictionary.cambridge.org/us/pronunciation/english/rabbit"],
      margin: ["ˈmɑɹdʒɪn", "https://dictionary.cambridge.org/us/dictionary/english/margin"],
      spirit: ["ˈspɪɹɪt", "https://dictionary.cambridge.org/us/dictionary/english/spirit"],
      digit: ["ˈdɪdʒɪt", "https://dictionary.cambridge.org/us/dictionary/english/digit"],
      cabin: ["ˈkæbɪn", "https://dictionary.cambridge.org/us/dictionary/english/cabin"],
      tissue: ["ˈtɪʃu", "https://dictionary.cambridge.org/us/pronunciation/english/tissue"],
      america: ["əˈmɛɹɪkə", "https://dictionary.cambridge.org/pronunciation/english/america"],
      mexico: ["ˈmɛksɪkoʊ", "https://dictionary.cambridge.org/us/pronunciation/english/mexico"],
      acid: ["ˈæsɪd", "https://dictionary.cambridge.org/us/pronunciation/english/acid"],
      axis: ["ˈæksɪs", "https://dictionary.cambridge.org/us/pronunciation/english/axis"],
      emphasis: ["ˈɛmfəsɪs", "https://dictionary.cambridge.org/us/pronunciation/english/emphasis"],
      genesis: ["ˈdʒɛnəsɪs", "https://dictionary.cambridge.org/us/pronunciation/english/genesis"],
      challenge: ["ˈtʃæɫɪndʒ", "https://dictionary.cambridge.org/us/pronunciation/english/challenge"],
      definition: ["ˌdɛfɪˈnɪʃən", "https://dictionary.cambridge.org/us/pronunciation/english/definition"],
      direction: ["daɪˈɹɛkʃən", "https://dictionary.cambridge.org/us/pronunciation/english/direction"],
      institution: ["ˌɪnstəˈtuʃən", "https://dictionary.cambridge.org/us/pronunciation/english/institution"],
      tuition: ["tuˈɪʃən", "https://dictionary.cambridge.org/us/pronunciation/english/tuition"],
      detailed: ["ˈditeɪɫd", "https://dictionary.cambridge.org/us/pronunciation/english/detailed"],
      tours: ["ˈtʊɹz", "https://dictionary.cambridge.org/pronunciation/english/tour"],
      presented: ["pɹɪˈzɛntɪd", "https://dictionary.cambridge.org/us/pronunciation/english/present"],
      president: ["ˈpɹɛzɪdənt", "https://dictionary.cambridge.org/us/pronunciation/english/president"],
      email: ["ˈimeɪɫ", "https://dictionary.cambridge.org/us/pronunciation/english/email"],
      solely: ["ˈsoʊɫi", "https://dictionary.cambridge.org/us/pronunciation/english/solely"],
      contrary: ["ˈkɑntɹɝi", "https://dictionary.cambridge.org/pronunciation/english/contrary"],
      mostly: ["ˈmoʊstɫi", "https://dictionary.cambridge.org/us/pronunciation/english/mostly"],
      directly: ["daɪˈɹɛktɫi", "https://www.merriam-webster.com/dictionary/directly"],
      comparative: ["kəmˈpæɹətɪv", "https://www.merriam-webster.com/dictionary/comparative"],
      located: ["ˈɫoʊˌkeɪtɪd", "https://www.collinsdictionary.com/us/dictionary/english/located"],
      distributed: ["dɪˈstɹɪbjutɪd", "https://www.collinsdictionary.com/us/dictionary/english/distributed"],
      decreased: ["dɪˈkɹist", "https://dictionary.cambridge.org/us/dictionary/english/decreased"],
      government: ["ˈɡʌvɝnmənt", "https://dictionary.cambridge.org/us/pronunciation/english/government"],
      parent: ["ˈpæɹənt", "https://dictionary.cambridge.org/dictionary/english/parent"],
    };
    for (const [word, [ipa, source]] of Object.entries(added)) {
      expect(commonGoldVariants(word)).toContain(ipa);
      expect(commonVariantSources[word]).toBe(source);
      expect(currentCohort.references[word as keyof typeof currentCohort.references])
        .toBe(previousCurrentCohort20.references[word as keyof typeof previousCurrentCohort20.references]);
    }
    expect(currentCohort.words).toEqual(cohort.words);
    expect(currentCohort.top5000).toEqual(cohort.top5000);
    expect(commonReferences.civilization).toBe("ˌsɪvəɫəˈzeɪʃən");
    expect(commonGoldVariants("poor")).toEqual(["ˈpuɹ", "ˈpɔɹ"]);
    expect(commonVariantSources.poor).toBe("https://www.merriam-webster.com/dictionary/poor");
    expect(commonGoldVariants("from")).toEqual(["ˈfɹʌm", "ˈfɹɑm"]);
    expect(commonVariantSources.from).toBe("https://www.merriam-webster.com/dictionary/from");
    expect(commonGoldVariants("audio")).toEqual(["ˈɑdiˌoʊ", "ˈɔdiˌoʊ"]);
    expect(commonVariantSources.audio).toBe("https://www.merriam-webster.com/dictionary/audio");
    expect(commonGoldVariants("often")).toEqual(["ˈɔfən", "ˈɔftən"]);
    expect(commonVariantSources.often).toBe("https://www.merriam-webster.com/dictionary/often");
    expect(commonGoldVariants("due")).toEqual(["ˈdju", "ˈdu"]);
    expect(commonVariantSources.due).toBe("https://www.merriam-webster.com/dictionary/due");
    expect(commonGoldVariants("duty")).toEqual(["ˈdjuti", "ˈduti"]);
    expect(commonVariantSources.duty).toBe("https://www.merriam-webster.com/dictionary/duty");
    expect(commonGoldVariants("tuesday")).toEqual(["ˈtjuzˌdeɪ", "ˈtuzdeɪ"]);
    expect(commonVariantSources.tuesday).toBe("https://www.merriam-webster.com/dictionary/tuesday");
    expect(commonGoldVariants("during")).toEqual(["ˈdʊɹɪŋ", "ˈdjʊɹɪŋ"]);
    expect(commonVariantSources.during).toBe("https://www.merriam-webster.com/dictionary/during");
    expect(commonGoldVariants("receive")).toEqual(["ɹəˈsiv", "ɹiˈsiv"]);
    expect(commonVariantSources.receive).toBe("https://www.merriam-webster.com/dictionary/receive");
    expect(commonGoldVariants("reduce")).toEqual(["ɹəˈdus", "ɹiˈdus"]);
    expect(commonVariantSources.reduce).toBe("https://www.merriam-webster.com/dictionary/reduce");
    expect(commonGoldVariants("repair")).toEqual(["ɹɪˈpɛɹ", "ɹiˈpɛɹ"]);
    expect(commonVariantSources.repair).toBe("https://www.merriam-webster.com/dictionary/repair");
    expect(commonGoldVariants("result")).toEqual(["ɹɪˈzʌɫt", "ɹiˈzʌɫt"]);
    expect(commonVariantSources.result).toBe("https://www.merriam-webster.com/dictionary/result");
    expect(commonGoldVariants("record")).toEqual(["ˈɹɛkɝd", "ɹiˈkɔɹd"]);
    expect(commonVariantSources.record).toBe("https://www.merriam-webster.com/dictionary/record");
    expect(commonGoldVariants("present")).toEqual(["ˈpɹɛzənt", "pɹiˈzɛnt"]);
    expect(commonVariantSources.present).toBe("https://www.merriam-webster.com/dictionary/present");
    expect(commonGoldVariants("tear")).toEqual(["ˈtɛɹ", "ˈtɪɹ"]);
    expect(commonVariantSources.tear).toBe("https://www.merriam-webster.com/dictionary/tear");
    expect(commonGoldVariants("bow")).toEqual(["ˈbaʊ", "ˈboʊ"]);
    expect(commonVariantSources.bow).toBe("https://www.merriam-webster.com/dictionary/bow");
    expect(commonGoldVariants("reviews")).toEqual(["ɹəvˈjuz", "ɹiˈvjuz"]);
    expect(commonVariantSources.reviews).toBe("https://www.merriam-webster.com/dictionary/reviews");
    expect(commonGoldVariants("releases")).toEqual(["ɹɪˈɫisəz", "ɹiˈɫisəz"]);
    expect(commonVariantSources.releases).toBe("https://www.merriam-webster.com/dictionary/releases");
    expect(commonGoldVariants("reduction")).toEqual(["ɹəˈdʌkʃən", "ɹiˈdʌkʃən"]);
    expect(commonVariantSources.reduction).toBe("https://www.merriam-webster.com/dictionary/reduction");
    expect(commonReferences.syndication).toBe("ˌsɪndəˈkeɪʃən");
    expect(commonReferences.invitation).toBe("ˌɪnvəˈteɪʃən");
    expect(commonReferences.arbitration).toBe("ˌɑɹbəˈtɹeɪʃən");
    expect(commonReferences.negotiation).toBe("nəˌɡoʊʃiˈeɪʃən");
    expect(commonReferences.hanging).toBe("ˈhæŋɪŋ");
    expect(commonReferences.increasingly).toBe("ɪnˈkɹisɪŋɫi");
    expect(commonReferences.before).toBe("bɪˈfɔɹ");
    expect(commonReferences.been).toBe("ˈbin");
    expect(commonReferences.below).toBe("bɪˈɫoʊ");
    expect(commonReferences.blog).toBe("ˈbɫɑɡ");
    expect(commonReferences.event).toBe("ɪˈvɛnt");
    expect(commonReferences.online).toBe("ˈɑnˌɫaɪn");
    expect(commonReferences.service).toBe("ˈsɝvɪs");
    expect(commonReferences.coverage).toBe("ˈkʌvɝɪdʒ");
    expect(commonReferences.drainage).toBe("ˈdɹeɪnɪdʒ");
    expect(commonReferences.heritage).toBe("ˈhɛɹɪtɪdʒ");
    expect(commonReferences.luggage).toBe("ˈɫʌɡɪdʒ");
    expect(commonReferences.postage).toBe("ˈpoʊstɪdʒ");
    expect(commonReferences.savage).toBe("ˈsævɪdʒ");
    expect(commonReferences.voltage).toBe("ˈvoʊɫtɪdʒ");
  });

  it("retains CMU readings while accepting authoritative US variants", () => {
    expect(Object.keys(correctedCohort68.acceptedVariants)).toHaveLength(156);
    expect(Object.fromEntries(Object.entries(commonAcceptedVariants).filter(([word]) => !["hurricane", "forbidden", "interim", "stronger", "perfectly", "genuine", "diploma", "soma", "hypothesis", "republican", "transmit", "transmitted", "productive", "conferencing", "inspired", "recovered", "applicable", "array", "arrival", "arrived", "arrive", "arrangement", "arising", "arranged", "arise", "arrange", "aruba", "presidential", "specifics", "sensitivity", "biodiversity", "patent", "knowledge", "plaintiff", "eternal", "quantitative", "narrative", "replace", "replaced", "anime", "lingerie", "tsunami"].includes(word)))).toEqual(correctedCohort68.acceptedVariants);
    for (const word of Object.keys(correctedCohort68.acceptedVariants)) {
      expect(commonVariantSources[word]).toMatch(/^(?:https:\/\/dictionary\.cambridge\.org\/(?:us\/)?(?:pronunciation|dictionary)\/english\/|https:\/\/www\.merriam-webster\.com\/dictionary\/|https:\/\/www\.collinsdictionary\.com\/(?:us\/dictionary\/english|dictionary\/english-pronunciations)\/|https:\/\/www\.oxfordlearnersdictionaries\.com\/(?:us\/definition\/english|definition\/american_english)\/)/);
      expect(commonGoldVariants(word)).toHaveLength(2);
    }
    expect(commonGoldVariants("facility")).toEqual(["fəˈsɪɫɪti", "fəˈsɪɫəti"]);
    expect(commonGoldVariants("palm")).toEqual(["ˈpɑɫm", "ˈpɑm"]);
    expect(commonVariantSources.palm).toBe("https://dictionary.cambridge.org/us/pronunciation/english/palm");
    expect(commonGoldVariants("liability")).toEqual(["ˌɫaɪəˈbɪɫɪti", "ˌɫaɪəˈbɪɫəti"]);
    expect(commonGoldVariants("identity")).toEqual(["aɪˈdɛntɪˌti", "aɪˈdɛntəti"]);
    expect(commonGoldVariants("diversity")).toEqual(["daɪˈvɝsɪti", "dɪˈvɝsəti"]);
    expect(commonGoldVariants("eligibility")).toEqual(["ˌɛɫɪdʒəˈbɪɫɪti", "ˌɛɫədʒəˈbɪɫəti"]);
    expect(commonGoldVariants("disability")).toEqual(["ˌdɪsəˈbɪɫɪti", "ˌdɪsəˈbɪɫəti"]);
    expect(commonGoldVariants("nudity")).toEqual(["ˈnudɪti", "ˈnudəti"]);
    expect(commonGoldVariants("spirituality")).toEqual(["ˌspɪɹɪˌtʃuˈæɫəˌti", "ˌspɪɹətʃuˈæɫəti"]);
    expect(commonGoldVariants("personal")).toEqual(["ˈpɝsɪnəɫ", "ˈpɝsənəɫ"]);
    expect(commonGoldVariants("subject")).toEqual(["ˈsʌbdʒɪkt", "səbˈdʒɛkt"]);
    expect(commonGoldVariants("close")).toEqual(["ˈkɫoʊs", "ˈkɫoʊz"]);
    expect(commonGoldVariants("object")).toEqual(["ˈɑbdʒɛkt", "əbˈdʒɛkt"]);
    expect(commonGoldVariants("miles")).toEqual(["ˈmaɪəɫz", "ˈmaɪɫz"]);
    expect(commonGoldVariants("charles")).toEqual(["ˈtʃɑɹəɫz", "ˈtʃɑɹɫz"]);
    expect(commonGoldVariants("dog")).toEqual(["ˈdɔɡ", "ˈdɑɡ"]);
    expect(commonGoldVariants("loss")).toEqual(["ˈɫɔs", "ˈɫɑs"]);
    expect(commonGoldVariants("across")).toEqual(["əˈkɹɔs", "əˈkɹɑs"]);
    expect(commonGoldVariants("lost")).toEqual(["ˈɫɔst", "ˈɫɑst"]);
    expect(commonGoldVariants("cross")).toEqual(["ˈkɹɔs", "ˈkɹɑs"]);
    expect(commonGoldVariants("wanted")).toEqual(["ˈwɔntɪd", "ˈwɑntɪd"]);
    expect(commonGoldVariants("frost")).toEqual(["ˈfɹɔst", "ˈfɹɑst"]);
    expect(commonGoldVariants("moss")).toEqual(["ˈmɔs", "ˈmɑs"]);
    expect(commonGoldVariants("honda")).toEqual(["ˈhɔndə", "ˈhɑndə"]);
    expect(commonGoldVariants("toolbox")).toEqual(["ˈtuɫˌbɔks", "ˈtuɫˌbɑks"]);
    expect(commonGoldVariants("cloth")).toEqual(["ˈkɫɔθ", "ˈkɫɑθ"]);
    expect(commonGoldVariants("mod")).toEqual(["ˈmɔd", "ˈmɑd"]);
    expect(commonGoldVariants("firefox")).toEqual(["ˈfaɪɝˌfɔks", "ˈfaɪɝˌfɑks"]);
    expect(commonGoldVariants("glossary")).toEqual(["ˈɡɫɔsɝi", "ˈɡɫɑsɝi"]);
    expect(commonGoldVariants("protocols")).toEqual(["ˈpɹoʊtəˌkɔɫz", "ˈpɹoʊtəˌkɑɫz"]);
    expect(commonGoldVariants("government")).toEqual(["ˈɡʌvɝmənt", "ˈɡʌvɝnmənt"]);
    expect(commonGoldVariants("document")).toEqual(["ˈdɑkjəmɛnt", "ˈdɑkjəmənt"]);
    expect(commonGoldVariants("status")).toEqual(["ˈstætəs", "ˈsteɪtəs"]);
    expect(commonGoldVariants("coffee")).toEqual(["ˈkɑfi", "ˈkɔfi"]);
    expect(commonGoldVariants("sorry")).toEqual(["ˈsɑɹi", "ˈsɔɹi"]);
    expect(commonGoldVariants("dogs")).toEqual(["ˈdɑɡz", "ˈdɔɡz"]);
    expect(commonGoldVariants("raw")).toEqual(["ˈɹɑ", "ˈɹɔ"]);
    expect(commonGoldVariants("falling")).toEqual(["ˈfɑɫɪŋ", "ˈfɔɫɪŋ"]);
    expect(commonGoldVariants("catalogs")).toEqual(["ˈkætəɫɑɡz", "ˈkætəˌɫɔɡz"]);
    expect(commonGoldVariants("tomorrow")).toEqual(["təˈmɑˌɹoʊ", "təˈmɔɹoʊ"]);
    expect(commonGoldVariants("groundwater")).toEqual(["ˈɡɹaʊndˌwɑtɝ", "ˈɡɹaʊndˌwɔtɝ"]);
    expect(commonGoldVariants("constructor", "ˈkənˌstɹʌktɝ")).toEqual(["ˈkənˌstɹʌktɝ"]);
  });
});


test("v68 corrects only webpage while preserving the v67 population and history", () => {
  const next = correctedCohort68, previousReferences = new Map(Object.entries(currentCohort.references));
  expect(next.referenceVersion).toBe("common-cohort-v68");
  expect(next.supersedes).toBe("common-cohort-v67.json");
  expect(next.words).toEqual(currentCohort.words);
  expect(next.top5000).toEqual(currentCohort.top5000);
  expect(next.n).toBe(currentCohort.n);
  expect(next.topN).toBe(currentCohort.topN);
  expect(next.acceptedVariants).toEqual(currentCohort.acceptedVariants);
  expect(next.variantSources).toEqual(currentCohort.variantSources);
  expect(Object.entries(next.references).filter(([word, ipa]) => ipa !== previousReferences.get(word)).map(([word]) => word)).toEqual(["webpage"]);
  expect(next.references.webpage).toBe("ˈwɛbˌpeɪdʒ");
  expect(currentCohort.references.webpage).toBe("ˈwɛbpɪdʒ");
  expect(commonGoldVariants("webpage")).toEqual(["ˈwɛbˌpeɪdʒ"]);
  expect(next.referenceCorrections.webpage.source).toBe("https://dictionary.cambridge.org/us/pronunciation/english/web-page");
});


test("v69 independently corrects hurricane without changing the fixed population", () => {
  const next = correctedCohort69, previous = correctedCohort68;
  expect(next.words).toEqual(previous.words);
  expect(next.top5000).toEqual(previous.top5000);
  expect(next.n).toBe(previous.n);
  expect(next.topN).toBe(previous.topN);
  const old = new Map(Object.entries(previous.references));
  expect(Object.entries(next.references).filter(([word, ipa]) => old.get(word) !== ipa).map(([word]) => word)).toEqual(["hurricane"]);
  expect(next.references.hurricane).toBe("ˈhɝəˌkeɪn");
  expect(previous.references.hurricane).toBe("ˈhʌɹəˌkeɪnz");
  expect(commonGoldVariants("hurricane")).toEqual(["ˈhɝəˌkeɪn", "ˈhɝɪkeɪn", "ˈhɝɪkən", "ˈhʌɹəˌkeɪn"]);
  expect(next.referenceCorrections.hurricane.source).toBe("https://dictionary.cambridge.org/us/dictionary/english/hurricane");
});


test("v70 corrects forbidden stress and accepts both independently vouched prefixes", () => {
  const next = correctedCohort70, previous = correctedCohort69;
  const priorReferences = new Map(Object.entries(previous.references));
  expect(next.words).toEqual(previous.words);
  expect(next.top5000).toEqual(previous.top5000);
  expect(next.n).toBe(previous.n);
  expect(next.topN).toBe(previous.topN);
  expect(Object.entries(next.references).filter(([word, ipa]) => priorReferences.get(word) !== ipa).map(([word]) => word)).toEqual(["forbidden"]);
  expect(previous.references.forbidden).toBe("ˈfɔɹbɪdən");
  expect(commonGoldVariants("forbidden")).toEqual(["fɝˈbɪdən", "fɔɹˈbɪdən"]);
  expect(next.variantSources.forbidden).toBe("https://dictionary.cambridge.org/us/dictionary/english/forbidden");
});

// Cambridge confirms initial stress for both interim noun and adjective,
// with KIT and schwa alternatives in the final weak syllable.
test("v71 removes the unsupported interim stress without changing the cohort", () => {
  const next = correctedCohort71, previous = correctedCohort70;
  const priorReferences = new Map(Object.entries(previous.references));
  expect(next.words).toEqual(previous.words);
  expect(next.top5000).toEqual(previous.top5000);
  expect(next.n).toBe(previous.n);
  expect(next.topN).toBe(previous.topN);
  expect(Object.entries(next.references).filter(([word, ipa]) => priorReferences.get(word) !== ipa).map(([word]) => word)).toEqual(["interim"]);
  expect(next.acceptedVariants).toEqual({ ...previous.acceptedVariants, interim: ["ˈɪntɝəm"] });
  expect(next.variantSources).toEqual({ ...previous.variantSources, interim: "https://dictionary.cambridge.org/us/dictionary/english/interim" });
  expect(previous.references.interim).toBe("ɪnˈtɛɹɪm");
  expect(commonGoldVariants("interim")).toEqual(["ˈɪntɝɪm", "ˈɪntɝəm"]);
  expect(next.variantSources.interim).toBe("https://dictionary.cambridge.org/us/dictionary/english/interim");
});

test("v72 accepts the documented comparative stronger without changing the cohort", () => {
  const previous = correctedCohort71, next = correctedCohort72;
  expect(next.words).toEqual(previous.words);
  expect(next.top5000).toEqual(previous.top5000);
  expect(next.references).toEqual(previous.references);
  expect(next.acceptedVariants).toEqual({ ...previous.acceptedVariants, stronger: ["ˈstɹɔŋɡɝ"] });
  expect(next.variantSources).toEqual({ ...previous.variantSources, stronger: "https://www.collinsdictionary.com/dictionary/english-pronunciations/strong" });
  expect(commonGoldVariants("stronger")).toEqual(["ˈstɹɔŋɝ", "ˈstɹɔŋɡɝ"]);
});

test("v73 accepts the documented perfectly reading without changing the cohort", () => {
  const previous = correctedCohort72, next = correctedCohort73;
  expect(next.words).toEqual(previous.words);
  expect(next.top5000).toEqual(previous.top5000);
  expect(next.references).toEqual(previous.references);
  expect(next.acceptedVariants).toEqual({ ...previous.acceptedVariants, perfectly: ["ˈpɝfɪktɫi"] });
  expect(next.variantSources).toEqual({ ...previous.variantSources, perfectly: "https://www.oxfordlearnersdictionaries.com/us/definition/english/perfectly" });
  expect(commonGoldVariants("perfectly")).toEqual(["ˈpɝfəkɫi", "ˈpɝfɪktɫi"]);
});

test("v74 preserves genuine's prior reference and adds Cambridge's reading", () => {
  expect(correctedCohort74.words).toEqual(correctedCohort73.words);
  expect(correctedCohort74.top5000).toEqual(correctedCohort73.top5000);
  expect(correctedCohort74.references).toEqual(correctedCohort73.references);
  expect(correctedCohort74.acceptedVariants).toEqual({ ...correctedCohort73.acceptedVariants, genuine: ["ˈdʒɛnjuɪn"] });
  expect(correctedCohort74.variantSources).toEqual({ ...correctedCohort73.variantSources, genuine: "https://dictionary.cambridge.org/us/pronunciation/english/genuine" });
  expect(commonGoldVariants("genuine")).toEqual(["ˌdʒɛnˈjuˌwaɪn", "ˈdʒɛnjuɪn"]);
});

test("v75 adds documented US readings without changing existing references or the cohort", () => {
  expect(correctedCohort75.version).toBe("common-cohort-v75");
  expect(correctedCohort75.referenceVersion).toBe("common-cohort-v75");
  expect(correctedCohort75.words).toEqual(correctedCohort74.words);
  expect(correctedCohort75.top5000).toEqual(correctedCohort74.top5000);
  expect(correctedCohort75.references).toEqual(correctedCohort74.references);
  expect(correctedCohort75.acceptedVariants).toEqual({
    ...correctedCohort74.acceptedVariants,
    diploma: ["dɪˈpɫoʊmə"], soma: ["ˈsoʊmə"],
    hypothesis: ["haɪˈpɑθəsɪs"], republican: ["ɹəˈpʌbɫɪkən"],
  });
  expect(correctedCohort75.variantSources).toEqual({
    ...correctedCohort74.variantSources,
    diploma: "https://dictionary.cambridge.org/pronunciation/english/diploma",
    soma: "https://dictionary.cambridge.org/us/pronunciation/english/soma",
    hypothesis: "https://dictionary.cambridge.org/us/pronunciation/english/hypothesis",
    republican: "https://dictionary.cambridge.org/pronunciation/english/republican",
  });
  expect(commonGoldVariants("hypothesis")).toEqual(["haɪˈpɑθəsəs", "haɪˈpɑθəsɪs"]);
});

test("v76 preserves the cohort and accepts both US transmit variants", () => {
  expect(correctedCohort76.referenceVersion).toBe("common-cohort-v76");
  expect(correctedCohort76.words).toEqual(correctedCohort75.words);
  expect(correctedCohort76.top5000).toEqual(correctedCohort75.top5000);
  expect(correctedCohort76.references).toEqual(correctedCohort75.references);
  expect(correctedCohort76.acceptedVariants).toEqual({
    ...correctedCohort75.acceptedVariants,
    transmit: ["tɹænsˈmɪt"], transmitted: ["tɹænzˈmɪtɪd"],
  });
  const source = "https://www.collinsdictionary.com/us/dictionary/english/transmit";
  expect(correctedCohort76.variantSources).toEqual({
    ...correctedCohort75.variantSources, transmit: source, transmitted: source,
  });
  expect(commonGoldVariants("transmit")).toEqual(["tɹænzˈmɪt", "tɹænsˈmɪt"]);
  expect(commonGoldVariants("transmitted")).toEqual(["tɹænsˈmɪtɪd", "tɹænzˈmɪtɪd"]);
});

test("v77 adds Cambridge's US productive reading without changing the cohort or prior readings", () => {
  expect(correctedCohort77.referenceVersion).toBe("common-cohort-v77");
  expect(correctedCohort77.words).toEqual(correctedCohort76.words);
  expect(correctedCohort77.top5000).toEqual(correctedCohort76.top5000);
  expect(correctedCohort77.references).toEqual(correctedCohort76.references);
  expect(correctedCohort77.acceptedVariants).toEqual({
    ...correctedCohort76.acceptedVariants, productive: ["pɹəˈdʌktɪv"],
  });
  expect(correctedCohort77.variantSources).toEqual({
    ...correctedCohort76.variantSources,
    productive: "https://dictionary.cambridge.org/us/pronunciation/english/productive",
  });
  expect(commonGoldVariants("productive")).toEqual(["pɝˈdʌktɪv", "pɹəˈdʌktɪv"]);
});


test("v78 adds sourced US variants while preserving the full v77 contract", () => {
  expect(correctedCohort78.referenceVersion).toBe("common-cohort-v78");
  expect(correctedCohort78.supersedes).toBe("common-cohort-v77.json");
  expect(correctedCohort78.words).toEqual(correctedCohort77.words);
  expect(correctedCohort78.top5000).toEqual(correctedCohort77.top5000);
  expect(correctedCohort78.references).toEqual(correctedCohort77.references);
  expect(correctedCohort78.acceptedVariants).toEqual({
    ...correctedCohort77.acceptedVariants,
    conferencing: ["ˈkɑnfɝənsɪŋ"], inspired: ["ɪnˈspaɪɹd"], recovered: ["ɹɪˈkʌvɝd"],
  });
  expect(correctedCohort78.variantSources).toEqual({
    ...correctedCohort77.variantSources,
    conferencing: "https://dictionary.cambridge.org/pronunciation/english/video-conferencing",
    inspired: "https://dictionary.cambridge.org/pronunciation/english/inspired",
    recovered: "https://dictionary.cambridge.org/us/dictionary/english/recovered",
  });
  for (const word of ["conferencing", "inspired", "recovered"]) {
    expect(commonGoldVariants(word)).toEqual([commonReferences[word], ...commonAcceptedVariants[word]]);
    expect(commonVariantSources[word]).toMatch(/^https:\/\/dictionary\.cambridge\.org\//);
  }
});

test("v78 carries forward the original baseline instead of resetting it", () => {
  const oldBaseline = require("../scripts/eval-common-baseline-v77.json");
  const nextBaseline = require("../scripts/eval-common-baseline-v78.json");
  expect(nextBaseline.provenance.sourceSnapshotSha256).toBe(oldBaseline.provenance.sourceSnapshotSha256);
  expect(nextBaseline.provenance.runtimeChanges).toBe(0);
  expect(nextBaseline.provenance.before).toEqual([5811, 6465, 3165, 3410]);
  expect(nextBaseline.provenance.after).toEqual([5814, 6465, 3165, 3410]);
  expect(nextBaseline.full.n).toBe(oldBaseline.full.n);
  expect(nextBaseline.top5000).toEqual(oldBaseline.top5000);
});

test("v79 preserves v78 references and adds the cohort's Cambridge US applicable variant", () => {
  expect(correctedCohort79.referenceVersion).toBe("common-cohort-v79");
  expect(correctedCohort79.supersedes).toBe("common-cohort-v78.json");
  expect(correctedCohort79.words).toEqual(correctedCohort78.words);
  expect(correctedCohort79.top5000).toEqual(correctedCohort78.top5000);
  expect(correctedCohort79.references).toEqual(correctedCohort78.references);
  expect(correctedCohort79.acceptedVariants).toEqual({
    ...correctedCohort78.acceptedVariants,
    applicable: ["əˈpɫɪkəbəɫ"],
  });
  expect(correctedCohort79.variantSources).toEqual({
    ...correctedCohort78.variantSources,
    applicable: "https://dictionary.cambridge.org/us/pronunciation/english/applicable",
  });
  expect(commonGoldVariants("applicable")).toEqual(["ˈæpɫəkəbəɫ", "əˈpɫɪkəbəɫ"]);
  expect(commonGoldVariants("inapplicable")).toEqual([]);
  expect(commonVariantSources.applicable).toMatch(/^https:\/\/dictionary\.cambridge\.org\/us\/pronunciation\//);
});

test("v79 re-scores the frozen v78 prediction snapshot without changing its denominator", () => {
  const previous = require("../scripts/eval-common-baseline-v78.json");
  const next = require("../scripts/eval-common-baseline-v79.json");
  expect(next.provenance.sourceSnapshotSha256).toBe(previous.provenance.sourceSnapshotSha256);
  expect(next.provenance.runtimeChanges).toBe(0);
  expect(next.provenance.before).toEqual([5814, 6465, 3165, 3410]);
  expect(next.provenance.after).toEqual([5814, 6465, 3165, 3410]);
  expect(next.full.n).toBe(previous.full.n);
  expect(next.top5000).toEqual(previous.top5000);
});

test("v80 adds authoritative weak initial-ar variants without changing v79 gold or populations", () => {
  expect(correctedCohort80.referenceVersion).toBe("common-cohort-v80");
  expect(correctedCohort80.supersedes).toBe("common-cohort-v79.json");
  expect(correctedCohort80.words).toEqual(correctedCohort79.words);
  expect(correctedCohort80.top5000).toEqual(correctedCohort79.top5000);
  expect(correctedCohort80.references).toEqual(correctedCohort79.references);
  expect(correctedCohort80.acceptedVariants).toEqual({
    ...correctedCohort79.acceptedVariants,
    array: ["əɹˈeɪ"], arrival: ["əɹˈaɪvəl"], arrived: ["əɹˈaɪvd"],
    arrive: ["əɹˈaɪv"], arrangement: ["əɹˈeɪndʒmənt"], arising: ["əɹˈaɪzɪŋ"],
    arranged: ["əɹˈeɪndʒd"], arise: ["əɹˈaɪz"], arrange: ["əɹˈeɪndʒ"],
    aruba: ["əɹˈubə"],
  });
  expect(commonGoldVariants("arrive")).toEqual(["ɝˈaɪv", "əɹˈaɪv"]);
  expect(commonGoldVariants("around")).toContain("əˈɹaʊnd");
  expect(commonVariantSources.aruba).toBe("https://dictionary.cambridge.org/pronunciation/english/aruba");
    expect(commonReferenceContract).toEqual({ version: correctedCohort89.referenceVersion, sha256: correctedCohort89.referenceSha256 });
});

test("v80 baseline scores the unchanged frozen predictions under the new reference contract", () => {
  const next = require("../scripts/eval-common-baseline-v80.json");
  expect(next.referenceVersion).toBe(correctedCohort80.referenceVersion);
  expect(next.referenceSha256).toBe(correctedCohort80.referenceSha256);
  expect(next.full.n).toBe(correctedCohort80.n);
  expect(next.top5000.n).toBe(correctedCohort80.topN);
  expect(next.provenance.oldContract).toBe("common-cohort-v79");
  expect(next.provenance.newContract).toBe("common-cohort-v80");
  expect(next.provenance.sourceSnapshotSha256).toBe(correctedCohort80.provenance.sourceSnapshotSha256);
  expect(next.provenance.runtimeChanges).toBe(0);
  expect(next.provenance.after).toEqual(next.provenance.before);
  expect(next.provenance.before).toEqual([5864, 6482, 3187, 3420]);
});

test("v81 retains the Cambridge US presidential variant without changing the cohort", () => {
  const next = correctedCohort81;
  expect(next.referenceVersion).toBe("common-cohort-v81");
  expect(next.supersedes).toBe("common-cohort-v80.json");
  expect(next.words).toEqual(correctedCohort80.words);
  expect(next.top5000).toEqual(correctedCohort80.top5000);
  expect(next.references).toEqual(correctedCohort80.references);
  expect(next.acceptedVariants).toEqual({ ...correctedCohort80.acceptedVariants, presidential: ["ˌpɹɛzɪˈdɛnʃəɫ"] });
  expect(next.variantSources.presidential).toBe("https://dictionary.cambridge.org/pronunciation/english/presidential");
  expect(commonGoldVariants("presidential")).toEqual(["ˌpɹɛzəˈdɛnʃəɫ", "ˌpɹɛzɪˈdɛnʃəɫ"]);
});

test("v81 preserves v80 frozen-snapshot scores because its presidential row uses the primary reading", () => {
  const next = require("../scripts/eval-common-baseline-v81.json");
  expect(next.referenceVersion).toBe(correctedCohort81.referenceVersion);
  expect(next.referenceSha256).toBe(correctedCohort81.referenceSha256);
  expect(next.provenance.oldContract).toBe("common-cohort-v80");
  expect(next.provenance.newContract).toBe("common-cohort-v81");
  expect(next.provenance.sourceSnapshotSha256).toBe(correctedCohort81.provenance.sourceSnapshotSha256);
  expect(next.provenance.runtimeChanges).toBe(0);
  expect(next.provenance.after).toEqual(next.provenance.before);
  expect(next.provenance.before).toEqual([5864, 6482, 3187, 3420]);
});

test("v82 adds Cambridge's US specifics variant without changing primary references or population", () => {
  expect(correctedCohort82.referenceVersion).toBe("common-cohort-v82");
  expect(correctedCohort82.supersedes).toBe("common-cohort-v81.json");
  expect(correctedCohort82.words).toEqual(correctedCohort81.words);
  expect(correctedCohort82.top5000).toEqual(correctedCohort81.top5000);
  expect(correctedCohort82.references).toEqual(correctedCohort81.references);
  expect(correctedCohort82.acceptedVariants).toEqual({ ...correctedCohort81.acceptedVariants, specifics: ["spəˈsɪfɪks"] });
  expect(correctedCohort82.variantSources.specifics).toBe("https://dictionary.cambridge.org/pronunciation/english/specifics");
  expect(commonGoldVariants("specifics")).toEqual(["spɪˈsɪfɪks", "spəˈsɪfɪks"]);
});

test("v82 baseline preserves v81 frozen-snapshot scores", () => {
  const next = require("../scripts/eval-common-baseline-v82.json");
  expect(next.referenceVersion).toBe(correctedCohort82.referenceVersion);
  expect(next.referenceSha256).toBe(correctedCohort82.referenceSha256);
  expect(next.provenance.oldContract).toBe("common-cohort-v81");
  expect(next.provenance.newContract).toBe("common-cohort-v82");
  expect(next.provenance.sourceSnapshotSha256).toBe(correctedCohort82.provenance.sourceSnapshotSha256);
  expect(next.provenance.runtimeChanges).toBe(0);
  expect(next.provenance.after).toEqual(next.provenance.before);
  expect(next.provenance.before).toEqual([5864, 6482, 3187, 3420]);
});

test("v83 records Cambridge's US sensitivity variant without changing the fixed population", () => {
  expect(correctedCohort83.referenceVersion).toBe("common-cohort-v83");
  expect(correctedCohort83.supersedes).toBe("common-cohort-v82.json");
  expect(correctedCohort83.words).toEqual(correctedCohort82.words);
  expect(correctedCohort83.top5000).toEqual(correctedCohort82.top5000);
  expect(correctedCohort83.references).toEqual(correctedCohort82.references);
  expect(correctedCohort83.acceptedVariants).toEqual({ ...correctedCohort82.acceptedVariants, sensitivity: ["ˌsɛnsəˈtɪvəti"] });
  expect(correctedCohort83.variantSources.sensitivity).toBe("https://dictionary.cambridge.org/pronunciation/english/sensitivity");
  expect(commonGoldVariants("sensitivity")).toEqual(["ˌsɛnsɪˈtɪvɪti", "ˌsɛnsəˈtɪvəti"]);
});

test("v83 baseline re-scores the unchanged v82 snapshot", () => {
  const next = require("../scripts/eval-common-baseline-v83.json");
  expect(next.referenceVersion).toBe(correctedCohort83.referenceVersion);
  expect(next.referenceSha256).toBe(correctedCohort83.referenceSha256);
  expect(next.provenance.oldContract).toBe("common-cohort-v82");
  expect(next.provenance.newContract).toBe("common-cohort-v83");
  expect(next.provenance.sourceSnapshotSha256).toBe("7653119d6ff1e5e3f6a4912bacbd8b021adab04e2ff48936f2ee5d5ce3fa868b");
  expect(next.provenance.before).toEqual([5864, 6482, 3187, 3420]);
  expect(next.provenance.after).toEqual(next.provenance.before);
  expect(next.provenance.runtimeChanges).toBe(0);
});

test("v84 adds Cambridge's US biodiversity variant and preserves the fixed population", () => {
  expect(correctedCohort84.referenceVersion).toBe("common-cohort-v84");
  expect(correctedCohort84.supersedes).toBe("common-cohort-v83.json");
  expect(correctedCohort84.words).toEqual(correctedCohort83.words);
  expect(correctedCohort84.top5000).toEqual(correctedCohort83.top5000);
  expect(correctedCohort84.references).toEqual(correctedCohort83.references);
  expect(correctedCohort84.acceptedVariants).toEqual({
    ...correctedCohort83.acceptedVariants,
    biodiversity: ["ˌbaɪoʊdɪˈvɝsəti"],
  });
  expect(correctedCohort84.variantSources.biodiversity).toBe("https://dictionary.cambridge.org/pronunciation/english/biodiversity");
  expect(commonGoldVariants("biodiversity")).toEqual(["ˌbaɪoʊdaɪˈvɝsəti", "ˌbaɪoʊdɪˈvɝsəti"]);
});

test("v84 baseline re-scores the unchanged biodiversity prediction row", () => {
  const next = require("../scripts/eval-common-baseline-v84.json");
  expect(next.referenceVersion).toBe(correctedCohort84.referenceVersion);
  expect(next.referenceSha256).toBe(correctedCohort84.referenceSha256);
  expect(next.provenance.oldContract).toBe("common-cohort-v83");
  expect(next.provenance.newContract).toBe("common-cohort-v84");
  expect(next.provenance.sourceSnapshotSha256).toBe("7653119d6ff1e5e3f6a4912bacbd8b021adab04e2ff48936f2ee5d5ce3fa868b");
  expect(next.provenance.before).toEqual([5864, 6482, 3187, 3420]);
  expect(next.provenance.after).toEqual([5865, 6482, 3187, 3420]);
  expect(next.provenance.runtimeChanges).toBe(0);
});
