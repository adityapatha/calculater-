import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Save,
  FileText,
  Copy,
  Check,
  Scale,
  Plus,
  Minus,
  X,
  Share2,
  Layers,
  Banknote,
  Coins,
  ChevronDown,
  ChevronUp,
  Mic,
  ShieldAlert,
  ArrowRight,
  Hash,
  Sparkles,
} from 'lucide-react';
import { AppSettings, DenominationCount, DenominationInfo, TallyRecord } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currencies';
import { formatCurrency, formatWordsForCurrency } from '../utils/numberToWords';
import { playCashRegisterSound, playKeyClickSound, triggerHaptic } from '../utils/audio';
import { NumpadModal } from './NumpadModal';
import confetti from 'canvas-confetti';

interface CashCounterProps {
  settings: AppSettings;
  counts: DenominationCount;
  onChangeCounts: (newCounts: DenominationCount) => void;
  onSaveTally: (record: Omit<TallyRecord, 'id' | 'timestamp' | 'dateStr' | 'timeStr'>) => void;
  onOpenSlip: () => void;
  onGoToReconciliation: () => void;
  onOpenVoiceModal: () => void;
}

export const CashCounter: React.FC<CashCounterProps> = ({
  settings,
  counts,
  onChangeCounts,
  onSaveTally,
  onOpenSlip,
  onGoToReconciliation,
  onOpenVoiceModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [tallyTitle, setTallyTitle] = useState('Daily Cash Closing');
  const [tallyTag, setTallyTag] = useState<TallyRecord['tag']>('Daily Closing');
  const [tallyNotes, setTallyNotes] = useState('');
  const [payerReceiver, setPayerReceiver] = useState(settings.cashierName || '');
  const [showQuickBundles, setShowQuickBundles] = useState(true);
  const [bundleMode, setBundleMode] = useState(false); // When true, counting full bundles of 100 notes

  // Active Numpad Modal state
  const [selectedDenomForNumpad, setSelectedDenomForNumpad] = useState<DenominationInfo | null>(null);

  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.INR;

  const denominations = useMemo(() => {
    return currencyConfig.denominations.filter((d) =>
      settings.activeDenominations && settings.activeDenominations.length > 0
        ? settings.activeDenominations.includes(d.value)
        : true
    );
  }, [currencyConfig, settings.activeDenominations]);

  // Calculations
  const { totalAmount, totalNotes, totalCoins, totalPieces } = useMemo(() => {
    let amount = 0;
    let notes = 0;
    let coins = 0;

    denominations.forEach((d) => {
      const count = counts[d.value] || 0;
      amount += d.value * count;
      if (d.type === 'note') {
        notes += count;
      } else {
        coins += count;
      }
    });

    return {
      totalAmount: Math.round(amount * 100) / 100,
      totalNotes: notes,
      totalCoins: coins,
      totalPieces: notes + coins,
    };
  }, [counts, denominations]);

  const amountInWords = useMemo(() => {
    return formatWordsForCurrency(totalAmount, settings.currency);
  }, [totalAmount, settings.currency]);

  // Safe drawer limit alert (e.g. ₹1,00,000 for retail cashier security)
  const safeCashThreshold = settings.currency === 'INR' ? 100000 : 5000;
  const isOverSafeThreshold = totalAmount >= safeCashThreshold;

  const updateCount = (value: number, newCount: number) => {
    const sanitized = Math.max(0, Math.floor(newCount || 0));
    playKeyClickSound(settings.soundEnabled);
    triggerHaptic(settings.hapticEnabled);
    onChangeCounts({
      ...counts,
      [value]: sanitized,
    });
  };

  const adjustCount = (value: number, delta: number) => {
    const current = counts[value] || 0;
    updateCount(value, current + delta);
  };

  const clearRow = (value: number) => {
    updateCount(value, 0);
  };

  const clearAll = () => {
    if (totalPieces === 0) return;
    if (window.confirm('Reset all denomination counts to 0?')) {
      const cleared: DenominationCount = {};
      denominations.forEach((d) => (cleared[d.value] = 0));
      onChangeCounts(cleared);
      playKeyClickSound(settings.soundEnabled);
    }
  };

  const copySummaryText = () => {
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let text = `*${settings.businessName.toUpperCase() || 'CASH DENOMINATION SUMMARY'}*\n`;
    text += `Date: ${dateStr} | Time: ${timeStr}\n`;
    text += `Cashier: ${settings.cashierName || 'Counter'}\n`;
    text += `--------------------------------\n`;

    denominations.forEach((d) => {
      const count = counts[d.value] || 0;
      if (count > 0) {
        text += `${d.label.padEnd(8)} x ${count.toString().padStart(4)} = ${formatCurrency(
          d.value * count,
          settings.currency
        )}\n`;
      }
    });

    text += `--------------------------------\n`;
    text += `Total Notes: ${totalNotes}\n`;
    if (totalCoins > 0) text += `Total Coins: ${totalCoins}\n`;
    text += `Total Pieces: ${totalPieces}\n`;
    text += `*GRAND TOTAL: ${formatCurrency(totalAmount, settings.currency)}*\n`;
    text += `In Words: ${amountInWords}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTally({
      title: tallyTitle.trim() || 'Cash Tally',
      notes: tallyNotes.trim(),
      payerReceiver: payerReceiver.trim(),
      currencyCode: settings.currency,
      counts: { ...counts },
      totalNotes,
      totalCoins,
      totalPieces,
      totalAmount,
      amountInWords,
      tag: tallyTag,
    });

    playCashRegisterSound(settings.soundEnabled);
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.75 },
      });
    } catch {
      // Ignore
    }

    setSaveModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Hero Display Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100">
        {/* Ambient Backlight Glows */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                Physical Cash Total
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Formatted Grand Total */}
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow-sm">
                {formatCurrency(totalAmount, settings.currency)}
              </h2>
            </div>

            {/* Dynamic Words Representation */}
            <p className="mt-2 text-xs sm:text-sm font-medium text-emerald-300/90 italic leading-snug max-w-xl">
              {amountInWords}
            </p>
          </div>

          {/* Pieces, Notes & Coins Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                Notes
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {totalNotes}
              </div>
            </div>

            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Coins
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {totalCoins}
              </div>
            </div>

            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-700/50 shadow-sm text-center">
              <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Pieces
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {totalPieces}
              </div>
            </div>
          </div>
        </div>

        {/* Safe Cash Holding Alert (Fintech feature for store cashiers) */}
        {isOverSafeThreshold && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Cash Safe Limit:</strong> Drawer cash exceeds {formatCurrency(safeCashThreshold, settings.currency)}. Consider transferring surplus cash into the main safe.
              </span>
            </div>
            <button
              onClick={onOpenSlip}
              className="text-xs font-bold underline hover:text-white flex-shrink-0"
            >
              Generate Deposit Slip
            </button>
          </div>
        )}

        {/* Action Button Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Voice Typing Trigger Button */}
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer ring-1 ring-emerald-400/30"
              title="Speak denominations e.g. '200 notes of 500 and 52 notes of 100'"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Voice Typing</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20 uppercase tracking-wider">
                AI
              </span>
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Save Record</span>
            </button>

            <button
              onClick={onOpenSlip}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Bank Slip & Memo</span>
            </button>

            <button
              onClick={onGoToReconciliation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Match Drawer</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copySummaryText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/70 text-xs font-medium transition cursor-pointer"
              title="Copy Summary for WhatsApp/SMS"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={clearAll}
              disabled={totalPieces === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Reset all rows to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control bar: Bundles mode & Keypad hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Denomination Matrix
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-500">
            Tap any denomination for full Touch Keypad
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Bundle mode toggle */}
          <button
            onClick={() => setBundleMode(!bundleMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              bundleMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Bundle Mode (100 notes per bundle)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{bundleMode ? 'Bundle Mode (x100)' : 'Single Notes'}</span>
          </button>

          <button
            onClick={() => setShowQuickBundles(!showQuickBundles)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
          >
            <span>{showQuickBundles ? 'Compact' : 'Steppers'}</span>
            {showQuickBundles ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Denomination Rows with Rich Colors */}
      <div className="space-y-2.5">
        {denominations.map((denom) => {
          const count = counts[denom.value] || 0;
          const rowSubtotal = denom.value * count;
          const isNonZero = count > 0;
          const bundleCount = denom.type === 'note' ? Math.floor(count / 100) : 0;
          const looseCount = denom.type === 'note' ? count % 100 : count;

          return (
            <div
              key={denom.value}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                isNonZero
                  ? 'bg-slate-900/90 border-slate-700 shadow-lg ring-1'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
              }`}
              style={{
                borderColor: isNonZero ? `${denom.color}55` : undefined,
                boxShadow: isNonZero ? `0 4px 20px -4px ${denom.color}18` : undefined,
              }}
            >
              {/* Left Column: Denomination Badge & Tag */}
              <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[150px] mb-2 sm:mb-0">
                <button
                  type="button"
                  onClick={() => setSelectedDenomForNumpad(denom)}
                  className="flex items-center gap-1.5 font-black font-mono text-sm sm:text-base px-3.5 py-1.5 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer text-left"
                  style={{
                    backgroundColor: `${denom.color}25`,
                    color: denom.color,
                    border: `1.5px solid ${denom.color}77`,
                  }}
                  title="Click to open Touch Keypad for this denomination"
                >
                  <span>{denom.label}</span>
                  <Hash className="w-3 h-3 opacity-60" />
                </button>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {denom.type}
                  </span>
                  {denom.type === 'note' && bundleCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-700/40">
                      {bundleCount} {bundleCount === 1 ? 'pkt' : 'pkts'}
                    </span>
                  )}
                  <span className="text-slate-500 font-mono">×</span>
                </div>

                {/* Mobile Subtotal Display */}
                <div className="sm:hidden font-mono font-bold text-sm text-right text-white">
                  {formatCurrency(rowSubtotal, settings.currency)}
                </div>
              </div>

              {/* Middle: Steppers and Input */}
              <div className="flex items-center gap-1 sm:gap-2 justify-center my-1 sm:my-0 flex-wrap">
                {/* Bundle Step -100 or -5 */}
                {showQuickBundles && (
                  <button
                    onClick={() => adjustCount(denom.value, bundleMode ? -100 : -5)}
                    disabled={count < (bundleMode ? 100 : 5)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center border border-slate-700/70 transition cursor-pointer active:scale-95"
                    title={bundleMode ? 'Subtract 1 Bundle (100)' : 'Subtract 5'}
                  >
                    {bundleMode ? '-100' : '-5'}
                  </button>
                )}

                {/* -1 Button */}
                <button
                  onClick={() => adjustCount(denom.value, -1)}
                  disabled={count <= 0}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center border border-slate-700/80 transition cursor-pointer active:scale-95"
                  title="Subtract 1"
                >
                  <Minus className="w-4 h-4" />
                </button>

                {/* Direct Number Input */}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    value={count === 0 ? '' : count}
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      updateCount(denom.value, isNaN(val) ? 0 : val);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-20 sm:w-28 h-9 text-center font-mono font-bold text-base rounded-xl border focus:outline-none transition ${
                      isNonZero
                        ? 'bg-slate-950 border-emerald-500/70 text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-700/70 text-slate-400 focus:border-slate-500'
                    }`}
                  />
                  {isNonZero && (
                    <button
                      onClick={() => clearRow(denom.value)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
                      title="Clear this row"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* +1 Button */}
                <button
                  onClick={() => adjustCount(denom.value, 1)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 flex items-center justify-center border border-slate-700/80 transition cursor-pointer active:scale-95"
                  title="Add 1"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Bundle Step +100 or +5 */}
                {showQuickBundles && (
                  <button
                    onClick={() => adjustCount(denom.value, bundleMode ? 100 : 5)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700/70 transition cursor-pointer active:scale-95"
                    title={bundleMode ? 'Add 1 Bundle (100)' : 'Add 5'}
                  >
                    {bundleMode ? '+100' : '+5'}
                  </button>
                )}

                {/* Quick 100 bundle packet button for notes */}
                {showQuickBundles && !bundleMode && denom.type === 'note' && (
                  <button
                    onClick={() => adjustCount(denom.value, 100)}
                    className="px-2.5 h-9 rounded-xl bg-emerald-950/50 hover:bg-emerald-800/60 text-emerald-400 text-[11px] font-bold flex items-center justify-center border border-emerald-700/50 transition cursor-pointer active:scale-95 shadow-sm"
                    title="Add 1 Full Bundle (100 Notes = ₹50,000 for 500s)"
                  >
                    +100 pkt
                  </button>
                )}
              </div>

              {/* Right Column: Desktop Subtotal */}
              <div className="hidden sm:flex items-center justify-end gap-3 min-w-[150px] text-right">
                <span className="text-slate-500 text-xs font-mono font-medium">=</span>
                <span
                  className={`font-mono font-black text-base sm:text-lg transition ${
                    isNonZero ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {formatCurrency(rowSubtotal, settings.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Touch Numpad Modal */}
      <NumpadModal
        isOpen={Boolean(selectedDenomForNumpad)}
        onClose={() => setSelectedDenomForNumpad(null)}
        denomination={selectedDenomForNumpad}
        allDenominations={denominations}
        currentCount={selectedDenomForNumpad ? counts[selectedDenomForNumpad.value] || 0 : 0}
        onSaveCount={updateCount}
        onNavigateDenomination={(nextDenom) => setSelectedDenomForNumpad(nextDenom)}
        settings={settings}
      />

      {/* Save Tally Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSaveModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Save className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Save Cash Tally</h3>
                <p className="text-xs text-slate-400">Record session into history archive</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Amount Display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Tally Amount
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(totalAmount, settings.currency)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {totalNotes} Notes, {totalCoins} Coins ({totalPieces} Pieces)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tally Tag / Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Daily Closing', 'Morning Opening', 'Bank Deposit', 'Drawer Audit', 'General'] as const).map(
                    (tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          setTallyTag(tag);
                          setTallyTitle(tag);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                          tallyTag === tag
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title / Session Name
                </label>
                <input
                  type="text"
                  value={tallyTitle}
                  onChange={(e) => setTallyTitle(e.target.value)}
                  placeholder="e.g. Evening Drawer Closing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cashier / Verified By
                </label>
                <input
                  type="text"
                  value={payerReceiver}
                  onChange={(e) => setPayerReceiver(e.target.value)}
                  placeholder="e.g. Cashier Counter 01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={tallyNotes}
                  onChange={(e) => setTallyNotes(e.target.value)}
                  placeholder="e.g. Verified with register, cash locked in main safe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer active:scale-95"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
