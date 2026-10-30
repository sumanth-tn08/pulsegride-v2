import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, Shield, ArrowRight, Radio, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchPHCs } from '../api/client';
import { PHC } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [selectedPHC, setSelectedPHC] = useState('phc-01');

  useEffect(() => {
    fetchPHCs().then((data) => {
      setPhcs(data);
      if (data.length > 0 && !localStorage.getItem('pulsegrid_selected_phc')) {
        setSelectedPHC(data[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleEnterPHC = () => {
    localStorage.setItem('pulsegrid_selected_phc', selectedPHC);
    navigate('/phc/dashboard');
  };

  const handleEnterAdmin = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8 text-slate-800">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">PulseGrid</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">V2</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Intelligent Healthcare Operations Network</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span className="font-medium">Bengaluru, Karnataka, India</span>
        </div>
      </div>

      {/* Main Card Selector */}
      <div className="max-w-4xl w-full mx-auto my-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Observe → Analyze → Predict → Investigate → Recommend → Act</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Select Healthcare Operations Portal
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Operational intelligence and clinical decision support connecting 40 Primary Health Centres across Bengaluru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal 1: PHC Portal */}
          <div className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-6 transition flex flex-col justify-between shadow-sm hover:shadow-md">
            <div>
              <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">PHC Operations Portal</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Facility Level
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                For PHC Operators and Facility Medical Officers. Manage local medicine stock, update bed admissions/discharges, and query the Whisper-v3 voice assistant.
              </p>

              {/* PHC Selector */}
              <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Select Active PHC Facility:
                </label>
                <select
                  value={selectedPHC}
                  onChange={(e) => setSelectedPHC(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.zone_name || p.zone_id?.toUpperCase()})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>Demo Target: Hebbal Urban PHC (Zone 1)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleEnterPHC}
              type="button"
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <span>Access PHC Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Health Administrator Portal */}
          <div className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-6 transition flex flex-col justify-between shadow-sm hover:shadow-md">
            <div>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Health Administrator Portal</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Directorate Level
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                For Health Directorate leadership. Central oversight across 40 PHCs, cross-zone analytics, ML predictions, TinyFish external web evidence, and Human-in-the-Loop decision approvals.
              </p>

              <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4 BBMP Zones · 40 PHCs · 720 Monitored Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scikit-learn Stockout & 7-Day Capacity Forecasts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>TinyFish Web Investigation & Human Approvals</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleEnterAdmin}
              type="button"
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <span>Access Directorate Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-200 gap-2">
        <p>PulseGrid V2 — Intelligent Healthcare Operations Platform</p>
        <p>Bengaluru, Karnataka, India · 40 Primary Health Centres</p>
      </div>
    </div>
  );
};
