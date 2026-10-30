import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BedDouble, Users, UserPlus, UserMinus, TrendingUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPHCBeds, admitBed, dischargeBed } from '../../api/client';
import { PHC, BedOccupancy } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';

export const PHCBeds: React.FC = () => {
  const { phc, selectedPHCId } = useOutletContext<{ phc: PHC; selectedPHCId: string }>();
  const [bed, setBed] = useState<BedOccupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);
  const [actionCount, setActionCount] = useState(1);
  const [wardName, setWardName] = useState('General Acute');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadBeds = async () => {
    if (!selectedPHCId) return;
    try {
      const res = await fetchPHCBeds(selectedPHCId);
      setBed(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
    const interval = setInterval(loadBeds, 8000);
    return () => clearInterval(interval);
  }, [selectedPHCId]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await admitBed(selectedPHCId, actionCount, wardName);
      setSuccessMsg(`Admitted ${actionCount} patient(s) to ${wardName}.`);
      await loadBeds();
      setTimeout(() => {
        setIsAdmitting(false);
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dischargeBed(selectedPHCId, actionCount);
      setSuccessMsg(`Discharged ${actionCount} patient(s). Beds now sanitized and ready.`);
      await loadBeds();
      setTimeout(() => {
        setIsDischarging(false);
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalBeds = bed?.total_beds || 12;
  const occupiedBeds = bed?.occupied_beds || 0;
  const availableBeds = bed?.available_beds || 0;
  const rate = bed?.occupancy_rate || 0;
  const pred7d = bed?.predicted_occupancy_7d || 50;

  // Chart data simulation around current & predicted rate
  const chartData = [
    { day: 'Day -3', rate: Math.max(10, rate - 8) },
    { day: 'Day -2', rate: Math.max(15, rate - 4) },
    { day: 'Yesterday', rate: Math.max(20, rate - 2) },
    { day: 'Today', rate: rate },
    { day: 'Day +2', rate: Math.round(rate + (pred7d - rate) * 0.3) },
    { day: 'Day +4', rate: Math.round(rate + (pred7d - rate) * 0.6) },
    { day: 'Day +7 (ML)', rate: pred7d },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bed Occupancy Management</h2>
          <p className="text-xs text-slate-500">
            Real-time inpatient capacity & Scikit-learn occupancy trend forecast
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActionCount(1); setIsAdmitting(true); }}
            disabled={availableBeds <= 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit Patient</span>
          </button>
          <button
            onClick={() => { setActionCount(1); setIsDischarging(true); }}
            disabled={occupiedBeds <= 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold shadow-xs transition"
          >
            <UserMinus className="w-4 h-4" />
            <span>Discharge Patient</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Facility Beds</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalBeds}</div>
          <span className="text-xs text-slate-500">General & Emergency wards</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupied Beds</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{occupiedBeds}</div>
          <span className="text-xs text-slate-500">Current in-patients</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available Beds</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{availableBeds}</div>
          <span className="text-xs text-emerald-600">Ready for intake</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupancy Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{rate}%</span>
            <RiskBadge level={bed?.high_occupancy_risk || 'LOW'} />
          </div>
          <span className="text-xs text-slate-500">Trend: {bed?.occupancy_trend || 'STABLE'}</span>
        </div>
      </div>

      {/* Visual Bed Slot Layout Representation */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inpatient Ward Floorplan & Bed Slots</h3>
            <p className="text-xs text-slate-500">Physical bed slot states for {phc?.name}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600">Available ({availableBeds})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
              <span className="text-slate-600">Occupied ({occupiedBeds})</span>
            </div>
          </div>
        </div>

        {/* Physical Bed Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: totalBeds }).map((_, idx) => {
            const isOccupied = idx < occupiedBeds;
            const bedNum = idx + 1;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                  isOccupied
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Slot B-{bedNum < 10 ? `0${bedNum}` : bedNum}</span>
                  <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                </div>
                <div className="my-2 flex justify-center">
                  <BedDouble className={`w-7 h-7 ${isOccupied ? 'text-rose-600' : 'text-emerald-600'}`} />
                </div>
                <div className="text-center">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day ML Forecast Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">7-Day Projected Bed Occupancy Trajectory</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Scikit-Learn ML Forecast
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical flow + 7-day predicted capacity trajectory (Predicted: {pred7d}%)
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRateLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRateLight)" name="Occupancy Rate" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modals for Admit / Discharge */}
      {isAdmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <button onClick={() => setIsAdmitting(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Admit Patient to Bed</h3>
            <p className="text-xs text-slate-500 mb-4">Available beds: {availableBeds} of {totalBeds}</p>
            {successMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleAdmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Patients:</label>
                  <input
                    type="number"
                    min={1}
                    max={availableBeds}
                    value={actionCount}
                    onChange={(e) => setActionCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Designation:</label>
                  <select
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  >
                    <option value="General Acute Ward">General Acute Ward</option>
                    <option value="Maternity & Pediatric Care">Maternity & Pediatric Care</option>
                    <option value="Emergency Observation">Emergency Observation</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdmitting(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold shadow-xs transition">
                    {submitting ? 'Admitting...' : 'Confirm Admission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isDischarging && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <button onClick={() => setIsDischarging(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Discharge Patient</h3>
            <p className="text-xs text-slate-500 mb-4">Occupied beds: {occupiedBeds}</p>
            {successMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleDischarge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number to Discharge:</label>
                  <input
                    type="number"
                    min={1}
                    max={occupiedBeds}
                    value={actionCount}
                    onChange={(e) => setActionCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsDischarging(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-bold shadow-xs transition">
                    {submitting ? 'Discharging...' : 'Confirm Discharge'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
