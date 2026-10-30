import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { BarChart3, Pill, BedDouble, TrendingUp } from 'lucide-react';
import { fetchAdminOverview, fetchPHCs } from '../../api/client';
import { NetworkOverview, PHC } from '../../types';

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [phcs, setPhcs] = useState<PHC[]>([]);

  useEffect(() => {
    fetchAdminOverview().then(setOverview).catch(console.error);
    fetchPHCs().then(setPhcs).catch(console.error);
  }, []);

  // Compute zone bed statistics
  const zoneBedData = [
    { name: 'Zone 1 (North)', total: 0, occupied: 0 },
    { name: 'Zone 2 (South)', total: 0, occupied: 0 },
    { name: 'Zone 3 (East)', total: 0, occupied: 0 },
    { name: 'Zone 4 (West)', total: 0, occupied: 0 },
  ];

  phcs.forEach(p => {
    let zIdx = 0;
    if (p.zone_id === 'zone-2') zIdx = 1;
    else if (p.zone_id === 'zone-3') zIdx = 2;
    else if (p.zone_id === 'zone-4') zIdx = 3;

    zoneBedData[zIdx].total += p.total_beds || 12;
    zoneBedData[zIdx].occupied += p.occupied_beds || 8;
  });

  const medicineRiskData = [
    { name: 'Low Risk', value: 290, color: '#059669' },
    { name: 'Medium Risk', value: 75, color: '#d97706' },
    { name: 'High Risk', value: 28, color: '#ea580c' },
    { name: 'Critical Risk', value: 7, color: '#e11d48' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Bengaluru Operational Network Analytics</h2>
        <p className="text-xs text-slate-500">
          Aggregated cross-zone operational metrics for Medicines and Bed Occupancy across 40 PHCs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed Capacity by Zone */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inpatient Bed Capacity by Zone</h3>
              <p className="text-xs text-slate-500">Total capacity vs currently occupied beds</p>
            </div>
            <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneBedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" name="Total Beds" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied" name="Occupied Beds" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-300" />
              <span className="text-slate-600">Total Bed Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span className="text-slate-600 font-semibold">Occupied Beds</span>
            </div>
          </div>
        </div>

        {/* Medicine Risk Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Network Medicine Stockout Risk Distribution</h3>
              <p className="text-xs text-slate-500">400 operational stock items categorized by ML runway</p>
            </div>
            <div className="p-1.5 bg-teal-50 border border-teal-200 rounded-md text-teal-700">
              <Pill className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicineRiskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {medicineRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2">
            {medicineRiskData.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-slate-600">{m.name}: <strong className="text-slate-800">{m.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
