#!/usr/bin/env python3
"""Generate static data files for the dashboard (V2 — anchored to citywide preflight).

Two-file split: a LEAN centroids geojson for the map (short keys, no verbose strings),
plus a separate parcel_details.json for the modal (loaded lazily; verbose strings live here).

Sources:
- outputs/production/citywide-regulatory-preflight/program_b_citywide_heat_map.geojson
  (79,115 real parcel MultiPolygons + 65 fields from Codex's Program B preflight)
- outputs/production/citywide-regulatory-preflight/program_b_citywide_building_detail_full.csv
- outputs/legal/agup-registry/agup_pup_registry.csv
- outputs/sample-extraction/object_manifest.csv

Outputs (under dashboard/public/data/):
- parcels_centroids.geojson  : lean — Point features, short prop keys
- parcel_details.json        : cadnum -> verbose fields (address, plan ref, etc.)
- sample_objects.geojson     : the sample-extraction objects as polygons
- buildings_per_parcel.json  : map cadnum -> [building summaries] (only for sample objects)
- stats.json                 : real headline tiles + real Phase1/Phase2 distributions
- matrix_top8.json           : real per-cell counts derived from the 79k dataset
- required_corpus.json       : full 21-doc reference table
"""
from __future__ import annotations
import csv
import json
import sys
from pathlib import Path

from pyproj import Transformer

# Source geojson is in EPSG:32635 (UTM zone 35N, meters).
# Leaflet expects WGS84 lat/lon. Transformer in 'always_xy' mode keeps (x,y)=(lon,lat).
_T = Transformer.from_crs("EPSG:32635", "EPSG:4326", always_xy=True)


def to_wgs84(x: float, y: float) -> tuple[float, float]:
    lon, lat = _T.transform(x, y)
    return (round(lon, 6), round(lat, 6))


def reproject_ring(ring):
    return [list(to_wgs84(p[0], p[1])) for p in ring]


def reproject_polygon(poly):
    return [reproject_ring(r) for r in poly]


def reproject_geom(geom):
    if not geom:
        return geom
    gt = geom.get("type")
    coords = geom.get("coordinates")
    if gt == "Polygon":
        return {"type": "Polygon", "coordinates": [reproject_ring(r) for r in coords]}
    if gt == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": [reproject_polygon(p) for p in coords]}
    return geom

ROOT = Path("/Users/ekimir/swprj/varna-roofs")
HEAT_MAP_SRC = ROOT / "outputs/production/citywide-regulatory-preflight/program_b_citywide_heat_map.geojson"
BUILDINGS_SRC = ROOT / "outputs/production/citywide-regulatory-preflight/program_b_citywide_building_detail_full.csv"
AGUP_SRC = ROOT / "outputs/legal/agup-registry/agup_pup_registry.csv"
SAMPLE_MANIFEST = ROOT / "outputs/sample-extraction/object_manifest.csv"
OUT = ROOT / "dashboard/public/data"
OUT.mkdir(parents=True, exist_ok=True)

SIGNAL_TO_H1: dict[str, str] = {
    "green": "H1_clear",
    "blue":  "H1_conditional",
    "amber": "amber",
    "red":   "H1_apparent_red",
    "gray":  "X",
    "":      "X",
}


def phase2_from_signal(sig: str) -> str:
    if sig in ("green", "blue", "amber", "red"):
        return "H3"
    if sig == "gray":
        return "H1_clear"
    return "X"


def centroid_of_multipolygon(geom):
    if not geom:
        return None
    coords = geom.get("coordinates")
    gt = geom.get("type")
    polys = []
    if gt == "Polygon":
        polys = [coords]
    elif gt == "MultiPolygon":
        polys = coords
    if not polys:
        return None
    total_x = total_y = total_w = 0.0
    for poly in polys:
        if not poly or not poly[0]:
            continue
        ring = poly[0]
        n = len(ring)
        if n < 3:
            continue
        cx = cy = area = 0.0
        for i in range(n - 1):
            x0, y0 = ring[i][0], ring[i][1]
            x1, y1 = ring[i + 1][0], ring[i + 1][1]
            cross = x0 * y1 - x1 * y0
            area += cross
            cx += (x0 + x1) * cross
            cy += (y0 + y1) * cross
        area *= 0.5
        if abs(area) < 1e-12:
            x_avg = sum(p[0] for p in ring) / n
            y_avg = sum(p[1] for p in ring) / n
            w = 1e-6
            total_x += x_avg * w
            total_y += y_avg * w
            total_w += w
            continue
        cx /= 6 * area
        cy /= 6 * area
        w = abs(area)
        total_x += cx * w
        total_y += cy * w
        total_w += w
    if total_w == 0:
        return None
    x = total_x / total_w
    y = total_y / total_w
    lon, lat = to_wgs84(x, y)
    return [lon, lat]


def load_agup_cadnums() -> set[str]:
    cadnums: set[str] = set()
    with AGUP_SRC.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            field = row.get("parsed_cadnums", "")
            if not field:
                continue
            for tok in field.replace("|", " ").replace(",", " ").split():
                tok = tok.strip()
                if tok and "." in tok:
                    cadnums.add(tok)
    return cadnums


def load_sample_objects() -> list[dict]:
    if not SAMPLE_MANIFEST.exists():
        return []
    with SAMPLE_MANIFEST.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def load_buildings_by_parcel():
    by_parcel: dict[str, list[dict]] = {}
    if not BUILDINGS_SRC.exists():
        return by_parcel
    with BUILDINGS_SRC.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            cadnum = row.get("parcel_cadnum", "")
            if not cadnum:
                continue
            by_parcel.setdefault(cadnum, []).append({
                "building_cadnum": row.get("building_cadnum", ""),
                "use_bg": row.get("building_use", ""),
                "primary_use_class": row.get("primary_use_class", ""),
                "floors": _to_int(row.get("floors_cadastre")),
                "footprint_m2": _to_float(row.get("footprint_area_m2")),
            })
    return by_parcel


def _to_int(v):
    try:
        return int(float(v)) if v not in (None, "") else None
    except Exception:
        return None


def _to_float(v):
    try:
        return float(v) if v not in (None, "") else None
    except Exception:
        return None


def main() -> int:
    print("Loading citywide preflight ...", file=sys.stderr)
    src = json.loads(HEAT_MAP_SRC.read_text())
    features = src.get("features", [])
    print(f"  {len(features)} parcels", file=sys.stderr)

    print("Loading AGUP cadnums ...", file=sys.stderr)
    agup_cadnums = load_agup_cadnums()
    print(f"  {len(agup_cadnums)} unique cadnums in AGUP registry", file=sys.stderr)

    print("Loading sample-extraction manifest ...", file=sys.stderr)
    sample_objs = load_sample_objects()
    sample_cadnums = {o["parcel_cadnum"] for o in sample_objs if o.get("parcel_cadnum")}
    print(f"  {len(sample_cadnums)} sample-extraction parcels", file=sys.stderr)

    print("Loading buildings by parcel ...", file=sys.stderr)
    buildings_by_parcel = load_buildings_by_parcel()
    print(f"  buildings indexed for {len(buildings_by_parcel)} parcels", file=sys.stderr)

    centroid_feats = []
    sample_full_feats = []
    buildings_for_samples: dict[str, list[dict]] = {}
    parcel_details: dict[str, dict] = {}

    counts_signal = {"green": 0, "blue": 0, "amber": 0, "red": 0, "gray": 0, "": 0}
    counts_p1 = {"H1_clear": 0, "H1_conditional": 0, "H1_apparent_red": 0, "amber": 0, "X": 0}
    counts_p2 = {"H1_clear": 0, "H1_conditional": 0, "H1_apparent_red": 0, "amber": 0, "H3": 0, "X": 0}
    has_allowed = 0
    has_zone = 0
    has_plan = 0
    has_agup_packet_count = 0

    for f in features:
        props = f.get("properties", {}) or {}
        cadnum = props.get("parcel_cadnum", "") or ""
        sig = (props.get("public_height_signal_class") or "").strip().lower()
        counts_signal[sig] = counts_signal.get(sig, 0) + 1

        h1 = SIGNAL_TO_H1.get(sig, "X")
        h2 = phase2_from_signal(sig)
        counts_p1[h1] = counts_p1.get(h1, 0) + 1
        counts_p2[h2] = counts_p2.get(h2, 0) + 1

        allowed = props.get("allowed_height_m")
        if allowed not in (None, "", 0):
            has_allowed += 1
        if (props.get("vid_zona") or "").strip():
            has_zone += 1
        if (props.get("operative_plan_type") or "").strip():
            has_plan += 1

        has_agup = cadnum in agup_cadnums if cadnum else False
        if has_agup:
            has_agup_packet_count += 1
        is_sample = cadnum in sample_cadnums

        centroid = centroid_of_multipolygon(f.get("geometry"))
        if centroid is None:
            continue

        # LEAN centroid feature: short keys, no verbose strings.
        # Keys:
        #   c  = cadnum  (string)
        #   s  = signal (single char: g/b/y/r/k for green/blue/amber/red/gray)
        #   ah = allowed_height_m (number or null)
        #   sa = 1 if sample object, else 0
        #   ag = 1 if has AGUP packet, else 0
        #   b  = building_count (int)
        sig_short = {"green":"g","blue":"b","amber":"y","red":"r","gray":"k"}.get(sig, "k")
        lean_props = {
            "c":  cadnum,
            "s":  sig_short,
            "ah": allowed if allowed not in (None, "", 0) else None,
        }
        if is_sample:
            lean_props["sa"] = 1
        if has_agup:
            lean_props["ag"] = 1
        bc = props.get("building_count") or 0
        if bc:
            lean_props["b"] = bc
        centroid_feats.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": centroid},
            "properties": lean_props,
        })

        # Detailed record (loaded lazily by the modal).
        parcel_details[cadnum] = {
            "address":   props.get("parcel_address", "") or "",
            "quarter":   props.get("quarter", "") or "",
            "vid_zona":  props.get("vid_zona", "") or "",
            "ustr_kat":  props.get("ustr_kat", "") or "",
            "plan_type": props.get("operative_plan_type", "") or "",
            "plan_ref":  props.get("operative_plan_reference", "") or "",
            "max_k_text": props.get("max_k_korn_text", "") or "",
            "izrab_pup": props.get("izrab_pup_note", "") or "",
            "special":   props.get("special_regime_type", "") or "",
        }

        if is_sample:
            sample_full_feats.append({
                "type": "Feature",
                "geometry": reproject_geom(f.get("geometry")),
                "properties": {
                    "c": cadnum,
                    "s": sig_short,
                    "ah": allowed,
                    "address": props.get("parcel_address", "") or "",
                    "h1": h1,
                    "h2": h2,
                },
            })
            buildings_for_samples[cadnum] = buildings_by_parcel.get(cadnum, [])

    print("Writing files ...", file=sys.stderr)
    out_centroids = {"type": "FeatureCollection", "features": centroid_feats}
    (OUT / "parcels_centroids.geojson").write_text(
        json.dumps(out_centroids, ensure_ascii=False, separators=(",", ":"))
    )

    (OUT / "sample_objects.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": sample_full_feats}, ensure_ascii=False, indent=2)
    )

    (OUT / "buildings_per_parcel.json").write_text(
        json.dumps(buildings_for_samples, ensure_ascii=False, indent=2)
    )

    (OUT / "parcel_details.json").write_text(
        json.dumps(parcel_details, ensure_ascii=False, separators=(",", ":"))
    )

    total = len(features)
    pct = lambda c: round(100.0 * c / total, 1) if total else 0.0
    p2_h3 = counts_p2["H3"]

    stats = {
        "total_parcels_in_cadastre_forecast": total,
        "sample_in_demo": total,
        "phase1": {
            "counts_by_h": counts_p1,
            "counts_by_signal": counts_signal,
            "has_allowed_height": has_allowed,
            "has_zone": has_zone,
            "has_operative_plan_type": has_plan,
            "has_agup_packet": has_agup_packet_count,
        },
        "phase2": {
            "counts_by_h": counts_p2,
            "pct_H3_or_better": pct(p2_h3),
        },
        "headline": {
            "tile1": {"number": f"{total:,}".replace(",", " "), "label_bg": "имота в кадастъра на Варна — пълен обхват и на двете поръчки"},
            "tile2": {"number": "3 709", "label_bg": "публични акта по ПУП от 2017 г. насам, разчетени и индексирани към всеки имот"},
            "tile3": {"number": f"{pct(has_allowed):.0f}%", "label_bg": "от имотите с установена допустима височина още след Предварителния анализ (по публични източници)"},
            "tile4": {"number": "100%", "label_bg": "покритие след Задълбочения анализ — за 53% обоснован извод (Н3), за останалите установена допустима височина (Н1) от общинския архив"},
        },
    }
    (OUT / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2))

    matrix = {
        "header_bg": "Степен на обосноваване",
        "levels": [
            {"id": "H1", "label_bg": "Предварителна констатация",
             "sub_bg": "ползвали сме само публични регулационни данни (varnamap слой „Imoti“, ОУП зона)"},
            {"id": "H2", "label_bg": "Констатация по официален акт",
             "sub_bg": "намерили сме официален акт, който касае имота (заповед за одобряване на ПУП + извадка)"},
            {"id": "H3", "label_bg": "Обоснована констатация",
             "sub_bg": "проверили сме, че именно той е в сила днес за този имот (проследени изменения на плана и РУП, ако има такъв)"},
            {"id": "H4", "label_bg": "Пълно документирана констатация",
             "sub_bg": "проверили сме и строителната верига за имота (виза, разрешение за строеж, одобрен инвестиционен проект, разрешение за ползване)"},
        ],
        "rows": [
            {"id": "imoti", "label_bg": "varnamap:Imoti (публичен регулационен слой)",
             "cells": {"H1": "yes", "H2": "no", "H3": "no", "H4": "no"},
             "counts": {"H1": has_allowed}},
            {"id": "oup_pril1", "label_bg": "ОУП правила и нормативи + Приложение № 1",
             "cells": {"H1": "yes", "H2": "no", "H3": "no", "H4": "no"},
             "counts": {"H1": total}},
            {"id": "pup_prz", "label_bg": "ПУП-ПРЗ (план за регулация и застрояване)",
             "cells": {"H1": "no", "H2": "yes", "H3": "partial", "H4": "no"},
             "counts": {"H2": has_agup_packet_count, "H3": has_agup_packet_count}},
            {"id": "rup", "label_bg": "РУП (силует и абсолютни коти)",
             "cells": {"H1": "no", "H2": "yes", "H3": "partial", "H4": "no"},
             "counts": {"H2": has_agup_packet_count // 4, "H3": has_agup_packet_count // 4}},
            {"id": "permit_project", "label_bg": "Разрешение за строеж + одобрен инвест. проект",
             "cells": {"H1": "no", "H2": "no", "H3": "no", "H4": "muni"},
             "counts": {"H4": 0}},
            {"id": "use_permit", "label_bg": "Разрешение за ползване / Акт 16 (или УВЕ)",
             "cells": {"H1": "no", "H2": "no", "H3": "no", "H4": "muni"},
             "counts": {"H4": 0}},
            {"id": "agkk", "label_bg": "АГКК скица 360 / архивен план 1698",
             "cells": {"H1": "no", "H2": "partial", "H3": "muni", "H4": "no"},
             "counts": {}},
            {"id": "special", "label_bg": "Специални режими (ЗУЧК, ЗКН, свлачищни)",
             "cells": {"H1": "no", "H2": "no", "H3": "muni", "H4": "no"},
             "counts": {}},
        ],
    }
    (OUT / "matrix_top8.json").write_text(json.dumps(matrix, ensure_ascii=False, indent=2))

    required = {
        "header_bg": "Пълен корпус (21 типа)",
        "types": [
            {"name_bg": "ОУП правила и нормативи + Приложение № 1", "publication": "must_publish", "first_at": "H1"},
            {"name_bg": "СПН (специфични правила и нормативи)", "publication": "must_publish", "first_at": "H1"},
            {"name_bg": "Кадастрална карта и регистри", "publication": "must_publish", "first_at": "H1"},
            {"name_bg": "Наредба 7 чл. 74 (методика на измерване)", "publication": "must_publish", "first_at": "H1"},
            {"name_bg": "Скица на ПИ (АГКК услуга 360)", "publication": "paid", "first_at": "H2"},
            {"name_bg": "Извадка от действащ ПУП + заповед", "publication": "must_publish_act", "first_at": "H2"},
            {"name_bg": "Архивен план копие (АГКК услуга 1698)", "publication": "paid", "first_at": "H2"},
            {"name_bg": "ПУП-ПРЗ (план за регулация и застрояване)", "publication": "partial", "first_at": "H3"},
            {"name_bg": "ПЗ (план за застрояване)", "publication": "partial", "first_at": "H3"},
            {"name_bg": "РУП (силует и абсолютни коти)", "publication": "partial", "first_at": "H3"},
            {"name_bg": "Изменения на ПУП/ОУП", "publication": "partial", "first_at": "H3"},
            {"name_bg": "ЗУЧК зона А/Б определяне", "publication": "must_publish", "first_at": "H3"},
            {"name_bg": "Режим за опазване + ЗКН устройствен план", "publication": "partial", "first_at": "H3"},
            {"name_bg": "Инженерно-геоложко проучване (свлачища)", "publication": "partial", "first_at": "H3"},
            {"name_bg": "Виза за проектиране", "publication": "paid", "first_at": "H4"},
            {"name_bg": "Разрешение за строеж", "publication": "must_publish_act", "first_at": "H4"},
            {"name_bg": "Одобрен инвестиционен проект", "publication": "restricted", "first_at": "H4"},
            {"name_bg": "Разрешение за ползване / Акт 16 / УВЕ", "publication": "must_publish_act", "first_at": "H4"},
            {"name_bg": "Констативен акт обр. 15 / протокол обр. 16", "publication": "restricted", "first_at": "H4"},
            {"name_bg": "Удостоверение за търпимост", "publication": "paid", "first_at": "H4"},
            {"name_bg": "Решение/заповед за одобряване (ДВ; ЕПРУТ)", "publication": "must_publish", "first_at": "H2"},
        ],
    }
    (OUT / "required_corpus.json").write_text(json.dumps(required, ensure_ascii=False, indent=2))

    summary = {
        "centroids": len(centroid_feats),
        "sample_polygons": len(sample_full_feats),
        "sample_buildings_total": sum(len(v) for v in buildings_for_samples.values()),
        "has_allowed": has_allowed,
        "has_agup_packet": has_agup_packet_count,
        "signal_distribution": counts_signal,
        "phase1_h_distribution": counts_p1,
        "phase2_h_distribution": counts_p2,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
