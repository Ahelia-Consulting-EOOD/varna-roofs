import type { HeadlineTile } from "../types";
import "./HeadlineBand.css";

interface Props {
  tiles: [HeadlineTile, HeadlineTile, HeadlineTile, HeadlineTile];
}

export function HeadlineBand({ tiles }: Props) {
  return (
    <div className="headline-band" role="region" aria-label="Ключови числа">
      {tiles.map((t, i) => (
        <div className="headline-tile" key={i}>
          <div className="headline-number">{t.number}</div>
          <div className="headline-label">{t.label_bg}</div>
        </div>
      ))}
    </div>
  );
}
