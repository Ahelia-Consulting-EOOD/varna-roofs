import { useEffect, useState } from "react";
import "./components/shared.css";
import { useDashboardData, useParcelDetails } from "./lib/useDashboardData";
import type { Phase, CentroidProps, MatrixRow, LevelId } from "./types";
import { HeaderBar } from "./components/HeaderBar";
import { HeadlineBand } from "./components/HeadlineBand";
import { PhaseToggle } from "./components/PhaseToggle";
import { VarnaMap } from "./components/VarnaMap";
import { SideMatrix } from "./components/SideMatrix";
import { UnlockSection } from "./components/UnlockSection";
import { PricingPanel } from "./components/PricingPanel";
import { ParcelModal } from "./components/ParcelModal";
import { CellModal } from "./components/CellModal";
import { FullCorpusModal } from "./components/FullCorpusModal";
import { MethodologyDrawer } from "./components/MethodologyDrawer";

export default function App() {
  const { data, error } = useDashboardData();
  const details = useParcelDetails();
  const [phase, setPhase] = useState<Phase>("phase1");
  const [focusedParcel, setFocusedParcel] = useState<CentroidProps | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: MatrixRow; levelId: LevelId } | null>(null);
  const [showFullCorpus, setShowFullCorpus] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [firstLoadPhase, setFirstLoadPhase] = useState<Phase | null>("phase2");

  useEffect(() => {
    const t1 = setTimeout(() => setFirstLoadPhase("phase1"), 1100);
    const t2 = setTimeout(() => setFirstLoadPhase(null), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (error) return <div style={{ padding: 24 }}>Грешка при зареждане: {error}</div>;
  if (!data) return <div className="app-loading">Зарежда се…</div>;

  const focusedLevel = focusedCell ? (data.matrix.levels.find(l => l.id === focusedCell.levelId) ?? null) : null;
  const displayPhase: Phase = firstLoadPhase ?? phase;

  return (
    <div className="app-shell">
      <HeaderBar onMethodologyClick={() => setShowMethodology(true)} />
      <HeadlineBand
        tiles={[data.stats.headline.tile1, data.stats.headline.tile2, data.stats.headline.tile3, data.stats.headline.tile4]}
      />
      <main className="app-main">
        <div className="app-toggle-row">
          <PhaseToggle phase={firstLoadPhase ?? phase} onChange={(p) => { if (!firstLoadPhase) setPhase(p); }} />
        </div>
        <div className="app-grid">
          <div className="app-map">
            <VarnaMap
              centroids={data.centroids}
              sampleObjects={data.sampleObjects}
              phase={displayPhase}
              onParcelClick={setFocusedParcel}
            />
          </div>
          <div className="app-matrix">
            <SideMatrix
              matrix={data.matrix}
              onCellClick={(row, levelId) => setFocusedCell({ row, levelId })}
              onShowAll={() => setShowFullCorpus(true)}
            />
          </div>
        </div>
        <PricingPanel />
        <UnlockSection stats={data.stats} />
      </main>

      <ParcelModal
        parcel={focusedParcel}
        details={details}
        buildingsByParcel={data.buildingsByParcel}
        onClose={() => setFocusedParcel(null)}
      />
      <CellModal row={focusedCell?.row ?? null} levelId={focusedCell?.levelId ?? null} level={focusedLevel} onClose={() => setFocusedCell(null)} />
      <FullCorpusModal data={data.requiredCorpus} open={showFullCorpus} onClose={() => setShowFullCorpus(false)} />
      <MethodologyDrawer open={showMethodology} onClose={() => setShowMethodology(false)} />
    </div>
  );
}
