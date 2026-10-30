import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  Building2,
  Pill,
  BedDouble,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';
import { RiskBadge } from './RiskBadge';

interface HighRiskMed {
  phc_name: string;
  zone_id: string;
  medicine_name: string;
  current_stock: number;
  predicted_days_left: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
}

interface HighOccFacility {
  phc_name: string;
  zone_id: string;
  occupied_beds: number;
  total_beds: number;
  occupancy_rate: number;
  trend: string;
}

interface NetworkAIAnalysisCardProps {
  analysis: string;
  structured?: any;
  model?: string;
}

export const NetworkAIAnalysisCard: React.FC<NetworkAIAnalysisCardProps> = ({
  analysis,
  structured,
  model = 'Groq GPT-OSS 120B / pulsegrid-analytics'
}) => {
  const [showFullNarrative, setShowFullNarrative] = useState(false);

  // Normalize structured data keys
  const findings: string[] = structured?.critical_findings || structured?.executive_findings || [];
  const highRiskMeds: HighRiskMed[] = structured?.high_risk_medicines || [];
  const pressurePoints: HighOccFacility[] = structured?.bed_pressure_points || structured?.high_occupancy_facilities || [];
  const recommendedActions: any[] = structured?.recommended_actions || [];
  const evidenceSources: string[] = structured?.evidence_sources || [
    'Live Bengaluru Grid Operational Database (40 PHCs)',
    'Scikit-Learn Random Forest Stockout & Bed Predictors',
    'TinyFish Multi-Source Commercial Distributor Evidence'
  ];

  const hasStructured = Boolean(structured && (findings.length > 0 || highRiskMeds.length > 0));

  // Clean raw markdown if displaying narrative
  const cleanNarrative = (raw: string) => {
    return raw
      .replace(/###\s+/g, '')
      .replace(/##\s+/g, '')
      .replace(/#\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\|/g, ' ')
      .replace(/---\s*/g, '');
  };

  return (
    <div className="space-y-4">
      {/* Executive Status Banner */}
      <div className="p-4 rounded-lg bg-indigo-50/80 border border-indigo-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Executive Situation Assessment</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200">
                  {model}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {structured?.network_situation || 'Dynamic synthesis of 40 PHCs across Bengaluru (4 BBMP zones)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1">
              <Pill className="w-3 h-3 text-rose-600" />
              {highRiskMeds.length} Critical Items
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
              <BedDouble className="w-3 h-3 text-amber-600" />
              {pressurePoints.length} Bed Strains
            </span>
          </div>
        </div>

        {/* Executive Findings Bullets */}
        {findings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200/70 space-y-1.5">
            {findings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Layout: High-Risk Medicines Table + Capacity Pressures */}
      {hasStructured && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* High-Risk Medicines HTML Table */}
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-rose-600" />
                <h5 className="text-xs font-bold text-slate-900">High-Risk Impending Stockouts</h5>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Scikit-Learn ML Runway</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">Facility & Zone</th>
                    <th className="px-3 py-2">Medicine</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Runway</th>
                    <th className="px-3 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highRiskMeds.length > 0 ? (
                    highRiskMeds.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900 line-clamp-1">{m.phc_name}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{m.zone_id}</div>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-800">{m.medicine_name}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700">{m.current_stock} u</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-rose-700">{m.predicted_days_left}d</td>
                        <td className="px-3 py-2.5">
                          <RiskBadge level={m.risk as any} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-xs">
                        No critical stockouts flagged across network
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bed Occupancy Strain & Pressure Points */}
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-indigo-600" />
                <h5 className="text-xs font-bold text-slate-900">Bed Capacity Strain Points</h5>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">≥75% Occupancy</span>
            </div>

            <div className="divide-y divide-slate-100 p-3 space-y-2">
              {pressurePoints.length > 0 ? (
                pressurePoints.map((fac, idx) => (
                  <div key={idx} className="p-2.5 rounded-md bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{fac.phc_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Occupied: <strong className="text-slate-800">{fac.occupied_beds}</strong> / {fac.total_beds} beds · Zone: {fac.zone_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        fac.occupancy_rate >= 85 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {fac.occupancy_rate}%
                      </span>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1">
                        Trend: {fac.trend}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">All facilities have comfortable bed margins</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Tactical Interventions */}
      {recommendedActions.length > 0 && (
        <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Recommended Operations Directives:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {recommendedActions.map((act, idx) => {
              const actionTitle = typeof act === 'string' ? `Directive #${idx + 1}` : act.action;
              const actionDesc = typeof act === 'string' ? act : act.detail;
              const urgency = typeof act === 'object' && act.urgency ? act.urgency : (idx === 0 ? 'HIGH' : 'MEDIUM');

              return (
                <div key={idx} className="p-3 rounded-md bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{actionTitle}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {urgency} Urgency
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{actionDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Evidence Sources Badges */}
      {evidenceSources.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Verified Pipeline Feeds:
          </span>
          {evidenceSources.map((src, idx) => (
            <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
              ✓ {src}
            </span>
          ))}
        </div>
      )}

      {/* Toggleable Full AI Synthesis Log */}
      {analysis && (
        <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFullNarrative(!showFullNarrative)}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full AI Synthesis Narrative ({model})</span>
            </div>
            {showFullNarrative ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullNarrative && (
            <div className="p-4 pt-0 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border-t border-slate-200/60 bg-white">
              {cleanNarrative(analysis)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
