import { useEffect, useState, useRef } from "react";
import type {
  CentroidsGeoJSON,
  MatrixData,
  StatsData,
  RequiredCorpusData,
  ParcelDetailsIndex,
  BuildingsByParcel,
} from "../types";

export interface DashboardData {
  centroids: CentroidsGeoJSON;
  matrix: MatrixData;
  stats: StatsData;
  requiredCorpus: RequiredCorpusData;
  sampleObjects: GeoJSON.FeatureCollection;
  buildingsByParcel: BuildingsByParcel;
}

// Honor Vite's BASE_URL so the dashboard works both at "/" (local preview) and
// under a subpath like "/varna-roofs/" on GitHub Pages.
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const dataUrl = (name: string) => `${BASE}/data/${name}`;

export function useDashboardData(): { data: DashboardData | null; error: string | null } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([
      fetch(dataUrl("parcels_centroids.geojson")).then((r) => r.json()),
      fetch(dataUrl("matrix_top8.json")).then((r) => r.json()),
      fetch(dataUrl("stats.json")).then((r) => r.json()),
      fetch(dataUrl("required_corpus.json")).then((r) => r.json()),
      fetch(dataUrl("sample_objects.geojson")).then((r) => r.json()),
      fetch(dataUrl("buildings_per_parcel.json")).then((r) => r.json()),
    ])
      .then(([centroids, matrix, stats, requiredCorpus, sampleObjects, buildingsByParcel]) =>
        setData({ centroids, matrix, stats, requiredCorpus, sampleObjects, buildingsByParcel })
      )
      .catch((e) => setError(String(e)));
  }, []);
  return { data, error };
}

let detailsPromise: Promise<ParcelDetailsIndex> | null = null;

export function loadParcelDetails(): Promise<ParcelDetailsIndex> {
  if (!detailsPromise) {
    detailsPromise = fetch(dataUrl("parcel_details.json")).then((r) => r.json());
  }
  return detailsPromise;
}

// Convenience hook: lazily resolves the details index after first paint.
export function useParcelDetails(): ParcelDetailsIndex | null {
  const [details, setDetails] = useState<ParcelDetailsIndex | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // small delay so first paint isn't blocked
    const t = setTimeout(() => {
      loadParcelDetails().then(setDetails).catch(() => setDetails({}));
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return details;
}
