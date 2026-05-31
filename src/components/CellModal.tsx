import type { MatrixRow, CellState, LevelId, LevelDef } from "../types";
import { Modal } from "./Modal";
import { cellSymbol, cellColor } from "../lib/colors";

interface Props {
  row: MatrixRow | null;
  levelId: LevelId | null;
  level: LevelDef | null;
  onClose: () => void;
}

const cellMeaning: Record<CellState, string> = {
  yes: "Този документ покрива това ниво по публичен достъп.",
  partial: "Документът съществува, но изисква обработка чрез разчитане от изображение.",
  muni: "Това ниво се отключва с вашия архив. Записът се намира при общината (Гл. архитект / ЕСУТ), но не е публикуван в работна форма.",
  no: "Не се прилага: този документ не носи параметри за това ниво.",
};

export function CellModal({ row, levelId, level, onClose }: Props) {
  if (!row || !levelId || !level) return null;
  const state = (row.cells[levelId] || "no") as CellState;
  return (
    <Modal open={!!row} onClose={onClose} title={`${row.label_bg} · ${levelId.replace("H", "Н")}`}>
      <div style={{ display: "grid", gap: 14 }}>
        <div className="kicker">{level.label_bg}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--c-bg)", borderRadius: 6, border: "1px solid var(--c-border)" }}>
          <span style={{ fontSize: 26, color: cellColor[state] }}>{cellSymbol[state]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{stateLabel(state)}</div>
            <div className="kicker">{cellMeaning[state]}</div>
          </div>
        </div>
        <div>
          <div className="lbl">Подоснова на нивото</div>
          <p style={{ margin: "6px 0 0" }}>{level.sub_bg}</p>
        </div>
        {state === "muni" && (
          <div style={{ background: "#eef4f8", border: "1px solid #c7dbe7", borderRadius: 6, padding: "12px 14px" }}>
            <div className="lbl" style={{ color: "var(--c-muni)" }}>Какво ни трябва от вас</div>
            <p style={{ margin: "6px 0 0" }}>Достъп до съответния запис от вашия архив (Гл. архитект / АГУП / ЕСУТ) — копие, цифров експорт или вътрешна процедура.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function stateLabel(s: CellState): string {
  return ({ yes: "Покрит публично", partial: "Частично покритие", muni: "Отключва се с ваши документи", no: "Не се прилага" }[s] || "—");
}
