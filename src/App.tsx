/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Receipt,
  Scale,
  History,
  FileText,
  Calculator,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AppSettings,
  DenominationCount,
  DrawerReconciliation,
  ExpenseTransaction,
  TallyRecord,
} from './types';
import { DEFAULT_SETTINGS, Storage } from './utils/storage';
import { Header } from './components/Header';
import { CashCounter } from './components/CashCounter';
import { DailyExpenseRegister } from './components/DailyExpenseRegister';
import { DrawerReconciliationView } from './components/DrawerReconciliation';
import { HistoryView } from './components/HistoryView';
import { SlipModal } from './components/SlipModal';
import { SettingsModal } from './components/SettingsModal';
import { VoiceTallyModal } from './components/VoiceTallyModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CURRENCY_CONFIGS } from './utils/currencies';
import { formatCurrency } from './utils/numberToWords';
import { Mic } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => Storage.getSettings());
  const [counts, setCounts] = useState<DenominationCount>(() => Storage.getCurrentCounts());
  const [tallies, setTallies] = useState<TallyRecord[]>(() => Storage.getTallies());
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(() =>
    Storage.getTransactions()
  );
  const [reconciliations, setReconciliations] = useState<DrawerReconciliation[]>(() =>
    Storage.getReconciliations()
  );

  const [activeTab, setActiveTab] = useState<'counter' | 'expenses' | 'reconciliation' | 'history'>(
    'counter'
  );
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipCounts, setSlipCounts] = useState<DenominationCount>(counts);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Sync settings when updated
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      Storage.saveSettings(updated);
      return updated;
    });
  };

  // Sync counts
  const handleUpdateCounts = (newCounts: DenominationCount) => {
    setCounts(newCounts);
    Storage.saveCurrentCounts(newCounts);
  };

  // Save a tally session
  const handleSaveTally = (
    record: Omit<TallyRecord, 'id' | 'timestamp' | 'dateStr' | 'timeStr'>
  ) => {
    const newRecord: TallyRecord = {
      ...record,
      id: `tally-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newRecord, ...tallies];
    setTallies(updated);
    Storage.saveTallies(updated);
  };

  const handleDeleteTally = (id: string) => {
    const updated = tallies.filter((t) => t.id !== id);
    setTallies(updated);
    Storage.saveTallies(updated);
  };

  const handleLoadTally = (loadedCounts: DenominationCount) => {
    handleUpdateCounts(loadedCounts);
    setActiveTab('counter');
  };

  // Add Daily Expense / Cash In transaction
  const handleAddTransaction = (tx: Omit<ExpenseTransaction, 'id' | 'timestamp'>) => {
    const newTx: ExpenseTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    Storage.saveTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    Storage.saveTransactions(updated);
  };

  // Save Drawer Reconciliation
  const handleSaveReconciliation = (
    rec: Omit<DrawerReconciliation, 'id' | 'timestamp'>
  ) => {
    const newRec: DrawerReconciliation = {
      ...rec,
      id: `rec-${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newRec, ...reconciliations];
    setReconciliations(updated);
    Storage.saveReconciliations(updated);
  };

  const handleDataReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setCounts({});
    setTallies([]);
    setTransactions([]);
    setReconciliations([]);
  };

  // Calculate current physical cash total from denomination counts
  const physicalCashTotal = useMemo(() => {
    const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.INR;
    let sum = 0;
    currencyConfig.denominations.forEach((d) => {
      const c = counts[d.value] || 0;
      sum += d.value * c;
    });
    return Math.round(sum * 100) / 100;
  }, [counts, settings.currency]);

  // Sync theme with body background
  useEffect(() => {
    if (settings.theme === 'amoled') {
      document.body.style.backgroundColor = '#000000';
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.body.style.backgroundColor = '#f1f5f9';
      document.documentElement.classList.remove('dark');
    } else {
      document.body.style.backgroundColor = '#090d16';
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  // Apply theme class to wrapper
  const themeClasses =
    settings.theme === 'amoled'
      ? 'bg-black text-slate-100'
      : settings.theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : 'bg-[#090d16] text-slate-100';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${themeClasses}`}>
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-20">
        {/* Navigation Tabs Pill Bar */}
        <div className="flex items-center justify-center mb-5 no-print">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('counter')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'counter'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Cash Counter</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Daily Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reconciliation'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Drawer Tally</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Archives</span>
              {tallies.length > 0 && (
                <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {tallies.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'counter' && (
          <CashCounter
            settings={settings}
            counts={counts}
            onChangeCounts={handleUpdateCounts}
            onSaveTally={handleSaveTally}
            onOpenSlip={() => {
              setSlipCounts(counts);
              setSlipModalOpen(true);
            }}
            onGoToReconciliation={() => setActiveTab('reconciliation')}
            onOpenVoiceModal={() => setVoiceModalOpen(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <DailyExpenseRegister
            settings={settings}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onGoToReconciliation={() => setActiveTab('reconciliation')}
          />
        )}

        {activeTab === 'reconciliation' && (
          <DrawerReconciliationView
            settings={settings}
            physicalCashCounted={physicalCashTotal}
            transactions={transactions}
            onSaveReconciliation={handleSaveReconciliation}
            onGoToCounter={() => setActiveTab('counter')}
            onGoToExpenses={() => setActiveTab('expenses')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            settings={settings}
            tallies={tallies}
            onLoadTally={handleLoadTally}
            onDeleteTally={handleDeleteTally}
            onOpenSlipForTally={(c) => {
              setSlipCounts(c);
              setSlipModalOpen(true);
            }}
            onGoToCounter={() => setActiveTab('counter')}
          />
        )}
      </main>

      {/* Floating Quick Voice Mic Button (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-40 no-print">
        <button
          onClick={() => setVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-emerald-950 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-emerald-400/40"
          title="Voice Typing (Speak: '200 notes of 500 and 52 notes of 100')"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span className="hidden sm:inline">Voice Count</span>
        </button>
      </div>

      {/* Voice-Typing Modal */}
      <VoiceTallyModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        settings={settings}
        currentCounts={counts}
        onApplyCounts={(newCounts) => handleUpdateCounts(newCounts)}
      />

      {/* Cash Memo & Bank Deposit Slip Modal */}
      <SlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        settings={settings}
        counts={slipCounts}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onDataReset={handleDataReset}
      />

      {/* Offline Connectivity Notification Banner */}
      <OfflineIndicator />
    </div>
  );
}
