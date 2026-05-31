import type { RequiredCorpusData, PublicationClass, LevelId } from "../types";
import { Modal } from "./Modal";
import { publicationLabel, levelColor } from "../lib/colors";

interface Props {
  data: RequiredCorpusData | null;
  open: boolean;
  onClose: () => void;
}

const pubColor: Record<PublicationClass, string> = {
  must_publish: "#5b8a5b",
  must_publish_act: "#7a9a5b",
  paid: "#b89a3a",
  partial: "#b8762e",
  restricted: "#8b3a3a",
};

export function FullCorpusModal({ data, open, onClose }: Props) {
  if (!data) return null;
  return (
    <Modal open={open} onClose={onClose} title={data.header_bg} width="lg">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--c-text-soft)" }}>
            <th style={th}>Тип документ</th>
            <th style={th}>Първо изисквано на</th>
            <th style={th}>Публичен статус</th>
          </tr>
        </thead>
        <tbody>
          {data.types.map((t, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--c-border)" }}>
              <td style={td}>{t.name_bg}</td>
              <td style={td}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: levelColor[t.first_at as LevelId] }} />
                  {t.first_at.replace("H", "Н")}
                </span>
              </td>
              <td style={td}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: pubColor[t.publication] }} />
                  {publicationLabel[t.publication]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

const th: React.CSSProperties = { padding: "10px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 8px", verticalAlign: "top" };
