
import React, { useState } from 'react';
import { LegalUpdate, GroundingLink } from '../types';
import { getDetailedSummary } from '../services/geminiService';

interface UpdateCardProps {
  updates: LegalUpdate[];
  links: GroundingLink[];
  loading: boolean;
}

const ImpactBadge: React.FC<{ impact: string }> = ({ impact }) => {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const labels: Record<string, string> = {
    high: "Wysoki wpływ",
    medium: "Średni wpływ",
    low: "Niski wpływ",
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[impact.toLowerCase()] || styles.low}`}>
      {labels[impact.toLowerCase()] || impact}
    </span>
  );
};

const SingleUpdate: React.FC<{ update: LegalUpdate }> = ({ update }) => {
  const [detailedSummary, setDetailedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSummarize = async () => {
    setIsMenuOpen(false);
    if (detailedSummary) {
      setDetailedSummary(null);
      return;
    }
    setIsSummarizing(true);
    try {
      const summary = await getDetailedSummary(update.title, update.description);
      setDetailedSummary(summary);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-300 transition-colors group relative">
      {/* Submenu Trigger */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              onClick={handleSummarize}
              className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <i className="fas fa-magic text-indigo-500"></i>
              {detailedSummary ? "Ukryj podsumowanie" : "Szczegółowe podsumowanie"}
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${update.title}\n\n${update.description}`);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <i className="fas fa-copy text-slate-400"></i> Kopiuj treść
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pr-8">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
            {update.category}
          </span>
          <ImpactBadge impact={update.impact} />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          <i className="far fa-calendar-alt mr-1"></i> {update.date}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors pr-8">
        {update.title}
      </h3>
      
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {update.description}
      </p>

      {/* AI Detailed Summary Section */}
      {(isSummarizing || detailedSummary) && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase mb-2 tracking-wider">
            <i className={`fas ${isSummarizing ? 'fa-circle-notch fa-spin' : 'fa-sparkles'}`}></i>
            {isSummarizing ? 'Generowanie analizy...' : 'Głęboka analiza AI'}
          </div>
          {detailedSummary && (
            <div className="prose prose-sm prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
              {detailedSummary}
            </div>
          )}
        </div>
      )}

      {update.summary && !detailedSummary && (
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border-l-4 border-indigo-400">
          <strong>Kluczowy wniosek:</strong> {update.summary}
        </div>
      )}
    </div>
  );
};

const UpdateCard: React.FC<UpdateCardProps> = ({ updates, links, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
        <i className="fas fa-search mb-4 text-4xl opacity-20"></i>
        <p>Brak wyników spełniających wybrane kryteria lub nie znaleziono zmian.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {updates.map((update) => (
          <SingleUpdate key={update.id} update={update} />
        ))}
      </div>

      {links.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fas fa-link"></i> Źródła wyszukiwania
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {links.map((link, idx) => (
              <li key={idx}>
                <a 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div className="w-8 h-8 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-700 truncate font-medium">{link.title}</span>
                  <i className="fas fa-external-link-alt ml-auto text-slate-300 text-xs"></i>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UpdateCard;
