/**
 * Chinese text normalization for preProcess: converts Arabic digits and
 * common typographic forms into their spoken Chinese characters so the
 * downstream G2P (pinyin-pro) can read them.
 *
 * Outputs Han characters; works regardless of the surrounding text's
 * dialect, since pinyin-pro covers Mandarin readings.
 */

const ZH_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const ZH_UNITS_4 = ["", "十", "百", "千"];
const ZH_BIG_SCALES = ["", "万", "亿", "万亿", "亿亿"];

/**
 * Read 1..9999 as Chinese characters with internal 零 fill. Returns "" for 0.
 * Always emits 一十 in the tens place; the public entry trims leading 一十
 * when the entire number is in the 10..19 range (where 十 alone is canonical).
 */
function readSection(n: number): string {
  if (n === 0) return "";
  let result = "";
  let pendingZero = false;
  let factor = 1000;
  for (let i = 3; i >= 0; i--) {
    const digit = Math.floor(n / factor) % 10;
    if (digit === 0) {
      if (result.length > 0) pendingZero = true;
    } else {
      if (pendingZero) {
        result += "零";
        pendingZero = false;
      }
      result += ZH_DIGITS[digit] + ZH_UNITS_4[i];
    }
    factor = Math.floor(factor / 10);
  }
  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return "零";
  if (n < 0) return "负" + numberToWords(-n);

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 10000);
    rest = Math.floor(rest / 10000);
  }

  let result = "";
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const scaleIdx = groups.length - 1 - i;
    if (g === 0) {
      // Empty intermediate group: insert a single 零 if a later group is
      // non-zero, so that e.g. 100000001 reads 一亿零一 not 一亿一.
      if (
        result.length > 0 &&
        !result.endsWith("零") &&
        groups.slice(i + 1).some((x) => x !== 0)
      ) {
        result += "零";
      }
      continue;
    }
    // Bridge a missing 千 digit between groups (e.g. 10001 → 一万零一).
    if (result.length > 0 && g < 1000 && !result.endsWith("零")) {
      result += "零";
    }
    result += readSection(g);
    result += ZH_BIG_SCALES[scaleIdx];
  }

  if (n >= 10 && n < 20) {
    result = result.replace(/^一十/, "十");
  }
  return result;
}

function digitByDigit(s: string): string {
  return s
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? ZH_DIGITS[c.charCodeAt(0) - 0x30] : c))
    .join("");
}

function readDecimal(intPart: string, decPart: string): string {
  const whole = parseInt(intPart, 10);
  return numberToWords(whole) + "点" + digitByDigit(decPart);
}

function readCurrency(amount: string, unit: string): string {
  const dot = amount.indexOf(".");
  if (dot === -1) {
    return numberToWords(parseInt(amount, 10)) + unit;
  }
  const whole = parseInt(amount.slice(0, dot), 10);
  const fractional = amount.slice(dot + 1).padEnd(2, "0").slice(0, 2);
  const jiao = parseInt(fractional[0], 10);
  const fen = parseInt(fractional[1], 10);
  let result = numberToWords(whole) + unit;
  if (jiao > 0) result += ZH_DIGITS[jiao] + "角";
  if (fen > 0) result += ZH_DIGITS[fen] + "分";
  return result;
}

export function expandChineseText(text: string): string {
  // Year + 年 → digit-by-digit (一九九五年 rather than 一千九百九十五年).
  text = text.replace(/(\d{4})年/g, (_, year) => digitByDigit(year) + "年");

  // Currency: ¥/￥ -> 元, $ -> 美元.
  text = text.replace(/[¥￥]\s*(\d+(?:\.\d+)?)/g, (_, amt) => readCurrency(amt, "元"));
  text = text.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, amt) => readCurrency(amt, "美元"));

  // Time HH:MM (24-hour or 12-hour, no AM/PM handling).
  text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => {
    const hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    const head = numberToWords(hours) + "点";
    if (minutes === 0) return head + "整";
    return head + numberToWords(minutes) + "分";
  });

  // Ordinal 第N → 第 + cardinal reading.
  text = text.replace(/第(\d+)/g, (_, n) => "第" + numberToWords(parseInt(n, 10)));

  // Percent: pulled before generic decimal so the % suffix is consumed.
  text = text.replace(/(\d+(?:\.\d+)?)%/g, (_, n) => {
    const dot = n.indexOf(".");
    if (dot === -1) return "百分之" + numberToWords(parseInt(n, 10));
    return "百分之" + readDecimal(n.slice(0, dot), n.slice(dot + 1));
  });

  // Decimal numbers.
  text = text.replace(/(\d+)\.(\d+)/g, (_, w, d) => readDecimal(w, d));

  // Remaining integers.
  text = text.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));

  return text;
}
