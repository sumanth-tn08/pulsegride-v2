import React, { useState, useEffect } from 'react';
import { TrendingUp, Pill, BedDouble, AlertTriangle, ShieldCheck, Filter, Search } from 'lucide-react';
import { fetchAdminPredictions } from '../../api/client';
import { RiskBadge } from '../../components/RiskBadge';

export const AdminPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdminPredictions().then(setPredictions).catch(console.error);
  }, []);

  const filtered = predictions.filter(p => {
    const matchSearch = p.phc_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterRiskOnly) {
      return matchSearch && (p.at_risk_medicines_count > 0 || p.high_occupancy_risk === 'HIGH' || p.high_occupancy_risk === 'CRITICAL');
    }
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Machine Learning Predictions Dashboard</h2>
          <p className="text-xs text-slate-500">
            Scikit-learn RandomForest models predicting medicine stockouts & 7-day bed occupancy across 40 Bengaluru PHCs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 w-48 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setFilterRiskOnly(!filterRiskOnly)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition shadow-2xs ${
              filterRiskOnly
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {filterRiskOnly ? 'Showing High-Risk Only' : 'Show High-Risk Only'}
          </button>
        </div>
      </div>

      {/* Model Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Pill className="w-4 h-4" />
            <span>Model 1: Medicine Stockout Predictor (Scikit-Learn)</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Predicts days remaining until complete stockout & classifies risk (LOW, MEDIUM, HIGH, CRITICAL) from daily burn rate, velocity trends, and pending supplier consignments.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <BedDouble className="w-4 h-4" />
            <span>Model 2: Bed Occupancy Forecaster (Scikit-Learn)</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Projects 7-day future occupancy rate & trajectory (RISING, STABLE, DECLINING) from admission flow, discharge velocity, and seasonal epidemiological demand.
          </p>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Facility & Zone</th>
                <th className="px-4 py-3">Current Bed Rate</th>
                <th className="px-4 py-3">ML 7-Day Forecast</th>
                <th className="px-4 py-3">Occupancy Trend</th>
                <th className="px-4 py-3">At-Risk Medicines</th>
                <th className="px-4 py-3">Critical Medicine Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.phc_id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{p.phc_name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{p.zone_name || p.zone_id}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-800">
                    {p.occupancy_rate}% ({p.occupied_beds}/{p.total_beds})
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">
                    {p.predicted_occupancy_7d}%
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-semibold ${
                      p.occupancy_trend === 'RISING' ? 'text-rose-700 font-bold' :
                      p.occupancy_trend === 'DECLINING' ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                      {p.occupancy_trend}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-mono font-bold ${
                      p.at_risk_medicines_count > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      {p.at_risk_medicines_count} items
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {p.critical_medicines?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.critical_medicines.map((m: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-semibold">
                            {m.name} ({m.days_left}d)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
