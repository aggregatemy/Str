
import React, { useState } from 'react';
import { LegalUpdate, GroundingLink } from '../types';
import { getDetailedSummary } from '../services/geminiService';

interface UpdateCardProps {
  updates: LegalUpdate[];
  links: GroundingLink[];
  loading: boolean;
  onSave?: (update: LegalUpdate) => void;
  isSaved?: (id: string) => boolean;
}

const ImpactBadge: React.FC<{ impact: string }> = ({ impact }) => {
  const config: Record<string, any> = {
    high: { style: "bg-red-50 text-red-700 border-red-100", icon: "fa-bolt", label: "Wysoki" },
    medium: { style: "bg-amber-50 text-amber-700 border-amber-100", icon: "fa-clock", label: "Średni" },
    low: { style: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "fa-info-circle", label: "Niski" },
  };
  const c = config[impact.toLowerCase()] || config.low;
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${c.style}`}>
      <i className={`fas ${c.icon}`}></i> {c.label} Wpływ
    </span>
  );
};

const SingleUpdate: React.FC<{ 
  update: LegalUpdate; 
  onSave?: (u: LegalUpdate) => void;
  saved?: boolean;
}> = ({ update, onSave, saved }) => {
  const [detailedSummary, setDetailedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleSummarize = async () => {
    setIsMenuOpen(false);
    if (detailedSummary) { setDetailedSummary(null); return; }
    setIsSummarizing(true);
    try {
      const summary = await getDetailedSummary(update.title, update.description);
      setDetailedSummary(summary);
    } finally { setIsSummarizing(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-300 group relative">
      <div className="p-6">
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={() => onSave?.(update)}
            className={`p-2 rounded-full transition-colors ${saved ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:bg-slate-50 hover:text-indigo-600'}`}
          >
            <i className={`fa-star ${saved ? 'fas' : 'far'}`}></i>
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={handleSummarize} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 flex items-center gap-3">
                  <i className="fas fa-brain text-indigo-500"></i> {detailedSummary ? "Ukryj analizę" : "Analiza głęboka AI"}
                </button>
                <button onClick={() => { setShowChecklist(!showChecklist); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 flex items-center gap-3">
                  <i className="fas fa-tasks text-emerald-500"></i> {showChecklist ? "Ukryj checklistę" : "Wyświetl checklistę"}
                </button>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <button onClick={() => { navigator.clipboard.writeText(update.title); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <i className="fas fa-share-alt text-slate-400"></i> Udostępnij
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 pr-16">
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100">
            {update.category}
          </span>
          <ImpactBadge impact={update.impact} />
          <span className="text-[10px] text-slate-400 font-bold ml-auto uppercase tracking-widest">
            <i className="far fa-calendar-check mr-1.5 text-indigo-400"></i> {update.date}
          </span>
        </div>
        
        <h3 className="text-lg font-extrabold text-slate-800 mb-3 leading-tight group-hover:text-indigo-700 transition-colors pr-10">
          {update.title}
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          {update.description}
        </p>

        {showChecklist && update.checklist && (
          <div className="mb-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-in slide-in-from-left-2">
            <h4 className="text-[10px] font-black uppercase text-emerald-700 mb-3 flex items-center gap-2">
              <i className="fas fa-clipboard-list"></i> Co musisz zrobić?
            </h4>
            <ul className="space-y-2">
              {update.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-[8px]"></i>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(isSummarizing || detailedSummary) && (
          <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase mb-3 tracking-widest">
              <i className={`fas ${isSummarizing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
              {isSummarizing ? 'Generowanie analizy...' : 'Werdykt Strażnika Prawa'}
            </div>
            {detailedSummary && (
              <div className="prose prose-sm prose-slate max-w-none text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                {detailedSummary}
              </div>
            )}
          </div>
        )}

        {!detailedSummary && update.summary && (
          <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-lg text-xs italic text-slate-500 border-l-2 border-indigo-400">
            <i className="fas fa-quote-left text-indigo-200"></i>
            {update.summary}
          </div>
        )}
      </div>
    </div>
  );
};

const UpdateCard: React.FC<UpdateCardProps> = ({ updates, links, loading, onSave, isSaved }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-32 mb-6"></div>
            <div className="h-8 bg-slate-100 rounded w-full mb-4"></div>
            <div className="h-20 bg-slate-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        {updates.map((update) => (
          <SingleUpdate key={update.id} update={update} onSave={onSave} saved={isSaved?.(update.id)} />
        ))}
      </div>

      {links.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <i className="fas fa-compass text-indigo-400"></i> Mapowanie Źródeł Legislacyjnych
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, idx) => (
              <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:scale-[1.02] transition-all border border-transparent hover:border-indigo-100 group">
                <div className="w-10 h-10 flex-shrink-0 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center text-sm font-black group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors shadow-sm">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{link.title}</p>
                  <p className="text-[10px] text-slate-400 truncate opacity-70 italic">{new URL(link.uri).hostname}</p>
                </div>
                <i className="fas fa-chevron-right ml-auto text-slate-300 text-[10px]"></i>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateCard;
