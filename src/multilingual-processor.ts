// === JAPANESE ROMANIZATION ===
const JAPANESE_TO_PHONEME: { [key: string]: string } = {
  // Basic syllables using IPA
  ka: "ka",
  ki: "ki",
  ku: "ku",
  ke: "ke",
  ko: "ko",
  ga: "ɡa",
  gi: "ɡi",
  gu: "ɡʊ",
  ge: "ɡe",
  go: "ɡoʊ",
  sa: "sa",
  shi: "ʃi",
  su: "su",
  se: "se",
  so: "so",
  za: "za",
  ji: "dʒi",
  zu: "zu",
  ze: "ze",
  zo: "zo",
  ta: "ta",
  chi: "tʃi",
  tsu: "tsu",
  te: "te",
  to: "to",
  da: "da",
  de: "de",
  do: "do",
  na: "na",
  ni: "ni",
  nu: "nu",
  ne: "ne",
  no: "noʊ",
  ha: "ha",
  hi: "hi",
  fu: "ɸu",
  he: "he",
  ho: "hoʊ",
  ba: "ba",
  bi: "bi",
  bu: "bu",
  be: "be",
  bo: "bo",
  pa: "pa",
  pi: "pi",
  pu: "pu",
  pe: "pe",
  po: "po",
  ma: "ma",
  mi: "mi",
  mu: "mu",
  me: "me",
  mo: "mo",
  ya: "ja",
  yu: "ju",
  yo: "jo",
  ra: "ɾa",
  ri: "ɾi",
  ru: "ɾu",
  re: "ɾe",
  ro: "ɾo",
  wa: "wa",
  wo: "wo",
  n: "n",
};

// === KOREAN ROMANIZATION ===
const KOREAN_TO_PHONEME: { [key: string]: string } = {
  // Basic consonants and vowels
  g: "ɡ",
  k: "k",
  n: "n",
  d: "d",
  t: "t",
  r: "ɾ",
  l: "l",
  m: "m",
  b: "b",
  p: "p",
  s: "s",
  j: "dʒ",
  ch: "tʃ",
  h: "h",
  a: "a",
  e: "e",
  i: "i",
  o: "o",
  u: "u",
  eo: "ɡʊ",
  eu: "ɯ",
  ae: "ɛ",
  ya: "ja",
  ye: "je",
  yo: "jo",
  yu: "ju",
  yeo: "jʌ",

  // Common syllables
  an: "an",
  eong: "ʌŋ",
  ha: "ha",
  se: "se",
  gam: "ɡam",
  sa: "sa",
  hab: "hab",
  ni: "ni",
  da: "da",
  han: "hʌn",
  guk: "ɡʊɡ",
  gug: "ɡʊ",
};

// === OTHER LANGUAGES ===
const RUSSIAN_TO_PHONEME: { [key: string]: string } = {
  pri: "pɾi",
  vet: "vɛt",
  spa: "spa",
  si: "si",
  bo: "bo",
  ros: "ɾos",
  siya: "sija",
};

const GERMAN_TO_PHONEME: { [key: string]: string } = {
  mueller: "mylɚ",
  muller: "mylɚ",
  bjoern: "bjøɾn",
  bjorn: "bjøɾn",
};

const ARABIC_TO_PHONEME: { [key: string]: string } = {
  mrhb: "maɾħab",
  shkr: "ʃukɾ",
};

const THAI_TO_PHONEME: { [key: string]: string } = {
  swasdi: "sawasdi",
  khobkhun: "kʰobkʰun",
};

// === LANGUAGE DETECTION ===
export function detectLanguage(text: string): string | null {
  // Direct character detection
  if (/[\u4e00-\u9fff]/.test(text)) return "chinese";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "japanese";
  if (/[\uAC00-\uD7AF]/.test(text)) return "korean";
  if (/[\u0400-\u04FF]/.test(text)) return "russian";
  if (/[äöüÄÖÜß]/.test(text)) return "german";
  if (/[\u0600-\u06FF]/.test(text)) return "arabic";
  if (/[\u0E00-\u0E7F]/.test(text)) return "thai";
  return null;
}

// === UNIFIED PROCESSING ===
export function processMultilingualText(
  text: string,
  detectedLanguage?: string,
): string | null {
  const lang = detectedLanguage || detectLanguage(text);
  if (!lang) return null;

  switch (lang) {
    case "japanese":
      return processJapanese(text.toLowerCase());
    case "korean":
      return processKorean(text);
    case "russian":
      return processRussian(text.toLowerCase());
    case "german":
      return processGerman(text.toLowerCase());
    case "arabic":
      return processArabic(text.toLowerCase());
    case "thai":
      return processThai(text.toLowerCase());
    default:
      return null;
  }
}

function processJapanese(text: string): string {
  // Apply Japanese particle pronunciation rules
  text = applyJapaneseParticleRules(text);

  const syllables: string[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // Try 3-character combinations first
    if (i <= text.length - 3) {
      const three = text.substring(i, i + 3);
      if (JAPANESE_TO_PHONEME[three]) {
        syllables.push(JAPANESE_TO_PHONEME[three]);
        i += 3;
        matched = true;
      }
    }

    // Try 2-character combinations
    if (!matched && i <= text.length - 2) {
      const two = text.substring(i, i + 2);
      if (JAPANESE_TO_PHONEME[two]) {
        syllables.push(JAPANESE_TO_PHONEME[two]);
        i += 2;
        matched = true;
      }
    }

    // Try single character
    if (!matched) {
      const one = text[i];
      if (JAPANESE_TO_PHONEME[one]) {
        syllables.push(JAPANESE_TO_PHONEME[one]);
      } else {
        syllables.push(one.toLowerCase());
      }
      i++;
    }
  }

  return syllables.join("");
}

function applyJapaneseParticleRules(text: string): string {
  const particlePatterns = [
    // Common greetings where は is pronounced as wa
    { pattern: /konnichiha$/, replacement: "konnichiwa" },
    { pattern: /konbanha$/, replacement: "konbanwa" },
    {
      pattern: /([a-z]+)ha([a-z]+)/g,
      replacement: (match: string, p1: string, p2: string) => {
        if (isLikelyParticle(p1, p2)) {
          return p1 + "wa" + p2;
        }
        return match;
      },
    },
  ];

  let result = text;
  for (const rule of particlePatterns) {
    if (typeof rule.replacement === "string") {
      result = result.replace(rule.pattern, rule.replacement);
    } else {
      result = result.replace(rule.pattern, rule.replacement);
    }
  }

  return result;
}

function isLikelyParticle(before: string, after: string): boolean {
  const nounLikeEndings = [
    "shi",
    "tsu",
    "ku",
    "ki",
    "su",
    "se",
    "so",
    "ta",
    "te",
    "to",
  ];
  const verbLikeBeginnings = [
    "ga",
    "de",
    "ni",
    "wo",
    "ka",
    "na",
    "ma",
    "ra",
    "sa",
    "ba",
  ];

  const beforeEndsWithNoun = nounLikeEndings.some((ending) =>
    before.endsWith(ending),
  );
  const afterStartsWithVerb = verbLikeBeginnings.some((beginning) =>
    after.startsWith(beginning),
  );

  return beforeEndsWithNoun || afterStartsWithVerb || before.length >= 3;
}

function processKorean(text: string): string {
  const parts = text.match(/[A-Z][a-z]*/g) || [text];
  const phonemes: string[] = [];

  parts.forEach((part) => {
    const lower = part.toLowerCase();
    if (KOREAN_TO_PHONEME[lower]) {
      phonemes.push(KOREAN_TO_PHONEME[lower]);
    } else {
      // Basic breakdown
      for (const char of lower) {
        if (KOREAN_TO_PHONEME[char]) {
          phonemes.push(KOREAN_TO_PHONEME[char]);
        } else {
          phonemes.push(char.toLowerCase());
        }
      }
    }
  });

  return phonemes.join("");
}

function processRussian(text: string): string {
  for (const [pattern, phoneme] of Object.entries(RUSSIAN_TO_PHONEME)) {
    if (text.includes(pattern)) {
      return phoneme;
    }
  }
  return text.toLowerCase();
}

function processGerman(text: string): string {
  for (const [pattern, phoneme] of Object.entries(GERMAN_TO_PHONEME)) {
    if (text.includes(pattern)) {
      return phoneme;
    }
  }
  return text.toLowerCase();
}

function processArabic(text: string): string {
  for (const [pattern, phoneme] of Object.entries(ARABIC_TO_PHONEME)) {
    if (text.includes(pattern)) {
      return phoneme;
    }
  }
  // Add vowels to consonant clusters
  return text
    .split("")
    .map((char) => {
      const consonants = "bcdfghjklmnpqrstvwxyz";
      return consonants.includes(char)
        ? char.toLowerCase() + "ʌ"
        : char.toLowerCase();
    })
    .join("");
}

function processThai(text: string): string {
  for (const [pattern, phoneme] of Object.entries(THAI_TO_PHONEME)) {
    if (text.includes(pattern)) {
      return phoneme;
    }
  }
  return text.toLowerCase();
}

export function isMultilingualText(text: string): boolean {
  return detectLanguage(text) !== null;
}
