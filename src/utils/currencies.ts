import { CurrencyConfig } from '../types';

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    numberSystem: 'indian',
    denominations: [
      { value: 2000, label: '₹ 2000', type: 'note', color: '#db2777', bgLight: '#fdf2f8', borderLight: '#f472b6' }, // Magenta
      { value: 500, label: '₹ 500', type: 'note', color: '#65a30d', bgLight: '#f7fee7', borderLight: '#bef264' },  // Stone Grey-Green
      { value: 200, label: '₹ 200', type: 'note', color: '#ea580c', bgLight: '#fff7ed', borderLight: '#fdba74' },  // Bright Orange
      { value: 100, label: '₹ 100', type: 'note', color: '#0284c7', bgLight: '#f0f9ff', borderLight: '#7dd3fc' },  // Lavender-Blue
      { value: 50, label: '₹ 50', type: 'note', color: '#06b6d4', bgLight: '#ecfeff', borderLight: '#67e8f9' },    // Fluorescent Blue
      { value: 20, label: '₹ 20', type: 'note', color: '#eab308', bgLight: '#fefce8', borderLight: '#fde047' },    // Greenish Yellow
      { value: 10, label: '₹ 10', type: 'note', color: '#b45309', bgLight: '#fffbeb', borderLight: '#fcd34d' },    // Chocolate Brown
      { value: 5, label: '₹ 5', type: 'coin', color: '#059669', bgLight: '#ecfdf5', borderLight: '#6ee7b7' },      // Green Note / Nickel Coin
      { value: 2, label: '₹ 2', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },      // Silver Coin
      { value: 1, label: '₹ 1', type: 'coin', color: '#d97706', bgLight: '#fffbeb', borderLight: '#fde68a' },      // Bronze Coin
    ],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (USD)',
    numberSystem: 'international',
    denominations: [
      { value: 100, label: '$ 100', type: 'note', color: '#059669', bgLight: '#ecfdf5', borderLight: '#6ee7b7' },
      { value: 50, label: '$ 50', type: 'note', color: '#2563eb', bgLight: '#eff6ff', borderLight: '#93c5fd' },
      { value: 20, label: '$ 20', type: 'note', color: '#16a34a', bgLight: '#f0fdf4', borderLight: '#86efac' },
      { value: 10, label: '$ 10', type: 'note', color: '#d97706', bgLight: '#fffbeb', borderLight: '#fde68a' },
      { value: 5, label: '$ 5', type: 'note', color: '#7c3aed', bgLight: '#f5f3ff', borderLight: '#c4b5fd' },
      { value: 2, label: '$ 2', type: 'note', color: '#0d9488', bgLight: '#f0fdfa', borderLight: '#5eead4' },
      { value: 1, label: '$ 1', type: 'note', color: '#4b5563', bgLight: '#f9fafb', borderLight: '#d1d5db' },
      { value: 0.5, label: '50¢ Half $', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 0.25, label: '25¢ Quarter', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 0.1, label: '10¢ Dime', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 0.05, label: '5¢ Nickel', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 0.01, label: '1¢ Penny', type: 'coin', color: '#b45309', bgLight: '#fffbeb', borderLight: '#fcd34d' },
    ],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (EUR)',
    numberSystem: 'international',
    denominations: [
      { value: 500, label: '€ 500', type: 'note', color: '#7c3aed', bgLight: '#f5f3ff', borderLight: '#c4b5fd' },
      { value: 200, label: '€ 200', type: 'note', color: '#ca8a04', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 100, label: '€ 100', type: 'note', color: '#16a34a', bgLight: '#f0fdf4', borderLight: '#86efac' },
      { value: 50, label: '€ 50', type: 'note', color: '#ea580c', bgLight: '#fff7ed', borderLight: '#fdba74' },
      { value: 20, label: '€ 20', type: 'note', color: '#0284c7', bgLight: '#f0f9ff', borderLight: '#7dd3fc' },
      { value: 10, label: '€ 10', type: 'note', color: '#dc2626', bgLight: '#fef2f2', borderLight: '#fca5a5' },
      { value: 5, label: '€ 5', type: 'note', color: '#64748b', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 2, label: '€ 2', type: 'coin', color: '#eab308', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 1, label: '€ 1', type: 'coin', color: '#eab308', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 0.5, label: '50c', type: 'coin', color: '#ca8a04', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 0.2, label: '20c', type: 'coin', color: '#ca8a04', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 0.1, label: '10c', type: 'coin', color: '#ca8a04', bgLight: '#fefce8', borderLight: '#fde047' },
    ],
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (GBP)',
    numberSystem: 'international',
    denominations: [
      { value: 50, label: '£ 50', type: 'note', color: '#dc2626', bgLight: '#fef2f2', borderLight: '#fca5a5' },
      { value: 20, label: '£ 20', type: 'note', color: '#7c3aed', bgLight: '#f5f3ff', borderLight: '#c4b5fd' },
      { value: 10, label: '£ 10', type: 'note', color: '#ea580c', bgLight: '#fff7ed', borderLight: '#fdba74' },
      { value: 5, label: '£ 5', type: 'note', color: '#0284c7', bgLight: '#f0f9ff', borderLight: '#7dd3fc' },
      { value: 2, label: '£ 2', type: 'coin', color: '#eab308', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 1, label: '£ 1', type: 'coin', color: '#eab308', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 0.5, label: '50p', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
      { value: 0.2, label: '20p', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
    ],
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham (AED)',
    numberSystem: 'international',
    denominations: [
      { value: 1000, label: '1000 AED', type: 'note', color: '#b45309', bgLight: '#fffbeb', borderLight: '#fcd34d' },
      { value: 500, label: '500 AED', type: 'note', color: '#0284c7', bgLight: '#f0f9ff', borderLight: '#7dd3fc' },
      { value: 200, label: '200 AED', type: 'note', color: '#ca8a04', bgLight: '#fefce8', borderLight: '#fde047' },
      { value: 100, label: '100 AED', type: 'note', color: '#dc2626', bgLight: '#fef2f2', borderLight: '#fca5a5' },
      { value: 50, label: '50 AED', type: 'note', color: '#7c3aed', bgLight: '#f5f3ff', borderLight: '#c4b5fd' },
      { value: 20, label: '20 AED', type: 'note', color: '#059669', bgLight: '#ecfdf5', borderLight: '#6ee7b7' },
      { value: 10, label: '10 AED', type: 'note', color: '#16a34a', bgLight: '#f0fdf4', borderLight: '#86efac' },
      { value: 5, label: '5 AED', type: 'note', color: '#ea580c', bgLight: '#fff7ed', borderLight: '#fdba74' },
      { value: 1, label: '1 AED', type: 'coin', color: '#94a3b8', bgLight: '#f8fafc', borderLight: '#cbd5e1' },
    ],
  },
};
