import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Shield, Building2, Radio, CheckCircle, RefreshCw, Power } from 'lucide-react';
import { fetchLiveStatus, toggleLiveOperations, fetchPHCs } from '../api/client';
import { PHC } from '../types';

interface NavbarProps {
  currentPHCId?: string;
  onSelectPHC?: (phcId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPHCId = 'phc-01', onSelectPHC }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const isPHCPortal = location.pathname.startsWith('/phc');
  const isAdminPortal = location.pathname.startsWith('/admin');

  useEffect(() => {
    fetchLiveStatus().then(res => setLiveEnabled(res.live_operations_enabled)).catch(() => {});
    fetchPHCs().then(setPhcs).catch(() => {});
  }, []);

  const handleToggleLive = async () => {
    try {
      const res = await toggleLiveOperations(!liveEnabled);
      setLiveEnabled(res.live_operations_enabled);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Network Context */}
          <div className="flex items-center gap-6">
            <Link to="/login" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900">PulseGrid</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">V2</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Bengaluru Healthcare Network</p>
              </div>
            </Link>

            {/* Portal Switcher Tabs */}
            <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Link
                to="/phc/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  isPHCPortal
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>PHC Portal</span>
              </Link>
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  isAdminPortal
                    ? 'bg-white text-indigo-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Health Administrator</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls: PHC Switcher & Live Toggle */}
          <div className="flex items-center gap-3">
            {/* Active PHC Selector when on PHC Portal */}
            {isPHCPortal && (
              <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium hidden sm:inline">Active PHC:</span>
                <select
                  value={currentPHCId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (onSelectPHC) onSelectPHC(id);
                    localStorage.setItem('pulsegrid_selected_phc', id);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[190px] truncate"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white text-slate-800">
                      {p.name} ({p.zone_id?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Operations Engine Status Toggle */}
            <button
              onClick={handleToggleLive}
              type="button"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition shadow-sm ${
                liveEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={liveEnabled ? "Live Operations Engine is ON (generating real background clinic events)" : "Live Operations Engine is OFF (manual operations active)"}
            >
              <span className={`w-2 h-2 rounded-full ${liveEnabled ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold">{liveEnabled ? 'Live Ops: ON' : 'Live Ops: OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
