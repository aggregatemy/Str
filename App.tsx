
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MonitoredSite, GroundingLink, LegalUpdate } from './types';
import { fetchLegalUpdates } from './services/geminiService';
import UpdateCard from './components/UpdateCard';

const DEFAULT_SITES: MonitoredSite[] = [
  { id: '1', name: 'Dziennik Ustaw', url: 'https://dziennikustaw.gov.pl' },
  { id: '2', name: 'Sejm RP - Prace Legislacyjne', url: 'https://www.sejm.gov.pl/Sejm9.nsf/proces.xsp' },
  { id: '3', name: 'Monitor Polski', url: 'https://monitorpolski.gov.pl' }
];

const App: React.FC = () => {
  const [sites, setSites] = useState<MonitoredSite[]>(() => {
    const saved = localStorage.getItem('monitored_sites');
    return saved ? JSON.parse(saved) : DEFAULT_SITES;
  });
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [links, setLinks] = useState<GroundingLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('monitored_sites', JSON.stringify(sites));
  }, [sites]);

  const addSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    
    const site: MonitoredSite = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName || new URL(newUrl).hostname,
      url: newUrl
    };
    
    setSites([...sites, site]);
    setNewUrl('');
    setNewName('');
  };

  const removeSite = (id: string) => {
    setSites(sites.filter(s => s.id !== id));
  };

  const handleCheckChanges = async () => {
    if (sites.length === 0) {
      setError("Dodaj co najmniej jedną stronę do monitorowania.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const urls = sites.map(s => s.url);
      const result = await fetchLegalUpdates(urls);
      setUpdates(result.updates);
      setLinks(result.links);
    } catch (err: any) {
      setError("Wystąpił błąd podczas pobierania danych: " + (err.message || "Nieznany błąd."));
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    updates.forEach(u => cats.add(u.category));
    return Array.from(cats).sort();
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    return updates.filter(u => {
      const matchImpact = impactFilter === 'all' || u.impact.toLowerCase() === impactFilter.toLowerCase();
      const matchCategory = categoryFilter === 'all' || u.category === categoryFilter;
      return matchImpact && matchCategory;
    });
  }, [updates, impactFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <i className="fas fa-balance-scale text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Strażnik Prawa</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">AI Legislative Monitor</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-indigo-600 transition-colors">Pulpit</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Archiwum</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Ustawienia</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-list-ul text-indigo-500"></i> Monitorowane serwisy
            </h2>
            
            <form onSubmit={addSite} className="space-y-3 mb-6">
              <input 
                type="text" 
                placeholder="Nazwa serwisu (opcjonalnie)" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https://example.gov.pl" 
                  required
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {sites.map(site => (
                <div key={site.id} className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-300 transition-all">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{site.name}</p>
                    <p className="text-xs text-slate-500 truncate">{site.url}</p>
                  </div>
                  <button 
                    onClick={() => removeSite(site.id)}
                    className="text-slate-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={handleCheckChanges}
              disabled={isLoading || sites.length === 0}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 ${
                isLoading || sites.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:transform active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Analizowanie...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i> Sprawdź zmiany
                </>
              )}
            </button>
          </section>

          <section className="bg-indigo-900 rounded-xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Powiadomienia Pro</h3>
              <p className="text-sm text-indigo-200 mb-4 leading-relaxed">Otrzymuj alerty e-mail natychmiast po publikacji nowych aktów prawnych.</p>
              <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors uppercase tracking-wider">Dowiedz się więcej</button>
            </div>
            <i className="fas fa-bell absolute -bottom-4 -right-4 text-indigo-800 text-8xl opacity-30 transform rotate-12"></i>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
              <i className="fas fa-exclamation-triangle"></i>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Filters Toolbar */}
          {!isLoading && updates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-filter text-slate-400 text-sm"></i>
                <span className="text-xs font-bold text-slate-500 uppercase">Filtry:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={impactFilter}
                  onChange={(e) => setImpactFilter(e.target.value)}
                >
                  <option value="all">Wszystkie poziomy wpływu</option>
                  <option value="high">Wysoki wpływ</option>
                  <option value="medium">Średni wpływ</option>
                  <option value="low">Niski wpływ</option>
                </select>

                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Wszystkie kategorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto text-xs text-slate-400">
                Znaleziono: <strong>{filteredUpdates.length}</strong> zmian
              </div>
            </div>
          )}

          <UpdateCard 
            updates={filteredUpdates} 
            links={links} 
            loading={isLoading} 
          />
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">© 2024 Strażnik Prawa. Wykorzystano model Gemini-3-Flash do analizy danych legislacyjnych.</p>
          <p className="text-xs text-slate-400 mt-2">Pamiętaj: Informacje generowane przez AI mają charakter informacyjny i nie stanowią porady prawnej.</p>
        </div>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default App;
