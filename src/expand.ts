interface NumberWords {
  [key: number]: string;
}

const ONES: NumberWords = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
};

const TENS: NumberWords = {
  20: "twenty",
  30: "thirty",
  40: "forty",
  50: "fifty",
  60: "sixty",
  70: "seventy",
  80: "eighty",
  90: "ninety",
};

const SCALES: NumberWords = {
  100: "hundred",
  1000: "thousand",
  1000000: "million",
  1000000000: "billion",
  1000000000000: "trillion",
};

function numberToWords(n: number): string {
  if (n === 0) return "zero";
  if (n < 0) return "negative " + numberToWords(-n);

  if (n < 20) return ONES[n] || "";
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    return TENS[tens] + (ones > 0 ? " " + ONES[ones] : "");
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return (
      ONES[hundreds] +
      " hundred" +
      (remainder > 0 ? " " + numberToWords(remainder) : "")
    );
  }

  // Handle larger numbers
  const scales = [1000000000000, 1000000000, 1000000, 1000];
  for (const scale of scales) {
    if (n >= scale) {
      const quotient = Math.floor(n / scale);
      const remainder = n % scale;
      return (
        numberToWords(quotient) +
        " " +
        SCALES[scale] +
        (remainder > 0 ? " " + numberToWords(remainder) : "")
      );
    }
  }

  return n.toString();
}

function ordinalToWords(n: number): string {
  const base = numberToWords(n);

  // Special cases for ordinals
  if (n % 100 >= 11 && n % 100 <= 13) {
    return base + "th";
  }

  switch (n % 10) {
    case 1:
      return base.replace(/one$/, "first");
    case 2:
      return base.replace(/two$/, "second");
    case 3:
      return base.replace(/three$/, "third");
    case 5:
      return base.replace(/five$/, "fifth");
    case 8:
      return base.replace(/eight$/, "eighth");
    case 9:
      return base.replace(/nine$/, "ninth");
    default:
      return base + "th";
  }
}

const ABBREVIATIONS: { [key: string]: string } = {
  // Titles
  mr: "mister",
  mrs: "missus",
  ms: "miss",
  dr: "doctor",
  prof: "professor",
  sr: "senior",
  jr: "junior",

  // Time
  am: "a m",
  pm: "p m",

  // Common abbreviations
  etc: "etcetera",
  vs: "versus",
  inc: "incorporated",
  corp: "corporation",
  ltd: "limited",
  co: "company",
  st: "street",
  ave: "avenue",
  blvd: "boulevard",
  rd: "road",
  apt: "apartment",
  dept: "department",
  gov: "government",
  org: "organization",
  edu: "education",
  com: "commercial",
  net: "network",
  info: "information",
};

export function expandNumbers(text: string): string {
  // Expand currency
  text = text.replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, (_, amount) => {
    const num = parseFloat(amount.replace(/,/g, ""));
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);

    let result = "";
    if (dollars > 0) {
      result +=
        numberToWords(dollars) + (dollars === 1 ? " dollar" : " dollars");
    }
    if (cents > 0) {
      if (dollars > 0) result += " and ";
      result += numberToWords(cents) + (cents === 1 ? " cent" : " cents");
    }
    return result || "zero dollars";
  });

  // Expand years (1800-2099)
  text = text.replace(/\b(1[89]\d{2}|20\d{2})\b/g, (match) => {
    const year = parseInt(match);
    if (year >= 2000) {
      return (
        "twenty " +
        (year === 2000
          ? "hundred"
          : year < 2010
            ? "oh " + ONES[year % 10]
            : numberToWords(year % 100))
      );
    } else {
      const century = Math.floor(year / 100);
      const remainder = year % 100;
      return (
        numberToWords(century) +
        " " +
        (remainder < 10 ? "oh " + ONES[remainder] : numberToWords(remainder))
      );
    }
  });

  // Expand times (12:34, 1:30 AM, etc.)
  text = text.replace(
    /\b(\d{1,2}):(\d{2})(?:\s*(am|pm))?\b/gi,
    (_, hours, minutes, ampm) => {
      const h = parseInt(hours);
      const m = parseInt(minutes);

      let result = numberToWords(h === 0 ? 12 : h > 12 ? h - 12 : h);

      if (m === 0) {
        result += " o'clock";
      } else if (m < 10) {
        result += " oh " + numberToWords(m);
      } else {
        result += " " + numberToWords(m);
      }

      if (ampm) {
        result += " " + ampm.toLowerCase().replace(/(\w)/g, "$1 ").trim();
      }

      return result;
    },
  );

  // Expand ordinals (1st, 2nd, 3rd, etc.)
  text = text.replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, (_, num) => {
    return ordinalToWords(parseInt(num));
  });

  // Expand phone numbers (XXX-XXX-XXXX or (XXX) XXX-XXXX)
  text = text.replace(/\b(?:\(\d{3}\)\s?|\d{3}-)\d{3}-\d{4}\b/g, (match) => {
    return match
      .replace(/\D/g, "")
      .split("")
      .map((d: string) => ONES[parseInt(d)])
      .join(" ");
  });

  // Expand decimals
  text = text.replace(/\b(\d+)\.(\d+)\b/g, (_, whole, decimal) => {
    return (
      numberToWords(parseInt(whole)) +
      " point " +
      decimal
        .split("")
        .map((d: string) => ONES[parseInt(d)])
        .join(" ")
    );
  });

  // Expand percentages
  text = text.replace(/\b(\d+(?:\.\d+)?)%/g, (_, num) => {
    const n = parseFloat(num);
    return (
      numberToWords(Math.floor(n)) +
      (n % 1 !== 0
        ? " point " +
          (n.toString().split(".")[1] || "")
            .split("")
            .map((d: string) => ONES[parseInt(d)])
            .join(" ")
        : "") +
      " percent"
    );
  });

  // Expand regular numbers
  text = text.replace(/\b\d+\b/g, (match) => {
    return numberToWords(parseInt(match));
  });

  return text;
}

export function expandAbbreviations(text: string): string {
  // Handle abbreviations with periods
  text = text.replace(/\b([a-z]+)\./gi, (match, abbr) => {
    const lower = abbr.toLowerCase();
    if (ABBREVIATIONS[lower]) {
      return ABBREVIATIONS[lower];
    }
    return match;
  });

  // Handle common abbreviations without periods
  const words = text.split(/\s+/);
  const expandedWords = words.map((word) => {
    const clean = word.toLowerCase().replace(/[^\w]/g, "");
    if (ABBREVIATIONS[clean]) {
      return word.replace(new RegExp(clean, "gi"), ABBREVIATIONS[clean]);
    }
    return word;
  });

  return expandedWords.join(" ");
}

export function expandText(text: string): string {
  // First expand abbreviations
  text = expandAbbreviations(text);

  // Then expand numbers
  text = expandNumbers(text);

  // Clean up extra spaces
  return text.replace(/\s+/g, " ").trim();
}
