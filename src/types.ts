export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CAD' | 'AUD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  numberSystem: 'indian' | 'international';
  denominations: DenominationInfo[];
}

export interface DenominationInfo {
  value: number;
  label: string;
  type: 'note' | 'coin';
  color: string;
  bgLight: string;
  borderLight: string;
}

export interface DenominationCount {
  [value: number]: number;
}

export interface TallyRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  title: string;
  notes?: string;
  payerReceiver?: string;
  currencyCode: CurrencyCode;
  counts: DenominationCount;
  totalNotes: number;
  totalCoins: number;
  totalPieces: number;
  totalAmount: number;
  amountInWords: string;
  tag?: 'Daily Closing' | 'Morning Opening' | 'Bank Deposit' | 'Drawer Audit' | 'General';
}

export type ExpenseType = 'in' | 'out';

export type ExpenseCategory =
  | 'Sales'
  | 'Customer Deposit'
  | 'Bank Withdrawal'
  | 'Inventory / Stock'
  | 'Salary & Wages'
  | 'Food & Snacks'
  | 'Rent & Lease'
  | 'Electricity & Utilities'
  | 'Travel & Fuel'
  | 'Vendor Payment'
  | 'Shop Maintenance'
  | 'Tea & Coffee'
  | 'Personal / Drawings'
  | 'Miscellaneous';

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'card';

export interface ExpenseTransaction {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string;
  type: ExpenseType;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  note: string;
  partyName?: string;
}

export interface DrawerReconciliation {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  physicalCashCounted: number;
  expectedBookBalance: number;
  difference: number;
  status: 'matched' | 'shortage' | 'surplus';
  remark?: string;
}

export interface AppSettings {
  currency: CurrencyCode;
  businessName: string;
  cashierName: string;
  bankName: string;
  accountNumber: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  numberSystem: 'indian' | 'international';
  theme: 'dark' | 'light' | 'amoled';
  openingBalance: number;
  activeDenominations: number[];
}
