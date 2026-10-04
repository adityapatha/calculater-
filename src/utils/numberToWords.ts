import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from './currencies';

const UNITS = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += UNITS[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + UNITS[n % 10] : '') + ' ';
  } else if (n > 0) {
    str += UNITS[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts numbers into words using the Indian numbering system (Crore, Lakh, Thousand, Hundred)
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWordsIndian(Math.abs(num));

  // Split into integer and decimal
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundredAndBelow = remainder;

  if (crore > 0) {
    result += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    result += convertBelowThousand(hundredAndBelow) + ' ';
  }

  result = result.trim();

  if (decimalPart > 0) {
    result += ' and ' + convertBelowThousand(decimalPart) + ' Paise';
  }

  return result ? `${result} Only` : 'Zero Only';
}

/**
 * Converts numbers into words using the Western / International numbering system
 */
export function numberToWordsInternational(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWordsInternational(Math.abs(num));

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  const BILLION = 1000000000;
  const MILLION = 1000000;
  const THOUSAND = 1000;

  let result = '';
  let rem = integerPart;

  const billions = Math.floor(rem / BILLION);
  rem %= BILLION;

  const millions = Math.floor(rem / MILLION);
  rem %= MILLION;

  const thousands = Math.floor(rem / THOUSAND);
  rem %= THOUSAND;

  const belowThousand = rem;

  if (billions > 0) {
    result += convertBelowThousand(billions) + ' Billion ';
  }
  if (millions > 0) {
    result += convertBelowThousand(millions) + ' Million ';
  }
  if (thousands > 0) {
    result += convertBelowThousand(thousands) + ' Thousand ';
  }
  if (belowThousand > 0) {
    result += convertBelowThousand(belowThousand) + ' ';
  }

  result = result.trim();

  if (decimalPart > 0) {
    result += ' and ' + convertBelowThousand(decimalPart) + ' Cents';
  }

  return result ? `${result} Only` : 'Zero Only';
}

export function formatWordsForCurrency(amount: number, currencyCode: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.INR;
  if (currencyCode === 'INR') {
    const words = numberToWordsIndian(amount);
    return `Rupees ${words}`;
  }
  if (config.numberSystem === 'indian') {
    return numberToWordsIndian(amount);
  }
  return numberToWordsInternational(amount);
}

/**
 * Formats a number to currency format (e.g. ₹ 1,50,000 in Indian format or $150,000.00 in US)
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'INR'): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.INR;
  
  if (currencyCode === 'INR') {
    return `${config.symbol} ${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;
  }

  return `${config.symbol} ${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`;
}
