/**
 * Russian text normalization for preProcess.
 *
 * Reads cardinals positionally in the nominative case (masculine where
 * gender matters, feminine for the thousands group since "тысяча" is
 * feminine). Plural agreement is applied for thousand/million/billion
 * scales and for the recurring units (рубль/доллар/процент/etc.) using
 * the standard 1 / 2-4 / 5+ split.
 *
 * What's intentionally NOT here: case agreement with the counted noun
 * past the immediate currency/percent words. Reading "5 книг" as
 * "пять книг" vs "пять книги" requires morphological analysis of the
 * surrounding noun, which is out of scope for a text-only preProcess.
 */

const RU_ONES = [
  "ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать",
  "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];

const RU_TENS: Record<number, string> = {
  20: "двадцать", 30: "тридцать", 40: "сорок", 50: "пятьдесят",
  60: "шестьдесят", 70: "семьдесят", 80: "восемьдесят", 90: "девяносто",
};

const RU_HUNDREDS: Record<number, string> = {
  100: "сто", 200: "двести", 300: "триста", 400: "четыреста",
  500: "пятьсот", 600: "шестьсот", 700: "семьсот", 800: "восемьсот", 900: "девятьсот",
};

type PluralForms = [one: string, few: string, many: string];

const THOUSAND_FORMS: PluralForms = ["тысяча", "тысячи", "тысяч"];
const MILLION_FORMS: PluralForms = ["миллион", "миллиона", "миллионов"];
const BILLION_FORMS: PluralForms = ["миллиард", "миллиарда", "миллиардов"];
const PERCENT_FORMS: PluralForms = ["процент", "процента", "процентов"];
const RUBLE_FORMS: PluralForms = ["рубль", "рубля", "рублей"];
const DOLLAR_FORMS: PluralForms = ["доллар", "доллара", "долларов"];

function pluralForm(n: number, forms: PluralForms): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  const mod10 = n % 10;
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

function readUnder1000(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100) * 100;
  if (hundreds > 0) parts.push(RU_HUNDREDS[hundreds]);
  const remainder = n % 100;
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(RU_ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10) * 10;
      const ones = remainder % 10;
      parts.push(RU_TENS[tens]);
      if (ones > 0) parts.push(RU_ONES[ones]);
    }
  }
  return parts.join(" ");
}

/**
 * Feminine variant for the thousands group: "тысяча" is grammatically
 * feminine, so its preceding 1/2 take feminine forms (одна, две).
 */
function readThousandsGroup(n: number): string {
  let result = readUnder1000(n);
  result = result.replace(/(^| )один$/, "$1одна");
  result = result.replace(/(^| )два$/, "$1две");
  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return RU_ONES[0];
  if (n < 0) return "минус " + numberToWords(-n);

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const base = n % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(readUnder1000(billions), pluralForm(billions, BILLION_FORMS));
  if (millions > 0) parts.push(readUnder1000(millions), pluralForm(millions, MILLION_FORMS));
  if (thousands > 0) parts.push(readThousandsGroup(thousands), pluralForm(thousands, THOUSAND_FORMS));
  if (base > 0) parts.push(readUnder1000(base));
  return parts.join(" ");
}

function readWithUnit(numStr: string, forms: PluralForms): string {
  const n = parseInt(numStr, 10);
  return numberToWords(n) + " " + pluralForm(n, forms);
}

export function expandRussianText(text: string): string {
  // Currency: ₽ / руб. → рублей, $ → долларов. Require the abbreviation
  // dot to avoid eating "руб" from a full word like "рублей".
  text = text.replace(/(\d+)\s*(?:₽|руб\.)/g, (_, n) => readWithUnit(n, RUBLE_FORMS));
  text = text.replace(/\$\s*(\d+)/g, (_, n) => readWithUnit(n, DOLLAR_FORMS));

  // Percent.
  text = text.replace(/(\d+)%/g, (_, n) => readWithUnit(n, PERCENT_FORMS));

  // Decimal: "3,14" or "3.14" → "три целых четырнадцать сотых"-style is
  // verbose; the digit-by-digit "три точка один четыре" stays understandable
  // and avoids case-ridden fraction names.
  text = text.replace(/(\d+)[.,](\d+)/g, (_, w, d) => {
    const whole = numberToWords(parseInt(w, 10));
    const frac = d.split("").map((c: string) => RU_ONES[parseInt(c, 10)] ?? c).join(" ");
    return whole + " точка " + frac;
  });

  // Remaining integers.
  text = text.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));

  return text;
}
