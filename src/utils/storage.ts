import { AppSettings, DrawerReconciliation, ExpenseTransaction, TallyRecord } from '../types';

const SETTINGS_KEY = 'cashcalc_settings';
const TALLIES_KEY = 'cashcalc_tallies';
const TRANSACTIONS_KEY = 'cashcalc_transactions';
const RECONCILIATIONS_KEY = 'cashcalc_reconciliations';
const CURRENT_COUNTS_KEY = 'cashcalc_current_counts';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  businessName: 'Radhe Krishna Super Store',
  cashierName: 'Counter 01',
  bankName: 'State Bank of India',
  accountNumber: '38291048592',
  soundEnabled: true,
  hapticEnabled: true,
  numberSystem: 'indian',
  theme: 'dark',
  openingBalance: 15000,
  activeDenominations: [500, 200, 100, 50, 20, 10, 5, 2, 1],
};

const TODAY_STR = new Date().toISOString().split('T')[0];

export const INITIAL_TRANSACTIONS: ExpenseTransaction[] = [
  {
    id: 'tx-1',
    timestamp: Date.now() - 3600000 * 5,
    dateStr: TODAY_STR,
    timeStr: '09:30 AM',
    type: 'in',
    amount: 15000,
    category: 'Sales',
    paymentMode: 'cash',
    note: 'Opening Cash Float & Morning Sales',
    partyName: 'Counter Cash',
  },
  {
    id: 'tx-2',
    timestamp: Date.now() - 3600000 * 3.5,
    dateStr: TODAY_STR,
    timeStr: '11:15 AM',
    type: 'in',
    amount: 8400,
    category: 'Customer Deposit',
    paymentMode: 'cash',
    note: 'Wholesale order payment',
    partyName: 'Sharma Traders',
  },
  {
    id: 'tx-3',
    timestamp: Date.now() - 3600000 * 2,
    dateStr: TODAY_STR,
    timeStr: '01:45 PM',
    type: 'out',
    amount: 1250,
    category: 'Food & Snacks',
    paymentMode: 'cash',
    note: 'Staff lunch & morning tea',
    partyName: 'Amreli Cafeteria',
  },
  {
    id: 'tx-4',
    timestamp: Date.now() - 3600000 * 1,
    dateStr: TODAY_STR,
    timeStr: '03:10 PM',
    type: 'out',
    amount: 4500,
    category: 'Vendor Payment',
    paymentMode: 'cash',
    note: 'Dairy supplies delivery invoice #402',
    partyName: 'Amul Milk Supply',
  },
  {
    id: 'tx-5',
    timestamp: Date.now() - 1800000,
    dateStr: TODAY_STR,
    timeStr: '04:00 PM',
    type: 'in',
    amount: 6200,
    category: 'Sales',
    paymentMode: 'cash',
    note: 'Retail counter cash sales',
    partyName: 'Walk-in Customers',
  },
];

export const INITIAL_TALLIES: TallyRecord[] = [
  {
    id: 'tally-demo-1',
    timestamp: Date.now() - 3600000 * 24,
    dateStr: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
    timeStr: '08:30 PM',
    title: 'Yesterday Night Closing Tally',
    notes: 'Safe deposit verified by Manager',
    payerReceiver: 'Cashier Manoj',
    currencyCode: 'INR',
    counts: {
      500: 42,
      200: 15,
      100: 25,
      50: 10,
      20: 15,
      10: 20,
    },
    totalNotes: 127,
    totalCoins: 0,
    totalPieces: 127,
    totalAmount: 27500,
    amountInWords: 'Rupees Twenty-Seven Thousand Five Hundred Only',
    tag: 'Daily Closing',
  },
];

export const Storage = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getTallies(): TallyRecord[] {
    try {
      const data = localStorage.getItem(TALLIES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TALLIES;
  },

  saveTallies(tallies: TallyRecord[]): void {
    try {
      localStorage.setItem(TALLIES_KEY, JSON.stringify(tallies));
    } catch (e) {
      console.error(e);
    }
  },

  getTransactions(): ExpenseTransaction[] {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  },

  saveTransactions(transactions: ExpenseTransaction[]): void {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  },

  getCurrentCounts(): Record<number, number> {
    try {
      const data = localStorage.getItem(CURRENT_COUNTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return {
      500: 38,
      200: 12,
      100: 20,
      50: 8,
      20: 15,
      10: 15,
    };
  },

  saveCurrentCounts(counts: Record<number, number>): void {
    try {
      localStorage.setItem(CURRENT_COUNTS_KEY, JSON.stringify(counts));
    } catch (e) {
      console.error(e);
    }
  },

  getReconciliations(): DrawerReconciliation[] {
    try {
      const data = localStorage.getItem(RECONCILIATIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  saveReconciliations(list: DrawerReconciliation[]): void {
    try {
      localStorage.setItem(RECONCILIATIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  },

  exportFullBackup(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      tallies: this.getTallies(),
      transactions: this.getTransactions(),
      reconciliations: this.getReconciliations(),
      currentCounts: this.getCurrentCounts(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.tallies) this.saveTallies(data.tallies);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.reconciliations) this.saveReconciliations(data.reconciliations);
      if (data.currentCounts) this.saveCurrentCounts(data.currentCounts);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  clearAllData(): void {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(TALLIES_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(RECONCILIATIONS_KEY);
    localStorage.removeItem(CURRENT_COUNTS_KEY);
  },
};
