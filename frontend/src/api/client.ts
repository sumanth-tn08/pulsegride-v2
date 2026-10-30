import {
  Zone,
  PHC,
  Medicine,
  PHCMedicineStock,
  BedOccupancy,
  OperationalEvent,
  ActionApproval,
  NetworkOverview,
  NearbySearchResponse
} from '../types';

const envApi = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE = (envApi ? envApi.replace(/\/$/, '') : '') + '/api';

export async function fetchZones(): Promise<Zone[]> {
  const res = await fetch(`${API_BASE}/zones`);
  return res.json();
}

export async function fetchPHCs(zoneId?: string): Promise<PHC[]> {
  const url = zoneId ? `${API_BASE}/phcs?zone_id=${zoneId}` : `${API_BASE}/phcs`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchPHC(phcId: string): Promise<PHC> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}`);
  if (!res.ok) throw new Error('PHC not found');
  return res.json();
}

export async function fetchMedicines(): Promise<Medicine[]> {
  const res = await fetch(`${API_BASE}/medicines`);
  return res.json();
}

export async function fetchPHCMedicines(phcId: string): Promise<PHCMedicineStock[]> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/medicines`);
  return res.json();
}

export async function fetchPHCBeds(phcId: string): Promise<BedOccupancy> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/beds`);
  return res.json();
}

export async function consumeMedicine(phcId: string, medicineId: string, quantity: number, notes = ''): Promise<any> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/medicines/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicine_id: medicineId, consumed_quantity: quantity, notes })
  });
  return res.json();
}

export async function admitBed(phcId: string, count = 1, ward = 'General Acute'): Promise<any> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/beds/admit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, ward })
  });
  return res.json();
}

export async function dischargeBed(phcId: string, count = 1): Promise<any> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/beds/discharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  });
  return res.json();
}

export async function reportShortage(phcId: string, medicineId: string, reason = ''): Promise<any> {
  const res = await fetch(`${API_BASE}/phcs/${phcId}/shortage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicine_id: medicineId, reason })
  });
  return res.json();
}

export async function searchNearbyMedicines(phcId: string, medicine: string, zoneOnly = false, quantity = 100): Promise<NearbySearchResponse> {
  const url = `${API_BASE}/phcs/${phcId}/nearby-medicines?medicine=${encodeURIComponent(medicine)}&zone_only=${zoneOnly}&quantity=${quantity}`;
  const res = await fetch(url);
  return res.json();
}

export async function transcribeVoiceAudio(audioBlob: Blob): Promise<{ transcription: string; model: string }> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  const res = await fetch(`${API_BASE}/voice/transcribe`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function sendAIChat(phcId: string | null, query: string, context?: any): Promise<{ reply: string; model: string; structured?: any; detected_medicine?: string }> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phc_id: phcId, query, context })
  });
  return res.json();
}

export async function fetchAdminOverview(): Promise<NetworkOverview> {
  const res = await fetch(`${API_BASE}/admin/overview`);
  return res.json();
}

export async function fetchAdminPredictions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/predictions`);
  return res.json();
}

export async function fetchEvents(phcId?: string, limit = 30): Promise<OperationalEvent[]> {
  const url = phcId ? `${API_BASE}/events?phc_id=${phcId}&limit=${limit}` : `${API_BASE}/events?limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAdminAIAnalysis(): Promise<{ analysis: string; model: string; structured?: any }> {
  const res = await fetch(`${API_BASE}/admin/ai-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return res.json();
}

export async function runTinyFishInvestigation(phcId: string, medicineName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/investigation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phc_id: phcId, medicine_name: medicineName, location: 'Bengaluru, Karnataka, India' })
  });
  return res.json();
}

export async function fetchApprovals(): Promise<ActionApproval[]> {
  const res = await fetch(`${API_BASE}/approvals`);
  return res.json();
}

export async function reviewApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', reviewerName = 'Bengaluru Health Administrator'): Promise<any> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reviewer_name: reviewerName })
  });
  return res.json();
}

export async function fetchLiveStatus(): Promise<{ live_operations_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/live-status`);
  return res.json();
}

export async function toggleLiveOperations(enabled: boolean): Promise<{ live_operations_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/live-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  return res.json();
}

