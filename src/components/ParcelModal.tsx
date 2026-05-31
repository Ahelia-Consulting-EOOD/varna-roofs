import type { CentroidProps, ParcelDetailsIndex, BuildingsByParcel, SignalShort } from "../types";
import { Modal } from "./Modal";
import { signalColor, signalLabel, phase2Color, phase2Label } from "../lib/colors";

interface Props {
  parcel: CentroidProps | null;
  details: ParcelDetailsIndex | null;
  buildingsByParcel: BuildingsByParcel;
  onClose: () => void;
}

export function ParcelModal({ parcel, details, buildingsByParcel, onClose }: Props) {
  if (!parcel) return null;
  const cad = parcel.c;
  const d = details?.[cad];
  const sig = parcel.s as SignalShort;
  const isSample = parcel.sa === 1;
  const buildings = isSample ? (buildingsByParcel[cad] || []) : [];

  return (
    <Modal open={!!parcel} onClose={onClose} title={`Имот ${cad}${isSample ? " — от представителната извадка" : ""}`}>
      <div style={{ display: "grid", gap: 14 }}>
        {d?.address ? <div className="kicker">{d.address}</div> : null}
        <div className="kicker">
          {d?.vid_zona ? <>Зона: <strong>{d.vid_zona}</strong></> : "Зона: неуказана"}
          {d?.ustr_kat ? <> · {d.ustr_kat}</> : null}
          {d?.quarter ? <> · кв. <strong>{d.quarter}</strong></> : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Tile
            phase="Предварителен анализ"
            color={signalColor[sig]}
            label={signalLabel[sig]}
            hint="По публично достъпни източници"
          />
          <Tile
            phase="Задълбочен анализ"
            color={phase2Color[sig]}
            label={phase2Label[sig]}
            hint="С архивите на общината"
          />
        </div>

        <div className="divider"></div>

        <div>
          <div className="lbl">Основа на оценката · Предварителен анализ</div>
          <ul style={{ paddingLeft: 18, margin: "6px 0 0", lineHeight: 1.55 }}>
            {parcel.ah ? (
              <li>Установена допустима височина: <strong>{parcel.ah} м</strong>
                {d?.max_k_text ? <> (от регулационния слой varnamap, записът „{d.max_k_text}“)</> : null}
              </li>
            ) : (
              <li>В публично достъпните регулационни слоеве няма стойност за допустимата височина на този имот.</li>
            )}
            {d?.plan_type ? (
              <li>Тип на устройствения план: <strong>{d.plan_type}</strong>
                {d.plan_ref ? <>, реф.: {d.plan_ref}</> : null}
              </li>
            ) : null}
            {parcel.ag === 1 ? (
              <li>В публичния архив на АГУП има заповед за одобряване на ПУП, която касае този имот.</li>
            ) : (
              <li className="kicker">В публичния архив на АГУП (2017—) не е намерен акт, който касае директно този имот.</li>
            )}
            {d?.special ? <li>Специален режим: <strong>{d.special}</strong></li> : null}
          </ul>
        </div>

        <div>
          <div className="lbl">Какво се отключва · Задълбочен анализ</div>
          <p style={{ margin: "6px 0 0", lineHeight: 1.55 }}>
            {sig === "k" ? (
              <>За имот без публично достъпна височина, вашият архив на действащ ПУП установява допустимата височина — ниво Н1 или Н2.</>
            ) : (
              <>С вашия архив на действащ ПУП/РУП и проследени изменения се достига обоснован извод (ниво Н3) за този имот.</>
            )}
          </p>
        </div>

        {buildings.length > 0 ? (
          <>
            <div className="divider"></div>
            <div>
              <div className="lbl">Сгради на имота</div>
              <ul style={{ paddingLeft: 18, margin: "6px 0 0", lineHeight: 1.5 }}>
                {buildings.map((b, i) => (
                  <li key={i}>
                    {b.use_bg || "сграда"} ·{" "}
                    {b.floors != null ? <>етажност <strong>{b.floors}</strong></> : "етажност: неуказана"}
                    {b.footprint_m2 != null ? <> · площ {b.footprint_m2} м²</> : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {parcel.b && !buildings.length ? (
          <div className="kicker">{parcel.b} сгради на имота (детайлът е наличен само за имотите от представителната извадка).</div>
        ) : null}
      </div>
    </Modal>
  );
}

function Tile({ phase, color, label, hint }: { phase: string; color: string; label: string; hint: string }) {
  return (
    <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 6, padding: "12px 14px" }}>
      <div className="kicker">{phase} · {hint}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 6 }}>
        <span style={{ width: 14, height: 14, borderRadius: 50, background: color, marginTop: 3, flexShrink: 0 }} />
        <strong style={{ fontSize: 14, lineHeight: 1.35 }}>{label}</strong>
      </div>
    </div>
  );
}
