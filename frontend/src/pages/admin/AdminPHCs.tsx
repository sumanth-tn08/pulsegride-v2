import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, Search, Filter, MapPin, ExternalLink, BedDouble, Phone } from 'lucide-react';
import { fetchPHCs } from '../../api/client';
import { PHC } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';

export const AdminPHCs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>(searchParams.get('zone') || 'ALL');

  useEffect(() => {
    fetchPHCs().then(setPhcs).catch(console.error);
  }, []);

  const handleOpenPHCPortal = (phcId: string) => {
    localStorage.setItem('pulsegrid_selected_phc', phcId);
    navigate('/phc/dashboard');
  };

  const filtered = phcs.filter(p => {
    const matchZone = selectedZone === 'ALL' || p.zone_id === selectedZone;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchZone && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bengaluru Healthcare Network Directory</h2>
          <p className="text-xs text-slate-500">
            Monitoring all 40 Primary Health Centres across 4 BBMP zones in Bengaluru, Karnataka, India
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PHC name, locality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 w-48 sm:w-64 shadow-2xs"
            />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => {
              setSelectedZone(e.target.value);
              if (e.target.value === 'ALL') {
                searchParams.delete('zone');
                setSearchParams(searchParams);
              } else {
                setSearchParams({ zone: e.target.value });
              }
            }}
            className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="ALL">All 4 Zones (40 PHCs)</option>
            <option value="zone-1">Zone 1 - North Bengaluru (10)</option>
            <option value="zone-2">Zone 2 - South Bengaluru (10)</option>
            <option value="zone-3">Zone 3 - East Bengaluru (10)</option>
            <option value="zone-4">Zone 4 - West Bengaluru (10)</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const occRate = p.occupancy_rate || 0;
          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                    {p.zone_name || p.zone_id?.toUpperCase()}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Active
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {p.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5 line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{p.address}</span>
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.contact_phone || '+91 80 2351 0101'}</span>
                  </span>
                </div>

                {/* Bed Status */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Bed Occupancy:</span>
                    <span className="font-bold text-slate-800">
                      {p.occupied_beds ?? 8} / {p.total_beds ?? 12} beds ({occRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occRate >= 85 ? 'bg-rose-600' : occRate >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${occRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <button
                onClick={() => handleOpenPHCPortal(p.id)}
                type="button"
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 rounded-md text-xs font-bold transition"
              >
                <span>Open Facility Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
