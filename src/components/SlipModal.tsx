import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Building,
  FileText,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { AppSettings, DenominationCount } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currencies';
import { formatCurrency, formatWordsForCurrency } from '../utils/numberToWords';

interface SlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  counts: DenominationCount;
}

export const SlipModal: React.FC<SlipModalProps> = ({
  isOpen,
  onClose,
  settings,
  counts,
}) => {
  const [activeTab, setActiveTab] = useState<'memo' | 'bank'>('memo');
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(settings.businessName || '');
  const [bankName, setBankName] = useState(settings.bankName || 'State Bank of India');
  const [branchName, setBranchName] = useState('Main Market Branch');
  const [panNumber, setPanNumber] = useState('');
  const [depositorName, setDepositorName] = useState(settings.cashierName || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.INR;
  const denominations = currencyConfig.denominations;

  // Calculate totals
  let totalAmount = 0;
  let totalNotes = 0;
  let totalCoins = 0;

  denominations.forEach((d) => {
    const count = counts[d.value] || 0;
    totalAmount += d.value * count;
    if (d.type === 'note') totalNotes += count;
    else totalCoins += count;
  });

  const totalPieces = totalNotes + totalCoins;
  const amountInWords = formatWordsForCurrency(totalAmount, settings.currency);
  const isHighValuePanRequired = settings.currency === 'INR' && totalAmount >= 50000;

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  const downloadSlipAsHtml = () => {
    const slipElement = document.getElementById('printable-slip');
    if (!slipElement) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cash Slip - ${dateStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #111; padding: 24px; max-width: 680px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; font-weight: bold; }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${slipElement.innerHTML}
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cash_Slip_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = () => {
    let text = '';
    if (activeTab === 'bank') {
      text += `BANK CASH DEPOSIT SLIP\n`;
      text += `Bank: ${bankName} (${branchName})\n`;
      text += `Date: ${dateStr} ${timeStr}\n`;
      text += `A/C No: ${accountNumber || 'N/A'}\n`;
      text += `A/C Title: ${accountHolder}\n`;
      if (isHighValuePanRequired) text += `PAN No: ${panNumber || 'Required'}\n`;
      text += `--------------------------------\n`;
      text += `Denomination  x  Pieces = Amount\n`;
      denominations.forEach((d) => {
        const c = counts[d.value] || 0;
        if (c > 0) {
          text += `${d.label.padEnd(12)} x ${c.toString().padStart(4)} = ${formatCurrency(
            d.value * c,
            settings.currency
          )}\n`;
        }
      });
      text += `--------------------------------\n`;
      text += `Total Notes: ${totalNotes}\n`;
      text += `Total Amount: ${formatCurrency(totalAmount, settings.currency)}\n`;
      text += `In Words: ${amountInWords}\n`;
      text += `Depositor: ${depositorName || 'Self'}\n`;
    } else {
      text += `*${settings.businessName.toUpperCase()}*\n`;
      text += `CASH MEMO / DENOMINATION RECEIPT\n`;
      text += `Date: ${dateStr} ${timeStr}\n`;
      text += `Cashier: ${depositorName}\n`;
      text += `--------------------------------\n`;
      denominations.forEach((d) => {
        const c = counts[d.value] || 0;
        if (c > 0) {
          text += `${d.label.padEnd(8)} x ${c.toString().padStart(4)} = ${formatCurrency(
            d.value * c,
            settings.currency
          )}\n`;
        }
      });
      text += `--------------------------------\n`;
      text += `Total Notes: ${totalNotes}, Coins: ${totalCoins} (Total Pieces: ${totalPieces})\n`;
      text += `*GRAND TOTAL: ${formatCurrency(totalAmount, settings.currency)}*\n`;
      text += `(${amountInWords})\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 relative my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('memo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'memo'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cash Memo</span>
            </button>

            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bank Deposit Slip</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSlipAsHtml}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Download this slip as a standalone HTML file"
            >
              <span>Download HTML</span>
            </button>

            <button
              onClick={copyText}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Printable Slip Container */}
          <div
            id="printable-slip"
            className="print-container bg-white text-slate-900 rounded-xl p-5 sm:p-7 border border-slate-300 shadow-inner font-sans text-xs sm:text-sm"
          >
            {activeTab === 'bank' ? (
              /* Bank Cash Deposit Slip */
              <div className="space-y-4">
                {/* Bank Header */}
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                      {bankName}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Cash Deposit Slip • {branchName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">Date: {dateStr}</div>
                    <div className="text-[11px] text-slate-500">Time: {timeStr}</div>
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 no-print">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 38291048592"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      PAN No. (Mandatory for ≥ ₹50,000)
                    </label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 uppercase"
                    />
                  </div>
                </div>

                {/* Printed Header Info */}
                <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-2.5 rounded bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-600">A/C No: </span>
                    <span className="font-mono font-bold text-slate-900">
                      {accountNumber || '____________________'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Name: </span>
                    <span className="font-bold text-slate-900">
                      {accountHolder || '____________________'}
                    </span>
                  </div>
                  {isHighValuePanRequired && (
                    <div className="col-span-2 text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        PAN Number:{' '}
                        <strong className="font-mono">{panNumber || 'REQUIRED (Deposit ≥ ₹50,000)'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Denomination Table */}
                <table className="w-full text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 text-xs font-bold">
                      <th className="p-2 border border-slate-400">Denomination</th>
                      <th className="p-2 border border-slate-400 text-center">Pieces</th>
                      <th className="p-2 border border-slate-400 text-right">Amount ({settings.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denominations.map((d) => {
                      const count = counts[d.value] || 0;
                      return (
                        <tr
                          key={d.value}
                          className={`text-xs border-b border-slate-300 ${
                            count > 0 ? 'bg-amber-50/40 font-medium' : 'text-slate-500'
                          }`}
                        >
                          <td className="p-1.5 sm:p-2 border border-slate-300 font-mono font-bold">
                            {d.label}
                          </td>
                          <td className="p-1.5 sm:p-2 border border-slate-300 text-center font-mono">
                            {count > 0 ? count : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border border-slate-300 text-right font-mono font-bold">
                            {count > 0
                              ? formatCurrency(d.value * count, settings.currency)
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-xs sm:text-sm">
                      <td className="p-2 border border-slate-400">TOTAL NOTES</td>
                      <td className="p-2 border border-slate-400 text-center font-mono">
                        {totalNotes}
                      </td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-base text-slate-900">
                        {formatCurrency(totalAmount, settings.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in words */}
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-xs">
                  <span className="font-bold text-slate-700">Amount in Words: </span>
                  <span className="italic font-medium text-slate-900">{amountInWords}</span>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                      Signature of Depositor ({depositorName || 'Self'})
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                      Cashier / Passing Officer Stamp
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Cash Memo / Receipt */
              <div className="space-y-4">
                {/* Store Header */}
                <div className="text-center border-b border-slate-300 pb-3">
                  <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight">
                    {settings.businessName || 'CASH TALLY VOUCHER'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Daily Cash Register & Denomination Record
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-600 mt-1">
                    <span>Date: {dateStr}</span>
                    <span>•</span>
                    <span>Time: {timeStr}</span>
                  </div>
                </div>

                {/* Cashier Info */}
                <div className="flex justify-between items-center text-xs text-slate-600 py-1 border-b border-slate-200">
                  <span>Cashier: <strong>{depositorName || 'Main Counter'}</strong></span>
                  <span>Slip Ref: <strong>#CSH-{Date.now().toString().slice(-6)}</strong></span>
                </div>

                {/* Denomination Breakdown */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-700 text-left">
                      <th className="py-1.5 font-bold">Denomination</th>
                      <th className="py-1.5 text-center font-bold">Count</th>
                      <th className="py-1.5 text-right font-bold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {denominations.map((d) => {
                      const count = counts[d.value] || 0;
                      if (count === 0) return null;
                      return (
                        <tr key={d.value} className="py-1 font-mono">
                          <td className="py-1.5 font-bold text-slate-800">{d.label}</td>
                          <td className="py-1.5 text-center text-slate-700">× {count}</td>
                          <td className="py-1.5 text-right font-bold text-slate-900">
                            {formatCurrency(d.value * count, settings.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 font-bold text-sm">
                      <td className="py-2 text-slate-900">TOTAL</td>
                      <td className="py-2 text-center text-slate-800 font-mono">
                        {totalPieces} pcs
                      </td>
                      <td className="py-2 text-right text-emerald-800 font-mono text-base">
                        {formatCurrency(totalAmount, settings.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in Words */}
                <div className="p-3 bg-slate-100 rounded-lg text-xs border border-slate-200">
                  <span className="font-bold text-slate-700">Amount in Words: </span>
                  <div className="italic font-medium text-slate-900 mt-0.5">{amountInWords}</div>
                </div>

                {/* Summary Note */}
                <div className="pt-6 flex justify-between text-xs text-slate-600">
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-400 pt-1 font-medium">
                      Cashier Signature
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-400 pt-1 font-medium">
                      Manager Verified
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
