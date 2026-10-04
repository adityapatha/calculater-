import React, { useState, useEffect } from 'react';
import {
  X,
  Delete,
  CornerDownLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AppSettings, DenominationInfo } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { playKeyClickSound } from '../utils/audio';

interface NumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  denomination: DenominationInfo | null;
  allDenominations: DenominationInfo[];
  currentCount: number;
  onSaveCount: (val: number, count: number) => void;
  onNavigateDenomination: (nextDenom: DenominationInfo) => void;
  settings: AppSettings;
}

export const NumpadModal: React.FC<NumpadModalProps> = ({
  isOpen,
  onClose,
  denomination,
  allDenominations,
  currentCount,
  onSaveCount,
  onNavigateDenomination,
  settings,
}) => {
  const [valString, setValString] = useState<string>(
    currentCount === 0 ? '' : currentCount.toString()
  );

  useEffect(() => {
    if (denomination) {
      setValString(currentCount === 0 ? '' : currentCount.toString());
    }
  }, [denomination, currentCount]);

  if (!isOpen || !denomination) return null;

  const numericCount = valString === '' ? 0 : parseInt(valString, 10) || 0;
  const subtotal = denomination.value * numericCount;

  const handleDigit = (digit: string) => {
    playKeyClickSound(settings.soundEnabled);
    if (valString.length >= 6) return;
    if (valString === '0' && digit !== '0') {
      setValString(digit);
    } else {
      setValString(valString + digit);
    }
  };

  const handleBackspace = () => {
    playKeyClickSound(settings.soundEnabled);
    setValString(valString.slice(0, -1));
  };

  const handleClear = () => {
    playKeyClickSound(settings.soundEnabled);
    setValString('');
  };

  const handleAddBundle = (bundleSize: number) => {
    playKeyClickSound(settings.soundEnabled);
    const updated = numericCount + bundleSize;
    setValString(updated.toString());
  };

  const handleConfirmAndNext = () => {
    onSaveCount(denomination.value, numericCount);
    // Find next denomination in list
    const currentIndex = allDenominations.findIndex((d) => d.value === denomination.value);
    if (currentIndex >= 0 && currentIndex < allDenominations.length - 1) {
      onNavigateDenomination(allDenominations[currentIndex + 1]);
    } else {
      onClose();
    }
  };

  const handleConfirmAndClose = () => {
    onSaveCount(denomination.value, numericCount);
    onClose();
  };

  const currentIndex = allDenominations.findIndex((d) => d.value === denomination.value);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allDenominations.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 p-5 relative animate-in fade-in zoom-in-95">
        {/* Top Header with Denomination info and navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onSaveCount(denomination.value, numericCount);
                if (hasPrev) onNavigateDenomination(allDenominations[currentIndex - 1]);
              }}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Denomination"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onSaveCount(denomination.value, numericCount);
                if (hasNext) onNavigateDenomination(allDenominations[currentIndex + 1]);
              }}
              disabled={!hasNext}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Denomination"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div
            className="px-3.5 py-1 rounded-xl text-sm font-black font-mono shadow-sm"
            style={{
              backgroundColor: `${denomination.color}25`,
              color: denomination.color,
              border: `1.5px solid ${denomination.color}77`,
            }}
          >
            {denomination.label}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="my-3.5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {denomination.label} × {numericCount} Notes
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight mt-1">
            {valString === '' ? '0' : valString}
          </div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
            = {formatCurrency(subtotal, settings.currency)}
          </div>
        </div>

        {/* Bundle Shortcuts */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[+1, +5, +10, +100].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => handleAddBundle(step)}
              className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700/80 transition cursor-pointer active:scale-95"
            >
              +{step === 100 ? '100 (Bundle)' : step}
            </button>
          ))}
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-lg border border-slate-700/80 transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 text-rose-400 font-bold text-xs uppercase border border-slate-700/80 transition cursor-pointer active:scale-95 flex items-center justify-center"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-lg border border-slate-700/80 transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Next / Done Actions */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmAndClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>

          <button
            type="button"
            onClick={handleConfirmAndNext}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Next ({hasNext ? allDenominations[currentIndex + 1].label : 'Finish'})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
