
import React, { useState, useEffect, useMemo } from 'react';
import { MonitoredSite, GroundingLink, LegalUpdate, DashboardStats, UserProfileType, SystemConfig } from './types';
import { fetchSystemUpdates, generateEmailBriefing } from './services/geminiService';
import UpdateCard from './components/UpdateCard';

const KONFIGURACJA_DYNAMICZNA: SystemConfig = {
  masterSites: [
    { id: '1', name: 'ISAP ELI (System API)', url: 'https://isap.sejm.gov.pl/api/eli', isActive: true, type: 'eli' },
    { id: '2', name: 'ZUS (Strumień RSS)', url: 'https://www.zus.pl/rss', isActive: true, type: 'rss' },
    { id: '3', name: 'CEZ (Strumień RSS)', url: 'https://cez.gov.pl/rss', isActive: true, type: 'rss' },
    { id: '4', name: 'NFZ (Backendowy Scraper)', url: 'https://www.nfz.gov.pl/zarzadzenia-prezesa/', isActive: true, type: 'scraper' }
  ],
  strategicTopics: [
    "Zarządzenia Prezesa NFZ",
    "Ustawy zdrowotne",
    "Komunikaty ZUS",
    "P1/P2/e-Zdrowie"
  ]
};

type ZakresCzasu = '7d' | '30d' | '90d';

const App: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('straznik_prawa_v13_konfig');
    return saved ? JSON.parse(saved) : KONFIGURACJA_DYNAMICZNA;
  });

  const [zakres, setZakres] = useState<ZakresCzasu>('7d');
  const [zmiany, setZmiany] = useState<LegalUpdate[]>([]);
  const [zapisane, setZapisane] = useState<LegalUpdate[]>(() => {
    const saved = localStorage.getItem('zapisane_v13');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [odnosniki, setOdnosniki] = useState<GroundingLink[]>([]);
  const [laduje, setLaduje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
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
      const aktywneZrodla = config.masterSites.filter(s => s.isActive).map(s => ({ url: s.url, type: s.type }));
      // 'legal' profil jest stały, bo AI nie personalizuje już treści
      const wynik = await fetchSystemUpdates(aktywneZrodla, config.strategicTopics, 'legal', zakres);
      setZmiany(wynik.updates);
      setOdnosniki(wynik.links);
      setZaznaczone(wynik.updates.map(u => u.id));
    } catch (err: any) {
      setBlad("Błąd systemu ingestii. Sprawdź dostępność API ELI, RSS lub mechanizmu Scrapingowego.");
    } finally { setLaduje(false); }
  };

  useEffect(() => {
    if (widok === 'glowny') pobierzDane();
  }, [zakres]);

  const filtrowaneZmiany = useMemo(() => {
    return widok === 'archiwum' ? zapisane : zmiany;
  }, [widok, zapisane, zmiany]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1e293b] flex items-center justify-center rounded-sm">
               <i className="fas fa-server text-white text-xs"></i>
            </div>
            <div>
              <h1 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Repozytorium Aktów</h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Zero-AI Assessment • Faktograficzna Ingestia</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded border border-slate-200">
            {(['7d', '30d', '90d'] as ZakresCzasu[]).map(z => (
              <button key={z} onClick={() => setZakres(z)} className={`px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all ${zakres === z ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {z === '7d' ? '7 dni' : z === '30d' ? '30 dni' : '90 dni'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-8 mb-10 border-b border-slate-200 pb-4">
          <button onClick={() => setWidok('glowny')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'glowny' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Dane Faktograficzne</button>
          <button onClick={() => setWidok('archiwum')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'archiwum' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Zarchiwizowane</button>
          <button onClick={() => setWidok('zrodla')} className={`text-[10px] font-black uppercase tracking-widest ${widok === 'zrodla' ? 'text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px]' : 'text-slate-400'}`}>Parametry API</button>
        </div>

        {blad && <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 text-[10px] font-black uppercase">{blad}</div>}

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
                    <span className={`w-10 h-10 rounded flex items-center justify-center text-[10px] font-black text-white ${site.type === 'eli' ? 'bg-blue-600' : site.type === 'rss' ? 'bg-green-600' : 'bg-orange-600'}`}>
                      {site.type.toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-800 uppercase">{site.name}</span>
                      <span className="text-[8px] text-slate-400 font-mono tracking-tight">Endpoint: {site.url}</span>
                    </div>
                  </div>
                  <button onClick={() => setConfig({...config, masterSites: config.masterSites.map(s => s.id === site.id ? {...s, isActive: !s.isActive} : s)})} className={`w-12 h-6 rounded-full relative transition-all ${site.isActive ? 'bg-slate-900' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${site.isActive ? 'left-[26px]' : 'left-[6px]'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <UpdateCard 
            updates={filtrowaneZmiany} 
            links={odnosniki} 
            loading={laduje} 
            onSave={(u) => setZapisane(prev => prev.find(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u])}
            isSaved={(id) => !!zapisane.find(u => u.id === id)}
            selectedIds={zaznaczone}
            onToggleSelection={(id) => setZaznaczone(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          />
        )}
      </main>

      {zaznaczone.length > 0 && widok === 'glowny' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
          <button 
            onClick={() => {
              const wybrane = zmiany.filter(u => zaznaczone.includes(u.id));
              setRaportOtwarty(true);
              setGenerujeRaport(true);
              generateEmailBriefing(wybrane).then(setTrescRaportu).finally(() => setGenerujeRaport(false));
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
              <button onClick={() => setRaportOtwarty(false)} className="text-slate-400 hover:text-slate-900 p-2">
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
