/**
 * Japanese text normalization for preProcess: converts Arabic digits to
 * hiragana so the downstream ja-g2p (romaji-based after anyAscii) can read
 * them.
 *
 * Outputs hiragana in base form without rendaku — ja-g2p's syllable map
 * lacks the palatal voiced rows (bya/pya/…), so emitting さんびゃく would
 * produce broken phonemes for the びゃ slot. We accept さんひゃく etc. as
 * the imperfect-but-tokenizable compromise.
 */

const JA_DIGITS = [
  "ぜろ",
  "いち",
  "に",
  "さん",
  "よん",
  "ご",
  "ろく",
  "なな",
  "はち",
  "きゅう",
];
const JA_TEN = "じゅう";
const JA_HUNDRED = "ひゃく";
const JA_THOUSAND = "せん";
const JA_TEN_THOUSAND = "まん";
const JA_HUNDRED_MILLION = "おく";

function readSection(n: number): string {
  if (n === 0) return "";
  let result = "";
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (thousands > 0) {
    result += (thousands === 1 ? "" : JA_DIGITS[thousands]) + JA_THOUSAND;
  }
  if (hundreds > 0) {
    result += (hundreds === 1 ? "" : JA_DIGITS[hundreds]) + JA_HUNDRED;
  }
  if (tens > 0) {
    result += (tens === 1 ? "" : JA_DIGITS[tens]) + JA_TEN;
  }
  if (ones > 0) {
    result += JA_DIGITS[ones];
  }
  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return JA_DIGITS[0];
  if (n < 0) return "マイナス" + numberToWords(-n);

  const oku = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  const base = n % 10000;

  let result = "";
  if (oku > 0) result += readSection(oku) + JA_HUNDRED_MILLION;
  if (man > 0) result += readSection(man) + JA_TEN_THOUSAND;
  if (base > 0) result += readSection(base);
  return result;
}

function digitByDigit(s: string): string {
  return s
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? JA_DIGITS[c.charCodeAt(0) - 0x30] : c))
    .join("");
}

export function expandJapaneseText(text: string): string {
  // Year + 年 → full positional reading (にせんにじゅうよねん). Japanese
  // TTS typically reads years compositionally, not digit-by-digit.
  text = text.replace(
    /(\d{4})年/g,
    (_, year) => numberToWords(parseInt(year, 10)) + "ねん",
  );

  // Currency: ¥/￥ → えん, $ → どる.
  text = text.replace(/[¥￥]\s*(\d+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n);
    const whole = Math.floor(num);
    return numberToWords(whole) + "えん";
  });
  text = text.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n);
    const whole = Math.floor(num);
    return numberToWords(whole) + "どる";
  });

  // Percent.
  text = text.replace(/(\d+(?:\.\d+)?)%/g, (_, n) => {
    const dot = n.indexOf(".");
    if (dot === -1) return numberToWords(parseInt(n, 10)) + "ぱーせんと";
    return (
      numberToWords(parseInt(n.slice(0, dot), 10)) +
      "てん" +
      digitByDigit(n.slice(dot + 1)) +
      "ぱーせんと"
    );
  });

  // Decimal.
  text = text.replace(
    /(\d+)\.(\d+)/g,
    (_, w, d) => numberToWords(parseInt(w, 10)) + "てん" + digitByDigit(d),
  );

  // Remaining integers.
  text = text.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));

  return text;
}
