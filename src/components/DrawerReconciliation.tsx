import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Save,
  ArrowRight,
  Calculator,
  Wallet,
  Clock,
  Coins,
} from 'lucide-react';
import { AppSettings, DrawerReconciliation, ExpenseTransaction } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { playCashRegisterSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DrawerReconciliationProps {
  settings: AppSettings;
  physicalCashCounted: number;
  transactions: ExpenseTransaction[];
  onSaveReconciliation: (rec: Omit<DrawerReconciliation, 'id' | 'timestamp'>) => void;
  onGoToCounter: () => void;
  onGoToExpenses: () => void;
}

export const DrawerReconciliationView: React.FC<DrawerReconciliationProps> = ({
  settings,
  physicalCashCounted,
  transactions,
  onSaveReconciliation,
  onGoToCounter,
  onGoToExpenses,
}) => {
  const [remark, setRemark] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate expected cash balance from today's cash transactions + opening float
  const todayTransactions = transactions.filter(
    (t) => t.dateStr === todayStr && t.paymentMode === 'cash'
  );

  const cashInSum = todayTransactions
    .filter((t) => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashOutSum = todayTransactions
    .filter((t) => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedBookBalance = (settings.openingBalance || 0) + cashInSum - cashOutSum;
  const difference = Math.round((physicalCashCounted - expectedBookBalance) * 100) / 100;

  const isMatched = Math.abs(difference) < 0.01;
  const isShortage = difference < -0.01;
  const isSurplus = difference > 0.01;

  const handleSaveAudit = () => {
    onSaveReconciliation({
      dateStr: todayStr,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      physicalCashCounted,
      expectedBookBalance,
      difference,
      status: isMatched ? 'matched' : isShortage ? 'shortage' : 'surplus',
      remark: remark.trim() || (isMatched ? 'Balanced perfectly' : 'Reconciliation audit done'),
    });

    playCashRegisterSound(settings.soundEnabled);
    if (isMatched) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti error
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cash Drawer Reconciliation</h2>
            <p className="text-xs text-slate-400">
              Audit Physical Cash vs Daily Register Book Balance
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Physical Cash Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Physical Cash Counted</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {formatCurrency(physicalCashCounted, settings.currency)}
            </div>
            <p className="text-xs text-slate-400 mt-1">From Denomination Counter</p>
          </div>

          <button
            onClick={onGoToCounter}
            className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Recount in Counter</span>
          </button>
        </div>

        {/* Expected Register Balance Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Expected Book Cash</span>
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {formatCurrency(expectedBookBalance, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
              <div>Opening: {formatCurrency(settings.openingBalance || 0, settings.currency)}</div>
              <div>+ In: {formatCurrency(cashInSum, settings.currency)}</div>
              <div>- Out: {formatCurrency(cashOutSum, settings.currency)}</div>
            </div>
          </div>

          <button
            onClick={onGoToExpenses}
            className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <span>View Cash Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Difference / Result Box */}
        <div
          className={`p-4 rounded-2xl border shadow-lg flex flex-col justify-between ${
            isMatched
              ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
              : isShortage
              ? 'bg-rose-950/25 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/25 border-blue-500/40 text-blue-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Discrepancy</span>
              {isMatched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                isMatched
                  ? 'text-emerald-400'
                  : isShortage
                  ? 'text-rose-400'
                  : 'text-blue-400'
              }`}
            >
              {difference > 0 ? '+' : ''}
              {formatCurrency(difference, settings.currency)}
            </div>
            <div className="text-xs font-semibold mt-1">
              {isMatched
                ? 'Exact Match! Balanced.'
                : isShortage
                ? 'Shortage (Cash Missing)'
                : 'Surplus (Excess Cash)'}
            </div>
          </div>

          <div className="mt-4 text-[11px] opacity-80">
            {isMatched
              ? 'Physical cash matches register perfectly.'
              : isShortage
              ? 'Drawer has less cash than expected.'
              : 'Drawer has more cash than recorded.'}
          </div>
        </div>
      </div>

      {/* Audit Checklist & Remarks Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          Reconciliation Check Guide
        </h3>

        {!isMatched && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-amber-400">Troubleshooting common causes:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Were any cash sales not recorded in the Daily Register?</li>
              <li>Was any petty cash or tea/snack expense paid out without entry?</li>
              <li>Was opening cash float accurately counted this morning?</li>
              <li>Check if customer change was miscounted during rush hour.</li>
            </ul>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Cashier Audit Remarks
          </label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={
              isMatched
                ? 'e.g. End of day audit verified by Cashier & Manager'
                : 'e.g. Discrepancy investigated: pending supplier voucher'
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Date: {todayStr}</span>
          </div>

          <button
            onClick={handleSaveAudit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? 'Audit Report Saved!' : 'Save Audit Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
