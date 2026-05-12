/**
 * Korean text normalization for preProcess: converts Arabic digits to
 * Sino-Korean Hangul. anyAscii then romanizes to the camelCase syllable
 * form (e.g. "백" → "Baek") that ko-g2p expects.
 *
 * Only the Sino-Korean system (일·이·삼 …) is implemented; the native
 * counter system (하나·둘·셋 …) requires per-counter context detection
 * and is left for a later pass.
 */

const KO_DIGITS = [
  "영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구",
];
const KO_TEN = "십";
const KO_HUNDRED = "백";
const KO_THOUSAND = "천";
const KO_TEN_THOUSAND = "만";
const KO_HUNDRED_MILLION = "억";

function readSection(n: number): string {
  if (n === 0) return "";
  let result = "";
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (thousands > 0) {
    result += (thousands === 1 ? "" : KO_DIGITS[thousands]) + KO_THOUSAND;
  }
  if (hundreds > 0) {
    result += (hundreds === 1 ? "" : KO_DIGITS[hundreds]) + KO_HUNDRED;
  }
  if (tens > 0) {
    result += (tens === 1 ? "" : KO_DIGITS[tens]) + KO_TEN;
  }
  if (ones > 0) {
    result += KO_DIGITS[ones];
  }
  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return KO_DIGITS[0];
  if (n < 0) return "마이너스" + numberToWords(-n);

  const eok = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  const base = n % 10000;

  let result = "";
  if (eok > 0) result += readSection(eok) + KO_HUNDRED_MILLION;
  if (man > 0) result += readSection(man) + KO_TEN_THOUSAND;
  if (base > 0) result += readSection(base);
  return result;
}

function digitByDigit(s: string): string {
  return s
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? KO_DIGITS[c.charCodeAt(0) - 0x30] : c))
    .join("");
}

export function expandKoreanText(text: string): string {
  // Year + 년 → digit-by-digit reading is uncommon; full Sino reading is
  // standard (이천이십사년 for 2024년).
  text = text.replace(/(\d{4})년/g, (_, year) => numberToWords(parseInt(year, 10)) + "년");

  // Currency: ₩ or 원 suffix → 원.
  text = text.replace(/₩\s*(\d+)/g, (_, n) => numberToWords(parseInt(n, 10)) + "원");
  text = text.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n);
    return numberToWords(Math.floor(num)) + "달러";
  });

  // Percent.
  text = text.replace(/(\d+(?:\.\d+)?)%/g, (_, n) => {
    const dot = n.indexOf(".");
    if (dot === -1) return numberToWords(parseInt(n, 10)) + "퍼센트";
    return numberToWords(parseInt(n.slice(0, dot), 10)) + "점" +
      digitByDigit(n.slice(dot + 1)) + "퍼센트";
  });

  // Decimal.
  text = text.replace(/(\d+)\.(\d+)/g, (_, w, d) =>
    numberToWords(parseInt(w, 10)) + "점" + digitByDigit(d),
  );

  // Remaining integers.
  text = text.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));

  return text;
}
