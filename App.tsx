
import React, { useState, useEffect, useMemo } from 'react';
import { LegalUpdate, SystemConfig } from './types';
import { fetchLegalUpdates, fetchELIUpdates, fetchRSSUpdates, fetchNFZUpdates, exportUpdates } from './services/apiService';
import UpdateCard from './components/UpdateCard';
import HealthIndicator from './components/HealthIndicator';

// Helper function to get range label
function getRangeLabel(range: ZakresCzasu): string {
  switch (range) {
    case '7d':
      return '7 dni';
    case '30d':
      return '30 dni';
    case '90d':
      return '90 dni';
    default:
      return '7 dni';
  }
}

// Helper function to get error class name
function getErrorClassName(errorType: 'network' | 'server' | 'data'): string {
  const baseClasses = 'mb-8 p-6 border-2 rounded';
  switch (errorType) {
    case 'network':
      return `${baseClasses} bg-red-50 border-red-200`;
    case 'server':
      return `${baseClasses} bg-orange-50 border-orange-200`;
    case 'data':
      return `${baseClasses} bg-yellow-50 border-yellow-200`;
    default:
      return baseClasses;
  }
}

// Helper function to get error icon class
function getErrorIconClass(errorType: string): string {
  const baseClasses = 'fas text-xl';
  switch (errorType) {
    case 'network':
      return `${baseClasses} fa-wifi text-red-600`;
    case 'server':
      return `${baseClasses} fa-exclamation-triangle text-orange-600`;
    case 'data':
      return `${baseClasses} fa-database text-yellow-600`;
    default:
      return baseClasses;
  }
}

// Helper function to get error title class
function getErrorTitleClass(errorType: string): string {
  const baseClasses = 'text-[10px] font-black uppercase tracking-widest mb-2';
  switch (errorType) {
    case 'network':
      return `${baseClasses} text-red-800`;
    case 'server':
      return `${baseClasses} text-orange-800`;
    case 'data':
      return `${baseClasses} text-yellow-800`;
    default:
      return baseClasses;
  }
}

// Helper function to get source badge class
function getSourceBadgeClass(sourceType: string): string {
  switch (sourceType) {
    case 'eli':
      return 'bg-blue-600 text-white';
    case 'rss':
      return 'bg-green-600 text-white';
    case 'scraper':
      return 'bg-amber-700 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
}

const KONFIGURACJA_DYNAMICZNA: SystemConfig = {
  masterSites: [
    // === KLIENT A: PARLAMENT (JSON) ===
    { id: 'eli-sejm-du', name: 'Sejm RP - Dziennik Ustaw (DU)', url: 'https://api.sejm.gov.pl/eli/acts/DU', isActive: true, type: 'eli' },
    { id: 'eli-sejm-mp', name: 'Sejm RP - Monitor Polski (MP)', url: 'https://api.sejm.gov.pl/eli/acts/MP', isActive: true, type: 'eli' },
    
    // === KLIENT B: MINISTERSTWA (XML) ===
    { id: 'eli-mz', name: 'Ministerstwo Zdrowia', url: 'https://dziennikmz.mz.gov.pl/api/eli/acts', isActive: true, type: 'eli' },
    { id: 'eli-mswia', name: 'MSWiA', url: 'https://edziennik.mswia.gov.pl/api/eli/acts', isActive: true, type: 'eli' },
    { id: 'eli-men', name: 'Ministerstwo Edukacji', url: 'https://dziennik.men.gov.pl/api/eli/acts', isActive: true, type: 'eli' },
    { id: 'eli-mon', name: 'MON', url: 'https://dziennik.mon.gov.pl/api/eli/acts', isActive: true, type: 'eli' },
    { id: 'eli-nbp', name: 'Narodowy Bank Polski', url: 'https://dzu.nbp.pl/api/eli/acts', isActive: true, type: 'eli' },
    
    // === RSS + SCRAPERS ===
    { id: 'rss-zus', name: 'ZUS Aktualności (RSS)', url: 'https://www.zus.pl/o-zus/aktualnosci', isActive: true, type: 'rss' },
    { id: 'rss-cez', name: 'e-Zdrowie CEZ (RSS)', url: 'https://www.ezdrowie.gov.pl', isActive: true, type: 'rss' },
    { id: 'nfz', name: 'NFZ Zarządzenia (Scraper)', url: 'https://www.nfz.gov.pl/zarzadzenia-prezesa/', isActive: true, type: 'scraper' }
  ],
  strategicTopics: [
    "Zarządzenia Prezesa NFZ",
    "Ustawy zdrowotne",
    "Komunikaty ZUS",
    "P1/P2/e-Zdrowie",
    "Rozporządzenia MZ"
  ]
};

type ZakresCzasu = '7d' | '30d' | '90d';

const App: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('straznik_prawa_v13_konfig');
    return saved ? JSON.parse(saved) : KONFIGURACJA_DYNAMICZNA;
  });

  const [zakres, setZakres] = useState<ZakresCzasu>('7d');
  const [zrodlo, setZrodlo] = useState<'all' | 'eli' | 'rss' | 'nfz'>('all');
  const [zmiany, setZmiany] = useState<LegalUpdate[]>([]);
  const [zapisane, setZapisane] = useState<LegalUpdate[]>(() => {
    const saved = localStorage.getItem('zapisane_v13');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [laduje, setLaduje] = useState(false);
  const [blad, setBlad] = useState<{ message: string; type: 'network' | 'server' | 'data' } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [widok, setWidok] = useState<'glowny' | 'archiwum' | 'zrodla'>('glowny');
  const [zaznaczone, setZaznaczone] = useState<string[]>([]);

  const [raportOtwarty, setRaportOtwarty] = useState(false);
  const [trescRaportu, setTrescRaportu] = useState('');
  const [generujeRaport, setGenerujeRaport] = useState(false);

  useEffect(() => localStorage.setItem('straznik_prawa_v13_konfig', JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem('zapisane_v13', JSON.stringify(zapisane)), [zapisane]);

  const pobierzDane = async () => {
    setLaduje(true); setBlad(null);
    try {
      let wynik: LegalUpdate[];
      
      if (zrodlo === 'eli') {
        wynik = await fetchELIUpdates(zakres);
      } else if (zrodlo === 'rss') {
        wynik = await fetchRSSUpdates(zakres);
      } else if (zrodlo === 'nfz') {
        wynik = await fetchNFZUpdates(zakres);
      } else {
        wynik = await fetchLegalUpdates(zakres);
      }
      
      if (wynik.length === 0 && retryCount < 3) {
        setBlad({ message: 'Brak danych. Źródła mogą być niedostępne. Próba ponownego połączenia...', type: 'data' });
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          pobierzDane();
        }, 2000);
        return;
      }
      setZmiany(wynik);
      setZaznaczone(wynik.map(u => u.id));
      setRetryCount(0);
    } catch (err: any) {
      console.error('Błąd pobierania danych:', err);
      const errorType = err.message?.includes('fetch') ? 'network' : 'server';
      setBlad({
        message: errorType === 'network' 
          ? 'Błąd połączenia z backendem. Sprawdź czy serwer działa na porcie 5554.'
          : 'Błąd systemu ingestii. Źródła ELI: Sejm (DU+MP), MZ, MSWiA, MEN, MON, NBP + RSS: ZUS, CEZ + NFZ Scraper.',
        type: errorType
      });
    } finally { setLaduje(false); }
  };

  useEffect(() => {
    if (widok === 'glowny') pobierzDane();
  }, [zakres, zrodlo]);

  const filtrowaneZmiany = useMemo(() => {
    return widok === 'archiwum' ? zapisane : zmiany;
  }, [widok, zapisane, zmiany]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e293b] flex items-center justify-center rounded-sm">
                 <i className="fas fa-server text-white text-xs"></i>
              </div>
              <div>
                <h1 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Repozytorium Aktów</h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Zero-AI Assessment • Faktograficzna Ingestia</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              {/* Health Dashboard */}
              <div className="w-40">
                <HealthIndicator />
              </div>

              {/* Time Range Selector */}
              <div className="flex bg-slate-100 p-1 rounded border border-slate-200">
                {(['7d', '30d', '90d'] as ZakresCzasu[]).map(z => (
                  <button key={z} onClick={() => setZakres(z)} className={`px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zakres === z ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {getRangeLabel(z)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {widok === 'glowny' && (
            <div className="flex gap-2">
              <button 
                onClick={() => setZrodlo('all')} 
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zrodlo === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                Wszystkie
              </button>
              <button 
                onClick={() => setZrodlo('eli')} 
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zrodlo === 'eli' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                🇪🇺 ELI
              </button>
              <button 
                onClick={() => setZrodlo('rss')} 
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zrodlo === 'rss' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                📡 RSS
              </button>
              <button 
                onClick={() => setZrodlo('nfz')} 
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zrodlo === 'nfz' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                🏥 NFZ
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-8 mb-10 border-b border-slate-200 pb-4">
          <button onClick={() => setWidok('glowny')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'glowny' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Dane Faktograficzne</button>
          <button onClick={() => setWidok('archiwum')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'archiwum' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Zarchiwizowane</button>
          <button onClick={() => setWidok('zrodla')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'zrodla' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Parametry API</button>
        </div>

        {blad && (
          <div className={getErrorClassName(blad.type)}>
            <div className="flex items-start gap-4">
              <i className={getErrorIconClass(blad.type)}></i>
              <div className="flex-1">
                <h3 className={getErrorTitleClass(blad.type)}>Błąd Systemu</h3>
                <p className="text-[11px] text-slate-700 leading-relaxed mb-4">{blad.message}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setBlad(null); setRetryCount(0); pobierzDane(); }} title="Ponownie załaduj dane" className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase hover:bg-black transition-all">
                    <i className="fas fa-redo mr-2"></i>Ponów próbę
                  </button>
                  <button onClick={() => setBlad(null)} title="Zamknij komunikat błędu" className="px-4 py-2 border-2 border-slate-300 text-slate-700 text-[9px] font-black uppercase hover:bg-slate-100 transition-all">
                    Zamknij
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {widok === 'zrodla' ? (
          <div className="bg-white border border-slate-200 p-10 space-y-8">
            <h2 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-3">
               <i className="fas fa-microchip"></i> Architektura Ingestii Backendu
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
              Poniższe moduły są implementowane po stronie serwera w celu zbierania danych z oficjalnych interfejsów państwowych.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {config.masterSites.map(site => (
                <div key={site.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded flex items-center justify-center text-[10px] font-black text-white ${getSourceBadgeClass(site.type)}`}>
                      {site.type.toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-800 uppercase">{site.name}</span>
                      <span className="text-[8px] text-slate-400 font-mono tracking-tight">Endpoint: {site.url}</span>
                    </div>
                  </div>
                  <button 
                    title={`${site.isActive ? 'Wyłącz' : 'Włącz'} ${site.name}`}
                    onClick={() => setConfig({...config, masterSites: config.masterSites.map(s => s.id === site.id ? {...s, isActive: !s.isActive} : s)})} 
                    className={`w-12 h-6 rounded-full relative transition-all ${site.isActive ? 'bg-slate-900' : 'bg-slate-300'}`}
                    aria-label={`Przełącz ${site.name}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${site.isActive ? 'left-[26px]' : 'left-[6px]'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <UpdateCard 
            updates={filtrowaneZmiany} 
            loading={laduje} 
            onSave={(u) => setZapisane(prev => prev.some(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u])}
            isSaved={(id) => zapisane.some(u => u.id === id)}
            selectedIds={zaznaczone}
            onToggleSelection={(id) => setZaznaczone(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          />
        )}
      </main>

      {zaznaczone.length > 0 && widok === 'glowny' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
          <button 
            onClick={async () => {
              setRaportOtwarty(true);
              setGenerujeRaport(true);
              try {
                const raport = await exportUpdates(zaznaczone);
                setTrescRaportu(raport);
              } catch (err: any) {
                console.error('Błąd generowania raportu:', err);
                setTrescRaportu(`BŁĄD GENEROWANIA RAPORTU\n\nNie udało się wygenerować wyciągu faktograficznego.\n\nPowód: ${err.message || 'Nieznany błąd'}\n\nSprawdź połączenie z backendem (port 5554).`);
              } finally {
                setGenerujeRaport(false);
              }
            }}
            className="px-10 py-5 bg-slate-900 text-white font-black text-[10px] uppercase shadow-2xl hover:bg-black transition-all flex items-center gap-5"
          >
            <i className="fas fa-file-contract"></i> Wygeneruj Wyciąg Faktograficzny ({zaznaczone.length})
          </button>
        </div>
      )}

      {raportOtwarty && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col border border-slate-300 shadow-2xl rounded-sm">
            <header className="h-16 border-b border-slate-200 px-10 flex items-center justify-between shrink-0 bg-slate-50">
              <h2 className="text-[11px] font-black uppercase text-slate-800 tracking-widest italic">Wyciąg z Dokumentacji Urzędowej</h2>
              <button onClick={() => setRaportOtwarty(false)} title="Zamknij raport" className="text-slate-400 hover:text-slate-900 p-2">
                <i className="fas fa-times"></i>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-16 font-mono text-[13px] text-slate-700 bg-white leading-relaxed">
              {generujeRaport ? (
                <div className="flex flex-col items-center justify-center h-full gap-5">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Mapowanie deskryptorów i komunikatów...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap max-w-2xl mx-auto">{trescRaportu}</div>
              )}
            </div>
            <footer className="h-16 border-t border-slate-100 px-10 flex items-center justify-end bg-slate-50 gap-8">
                <button onClick={() => navigator.clipboard.writeText(trescRaportu)} className="text-[10px] font-black uppercase text-slate-600 hover:text-slate-900">Kopiuj do schowka</button>
                <button onClick={() => setRaportOtwarty(false)} className="text-[10px] font-black uppercase text-slate-400">Zamknij</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
