import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData } from "./useDashboardData";

const makeFetch = () =>
  vi.fn((url: string) => {
    const body =
      url.endsWith("parcels_centroids.geojson") ? { type: "FeatureCollection", features: [] }
      : url.endsWith("matrix_top8.json") ? { header_bg: "x", levels: [], rows: [] }
      : url.endsWith("stats.json") ? {
          total_parcels_in_cadastre_forecast: 1,
          sample_in_demo: 0,
          phase1: { counts_by_h: {}, counts_by_signal: {}, has_allowed_height: 0, has_zone: 0, has_operative_plan_type: 0, has_agup_packet: 0 },
          phase2: { counts_by_h: {}, pct_H3_or_better: 0 },
          headline: { tile1: { number: "1", label_bg: "a" }, tile2: { number: "2", label_bg: "b" }, tile3: { number: "3", label_bg: "c" }, tile4: { number: "4", label_bg: "d" } },
        }
      : url.endsWith("sample_objects.geojson") ? { type: "FeatureCollection", features: [] }
      : url.endsWith("buildings_per_parcel.json") ? {}
      : { header_bg: "x", types: [] };
    return Promise.resolve({ json: () => Promise.resolve(body) } as Response);
  });

describe("useDashboardData", () => {
  afterEach(() => { vi.restoreAllMocks(); });
  it("loads centroids+stats+matrix+required+samples+buildings", async () => {
    vi.stubGlobal("fetch", makeFetch());
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.centroids.features).toEqual([]);
    expect(result.current.data?.matrix.rows).toEqual([]);
    expect(result.current.data?.sampleObjects.features).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
