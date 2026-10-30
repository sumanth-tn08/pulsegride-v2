import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Pill,
  Search,
  Building2,
  MapPin,
  Globe,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  fetchPHCMedicines,
  searchNearbyMedicines,
  runTinyFishInvestigation,
  consumeMedicine
} from '../../api/client';
import {
  PHC,
  PHCMedicineStock,
  NearbySearchResponse,
  NearbySearchResultItem,
  TinyFishEvidence
} from '../../types';
import { RiskBadge } from '../../components/RiskBadge';

export const PHCMedicines: React.FC = () => {
  const { phc, selectedPHCId } = useOutletContext<{ phc: PHC; selectedPHCId: string }>();
  const [searchParams] = useSearchParams();

  // Search & Escalation State
  const [medicineQuery, setMedicineQuery] = useState(searchParams.get('search') || 'Paracetamol');
  const [requiredQty, setRequiredQty] = useState(100);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<NearbySearchResponse | null>(null);

  // TinyFish External Investigation State
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationData, setInvestigationData] = useState<any | null>(null);
  const [showTraceLogs, setShowTraceLogs] = useState(false);

  // Local PHC Inventory State
  const [stocks, setStocks] = useState<PHCMedicineStock[]>([]);
  const [selectedMed, setSelectedMed] = useState<PHCMedicineStock | null>(null);
  const [consumeQty, setConsumeQty] = useState(10);
  const [consumeNotes, setConsumeNotes] = useState('');
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseSuccess, setDispenseSuccess] = useState('');

  const loadStocks = async () => {
    if (!selectedPHCId) return;
    try {
      const res = await fetchPHCMedicines(selectedPHCId);
      setStocks(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStocks();
    const interval = setInterval(loadStocks, 8000);
    return () => clearInterval(interval);
  }, [selectedPHCId]);

  // Execute Search Across Bengaluru Network
  const handleSearch = async (queryOverride?: string) => {
    const med = queryOverride || medicineQuery;
    if (!med.trim()) return;
    setIsSearching(true);
    setInvestigationData(null);
    try {
      const res = await searchNearbyMedicines(selectedPHCId, med, false, requiredQty);
      setSearchResult(res);
    } catch (err) {
      console.error("Error searching medicines:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Run search on mount if query provided in URL
  useEffect(() => {
    const initialQuery = searchParams.get('search');
    if (initialQuery) {
      setMedicineQuery(initialQuery);
      handleSearch(initialQuery);
    } else {
      handleSearch('Paracetamol');
    }
  }, [selectedPHCId]);

  // Trigger External TinyFish Investigation
  const handleTriggerTinyFish = async () => {
    const med = searchResult?.medicine_name || medicineQuery;
    if (!med) return;
    setIsInvestigating(true);
    try {
      const res = await runTinyFishInvestigation(selectedPHCId, med);
      setInvestigationData(res);
    } catch (err) {
      console.error("Error running TinyFish investigation:", err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    setIsDispensing(true);
    try {
      await consumeMedicine(selectedPHCId, selectedMed.medicine_id, consumeQty, consumeNotes);
      setDispenseSuccess(`Dispensed ${consumeQty} units of ${selectedMed.medicine_name}`);
      await loadStocks();
      if (searchResult && searchResult.medicine_id === selectedMed.medicine_id) {
        await handleSearch(searchResult.medicine_name);
      }
      setTimeout(() => {
        setSelectedMed(null);
        setDispenseSuccess('');
        setConsumeNotes('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispensing(false);
    }
  };

  const sampleQuickSearches = ['Paracetamol', 'Cefixime', 'Amoxicillin', 'Azithromycin', 'ORS Sachets', 'Metformin'];

  // Partition results into same zone vs other zones
  const sameZoneList: NearbySearchResultItem[] = searchResult?.same_zone_results || (
    searchResult?.results.filter(r => phc && r.zone_id === phc.zone_id) || []
  );
  const otherZonesList: NearbySearchResultItem[] = searchResult?.other_zones_results || (
    searchResult?.results.filter(r => phc && r.zone_id !== phc.zone_id) || []
  );

  return (
    <div className="space-y-6">
      {/* 1. Find Medicine Search Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Find Medicine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Check availability across the Bengaluru PHC network and external suppliers.
          </p>
        </div>

        {/* Search Controls */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter medicine name, e.g. Paracetamol, Cefixime, Amoxicillin..."
              value={medicineQuery}
              onChange={(e) => setMedicineQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 text-[11px] whitespace-nowrap">Required:</span>
              <input
                type="number"
                min="1"
                value={requiredQty}
                onChange={(e) => setRequiredQty(parseInt(e.target.value, 10) || 100)}
                className="w-16 bg-transparent text-xs font-bold text-slate-800 focus:outline-none text-right"
              />
              <span className="text-slate-400 text-[10px]">units</span>
            </div>

            <button
              type="submit"
              disabled={isSearching || !medicineQuery.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Find Availability</span>
            </button>
          </div>
        </form>

        {/* Quick Search Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Inquiries:</span>
          {sampleQuickSearches.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMedicineQuery(m);
                handleSearch(m);
              }}
              className={`text-[11px] px-2.5 py-1 rounded border transition cursor-pointer ${
                medicineQuery.toLowerCase() === m.toLowerCase()
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Natural Escalation Results: Local -> Same Zone -> Other Zones -> External Supply */}
      {searchResult && (
        <div className="space-y-5">
          {/* Section 1: Your PHC */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Your PHC ({phc?.name})</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Current Facility Reserve</span>
            </div>

            {searchResult.origin_stock ? (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Medicine</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{searchResult.origin_stock.medicine_name}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Current Stock</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {searchResult.origin_stock.current_stock} <span className="text-xs font-normal text-slate-500">{searchResult.origin_stock.unit || 'units'}</span>
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Daily Consumption</span>
                  <span className="text-sm font-bold text-slate-700 mt-0.5 block">
                    {searchResult.origin_stock.daily_consumption}/day
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Runway & Risk</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {searchResult.origin_stock.predicted_days_left} days left
                    </span>
                  </div>
                  <RiskBadge level={searchResult.origin_stock.stockout_risk} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No record found for this medicine at this facility.</p>
            )}
          </div>

          {/* Section 2: Same Zone (Nearby facilities) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Same Zone Availability ({phc?.zone_name || 'Zone 1'})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Neighboring facilities within local emergency transit radius
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                searchResult.is_internal_stock_sufficient
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {searchResult.is_internal_stock_sufficient
                  ? `✓ Zone Stock Sufficient (${searchResult.zone_transferable_surplus ?? searchResult.transferable_surplus ?? 0} units transferable surplus)`
                  : `⚠ Zone Deficient (${searchResult.zone_transferable_surplus ?? searchResult.transferable_surplus ?? 0} surplus units < ${requiredQty} requested)`}
              </span>
            </div>

            {sameZoneList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {sameZoneList.slice(0, 3).map((item) => (
                  <div key={item.phc_id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {item.distance_km} km away
                      </span>
                      <RiskBadge level={item.stockout_risk as any} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{item.phc_name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Current Stock:</span>
                        <span className="font-bold text-slate-800">{item.current_stock} units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Safe OPD Buffer:</span>
                        <span>{item.safe_local_buffer ?? 50} units</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-600">Transferable Surplus:</span>
                        <span className={(item.transferable_surplus ?? 0) > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                          {(item.transferable_surplus ?? 0) > 0 ? `+${item.transferable_surplus} units` : '0 (buffer locked)'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No other facilities in this zone have stock.</p>
            )}
          </div>

          {/* Section 3: Other Zones (Cross-Zone Real Database Results) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Other Zones (Cross-Zone Facilities)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Facilities across the other 3 BBMP zones with available inventory
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">{otherZonesList.length} facilities</span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">PHC</th>
                    <th className="px-3 py-2">Zone</th>
                    <th className="px-3 py-2">Distance</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Surplus</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {otherZonesList.slice(0, 6).map((item) => (
                    <tr key={item.phc_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{item.phc_name}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                          {item.zone_id}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{item.distance_km} km</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{item.current_stock} u</td>
                      <td className="px-3 py-2.5 font-semibold">
                        <span className={(item.transferable_surplus ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                          {(item.transferable_surplus ?? 0) > 0 ? `+${item.transferable_surplus} u` : '0'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          (item.transferable_surplus ?? 0) > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(item.transferable_surplus ?? 0) > 0 ? 'Surplus Available' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: External Supply (TinyFish Investigation) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">External Supply Investigation</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional distributors & wholesale stockists in Bengaluru (KAPL, Micro Labs, MedPlus)
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerTinyFish}
                disabled={isInvestigating}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isInvestigating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Investigating Bengaluru Web...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Investigate External Supply</span>
                  </>
                )}
              </button>
            </div>

            {/* When Investigation Completed */}
            {investigationData ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Status: Completed ({investigationData.investigation.evidence_count} Verified Suppliers Found)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTraceLogs(!showTraceLogs)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showTraceLogs ? 'Hide investigation details' : 'View investigation details'}</span>
                    {showTraceLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Collapsible Trace Logs */}
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

                {/* Verified Source Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investigationData.investigation.evidence.slice(0, 4).map((ev: TinyFishEvidence) => (
                    <div key={ev.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:border-slate-300 transition flex flex-col justify-between">
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
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </p>

                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-2.5 italic leading-relaxed">
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
            ) : (
              <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  {searchResult.is_internal_stock_sufficient
                    ? 'Internal PHC stock across the network is currently sufficient. External commercial procurement is optional.'
                    : 'Internal supply is insufficient for the requested quantity. Click "Investigate External Supply" to discover verified Bengaluru distributors.'}
                </span>
                {!searchResult.is_internal_stock_sufficient && (
                  <button
                    onClick={handleTriggerTinyFish}
                    className="ml-3 px-3 py-1 bg-teal-600 text-white rounded text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Investigate Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Local Facility Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current PHC Inventory (10 Monitored Medicines)</h3>
            <p className="text-xs text-slate-500">Tracked stock at {phc?.name}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Medicine Name</th>
                <th className="px-3 py-2.5">Stock</th>
                <th className="px-3 py-2.5">Daily Burn</th>
                <th className="px-3 py-2.5">Runway</th>
                <th className="px-3 py-2.5">Risk</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{item.medicine_name}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{item.current_stock} {item.unit}</td>
                  <td className="px-3 py-2.5 text-slate-600">{item.daily_consumption}/day</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{item.predicted_days_left}d</td>
                  <td className="px-3 py-2.5">
                    <RiskBadge level={item.stockout_risk} />
                  </td>
                  <td className="px-3 py-2.5 text-right space-x-1.5">
                    <button
                      onClick={() => {
                        setMedicineQuery(item.medicine_name);
                        handleSearch(item.medicine_name);
                      }}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-[11px] font-semibold transition cursor-pointer"
                    >
                      Find Network
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMed(item);
                        setConsumeQty(item.daily_consumption || 10);
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

      {/* Quick Dispense Modal */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-slate-900">Dispense {selectedMed.medicine_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Record patient consumption at {phc?.name}</p>

            {dispenseSuccess ? (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{dispenseSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleDispense} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Dispensed:</label>
                  <input
                    type="number"
                    min="1"
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Note (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Outpatient prescription"
                    value={consumeNotes}
                    onChange={(e) => setConsumeNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedMed(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDispensing}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold"
                  >
                    {isDispensing ? 'Recording...' : 'Dispense'}
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
