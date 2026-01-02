
import React, { useState, useEffect, useMemo } from 'react';
import { MonitoredSite, GroundingLink, LegalUpdate, DashboardStats } from './types';
import { fetchLegalUpdates } from './services/geminiService';
import UpdateCard from './components/UpdateCard';

const DEFAULT_SITES: MonitoredSite[] = [
  { id: '1', name: 'Dziennik Ustaw', url: 'https://dziennikustaw.gov.pl' },
  { id: '2', name: 'Sejm RP - Proces', url: 'https://www.sejm.gov.pl' },
  { id: '3', name: 'Monitor Polski', url: 'https://monitorpolski.gov.pl' }
];

const App: React.FC = () => {
  const [sites, setSites] = useState<MonitoredSite[]>(() => {
    const saved = localStorage.getItem('monitored_sites');
    return saved ? JSON.parse(saved) : DEFAULT_SITES;
  });
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [savedUpdates, setSavedUpdates] = useState<LegalUpdate[]>(() => {
    const saved = localStorage.getItem('saved_updates');
    return saved ? JSON.parse(saved) : [];
  });
  const [links, setLinks] = useState<GroundingLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'feed' | 'archive'>('feed');

  // Forms
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  
  // Filters
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => localStorage.setItem('monitored_sites', JSON.stringify(sites)), [sites]);
  useEffect(() => localStorage.setItem('saved_updates', JSON.stringify(savedUpdates)), [savedUpdates]);

  const addSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setSites([...sites, { id: Date.now().toString(), name: newName || new URL(newUrl).hostname, url: newUrl }]);
    setNewUrl(''); setNewName('');
  };

  const handleCheckChanges = async () => {
    setIsLoading(true); setError(null);
    try {
      const result = await fetchLegalUpdates(sites.map(s => s.url));
      setUpdates(result.updates);
      setLinks(result.links);
      setView('feed');
    } catch (err: any) {
      setError(err.message || "Błąd połączenia.");
    } finally { setIsLoading(false); }
  };

  const toggleSave = (update: LegalUpdate) => {
    setSavedUpdates(prev => prev.find(u => u.id === update.id) ? prev.filter(u => u.id !== update.id) : [...prev, update]);
  };

  const stats = useMemo<DashboardStats>(() => {
    const currentList = view === 'feed' ? updates : savedUpdates;
    return {
      total: currentList.length,
      highImpact: currentList.filter(u => u.impact.toLowerCase() === 'high').length,
      mediumImpact: currentList.filter(u => u.impact.toLowerCase() === 'medium').length,
      lowImpact: currentList.filter(u => u.impact.toLowerCase() === 'low').length,
    };
  }, [updates, savedUpdates, view]);

  const categories = useMemo(() => Array.from(new Set((view === 'feed' ? updates : savedUpdates).map(u => u.category))).sort(), [updates, savedUpdates, view]);

  const filtered = useMemo(() => {
    const list = view === 'feed' ? updates : savedUpdates;
    return list.filter(u => (impactFilter === 'all' || u.impact === impactFilter) && (categoryFilter === 'all' || u.category === categoryFilter));
  }, [updates, savedUpdates, impactFilter, categoryFilter, view]);

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar-style Header */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 z-50 hidden lg:flex shadow-sm">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <i className="fas fa-balance-scale text-xl"></i>
        </div>
        <div className="flex flex-col gap-8">
          <button onClick={() => setView('feed')} className={`p-3 rounded-xl transition-all ${view === 'feed' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <i className="fas fa-stream"></i>
          </button>
          <button onClick={() => setView('archive')} className={`p-3 rounded-xl transition-all ${view === 'archive' ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <i className="fas fa-star"></i>
          </button>
          <button className="p-3 rounded-xl text-slate-400 hover:text-slate-600">
            <i className="fas fa-cog"></i>
          </button>
        </div>
        <div className="mt-auto p-3 text-slate-300 text-xs font-black">AI</div>
      </nav>

      <div className="lg:pl-20">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Strażnik Prawa</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Monitoring Legislacyjny 3.0</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleCheckChanges} disabled={isLoading || sites.length === 0} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2">
               {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-bolt"></i>}
               <span>Synchronizuj</span>
             </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Dashboard Stats & Settings */}
          <div className="lg:col-span-4 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-red-200 transition-colors">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">High Impact</p>
                <p className="text-3xl font-black text-slate-800">{stats.highImpact}</p>
                <div className="h-1 bg-red-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(stats.highImpact/Math.max(stats.total, 1))*100}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Found</p>
                <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                <p className="text-[10px] font-bold text-indigo-500 mt-2">Zarchiwizowano: {savedUpdates.length}</p>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-radar text-indigo-500"></i> Serwisy Źródłowe
              </h2>
              <form onSubmit={addSite} className="space-y-4 mb-8">
                <div className="relative">
                  <input type="url" placeholder="URL serwisu..." required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                  <i className="fas fa-link absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200">Dodaj do radaru</button>
              </form>

              <div className="space-y-3">
                {sites.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-50 group hover:border-indigo-100 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      <i className="fas fa-globe"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{s.name}</p>
                      <p className="text-[9px] text-slate-400 truncate uppercase font-black tracking-tighter opacity-60">{new URL(s.url).hostname}</p>
                    </div>
                    <button onClick={() => setSites(sites.filter(x => x.id !== s.id))} className="text-slate-200 hover:text-red-500 transition-colors px-2"><i className="fas fa-times-circle"></i></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            {error && <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 text-xs font-bold flex items-center gap-3"><i className="fas fa-exclamation-triangle"></i> {error}</div>}

            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 px-3 text-[10px] font-black uppercase text-slate-400 border-r border-slate-100 mr-2">
                 <i className="fas fa-sliders-h"></i> Filtrowanie
               </div>
               <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" value={impactFilter} onChange={e => setImpactFilter(e.target.value)}>
                 <option value="all">Wszystkie poziomy</option>
                 <option value="high">Wysoki wpływ</option>
                 <option value="medium">Średni wpływ</option>
                 <option value="low">Niski wpływ</option>
               </select>
               <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                 <option value="all">Wszystkie kategorie</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <div className="ml-auto flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setView('feed')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'feed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Radar</button>
                 <button onClick={() => setView('archive')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'archive' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Archiwum</button>
               </div>
            </div>

            <UpdateCard 
              updates={filtered} 
              links={links} 
              loading={isLoading} 
              onSave={toggleSave}
              isSaved={(id) => !!savedUpdates.find(u => u.id === id)}
            />

            {!isLoading && filtered.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 text-3xl">
                  <i className="fas fa-ghost"></i>
                </div>
                <div>
                  <h3 className="text-slate-800 font-black uppercase text-sm tracking-widest">Pusto tu...</h3>
                  <p className="text-slate-400 text-xs">Brak wyników spełniających kryteria. Spróbuj zmienić filtry lub wykonaj synchronizację.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
