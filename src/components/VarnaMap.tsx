import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON } from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { useMemo } from "react";
import type { CentroidsGeoJSON, CentroidProps, Phase, SignalShort } from "../types";
import { signalColor, phase2Color, signalLabel, phase2Label } from "../lib/colors";
import "./VarnaMap.css";

interface Props {
  centroids: CentroidsGeoJSON;
  sampleObjects: GeoJSON.FeatureCollection;
  phase: Phase;
  onParcelClick: (p: CentroidProps) => void;
}

// Bounds derived from the actual citywide preflight extent (WGS84):
// 43.10–43.31 N, 27.74–28.36 E (covers Варна and Greater Varna).
const VARNA_BOUNDS: LatLngBoundsExpression = [
  [43.10, 27.74],
  [43.31, 28.36],
];

export function VarnaMap({ centroids, sampleObjects, phase, onParcelClick }: Props) {
  const colorFor = phase === "phase1" ? signalColor : phase2Color;

  // Canvas renderer is critical — SVG with 79k markers would freeze the browser.
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  return (
    <div className="varna-map-wrap">
      <MapContainer
        bounds={VARNA_BOUNDS}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="varna-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* All 79k parcel centroids as canvas circles */}
        {centroids.features.map((f, i) => {
          const props = f.properties;
          const [lon, lat] = f.geometry.coordinates;
          const sig = props.s as SignalShort;
          const isSample = props.sa === 1;
          return (
            <CircleMarker
              key={i}
              center={[lat, lon]}
              radius={isSample ? 7 : 3}
              pathOptions={{
                color: isSample ? "#1f2a1f" : colorFor[sig],
                weight: isSample ? 2 : 0.5,
                fillColor: colorFor[sig],
                fillOpacity: isSample ? 0.95 : 0.7,
              }}
              renderer={canvasRenderer}
              eventHandlers={{
                click: () => onParcelClick(props),
              }}
            >
              {(isSample) && (
                <Tooltip direction="top" sticky>
                  <div style={{ fontSize: 11 }}>
                    <strong>{props.c}</strong>
                    <br />
                    <span style={{ color: "#666" }}>имот от представителната извадка</span>
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}

        {/* Outline the sample-object polygons (for spatial context on top of the dot) */}
        <GeoJSON
          key={`samples-${phase}`}
          data={sampleObjects as any}
          style={() => ({
            color: "#1f2a1f",
            weight: 1.5,
            fillColor: "#1f2a1f",
            fillOpacity: 0.05,
            dashArray: "3 3",
          })}
        />

        <Legend phase={phase} />
        <ProvenanceOverlay phase={phase} />
      </MapContainer>
    </div>
  );
}

function Legend({ phase }: { phase: Phase }) {
  const colors = phase === "phase1" ? signalColor : phase2Color;
  const labels = phase === "phase1" ? signalLabel : phase2Label;
  const order: SignalShort[] = phase === "phase1" ? ["g", "b", "y", "r", "k"] : ["g", "k"];
  return (
    <div className="varna-legend leaflet-control" aria-label="Легенда">
      <div className="lbl">{phase === "phase1" ? "Очакван резултат · Предварителен анализ" : "Очакван резултат · Задълбочен анализ"}</div>
      {order.map((id) => (
        <div key={id} className="legend-row">
          <span className="legend-swatch" style={{ background: colors[id] }} />
          <span style={{ flex: 1 }}>{labels[id]}</span>
        </div>
      ))}
      <div className="legend-divider"></div>
      <div className="legend-row">
        <span className="legend-swatch" style={{ background: "#1f2a1f", border: "2px solid #1f2a1f" }} />
        <span>Имот от представителната извадка (10 имота)</span>
      </div>
    </div>
  );
}

function ProvenanceOverlay({ phase }: { phase: Phase }) {
  return (
    <div className="varna-provenance leaflet-control">
      <div className="lbl">
        {phase === "phase1" ? "Очаквани резултати · Предварителен анализ" : "Очаквани резултати · Задълбочен анализ"}
      </div>
      {phase === "phase1" ? (
        <p>
          Всичките <strong>79 115 имота</strong> от кадастъра на Варна, оцветени в зависимост от очаквания
          резултат след Предварителния анализ — по публично достъпните регулационни и устройствени
          документи (varnamap, Общия устройствен план — ОУП, и публичния архив на дирекция
          „Архитектура, градоустройство и устройствено планиране“ — АГУП).
        </p>
      ) : (
        <p>
          Очаквано покритие след Задълбочения анализ с <strong>архивите на общината</strong>: действащ
          Подробен устройствен план (ПУП) или Работен устройствен план (РУП) и историята на неговите
          изменения дават обоснован извод (Н3) за по-голямата част от имотите; за тези без публично
          достъпна височина — вашият план установява допустимата височина (Н1).
        </p>
      )}
    </div>
  );
}
