import React from 'react';
import {
  Coins,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  Wifi,
  WifiOff,
  Mic,
} from 'lucide-react';
import { AppSettings, CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currencies';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/usePWAInstall';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
  onOpenVoiceModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenVoiceModal,
}) => {
  const isOnline = useOnlineStatus();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleSound = () => {
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleTheme = () => {
    const nextTheme =
      settings.theme === 'dark' ? 'amoled' : settings.theme === 'amoled' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/90 border-b border-slate-800/80 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0 text-white border border-emerald-400/40">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                Cash Calculator
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {settings.businessName || 'Daily Cash Register & Denominations'}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Voice Typing Button */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer ring-1 ring-emerald-400/30"
              title="Voice Typing (Speak Denominations)"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Voice Count</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative">
            <select
              value={settings.currency}
              onChange={(e) => onUpdateSettings({ currency: e.target.value as CurrencyCode })}
              className="appearance-none bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 pr-6 border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              title="Change Currency"
            >
              {Object.keys(CURRENCY_CONFIGS).map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_CONFIGS[code].symbol} {code}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
              <span className="text-[10px]">▼</span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                : 'bg-slate-800/50 hover:bg-slate-700/60 text-slate-500 border border-transparent'
            }`}
            title={settings.soundEnabled ? 'Keypad Sound: ON' : 'Keypad Sound: OFF'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={`Current theme: ${settings.theme}. Click to switch.`}
          >
            {settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : settings.theme === 'amoled' ? (
              <Sparkles className="w-4 h-4 text-purple-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Online/Offline status pill */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-400'
            }`}
            title={isOnline ? 'Online (Data cached locally)' : 'Offline (Working seamlessly)'}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Offline-Ready' : 'Offline'}</span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

