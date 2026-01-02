
import React from 'react';
import { LegalUpdate, GroundingLink } from '../types';

/**
 * Props dla komponentu UpdateCard.
 * 
 * @interface UpdateCardProps
 * @description Właściwości przekazywane do głównego komponentu wyświetlania kart aktualizacji.
 * Komponent obsługuje wyświetlanie listy aktualizacji prawnych, linków weryfikacyjnych,
 * stanów ładowania oraz interakcje użytkownika (zapisywanie, zaznaczanie).
 * 
 * @property {LegalUpdate[]} updates - Lista aktualizacji prawnych do wyświetlenia
 * @property {GroundingLink[]} links - Lista linków weryfikacyjnych z Gemini AI
 * @property {boolean} loading - Czy trwa ładowanie danych
 * @property {Function} [onSave] - Opcjonalna funkcja wywoływana przy zapisie dokumentu
 * @property {Function} [isSaved] - Opcjonalna funkcja sprawdzająca czy dokument jest zapisany
 * @property {string[]} [selectedIds] - Opcjonalna lista ID zaznaczonych dokumentów
 * @property {Function} [onToggleSelection] - Opcjonalna funkcja przełączania zaznaczenia
 */
interface UpdateCardProps {
  updates: LegalUpdate[];
  links: GroundingLink[];
  loading: boolean;
  onSave?: (update: LegalUpdate) => void;
  isSaved?: (id: string) => boolean;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
}

/**
 * Komponent pojedynczej karty aktualizacji prawnej.
 * 
 * @component
 * @description Wyświetla szczegółowe informacje o pojedynczej aktualizacji prawnej
 * w formie karty. Zawiera:
 * - Checkbox do zaznaczania dokumentu
 * - Badge z metodą ingestii (ELI/RSS/Scraper)
 * - Tytuł i kategorię aktualizacji
 * - Opcjonalny ELI URI
 * - Status prawny
 * - Oficjalne uzasadnienie
 * - Przycisk archiwizacji
 * 
 * @param {Object} props - Właściwości komponentu
 * @param {LegalUpdate} props.update - Obiekt aktualizacji prawnej do wyświetlenia
 * @param {Function} [props.onSave] - Funkcja wywoływana przy zapisie dokumentu
 * @param {boolean} [props.saved] - Czy dokument jest zapisany w archiwum
 * @param {boolean} [props.isSelected] - Czy dokument jest zaznaczony
 * @param {Function} [props.onToggleSelection] - Funkcja przełączania zaznaczenia
 * @returns {JSX.Element} Wyrenderowana karta aktualizacji
 */
const SingleUpdate: React.FC<{ 
  update: LegalUpdate; 
  onSave?: (u: LegalUpdate) => void;
  saved?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}> = ({ update, onSave, saved, isSelected, onToggleSelection }) => {

  /**
   * Mapowanie metod ingestii na czytelne etykiety.
   * 
   * @constant
   * @type {Object.<IngestMethod, string>}
   * @description Słownik tłumaczący kody metod na pełne nazwy protokołów:
   * - eli → "Protokół ELI API"
   * - rss → "Kanał RSS/XML"
   * - scraper → "Silnik Scrapera NFZ"
   */
  const methodLabel = {
    eli: 'Protokół ELI API',
    rss: 'Kanał RSS/XML',
    scraper: 'Silnik Scrapera NFZ'
  };

  /**
   * Mapowanie metod ingestii na klasy CSS dla badge'ów.
   * 
   * @constant
   * @type {Object.<IngestMethod, string>}
   * @description Słownik definiujący kolory badge'ów dla różnych metod:
   * - eli → niebieski (bg-blue-800)
   * - rss → zielony (bg-green-800)
   * - scraper → bursztynowy (bg-amber-700)
   */
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

/**
 * Główny komponent wyświetlania kart aktualizacji prawnych.
 * 
 * @component
 * @description Komponent odpowiedzialny za renderowanie listy wszystkich aktualizacji prawnych
 * oraz sekcji z linkami weryfikacyjnymi (grounding links). Obsługuje:
 * - Stan ładowania z animowanymi placeholderami
 * - Wyświetlanie komunikatu gdy brak danych
 * - Mapowanie aktualizacji na komponenty SingleUpdate
 * - Wyświetlanie zweryfikowanych punktów danych (grounding links)
 * - Przekazywanie callbacków do komponentów podrzędnych
 * 
 * @param {UpdateCardProps} props - Właściwości komponentu
 * @returns {JSX.Element} Wyrenderowana lista kart aktualizacji z linkami weryfikacyjnymi
 * 
 * @example
 * <UpdateCard 
 *   updates={legalUpdates} 
 *   links={groundingLinks} 
 *   loading={false}
 *   onSave={(update) => handleSave(update)}
 *   isSaved={(id) => savedIds.includes(id)}
 *   selectedIds={selected}
 *   onToggleSelection={(id) => toggleSelection(id)}
 * />
 */
const UpdateCard: React.FC<UpdateCardProps> = ({ updates, links, loading, onSave, isSaved, selectedIds = [], onToggleSelection }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white border border-slate-100 rounded animate-pulse"></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        {updates.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Brak nowych danych z ELI/RSS/SCRAPER</p>
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

      {links.length > 0 && (
        <div className="bg-slate-900 p-8 rounded shadow-xl">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-6 flex items-center gap-4">
            <i className="fas fa-database text-amber-600"></i> Zweryfikowane Punkty Danych
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, idx) => (
              <a 
                key={idx} 
                href={link.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors flex items-center justify-between group"
              >
                <div className="flex flex-col truncate pr-4">
                   <span className="text-[9px] font-black text-slate-200 truncate uppercase">{link.title}</span>
                   <span className="text-[8px] text-slate-500 font-mono truncate">{link.uri}</span>
                </div>
                <i className="fas fa-arrow-up-right-from-square text-slate-600 group-hover:text-amber-500"></i>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateCard;
