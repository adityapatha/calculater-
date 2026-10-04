import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Building,
  User,
  CreditCard,
  Volume2,
  Smartphone,
  Download,
  Upload,
  Trash2,
  Check,
  Globe,
  Sliders,
  Wallet,
} from 'lucide-react';
import { AppSettings, CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currencies';
import { Storage } from '../utils/storage';
import { downloadStandaloneHtml } from '../utils/htmlExporter';
import { Code, FileCode } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataReset,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentCurrencyConfig = CURRENCY_CONFIGS[formData.currency] || CURRENCY_CONFIGS.INR;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const toggleDenomination = (val: number) => {
    const current = formData.activeDenominations || [];
    let updated: number[];
    if (current.includes(val)) {
      if (current.length <= 1) {
        alert('You must keep at least one denomination active.');
        return;
      }
      updated = current.filter((x) => x !== val);
    } else {
      updated = [...current, val].sort((a, b) => b - a);
    }
    setFormData({ ...formData, activeDenominations: updated });
  };

  const handleExportBackup = () => {
    const data = Storage.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cash_calculator_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = Storage.importBackup(content);
        if (success) {
          alert('Backup restored successfully! The app will refresh.');
          window.location.reload();
        } else {
          alert('Failed to parse backup JSON. Please check the file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'WARNING: This will permanently wipe all tallies, daily expenses, and reset to defaults. Continue?'
      )
    ) {
      Storage.clearAllData();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 relative my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">App Settings</h3>
              <p className="text-xs text-slate-400">Customise shop details, currency & denominations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Shop / Business Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              Business & Cashier Details
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shop / Store / Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Radhe Krishna Super Store"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Cashier Name
                </label>
                <input
                  type="text"
                  value={formData.cashierName}
                  onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                  placeholder="e.g. Counter 01"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Daily Opening Cash Float
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.openingBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Deposit Slip Defaults */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              Bank Deposit Slip Defaults
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 38291048592"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Currency & Number System */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Currency & Number Format
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    const code = e.target.value as CurrencyCode;
                    const conf = CURRENCY_CONFIGS[code];
                    setFormData({
                      ...formData,
                      currency: code,
                      numberSystem: conf.numberSystem,
                      activeDenominations: conf.denominations.map((d) => d.value),
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(CURRENCY_CONFIGS).map((code) => (
                    <option key={code} value={code}>
                      {CURRENCY_CONFIGS[code].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Words Numbering System
                </label>
                <select
                  value={formData.numberSystem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numberSystem: e.target.value as 'indian' | 'international',
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="indian">Indian (Lakhs, Crores)</option>
                  <option value="international">International (Millions, Billions)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Denominations Visibility Selector */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Active Denominations (Visible Rows)
            </h4>
            <p className="text-xs text-slate-400">
              Check/uncheck to show only the currency notes and coins you use:
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {currentCurrencyConfig.denominations.map((d) => {
                const isActive = (formData.activeDenominations || []).includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleDenomination(d.value)}
                    className={`p-2 rounded-xl border text-xs font-bold font-mono transition cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-slate-800 text-white border-emerald-500/70 shadow-sm'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-3.5 h-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound & Haptics */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              Sound & Feedback
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.soundEnabled}
                  onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <span className="text-xs font-medium text-slate-200">Keypad Click Audio</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hapticEnabled}
                  onChange={(e) => setFormData({ ...formData, hapticEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <span className="text-xs font-medium text-slate-200">Mobile Haptic Vibration</span>
              </label>
            </div>
          </div>

          {/* Backup, Restore & Reset */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Offline Download & Data Backup
            </h4>

            <div className="flex flex-wrap items-center gap-2">
              {/* Standalone HTML Download Button */}
              <button
                type="button"
                onClick={() => downloadStandaloneHtml(formData, Storage.getCurrentCounts())}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-emerald-950 transition cursor-pointer"
                title="Download this entire app as an offline single .html file"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Download Offline HTML App (.html)</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Restore Backup</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-medium border border-rose-900/40 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer active:scale-95"
            >
              {saveSuccess ? 'Settings Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
