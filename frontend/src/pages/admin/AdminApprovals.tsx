import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Building2,
  Pill,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  FileCheck
} from 'lucide-react';
import { fetchApprovals, reviewApproval } from '../../api/client';
import { ActionApproval, TinyFishEvidence } from '../../types';

export const AdminApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ActionApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadApprovals = async () => {
    try {
      const res = await fetchApprovals();
      setApprovals(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    const interval = setInterval(loadApprovals, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setReviewingId(approvalId);
    try {
      await reviewApproval(approvalId, decision, 'Dr. R. Rao, Bengaluru Health Directorate');
      setStatusMessage(`Action successfully ${decision}. Operational database and audit logs updated.`);
      await loadApprovals();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingId(null);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const pastApprovals = approvals.filter(a => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">Administrative Decision Queue & Human Approval</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
            Human-in-the-Loop Authority
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Review evidence-backed recommendations synthesized by Groq GPT-OSS 120B and investigated by TinyFish MCP.
          The Health Administrator is the final decision-maker. Autonomous execution is blocked pending administrator sign-off.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Pending Queue Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Pending Recommendations Requiring Human Approval ({pendingApprovals.length})
          </h3>
          <span className="text-xs text-slate-500">Autonomous execution blocked pending administrator sign-off</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs shadow-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">Decision Queue Clear</p>
            <p className="mt-1 text-slate-500">
              No pending emergency transfer or procurement requests currently require review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((appr) => (
              <div
                key={appr.id}
                className="bg-white border-2 border-indigo-200 rounded-lg p-5 shadow-xs transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                      {appr.action_type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {appr.id}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted: {new Date(appr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                {/* Logistics Key Value Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Affected PHC Facility:</span>
                    <strong className="text-slate-900">{appr.phc_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Medicine Item:</span>
                    <strong className="text-slate-900">{appr.medicine_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Quantity:</span>
                    <strong className="text-indigo-700 text-sm">{appr.quantity} units</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Procurement / Transfer Source:</span>
                    <strong className="text-teal-700">{appr.source_name}</strong>
                  </div>
                </div>

                {/* AI Reasoning Summary */}
                <div className="mb-4 p-4 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold mb-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-700" />
                    <span>Groq GPT-OSS 120B Clinical Logistics Reasoning:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {appr.ai_recommendation_summary}
                  </p>
                </div>

                {/* TinyFish Web Evidence Summary */}
                {appr.tinyfish_evidence && appr.tinyfish_evidence.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span>Attached TinyFish Web Evidence ({appr.tinyfish_evidence.length} Sources in Bengaluru):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {appr.tinyfish_evidence.slice(0, 2).map((ev: TinyFishEvidence) => (
                        <div key={ev.id} className="p-3 rounded border border-slate-200 bg-white text-xs">
                          <div className="font-bold text-slate-900">{ev.source_name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Lead time: <strong>{ev.estimated_lead_time}</strong> · Conf: {Math.round(ev.confidence_score * 100)}%
                          </div>
                          <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-2">
                            "{ev.evidence_snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Human Authorization Actions */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Sign-off: Dr. R. Rao, Chief Health Administrator, Bengaluru Directorate</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(appr.id, 'REJECTED')}
                      disabled={reviewingId === appr.id}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-bold shadow-2xs transition"
                    >
                      Reject Indent
                    </button>
                    <button
                      onClick={() => handleDecision(appr.id, 'APPROVED')}
                      disabled={reviewingId === appr.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Authorize Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit History Log */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">
            Chronological Decision Audit Log ({pastApprovals.length})
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Facility</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Medicine & Qty</th>
                  <th className="px-4 py-3">Reviewer Decision</th>
                  <th className="px-4 py-3">Reviewer Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No decision records logged yet
                    </td>
                  </tr>
                ) : (
                  pastApprovals.map((appr) => {
                    const isApproved = appr.status === 'APPROVED';
                    return (
                      <tr key={appr.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {appr.reviewed_at ? new Date(appr.reviewed_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {appr.phc_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {appr.action_type}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {appr.medicine_name} ({appr.quantity} units)
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{appr.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {appr.reviewed_by || 'Dr. R. Rao, Health Directorate'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
