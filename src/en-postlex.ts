/**
 * Post-lexical corrections for the rule path.
 *
 * Applied by predictInternal() to the joined syllable IPA right after
 * syllableToIPA, before the stress mark is inserted — rule-path ONLY.
 * This is deliberately separate from en-phonotactics.ts, which holds
 * the small universal rule set applied to dict output as well; nothing
 * here may move there without changing dict-word behavior.
 *
 * Two tables, applied in order:
 *   POST_PROC_RULES — unconditional IPA cleanup (degemination, rhotic
 *     merges, suffix vowel fixes).
 *   POST_LEX_RULES  — orthography/etymology-conditioned corrections,
 *     each gated by a cheap guard on the spelling (and syllable count).
 *     Order is load-bearing: later rules see earlier rules' output.
 */

// --- Unconditional IPA cleanup (applied after syllabification, before stress marking) ---

export const POST_PROC_RULES: Array<[RegExp, string]> = [
  [/([pbtdkɡfvszʃʒθðmnŋlɹhjwɫ])\1/g, "$1"],
  [/sʒ/g, "ʃ"],
  [/əɹ/g, "ɝ"],
  [/(?<=[^aeiouæɛɪɑɔʌʊ])ɪɹɝ$/, "ɝɝ"],
  [/n([kɡ])/g, "ŋ$1"],
  [/^mk/, "mək"],
  [/ɹɪtʃ$/, "ɹɪk"],
  [/ɡdʒ$/, "ɡ"],
  [/(?<=[aɑɔɛɪouəɝ])dʒɝ$/, "ɡɝ"],
  [/ətʃ$/, "ək"],
  [/([bdfɡhklmnpɹstzv])ə(ʃ|dʒ)əs$/, "$1eɪ$2əs"],
  [/([^w])əʃən$/, "$1eɪʃən"],
  [/oʊɹ/g, "ɔɹ"],
  [/[ɑə][ɛə]$/, "oʊ"],
  [/oʊ([ntplm])ɪk/g, "ɑ$1ɪk"],
  [/oʊnəm/g, "ɑnəm"],
  [/oʊmɪtɝ/g, "ɑmɪtɝ"],
  [/oʊɡɹəf([iɝ])/g, "ɑɡɹəf$1"],
  [/oʊmɪnən([ts])/g, "ɑmənən$1"],
  [/oʊdʒɪk$/, "ɑdʒɪk"],
  [/ənoʊ/g, "ɑnoʊ"],
  [/ætɪv$/, "ətɪv"],
  [/ɑɹi$/, "ɛɹi"],
  [/[æɪ]bli$/, "əbli"],
  [/ɑl([dtskp])/g, "oʊl$1"],
  [/əhl/g, "ɑl"],
  [/([pbtdkɡfvszʃθmnlhjwɫ])ɹoʊst/g, "$1ɹɑst"],
  [/bɹoʊd/g, "bɹɔd"],
  [/^ʌnɪ/, "junɪ"],
  [/([kɡdbptfvszʃʒmnlɹwj])əəs$/g, "$1uəs"],
  [/ksɪəs/g, "kʃəs"],
  [/stjʊɹ/g, "stʃɝ"],
  [/([tsn])aɪv$/g, "$1ɪv"],
  [/([^aeiouæɑɔɛɪuoəɝʌ])ɪtɪv$/g, "$1ətɪv"],
  [/ɡuʃ/g, "ɡwɪʃ"],
  [/mək(ɝ|ɪŋ)$/, "meɪk$1"],
  [/məstɝ$/, "mæstɝ"],
  [/ɪ([nlkfvmt])eɪʃən$/, "ə$1eɪʃən"],
  [/ɪ([nk])eɪt$/, "ə$1eɪt"],
  [/(s|dʒ)ɪbəl$/g, "$1əbəl"],
  [/ʌmɪnəs$/, "umənəs"],
  [/pənənt$/, "poʊnənt"],
  [/ɡɹɛɡeɪt$/, "ɡɹəɡeɪt"],
  [/tɪənɛɹi$/, "ʃənɛɹi"],
  [/ɝɹeɪʃən$/, "ɝeɪʃən"],
  [/ɪnɪti$/, "ɪnəti"],
  [/ɛntɛɹi$/, "əntɛɹi"],
  [/ɪtud$/, "ətud"],
  [/oʊleɪt$/, "ɑleɪt"],
  [/aʊɹ(?=[^aeiouæɛɪɑɔʌʊ])/g, "uɹ"], // French -our- before consonant (belcourt/bournonville)
  [/æ{2,}/g, "ɑ"], // double-a → ɑ (baalbek, baasch, baatz)
  [/ɪæ$/, "iə"], // word-final -ia: sɪnðɪæ→sɪnðiə (cynthia/sylvia)
  [/zjʊɹ$/, "ʒɝ"], // -zure: seizure/azure → ʒɝ
  [/nð$/, "nθ"], // word-final -nth: absinthe/labyrinth → nθ
  [/([lɹ])ð/g, "$1θ"], // -lth-/-rth- cluster: altherr/waltham/carthage → lθ/ɹθ
];

// --- Guarded orthography/etymology corrections ---

interface PostLexRule {
  /** Cheap pre-guard on the spelling (w) and syllable count; rule fires only when true. */
  when: (w: string, syl: number) => boolean;
  re: RegExp;
  /** Plain replacement string (use `fn` instead for callback replacers). */
  sub?: string;
  fn?: (substring: string, ...groups: string[]) => string;
}

// German(ic) surname suffixes whose <ei> is /aɪ/ (and whose <g> stays hard).
const GERMANIC_EI_SUFFIX_RE =
  /(?:berg|burg|stein(?:er)?|heim(?:er)?|bach|wald|feld|brand|mann|kamp|wein|bein|hoff|muth|dorf|tal|ler|ner|sen|born|mark|meier|eier|meister|eister|hardt|ardt|lein|heit|heid|meyer|eyer|weiser|eiser|ecker|decker|elman|eman|hein|eitel|itel|einl|eindl|indl|berger|egger|eiter|iter|wenger|enger|enson|itas|linger|fried|zig|eis|eiden|eider|hold|gold|zel|eineke|eincke|eineck|einke)$/;

const POST_LEX_RULES: PostLexRule[] = [
  // — Latinate / native suffix corrections —
  { when: (w) => w.startsWith("aa"), re: /^æ+/, sub: "ɑ" },
  { when: (w) => w.endsWith("erate") || w.length >= 9, re: /[ɛɔ]ɹeɪt(ɝ?)$/, sub: "ɝeɪt$1" },
  { when: (_w, syl) => syl >= 3, re: /eɪdʒ$/, sub: "ɪdʒ" },
  { when: (w) => w.includes("asiv"), re: /æsɪv/, sub: "eɪsɪv" },
  { when: (w) => w.endsWith("ator"), re: /([^w])ətɝ$/, sub: "$1eɪtɝ" },
  { when: (w, syl) => w.endsWith("mony") && syl >= 3, re: /məni$/, sub: "moʊni" },
  { when: (w) => !w.endsWith("sense") && !w.endsWith("fense"), re: /([ɪɛ])ns$/, sub: "əns" },
  { when: (w) => w.endsWith("inger"), re: /ndʒɝ$/, sub: "ŋɝ" },
  { when: (w) => w.endsWith("unger") || w.endsWith("onger"), re: /ndʒɝ$/, sub: "ŋɡɝ" },
  { when: (w) => w === "ache" || (w.endsWith("ache") && w.length >= 7), re: /[æə]tʃ[əɪ]?$/, sub: "eɪk" },
  {
    when: (w, syl) =>
      w.endsWith("ard") && syl >= 2 &&
      !/[yh]ard$/.test(w) && !/card$/.test(w) &&
      !/(?:(?<!g)gard|guard)$/.test(w) && !/bard$/.test(w),
    re: /ɑɹd$/, sub: "ɝd",
  },
  // Latin-stem endings: schwa before final consonant cluster should be /ɛ/ not /ə/
  // -ect (connect/elect/affect), -ept (accept/concept), -end (amend/offend), -ext (subtext)
  { when: (w) => /(?:ect|ept|ext)$/.test(w), re: /ə([kp]t|kst)$/, sub: "ɛ$1" },
  { when: (w, syl) => w.endsWith("end") && syl >= 2, re: /ənd$/, sub: "ɛnd" },
  { when: (w) => w.endsWith("itis"), re: /ɪtɪs$/, sub: "aɪtɪs" },
  // Polysyllabic -tice/-vice: unstressed final syllable should be /ɪs/ not /aɪs/
  // Guards protect entice(6)/advice(6)/device(6) via length, and service/crevice via -vice≥7
  {
    when: (w) => (w.length >= 7 && w.endsWith("tice")) || (w.length >= 7 && w.endsWith("vice")),
    re: /aɪs$/, sub: "ɪs",
  },
  // -ange → /eɪndʒ/ (change/range/strange/exchange); guard -lange (flange/phalange stay /æ/)
  { when: (w) => w.endsWith("ange") && !w.endsWith("lange"), re: /ændʒ$/, sub: "eɪndʒ" },
  // -erous/-arous/-orous/-urous: unstressed -er- is /ɝ/ (generous/cancerous/boisterous)
  { when: (w) => /(?:erous|arous|orous|urous)$/.test(w), re: /ɪɹəs$/, sub: "ɝəs" },
  // -ious/-eous: unstressed -i- before vowel cluster is /i/ not /ɪ/ (serious/obvious/furious)
  { when: (w) => /(?:ious|eous)$/.test(w), re: /ɪəs$/, sub: "iəs" },
  // Open-syllable long-a before sonorant-initial suffix (favor/raven/famous/savor/craven)
  { when: (w) => /(?:aven|avor|avour)$/.test(w), re: /æv(ɝ|ən)$/, sub: "eɪv$1" },
  { when: (w) => w.endsWith("amous"), re: /æm(əs)$/, sub: "eɪm$1" },
  // -ion (non-tion/-sion): unstressed -i- before -ən should be /i/ not /ɪ/ (carrion/clarion/ganglion)
  { when: (w) => /ion$/.test(w) && !/(?:tion|sion)$/.test(w), re: /ɪən$/, sub: "iən" },
  { when: (w) => !w.endsWith("cission"), re: /sɪʃən$/, sub: "zɪʃən" },
  { when: (w) => w.length >= 9, re: /ɪɹeɪʃən$/, sub: "ɝeɪʃən" },
  { when: (w) => w.endsWith("iment"), re: /ɪmənt$/, sub: "əmənt" },
  { when: (w) => w.endsWith("ancy"), re: /ænsi$/, sub: "ənsi" },
  { when: (w) => w.endsWith("erage") || w.endsWith("erature"), re: /ɛɹ/g, sub: "ɝ" },
  { when: (w) => w.startsWith("mechan"), re: /tʃ/, sub: "k" },

  // — Germanic <ei> → /aɪ/ and hard <g> —
  { when: (w) => w.startsWith("ei") && !/^ei(ght|ther)/.test(w), re: /^eɪ/, sub: "aɪ" },
  {
    when: (w) => GERMANIC_EI_SUFFIX_RE.test(w) && w.includes("ei") && !w.includes("eight"),
    re: /eɪ/g, sub: "aɪ",
  },
  {
    when: (w) =>
      w.includes("ei") &&
      (w.startsWith("klein") || w.startsWith("drei") || w.startsWith("breit") ||
        w.startsWith("mein") || w.startsWith("meio") || w.startsWith("wei") ||
        (w.startsWith("feig") && !w.startsWith("feigh")) ||
        (w.startsWith("hei") && !/^hei(?:nous|fer|r$|res|ress)/.test(w)) ||
        (w.startsWith("lei") && w.length >= 6 && !/^lei(?:sure|s$)/.test(w)) ||
        (w.startsWith("pf") && w.includes("ei"))),
    re: /eɪ/g, sub: "aɪ",
  },
  { when: (w) => w.includes("seism"), re: /eɪ/g, sub: "aɪ" },
  { when: (w) => w.includes("reif") && w.length >= 5, re: /ɹeɪf/, sub: "ɹaɪf" },
  { when: (w) => w.length >= 5 && /eidt?$/.test(w), re: /eɪ([dt]?)$/, sub: "aɪ$1" },
  {
    when: (w) => /(?:thet|theis|thesis|thesia|thentic|theon)/.test(w),
    re: /ð/g, sub: "θ",
  },
  { when: (w) => /ach(?:en|er)$/.test(w), re: /tʃ([ɛəɪ])/, sub: "k$1" },
  {
    when: (w) =>
      /^g[ei]/.test(w) &&
      /(?:berg|stein(?:er)?|heim(?:er)?|bach|wald|feld|brand|mann|kamp|wein|bein)$/.test(w),
    re: /^dʒ/, sub: "ɡ",
  },
  {
    when: (w) =>
      /(?:berg|burg)$/.test(w) && (w.includes("ge") || w.includes("gi")) &&
      !w.includes("nge") && !w.includes("ngi"),
    re: /dʒ/g, sub: "ɡ",
  },
  {
    when: (w) =>
      (w.startsWith("berg") && w.length >= 6 && !/(?:ey|y)$/.test(w)) ||
      (w.startsWith("mcg") && w.length >= 5 && !/orge$/.test(w)),
    re: /dʒ/g, sub: "ɡ",
  },
  { when: (w) => w.startsWith("beg") && w.length >= 5, re: /^bɪdʒ/, sub: "bɪɡ" },
  {
    when: (w) =>
      (w.length >= 5 && (w.startsWith("gei") || /^gel[dbns]/.test(w) || w.startsWith("get"))) ||
      /^gi[dvm]/.test(w) ||
      (w.startsWith("gig") && w.length >= 4 && !/^gig(?:i$|lio|lia|lo|ot|ol)/.test(w)) ||
      (w.startsWith("ges") && w.length >= 5 && !/^gest(?:ure|iculat|ation|ural|at|alt|urin|al)/.test(w) && w !== "geske") ||
      (w.startsWith("geh") && w.length >= 5 && !/^geh(?:le|res|rke)$/.test(w)),
    re: /^dʒ/, sub: "ɡ",
  },
  { when: (w) => /(?:ingen|angen)$/.test(w) && w.length >= 7, re: /dʒ([əɛɪ]n)$/, sub: "ɡ$1" },
  {
    when: (w) =>
      w.includes("eigen") ||
      (w.includes("eig") && (w.startsWith("wei") || (w.startsWith("feig") && !w.startsWith("feigh")))),
    re: /dʒ([əɛɪ])/g, sub: "ɡ$1",
  },
  {
    when: (w) =>
      w.endsWith("gel") && w.length >= 5 &&
      !/(?:cudgel|gudgel|kegel|nigel|rigel|bagel|angel|evangel|rangel|dgel)$/.test(w),
    re: /dʒ([əɛɪ][lɫ]?)$/, sub: "ɡ$1",
  },
  {
    when: (w) =>
      w.endsWith("ger") &&
      ((w.length >= 7 && /[bcdfghjklmnpqrstvwxyz]{2}ger$/.test(w)) ||
        (w.length >= 8 && !/(?:anger|inger|onger|enger|ager)$/.test(w))),
    re: /dʒɝ$/, sub: "ɡɝ",
  },
  {
    when: (w) => w.endsWith("gers") && w.length >= 7 && !/(?:[ao]ngers|agers|ingers|ungers)$/.test(w),
    re: /dʒɝz$/, sub: "ɡɝz",
  },
  {
    when: (w) => w.endsWith("gen") && w.length >= 7 && /[bcdfghjklmnpqrstvwxyz]{2}gen$/.test(w),
    re: /dʒən$/, sub: "ɡən",
  },
  {
    when: (w) => (w.endsWith("ford") && w.length > 4) || /(?:worth|world|works?)$/.test(w),
    re: /ɔɹ(d|θ|ld|ks?)$/, sub: "ɝ$1",
  },
  { when: (w) => w.endsWith("fort") && w.length > 4, re: /fɔɹt$/, sub: "fɝt" },

  // — Vowel digraphs —
  { when: (w) => w.includes("oe") && w.length >= 4, re: /ɑɛ/g, sub: "oʊ" },
  { when: (w) => w.includes("ae") && w.length >= 4, re: /æɛ/g, sub: "ɛ" },
  { when: (w) => w.includes("eo") && !w.includes("ae") && w.length >= 4, re: /ɛoʊ/g, sub: "ioʊ" },

  // — French loanwords —
  { when: (w) => w.endsWith("ouquet"), re: /aʊkw[ɛə]t$/, sub: "ukeɪ" },
  { when: (w) => w.endsWith("quet") && !w.endsWith("nquet") && !w.endsWith("mquet"), re: /kw[ɛə]t$/, sub: "keɪ" },
  { when: (w) => w.endsWith("ochet"), re: /tʃ[ɛə]t$/, sub: "ʃeɪ" },
  { when: (w) => w.endsWith("achet"), re: /[ɛɪə]t$/, sub: "eɪ" },
  { when: (w) => w.endsWith("alet"), re: /[ɛɪə]t$/, sub: "eɪ" },
  { when: (w) => w.endsWith("ette") && w.length >= 5, re: /([^ɛɪæaouʊə])t$/, sub: "$1ɛt" },
  {
    when: (w) =>
      w.endsWith("oise") && w.length >= 7 &&
      !/^(?:noise|turquoise|vichyssoise|francoise|laframboise)/.test(w),
    re: /ɔɪz$/, sub: "əs",
  },
  { when: (w) => w.endsWith("augh") && w.length > 4, re: /ə$/, sub: "ɔ" },
  { when: (w) => w.endsWith("borough") && w.length > 7, re: /[əʌ]f$/, sub: "oʊ" },
  { when: (w) => w.endsWith("urious") && w.length >= 7, re: /^([kf])ʌɹ/, sub: "$1jʊɹ" },
  { when: (w) => /olumn|olemn/.test(w), re: /oʊl([əm])/, sub: "ɑl$1" },
  { when: (w) => w.startsWith("acou"), re: /aʊ/, sub: "u" },
  {
    when: (w) => w.endsWith("gue") && w.length >= 4 && !/^(?:argue|ague|montague)$/.test(w),
    re: /ɡu$/, sub: "ɡ",
  },
  {
    when: (w) => w.endsWith("ois") && !w.endsWith("quois") && !w.endsWith("lois") && !w.endsWith("bois"),
    re: /ɔɪs$/, sub: "wɑ",
  },
  { when: (w) => w.endsWith("ais"), re: /eɪs$/, sub: "eɪ" },
  { when: (w) => w.endsWith("oir"), re: /ɔɪɹ$/, sub: "wɑɹ" },
  { when: (w) => w.endsWith("oux"), re: /aʊks?$/, sub: "u" },
  { when: (w) => w.includes("oup"), re: /aʊp/g, sub: "up" },
  { when: (w) => w.includes("oui") || w.includes("ouill"), re: /aʊɪ/g, sub: "ui" },
  { when: (w) => w.includes("ouv"), re: /aʊv/g, sub: "uv" },
  { when: (w) => w.endsWith("eau") && w.includes("ou"), re: /aʊ/g, sub: "u" },
  { when: (w) => w.endsWith("ou") && w !== "you" && w !== "thou", re: /aʊ$/, sub: "u" },
  { when: (w) => /[bmdvl]our$/.test(w) && w !== "devour" && w !== "flour", re: /aʊɹ$/, sub: "ɝ" },
  { when: (w) => w.endsWith("oussin"), re: /aʊs/, sub: "us" },
  { when: (w) => w.endsWith("ingham") && w.length >= 9, re: /həm$/, sub: "hæm" },
  { when: (w) => w.endsWith("tron"), re: /tɹən$/, sub: "tɹɑn" },
  { when: (w) => w.endsWith("gren"), re: /ɡɹən$/, sub: "ɡɹɛn" },
  { when: (w) => w.endsWith("craft") || w.endsWith("graft"), re: /ɹ[əʌ]ft$/, sub: "ɹæft" },

  // — Greek / Germanic <ch> → /k/ —
  { when: (w) => /(?:echt|icht)$/.test(w), re: /tʃt$/, sub: "kt" },
  { when: (w) => w.endsWith("hagen"), re: /dʒ([ɛəɪ])n$/, sub: "ɡ$1n" },
  { when: (w) => /(?:gerd|gert)$/.test(w), re: /dʒɝ([dt])$/, sub: "ɡɝ$1" },
  { when: (w) => w.startsWith("kh"), re: /^kh/, sub: "k" },
  { when: (w) => w.startsWith("dh"), re: /^dh/, sub: "d" },
  { when: (w) => w.startsWith("orch"), re: /^ɔɹtʃ/, sub: "ɔɹk" },
  { when: (w) => w.includes("chord"), re: /tʃ([ɔɑɝ])/, sub: "k$1" },
  { when: (w) => w.includes("anchor"), re: /tʃ/, sub: "k" },
  {
    when: (w) => w.includes("och") && !w.endsWith("och") && !w.endsWith("oche") && !/och[cfpt]/.test(w),
    re: /[ɑɔ]tʃ/g, fn: (m) => m[0] + "k",
  },
  {
    when: (w) => w.endsWith("och") && !w.endsWith("oach") && !w.endsWith("eoch"),
    re: /[ɑɔ]tʃ$/, fn: (m) => m[0] + "k",
  },
  {
    when: (w) => w.includes("acht") && !/(?:macht|nacht|wacht)/.test(w),
    re: /[æɑ]tʃt/g, fn: (m) => m[0] + "kt",
  },
  {
    when: (w) => w.includes("achen") || w.includes("achn"),
    re: /[æɑ]tʃ([ɛəɪi]n|n)/, fn: (m, s) => m[0] + "k" + s,
  },
  {
    when: (w) =>
      /^arch[aeiou]/.test(w) && !w.startsWith("archen") && !/^arch(?:er|ery|es|ie|ies|ed)$/.test(w),
    re: /^ɑɹtʃ/, sub: "ɑɹk",
  },
  { when: (w) => w.endsWith("chter") && w.length >= 6, re: /tʃtɝ$/, sub: "ktɝ" },
  {
    when: (w) => w.endsWith("chner") && w.length >= 6 && !/tch(?:ner)$/.test(w),
    re: /tʃ(?=[nɝ])/, sub: "k",
  },
  {
    when: (w) =>
      w.length >= 7 && /[bcdfghjklmnpqrstvwxyz](?:acher|icher)$/.test(w) &&
      !/(?:eacher|oocher|picher|spicher)$/.test(w) &&
      !/^(?:teacher|preacher|bleacher|reacher|poacher|beacher|beecher|breacher)/.test(w),
    re: /tʃ(ɝ)$/, sub: "k$1",
  },
  { when: (w) => w.endsWith("lich") && w.length >= 6 && !/[auo]lich$/.test(w), re: /tʃ$/, sub: "k" },
  {
    when: (w) =>
      /(?:achel|ichel|echel)$/.test(w) && w.length >= 6 && !/(?:rachel|michael|machel)$/.test(w),
    re: /tʃ([əɛɪ][lɫ]?)$/, sub: "k$1",
  },
  {
    when: (w) => w.includes("echt") && !/(?:echt|icht)$/.test(w) && !/echtl|echta/.test(w),
    re: /ɛtʃt/g, sub: "ɛkt",
  },
  {
    when: (w) =>
      w.includes("ach") && !w.endsWith("ach") && !w.endsWith("ache") &&
      !/ach[aeiou]/.test(w) && /ach[nblrm]/.test(w) && !w.includes("tach"),
    re: /[æɑ]tʃ(?=[nblrm])/, fn: (m) => m[0] + "k",
  },
  {
    when: (w) =>
      w.includes("uch") && /uch[nblrm]/.test(w) &&
      !/^(?:much|such|touch|vouch|pouch|couch|ouch|crouch|grouch|slouch)/.test(w) &&
      !/^(?:bou|gou|lou|tou|vou)ch/.test(w) && !/uch[aeiou]$/.test(w),
    re: /[ʌʊ]tʃ(?=[nblrm])/, fn: (m) => m[0] + "k",
  },

  // — Italian <cc(h)i> → /k/ ~ /tʃ/ —
  { when: (w) => w.includes("cchi"), re: /ktʃ/g, sub: "kk" },
  { when: (w) => w.includes("cchi"), re: /tʃ/g, sub: "k" },
  { when: (w) => /chet(?:ti|ta|to|te)$/.test(w) && w.length >= 6, re: /tʃ/g, sub: "k" },
  { when: (w) => /cci[oa]?$/.test(w), re: /ks([ɪi]?)(oʊ|ə|ʊ|eɪ|a)?$/, sub: "tʃ$1$2" },
  {
    when: (w) => w.includes("cci") && !/cci[oa]?$/.test(w) && !/ccid|ccip|ccint|ccent/.test(w),
    re: /ksɪ([ɑɔɛ])/g, sub: "tʃ$1",
  },
  {
    when: (w) =>
      w.includes("cci") && !/cci[oa]?$/.test(w) && /(?:ini|ino|elli|ello|illi|illo|iani|iano)$/.test(w),
    re: /ksɪ/g, sub: "tʃɪ",
  },
  { when: (w) => w.includes("eich") && w.length >= 5, re: /eɪ/g, sub: "aɪ" },
  { when: (w) => w.includes("eich") && w.length >= 5, re: /aɪtʃ/g, sub: "aɪk" },
];

// --- Stress-mark conventions (applied AFTER the primary mark is inserted) ---

const IPA_V = "aeiouɑæɛɪɔʊʌəɝ";
const IPA_C = "pbtdkɡfvszʃʒθðmnŋɫlɹhjw";

// Dict convention is maximal onset: the stress mark sits before the
// stressed syllable's onset. The syllabifier sometimes leaves a coda
// consonant behind (ad.dict → ədˈɪkt); pull it into the onset. The
// dict itself contains zero VCˈV sequences, so this is convention
// repair, not phonology.
const ONSET_MAX_1_RE = new RegExp(`([${IPA_V}])([${IPA_C}])ˈ(?=[${IPA_V}])`, "g");
// Same across a two-consonant cluster when it is a legal onset
// (a.ggres.sion → əˈɡɹɛʃən). Obstruent+liquid/glide only: dict splits
// s+C heterosyllabically (æsˈfɪksi), so s-initial clusters stay put.
const ONSET_MAX_2_RE = new RegExp(
  `([${IPA_V}])([${IPA_C}])ˈ([${IPA_C}])(?=[${IPA_V}])`,
  "g",
);
const ONSET_CLUSTERS = new Set([
  "pɹ", "tɹ", "kɹ", "bɹ", "dɹ", "ɡɹ", "fɹ", "θɹ", "ʃɹ",
  "pl", "bl", "kl", "ɡl", "fl",
  "pɫ", "bɫ", "kɫ", "ɡɫ", "fɫ",
  "tw", "kw", "dw", "ɡw", "hw",
]);

/** Count distinct vowel nuclei (vowel-char runs) in ipa[from..to). */
function nucleiBetween(ipa: string, from: number, to: number): number {
  let n = 0;
  let inV = false;
  for (let i = from; i < to; i++) {
    if (IPA_V.includes(ipa[i])) {
      if (!inV) n++;
      inV = true;
    } else inV = false;
  }
  return n;
}

/**
 * Insert a secondary-stress mark before the onset of the suffix
 * syllable located by `suffixRe`, when the suffix sits at least one
 * full syllable after the primary (ˈæɡəˌnaɪz but əˈbeɪt) and isn't
 * already marked.
 */
function addSecondary(ipa: string, suffixRe: RegExp): string {
  const m = suffixRe.exec(ipa);
  if (!m) return ipa;
  let onset = m.index;
  while (onset > 0 && IPA_C.includes(ipa[onset - 1])) onset--;
  // A lone /ɹ/ onset after lax ɪ/ə coalesces with it later in the
  // phonotactic pass (ɪɹ → ɝ). Keep the pair intact and mark after it
  // (dict: ədʌɫtɝˌeɪt, not ədʌɫtɪˌɹeɪt).
  if (
    onset === m.index - 1 &&
    ipa[onset] === "ɹ" &&
    onset > 0 &&
    (ipa[onset - 1] === "ɪ" || ipa[onset - 1] === "ə")
  )
    onset = m.index;
  if (onset > 0 && (ipa[onset - 1] === "ˌ" || ipa[onset - 1] === "ˈ")) return ipa;
  const pi = ipa.indexOf("ˈ");
  if (pi < 0 || pi > onset) return ipa;
  if (nucleiBetween(ipa, pi, onset) < 2) return ipa;
  return ipa.slice(0, onset) + "ˌ" + ipa.slice(onset);
}

// Suffixes that carry secondary stress on their own syllable.
const SECONDARY_SUFFIXES: Array<[RegExp, RegExp]> = [
  [/iz(?:es?|ed|ing)?$/, /aɪz/],
  [/at(?:es?|ed|ing)?$/, /eɪt(?!.*eɪt)/],
  [/ism$/, /ɪzəm$/],
  [/ory$/, /ɔɹi$/],
];

// -ation attracts primary stress onto its own syllable; the stem's
// former primary demotes to secondary (abbreviate əˈbɹiviˌeɪt →
// abbreviation əˌbɹiviˈeɪʃən).
const ATION_SWAP_RE = /ˈ(.*)ˌeɪʃən$/;

/**
 * Stress-mark convention repair for the rule path, applied after
 * predictInternal inserts the primary mark: onset-maximize the mark
 * position, add suffix secondary stress, shift primary onto -ation.
 */
export function applyPostStress(ipa: string, word: string): string {
  let out = ipa;
  if (out.indexOf("ˈ") < 0) return out;
  out = out.replace(ONSET_MAX_1_RE, (m, v, c) =>
    // Leave coalescing ɪɹ/əɹ pairs intact (→ ɝ in the phonotactic pass).
    c === "ɹ" && (v === "ɪ" || v === "ə") ? m : v + "ˈ" + c,
  );
  out = out.replace(ONSET_MAX_2_RE, (m, v, c1, c2) =>
    ONSET_CLUSTERS.has(c1 + c2) ? v + "ˈ" + c1 + c2 : m,
  );
  if (word.endsWith("ation")) return out.replace(ATION_SWAP_RE, "ˌ$1ˈeɪʃən");
  for (const [wordRe, ipaRe] of SECONDARY_SUFFIXES) {
    if (wordRe.test(word)) return addSecondary(out, ipaRe);
  }
  return out;
}

/**
 * Apply the unconditional cleanup then the guarded corrections, in
 * table order, to the joined syllable IPA of the rule path.
 */
export function applyPostLexical(ipa: string, word: string, sylCount: number): string {
  let out = ipa;
  for (const [from, to] of POST_PROC_RULES) out = out.replace(from, to);
  for (const rule of POST_LEX_RULES) {
    if (!rule.when(word, sylCount)) continue;
    out = rule.fn !== undefined ? out.replace(rule.re, rule.fn) : out.replace(rule.re, rule.sub!);
  }
  return out;
}
