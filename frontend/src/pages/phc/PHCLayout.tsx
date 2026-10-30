import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { LayoutDashboard, Pill, BedDouble, Bot, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { fetchPHC } from '../../api/client';
import { PHC } from '../../types';

export const PHCLayout: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPHCId, setSelectedPHCId] = useState<string>(() => {
    return localStorage.getItem('pulsegrid_selected_phc') || 'phc-01';
  });
  const [phc, setPhc] = useState<PHC | null>(null);

  useEffect(() => {
    fetchPHC(selectedPHCId)
      .then(setPhc)
      .catch((err) => console.error("Error loading PHC:", err));
  }, [selectedPHCId]);

  const handleSelectPHC = (id: string) => {
    setSelectedPHCId(id);
    localStorage.setItem('pulsegrid_selected_phc', id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar currentPHCId={selectedPHCId} onSelectPHC={handleSelectPHC} />

      {/* PHC Facility Header Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                {phc?.zone_name || 'Zone 1 - North Bengaluru'}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {phc?.id || selectedPHCId}</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Operational
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {phc?.name || 'Hebbal Urban Primary Health Centre'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {phc?.address || 'Near Hebbal Flyover, Bellary Road, Hebbal, Bengaluru 560024'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {phc?.contact_phone || '+91 80 2351 0101'}
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <NavLink
              to="/phc/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/phc/medicines"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Medicine</span>
            </NavLink>
            <NavLink
              to="/phc/assistant"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm font-bold'
                    : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
                }`
              }
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main Outlet */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <Outlet context={{ phc, selectedPHCId }} />
      </main>
    </div>
  );
};
