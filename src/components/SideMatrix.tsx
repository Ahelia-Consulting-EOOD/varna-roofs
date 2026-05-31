import type { MatrixData, MatrixRow, LevelId, CellState } from "../types";
import { cellSymbol, cellColor } from "../lib/colors";
import "./SideMatrix.css";

interface Props {
  matrix: MatrixData;
  onCellClick: (row: MatrixRow, levelId: LevelId) => void;
  onShowAll: () => void;
}

export function SideMatrix({ matrix, onCellClick, onShowAll }: Props) {
  return (
    <aside className="side-matrix" aria-label="Матрица: типове документи x нива">
      <div className="matrix-header">
        <div className="lbl">{matrix.header_bg}</div>
      </div>
      <div className="matrix-grid" style={{ gridTemplateColumns: `1.6fr repeat(${matrix.levels.length}, 1fr)` }}>
        <div className="matrix-corner"></div>
        {matrix.levels.map((lvl) => (
          <div className="matrix-colhead" key={lvl.id} title={lvl.sub_bg}>
            <div className="matrix-col-num">{lvl.id.replace("H", "Н")}</div>
          </div>
        ))}
        {matrix.rows.map((row) => (
          <Row key={row.id} row={row} levels={matrix.levels.map(l => l.id)} onCellClick={onCellClick} />
        ))}
      </div>
      <button className="matrix-showall" onClick={onShowAll}>виж всички 21 типа документи →</button>
    </aside>
  );
}

function Row({ row, levels, onCellClick }: { row: MatrixRow; levels: string[]; onCellClick: (row: MatrixRow, levelId: LevelId) => void; }) {
  return (
    <>
      <div className="matrix-row-label">{row.label_bg}</div>
      {levels.map((lvlId) => {
        const state = (row.cells[lvlId] || "no") as CellState;
        return (
          <button
            key={lvlId}
            className="matrix-cell"
            style={{ color: cellColor[state] }}
            onClick={() => onCellClick(row, lvlId as LevelId)}
            aria-label={`${row.label_bg} на ${lvlId.replace("H","Н")}: ${state}`}
          >
            <span className="matrix-cell-symbol">{cellSymbol[state]}</span>
          </button>
        );
      })}
    </>
  );
}
