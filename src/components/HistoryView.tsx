import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Calendar,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Tag,
  User,
  Clock,
  Banknote,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { AppSettings, DenominationCount, TallyRecord } from '../types';
import { formatCurrency } from '../utils/numberToWords';

interface HistoryViewProps {
  settings: AppSettings;
  tallies: TallyRecord[];
  onLoadTally: (counts: DenominationCount) => void;
  onDeleteTally: (id: string) => void;
  onOpenSlipForTally: (counts: DenominationCount) => void;
  onGoToCounter: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  settings,
  tallies,
  onLoadTally,
  onDeleteTally,
  onOpenSlipForTally,
  onGoToCounter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const filteredTallies = useMemo(() => {
    return tallies.filter((tally) => {
      if (selectedTag !== 'all' && tally.tag !== selectedTag) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = tally.title.toLowerCase().includes(query);
        const matchesNotes = tally.notes?.toLowerCase().includes(query);
        const matchesCashier = tally.payerReceiver?.toLowerCase().includes(query);
        const matchesDate = tally.dateStr.includes(query);
        if (!matchesTitle && !matchesNotes && !matchesCashier && !matchesDate) return false;
      }
      return true;
    });
  }, [tallies, selectedTag, searchQuery]);

  const exportTalliesCSV = () => {
    let csv = 'Date,Time,Title,Tag,Total Amount,Total Notes,Total Coins,Total Pieces,Cashier,Notes\n';
    tallies.forEach((t) => {
      csv += `"${t.dateStr}","${t.timeStr}","${t.title}","${t.tag || ''}",${t.totalAmount},${t.totalNotes},${t.totalCoins},${t.totalPieces},"${t.payerReceiver || ''}","${(t.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cash_tallies_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Cash Tally Archives</h2>
            <p className="text-xs text-slate-400">
              {tallies.length} saved cash denomination sessions
            </p>
          </div>
        </div>

        <button
          onClick={exportTalliesCSV}
          disabled={tallies.length === 0}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export All to CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tag Filters */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          {['all', 'Daily Closing', 'Morning Opening', 'Bank Deposit', 'Drawer Audit'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
                selectedTag === tag
                  ? 'bg-slate-800 text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag === 'all' ? 'All Records' : tag}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records / cashier..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tally Records List */}
      <div className="space-y-3">
        {filteredTallies.length === 0 ? (
          <div className="text-center py-14 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No tallies found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Save your cash count session from the Cash Counter tab to view it here.
            </p>
            <button
              onClick={onGoToCounter}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <span>Go to Cash Counter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          filteredTallies.map((tally) => {
            const dateDisplay = new Date(tally.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={tally.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 shadow-md transition space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-bold text-white">{tally.title}</span>
                    {tally.tag && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tally.tag}
                      </span>
                    )}
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dateDisplay} at {tally.timeStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {formatCurrency(tally.totalAmount, tally.currencyCode || settings.currency)}
                    </div>
                  </div>
                </div>

                {/* Denomination Counts Mini Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(tally.counts).map(([denom, count]) => {
                    const c = Number(count);
                    if (c <= 0) return null;
                    return (
                      <span
                        key={denom}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-medium text-slate-300"
                      >
                        <span className="text-slate-400 font-bold">{denom}</span>
                        <span className="text-emerald-400">×{c}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Sub-info: Words and Cashier */}
                <div className="text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="italic text-slate-300">
                    "{tally.amountInWords}"
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    {tally.payerReceiver && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{tally.payerReceiver}</span>
                      </span>
                    )}
                    <span>{tally.totalPieces} pcs ({tally.totalNotes} notes)</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 italic truncate max-w-xs">
                    {tally.notes && `Note: ${tally.notes}`}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoadTally(tally.counts)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      title="Load these denomination counts into the active Cash Counter"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Load in Counter</span>
                    </button>

                    <button
                      onClick={() => onOpenSlipForTally(tally.counts)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      title="View printable slip / memo"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Slip</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this saved tally record?')) {
                          onDeleteTally(tally.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
