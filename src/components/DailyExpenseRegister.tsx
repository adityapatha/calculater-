import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  Filter,
  Trash2,
  FileSpreadsheet,
  Printer,
  Scale,
  X,
  CreditCard,
  Wallet,
  Building,
  QrCode,
  Tag,
  User,
} from 'lucide-react';
import { AppSettings, ExpenseCategory, ExpenseTransaction, ExpenseType, PaymentMode } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { playCashRegisterSound, playKeyClickSound } from '../utils/audio';

interface DailyExpenseRegisterProps {
  settings: AppSettings;
  transactions: ExpenseTransaction[];
  onAddTransaction: (tx: Omit<ExpenseTransaction, 'id' | 'timestamp'>) => void;
  onDeleteTransaction: (id: string) => void;
  onGoToReconciliation: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Sales',
  'Customer Deposit',
  'Bank Withdrawal',
  'Inventory / Stock',
  'Salary & Wages',
  'Food & Snacks',
  'Rent & Lease',
  'Electricity & Utilities',
  'Travel & Fuel',
  'Vendor Payment',
  'Shop Maintenance',
  'Tea & Coffee',
  'Personal / Drawings',
  'Miscellaneous',
];

export const DailyExpenseRegister: React.FC<DailyExpenseRegisterProps> = ({
  settings,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onGoToReconciliation,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<ExpenseType>('out');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Snacks');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [partyName, setPartyName] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Date filter
      if (dateRangeFilter === 'today' && t.dateStr !== todayStr) return false;
      if (dateRangeFilter === 'yesterday' && t.dateStr !== yesterdayStr) return false;
      if (dateRangeFilter === 'week' && t.dateStr < weekAgoStr) return false;

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesNote = t.note.toLowerCase().includes(query);
        const matchesParty = t.partyName?.toLowerCase().includes(query);
        if (!matchesCategory && !matchesNote && !matchesParty) return false;
      }

      return true;
    });
  }, [transactions, dateRangeFilter, typeFilter, searchQuery, todayStr, yesterdayStr, weekAgoStr]);

  // Aggregate stats
  const { totalIn, totalOut, netChange, cashOnlyBalance } = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    let cashInSum = 0;
    let cashOutSum = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'in') {
        inSum += t.amount;
        if (t.paymentMode === 'cash') cashInSum += t.amount;
      } else {
        outSum += t.amount;
        if (t.paymentMode === 'cash') cashOutSum += t.amount;
      }
    });

    const net = inSum - outSum;
    const cashNet = cashInSum - cashOutSum;

    return {
      totalIn: inSum,
      totalOut: outSum,
      netChange: net,
      cashOnlyBalance: (settings.openingBalance || 0) + cashNet,
    };
  }, [filteredTransactions, settings.openingBalance]);

  // Category spending analytics breakdown
  const categoryBreakdown = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'out')
      .forEach((t) => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
      });
    return Object.entries(expenseMap).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  const [showCategoryAnalytics, setShowCategoryAnalytics] = useState(false);

  const handleOpenAddModal = (type: ExpenseType) => {
    setTxType(type);
    setCategory(type === 'in' ? 'Sales' : 'Food & Snacks');
    setAmount('');
    setNote('');
    setPartyName('');
    setPaymentMode('cash');
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      dateStr: selectedDate,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: txType,
      amount: parsedAmount,
      category,
      paymentMode,
      note: note.trim(),
      partyName: partyName.trim(),
    });

    playCashRegisterSound(settings.soundEnabled);
    setModalOpen(false);
  };

  const exportCSV = () => {
    let csv = 'Date,Time,Type,Category,Amount,Payment Mode,Party Name,Note\n';
    filteredTransactions.forEach((t) => {
      csv += `"${t.dateStr}","${t.timeStr}","${t.type.toUpperCase()}","${t.category}",${t.amount},"${t.paymentMode}","${t.partyName || ''}","${t.note.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_expenses_${dateRangeFilter}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Top Balance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Opening Balance Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Opening Float</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatCurrency(settings.openingBalance || 0, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Starting cash float</div>
        </div>

        {/* Total Cash In Card */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Cash In</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            +{formatCurrency(totalIn, settings.currency)}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Sales & deposits</div>
        </div>

        {/* Total Cash Out / Expenses Card */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Cash Out</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
            -{formatCurrency(totalOut, settings.currency)}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1">Expenses & payouts</div>
        </div>

        {/* Closing Cash-in-Hand Balance Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-900/50 shadow-lg">
          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
            <span className="font-semibold uppercase tracking-wider">Cash-in-Hand</span>
            <Scale className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
            {formatCurrency(cashOnlyBalance, settings.currency)}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1 flex items-center gap-1">
            <span>Expected closing balance</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Add Cash In & Add Expense */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('in')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cash In (Income)</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('out')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>- Cash Out (Expense)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {categoryBreakdown.length > 0 && (
            <button
              onClick={() => setShowCategoryAnalytics(!showCategoryAnalytics)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showCategoryAnalytics
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
              }`}
              title="Show Spending by Category Analytics"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{showCategoryAnalytics ? 'Hide Analytics' : 'Spending Analytics'}</span>
            </button>
          )}

          <button
            onClick={onGoToReconciliation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Reconcile Cash in Hand with Physical Cash Counter"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Tally Drawer</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium disabled:opacity-40 transition cursor-pointer"
            title="Export to CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Collapsible Spending Category Analytics Card */}
      {showCategoryAnalytics && categoryBreakdown.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-purple-900/50 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Tag className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Expense Spending by Category
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              Total Out: {formatCurrency(totalOut, settings.currency)}
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {categoryBreakdown.map(([catName, catAmount]) => {
              const pct = totalOut > 0 ? Math.round((catAmount / totalOut) * 100) : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{catName}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{pct}%</span>
                      <span className="font-bold text-rose-400">
                        {formatCurrency(catAmount, settings.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          {(['today', 'yesterday', 'week', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setDateRangeFilter(period)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition cursor-pointer ${
                dateRangeFilter === period
                  ? 'bg-slate-800 text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {period === 'week' ? 'Past 7 Days' : period}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'in', 'out'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg uppercase text-[11px] font-semibold transition cursor-pointer ${
                  typeFilter === t
                    ? t === 'in'
                      ? 'bg-emerald-600 text-white'
                      : t === 'out'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'in' ? 'Cash In' : t === 'out' ? 'Cash Out' : 'All'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category/party..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No transactions recorded</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click "+ Cash In" or "- Cash Out" above to record daily income and expenses.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIn = tx.type === 'in';
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIn
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{tx.category}</span>
                      {tx.partyName && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          • {tx.partyName}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {tx.paymentMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{tx.dateStr}</span>
                      <span>•</span>
                      <span>{tx.timeStr}</span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate text-slate-300 italic">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <div
                      className={`text-base font-black font-mono ${
                        isIn ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-xl border ${
                  txType === 'in'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                {txType === 'in' ? (
                  <ArrowDownLeft className="w-6 h-6" />
                ) : (
                  <ArrowUpRight className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {txType === 'in' ? 'Record Cash In (Income)' : 'Record Cash Out (Expense)'}
                </h3>
                <p className="text-xs text-slate-400">Add to daily register</p>
              </div>
            </div>

            {/* Toggle Type */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTxType('in');
                  setCategory('Sales');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  txType === 'in'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Cash In (Income)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('out');
                  setCategory('Food & Snacks');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  txType === 'out'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                - Cash Out (Expense)
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount ({settings.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-lg">
                    {formatCurrency(0, settings.currency).charAt(0)}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'upi', 'bank', 'card'] as PaymentMode[]).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer border ${
                        paymentMode === mode
                          ? 'bg-slate-700 text-emerald-400 border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Party Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer / Vendor / Person (Optional)
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Ramesh Bhai / Supplier"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Note / Bill Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remark / Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Invoice #2938 / Snack tea"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition cursor-pointer active:scale-95 ${
                    txType === 'in'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
