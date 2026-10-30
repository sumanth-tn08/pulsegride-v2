import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  BedDouble,
  Pill,
  AlertTriangle,
  Bot,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Loader2,
  Radio,
  CheckCircle2,
  ShieldCheck,
  CheckSquare,
  Activity
} from 'lucide-react';
import { fetchAdminOverview, fetchAdminAIAnalysis, fetchEvents } from '../../api/client';
import { NetworkOverview, OperationalEvent } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';
import { NetworkAIAnalysisCard } from '../../components/NetworkAIAnalysisCard';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [structuredAnalysis, setStructuredAnalysis] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadData = async () => {
    try {
      const [oRes, eRes] = await Promise.all([
        fetchAdminOverview(),
        fetchEvents(undefined, 12)
      ]);
      setOverview(oRes);
      setEvents(eRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAIAnalysis = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetchAdminAIAnalysis();
      setAiAnalysis(res.analysis);
      setStructuredAnalysis(res.structured);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const zones = [
    { id: 'zone-1', name: 'Zone 1 - North Bengaluru', phcCount: 10, areas: 'Hebbal, Yelahanka, Vidyaranyapura, RT Nagar' },
    { id: 'zone-2', name: 'Zone 2 - South Bengaluru', phcCount: 10, areas: 'Jayanagar, JP Nagar, BTM, Banashankari, HSR' },
    { id: 'zone-3', name: 'Zone 3 - East Bengaluru', phcCount: 10, areas: 'Indiranagar, Whitefield, KR Puram, Marathahalli' },
    { id: 'zone-4', name: 'Zone 4 - West Bengaluru', phcCount: 10, areas: 'Malleshwaram, Rajajinagar, Peenya, Vijayanagar' },
  ];

  return (
    <div className="space-y-6">
      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total PHCs */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Health Centres</span>
            <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview?.total_phcs || 40}</span>
            <span className="text-xs text-slate-500">across 4 BBMP zones</span>
          </div>
          <p className="text-[11px] text-teal-700 font-semibold mt-2">100% active live reporting</p>
        </div>

        {/* Network Beds */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Network Bed Occupancy</span>
            <div className="p-1.5 bg-teal-50 border border-teal-200 rounded-md text-teal-700">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview?.network_occupancy_rate ?? 0}%</span>
            <span className="text-xs text-slate-500">
              ({overview?.occupied_beds ?? 0}/{overview?.total_beds ?? 0} beds)
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overview?.network_occupancy_rate || 0}%` }}
            />
          </div>
        </div>

        {/* High Risk Shortages */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medicine Shortages</span>
            <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-md text-rose-700">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">{overview?.high_risk_medicine_count ?? 0}</span>
            <span className="text-xs text-slate-500">items below runway buffer</span>
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-2">High / Critical ML risk flagged</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Decision Queue</span>
            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview?.pending_approvals_count ?? 0}</span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
          <Link
            to="/admin/approvals"
            className="text-[11px] text-indigo-700 font-bold hover:text-indigo-900 flex items-center gap-1 mt-2"
          >
            <span>Open Decision Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Groq AI Strategic Analysis Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Groq GPT-OSS 120B Operational Situation Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Contextual AI reasoning & structured operations guidance across all 40 Bengaluru PHCs
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAIAnalysis}
            disabled={isGeneratingAI}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Situation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Network Reasoning</span>
              </>
            )}
          </button>
        </div>

        {aiAnalysis || structuredAnalysis ? (
          <NetworkAIAnalysisCard
            analysis={aiAnalysis}
            structured={structuredAnalysis}
            model="Groq GPT-OSS 120B / pulsegrid-analytics"
          />
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-800">Operational Synthesis Ready</h4>
              <p className="text-slate-600 mt-0.5">
                Click <strong>"Run Network Reasoning"</strong> to analyze current 40-PHC inventory levels, identify zone bottlenecks, and generate structured executive recommendations.
              </p>
            </div>
            <button
              onClick={handleRunAIAnalysis}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Run Reasoning
            </button>
          </div>
        )}
      </div>

      {/* 4 Zones Breakdown Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Bengaluru Operational Zones (4 Zones × 10 PHCs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((z) => (
            <div key={z.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                  {z.id.toUpperCase()}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{z.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{z.areas}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">{z.phcCount} Facilities</span>
                <Link
                  to={`/admin/phcs?zone=${z.id}`}
                  className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Critical Stockouts, Bed Occupancy, & Live Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Medicine Stockouts */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Impending Stockouts</h3>
              <p className="text-xs text-slate-500">Runway &lt; 4 days</p>
            </div>
            <Link to="/admin/predictions" className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {overview?.critical_stockouts && overview.critical_stockouts.length > 0 ? (
              overview.critical_stockouts.slice(0, 6).map((s) => (
                <div key={s.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{s.phc_name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">({s.zone_id})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-800">{s.medicine_name}</span>: {s.current_stock} left ({s.daily_consumption}/d burn)
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <RiskBadge level={s.stockout_risk} />
                    <div className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                      {s.predicted_days_left}d left
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No critical medicine stockouts flagged</p>
            )}
          </div>
        </div>

        {/* High Occupancy Facilities */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bed Occupancy</h3>
              <p className="text-xs text-slate-500">PHCs ≥ 75% capacity</p>
            </div>
            <Link to="/admin/analytics" className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold">
              Analytics
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {overview?.high_occupancy_phcs && overview.high_occupancy_phcs.length > 0 ? (
              overview.high_occupancy_phcs.slice(0, 6).map((b) => (
                <div key={b.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{b.phc_name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">({b.zone_id})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {b.occupied_beds} of {b.total_beds} beds filled
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-700">{b.occupancy_rate}%</span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Trend: <strong className="text-slate-700">{b.occupancy_trend}</strong>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">All PHCs operating within normal bed capacity</p>
            )}
          </div>
        </div>

        {/* Live Event Feed (Human Readable!) */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Live Network Feed</h3>
            </div>
            <span className="text-[10px] font-medium text-slate-500">Live Stream</span>
          </div>

          <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[360px]">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent events</p>
            ) : (
              events.map((evt) => {
                const isCrit = evt.severity === 'CRITICAL';
                const isWarn = evt.severity === 'WARNING';
                const eventTitle = evt.formatted_title || evt.event_type.replace(/_/g, ' ');
                const eventSummary = evt.formatted_summary || (
                  evt.event_type === 'medicine_consumed' ? `${evt.details?.quantity || 1} units consumed` :
                  evt.event_type === 'patient_admitted' ? `Patient admitted` :
                  'Facility state updated'
                );
                const eventTime = evt.formatted_time || (evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now');

                return (
                  <div key={evt.id} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2.5">
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
    </div>
  );
};
