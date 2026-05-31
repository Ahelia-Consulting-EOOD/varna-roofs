import type { StatsData, SignalShort } from "../types";
import { signalColor, signalLabel } from "../lib/colors";
import "./UnlockSection.css";

interface Props { stats: StatsData; }

export function UnlockSection({ stats }: Props) {
  const order: SignalShort[] = ["g", "b", "y", "r", "k"];
  const total = stats.total_parcels_in_cadastre_forecast;

  // Phase 1: per-signal-class counts (Codex's heat_map_class).
  const p1: Record<SignalShort, number> = {
    g: stats.phase1.counts_by_signal.green || 0,
    b: stats.phase1.counts_by_signal.blue || 0,
    y: stats.phase1.counts_by_signal.amber || 0,
    r: stats.phase1.counts_by_signal.red || 0,
    k: stats.phase1.counts_by_signal.gray || 0,
  };
  // Phase 2: green+blue+amber+red parcels reach H3; gray parcels reach H1_clear.
  const p2_H3 = stats.phase2.counts_by_h.H3 || 0;
  const p2_H1 = stats.phase2.counts_by_h.H1_clear || 0;

  return (
    <section className="unlock-section">
      <div className="unlock-grid">
        <div className="unlock-tile">
          <div className="tile-kicker">Предварителен анализ · по публично достъпни източници</div>
          <div className="bars">
            {order.map((id) => (
              <Bar key={id} color={signalColor[id]} label={signalLabel[id]} count={p1[id]} total={total} />
            ))}
          </div>
        </div>
        <div className="unlock-tile">
          <div className="tile-kicker">Задълбочен анализ · с архивите на общината</div>
          <div className="bars">
            <Bar color="#3a6b8b" label="Н3 — обоснован извод (с потвърден действащ план)" count={p2_H3} total={total} />
            <Bar color="#5b8a5b" label="Н1 — допустимата височина е установена" count={p2_H1} total={total} />
          </div>
        </div>
      </div>

      <div className="unlock-head">
        <div className="lbl">Какво допринасяте вие</div>
        <h2 className="unlock-title">
          С достъп до вашия архив всеки от 79 115-те имота получава отговор:
          за {Math.round((p2_H3 / total) * 100)}% от града — обоснован извод (Н3) с потвърден действащ план;
          за останалите {Math.round((p2_H1 / total) * 100)}% — установена допустима височина (Н1) там, където публичните източници мълчат.
          Задълбоченият анализ затваря картата на Варна и я задълбочава за половината град.
        </h2>
      </div>

      <ul className="unlock-bullets">
        <li><strong>Действащ ПУП/РУП от вашия архив</strong> — позволява обоснован извод (Н3) за {p2_H3.toLocaleString("bg-BG")} имота, за които по публично достъпните източници е възможна само предварителна оценка.</li>
        <li><strong>Регистър на измененията</strong> — потвърждава, че намереният акт е именно в сила днес за съответния имот.</li>
        <li><strong>Виза, разрешение за строеж и одобрен инвестиционен проект</strong> — позволяват напълно документиран извод (Н4) за имотите, при които общината предприема последващи административни действия.</li>
        <li><strong>Удостоверения за търпимост и удостоверения за въвеждане в експлоатация (категория 4—5)</strong> — допълват документалната подкрепа при заварени и по-малки строежи.</li>
      </ul>
    </section>
  );
}

function Bar({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span className="bar-dot" style={{ background: color }} />
        <span>{label}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-num">{count.toLocaleString("bg-BG")}</div>
    </div>
  );
}
