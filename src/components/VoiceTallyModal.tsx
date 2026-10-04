import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Check,
  Plus,
  ArrowRight,
  Volume2,
  HelpCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { AppSettings, DenominationCount } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currencies';
import { formatCurrency, formatWordsForCurrency } from '../utils/numberToWords';
import { parseVoiceInput, speakConfirmation, VoiceParseResult } from '../utils/voiceParser';
import { playCashRegisterSound, playKeyClickSound } from '../utils/audio';

interface VoiceTallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentCounts: DenominationCount;
  onApplyCounts: (newCounts: DenominationCount) => void;
}

export const VoiceTallyModal: React.FC<VoiceTallyModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentCounts,
  onApplyCounts,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [applyMode, setApplyMode] = useState<'replace' | 'add'>('replace');
  const [speakFeedback, setSpeakFeedback] = useState(true);
  const [browserSupport, setBrowserSupport] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.INR;
  const validDenominations = currencyConfig.denominations.map((d) => d.value);

  // Parse transcript in real-time
  const parseResult: VoiceParseResult = parseVoiceInput(transcript, validDenominations);

  // Compute what the updated counts will look like
  const previewCounts: DenominationCount = { ...(applyMode === 'add' ? currentCounts : {}) };
  if (parseResult.isResetAll) {
    validDenominations.forEach((d) => (previewCounts[d] = 0));
  } else {
    parseResult.commands.forEach((cmd) => {
      const prev = applyMode === 'add' ? currentCounts[cmd.denomination] || 0 : 0;
      if (cmd.action === 'clear') {
        previewCounts[cmd.denomination] = 0;
      } else if (cmd.action === 'add') {
        previewCounts[cmd.denomination] = (previewCounts[cmd.denomination] || prev) + cmd.count;
      } else {
        previewCounts[cmd.denomination] = cmd.count;
      }
    });
  }

  // Calculate preview total
  let previewTotal = 0;
  let previewPieces = 0;
  Object.entries(previewCounts).forEach(([denomStr, count]) => {
    const val = parseFloat(denomStr);
    previewTotal += val * count;
    previewPieces += count;
  });

  // Setup Web Speech API
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.currency === 'INR' ? 'en-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setPermissionError('Microphone permission was denied. Please allow mic access or use text input.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      // Start listening automatically when modal opens
      try {
        recognition.start();
      } catch {
        // May already be running
      }
    } catch (err) {
      console.error(err);
      setBrowserSupport(false);
    }

    return () => {
      stopListening();
    };
  }, [isOpen, settings.currency]);

  const startListening = () => {
    setPermissionError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  };

  const handleApply = () => {
    onApplyCounts(previewCounts);
    playCashRegisterSound(settings.soundEnabled);

    if (speakFeedback) {
      const spokenSummary = parseResult.commands
        .map((c) => `${c.count} notes of ${c.denomination}`)
        .join(', ');
      const totalWords = formatWordsForCurrency(previewTotal, settings.currency);
      speakConfirmation(`Recorded ${spokenSummary}. Total is ${formatCurrency(previewTotal, settings.currency)}.`);
    }

    onClose();
  };

  const setSamplePrompt = (sampleText: string) => {
    setTranscript(sampleText);
    playKeyClickSound(settings.soundEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 relative my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-rose-900/50 animate-pulse'
                    : 'bg-emerald-600 text-white shadow-emerald-900/40'
                }`}
              >
                <Mic className="w-5 h-5" />
              </div>
              {isListening && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Voice-Typing Cash Counter</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI SPEECH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Speak denominations e.g. "200 notes of 500 and 52 notes of 100"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Microphone Control Orb & Status */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center relative overflow-hidden">
            {/* Animated speech wave ripples when listening */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-36 h-36 rounded-full border-2 border-emerald-400 animate-ping" />
                <div className="w-48 h-48 rounded-full border border-teal-400 animate-pulse" />
              </div>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer transform active:scale-95 z-10 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-900/60 ring-4 ring-rose-500/30 scale-105'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-900/50 hover:brightness-110 ring-4 ring-emerald-500/20'
              }`}
              title={isListening ? 'Click to Stop Listening' : 'Click to Speak'}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="mt-3 text-xs font-semibold z-10">
              {isListening ? (
                <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Listening live... Speak your denominations clearly
                </span>
              ) : (
                <span className="text-slate-400">
                  Tap microphone to start speaking or edit below
                </span>
              )}
            </div>

            {permissionError && (
              <div className="mt-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 px-3 py-1.5 rounded-lg z-10">
                {permissionError}
              </div>
            )}
          </div>

          {/* Transcript / Spoken Text Input Field */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Spoken Transcript / Command</span>
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. 200 notes of 500 and 52 notes of 100"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500 resize-none font-sans"
            />
          </div>

          {/* Quick Clickable Voice Test Chips (Including exact user prompt!) */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Quick Voice Examples (Tap to Test)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                '200 notes of 500 and 52 notes of 100',
                '50 notes of 2000, 40 notes of 500, 20 notes of 200',
                '2 bundles of 500 and 5 bundles of 100',
                '500 ke 40 note aur 100 ke 25',
                'clear 2000 and set 500 to 80',
                'reset all',
              ].map((sample) => (
                <button
                  type="button"
                  key={sample}
                  onClick={() => setSamplePrompt(sample)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer text-left"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Recognition & Parsed Result Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Parsed Voice Fields
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatCurrency(previewTotal, settings.currency)} ({previewPieces} pcs)
              </span>
            </div>

            {parseResult.isResetAll ? (
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Command: <strong>Reset all counts to 0</strong></span>
              </div>
            ) : parseResult.commands.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 italic">
                {transcript.trim()
                  ? 'Could not detect denomination values. Try saying: "200 notes of 500"'
                  : 'Start speaking or tap a sample above to preview parsed fields.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parseResult.commands.map((cmd, idx) => {
                  const denomObj = currencyConfig.denominations.find(
                    (d) => d.value === cmd.denomination
                  );
                  const subtotal = cmd.denomination * cmd.count;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-bold font-mono"
                          style={{
                            backgroundColor: `${denomObj?.color || '#10b981'}25`,
                            color: denomObj?.color || '#10b981',
                            border: `1px solid ${denomObj?.color || '#10b981'}50`,
                          }}
                        >
                          {denomObj?.label || cmd.denomination}
                        </span>
                        <div className="text-xs">
                          <span className="text-white font-bold font-mono">{cmd.count}</span>{' '}
                          <span className="text-slate-400">notes</span>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-xs text-emerald-400">
                        {cmd.action === 'clear' ? (
                          <span className="text-rose-400">Cleared (0)</span>
                        ) : (
                          formatCurrency(subtotal, settings.currency)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unrecognized words warning if any */}
            {parseResult.unrecognizedParts.length > 0 && (
              <div className="text-[11px] text-amber-400/90 pt-1">
                Ignored extra phrases: "{parseResult.unrecognizedParts.join(', ')}"
              </div>
            )}
          </div>

          {/* Options: Replace vs Add, Voice Confirmation Feedback */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Action:</span>
              <button
                type="button"
                onClick={() => setApplyMode('replace')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  applyMode === 'replace'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Replace Values
              </button>
              <button
                type="button"
                onClick={() => setApplyMode('add')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  applyMode === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                + Add to Existing
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={speakFeedback}
                onChange={(e) => setSpeakFeedback(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1 text-slate-400">
                <Volume2 className="w-3.5 h-3.5" /> Spoken Confirmation
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!parseResult.isResetAll && parseResult.commands.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Cash Counter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
