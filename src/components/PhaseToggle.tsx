import type { Phase } from "../types";
import "./PhaseToggle.css";

interface Props {
  phase: Phase;
  onChange: (p: Phase) => void;
}

export function PhaseToggle({ phase, onChange }: Props) {
  return (
    <div className="phase-toggle" role="tablist" aria-label="Избор на анализ">
      <button
        role="tab"
        aria-selected={phase === "phase1"}
        className={`phase-half ${phase === "phase1" ? "active" : ""}`}
        onClick={() => onChange("phase1")}
      >
        <span className="phase-num">ПРЕДВАРИТЕЛЕН АНАЛИЗ</span>
        <span className="phase-desc">По публично достъпни източници</span>
      </button>
      <button
        role="tab"
        aria-selected={phase === "phase2"}
        className={`phase-half ${phase === "phase2" ? "active" : ""}`}
        onClick={() => onChange("phase2")}
      >
        <span className="phase-num">ЗАДЪЛБОЧЕН АНАЛИЗ</span>
        <span className="phase-desc">С архивите на общината</span>
      </button>
    </div>
  );
}
