
import React from 'react';
import { LegalUpdate } from '../types';

interface UpdateCardProps {
  updates: LegalUpdate[];
  loading: boolean;
  onSave?: (update: LegalUpdate) => void;
  isSaved?: (id: string) => boolean;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
}

const SingleUpdate: React.FC<{ 
  update: LegalUpdate; 
  onSave?: (u: LegalUpdate) => void;
  saved?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}> = ({ update, onSave, saved, isSelected, onToggleSelection }) => {

  const methodLabel = {
    eli: 'API Sejmu (JSON/ELI)',
    rss: 'Kanał RSS/XML',
    scraper: 'Silnik Scrapera HTML'
  };

  const methodBadge = {
    eli: 'bg-blue-800 text-white',
    rss: 'bg-green-800 text-white',
    scraper: 'bg-amber-700 text-white'
  };

  return (
    <div className={`bg-white border-2 rounded shadow-sm transition-all ${isSelected ? 'border-[#800000]' : 'border-slate-200'}`}>
      <div className="p-8 flex gap-6">
        <div className="pt-2">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={onToggleSelection}
            className="w-6 h-6 border-slate-300 rounded-none text-[#800000] cursor-pointer"
          />
        </div>
        
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter ${methodBadge[update.ingestMethod]}`}>
              {methodLabel[update.ingestMethod]}
            </span>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{update.category}</span>
            <span className="ml-auto text-[10px] font-bold text-slate-400 font-mono italic">Publikacja: {update.date}</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">{update.title}</h3>
            {update.eliUri && (
              <div className="inline-flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
                <span className="text-[8px] font-black text-slate-500 uppercase">ELI URI:</span>
                <code className="text-[10px] text-slate-700 font-mono">{update.eliUri}</code>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Status prawny (Metadata):</span>
              <span className="text-[11px] font-black text-[#800000] uppercase">{update.legalStatus}</span>
            </div>

            <div className="p-5 border-l-4 border-slate-300 bg-slate-50/30">
              <span className="text-[9px] font-black uppercase text-slate-500 block mb-3 tracking-widest">Oficjalne uzasadnienie / Cel zmiany:</span>
              <p className="text-[13px] text-slate-700 leading-relaxed font-serif">
                {update.officialRationale || "Brak dostępnego ustrukturyzowanego uzasadnienia w źródle."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
             <span className="text-[9px] font-bold text-slate-400 uppercase">ID Systemowe: {update.id}</span>
             <button onClick={() => onSave?.(update)} className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-2">
                <i className={saved ? "fas fa-bookmark text-[#800000]" : "far fa-bookmark"}></i>
                {saved ? "Zarchiwizowano" : "Archiwizuj dokument"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UpdateCard: React.FC<UpdateCardProps> = ({ updates, loading, onSave, isSaved, selectedIds = [], onToggleSelection }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Pobieranie danych z 10 źródeł...</p>
              <p className="text-[8px] text-slate-400 font-mono">ELI: Sejm (DU+MP) + 5 ministerstw | RSS: ZUS + CEZ | Scraper: NFZ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        {updates.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded">
            <div className="flex flex-col items-center gap-4">
              <i className="fas fa-inbox text-4xl text-slate-300"></i>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Brak nowych danych z ELI/RSS/SCRAPER</p>
              <p className="text-[9px] text-slate-500 max-w-md">
                Wszystkie źródła zostały sprawdzone. Nie znaleziono nowych aktów prawnych w wybranym okresie.
              </p>
            </div>
          </div>
        ) : (
          updates.map((update) => (
            <SingleUpdate 
              key={update.id} 
              update={update} 
              onSave={onSave} 
              saved={isSaved?.(update.id)} 
              isSelected={selectedIds.includes(update.id)}
              onToggleSelection={() => onToggleSelection?.(update.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UpdateCard;
