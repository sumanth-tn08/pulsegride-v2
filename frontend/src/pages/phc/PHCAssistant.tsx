import React, { useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  MapPin,
  Pill,
  AlertTriangle,
  Globe,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  Clock,
  ShieldCheck,
  Check,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  searchNearbyMedicines,
  sendAIChat,
  runTinyFishInvestigation
} from '../../api/client';
import { PHC, NearbySearchResponse, TinyFishEvidence } from '../../types';
import { AudioVoiceRecorder } from '../../components/AudioVoiceRecorder';
import { RiskBadge } from '../../components/RiskBadge';

const MEDICINE_CATALOG = [
  { id: 'med-01', canonical: 'Cefixime', aliases: ['cefixime', 'cefix', 'taxim', 'mahacef', 'suprax'] },
  { id: 'med-02', canonical: 'Amoxicillin', aliases: ['amoxicillin', 'amox', 'mox', 'augmentin', 'amoxycillin'] },
  { id: 'med-03', canonical: 'Paracetamol', aliases: ['paracetamol', 'pcm', 'crocin', 'dolo', 'calpol', 'panadol', 'acetaminophen'] },
  { id: 'med-04', canonical: 'Azithromycin', aliases: ['azithromycin', 'azith', 'azee', 'zithro', 'zithromax'] },
  { id: 'med-05', canonical: 'Metformin', aliases: ['metformin', 'glycomet', 'glucophage'] },
  { id: 'med-06', canonical: 'Amlodipine', aliases: ['amlodipine', 'amlong', 'stamlo', 'norvasc'] },
  { id: 'med-07', canonical: 'ORS Sachets', aliases: ['ors', 'oral rehydration', 'electrolyte', 'electral'] },
  { id: 'med-08', canonical: 'Salbutamol', aliases: ['salbutamol', 'asthalin', 'ventolin', 'albuterol'] },
  { id: 'med-09', canonical: 'Cetirizine', aliases: ['cetirizine', 'cetzine', 'alerid', 'okacet', 'zyrtec'] },
  { id: 'med-10', canonical: 'Pantoprazole', aliases: ['pantoprazole', 'pan', 'pantocid', 'pantop', 'pantodac'] },
];

function extractMedicineAndQty(query: string): { medicine: string | null; quantity: number } {
  const lower = query.toLowerCase();
  let matchedMed: string | null = null;
  for (const item of MEDICINE_CATALOG) {
    if (item.aliases.some(alias => lower.includes(alias))) {
      matchedMed = item.canonical;
      break;
    }
  }

  const qtyMatch = query.match(/(?:need|get|for|require|request|want)?\s*(\d+)\s*(?:units?|tablets?|strips?|sachets?|bottles?|boxes?|vials?|pills?|doses?)?/i);
  let qty = 100;
  if (qtyMatch && parseInt(qtyMatch[1], 10) > 0) {
    qty = parseInt(qtyMatch[1], 10);
  }
  return { medicine: matchedMed, quantity: qty };
}

export const PHCAssistant: React.FC = () => {
  const { phc, selectedPHCId } = useOutletContext<{ phc: PHC; selectedPHCId: string }>();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [activeMedicine, setActiveMedicine] = useState<string | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState<number>(100);
  const [isSearching, setIsSearching] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // Structured AI Response State (NO raw markdown)
  const [structuredAI, setStructuredAI] = useState<any | null>(null);
  const [rawTextReply, setRawTextReply] = useState<string>('');
  const [investigationResult, setInvestigationResult] = useState<any | null>(null);
  const [clarificationNeeded, setClarificationNeeded] = useState<string | null>(null);
  const [networkTab, setNetworkTab] = useState<'same' | 'cross'>('same');

  // Main Query Orchestrator - Clears all previous state on every new query
  const executeQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setInputText(queryText);
    setIsSearching(true);

    // CRITICAL: Clear all previous investigation state
    setStructuredAI(null);
    setRawTextReply('');
    setInvestigationResult(null);
    setClarificationNeeded(null);

    // Extract requested medicine strictly from this query
    const { medicine: detectedMed, quantity: detectedQty } = extractMedicineAndQty(queryText);
    setRequestedQuantity(detectedQty);

    if (!detectedMed) {
      setActiveMedicine(null);
      setIsSearching(false);
      setClarificationNeeded("Please specify the medicine name (e.g. Paracetamol, Cefixime, Amoxicillin, Azithromycin, ORS Sachets) to investigate availability.");
      return;
    }

    setActiveMedicine(detectedMed);

    try {
      // 1. Search internal database specifically for THIS medicine
      const searchRes = await searchNearbyMedicines(selectedPHCId, detectedMed, false, detectedQty);

      // 2. Query AI with deterministic context
      const aiRes = await sendAIChat(selectedPHCId, queryText, {
        medicine: detectedMed,
        quantity: detectedQty,
        query: queryText,
        internal_results: searchRes,
        phc_name: phc?.name,
        zone_name: phc?.zone_name
      });

      if (aiRes.structured) {
        setStructuredAI(aiRes.structured);
        // If internal stock is insufficient, automatically initiate external supplier search for THIS medicine
        if (!aiRes.structured.internal_network?.is_internal_stock_sufficient) {
          triggerTinyFish(detectedMed, detectedQty);
        }
      } else {
        setRawTextReply(aiRes.reply);
      }
    } catch (err) {
      console.error("Error in AI assistant query:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger External Supply Investigation for THAT Specific Medicine
  const triggerTinyFish = async (medName: string, qty: number) => {
    setIsInvestigating(true);
    try {
      const res = await runTinyFishInvestigation(selectedPHCId, medName);
      setInvestigationResult(res);
    } catch (err) {
      console.error("Error running TinyFish investigation:", err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const sampleQueries = [
    "Can I get Paracetamol in our zone?",
    "I need Cefixime 100 units. Check nearby PHCs in our zone.",
    "Check Amoxicillin surplus across neighboring facilities",
    "Do we have ORS Sachets available for emergency rehydration?"
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Clinical Operations AI Assistant</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  Groq GPT-OSS 120B · Whisper-v3
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Check internal PHC network surplus and external Bengaluru supplier availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioVoiceRecorder onTranscribed={executeQuery} isProcessing={isSearching || isInvestigating} />
          </div>
        </div>

        {/* Text Input Row */}
        <form
          onSubmit={(e) => { e.preventDefault(); executeQuery(inputText); }}
          className="mt-4 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask an operational question, e.g. 'Can I get Paracetamol in our zone?' or 'I need Cefixime 100 units'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-4 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching || isInvestigating || !inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask Assistant</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Prompts:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => executeQuery(q)}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Clarification Alert if No Medicine was Specified */}
      {clarificationNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in duration-150">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Medicine Name Required</h4>
            <p className="mt-0.5 text-amber-800">{clarificationNeeded}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {['Paracetamol', 'Cefixime', 'Amoxicillin', 'Azithromycin', 'ORS Sachets'].map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => executeQuery(`Can I get ${med} in our zone?`)}
                  className="px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-900 font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Structured AI Response: Clean, Structured, Actionable (No Raw Markdown) */}
      {(structuredAI || rawTextReply) && activeMedicine && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Section 1: Situation */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Situation: {activeMedicine}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Scope: {structuredAI?.search_scope_label || 'Nearby Facilities'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  structuredAI?.status === 'SUFFICIENT_INTERNAL_STOCK'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {structuredAI?.status === 'SUFFICIENT_INTERNAL_STOCK' ? '✓ Internal Stock Sufficient' : '⚠ Internal Stock Insufficient'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {structuredAI?.situation || rawTextReply}
            </p>
          </div>

          {/* Section 2: Internal Network */}
          {structuredAI?.internal_network && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Internal Network Availability</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {phc?.name} ({phc?.zone_name || 'Zone 1'})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Current Stock</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{structuredAI.internal_network.current_stock} u</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Requested Qty</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{structuredAI.internal_network.requested_quantity} u</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Available Surplus</span>
                  <span className="text-sm font-bold text-teal-700 mt-0.5 block">+{structuredAI.internal_network.available_surplus} u</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Suitable PHCs</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{structuredAI.internal_network.suitable_phcs_count} facilities</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Supply Status</span>
                  <span className={`text-xs font-bold mt-1 block ${structuredAI.internal_network.is_internal_stock_sufficient ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {structuredAI.internal_network.is_internal_stock_sufficient ? 'Sufficient' : 'Deficit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Network Options (Same-Zone & Cross-Zone) */}
          {((structuredAI?.same_zone_options && structuredAI.same_zone_options.length > 0) ||
            (structuredAI?.cross_zone_options && structuredAI.cross_zone_options.length > 0)) && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Network Supply Options</h3>
                </div>
                
                {/* Segmented Tab Switcher */}
                <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNetworkTab('same')}
                    className={`px-3 py-1 rounded transition cursor-pointer ${
                      networkTab === 'same'
                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Same-Zone ({structuredAI?.same_zone_options?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetworkTab('cross')}
                    className={`px-3 py-1 rounded transition cursor-pointer ${
                      networkTab === 'cross'
                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cross-Zone Network ({structuredAI?.cross_zone_options?.length || 0})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">PHC Facility</th>
                      <th className="px-3 py-2">Zone</th>
                      <th className="px-3 py-2">Available Stock</th>
                      <th className="px-3 py-2">Transferable Surplus</th>
                      <th className="px-3 py-2">Distance</th>
                      <th className="px-3 py-2">Transfer Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(networkTab === 'same'
                      ? (structuredAI?.same_zone_options || [])
                      : (structuredAI?.cross_zone_options || [])
                    ).map((opt: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-bold text-slate-900">{opt.phc_name}</td>
                        <td className="px-3 py-2.5 text-slate-600 uppercase font-semibold text-[10px]">{opt.zone_id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{opt.available_stock} u</td>
                        <td className="px-3 py-2.5 font-semibold text-teal-700">+{opt.transferable_surplus} u</td>
                        <td className="px-3 py-2.5 text-slate-600">{opt.distance_km} km</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            opt.transferable_surplus > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {opt.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(networkTab === 'same' ? structuredAI?.same_zone_options : structuredAI?.cross_zone_options)?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-500 italic">
                          No {networkTab === 'same' ? 'same-zone' : 'cross-zone'} facilities with available surplus found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: External Web Evidence (TinyFish Discovered Suppliers) */}
          {(investigationResult || isInvestigating) && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    External Web Evidence: {activeMedicine}
                  </h3>
                </div>
                {isInvestigating ? (
                  <span className="text-xs text-teal-700 flex items-center gap-1 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Investigating Bengaluru commercial sources...</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {investigationResult?.investigation?.evidence_count || 0} distinct suppliers found
                  </span>
                )}
              </div>

              {investigationResult?.investigation?.evidence && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investigationResult.investigation.evidence.slice(0, 4).map((ev: TinyFishEvidence) => (
                    <div key={ev.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                            {ev.source_category}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {ev.estimated_lead_time !== 'Not available' ? ev.estimated_lead_time : 'Lead time: Inquire'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-2">{ev.source_name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </p>

                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-2 italic leading-relaxed">
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
              )}
            </div>
          )}

          {/* Section 5 & 6: Recommendation & Why */}
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wide mb-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                <span>Recommendation</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {structuredAI?.recommendation || `Reallocate units of ${activeMedicine} from nearest available facility.`}
              </h4>
            </div>

            {/* Why: 2-4 Short Reasons */}
            {structuredAI?.why && structuredAI.why.length > 0 && (
              <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide block mb-1.5">
                  Operational Justification:
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {structuredAI.why.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clear Next Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Action Type: <strong className="text-slate-800">{structuredAI?.action_type || 'EMERGENCY_TRANSFER'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Link
                  to={`/phc/medicines?search=${encodeURIComponent(activeMedicine)}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Medicine Investigation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Collapsible View Reasoning */}
          {structuredAI?.detailed_reasoning && (
            <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Clinical Reasoning</span>
                </div>
                {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showReasoning && (
                <div className="p-4 pt-1 text-xs text-slate-700 leading-relaxed border-t border-slate-200/60 bg-white">
                  {structuredAI.detailed_reasoning}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
