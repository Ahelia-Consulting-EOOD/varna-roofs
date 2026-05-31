// V2 schema — anchored to citywide preflight + lean centroids.

export type LevelId = "H1" | "H2" | "H3" | "H4" | "X";

// Codex's public_height_signal_class (short codes used in centroids)
export type SignalShort = "g" | "b" | "y" | "r" | "k";  // green/blue/amber/red/gray

export type CellState = "yes" | "no" | "partial" | "muni";

export interface LevelDef {
  id: LevelId;
  label_bg: string;
  sub_bg: string;
}

export interface MatrixRow {
  id: string;
  label_bg: string;
  cells: Record<string, CellState>;
  counts?: Record<string, number>;
}

export interface MatrixData {
  header_bg: string;
  levels: LevelDef[];
  rows: MatrixRow[];
}

// Lean centroid feature properties (short keys).
export interface CentroidProps {
  c: string;          // cadnum
  s: SignalShort;     // signal class
  ah?: number | null; // allowed_height_m (when known)
  sa?: 1;             // is sample-extraction object
  ag?: 1;             // has AGUP packet
  b?: number;         // building count
}

export interface CentroidsGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: CentroidProps;
  }>;
}

// Verbose per-parcel details, loaded lazily.
export interface ParcelDetail {
  address?: string;
  quarter?: string;
  vid_zona?: string;
  ustr_kat?: string;
  plan_type?: string;
  plan_ref?: string;
  max_k_text?: string;
  izrab_pup?: string;
  special?: string;
}

export type ParcelDetailsIndex = Record<string, ParcelDetail>;

export interface BuildingSummary {
  building_cadnum: string;
  use_bg: string;
  primary_use_class: string;
  floors: number | null;
  footprint_m2: number | null;
}

export type BuildingsByParcel = Record<string, BuildingSummary[]>;

export interface HeadlineTile {
  number: string;
  label_bg: string;
}

export interface StatsPhase1 {
  counts_by_h: Record<string, number>;
  counts_by_signal: Record<string, number>;
  has_allowed_height: number;
  has_zone: number;
  has_operative_plan_type: number;
  has_agup_packet: number;
}

export interface StatsPhase2 {
  counts_by_h: Record<string, number>;
  pct_H3_or_better: number;
}

export interface StatsData {
  total_parcels_in_cadastre_forecast: number;
  sample_in_demo: number;
  phase1: StatsPhase1;
  phase2: StatsPhase2;
  headline: { tile1: HeadlineTile; tile2: HeadlineTile; tile3: HeadlineTile; tile4: HeadlineTile };
}

export type PublicationClass = "must_publish" | "must_publish_act" | "paid" | "partial" | "restricted";

export interface RequiredCorpusEntry {
  name_bg: string;
  publication: PublicationClass;
  first_at: LevelId;
}

export interface RequiredCorpusData {
  header_bg: string;
  types: RequiredCorpusEntry[];
}

export type Phase = "phase1" | "phase2";
