import React, { useState, useEffect } from 'react';

interface WorkerStatus {
  status: 'idle' | 'running' | 'error';
  documentsToday: number;
  lastRun?: string;
  nextRun?: string;
}

interface HealthData {
  eli: WorkerStatus;
  rss: WorkerStatus;
  nfz: WorkerStatus;
}

const HealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/health/detailed', {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Health check error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchHealth();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: WorkerStatus['status']): string => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 border-blue-300';
      case 'idle':
        return 'bg-green-100 border-green-300';
      case 'error':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  const getStatusIcon = (status: WorkerStatus['status']): string => {
    switch (status) {
      case 'running':
        return 'fas fa-spinner fa-spin text-blue-600';
      case 'idle':
        return 'fas fa-check-circle text-green-600';
      case 'error':
        return 'fas fa-times-circle text-red-600';
      default:
        return 'fas fa-question-circle text-slate-600';
    }
  };

  const getStatusLabel = (status: WorkerStatus['status']): string => {
    switch (status) {
      case 'running':
        return 'Uruchomiony';
      case 'idle':
        return 'Bezczynny';
      case 'error':
        return 'Błąd';
      default:
        return 'Nieznany';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
        <p className="text-[8px] font-black uppercase text-red-700">Błąd Health Check</p>
      </div>
    );
  }

  if (loading || !health) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2">
        <p className="text-[8px] font-black uppercase text-slate-500">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ELI Worker */}
      <div className={`border rounded px-3 py-2 ${getStatusColor(health.eli.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className={`${getStatusIcon(health.eli.status)} text-sm`}></i>
            <span className="text-[8px] font-black uppercase">🇪🇺 ELI</span>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-slate-700">{health.eli.documentsToday} docs</p>
            <p className="text-[7px] text-slate-600">{getStatusLabel(health.eli.status)}</p>
          </div>
        </div>
      </div>

      {/* RSS Worker */}
      <div className={`border rounded px-3 py-2 ${getStatusColor(health.rss.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className={`${getStatusIcon(health.rss.status)} text-sm`}></i>
            <span className="text-[8px] font-black uppercase">📡 RSS</span>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-slate-700">{health.rss.documentsToday} docs</p>
            <p className="text-[7px] text-slate-600">{getStatusLabel(health.rss.status)}</p>
          </div>
        </div>
      </div>

      {/* NFZ Worker */}
      <div className={`border rounded px-3 py-2 ${getStatusColor(health.nfz.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className={`${getStatusIcon(health.nfz.status)} text-sm`}></i>
            <span className="text-[8px] font-black uppercase">🏥 NFZ</span>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-slate-700">{health.nfz.documentsToday} docs</p>
            <p className="text-[7px] text-slate-600">{getStatusLabel(health.nfz.status)}</p>
          </div>
        </div>
      </div>

      {/* Refresh Info */}
      <p className="text-[7px] text-slate-500 text-center">Odświeża się co 30s</p>
    </div>
  );
};

export default HealthIndicator;
