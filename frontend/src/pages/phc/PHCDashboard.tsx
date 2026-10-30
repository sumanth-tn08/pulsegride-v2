import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  BedDouble,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Search,
  Bot,
  ShieldCheck,
  Building2
} from 'lucide-react';
import {
  fetchPHCMedicines,
  fetchPHCBeds,
  fetchEvents,
  consumeMedicine,
  admitBed,
  dischargeBed,
  reportShortage
} from '../../api/client';
import { PHC, PHCMedicineStock, BedOccupancy, OperationalEvent } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';

export const PHCDashboard: React.FC = () => {
  const { phc, selectedPHCId } = useOutletContext<{ phc: PHC; selectedPHCId: string }>();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState<PHCMedicineStock[]>([]);
  const [beds, setBeds] = useState<BedOccupancy | null>(null);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Fast Operations State
  const [activeModal, setActiveModal] = useState<'consume' | 'admit' | 'discharge' | 'shortage' | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<string>('med-01');
  const [actionQty, setActionQty] = useState<number>(10);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const loadData = async () => {
    if (!selectedPHCId) return;
    try {
      const [sRes, bRes, eRes] = await Promise.all([
        fetchPHCMedicines(selectedPHCId),
        fetchPHCBeds(selectedPHCId),
        fetchEvents(selectedPHCId, 10)
      ]);
      setStocks(sRes);
      setBeds(bRes);
      setEvents(eRes);
    } catch (err) {
      console.error("Error loading PHC dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [selectedPHCId]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSubmitting(true);
    try {
      if (activeModal === 'consume') {
        await consumeMedicine(selectedPHCId, selectedMedId, actionQty, actionNotes);
        const med = stocks.find(s => s.medicine_id === selectedMedId);
        setActionSuccessMsg(`Dispensed ${actionQty} units of ${med?.medicine_name || 'medicine'}.`);
      } else if (activeModal === 'admit') {
        await admitBed(selectedPHCId, actionQty, 'General Acute Observation');
        setActionSuccessMsg(`Admitted ${actionQty} patient(s) to inpatient ward.`);
      } else if (activeModal === 'discharge') {
        await dischargeBed(selectedPHCId, actionQty);
        setActionSuccessMsg(`Recorded discharge of ${actionQty} patient(s).`);
      } else if (activeModal === 'shortage') {
        await reportShortage(selectedPHCId, selectedMedId, actionNotes || 'Accelerated OPD demand spike');
        setActionSuccessMsg(`Emergency shortage report logged for health administration.`);
      }
      await loadData();
      setTimeout(() => {
        setActiveModal(null);
        setActionSuccessMsg('');
        setActionNotes('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setActionSubmitting(false);
    }
  };

  const highRiskMedicines = stocks.filter(s => s.stockout_risk === 'HIGH' || s.stockout_risk === 'CRITICAL');
  const bedAlert = (beds?.occupancy_rate ?? 0) >= 80;
  const activeAlertsCount = highRiskMedicines.length + (bedAlert ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* 4 Main Operational Overview Cards: "Is my PHC okay right now?" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Medicine Risk */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medicine Risk</span>
            <div className={`p-1.5 rounded-md ${highRiskMedicines.length > 0 ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${highRiskMedicines.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {highRiskMedicines.length > 0 ? `${highRiskMedicines.length} at risk` : 'All normal'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {highRiskMedicines.length > 0
                ? `${highRiskMedicines[0]?.medicine_name} below safe buffer`
                : 'All 10 monitored medicines have safe runway'}
            </p>
          </div>
        </div>

        {/* 2. Bed Occupancy */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bed Occupancy</span>
            <div className="p-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {beds?.occupancy_rate ?? 0}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {beds?.occupied_beds ?? 0} of {beds?.total_beds ?? 0} beds occupied ({beds?.available_beds ?? 0} available)
            </p>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (beds?.occupancy_rate ?? 0) >= 80 ? 'bg-rose-600' :
                (beds?.occupancy_rate ?? 0) >= 65 ? 'bg-amber-500' : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, beds?.occupancy_rate ?? 0)}%` }}
            />
          </div>
        </div>

        {/* 3. Predicted 7-Day Occupancy */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Predicted 7-Day Occupancy</span>
            <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {beds?.predicted_occupancy_7d ?? 0}%
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Trend: <strong className="text-slate-700">{beds?.occupancy_trend ?? 'STABLE'}</strong></span>
              <span>·</span>
              <span>Risk: <strong className={beds?.high_occupancy_risk === 'HIGH' ? 'text-rose-700' : 'text-slate-700'}>{beds?.high_occupancy_risk || 'LOW'}</strong></span>
            </p>
          </div>
        </div>

        {/* 4. Active Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Alerts</span>
            <div className={`p-1.5 rounded-md ${activeAlertsCount > 0 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${activeAlertsCount > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
              {activeAlertsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeAlertsCount > 0
                ? `${activeAlertsCount} clinical items require operational review`
                : 'Zero active operational anomalies'}
            </p>
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Priority Operations Directives</h3>
            <p className="text-xs text-slate-500">Key operational decisions prioritized for this shift</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{phc?.name}</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Action 1: First Critical Medicine Shortage */}
          {highRiskMedicines.length > 0 ? (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                    Critical Stockout
                  </span>
                  <span className="text-xs font-bold text-rose-700">{highRiskMedicines[0].predicted_days_left}d runway</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">
                  Review {highRiskMedicines[0].medicine_name} Shortage
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Current reserve is {highRiskMedicines[0].current_stock} units ({highRiskMedicines[0].daily_consumption}/day burn). Check availability across Bengaluru.
                </p>
              </div>
              <Link
                to={`/phc/medicines?search=${encodeURIComponent(highRiskMedicines[0].medicine_name)}`}
                className="mt-3 w-full py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                <span>Find Availability</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  Medicine Stock Safe
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-2">Check Network Inventory</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  All local medicines have adequate buffer. Search any medicine availability across the 40-PHC network.
                </p>
              </div>
              <Link
                to="/phc/medicines"
                className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                <span>Search Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Action 2: Paracetamol or Second Critical Med */}
          {highRiskMedicines.length > 1 ? (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                    Buffer Depleting
                  </span>
                  <span className="text-xs font-bold text-amber-800">{highRiskMedicines[1].predicted_days_left}d runway</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">
                  Investigate {highRiskMedicines[1].medicine_name}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Reserve at {highRiskMedicines[1].current_stock} units. Request transfer from neighboring facilities with surplus.
                </p>
              </div>
              <Link
                to={`/phc/medicines?search=${encodeURIComponent(highRiskMedicines[1].medicine_name)}`}
                className="mt-3 w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                <span>Check Network Surplus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  Routine Review
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-2">Investigate Paracetamol Stock</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Verify stock level, daily consumption, and same-zone transfer availability for outpatient walk-ins.
                </p>
              </div>
              <Link
                to="/phc/medicines?search=Paracetamol"
                className="mt-3 w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                <span>Check Paracetamol</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Action 3: Inpatient Bed Capacity Check */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                  Inpatient Status
                </span>
                <span className="text-xs font-bold text-slate-800">{beds?.occupancy_rate ?? 0}% Filled</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2">Check Inpatient Bed Capacity</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                {beds?.available_beds ?? 0} observation beds currently open. 7-day trend is {beds?.occupancy_trend ?? 'STABLE'}.
              </p>
            </div>
            <button
              onClick={() => { setActiveModal('discharge'); setActionQty(1); }}
              className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Discharge Observation Bed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fast Operations Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Fast Operations</h3>
          </div>
          <span className="text-[11px] text-slate-400">Updates live operational database & recalculates ML</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => { setActiveModal('consume'); setActionQty(10); }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-800 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold">Consume Medicine</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Dispense to patient</p>
          </button>

          <button
            onClick={() => { setActiveModal('admit'); setActionQty(1); }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-800 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold">Admit Patient</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Occupy acute bed</p>
          </button>

          <button
            onClick={() => { setActiveModal('discharge'); setActionQty(1); }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold">Discharge Patient</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Release bed slot</p>
          </button>

          <button
            onClick={() => { setActiveModal('shortage'); }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-800 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <span className="text-xs font-bold">Report Shortage</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Alert health directorate</p>
          </button>
        </div>
      </div>

      {/* Main Grid: Essential Medicine Runway Table & Live Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Essential Medicines Runway Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Essential Medicines & Runway</h3>
              <p className="text-xs text-slate-500">Tracked stock at {phc?.name}</p>
            </div>
            <Link to="/phc/medicines" className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1">
              <span>Find Availability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Medicine</th>
                  <th className="px-4 py-2.5">Current Stock</th>
                  <th className="px-4 py-2.5">Daily Burn</th>
                  <th className="px-4 py-2.5">Runway</th>
                  <th className="px-4 py-2.5">Risk</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.slice(0, 7).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">{item.medicine_name}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {item.current_stock} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {item.daily_consumption}/day
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                      {item.predicted_days_left} days
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskBadge level={item.stockout_risk} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedMedId(item.medicine_id);
                          setActiveModal('consume');
                          setActionQty(item.daily_consumption || 10);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Dispense
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 span): Human-Readable Live Operations Event Feed */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Live Operations Feed</h3>
            </div>
            <span className="text-[10px] font-medium text-slate-500">Auto-refreshing</span>
          </div>

          <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent operational events</p>
            ) : (
              events.map((evt) => {
                const isCrit = evt.severity === 'CRITICAL';
                const isWarn = evt.severity === 'WARNING';
                const eventTitle = evt.formatted_title || evt.event_type.replace(/_/g, ' ');
                const eventSummary = evt.formatted_summary || (
                  evt.event_type === 'medicine_consumed' ? `${evt.details?.quantity || 1} units consumed` :
                  evt.event_type === 'patient_admitted' ? `Patient admitted` :
                  'Operational state updated'
                );
                const eventTime = evt.formatted_time || (evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now');

                return (
                  <div key={evt.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      isCrit ? 'bg-rose-600' : isWarn ? 'bg-amber-500' : 'bg-teal-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 capitalize line-clamp-1">
                          {eventTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {eventTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {eventSummary}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900">
              {activeModal === 'consume' && 'Dispense Medicine'}
              {activeModal === 'admit' && 'Admit Inpatient'}
              {activeModal === 'discharge' && 'Discharge Patient'}
              {activeModal === 'shortage' && 'Report Emergency Shortage'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates facility database and recalculates ML stockout & bed occupancy projections.
            </p>

            {actionSuccessMsg ? (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{actionSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteAction} className="mt-4 space-y-4">
                {(activeModal === 'consume' || activeModal === 'shortage') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Medicine:</label>
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                    >
                      {stocks.map((s) => (
                        <option key={s.medicine_id} value={s.medicine_id}>
                          {s.medicine_name} (Current: {s.current_stock} {s.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {activeModal === 'consume' && 'Quantity Dispensed:'}
                    {activeModal === 'admit' && 'Number of Patients Admitted:'}
                    {activeModal === 'discharge' && 'Number of Patients Discharged:'}
                    {activeModal === 'shortage' && 'Urgent Quantity Needed:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actionQty}
                    onChange={(e) => setActionQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. OPD walk-in surge, observation ward bed clearance..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition disabled:opacity-50"
                  >
                    {actionSubmitting ? 'Recording...' : 'Confirm Operation'}
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
