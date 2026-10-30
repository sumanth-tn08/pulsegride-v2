export interface Zone {
  id: string;
  name: string;
  description: string;
}

export interface PHC {
  id: string;
  name: string;
  zone_id: string;
  zone_name?: string;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  contact_phone?: string;
  total_beds?: number;
  occupied_beds?: number;
  available_beds?: number;
  occupancy_rate?: number;
  occupancy_trend?: 'RISING' | 'STABLE' | 'DECLINING';
  high_occupancy_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predicted_occupancy_7d?: number;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  unit: string;
  critical_threshold: number;
}

export interface PHCMedicineStock {
  id: string;
  phc_id: string;
  medicine_id: string;
  medicine_name: string;
  category: string;
  unit: string;
  critical_threshold: number;
  current_stock: number;
  daily_consumption: number;
  incoming_quantity: number;
  stockout_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predicted_days_left: number;
  last_updated: string;
}

export interface BedOccupancy {
  id: string;
  phc_id: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  occupancy_trend: 'RISING' | 'STABLE' | 'DECLINING';
  predicted_occupancy_7d: number;
  high_occupancy_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  last_updated: string;
}

export interface OperationalEvent {
  id: string;
  phc_id: string;
  phc_name?: string;
  zone_id?: string;
  event_type: 'medicine_consumed' | 'medicine_received' | 'patient_admitted' | 'patient_discharged' | 'shortage_detected' | 'emergency_spike';
  details: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
  formatted_title?: string;
  formatted_summary?: string;
  formatted_time?: string;
  facility_label?: string;
}

export interface TinyFishEvidence {
  id: string;
  source_name: string;
  source_category: string;
  url: string;
  location: string;
  contact_phone?: string;
  evidence_snippet: string;
  availability_status: string;
  estimated_available_units?: number;
  unit_cost_inr?: string;
  estimated_lead_time?: string;
  confidence_score: number;
  timestamp: string;
}

export interface ActionApproval {
  id: string;
  phc_id: string;
  phc_name?: string;
  zone_id?: string;
  action_type: 'EMERGENCY_TRANSFER' | 'EXTERNAL_PROCUREMENT' | 'REALLOCATION';
  medicine_name: string;
  source_name: string;
  target_name: string;
  quantity: number;
  ai_recommendation_summary: string;
  tinyfish_evidence: TinyFishEvidence[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface NetworkOverview {
  total_phcs: number;
  zones_count: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  network_occupancy_rate: number;
  high_risk_medicine_count: number;
  critical_stockouts: Array<{
    id: string;
    phc_id: string;
    phc_name: string;
    zone_id: string;
    medicine_name: string;
    current_stock: number;
    daily_consumption: number;
    stockout_risk: string;
    predicted_days_left: number;
  }>;
  high_occupancy_phcs: Array<{
    id: string;
    phc_id: string;
    phc_name: string;
    zone_id: string;
    total_beds: number;
    occupied_beds: number;
    occupancy_rate: number;
    occupancy_trend: string;
  }>;
  pending_approvals_count: number;
  live_operations_status: boolean;
}

export interface NearbySearchResultItem {
  phc_id: string;
  phc_name: string;
  zone_id: string;
  zone_name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  current_stock: number;
  daily_consumption: number;
  stockout_risk: string;
  predicted_days_left: number;
  distance_km: number;
  city: string;
  state: string;
  country: string;
  safe_local_buffer?: number;
  transferable_surplus?: number;
  has_sufficient_surplus?: boolean;
}

export interface NearbySearchResponse {
  medicine_id: string;
  medicine_name: string;
  origin_phc: string;
  origin_zone?: string;
  origin_stock?: any;
  total_phcs_checked: number;
  zone_available_stock: number;
  zone_transferable_surplus?: number;
  network_transferable_surplus?: number;
  transferable_surplus?: number;
  requested_quantity?: number;
  is_internal_stock_sufficient: boolean;
  same_zone_results?: NearbySearchResultItem[];
  other_zones_results?: NearbySearchResultItem[];
  results: NearbySearchResultItem[];
}

