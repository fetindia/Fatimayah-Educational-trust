/**
 * Utility to convert numerical Indian Rupee amounts into formal English words
 * e.g., 5000 -> "Rupees Five Thousand Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanOneThousand(num: number): string {
  let current = '';

  if (num % 100 < 20) {
    current = ONES[num % 100];
    num = Math.floor(num / 100);
  } else {
    current = ONES[num % 10];
    num = Math.floor(num / 10);

    current = TENS[num % 10] + (current ? ' ' + current : '');
    num = Math.floor(num / 10);
  }

  if (num === 0) return current;
  return ONES[num] + ' Hundred' + (current ? ' ' + current : '');
}

export function convertAmountToWords(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount;
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const integerPart = Math.floor(num);
  const paise = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && paise > 0) {
    return `${convertLessThanOneThousand(paise)} Paise Only`;
  }

  // Indian Numbering System: Crores, Lakhs, Thousands, Hundreds
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertLessThanOneThousand(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertLessThanOneThousand(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertLessThanOneThousand(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertLessThanOneThousand(remainder));
  }

  let result = 'Rupees ' + parts.join(' ');
  if (paise > 0) {
    result += ` and ${convertLessThanOneThousand(paise)} Paise`;
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ').trim();
}
