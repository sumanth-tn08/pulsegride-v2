import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Search,
  Loader2,
  Sparkles,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Building2,
  Pill,
  AlertTriangle,
  Check
} from 'lucide-react';
import { runTinyFishInvestigation, reviewApproval } from '../../api/client';
import { TinyFishEvidence, NearbySearchResultItem } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';

export const AdminInvestigation: React.FC = () => {
  const [medicineQuery, setMedicineQuery] = useState('Paracetamol');
  const [selectedPHC, setSelectedPHC] = useState('phc-01');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationData, setInvestigationData] = useState<any | null>(null);
  const [showTraceLogs, setShowTraceLogs] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const sampleMedicines = [
    'Paracetamol',
    'Cefixime',
    'Amoxicillin',
    'Azithromycin',
    'ORS Sachets',
    'Metformin'
  ];

  const handleInvestigate = async (medToQuery?: string) => {
    const med = medToQuery || medicineQuery;
    if (!med.trim()) return;
    setMedicineQuery(med);
    setIsInvestigating(true);
    setInvestigationData(null);
    setDecisionSuccess(null);
    try {
      const res = await runTinyFishInvestigation(selectedPHC, med);
      setInvestigationData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!investigationData?.approval_id) return;
    setDecisionSubmitting(true);
    try {
      await reviewApproval(investigationData.approval_id, decision, 'Bengaluru Health Administrator');
      setDecisionSuccess(`Recommendation successfully ${decision}. Operational database and audit records updated.`);
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const internalStock = investigationData?.internal_stock_checked;
  const sameZoneList: NearbySearchResultItem[] = internalStock?.same_zone_results || [];
  const otherZonesList: NearbySearchResultItem[] = internalStock?.other_zones_results || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Health Administration Investigation Hub</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  Bengaluru · Karnataka
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-source evaluation: Current PHC → Same Zone → Cross-Zone → TinyFish Commercial Suppliers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPHC}
              onChange={(e) => setSelectedPHC(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 shadow-2xs"
            >
              <option value="phc-01">Hebbal Urban CHC (Zone 1)</option>
              <option value="phc-02">RT Nagar Community PHC (Zone 1)</option>
              <option value="phc-11">Jayanagar General PHC (Zone 2)</option>
              <option value="phc-21">Indiranagar 100ft PHC (Zone 3)</option>
              <option value="phc-31">Malleshwaram 15th Cross PHC (Zone 4)</option>
            </select>

            <input
              type="text"
              value={medicineQuery}
              onChange={(e) => setMedicineQuery(e.target.value)}
              placeholder="e.g. Paracetamol, Cefixime..."
              className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 w-36 sm:w-44 shadow-2xs"
            />

            <button
              onClick={() => handleInvestigate()}
              disabled={isInvestigating}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition disabled:opacity-50 whitespace-nowrap shadow-xs cursor-pointer"
            >
              {isInvestigating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Investigating...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Investigate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Test Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Inquiries:</span>
          {sampleMedicines.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInvestigate(m)}
              className={`text-[11px] px-2.5 py-1 rounded border transition cursor-pointer ${
                medicineQuery.toLowerCase() === m.toLowerCase()
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Investigation Results Workspace */}
      {investigationData ? (
        <div className="space-y-5">
          {/* 1. Situation Assessment */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                  Situation Assessment
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {investigationData.medicine_name} Operational Sourcing Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  Target Facility: {investigationData.recommendation?.target_name || selectedPHC} · Location: Bengaluru, Karnataka, India
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  internalStock?.is_internal_stock_sufficient
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {internalStock?.is_internal_stock_sufficient ? '✓ Internal Stock Sufficient' : '⚠ External Sourcing Required'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-800 font-medium leading-relaxed mt-3">
              {investigationData.recommendation.situation || investigationData.recommendation.ai_reasoning}
            </p>
          </div>

          {/* 2. Internal Network Availability (Current PHC + Same Zone + Cross-Zone) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Internal Network Availability</h3>
              </div>
              <span className="text-xs text-slate-500">
                Zone Surplus: <strong>+{internalStock?.zone_transferable_surplus ?? 0} units</strong>
              </span>
            </div>

            {/* Same Zone Summary */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Same Zone Facilities:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sameZoneList.slice(0, 3).map((r) => (
                  <div key={r.phc_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{r.phc_name}</span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">{r.distance_km} km</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500">Surplus:</span>
                      <strong className={(r.transferable_surplus ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                        {(r.transferable_surplus ?? 0) > 0 ? `+${r.transferable_surplus} u` : '0 (buffer locked)'}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Zone Table */}
            {otherZonesList.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Cross-Zone Options (Other 3 BBMP Zones):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Facility</th>
                        <th className="px-3 py-2">Zone</th>
                        <th className="px-3 py-2">Distance</th>
                        <th className="px-3 py-2">Stock</th>
                        <th className="px-3 py-2">Surplus</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {otherZonesList.slice(0, 4).map((r) => (
                        <tr key={r.phc_id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-bold text-slate-900">{r.phc_name}</td>
                          <td className="px-3 py-2 uppercase text-slate-500">{r.zone_id}</td>
                          <td className="px-3 py-2">{r.distance_km} km</td>
                          <td className="px-3 py-2">{r.current_stock} u</td>
                          <td className="px-3 py-2 font-semibold">
                            <span className={(r.transferable_surplus ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                              {(r.transferable_surplus ?? 0) > 0 ? `+${r.transferable_surplus} u` : '0'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              (r.transferable_surplus ?? 0) > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {(r.transferable_surplus ?? 0) > 0 ? 'Transfer Available' : 'Reserve Locked'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. External Web Evidence (TinyFish Discovered Suppliers) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  External Web Evidence ({investigationData.investigation.evidence_count} Verified Suppliers)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTraceLogs(!showTraceLogs)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{showTraceLogs ? 'Hide trace logs' : 'View trace logs'}</span>
                {showTraceLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTraceLogs && (
              <div className="p-3 rounded-md bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                {investigationData.investigation.investigation_logs.map((log: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold">›</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {investigationData.investigation.evidence.slice(0, 4).map((ev: TinyFishEvidence) => (
                <div key={ev.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                        {ev.source_category}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {ev.estimated_lead_time !== 'Not available' ? ev.estimated_lead_time : 'Lead time: Inquire'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2">{ev.source_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ev.location}</p>

                    <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 mt-2 italic leading-relaxed">
                      "{ev.evidence_snippet}"
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Price: <strong>{ev.unit_cost_inr || 'Not available'}</strong>
                    </span>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Recommendation & Why */}
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wide mb-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                <span>Recommendation</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {investigationData.recommendation.recommendation || `Approve logistics dispatch for ${investigationData.medicine_name}.`}
              </h4>
            </div>

            {/* Why: 2-4 Short Reasons */}
            {investigationData.recommendation.why && investigationData.recommendation.why.length > 0 && (
              <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide block mb-1.5">
                  Operational Justification:
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {investigationData.recommendation.why.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decision: Direct Approve / Reject Buttons for Health Administrator */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Administrator Decision Authority:</span>
                <span className="text-xs text-slate-700">
                  Indent ID: <code className="text-indigo-800 font-bold">{investigationData.approval_id}</code> ({investigationData.recommendation.quantity_recommended} units of {investigationData.medicine_name})
                </span>
              </div>

              {decisionSuccess ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{decisionSuccess}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision('REJECTED')}
                    disabled={decisionSubmitting}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleDecision('APPROVED')}
                    disabled={decisionSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Recommendation</span>
                  </button>
                  <Link
                    to="/admin/approvals"
                    className="ml-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    Open Full Queue
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-xs">
          <Globe className="w-10 h-10 text-teal-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Health Administration Investigation Workspace</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Select a facility and medicine above or pick one of the quick inquiries (e.g. <strong>Paracetamol</strong>, <strong>Cefixime</strong>, <strong>Amoxicillin</strong>) to evaluate internal and external availability.
          </p>
          <button
            onClick={() => handleInvestigate('Paracetamol')}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Investigate Paracetamol Supply
          </button>
        </div>
      )}
    </div>
  );
};
